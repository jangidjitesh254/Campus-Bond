import Notification from '../models/Notification.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

/**
 * Reusable helper to safely create a notification from any controller/service.
 */
export async function createNotification({
  recipient,
  sender = null,
  type = 'system',
  title,
  message,
  link = '/',
}) {
  try {
    if (!recipient) return null;
    // Don't notify oneself if sender is recipient
    if (sender && String(recipient) === String(sender)) return null;

    return await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      isRead: false,
    });
  } catch (err) {
    console.error('⚠️ [Notification Helper] Error creating notification:', err.message);
    return null;
  }
}

/**
 * Seed realistic starter notifications for a user if they have 0 notifications.
 */
async function seedDefaultNotificationsForUser(user) {
  try {
    const existingCount = await Notification.countDocuments({ recipient: user._id });
    if (existingCount > 0) return;

    // Check if an event exists in the system to link to
    const sampleEvent = await Event.findOne({ status: 'open' }).select('_id title');
    const eventLink = sampleEvent ? `/events/${sampleEvent._id}` : '/';

    const starterNotifications = [
      {
        recipient: user._id,
        type: 'system',
        title: `Welcome to Campus Bond, ${user.name || 'Student'}! 👋`,
        message: 'Your campus hub is ready. Explore events, join clubs, find teammates, and stay updated.',
        link: '/',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      },
      {
        recipient: user._id,
        type: 'event',
        title: 'Smart India Hackathon 2026 Alert 🚀',
        message: 'Aarav Sharma added details for frontend & ML developer roles in SIH 2026.',
        link: eventLink,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
      },
      {
        recipient: user._id,
        type: 'lostfound',
        title: 'Lost & Found Alert 🔍',
        message: 'Blue HP Laptop Bag with student ID reported found near Central Library.',
        link: '/lostfound',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        recipient: user._id,
        type: 'market',
        title: 'Campus Marketplace 🛍️',
        message: 'Semester textbooks (Algorithms & DBMS) and drafter listed at 50% discount.',
        link: '/market',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      },
      {
        recipient: user._id,
        type: 'club',
        title: 'Google DSC Meetup Announced 🎯',
        message: 'Campus Hacknight registrations are live. Join the Coding Club to participate.',
        link: '/clubs',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
    ];

    await Notification.insertMany(starterNotifications);
  } catch (err) {
    console.error('⚠️ [Notification Helper] Failed to seed default notifications:', err.message);
  }
}

/**
 * Get all notifications for the authenticated user.
 * GET /api/notifications
 */
export async function getNotifications(req, res) {
  try {
    const userId = req.user._id;

    // Seed defaults if empty
    await seedDefaultNotificationsForUser(req.user);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('sender', 'name avatar branch'),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch notifications' });
  }
}

/**
 * Mark a single notification as read.
 * PATCH /api/notifications/:id/read
 */
export async function markAsRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      notification,
      unreadCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to mark notification as read' });
  }
}

/**
 * Mark all notifications as read for current user.
 * PATCH /api/notifications/read-all
 */
export async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to mark all as read' });
  }
}

/**
 * Delete a single notification.
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(req, res) {
  try {
    const result = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!result) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      message: 'Notification deleted successfully',
      unreadCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete notification' });
  }
}

/**
 * Clear all notifications for current user.
 * DELETE /api/notifications
 */
export async function clearAllNotifications(req, res) {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    res.status(200).json({
      message: 'All notifications cleared',
      unreadCount: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to clear notifications' });
  }
}
