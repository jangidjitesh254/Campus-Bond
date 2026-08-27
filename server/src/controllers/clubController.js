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

/** The status of the current user own request on this club, if any. */
function myRequestStatus(club, userId) {
  const mine = (club.requests || []).find((r) => String(r.user?._id || r.user) === String(userId));
  return mine ? mine.status : null;
}

/** Shape a club for the client. Requests are only exposed to the president. */
function decorate(club, userId) {
  const obj = club.toObject ? club.toObject() : club;
  const isAdmin = String(obj.createdBy?._id || obj.createdBy) === String(userId);
  return {
    ...obj,
    isMember: isMember(obj, userId),
    isAdmin,
    myRequest: myRequestStatus(obj, userId),
    pendingCount: isAdmin ? (obj.requests || []).filter((r) => r.status === 'pending').length : 0,
    requests: isAdmin ? obj.requests : undefined,
  };
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
  res.status(201).json({ club: decorate(club, req.user._id) });
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
  res.status(200).json({ clubs: clubs.map((c) => decorate(c, req.user._id)) });
}

/** GET /api/clubs/:id */
export async function getClubById(req, res) {
  const club = await Club.findById(req.params.id)
    .populate('createdBy', 'name branch')
    .populate('members', 'name branch semester')
    .populate('requests.user', 'name branch semester');
  if (!club) return res.status(404).json({ message: 'Club not found.' });
  res.status(200).json({ club: decorate(club, req.user._id) });
}

/**
 * Apply to join. The president reviews it — this never adds a member directly.
 * POST /api/clubs/:id/request   body: { why, skills, branch, semester, consent }
 */
export async function requestJoin(req, res) {
  const { why, skills, branch, semester, consent } = req.body;

  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found.' });
  if (isMember(club, req.user._id)) {
    return res.status(400).json({ message: 'You are already a member of this club.' });
  }
  if (!consent) {
    return res.status(400).json({ message: 'Please confirm the consent before applying.' });
  }
  if (!why || !String(why).trim()) {
    return res.status(400).json({ message: 'Tell the club why you want to join.' });
  }

  const existing = (club.requests || []).find((r) => String(r.user) === String(req.user._id));
  if (existing && existing.status === 'pending') {
    return res.status(409).json({ message: 'Your request is already waiting for review.' });
  }

  const entry = {
    user: req.user._id,
    why: String(why).trim(),
    skills: (skills || '').trim(),
    branch: (branch || req.user.branch || '').trim(),
    semester: semester || req.user.semester,
    consent: true,
    status: 'pending',
  };
  if (existing) Object.assign(existing, entry);
  else club.requests.push(entry);
  await club.save();

  res.status(201).json({ message: 'Request sent to the club president.', myRequest: 'pending' });
}

/**
 * President approves / rejects an application. Approving adds the member.
 * PATCH /api/clubs/:id/requests/:userId   body: { status: 'approved' | 'rejected' }
 */
export async function reviewRequest(req, res) {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Status must be 'approved' or 'rejected'." });
  }

  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found.' });
  if (String(club.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the club president can review requests.' });
  }

  const entry = (club.requests || []).find((r) => String(r.user) === String(req.params.userId));
  if (!entry) return res.status(404).json({ message: 'Request not found.' });

  entry.status = status;
  if (status === 'approved' && !isMember(club, entry.user)) club.members.push(entry.user);
  await club.save();

  await club.populate('createdBy', 'name branch');
  await club.populate('members', 'name branch semester');
  await club.populate('requests.user', 'name branch semester');
  res.status(200).json({ club: decorate(club, req.user._id) });
}

/** POST /api/clubs/:id/leave */
export async function leaveClub(req, res) {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found.' });
  club.members = club.members.filter((m) => String(m) !== String(req.user._id));
  // leaving clears the old application too, so they can apply again later
  club.requests = (club.requests || []).filter((r) => String(r.user) !== String(req.user._id));
  await club.save();
  res.status(200).json({ memberCount: club.members.length, isMember: false, myRequest: null });
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
