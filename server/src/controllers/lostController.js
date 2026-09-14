import LostItem from '../models/LostItem.js';
import { storeImage, deleteImage, discardUpload } from '../middleware/upload.js';
import { award } from '../utils/score.js';


/** Shape an item for the client with the current user's interest state. */
function decorate(item, userId) {
  const obj = item.toObject ? item.toObject() : item;
  const list = obj.interested || [];
  return {
    ...obj,
    interestCount: list.length,
    isInterested: list.some((u) => String(u._id || u) === String(userId)),
    interested: undefined,
  };
}

/**
 * Create a lost/found post. Expects multipart/form-data with an optional `image`.
 * POST /api/lostfound
 */
export async function createLostItem(req, res) {
  const { type, title, description, category, location, contact } = req.body;

  if (!['lost', 'found'].includes(type)) {
    discardUpload(req.file);
    return res.status(400).json({ message: "Type must be 'lost' or 'found'." });
  }
  if (!title || !title.trim()) {
    discardUpload(req.file);
    return res.status(400).json({ message: 'A title is required.' });
  }

  const item = await LostItem.create({
    type,
    title: title.trim(),
    description: description?.trim() || '',
    category: category || 'other',
    location: location?.trim() || '',
    contact: contact?.trim() || '',
    image: await storeImage(req.file),
    createdBy: req.user._id,
  });

  await award(req.user._id, 'lost_reported', item._id, { refModel: 'LostItem', note: item.title });

  await item.populate('createdBy', 'name branch semester');
  res.status(201).json({ item: decorate(item, req.user._id) });
}

/**
 * Feed. Filters: ?type=lost|found &category= &search= &status= &page= &limit=
 * GET /api/lostfound
 */
export async function getLostItems(req, res) {
  const { type, category, search, status = 'open' } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = {};
  if (status) filter.status = status;
  if (type && ['lost', 'found'].includes(type)) filter.type = type;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    LostItem.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name branch semester'),
    LostItem.countDocuments(filter),
  ]);

  res.status(200).json({
    items: items.map((i) => decorate(i, req.user._id)),
    page,
    totalPages: Math.ceil(total / limit),
    total,
  });
}

/**
 * Single item.
 * GET /api/lostfound/:id
 */
export async function getLostItemById(req, res) {
  const item = await LostItem.findById(req.params.id).populate('createdBy', 'name branch semester');
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  res.status(200).json({ item: decorate(item, req.user._id) });
}

/**
 * Mark resolved / reopen (owner only).
 * PATCH /api/lostfound/:id/status   body: { status: 'open' | 'resolved' }
 */
export async function updateLostStatus(req, res) {
  const { status } = req.body;
  if (!['open', 'resolved'].includes(status)) {
    return res.status(400).json({ message: "Status must be 'open' or 'resolved'." });
  }
  const item = await LostItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  if (String(item.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the poster can update this item.' });
  }
  item.status = status;
  await item.save();
  if (status === 'resolved') {
    await award(req.user._id, 'lost_resolved', item._id, { refModel: 'LostItem', note: item.title });
  }
  res.status(200).json({ item });
}

/**
 * Edit a lost/found post (owner only). Accepts multipart/form-data so the photo
 * can be swapped; the old file is removed when a new one arrives.
 * PATCH /api/lostfound/:id
 */
export async function updateLostItem(req, res) {
  const item = await LostItem.findById(req.params.id);
  if (!item) {
    discardUpload(req.file);
    return res.status(404).json({ message: 'Item not found.' });
  }
  if (String(item.createdBy) !== String(req.user._id)) {
    discardUpload(req.file);
    return res.status(403).json({ message: 'Only the poster can edit this item.' });
  }

  const { type, title, description, category, location, contact } = req.body;

  if (type !== undefined) {
    if (!['lost', 'found'].includes(type)) {
      discardUpload(req.file);
      return res.status(400).json({ message: "Type must be 'lost' or 'found'." });
    }
    item.type = type;
  }
  if (title !== undefined) {
    if (!String(title).trim()) {
      discardUpload(req.file);
      return res.status(400).json({ message: 'A title is required.' });
    }
    item.title = String(title).trim();
  }
  if (description !== undefined) item.description = String(description).trim();
  if (category !== undefined) item.category = category;
  if (location !== undefined) item.location = String(location).trim();
  if (contact !== undefined) item.contact = String(contact).trim();

  if (req.file) {
    deleteImage(item.image); // drop the photo it replaces
    item.image = await storeImage(req.file);
  }

  await item.save();
  await item.populate('createdBy', 'name branch semester');
  res.status(200).json({ item });
}

/**
 * Toggle interest in a lost/found item. Tapping again withdraws it.
 * POST /api/lostfound/:id/interest
 */
export async function toggleLostInterest(req, res) {
  const item = await LostItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  if (String(item.createdBy) === String(req.user._id)) {
    return res.status(400).json({ message: "You can't show interest in your own item." });
  }

  const idx = (item.interested || []).findIndex((u) => String(u) === String(req.user._id));
  if (idx >= 0) item.interested.splice(idx, 1);
  else item.interested.push(req.user._id);
  await item.save();

  res.status(200).json({ isInterested: idx < 0, interestCount: item.interested.length });
}

/**
 * Delete (owner only). Also removes the uploaded image.
 * DELETE /api/lostfound/:id
 */
export async function deleteLostItem(req, res) {
  const item = await LostItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  if (String(item.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the poster can delete this item.' });
  }
  deleteImage(item.image);
  await item.deleteOne();
  res.status(200).json({ message: 'Item deleted.' });
}

/**
 * Items posted by the current user.
 * GET /api/lostfound/me/posts
 */
export async function myLostItems(req, res) {
  const items = await LostItem.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ items: items.map((i) => decorate(i, req.user._id)) });
}
