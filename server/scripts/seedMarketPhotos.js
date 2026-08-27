import 'dotenv/config';
import mongoose from 'mongoose';
import MarketItem from '../src/models/MarketItem.js';

/**
 * Gives every marketplace listing a photo that actually shows the product.
 *
 * Commons' full-text search matches file *descriptions*, which returns wildly
 * off-subject photos, so every candidate must also have the subject word in
 * its own file name before we accept it.
 *
 *   node scripts/seedMarketPhotos.js
 */

const UA = 'CampusBond/0.1 (student project; demo product photos)';
const API = 'https://commons.wikimedia.org/w/api.php';
const OK_EXT = /\.(jpe?g|png)$/i;
// filenames that are icons/diagrams rather than product photos
const REJECT = /(icon|logo|diagram|chart|map|coat_of_arms|svg|schematic|graph)/i;

// title -> [search phrase, word(s) the file name must contain]
const WANT = {
  'GATE CS prep books (set of 4)': ['textbooks stack', ['book']],
  'Engineering Mathematics — B.S. Grewal': ['mathematics book', ['book']],
  'Operating Systems concepts (Galvin)': ['computer textbook', ['book']],
  'HC Verma Physics both parts': ['physics textbook', ['book', 'textbook']],
  'Data Structures in C — Reema Thareja': ['programming book', ['book']],

  'DSA + DBMS handwritten notes': ['handwritten notes paper', ['note']],
  'Computer Networks unit-wise notes': ['writing notes studying', ['note', 'writing']],
  'Thermodynamics class notes': ['notebook handwriting', ['notebook', 'note']],
  'DBMS quick-revision sheets': ['notebook paper writing', ['notebook', 'writing', 'paper']],

  'Engineering drawing kit': ['drawing instruments compass', ['compass', 'drawing', 'squadra']],
  'Mini drafter (full set)': ['drafting machine', ['drafting', 'drawing board']],
  'Geometry box + drawing sheets': ['compass divider drawing', ['compass', 'divider']],
  'Lab apron and safety goggles': ['safety goggles', ['goggle']],

  'Casio FX-991EX calculator': ['scientific calculator casio', ['calculator']],
  'Arduino Uno starter kit': ['arduino uno', ['arduino']],
  'Wired over-ear headphones': ['headphones', ['headphone']],
  '32GB pen drive + card reader': ['usb flash drive', ['usb', 'flash drive']],
  'Desk fan for hostel room': ['electric table fan', ['fan']],

  'Acoustic guitar': ['acoustic guitar', ['guitar']],
  'Casio keyboard (61 keys)': ['electronic keyboard instrument', ['keyboard']],
  'Djembe drum': ['djembe', ['djembe', 'drum']],
  'Ukulele with gig bag': ['ukulele', ['ukulele']],

  'LED study table lamp': ['desk lamp', ['lamp']],
  'Foldable study table': ['folding table', ['table']],
  'Study chair with cushion': ['office chair', ['chair']],
  'Bookshelf (3 tier)': ['bookshelf books', ['bookshelf', 'shelf']],

  'Single-gear campus cycle': ['bicycle', ['bicycle', 'bike']],
  'Lab coat (size M)': ['laboratory coat', ['lab coat', 'labcoat', 'lab_coat']],
  'Trolley suitcase (medium)': ['suitcase luggage', ['suitcase', 'luggage']],
  'Badminton racket + shuttles': ['badminton racket', ['badminton', 'racket']],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(phrase) {
  const url =
    `${API}?action=query&generator=search&gsrsearch=${encodeURIComponent('filetype:bitmap ' + phrase)}` +
    `&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (res.ok) return Object.values((await res.json())?.query?.pages || {});
    } catch {}
    await sleep(700 * (attempt + 1));
  }
  return [];
}

/** Accept only files whose own name mentions the subject. */
function pick(pages, mustWords) {
  const ranked = pages.sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const p of ranked) {
    const name = (p.title || '').replace(/^File:/, '');
    const lower = name.toLowerCase().replace(/_/g, ' ');
    const info = p.imageinfo?.[0];
    if (!info?.thumburl) continue;
    const clean = info.thumburl.split('?')[0];
    if (!OK_EXT.test(clean) || REJECT.test(name)) continue;
    if (mustWords.some((w) => lower.includes(w.toLowerCase().replace(/_/g, ' ')))) {
      return { url: clean, name };
    }
  }
  return null;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const missed = [];
  let updated = 0;
  for (const [title, [phrase, mustWords]] of Object.entries(WANT)) {
    const item = await MarketItem.findOne({ title });
    if (!item) continue;

    let hit = pick(await search(phrase), mustWords);
    if (!hit) {
      await sleep(400);
      hit = pick(await search(mustWords[0]), mustWords); // retry on the bare noun
    }
    if (!hit) {
      missed.push(title);
      await sleep(400);
      continue;
    }
    item.image = hit.url;
    await item.save();
    updated += 1;
    console.log(`  ✓ ${title}\n      ${hit.name}`);
    await sleep(400);
  }

  console.log(`\nUpdated ${updated} of ${Object.keys(WANT).length} listing photo(s).`);
  if (missed.length) console.log('Still unmatched:', missed.join(' | '));
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
