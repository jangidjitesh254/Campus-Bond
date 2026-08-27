import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import MarketItem from '../src/models/MarketItem.js';

const ITEMS = [
  { title: 'Engineering drawing kit', price: 350, category: 'kit', condition: 'good', description: 'Barely used — compass, set squares, scales, all pieces intact.', contact: '98765 43210' },
  { title: 'GATE CS prep books (set of 4)', price: 600, category: 'books', condition: 'like-new', description: 'Made Easy series, no markings. Perfect for final year.', contact: '98765 43210' },
  { title: 'Casio FX-991EX calculator', price: 450, category: 'electronics', condition: 'good', description: 'Exam-approved scientific calculator, works perfectly.', contact: '' },
  { title: 'LED study table lamp', price: 200, category: 'furniture', condition: 'good', description: 'Adjustable neck, warm/white modes. Great for late-night study.', contact: '' },
  { title: 'DSA + DBMS handwritten notes', price: 150, category: 'notes', condition: 'good', description: 'Full semester, neatly written. Helped me score well.', contact: '98765 43210' },
  { title: 'Acoustic guitar', price: 2500, category: 'instruments', condition: 'fair', description: 'Good for beginners. Minor scratches, sounds great.', contact: '' },
  { title: 'Lab coat (size M)', price: 120, category: 'other', condition: 'like-new', description: 'Worn twice, freshly washed.', contact: '' },
  { title: 'Single-gear campus cycle', price: 1800, category: 'other', condition: 'good', description: 'Recently serviced, new tyres. Ideal for getting around campus.', contact: '98765 43210' },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const seller = await User.findOne({ email: 'asha@college.edu' }) || (await User.findOne());
  if (!seller) {
    console.log('No users found — register a user first, then re-run.');
    process.exit(0);
  }

  let created = 0;
  for (const it of ITEMS) {
    const exists = await MarketItem.findOne({ title: it.title, seller: seller._id });
    if (exists) continue;
    await MarketItem.create({ ...it, seller: seller._id });
    created += 1;
  }
  console.log(`Seeded ${created} new marketplace item(s) as ${seller.name}. Total now: ${await MarketItem.countDocuments()}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
