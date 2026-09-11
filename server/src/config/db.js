import mongoose from 'mongoose';

/**
 * Connect to MongoDB using the URI in the environment — a local server
 * (mongodb://127.0.0.1/...) or an Atlas cluster (mongodb+srv://...).
 * Exits the process if the connection fails, since the API is useless
 * without a database.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  const cloud = uri.startsWith('mongodb+srv://');
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}${cloud ? ' (Atlas)' : ' (local)'}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    if (cloud) {
      console.error('   • Atlas → Network Access: is this machine\'s IP (or 0.0.0.0/0 for dev) allowed?');
      console.error('   • Atlas → Database Access: does the user/password in MONGO_URI match? URL-encode special characters.');
      console.error('   • Does the string end with /campus_bond (the database name) before the ? options?');
    } else {
      console.error('   Is your local MongoDB server running?');
    }
    process.exit(1);
  }
}
