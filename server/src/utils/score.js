import mongoose from 'mongoose';
import ScoreEvent from '../models/ScoreEvent.js';
import User from '../models/User.js';

/**
 * Campus Score — what every action on the platform is worth.
 *
 * The weights favour things that help someone else (a shared paper, a
 * resolved lost item, an accepted teammate) over things that only benefit
 * you. Contest actions are defined now so the contests feature can award
 * them without touching this file.
 */
export const POINTS = {
  post_created: 5, // shared something the campus can act on
  comment_posted: 2,
  team_joined: 10, // your request was accepted — you're on a team
  request_reviewed: 3, // you actively reviewed someone who applied to you
  resource_uploaded: 15, // a past paper or notes, the most reusable thing here
  resource_used: 2, // someone else downloaded what you shared
  club_created: 10,
  club_joined: 5,
  lost_reported: 3,
  lost_resolved: 8, // an item found its way home
  listing_created: 3,
  item_sold: 5,
  contest_participation: 20,
  contest_won: 50,
};

export const LABELS = {
  post_created: 'Posted to the campus',
  comment_posted: 'Replied on a post',
  team_joined: 'Joined a team',
  request_reviewed: 'Reviewed a request',
  resource_uploaded: 'Shared study material',
  resource_used: 'Your material was downloaded',
  club_created: 'Started a club',
  club_joined: 'Joined a club',
  lost_reported: 'Reported a lost or found item',
  lost_resolved: 'Reunited an item with its owner',
  listing_created: 'Listed an item',
  item_sold: 'Sold an item',
  contest_participation: 'Took part in a contest',
  contest_won: 'Won a contest',
};

/**
 * Award points to a user for an action on a thing.
 *
 * Idempotent: (user, key) is unique, so calling this twice for the same event
 * is harmless. Never throws into the request that called it — a scoring
 * hiccup must not break posting, approving or uploading.
 *
 * @param {object} [opts]
 * @param {string} [opts.refModel]  'Event' | 'Resource' | ...
 * @param {string} [opts.note]      shown in the ledger, e.g. the post title
 * @param {string} [opts.key]       override the dedupe key (default action:ref)
 * @returns {Promise<number>} points awarded, or 0 if nothing new was recorded
 */
export async function award(userId, action, ref = null, opts = {}) {
  const points = POINTS[action];
  if (!points || !userId) return 0;

  const refId = ref ? new mongoose.Types.ObjectId(String(ref)) : undefined;
  const key = opts.key || `${action}:${refId || ''}`;

  try {
    await ScoreEvent.create({
      user: userId,
      action,
      points,
      ref: refId,
      refModel: opts.refModel || '',
      note: opts.note || '',
      key,
    });
  } catch (err) {
    if (err.code === 11000) return 0; // already counted
    console.error('score: could not record', action, err.message);
    return 0;
  }

  try {
    await User.updateOne({ _id: userId }, { $inc: { campusScore: points } });
  } catch (err) {
    console.error('score: could not increment', err.message);
  }
  return points;
}

/** A user's score, how it breaks down, and where they stand on campus. */
export async function summary(userId) {
  const [user, events] = await Promise.all([
    User.findById(userId).select('campusScore name branch avatar'),
    ScoreEvent.find({ user: userId }).sort({ createdAt: -1 }).limit(300),
  ]);
  if (!user) return null;

  const byAction = {};
  for (const e of events) {
    const row = (byAction[e.action] ||= {
      action: e.action,
      label: LABELS[e.action] || e.action,
      count: 0,
      points: 0,
    });
    row.count += 1;
    row.points += e.points;
  }
  const breakdown = Object.values(byAction).sort((a, b) => b.points - a.points);

  // Rank = 1 + number of students strictly ahead.
  const [ahead, students] = await Promise.all([
    User.countDocuments({ campusScore: { $gt: user.campusScore } }),
    User.countDocuments({}),
  ]);

  return {
    user: { _id: user._id, name: user.name, branch: user.branch, avatar: user.avatar },
    total: user.campusScore,
    rank: ahead + 1,
    students,
    breakdown,
    recent: events.slice(0, 25).map((e) => ({
      _id: e._id,
      action: e.action,
      label: LABELS[e.action] || e.action,
      points: e.points,
      note: e.note,
      at: e.createdAt,
    })),
  };
}
