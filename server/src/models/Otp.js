import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Stores a one-time code tied to an email + the pending signup details.
 * The document auto-deletes once it expires (TTL index on `expiresAt`).
 */
const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true }, // hashed OTP, never stored in plain text
    purpose: { type: String, enum: ['signup'], default: 'signup' },

    // Pending signup payload, kept until the code is verified.
    payload: {
      name: String,
      passwordHash: String,
      branch: String,
      semester: Number,
    },

    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: MongoDB removes the doc automatically after expiresAt passes.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.methods.compareCode = function (candidate) {
  return bcrypt.compare(candidate, this.codeHash);
};

otpSchema.statics.hashCode = async function (code) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(code, salt);
};

export default mongoose.model('Otp', otpSchema);
