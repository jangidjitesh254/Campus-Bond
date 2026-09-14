import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { put, del } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Image storage has two modes:
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

/**
 * Persist an uploaded file (from `uploadImage.single('image')`) and return the
 * value to store on the document: a full Blob URL, or a relative /uploads path.
 */
export async function storeImage(file) {
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

/** Best-effort delete of a stored image (Blob URL or /uploads path). */
export function deleteImage(stored) {
  if (!stored) return;
  if (/^https?:\/\//.test(stored)) {
    if (USE_BLOB) del(stored).catch(() => {});
    return;
  }
  fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(stored))).catch(() => {});
}

/** Discard a file that was uploaded but never stored (validation failed). */
export function discardUpload(file) {
  if (file && file.filename) deleteImage(`/uploads/${file.filename}`);
}
