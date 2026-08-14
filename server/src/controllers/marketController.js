import fs from 'node:fs';
import path from 'node:path';
import MarketItem from '../models/MarketItem.js';
import { UPLOAD_DIR } from '../middleware/upload.js';

function removeImageFile(imagePath) {
  if (!imagePath) return;
  fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(imagePath))).catch(() => {});
}

/**
 * Create a listing. Expects multipart/form-data with an optional `image`.
 * POST /api/market
 */
export async function createItem(req, res) {
  const { title, description, price, category, condition, contact } = req.body;
  if (!title || !title.trim()) {
    if (req.file) removeImageFile(req.file.filename);
    return res.status(400).json({ message: 'A title is required.' });
  }
  const numPrice = Number(price);
  if (Number.isNaN(numPrice) || numPrice < 0) {
    if (req.file) removeImageFile(req.file.filename);
    return res.status(400).json({ message: 'A valid price is required.' });
  }

  const item = await MarketItem.create({
    title: title.trim(),
    description: description?.trim() || '',
    price: numPrice,
    category: category || 'other',
    condition: condition || 'good',
    contact: contact?.trim() || '',
    image: req.file ? `/uploads/${req.file.filename}` : '',
    seller: req.user._id,
  });

  await item.populate('seller', 'name branch semester');
  res.status(201).json({ item });
}

/**
 * Feed. Filters: ?category=&search=&status=&page=&limit=
 * GET /api/market
 */
export async function getItems(req, res) {
  const { category, search, status = 'available' } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    MarketItem.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('seller', 'name branch semester'),
    MarketItem.countDocuments(filter),
  ]);

  res.status(200).json({ items, page, totalPages: Math.ceil(total / limit), total });
}

/** GET /api/market/:id */
export async function getItemById(req, res) {
  const item = await MarketItem.findById(req.params.id).populate('seller', 'name branch semester');
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  res.status(200).json({ item });
}

/** PATCH /api/market/:id/status  body { status: 'available' | 'sold' } (owner) */
export async function updateStatus(req, res) {
  const { status } = req.body;
  if (!['available', 'sold'].includes(status)) {
    return res.status(400).json({ message: "Status must be 'available' or 'sold'." });
  }
  const item = await MarketItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  if (String(item.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the seller can update this listing.' });
  }
  item.status = status;
  await item.save();
  res.status(200).json({ item });
}

/** DELETE /api/market/:id (owner) */
export async function deleteItem(req, res) {
  const item = await MarketItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  if (String(item.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the seller can delete this listing.' });
  }
  removeImageFile(item.image);
  await item.deleteOne();
  res.status(200).json({ message: 'Listing deleted.' });
}

/** GET /api/market/me/listings */
export async function myListings(req, res) {
  const items = await MarketItem.find({ seller: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ items });
}
