import Event from '../models/Event.js';
import Resource from '../models/Resource.js';
import Club from '../models/Club.js';
import MarketItem from '../models/MarketItem.js';
import LostItem from '../models/LostItem.js';
import User from '../models/User.js';

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * One box, whole campus. Searches posts, study material, clubs, market
 * listings, lost & found and people in parallel.
 * GET /api/search?q=&limit=
 */
export async function search(req, res) {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(20, Number(req.query.limit) || 6);
  if (q.length < 2) {
    return res.status(200).json({ q, posts: [], resources: [], clubs: [], items: [], lost: [], people: [] });
  }

  const re = { $regex: escapeRegex(q), $options: 'i' };

  const [posts, resources, clubs, items, lost, people] = await Promise.all([
    Event.find({ $or: [{ title: re }, { description: re }, { skillsNeeded: re }, { category: re }] })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title description category status deadline createdAt createdBy applicants comments')
      .populate('createdBy', 'name branch avatar'),
    Resource.find({ $or: [{ title: re }, { subject: re }, { description: re }] })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title kind subject branch semester year file mime size downloads createdAt uploader')
      .populate('uploader', 'name branch avatar'),
    Club.find({ $or: [{ name: re }, { description: re }, { category: re }] })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name description category image members'),
    MarketItem.find({ status: 'available', $or: [{ title: re }, { description: re }, { category: re }] })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title price category condition image status createdAt seller')
      .populate('seller', 'name branch'),
    LostItem.find({ status: 'open', $or: [{ title: re }, { description: re }, { location: re }] })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title type category location image status createdAt createdBy')
      .populate('createdBy', 'name branch'),
    User.find({ isVerified: true, $or: [{ name: re }, { branch: re }, { skills: re }, { learning: re }] })
      .sort({ campusScore: -1 })
      .limit(limit)
      .select('name branch semester avatar skills campusScore'),
  ]);

  res.status(200).json({
    q,
    posts: posts.map((p) => ({
      ...p.toObject(),
      interestCount: (p.applicants || []).length,
      commentCount: (p.comments || []).length,
      applicants: undefined,
      comments: undefined,
    })),
    resources,
    clubs: clubs.map((c) => ({ ...c.toObject(), memberCount: (c.members || []).length, members: undefined })),
    items,
    lost,
    people,
  });
}
