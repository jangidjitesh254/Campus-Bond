import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// ---- Global middleware ----
app.use(cors()); // allow the mobile app to call the API
app.use(express.json());
app.use(morgan('dev')); // request logging in the console

// ---- Health check ----
app.get('/', (req, res) => {
  res.json({ name: 'Campus Bond API', status: 'ok', time: new Date().toISOString() });
});

// ---- Feature routes ----
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

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
