import mongoose from 'mongoose';

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
  },
  { timestamps: true }
);

clubSchema.virtual('memberCount').get(function () {
  return (this.members || []).length;
});

clubSchema.set('toJSON', { virtuals: true });
clubSchema.set('toObject', { virtuals: true });

export default mongoose.model('Club', clubSchema);
