import mongoose from 'mongoose';

/**
 * A student application to join a club. Members are never added directly —
 * the club president reviews the request first.
 */
const joinRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    why: { type: String, trim: true, default: '' },
    skills: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
    semester: { type: Number },
    consent: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

/** A campus club / society students can create and join. */
const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: {
      type: String,
      enum: ['tech', 'cultural', 'sports', 'academic', 'arts', 'social', 'other'],
      default: 'other',
    },
    image: { type: String, default: '' }, // logo path /uploads/x.jpg
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    requests: [joinRequestSchema],
  },
  { timestamps: true }
);

clubSchema.virtual('memberCount').get(function () {
  return (this.members || []).length;
});

clubSchema.set('toJSON', { virtuals: true });
clubSchema.set('toObject', { virtuals: true });

export default mongoose.model('Club', clubSchema);
