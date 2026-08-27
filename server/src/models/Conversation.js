import mongoose from 'mongoose';

/**
 * A private chat between two students, opened once a poster accepts
 * an "I'm interested" request on their post.
 */
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // the post it started from
    market: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketItem' }, // or the listing it started from
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, event: 1 });

export default mongoose.model('Conversation', conversationSchema);
