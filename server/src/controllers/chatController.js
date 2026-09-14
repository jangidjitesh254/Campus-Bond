import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

/** Has `userId` shown interest in `event` (any applicant status)? */
function hasShownInterest(event, userId) {
  return (event.applicants || []).some((a) => String(a.user) === String(userId));
}

/**
 * Get all campus students for directory and starting new chats.
 * GET /api/chat/users?search=...
 */
export async function getCampusStudents(req, res) {
  try {
    const search = (req.query.search || '').trim();
    const query = { _id: { $ne: req.user._id } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { branch: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(query)
      .select('name email branch semester avatar campusScore isVerified role skills bio interests githubUrl')
      .sort({ name: 1 })
      .limit(60);

    res.status(200).json({ students });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch campus students' });
  }
}

/**
 * Open (or request) a conversation.
 * Sends a chat request if one doesn't already exist.
 * POST /api/chat/open   body: { eventId, userId, participantId, message }
 */
export async function openConversation(req, res) {
  const targetUserId = req.body.userId || req.body.participantId;
  const { eventId, message } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ message: 'A target user is required to start a chat.' });
  }

  const me = String(req.user._id);
  const other = String(targetUserId);

  if (me === other) {
    return res.status(400).json({ message: 'You cannot start a chat with yourself.' });
  }

  let event = null;
  if (eventId) {
    event = await Event.findById(eventId);
  }

  // Look for existing conversation between userA and userB
  let convo = await Conversation.findOne({
    participants: { $all: [me, other], $size: 2 },
    ...(eventId ? { event: eventId } : {}),
  });

  if (!convo) {
    // If not found with event, check without event filter to avoid duplicate 1-on-1 threads
    convo = await Conversation.findOne({
      participants: { $all: [me, other], $size: 2 },
    });
  }

  if (!convo) {
    // Create new conversation in pending status (Request Sent)
    convo = await Conversation.create({
      participants: [me, other],
      event: eventId || undefined,
      status: 'pending',
      requestedBy: req.user._id,
      requestMessage: (message || '').trim() || `Hi! I would like to connect on Campus Bond.`,
      lastMessage: (message || '').trim() || 'Chat request sent',
      lastMessageAt: new Date(),
    });
  } else if (convo.status === 'declined') {
    // If previously declined, re-open as pending request
    convo.status = 'pending';
    convo.requestedBy = req.user._id;
    if (message) {
      convo.requestMessage = message.trim();
      convo.lastMessage = message.trim();
      convo.lastMessageAt = new Date();
    }
    await convo.save();
  }

  await convo.populate('participants', 'name branch semester avatar isVerified');
  if (convo.event) {
    await convo.populate('event', 'title');
  }
  await convo.populate('requestedBy', 'name');

  res.status(200).json({ conversation: convo });
}

/**
 * Respond to a pending chat request (Accept or Decline).
 * PATCH /api/chat/conversations/:id/respond   body: { action: 'accept' | 'decline' }
 */
export async function respondToChatRequest(req, res) {
  const { action } = req.body;
  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ message: "Action must be 'accept' or 'decline'." });
  }

  const { convo, error } = await loadMyConversation(req.params.id, req.user._id);
  if (error === 404) return res.status(404).json({ message: 'Conversation not found.' });
  if (error === 403) return res.status(403).json({ message: 'Not your conversation.' });

  if (action === 'accept') {
    convo.status = 'accepted';
  } else {
    convo.status = 'declined';
  }
  await convo.save();

  await convo.populate('participants', 'name branch semester avatar isVerified');
  if (convo.event) {
    await convo.populate('event', 'title');
  }
  await convo.populate('requestedBy', 'name');

  res.status(200).json({ conversation: convo });
}

/**
 * My conversations, most recent first.
 * GET /api/chat/conversations
 */
export async function getConversations(req, res) {
  try {
    const convos = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name branch semester avatar isVerified')
      .populate('event', 'title')
      .populate('requestedBy', 'name');

    res.status(200).json({ conversations: convos || [] });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch conversations' });
  }
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
  try {
    const { convo, error } = await loadMyConversation(req.params.id, req.user._id);
    if (error === 404) return res.status(404).json({ message: 'Conversation not found.' });
    if (error === 403) return res.status(403).json({ message: 'Not your conversation.' });

    await convo.populate('participants', 'name branch semester avatar isVerified');
    if (convo.event) {
      await convo.populate('event', 'title');
    }
    await convo.populate('requestedBy', 'name');

    const messages = await Message.find({ conversation: convo._id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name');

    res.status(200).json({ messages, conversation: convo });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch messages' });
  }
}

/**
 * Send a message.
 * POST /api/chat/conversations/:id/messages   body: { text }
 */
export async function sendMessage(req, res) {
  try {
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Message cannot be empty.' });

    const { convo, error } = await loadMyConversation(req.params.id, req.user._id);
    if (error === 404) return res.status(404).json({ message: 'Conversation not found.' });
    if (error === 403) return res.status(403).json({ message: 'Not your conversation.' });

    if (convo.status === 'pending') {
      return res.status(400).json({ message: 'Chat request has not been accepted yet.' });
    }

    const message = await Message.create({ conversation: convo._id, sender: req.user._id, text });
    convo.lastMessage = text;
    convo.lastMessageAt = new Date();
    await convo.save();

    await message.populate('sender', 'name');
    res.status(201).json({ message, conversation: convo });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to send message' });
  }
}
