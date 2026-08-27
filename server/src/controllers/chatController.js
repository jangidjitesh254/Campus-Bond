import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Event from '../models/Event.js';
import MarketItem from '../models/MarketItem.js';

/** Has `userId` shown interest in `event` (any applicant status)? */
function hasShownInterest(event, userId) {
  return event.applicants.some((a) => String(a.user) === String(userId));
}

/** Find (or create) the 1:1 conversation between two users for an event. */
async function getOrCreateConversation(userA, userB, eventId) {
  let convo = await Conversation.findOne({
    participants: { $all: [userA, userB], $size: 2 },
    event: eventId || null,
  });
  if (!convo) {
    convo = await Conversation.create({ participants: [userA, userB], event: eventId || undefined });
  }
  return convo;
}

/**
 * Open (or create) a conversation. Only allowed once the poster has accepted
 * the other person's "I'm interested" request.
 * POST /api/chat/open   body: { eventId, userId }
 */
export async function openConversation(req, res) {
  const { eventId, userId } = req.body;
  if (!eventId || !userId) return res.status(400).json({ message: 'eventId and userId are required.' });

  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ message: 'Post not found.' });

  const me = String(req.user._id);
  const other = String(userId);
  const posterId = String(event.createdBy);

  // Allowed once interest has been shown: poster <-> interested student.
  const allowed =
    (me === posterId && hasShownInterest(event, other)) ||
    (other === posterId && hasShownInterest(event, me));

  if (!allowed) {
    return res.status(403).json({ message: 'Show interest in the post first to start a chat.' });
  }

  const convo = await getOrCreateConversation(me, other, eventId);
  await convo.populate('participants', 'name branch semester');
  res.status(200).json({ conversation: convo });
}

/**
 * Open (or fetch) the conversation for an accepted marketplace interest.
 * POST /api/chat/open-market   body: { itemId, userId }
 */
export async function openMarketConversation(req, res) {
  const { itemId, userId } = req.body;
  if (!itemId || !userId) return res.status(400).json({ message: 'itemId and userId are required.' });

  const item = await MarketItem.findById(itemId);
  if (!item) return res.status(404).json({ message: 'Listing not found.' });

  const me = String(req.user._id);
  const other = String(userId);
  const sellerId = String(item.seller);
  const isAccepted = (uid) => item.interested.some((i) => String(i.user) === String(uid) && i.status === 'accepted');

  const allowed = (me === sellerId && isAccepted(other)) || (other === sellerId && isAccepted(me));
  if (!allowed) {
    return res.status(403).json({ message: 'You can chat once the seller accepts the interest.' });
  }

  let convo = await Conversation.findOne({ participants: { $all: [me, other], $size: 2 }, market: item._id });
  if (!convo) convo = await Conversation.create({ participants: [me, other], market: item._id });
  await convo.populate('participants', 'name branch semester');
  await convo.populate('market', 'title price');
  res.status(200).json({ conversation: convo });
}

/**
 * My conversations, most recent first.
 * GET /api/chat/conversations
 */
export async function getConversations(req, res) {
  const convos = await Conversation.find({ participants: req.user._id })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'name branch semester')
    .populate('event', 'title')
    .populate('market', 'title price');
  res.status(200).json({ conversations: convos });
}

/** Ensure the current user belongs to the conversation. */
async function loadMyConversation(convoId, userId) {
  const convo = await Conversation.findById(convoId);
  if (!convo) return { error: 404 };
  if (!convo.participants.some((p) => String(p) === String(userId))) return { error: 403 };
  return { convo };
}

/**
 * Messages in a conversation (oldest first).
 * GET /api/chat/conversations/:id/messages
 */
export async function getMessages(req, res) {
  const { convo, error } = await loadMyConversation(req.params.id, req.user._id);
  if (error === 404) return res.status(404).json({ message: 'Conversation not found.' });
  if (error === 403) return res.status(403).json({ message: 'Not your conversation.' });

  const messages = await Message.find({ conversation: convo._id })
    .sort({ createdAt: 1 })
    .populate('sender', 'name');
  res.status(200).json({ messages });
}

/**
 * Send a message.
 * POST /api/chat/conversations/:id/messages   body: { text }
 */
export async function sendMessage(req, res) {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ message: 'Message cannot be empty.' });

  const { convo, error } = await loadMyConversation(req.params.id, req.user._id);
  if (error === 404) return res.status(404).json({ message: 'Conversation not found.' });
  if (error === 403) return res.status(403).json({ message: 'Not your conversation.' });

  const message = await Message.create({ conversation: convo._id, sender: req.user._id, text });
  convo.lastMessage = text;
  convo.lastMessageAt = new Date();
  await convo.save();

  await message.populate('sender', 'name');
  res.status(201).json({ message });
}
