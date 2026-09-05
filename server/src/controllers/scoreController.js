import User from '../models/User.js';
import { summary, POINTS, LABELS } from '../utils/score.js';

/** GET /api/score/me — my total, rank, breakdown and recent ledger. */
export async function myScore(req, res) {
  const data = await summary(req.user._id);
  res.status(200).json(data);
}

/** GET /api/score/user/:id — someone else's score, for their profile. */
export async function userScore(req, res) {
  const data = await summary(req.params.id);
  if (!data) return res.status(404).json({ message: 'User not found.' });
  res.status(200).json(data);
}

/** GET /api/score/leaderboard?limit=20 */
export async function leaderboard(req, res) {
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const users = await User.find({ campusScore: { $gt: 0 } })
    .sort({ campusScore: -1, createdAt: 1 })
    .limit(limit)
    .select('name branch semester avatar campusScore');

  const me = req.user;
  const ahead = await User.countDocuments({ campusScore: { $gt: me.campusScore } });

  res.status(200).json({
    leaders: users.map((u, i) => ({ rank: i + 1, ...u.toObject() })),
    me: { rank: ahead + 1, total: me.campusScore },
  });
}

/** GET /api/score/rules — how points are earned, for the explainer screen. */
export function rules(_req, res) {
  res.status(200).json({
    rules: Object.keys(POINTS).map((action) => ({ action, label: LABELS[action], points: POINTS[action] })),
  });
}
