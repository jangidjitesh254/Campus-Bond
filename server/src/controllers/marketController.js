import fs from 'node:fs';
import path from 'node:path';
import MarketItem from '../models/MarketItem.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { UPLOAD_DIR } from '../middleware/upload.js';
import { award } from '../utils/score.js';

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

  await award(req.user._id, 'listing_created', item._id, { refModel: 'MarketItem', note: item.title });

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

  res.status(200).json({ items: items.map((i) => decorate(i, req.user._id)), page, totalPages: Math.ceil(total / limit), total });
}

/** Shape an item for the client with the current user's like/interest state. */
function decorate(item, userId) {
  const obj = item.toObject ? item.toObject() : item;
  const likes = obj.likes || [];
  const mine = (obj.interested || []).find((i) => String(i.user?._id || i.user) === String(userId));
  return {
    ...obj,
    likeCount: likes.length,
    isLiked: likes.some((l) => String(l._id || l) === String(userId)),
    interestCount: (obj.interested || []).length,
    myInterest: mine ? mine.status : null,
    likes: undefined,
  };
}

/** GET /api/market/:id */
export async function getItemById(req, res) {
  const item = await MarketItem.findById(req.params.id)
    .populate('seller', 'name branch semester')
    .populate('interested.user', 'name branch semester');
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  res.status(200).json({ item: decorate(item, req.user._id) });
}

/**
 * Buyer shows interest in a listing (pending until the seller accepts).
 * POST /api/market/:id/interest
 */
export async function expressInterest(req, res) {
  const item = await MarketItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  if (String(item.seller) === String(req.user._id)) {
    return res.status(400).json({ message: "You can't buy your own listing." });
  }
  const already = item.interested.some((i) => String(i.user) === String(req.user._id));
  if (!already) {
    item.interested.push({ user: req.user._id, message: req.body.message?.trim() || '' });
    await item.save();
  }
  res.status(200).json({ message: 'Interest sent. The seller will review it.', alreadyInterested: already });
}

/**
 * Seller accepts / rejects a buyer's interest. On accept, a chat is opened.
 * PATCH /api/market/:id/interest/:userId   body { status: 'accepted' | 'rejected' }
 */
export async function reviewInterest(req, res) {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Status must be 'accepted' or 'rejected'." });
  }
  const item = await MarketItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  if (String(item.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the seller can review interest.' });
  }
  const entry = item.interested.find((i) => String(i.user) === String(req.params.userId));
  if (!entry) return res.status(404).json({ message: 'Buyer not found.' });
  entry.status = status;
  await item.save();

  let conversation = null;
  if (status === 'accepted') {
    conversation = await Conversation.findOne({
      participants: { $all: [item.seller, entry.user], $size: 2 },
      market: item._id,
    });
    if (!conversation) {
      conversation = await Conversation.create({ participants: [item.seller, entry.user], market: item._id });
      const text = `✅ Accepted your interest in "${item.title}" (₹${item.price}). Let's talk!`;
      await Message.create({ conversation: conversation._id, sender: item.seller, text });
      conversation.lastMessage = text;
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }
  }

  await item.populate('interested.user', 'name branch semester');
  res.status(200).json({ item: decorate(item, req.user._id), conversationId: conversation?._id || null });
}

/**
 * Toggle a like on a listing.
 * POST /api/market/:id/like
 */
export async function toggleLike(req, res) {
  const item = await MarketItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  const idx = item.likes.findIndex((l) => String(l) === String(req.user._id));
  if (idx >= 0) item.likes.splice(idx, 1);
  else item.likes.push(req.user._id);
  await item.save();
  res.status(200).json({ likeCount: item.likes.length, isLiked: idx < 0 });
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
  if (status === 'sold') {
    await award(req.user._id, 'item_sold', item._id, { refModel: 'MarketItem', note: item.title });
  }
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

/**
 * Listings the current user has asked to buy — their order history.
 * GET /api/market/me/orders
 */
export async function myOrders(req, res) {
  const items = await MarketItem.find({ 'interested.user': req.user._id })
    .sort({ updatedAt: -1 })
    .populate('seller', 'name branch semester');
  res.status(200).json({ items: items.map((i) => decorate(i, req.user._id)) });
}

/** GET /api/market/me/listings */
export async function myListings(req, res) {
  const items = await MarketItem.find({ seller: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ items });
}
