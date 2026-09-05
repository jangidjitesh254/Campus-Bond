import fs from 'node:fs';
import path from 'node:path';
import Resource from '../models/Resource.js';
import { UPLOAD_DIR } from '../middleware/upload.js';
import { award } from '../utils/score.js';

const KINDS = ['pyq', 'notes', 'slides', 'other'];

function removeFile(filePath) {
  if (!filePath) return;
  fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(filePath))).catch(() => {});
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Upload a past paper / notes. multipart/form-data with a required `file`.
 * POST /api/resources
 */
export async function createResource(req, res) {
  const { title, description, kind, subject, branch, semester, year } = req.body;
  const fail = (code, message) => {
    if (req.file) removeFile(req.file.filename);
    return res.status(code).json({ message });
  };

  if (!req.file) return fail(400, 'Attach the file you want to share.');
  if (!title || !title.trim()) return fail(400, 'A title is required.');
  if (!subject || !subject.trim()) return fail(400, 'Which subject is this for?');
  if (kind && !KINDS.includes(kind)) return fail(400, 'Unknown resource type.');

  const sem = semester === undefined || semester === '' ? undefined : Number(semester);
  if (sem !== undefined && (Number.isNaN(sem) || sem < 1 || sem > 12)) {
    return fail(400, 'Semester must be between 1 and 12.');
  }
  const yr = year === undefined || year === '' ? undefined : Number(year);
  if (yr !== undefined && (Number.isNaN(yr) || yr < 1990 || yr > 2100)) {
    return fail(400, 'That year does not look right.');
  }

  const resource = await Resource.create({
    title: title.trim(),
    description: description?.trim() || '',
    kind: kind || 'notes',
    subject: subject.trim(),
    branch: (branch || req.user.branch || '').trim(),
    semester: sem ?? req.user.semester,
    year: yr,
    file: `/uploads/${req.file.filename}`,
    mime: req.file.mimetype,
    size: req.file.size,
    originalName: req.file.originalname,
    uploader: req.user._id,
  });

  await award(req.user._id, 'resource_uploaded', resource._id, {
    refModel: 'Resource',
    note: resource.title,
  });

  await resource.populate('uploader', 'name branch semester avatar');
  res.status(201).json({ resource });
}

/**
 * Library. Filters: ?kind=&branch=&semester=&subject=&search=&page=&limit=
 * GET /api/resources
 */
export async function getResources(req, res) {
  const { kind, branch, semester, subject, search } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = {};
  if (kind && KINDS.includes(kind)) filter.kind = kind;
  if (branch) filter.branch = { $regex: `^${escapeRegex(branch)}$`, $options: 'i' };
  if (semester) filter.semester = Number(semester);
  if (subject) filter.subject = { $regex: escapeRegex(subject), $options: 'i' };
  if (search) {
    const re = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ title: re }, { subject: re }, { description: re }];
  }

  const [resources, total] = await Promise.all([
    Resource.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('uploader', 'name branch semester avatar'),
    Resource.countDocuments(filter),
  ]);

  res.status(200).json({ resources, page, totalPages: Math.ceil(total / limit), total });
}

/** GET /api/resources/:id */
export async function getResourceById(req, res) {
  const resource = await Resource.findById(req.params.id).populate('uploader', 'name branch semester avatar');
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  res.status(200).json({ resource });
}

/**
 * Count a download. The uploader earns a little each time a *new* person
 * uses what they shared; their own downloads and repeats do not count.
 * POST /api/resources/:id/download
 */
export async function recordDownload(req, res) {
  const resource = await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  if (String(resource.uploader) !== String(req.user._id)) {
    await award(resource.uploader, 'resource_used', resource._id, {
      refModel: 'Resource',
      note: resource.title,
      key: `resource_used:${resource._id}:${req.user._id}`,
    });
  }

  res.status(200).json({ downloads: resource.downloads, file: resource.file });
}

/** DELETE /api/resources/:id (uploader only) */
export async function deleteResource(req, res) {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  if (String(resource.uploader) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the uploader can delete this.' });
  }
  removeFile(resource.file);
  await resource.deleteOne();
  res.status(200).json({ message: 'Resource deleted.' });
}

/** GET /api/resources/me/uploads */
export async function myUploads(req, res) {
  const resources = await Resource.find({ uploader: req.user._id })
    .sort({ createdAt: -1 })
    .populate('uploader', 'name branch semester avatar');
  res.status(200).json({ resources });
}
