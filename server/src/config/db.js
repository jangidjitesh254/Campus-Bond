import mongoose from 'mongoose';

/**
 * Connect to MongoDB using the URI in the environment.
 *
 * The connection promise is cached so that on serverless (Vercel) every
 * request reuses one connection per warm function instance instead of
 * opening a new one.
 */
let pending = null;

export function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (pending) return pending;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    return Promise.reject(new Error('MONGO_URI is not set. Copy .env.example to .env and fill it in.'));
  }

  pending = mongoose
    .connect(uri, { serverSelectionTimeoutMS: 8000 })
    .then((conn) => {
      console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn.connection;
    })
    .catch((err) => {
      pending = null; // allow a retry on the next request
      throw err;
    });
  return pending;
}
