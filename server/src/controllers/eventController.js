import { validationResult } from 'express-validator';
import Event from '../models/Event.js';

function firstValidationError(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return errors.array()[0].msg;
  return null;
}

/**
 * Create an event / team-request post.
 * POST /api/events
 */
export async function createEvent(req, res) {
  const validationError = firstValidationError(req);
  if (validationError) return res.status(400).json({ message: validationError });

  const { title, description, category, skillsNeeded, teamSize, deadline } = req.body;

  const event = await Event.create({
    title,
    description,
    category,
    skillsNeeded: Array.isArray(skillsNeeded)
      ? skillsNeeded
      : String(skillsNeeded || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    teamSize,
    deadline,
    createdBy: req.user._id,
  });

  await event.populate('createdBy', 'name branch semester avatar');
  res.status(201).json({ event });
}

/**
 * Feed of open events. Supports ?category=&search=&page=&limit=.
 * GET /api/events
 */
export async function getEvents(req, res) {
  const { category, search, status = 'open' } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { skillsNeeded: { $regex: search, $options: 'i' } },
    ];
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name branch semester avatar'),
    Event.countDocuments(filter),
  ]);

  res.status(200).json({
    events,
    page,
    totalPages: Math.ceil(total / limit),
    total,
  });
}

/**
 * Single event details, including applicants (owner sees applicant info).
 * GET /api/events/:id
 */
export async function getEventById(req, res) {
  const event = await Event.findById(req.params.id)
    .populate('createdBy', 'name branch semester avatar')
    .populate('applicants.user', 'name branch semester avatar');

  if (!event) return res.status(404).json({ message: 'Event not found.' });
  res.status(200).json({ event });
}

/**
 * Apply to join a team / respond to a post.
 * POST /api/events/:id/apply
 */
export async function applyToEvent(req, res) {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found.' });

  if (event.status !== 'open') {
    return res.status(400).json({ message: 'This post is closed and no longer accepting responses.' });
  }
  if (String(event.createdBy) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot apply to your own post.' });
  }

  const already = event.applicants.find((a) => String(a.user) === String(req.user._id));
  if (already) {
    return res.status(409).json({ message: 'You have already applied to this post.' });
  }

  event.applicants.push({ user: req.user._id, message: req.body.message || '' });
  await event.save();

  res.status(201).json({ message: 'Your request was sent. The poster will review it.', event });
}

/**
 * Owner approves or rejects an applicant.
 * PATCH /api/events/:id/applicants/:applicantId   body: { status: 'approved' | 'rejected' }
 */
export async function reviewApplicant(req, res) {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Status must be 'approved' or 'rejected'." });
  }

  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found.' });

  if (String(event.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the poster can review applicants.' });
  }

  const applicant = event.applicants.id(req.params.applicantId);
  if (!applicant) return res.status(404).json({ message: 'Applicant not found.' });

  applicant.status = status;
  await event.save();
  await event.populate('applicants.user', 'name branch semester avatar');

  res.status(200).json({ message: `Applicant ${status}.`, event });
}

/**
 * Open/close a post (owner only).
 * PATCH /api/events/:id/status   body: { status: 'open' | 'closed' }
 */
export async function updateEventStatus(req, res) {
  const { status } = req.body;
  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ message: "Status must be 'open' or 'closed'." });
  }

  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found.' });
  if (String(event.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the poster can change the status.' });
  }

  event.status = status;
  await event.save();
  res.status(200).json({ event });
}

/**
 * Delete a post (owner only).
 * DELETE /api/events/:id
 */
export async function deleteEvent(req, res) {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found.' });
  if (String(event.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the poster can delete this post.' });
  }
  await event.deleteOne();
  res.status(200).json({ message: 'Post deleted.' });
}

/**
 * Posts created by the current user.
 * GET /api/events/me/created
 */
export async function myEvents(req, res) {
  const events = await Event.find({ createdBy: req.user._id })
    .sort({ createdAt: -1 })
    .populate('applicants.user', 'name branch semester avatar');
  res.status(200).json({ events });
}

/**
 * Posts the current user has applied to.
 * GET /api/events/me/applications
 */
export async function myApplications(req, res) {
  const events = await Event.find({ 'applicants.user': req.user._id })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name branch semester avatar');

  // Attach just this user's application status to each event.
  const result = events.map((e) => {
    const mine = e.applicants.find((a) => String(a.user) === String(req.user._id));
    return {
      _id: e._id,
      title: e.title,
      category: e.category,
      status: e.status,
      createdBy: e.createdBy,
      myStatus: mine?.status,
      appliedAt: mine?.createdAt,
    };
  });

  res.status(200).json({ applications: result });
}
