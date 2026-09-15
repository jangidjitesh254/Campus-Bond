import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },

    // Campus identity
    branch: { type: String, trim: true, default: '' }, // e.g. "CSE", "B.Pharm"
    semester: { type: Number, min: 1, max: 12 },
    avatar: { type: String, default: '' },

    // What they can do and what they want to pick up — the matching signal
    // for team posts and the "people" section of search.
    skills: { type: [String], default: [] },
    learning: { type: [String], default: [] },

    // Verification
    isVerified: { type: Boolean, default: false },

    // Campus Score — running total; the ledger lives in ScoreEvent.
    campusScore: { type: Number, default: 0 },

    // AI & Collaboration profile
    skills: [{ type: String, trim: true }], // e.g. ["React", "Python", "UI/UX"]
    bio: { type: String, trim: true, default: '' },
    interests: [{ type: String, trim: true }], // e.g. ["Hackathons", "Robotics", "Web3"]
    githubUrl: { type: String, trim: true, default: '' },
    linkedinUrl: { type: String, trim: true, default: '' },
    portfolioUrl: { type: String, trim: true, default: '' },

    role: { type: String, enum: ['student', 'admin'], default: 'student' },
  },
  { timestamps: true }
);

// Hash the password whenever it is set through the virtual `password` field.
userSchema.virtual('password').set(function (value) {
  this._plainPassword = value;
});

userSchema.pre('save', async function (next) {
  if (this._plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    this._plainPassword = undefined;
  }
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Never leak the password hash in JSON responses.
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
