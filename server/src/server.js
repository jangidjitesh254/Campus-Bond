import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import lostRoutes from './routes/lostRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Safety net: log (don't crash) on unexpected async errors so one bad
// request can never take the whole API server down.
process.on('unhandledRejection', (err) => {
  console.error('⚠️  Unhandled promise rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught exception:', err);
});

const app = express();

// ---- Global middleware ----
app.use(cors()); // allow the mobile app to call the API
app.use(express.json());
app.use(morgan('dev')); // request logging in the console

// Serve uploaded images (lost & found photos, etc.)
app.use('/uploads', express.static(UPLOAD_DIR));

// ---- Health check ----
app.get('/', (req, res) => {
  res.json({ name: 'Campus Bond API', status: 'ok', time: new Date().toISOString() });
});

// ---- Feature routes ----
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/lostfound', lostRoutes);
app.use('/api/chat', chatRoutes);

// ---- Error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to the database, then start listening.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Campus Bond API running on http://localhost:${PORT}`);
  });
});
