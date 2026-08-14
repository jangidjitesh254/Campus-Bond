import mongoose from 'mongoose';

/** A second-hand item listed for sale on the campus marketplace. */
const marketItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['books', 'notes', 'kit', 'electronics', 'instruments', 'furniture', 'other'],
      default: 'other',
    },
    condition: {
      type: String,
      enum: ['new', 'like-new', 'good', 'fair'],
      default: 'good',
    },
    image: { type: String, default: '' }, // relative path /uploads/x.jpg
    contact: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['available', 'sold'], default: 'available' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('MarketItem', marketItemSchema);
