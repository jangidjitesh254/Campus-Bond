import fs from 'node:fs';
import path from 'node:path';
import Club from '../models/Club.js';
import { UPLOAD_DIR } from '../middleware/upload.js';

function removeImageFile(imagePath) {
  if (!imagePath) return;
  fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(imagePath))).catch(() => {});
}

function isMember(club, userId) {
  return (club.members || []).some((m) => String(m._id || m) === String(userId));
}

/**
 * Create a club. Expects multipart/form-data with an optional `image` (logo).
 * The creator is automatically the first member.
 * POST /api/clubs
 */
export async function createClub(req, res) {
  const { name, description, category } = req.body;
  if (!name || !name.trim()) {
    if (req.file) removeImageFile(req.file.filename);
    return res.status(400).json({ message: 'A club name is required.' });
  }

  const club = await Club.create({
    name: name.trim(),
    description: description?.trim() || '',
    category: category || 'other',
    image: req.file ? `/uploads/${req.file.filename}` : '',
    createdBy: req.user._id,
    members: [req.user._id],
  });

  await club.populate('createdBy', 'name branch');
  res.status(201).json({ club: { ...club.toObject(), isMember: true, isAdmin: true } });
}

/**
 * All clubs. Filters: ?category=&search=. Adds isMember for the current user.
 * GET /api/clubs
 */
export async function getClubs(req, res) {
  const { category, search } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const clubs = await Club.find(filter).sort({ createdAt: -1 }).populate('createdBy', 'name branch');
  const result = clubs.map((c) => ({
    ...c.toObject(),
    isMember: isMember(c, req.user._id),
    isAdmin: String(c.createdBy?._id || c.createdBy) === String(req.user._id),
  }));
  res.status(200).json({ clubs: result });
}

/** GET /api/clubs/:id */
export async function getClubById(req, res) {
  const club = await Club.findById(req.params.id)
    .populate('createdBy', 'name branch')
    .populate('members', 'name branch semester');
  if (!club) return res.status(404).json({ message: 'Club not found.' });
  res.status(200).json({
    club: {
      ...club.toObject(),
      isMember: isMember(club, req.user._id),
      isAdmin: String(club.createdBy?._id || club.createdBy) === String(req.user._id),
    },
  });
}

/** POST /api/clubs/:id/join */
export async function joinClub(req, res) {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found.' });
  if (!isMember(club, req.user._id)) {
    club.members.push(req.user._id);
    await club.save();
  }
  res.status(200).json({ memberCount: club.members.length, isMember: true });
}

/** POST /api/clubs/:id/leave */
export async function leaveClub(req, res) {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found.' });
  club.members = club.members.filter((m) => String(m) !== String(req.user._id));
  await club.save();
  res.status(200).json({ memberCount: club.members.length, isMember: false });
}

/** DELETE /api/clubs/:id (creator only) */
export async function deleteClub(req, res) {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found.' });
  if (String(club.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the club admin can delete it.' });
  }
  removeImageFile(club.image);
  await club.deleteOne();
  res.status(200).json({ message: 'Club deleted.' });
}

/** GET /api/clubs/me/joined */
export async function myClubs(req, res) {
  const clubs = await Club.find({ members: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ clubs });
}
