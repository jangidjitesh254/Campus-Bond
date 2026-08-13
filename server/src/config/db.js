import mongoose from 'mongoose';

/**
 * Connect to MongoDB using the URI in the environment.
 * Exits the process if the connection fails, since the API is
 * useless without a database.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('   Is your local MongoDB server running?');
    process.exit(1);
  }
}
