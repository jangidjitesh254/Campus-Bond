import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Event from './models/Event.js';
import LostItem from './models/LostItem.js';
import MarketItem from './models/MarketItem.js';
import Club from './models/Club.js';

/**
 * Seed demo data for every feature (users, teams/events, lost & found,
 * marketplace, clubs).
 *
 *   npm run seed             # add demo data (skips if users already exist)
 *   npm run seed -- --reset  # wipe those collections first
 *   npm run seed -- --images # only (re)attach photo URLs to the seeded docs
 *
 * Every demo user's password is "password123".
 */

const RESET = process.argv.includes('--reset');
const IMAGES_ONLY = process.argv.includes('--images');
const PASSWORD = 'password123';

const USERS = [
  { name: 'Aarav Sharma', email: 'aarav@campus.edu', branch: 'CSE', semester: 5 },
  { name: 'Priya Verma', email: 'priya@campus.edu', branch: 'ECE', semester: 3 },
  { name: 'Rohan Mehta', email: 'rohan@campus.edu', branch: 'ME', semester: 7 },
  { name: 'Sneha Iyer', email: 'sneha@campus.edu', branch: 'IT', semester: 5 },
  { name: 'Karan Gupta', email: 'karan@campus.edu', branch: 'B.Pharm', semester: 2 },
  { name: 'Ananya Singh', email: 'ananya@campus.edu', branch: 'CSE', semester: 3 },
];

const daysAgo = (d, h = 0) => new Date(Date.now() - d * 86400000 - h * 3600000);
// Free stock photos (Pexels CDN) so the feed has real images to show.
const px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

const EVENTS = (u) => [
  { title: 'Need 2 devs for Smart India Hackathon', description: 'Building a campus-navigation app with AR. Looking for a React Native dev and a backend (Node/Mongo) person. Weekend sprints only.', category: 'hackathon', skillsNeeded: ['React Native', 'Node.js'], teamSize: 2, deadline: daysAgo(-10), createdBy: u[0], createdAt: daysAgo(0, 2) },
  { title: 'Final-year project: IoT crop monitoring', description: 'Need one ECE teammate who has worked with ESP32 + sensors. Guide already approved the topic.', category: 'project', skillsNeeded: ['ESP32', 'Embedded C'], teamSize: 1, createdBy: u[2], createdAt: daysAgo(0, 9) },
  { title: 'Annual Fest — dance crew auditions', description: 'Auditions this Friday 4 PM at the auditorium. All years welcome, no experience needed. Bring your own track.', category: 'cultural', teamSize: 8, deadline: daysAgo(-4), createdBy: u[5], createdAt: daysAgo(1) },
  { title: 'CodeChef Starters — team of 3', description: 'Rated contest next Wednesday. Need 2 more people comfortable with DP and graphs.', category: 'competition', skillsNeeded: ['C++', 'DSA'], teamSize: 2, deadline: daysAgo(-6), createdBy: u[3], createdAt: daysAgo(1, 6) },
  { title: 'Library timings extended during exams', description: 'Central library will stay open till 11 PM from Monday. ID card mandatory after 8 PM.', category: 'other', teamSize: 1, createdBy: u[1], createdAt: daysAgo(2) },
  { title: 'Robotics team for e-Yantra', description: 'Forming a 4-member team. Need someone good at Python + OpenCV, and one mech person for the chassis.', category: 'competition', skillsNeeded: ['Python', 'OpenCV', 'CAD'], teamSize: 3, deadline: daysAgo(-14), createdBy: u[4], createdAt: daysAgo(3) },
];

const LOST = (u) => [
  { type: 'lost', title: 'Black Boat earbuds case', description: 'Left it near the canteen counter around 1 PM. Has a small scratch on the lid.', category: 'electronics', location: 'Canteen', image: px(33797659), createdBy: u[1], createdAt: daysAgo(0, 4) },
  { type: 'found', title: 'College ID card — Rahul K.', description: 'Found on the bench outside Block B. Kept with the security desk at the main gate.', category: 'id-card', location: 'Block B', image: px(7108126), createdBy: u[3], createdAt: daysAgo(0, 7) },
  { type: 'lost', title: 'Casio fx-991 calculator', description: 'Lost during the Maths exam in Room 204. Name written on the back.', category: 'other', location: 'Room 204', image: px(5921494), createdBy: u[4], createdAt: daysAgo(1, 3) },
  { type: 'found', title: 'Bike keys with a red keychain', description: 'Found in the parking lot near the ECE block. DM me to collect.', category: 'keys', location: 'Parking lot', image: px(842528), createdBy: u[0], createdAt: daysAgo(2) },
  { type: 'lost', title: 'Grey hoodie (size M)', description: 'Forgot it in the seminar hall after the guest lecture.', category: 'clothing', location: 'Seminar hall', image: px(11340657), createdBy: u[5], createdAt: daysAgo(3, 5) },
];

const MARKET = (u) => [
  { title: 'Engineering Mathematics — B.S. Grewal', description: '43rd edition, barely used. A few pencil marks in chapter 2.', price: 350, category: 'books', condition: 'like-new', image: px(13580974), createdBy: u[2], createdAt: daysAgo(0, 5) },
  { title: 'Drafting kit (full set)', description: 'Mini drafter, set squares, compass. Used for one semester.', price: 600, category: 'kit', condition: 'good', image: px(29264971), createdBy: u[0], createdAt: daysAgo(1) },
  { title: 'Arduino Uno + sensor bundle', description: 'Uno R3, breadboard, jumper wires, ultrasonic + DHT11 sensors. Everything works.', price: 900, category: 'electronics', condition: 'good', image: px(8386437), createdBy: u[4], createdAt: daysAgo(1, 8) },
  { title: 'Handwritten DSA notes (Sem 3)', description: 'Complete unit-wise notes, neat and scanned copy also included.', price: 150, category: 'notes', condition: 'new', image: px(8376141), createdBy: u[3], createdAt: daysAgo(2, 2) },
  { title: 'Yamaha F310 acoustic guitar', description: 'Comes with bag and picks. Selling because I am graduating.', price: 5500, category: 'instruments', condition: 'good', image: px(27508913), createdBy: u[2], createdAt: daysAgo(4) },
  { title: 'Study table + chair', description: 'Foldable wooden table, hostel-friendly. Pick up from Hostel C.', price: 1200, category: 'furniture', condition: 'fair', status: 'sold', image: px(771317), createdBy: u[1], createdAt: daysAgo(6) },
];

const CLUBS = (u) => [
  { name: 'Coding Club', description: 'Weekly DSA sessions, hackathon prep and open-source sprints. Beginners welcome.', category: 'tech', image: px(7092523), createdBy: u[0], members: [u[0], u[1], u[3], u[5]], createdAt: daysAgo(0, 6) },
  { name: 'Nritya — Dance Society', description: 'Classical, hip-hop and freestyle crews. We perform at every campus fest.', category: 'cultural', image: px(14699865), createdBy: u[5], members: [u[5], u[1]], createdAt: daysAgo(1, 4) },
  { name: 'Campus Football Club', description: 'Practice every Tue/Thu 6 AM on the main ground. Inter-college league in October.', category: 'sports', image: px(39222204), createdBy: u[2], members: [u[2], u[4], u[0]], createdAt: daysAgo(2, 3) },
  { name: 'Robotics & IoT Society', description: 'Build bots, fly drones, break things. Lab access on weekends.', category: 'tech', image: px(6019019), createdBy: u[4], members: [u[4], u[2]], createdAt: daysAgo(3) },
  { name: 'Photography Club', description: 'Photo walks, editing workshops and the annual exhibition.', category: 'arts', image: px(13827131), createdBy: u[3], members: [u[3], u[1], u[5]], createdAt: daysAgo(5) },
  { name: 'Debate & MUN Society', description: 'Parliamentary debates and Model UN conferences across the state.', category: 'academic', image: px(31129059), createdBy: u[1], members: [u[1]], createdAt: daysAgo(7) },
];

/** Attach the photo URLs above to docs that were seeded earlier (matched by title / name). */
async function attachImages() {
  const ids = [];
  let n = 0;
  for (const it of LOST(ids)) n += (await LostItem.updateOne({ title: it.title }, { $set: { image: it.image } })).modifiedCount;
  for (const it of MARKET(ids)) n += (await MarketItem.updateOne({ title: it.title }, { $set: { image: it.image } })).modifiedCount;
  for (const c of CLUBS(ids)) n += (await Club.updateOne({ name: c.name }, { $set: { image: c.image } })).modifiedCount;
  console.log(`🖼  Attached images to ${n} documents`);
}

async function main() {
  await connectDB();

  if (IMAGES_ONLY) return attachImages();

  if (RESET) {
    await Promise.all([User.deleteMany({}), Event.deleteMany({}), LostItem.deleteMany({}), MarketItem.deleteMany({}), Club.deleteMany({})]);
    console.log('🧹 Cleared users, events, lost items, market items, clubs');
  } else if (await User.exists({ email: USERS[0].email })) {
    console.log('ℹ️  Demo data already present. Run with --reset to reseed.');
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, await bcrypt.genSalt(10));
  const users = await User.insertMany(USERS.map((u) => ({ ...u, passwordHash, isVerified: true })));
  const ids = users.map((u) => u._id);

  const events = await Event.insertMany(EVENTS(ids));
  // A few applicants + comments so the feed has counts.
  events[0].applicants.push({ user: ids[1], message: 'I can do the RN side.' }, { user: ids[3], message: 'Backend here!', status: 'approved' });
  events[0].comments.push({ user: ids[5], text: 'Is remote OK?' });
  events[2].applicants.push({ user: ids[1] });
  events[3].comments.push({ user: ids[0], text: 'Count me in' }, { user: ids[2], text: 'What rating range?' });
  await Promise.all(events.map((e) => e.save()));

  await LostItem.insertMany(LOST(ids));
  await MarketItem.insertMany(MARKET(ids).map(({ createdBy, ...m }) => ({ ...m, seller: createdBy })));
  await Club.insertMany(CLUBS(ids));

  console.log(`✅ Seeded ${users.length} users, ${events.length} events, ${LOST(ids).length} lost items, ${MARKET(ids).length} market items, ${CLUBS(ids).length} clubs`);
  console.log(`   Login with any of: ${USERS.map((u) => u.email).join(', ')}  (password: ${PASSWORD})`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
