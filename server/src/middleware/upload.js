import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { put, del } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * File storage has two modes:
 *  - Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production on Vercel —
 *    the function filesystem is ephemeral, so files can't live on disk).
 *  - Local disk under server/uploads (served at /uploads) for development.
 */
export const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!USE_BLOB) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function uniqueName(originalname) {
  const ext = path.extname(originalname).toLowerCase() || '.jpg';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

const storage = USE_BLOB
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
      filename: (_req, file, cb) => cb(null, uniqueName(file.originalname)),
    });

function fileFilter(_req, file, cb) {
  if (/^image\/(jpe?g|png|webp|heic|heif)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'));
  }
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

// Study material: PDFs and office docs as well as images. Past papers scanned
// on a phone are often 10 MB+, so the cap is more generous here.
const DOC_TYPES = [
  /^image\/(jpe?g|png|webp|heic|heif)$/,
  /^application\/pdf$/,
  /^application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
  /^application\/(vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation)$/,
  /^text\/plain$/,
];

function documentFilter(_req, file, cb) {
  if (DOC_TYPES.some((re) => re.test(file.mimetype))) cb(null, true);
  else cb(new Error('Only PDF, Word, PowerPoint, text or image files are allowed.'));
}

export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

/**
 * Persist an uploaded file (from `uploadImage.single(...)` or
 * `uploadDocument.single(...)`) and return the value to store on the
 * document: a full Blob URL, or a relative /uploads path.
 */
export async function storeFile(file) {
  if (!file) return '';
  if (USE_BLOB) {
    const blob = await put(`uploads/${uniqueName(file.originalname)}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
    });
    return blob.url;
  }
  return `/uploads/${file.filename}`;
}

export const storeImage = storeFile;

/** Best-effort delete of a stored file (Blob URL or /uploads path). */
export function deleteFile(stored) {
  if (!stored) return;
  if (/^https?:\/\//.test(stored)) {
    if (USE_BLOB) del(stored).catch(() => {});
    return;
  }
  fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(stored))).catch(() => {});
}

export const deleteImage = deleteFile;

/** Discard a file that was uploaded but never stored (validation failed). */
export function discardUpload(file) {
  if (file && file.filename) deleteFile(`/uploads/${file.filename}`);
}
