import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { connectDB, explainDBError } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import lostRoutes from './routes/lostRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import skillMatchRoutes from './routes/skillMatchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { UPLOAD_DIR, USE_BLOB } from './middleware/upload.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Safety net: log (don't crash) on unexpected async errors so one bad
// request can never take the whole API server down.
process.on('unhandledRejection', (err) => {
  console.error('⚠️  Unhandled promise rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught exception:', err);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ---- Global middleware ----
app.use(cors()); // allow the mobile app to call the API
app.use(express.json());
app.use(morgan('dev')); // request logging in the console

// The 3D campus map: one folder per campus (public/campus/<id>/) holding the
// three.js scene, its layout JSON and the real photos/videos of the buildings.
app.use('/campus', express.static(path.join(__dirname, '..', 'public', 'campus'), { maxAge: '1h' }));

// ---- Health check ----
app.get('/', (req, res) => {
  res.json({ name: 'Campus Bond API', status: 'ok', time: new Date().toISOString() });
});

// Make sure the database is connected before handling any request. On Vercel
// this runs lazily per function instance; locally it's a no-op after startup.
app.use(async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    res.status(503).json({ message: 'Database unavailable. Please try again in a moment.' });
  }
});

// Serve uploaded files (photos, avatars, past papers and notes) from disk in
// local development (Vercel uses Blob URLs).
if (!USE_BLOB) app.use('/uploads', express.static(UPLOAD_DIR));

// ---- Feature routes ----
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/lostfound', lostRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/skill-match', skillMatchRoutes);
app.use('/api/notifications', notificationRoutes);

// ---- Error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

export default app;

// On Vercel the app is served through api/index.js; locally we listen ourselves.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Campus Bond API running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      explainDBError(err);
      process.exit(1);
    });
}
