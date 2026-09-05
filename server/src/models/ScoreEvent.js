import mongoose from 'mongoose';

/**
 * One line in a student's Campus Score ledger: what they did, what it was
 * worth, and what it was about. `campusScore` on the user is the running
 * total; this is where it came from, so the profile can show "how".
 */
const scoreEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    points: { type: Number, required: true },
    // What the points were for — a post, a resource, a club — if anything.
    ref: { type: mongoose.Schema.Types.ObjectId },
    refModel: { type: String, default: '' },
    note: { type: String, default: '' },
    // Dedupe key, normally "<action>:<ref>". Set explicitly when one action
    // can legitimately repeat on the same thing (a download by a new person).
    key: { type: String, required: true },
  },
  { timestamps: true }
);

// The same thing is only ever counted once per user, so re-saving a post or
// re-approving an applicant cannot farm points.
scoreEventSchema.index({ user: 1, key: 1 }, { unique: true });

export default mongoose.model('ScoreEvent', scoreEventSchema);
