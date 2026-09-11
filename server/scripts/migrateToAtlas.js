/**
 * Copy every collection from the local database to a cloud cluster.
 *
 *   node scripts/migrateToAtlas.js "<atlas connection string>"
 *   node scripts/migrateToAtlas.js "<atlas connection string>" --force   # overwrite non-empty target collections
 *   node scripts/migrateToAtlas.js "<atlas connection string>" --dry     # count only, write nothing
 *
 * Source is MONGO_URI from .env (your local MongoDB). The target string is
 * never printed. Documents are copied as-is, _id included, so references
 * between collections stay valid. Indexes are recreated by Mongoose the
 * first time the API starts against the new database.
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const [, , target, ...flags] = process.argv;
const force = flags.includes('--force');
const dry = flags.includes('--dry');
const source = process.env.MONGO_URI;

if (!target || !/^mongodb(\+srv)?:\/\//.test(target)) {
  console.error('Usage: node scripts/migrateToAtlas.js "<mongodb+srv://... connection string>" [--force] [--dry]');
  process.exit(1);
}
if (!source) {
  console.error('MONGO_URI is not set in .env — that is the source (local) database.');
  process.exit(1);
}
if (source === target) {
  console.error('Source and target are the same database. Nothing to do.');
  process.exit(1);
}

// Mongoose-internal / transient collections that should not be copied.
const SKIP = new Set(['otps', 'emailverifications']);

const src = new MongoClient(source, { serverSelectionTimeoutMS: 8000 });
const dst = new MongoClient(target, { serverSelectionTimeoutMS: 15000 });

try {
  await src.connect();
  console.log(`source : ${src.db().databaseName} @ local`);
  await dst.connect();
  const dbName = dst.db().databaseName === 'test' ? src.db().databaseName : dst.db().databaseName;
  const to = dst.db(dbName);
  console.log(`target : ${dbName} @ cloud${dry ? '  (dry run — nothing will be written)' : ''}`);
  console.log('');

  const cols = (await src.db().listCollections().toArray()).map((c) => c.name).filter((n) => !n.startsWith('system.')).sort();
  let total = 0;
  for (const name of cols) {
    const docs = await src.db().collection(name).find({}).toArray();
    const label = name.padEnd(20);
    if (SKIP.has(name)) { console.log(`${label} skipped (transient)`); continue; }
    if (docs.length === 0) { console.log(`${label} 0  (empty, skipped)`); continue; }

    const existing = await to.collection(name).countDocuments();
    if (existing > 0 && !force) {
      console.log(`${label} ${String(docs.length).padStart(4)}  target already has ${existing} — skipped (use --force to replace)`);
      continue;
    }
    if (dry) { console.log(`${label} ${String(docs.length).padStart(4)}  would copy`); total += docs.length; continue; }

    if (existing > 0) await to.collection(name).deleteMany({});
    const res = await to.collection(name).insertMany(docs, { ordered: false });
    total += res.insertedCount;
    console.log(`${label} ${String(res.insertedCount).padStart(4)}  copied`);
  }
  console.log('');
  console.log(`${dry ? 'would copy' : 'copied'} ${total} documents across ${cols.length} collections.`);
  if (!dry) console.log('Next: set MONGO_URI in server/.env to the cloud string and restart the API.');
} catch (err) {
  console.error('');
  console.error('Migration failed:', err.message);
  if (/ENOTFOUND|querySrv|ECONNREFUSED|timed out/i.test(err.message)) {
    console.error('  • Is your IP allowed in Atlas → Network Access?');
    console.error('  • Is the connection string complete (mongodb+srv://user:pass@host/dbname)?');
  }
  if (/auth/i.test(err.message)) console.error('  • Check the database user and password in the connection string (URL-encode special characters).');
  process.exitCode = 1;
} finally {
  await src.close().catch(() => {});
  await dst.close().catch(() => {});
}
