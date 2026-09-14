import Announcement from '../models/Announcement.js';

/**
 * Live announcements for the Home banner: started, not expired, pinned
 * first, newest first. Capped so the carousel never gets unwieldy.
 * GET /api/announcements
 */
export async function getAnnouncements(req, res) {
  const now = new Date();
  const items = await Announcement.find({
    startsAt: { $lte: now },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ pinned: -1, startsAt: -1 })
    .limit(8)
    .select('-createdBy');
  res.status(200).json({ announcements: items });
}

/**
 * Post an announcement. Any verified student can for now — there is no
 * admin role yet — so the shape is validated tightly.
 * POST /api/announcements
 */
export async function createAnnouncement(req, res) {
  const { title, body, tag, tone, link, cta, pinned, startsAt, expiresAt } = req.body;
  if (!title || !String(title).trim()) return res.status(400).json({ message: 'A title is required.' });
  const item = await Announcement.create({
    title: String(title).trim(),
    body: body ? String(body).trim() : '',
    tag: tag ? String(tag).trim() : undefined,
    tone,
    link: link ? String(link).trim() : '',
    cta: cta ? String(cta).trim() : '',
    pinned: !!pinned,
    startsAt: startsAt || undefined,
    expiresAt: expiresAt || null,
    createdBy: req.user._id,
  });
  res.status(201).json({ announcement: item });
}

/** DELETE /api/announcements/:id (author only) */
export async function deleteAnnouncement(req, res) {
  const item = await Announcement.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Announcement not found.' });
  if (String(item.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the author can remove this announcement.' });
  }
  await item.deleteOne();
  res.status(200).json({ message: 'Announcement removed.' });
}
