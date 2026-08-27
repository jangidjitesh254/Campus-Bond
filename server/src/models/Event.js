import mongoose from 'mongoose';

/**
 * An applicant is a student who responded to an event/team post.
 * Their request stays "pending" until the post owner approves or rejects it.
 * This is the "approval-based system" that keeps things safe and organized.
 */
const applicantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    category: {
      type: String,
      enum: ['hackathon', 'cultural', 'competition', 'project', 'other'],
      default: 'hackathon',
    },

    // What the poster is looking for.
    skillsNeeded: [{ type: String, trim: true }], // e.g. ["React", "UI/UX"]
    teamSize: { type: Number, min: 1, default: 1 }, // number of teammates needed
    deadline: { type: Date }, // shown as "Date:" on event cards
    venue: { type: String, trim: true, default: '' }, // shown as "Venue:" on event cards

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },

    applicants: [applicantSchema],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Handy virtual: how many applicants have been approved so far.
eventSchema.virtual('approvedCount').get(function () {
  // `applicants` may be undefined when only a subset of fields is populated
  // (e.g. a Conversation populating just the event title).
  return (this.applicants || []).filter((a) => a.status === 'approved').length;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export default mongoose.model('Event', eventSchema);
