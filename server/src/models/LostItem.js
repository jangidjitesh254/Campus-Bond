import mongoose from 'mongoose';

/**
 * A lost or found item posted to the campus board.
 * `type` distinguishes "I lost this" from "I found this".
 */
const lostItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lost', 'found'], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: {
      type: String,
      enum: ['electronics', 'books', 'id-card', 'keys', 'accessories', 'clothing', 'other'],
      default: 'other',
    },
    location: { type: String, trim: true, default: '' }, // where lost/found on campus

    image: { type: String, default: '' }, // relative path, e.g. /uploads/123.jpg
    contact: { type: String, trim: true, default: '' }, // optional phone/handle

    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    // Students who tapped "Interested" — a simple signal to the poster, with
    // no approval step, since finding the owner is the whole point.
    interested: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('LostItem', lostItemSchema);
