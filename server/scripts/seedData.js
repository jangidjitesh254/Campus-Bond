import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import MarketItem from '../src/models/MarketItem.js';
import Club from '../src/models/Club.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---- minimal solid/gradient PNG encoder ----
const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function makePng(w, h, top, bot) {
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const rowStart = y * (1 + w * 3);
    raw[rowStart] = 0; // filter: none
    const tt = y / (h - 1);
    const r = Math.round(top[0] + (bot[0] - top[0]) * tt);
    const g = Math.round(top[1] + (bot[1] - top[1]) * tt);
    const b = Math.round(top[2] + (bot[2] - top[2]) * tt);
    for (let x = 0; x < w; x++) {
      const p = rowStart + 1 + x * 3;
      raw[p] = r; raw[p + 1] = g; raw[p + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit, RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function writeImage(name, top, bot) {
  const file = `seed-${name}.png`;
  fs.writeFileSync(path.join(UPLOAD_DIR, file), makePng(640, 480, top, bot));
  return `/uploads/${file}`;
}

const MARKET_IMG = {
  books: writeImage('books', [244, 233, 207], [200, 165, 100]),
  notes: writeImage('notes', [231, 244, 218], [110, 150, 80]),
  kit: writeImage('kit', [228, 238, 251], [90, 140, 210]),
  electronics: writeImage('electronics', [232, 234, 237], [120, 132, 150]),
  instruments: writeImage('instruments', [240, 227, 208], [170, 120, 80]),
  furniture: writeImage('furniture', [227, 241, 233], [90, 160, 120]),
  other: writeImage('other', [236, 236, 233], [150, 156, 148]),
};
const CLUB_IMG = {
  tech: writeImage('club-tech', [225, 240, 228], [40, 120, 75]),
  cultural: writeImage('club-cultural', [237, 231, 251], [126, 91, 239]),
  sports: writeImage('club-sports', [253, 231, 224], [230, 110, 70]),
  academic: writeImage('club-academic', [228, 238, 251], [60, 120, 200]),
  arts: writeImage('club-arts', [251, 231, 240], [210, 90, 140]),
  social: writeImage('club-social', [223, 241, 233], [30, 130, 100]),
  other: writeImage('club-other', [236, 236, 233], [150, 156, 148]),
};

const CLUBS = [
  { name: 'Coding Club', category: 'tech', description: 'Weekly hackathons, competitive-programming practice and open-source Fridays.' },
  { name: 'Cultural Society', category: 'cultural', description: 'Fests, dance, drama and all things culture.' },
  { name: 'Sports Club', category: 'sports', description: 'Football, cricket and badminton — play and compete.' },
  { name: 'Robotics Club', category: 'tech', description: 'Build bots, join robowars and learn embedded systems.' },
  { name: 'Music Band', category: 'arts', description: 'Jam sessions and campus gigs.' },
  { name: 'Debate Society', category: 'academic', description: 'MUNs, debates and public speaking.' },
  { name: 'Photography Club', category: 'arts', description: 'Photo walks, workshops and exhibitions.' },
  { name: 'E-Cell', category: 'social', description: 'Startups, pitches and entrepreneurship.' },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const owner = (await User.findOne({ email: 'asha@college.edu' })) || (await User.findOne());
  if (!owner) { console.log('No users — register first.'); process.exit(0); }

  // Give every market item a category image
  let imgUpdated = 0;
  for (const it of await MarketItem.find()) {
    if (!it.image) { it.image = MARKET_IMG[it.category] || MARKET_IMG.other; await it.save(); imgUpdated += 1; }
  }

  // Seed clubs
  let clubsCreated = 0;
  for (const c of CLUBS) {
    if (await Club.findOne({ name: c.name })) continue;
    await Club.create({ ...c, image: CLUB_IMG[c.category] || CLUB_IMG.other, createdBy: owner._id, members: [owner._id] });
    clubsCreated += 1;
  }

  console.log(`Product images set on ${imgUpdated} item(s). Clubs created: ${clubsCreated} (total ${await Club.countDocuments()}).`);
  await mongoose.disconnect();
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
