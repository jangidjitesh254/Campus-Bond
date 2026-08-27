import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import MarketItem from '../src/models/MarketItem.js';
import { UPLOAD_DIR } from '../src/middleware/upload.js';

/**
 * Downloads each listing's remote photo into server/uploads and repoints the
 * listing at our own /uploads path.
 *
 * Wikimedia rate-limits bursts from one IP, so a phone loading a dozen product
 * photos at once gets 429s and blank cards. Serving them from our own Express
 * static route removes that dependency entirely.
 *
 *   node scripts/localizeMarketPhotos.js
 */

const UA = 'CampusBond/0.1 (student project; caching demo product photos)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

async function download(url, dest, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) { await sleep(2500 * (i + 1)); continue; }
      if (!res.ok) return false;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000) return false; // almost certainly an error page
      fs.writeFileSync(dest, buf);
      return true;
    } catch {
      await sleep(1500 * (i + 1));
    }
  }
  return false;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const items = await MarketItem.find({ image: /^https?:\/\// });
  console.log(`${items.length} listing(s) with a remote photo.\n`);

  let saved = 0;
  const failed = [];
  for (const item of items) {
    const ext = (item.image.split('?')[0].match(/\.(jpe?g|png)$/i) || ['.jpg'])[0].toLowerCase();
    const file = `market-${slug(item.title)}${ext === '.jpeg' ? '.jpg' : ext}`;
    const dest = path.join(UPLOAD_DIR, file);

    if (await download(item.image, dest)) {
      item.image = `/uploads/${file}`;
      await item.save();
      saved += 1;
      console.log(`  ✓ ${item.title.padEnd(36)} ${file}  ${(fs.statSync(dest).size / 1024).toFixed(0)}kb`);
    } else {
      failed.push(item.title);
      console.log(`  ✗ ${item.title}`);
    }
    await sleep(900);
  }

  console.log(`\nCached ${saved} photo(s) into server/uploads.`);
  if (failed.length) console.log('Still remote (retry later):', failed.join(' | '));
  const local = await MarketItem.countDocuments({ image: /^\/uploads\// });
  console.log(`${local} of ${await MarketItem.countDocuments()} listings now serve photos from our own backend.`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
