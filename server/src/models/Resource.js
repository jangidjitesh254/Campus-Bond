import mongoose from 'mongoose';

/**
 * Shared study material — a previous-year paper, a set of notes, slides.
 * Tagged by subject, branch and semester so a student can find what their
 * own course needs without wading through everything on campus.
 */
const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    kind: {
      type: String,
      enum: ['pyq', 'notes', 'slides', 'other'],
      default: 'notes',
    },
    subject: { type: String, required: true, trim: true },
    branch: { type: String, trim: true, default: '' }, // e.g. "CSE"
    semester: { type: Number, min: 1, max: 12 },
    year: { type: Number }, // exam year for a past paper, e.g. 2024

    // The uploaded file, served statically from /uploads.
    file: { type: String, required: true },
    mime: { type: String, default: '' },
    size: { type: Number, default: 0 }, // bytes
    originalName: { type: String, default: '' },

    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// The filters the library screen offers, plus text search on what's typed.
resourceSchema.index({ kind: 1, branch: 1, semester: 1, createdAt: -1 });
resourceSchema.index({ title: 'text', subject: 'text', description: 'text' });

export default mongoose.model('Resource', resourceSchema);
