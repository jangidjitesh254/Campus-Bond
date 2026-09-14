import mongoose from 'mongoose';

/**
 * A campus-wide announcement shown in the banner at the top of Home —
 * SIH registrations, fest dates, exam notices and the like.
 *
 * `tone` picks the card colour in the app: `brand` is the deep-green card
 * reserved for the headline item, the rest are quiet white cards.
 */
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    body: { type: String, trim: true, maxlength: 240, default: '' },
    tag: { type: String, trim: true, maxlength: 24, default: 'Notice' }, // Hackathon · Fest · Exams · Notice
    tone: { type: String, enum: ['brand', 'neutral', 'amber', 'blue'], default: 'neutral' },
    link: { type: String, trim: true, default: '' }, // opened on tap, if set
    cta: { type: String, trim: true, maxlength: 24, default: '' }, // button label, e.g. "Register"
    pinned: { type: Boolean, default: false },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }, // null = never
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

announcementSchema.index({ pinned: -1, startsAt: -1 });

export default mongoose.model('Announcement', announcementSchema);
