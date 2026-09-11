/**
 * Demo content for the campus: students, team posts, lost & found, clubs with
 * members and pending applications, marketplace listings, past papers and
 * notes (real PDFs), chats, and Campus Score awards for all of it.
 *
 *   node scripts/seedDemo.js            # add (safe to re-run — nothing is duplicated)
 *   node scripts/seedDemo.js --reset    # remove everything this script created, then re-add
 *   node scripts/seedDemo.js --remove   # remove only
 *
 * Targets whatever MONGO_URI points at (local or Atlas). Existing data is
 * never touched; demo records are recognised by the demo students' emails.
 * All demo students log in with the password printed at the end.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
import LostItem from '../src/models/LostItem.js';
import Club from '../src/models/Club.js';
import MarketItem from '../src/models/MarketItem.js';
import Resource from '../src/models/Resource.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import ScoreEvent from '../src/models/ScoreEvent.js';
import { award } from '../src/utils/score.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const PASSWORD = 'Campus@123';
const DEMO_DOMAIN = 'vgu.ac.in';
const flags = new Set(process.argv.slice(2));
const daysFromNow = (d) => new Date(Date.now() + d * 86400000);
const daysAgo = (d) => new Date(Date.now() - d * 86400000);

// ---------------------------------------------------------------- students
const STUDENTS = [
  { key: 'priya',  name: 'Priya Sharma',   email: '24tec2cs101@vgu.ac.in', branch: 'CSE',     semester: 5, skills: ['React Native', 'Figma', 'UI Design'],          learning: ['Machine Learning'] },
  { key: 'arjun',  name: 'Arjun Verma',    email: '23tec2cs042@vgu.ac.in', branch: 'CSE',     semester: 7, skills: ['Python', 'Machine Learning', 'FastAPI'],      learning: ['MLOps', 'Public Speaking'] },
  { key: 'neha',   name: 'Neha Agarwal',   email: '24tec2ec015@vgu.ac.in', branch: 'ECE',     semester: 5, skills: ['Arduino', 'Embedded C', 'PCB Design'],        learning: ['ROS'] },
  { key: 'rohan',  name: 'Rohan Gupta',    email: '25tec2cs210@vgu.ac.in', branch: 'CSE',     semester: 3, skills: ['C++', 'DSA', 'Competitive Programming'],     learning: ['Web Development'] },
  { key: 'sana',   name: 'Sana Khan',      email: '24tec2me033@vgu.ac.in', branch: 'ME',      semester: 5, skills: ['SolidWorks', 'AutoCAD', '3D Printing'],       learning: ['Product Design'] },
  { key: 'kabir',  name: 'Kabir Singh',    email: '23mgt2mb008@vgu.ac.in', branch: 'MBA',     semester: 3, skills: ['Marketing', 'Pitching', 'Excel'],             learning: ['Growth Hacking'] },
  { key: 'ishita', name: 'Ishita Jain',    email: '24tec2cs144@vgu.ac.in', branch: 'CSE',     semester: 5, skills: ['Flutter', 'Firebase', 'Dart'],                learning: ['System Design'] },
  { key: 'dev',    name: 'Dev Choudhary',  email: '25sci2bc021@vgu.ac.in', branch: 'BCA',     semester: 3, skills: ['Video Editing', 'Photography', 'Premiere Pro'], learning: ['Motion Graphics'] },
  { key: 'meera',  name: 'Meera Nair',     email: '23phm2bp017@vgu.ac.in', branch: 'B.Pharm', semester: 7, skills: ['Content Writing', 'Research', 'Public Speaking'], learning: ['Data Analysis'] },
  { key: 'yash',   name: 'Yash Rathore',   email: '24tec2cs188@vgu.ac.in', branch: 'CSE',     semester: 5, skills: ['Node.js', 'MongoDB', 'Docker'],               learning: ['Kubernetes', 'Rust'] },
];

// ------------------------------------------------------------------- posts
const EVENTS = [
  { by: 'priya',  title: 'Need 2 teammates for Smart India Hackathon 2026', category: 'hackathon', skillsNeeded: ['Node.js', 'MongoDB', 'React Native'], teamSize: 2, deadline: 9, venue: 'Online + campus', description: 'Building a campus super-app for the Student Innovation theme. Already have design + one frontend dev. Need a backend dev and someone who can present.', applicants: [['yash', 'approved'], ['rohan', 'pending'], ['ishita', 'pending']], comments: [['yash', 'Backend is my thing — sent a request!'], ['rohan', 'Interested, can do DSA/logic side.']] },
  { by: 'arjun',  title: 'ML teammate for Kaggle-style campus challenge',   category: 'competition', skillsNeeded: ['Python', 'Pandas', 'Scikit-learn'], teamSize: 1, deadline: 14, venue: 'AI Lab, Block B', description: 'Two-week tabular ML contest. Need one person comfortable with feature engineering. I handle modelling.', applicants: [['yash', 'pending']], comments: [] },
  { by: 'neha',   title: 'Robowars: need a mechanical + power electronics pair', category: 'competition', skillsNeeded: ['SolidWorks', 'Motor drivers', 'Fabrication'], teamSize: 2, deadline: 21, venue: 'Robotics Lab', description: 'Building a 15 kg combat bot for the inter-college Robowars. Chassis and drive train are open roles.', applicants: [['sana', 'approved']], comments: [['sana', 'I can do the chassis in SolidWorks and get it printed.']] },
  { by: 'kabir',  title: 'Pitch deck designer for E-Summit startup pitch',  category: 'project', skillsNeeded: ['Figma', 'Storytelling'], teamSize: 1, deadline: 6, venue: 'E-Cell room', description: 'We have the idea and the numbers, we need slides that do not look like every other deck. Credits + a share of prize money.', applicants: [['priya', 'pending'], ['dev', 'pending']], comments: [['dev', 'Can also cut a 60-second teaser video for the pitch.']] },
  { by: 'meera',  title: 'Anchors and volunteers needed for Pharma Fest',   category: 'cultural', skillsNeeded: ['Public Speaking', 'Event management'], teamSize: 6, deadline: 12, venue: 'Auditorium', description: 'Two anchors, four volunteers for registration and stage. Certificates + fest T-shirt for everyone.', applicants: [['dev', 'approved'], ['rohan', 'approved'], ['ishita', 'pending']], comments: [['ishita', 'Can volunteer on day 2.']] },
  { by: 'ishita', title: 'Flutter dev to finish a hostel mess-menu app',     category: 'project', skillsNeeded: ['Flutter', 'Firebase'], teamSize: 1, deadline: 20, venue: '', description: 'App is 70% done. Need one more Flutter dev for the ratings + notification feature before we launch it in hostel A and B.', applicants: [], comments: [] },
  { by: 'yash',   title: 'Notice: Coding Club mock placement round on Saturday', category: 'other', skillsNeeded: [], teamSize: 1, deadline: 3, venue: 'CS Lab 2, 10 AM', description: 'Two DSA questions + one system-design discussion, timed like the real thing. Open to all branches. Bring your laptop.', applicants: [], comments: [['rohan', 'Is it okay for 3rd sem?'], ['yash', 'Yes — there is a separate easy set for 1st and 2nd years.']] },
  { by: 'sana',   title: 'CAD partner for a 3D-printed drone frame',         category: 'project', skillsNeeded: ['Fusion 360', '3D Printing'], teamSize: 1, deadline: 25, venue: 'Fab Lab', description: 'Designing a lightweight quad frame for the aero club. Need someone to split the CAD and test prints with me.', applicants: [['neha', 'pending']], comments: [] },
  { by: 'dev',    title: 'Short-film crew: cinematographer and 2 actors',    category: 'cultural', skillsNeeded: ['Acting', 'Camera'], teamSize: 3, deadline: 15, venue: 'Campus', description: 'Five-minute short for the state youth film fest. Shooting over two weekends on campus. No experience needed for actors, just show up.', applicants: [['meera', 'pending']], comments: [] },
  { by: 'rohan',  title: 'Study group for Discrete Maths end-sem',           category: 'other', skillsNeeded: [], teamSize: 4, deadline: 10, venue: 'Library, 2nd floor', description: 'Daily 6-8 PM. Solving last five years of papers together. Sem 3 CSE/IT.', applicants: [['priya', 'pending']], comments: [], status: 'open' },
  { by: 'arjun',  title: 'Need frontend dev for a fintech hackathon (closed)', category: 'hackathon', skillsNeeded: ['React'], teamSize: 1, deadline: -5, venue: 'Online', description: 'Team is complete now, thanks everyone.', applicants: [['ishita', 'approved'], ['priya', 'rejected']], comments: [], status: 'closed' },
];

// ---------------------------------------------------------- lost & found
const LOST = [
  { by: 'rohan',  type: 'lost',  title: 'Lost: blue Boat earbuds case',         category: 'electronics', location: 'Colonnade block, ground floor', description: 'Left it on a bench near the pillars after the 2 PM lecture. Blue case with a scratch on the lid.', contact: '98290 11223', interested: ['dev'] },
  { by: 'meera',  type: 'found', title: 'Found: ID card — 24tec2ec0xx',          category: 'id-card',     location: 'Reception, admin tower', description: 'Handed it to the reception desk. Ask for it there with your enrolment number.', contact: '', interested: [] },
  { by: 'ishita', type: 'lost',  title: 'Lost: black Wildcraft bag with charger', category: 'accessories', location: 'Central lawn', description: 'Left it near the lawn during the fest rehearsal. Has a laptop charger and a red notebook inside.', contact: '', interested: ['kabir', 'yash'] },
  { by: 'neha',   type: 'found', title: 'Found: Casio calculator in Lab 3',      category: 'electronics', location: 'ECE Lab 3', description: 'FX-991ES with a name scratched on the back that starts with "S". With me till Friday.', contact: '', interested: ['sana'] },
  { by: 'yash',   type: 'lost',  title: 'Lost: bike keys with a yellow keychain', category: 'keys',        location: 'Parking', description: 'Honda key with a yellow smiley keychain. Somewhere between the parking and the gateway building.', contact: '99280 55667', interested: [], status: 'resolved' },
  { by: 'priya',  type: 'found', title: 'Found: DSA textbook (Cormen), 3rd ed.',  category: 'books',       location: 'Library, 2nd floor', description: 'Left on a table near the window. Has notes in pencil in the first chapters.', contact: '', interested: ['rohan'] },
];

// ---------------------------------------------------------------- clubs
// Members and pending applications for the clubs that already exist.
const CLUB_PEOPLE = {
  'Coding Club':      { members: ['yash', 'rohan', 'priya', 'ishita'], requests: [['arjun', 'Want to run the ML study circle on Thursdays.', 'Python, ML']] },
  'Robotics Club':    { members: ['neha', 'sana'],                      requests: [['rohan', 'Interested in the software side of the bots.', 'C++']] },
  'Cultural Society': { members: ['meera', 'dev'],                      requests: [['ishita', 'I dance (kathak, 6 years) and can help with fest logistics.', 'Dance, Event management']] },
  'E-Cell':           { members: ['kabir', 'priya'],                    requests: [['arjun', 'Have a startup idea in campus logistics, want mentorship.', 'Python, Pitching']] },
  'Photography Club': { members: ['dev'],                               requests: [['meera', 'Beginner with a phone camera, want to learn.', 'Content writing']] },
  'Debate Society':   { members: ['meera', 'kabir'],                    requests: [] },
  'Sports Club':      { members: ['rohan', 'sana', 'yash'],             requests: [['dev', 'Badminton, evening slots.', '']] },
  'Music Band':       { members: [],                                    requests: [['dev', 'Play guitar, can also mix audio.', 'Guitar, Audio']] },
};

// --------------------------------------------------------------- market
const MARKET = [
  { by: 'arjun',  title: 'Arduino Uno starter kit (with sensors)', price: 900,  category: 'electronics', condition: 'good',     img: 'market-arduino-uno-starter-kit.jpg', description: 'Uno R3 clone, breadboard, jumper wires, ultrasonic + IR + DHT11 sensors. Used for one semester project.', contact: '' },
  { by: 'sana',   title: 'Engineering drawing kit + A2 board',      price: 400,  category: 'kit',         condition: 'like-new', img: 'market-engineering-drawing-kit.jpg', description: 'Mini-drafter, set squares, compass and an A2 drawing board. Only used in first year.', contact: '98290 44556' },
  { by: 'meera',  title: 'Pharmacology by Tripathi (8th ed.)',       price: 550,  category: 'books',       condition: 'good',     img: 'market-gate-cs-prep-books-set-of-4.jpg', description: 'Clean copy, a few pencil underlines. Essential for 5th and 6th sem.', contact: '' },
  { by: 'kabir',  title: '3-tier bookshelf (foldable)',              price: 650,  category: 'furniture',   condition: 'good',     img: 'market-bookshelf-3-tier.jpg', description: 'Hostel-room size, folds flat. Leaving hostel next month.', contact: '' },
  { by: 'dev',    title: 'Casio CT-S200 61-key keyboard',           price: 5500, category: 'instruments', condition: 'like-new', img: 'market-casio-keyboard-61-keys.jpg', description: 'Bought last year, with stand and adapter. Selling because I switched to a MIDI controller.', contact: '97840 22110' },
  { by: 'rohan',  title: 'Yonex badminton racket + shuttles',        price: 700,  category: 'other',       condition: 'good',     img: 'market-badminton-racket-shuttles.jpg', description: 'Nanoray Light, restrung last month. Half a box of feather shuttles included.', contact: '' },
  { by: 'yash',   title: 'OS + CN handwritten notes (sem 5)',        price: 120,  category: 'notes',       condition: 'good',     img: 'market-dsa-dbms-handwritten-notes.jpg', description: 'Complete units 1-5 for both subjects, from the batch that topped. Photocopy quality.', contact: '' },
  { by: 'ishita', title: '32 GB pen drive + card reader',            price: 250,  category: 'electronics', condition: 'new',      img: 'market-32gb-pen-drive-card-reader.jpg', description: 'Sealed, got two as a gift.', contact: '', status: 'sold' },
];

// ------------------------------------------------------------- resources
const RESOURCES = [
  { by: 'yash',   kind: 'pyq',   title: 'DBMS end-semester paper 2024',           subject: 'Database Management Systems', branch: 'CSE', semester: 5, year: 2024, downloads: 41, pages: ['Q1. Explain the three-schema architecture with a diagram. (10)', 'Q2. Normalise the given relation to 3NF. Show each step. (10)', 'Q3. Write SQL for: employees earning above department average. (5)', 'Q4. Compare B-tree and hash indexing. (5)', 'Q5. Explain two-phase locking. When does it deadlock? (10)'] },
  { by: 'priya',  kind: 'pyq',   title: 'Operating Systems mid-sem 2025',          subject: 'Operating Systems',           branch: 'CSE', semester: 5, year: 2025, downloads: 27, pages: ['Q1. Differentiate process and thread with examples. (5)', 'Q2. Solve using SJF and Round Robin (q=4): P1=8, P2=4, P3=9, P4=5. (10)', 'Q3. What is a race condition? Show Peterson\'s solution. (10)', 'Q4. Explain demand paging and page-fault handling. (5)'] },
  { by: 'arjun',  kind: 'notes', title: 'Machine Learning unit 1-3 notes',         subject: 'Machine Learning',            branch: 'CSE', semester: 7, year: null, downloads: 63, pages: ['Unit 1 — Supervised vs unsupervised, bias-variance, train/val/test.', 'Unit 2 — Linear & logistic regression, gradient descent, regularisation.', 'Unit 3 — Decision trees, random forests, evaluation metrics (precision, recall, F1, ROC).', 'Tip: the 2024 paper asked for the derivation of the logistic loss gradient — practise it.'] },
  { by: 'neha',   kind: 'pyq',   title: 'Signals & Systems end-sem 2024',          subject: 'Signals and Systems',         branch: 'ECE', semester: 5, year: 2024, downloads: 18, pages: ['Q1. State and prove the convolution theorem. (10)', 'Q2. Find the Fourier series of a square wave. (10)', 'Q3. Determine stability of the given LTI system. (5)', 'Q4. Sampling theorem and aliasing — explain with a sketch. (5)'] },
  { by: 'rohan',  kind: 'notes', title: 'Discrete Maths formula sheet',            subject: 'Discrete Mathematics',        branch: 'CSE', semester: 3, year: null, downloads: 88, pages: ['Sets & relations — reflexive, symmetric, transitive, equivalence classes.', 'Counting — permutations, combinations, pigeonhole, inclusion-exclusion.', 'Graphs — Euler path (0 or 2 odd vertices), Hamiltonian, planar (e <= 3v - 6).', 'Logic — truth tables, tautology, predicate quantifiers, proof by contradiction.'] },
  { by: 'sana',   kind: 'slides', title: 'Thermodynamics lecture slides (unit 2)', subject: 'Thermodynamics',              branch: 'ME',  semester: 5, year: null, downloads: 12, pages: ['First law for closed and open systems.', 'Steady-flow energy equation and its applications.', 'Second law — Kelvin-Planck and Clausius statements.', 'Carnot cycle, entropy, isentropic efficiency.'] },
  { by: 'meera',  kind: 'pyq',   title: 'Pharmacology-I end-sem 2024',             subject: 'Pharmacology',                branch: 'B.Pharm', semester: 5, year: 2024, downloads: 22, pages: ['Q1. Classify adrenergic drugs with one example each. (10)', 'Q2. Mechanism of action of beta-blockers; two adverse effects. (10)', 'Q3. Short notes: bioavailability, first-pass metabolism. (5+5)'] },
];

// A tiny, valid single-font PDF so the files open on a phone.
function makePdf(title, lines) {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const content = [];
  content.push('BT /F1 18 Tf 50 780 Td (' + esc(title) + ') Tj ET');
  content.push('BT /F1 10 Tf 50 762 Td (Vivekananda Global University, Jaipur - shared on Campus Bond) Tj ET');
  let y = 720;
  for (const l of lines) {
    const words = l.split(' ');
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).length > 90) { content.push(`BT /F1 12 Tf 50 ${y} Td (${esc(line)}) Tj ET`); y -= 18; line = w; }
      else line = line ? line + ' ' + w : w;
    }
    content.push(`BT /F1 12 Tf 50 ${y} Td (${esc(line)}) Tj ET`);
    y -= 28;
  }
  const stream = content.join('\n');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ------------------------------------------------------------------ run
async function remove(users) {
  const ids = users.map((u) => u._id);
  const evs = await Event.find({ createdBy: { $in: ids } });
  const convos = await Conversation.find({ participants: { $in: ids } });
  await Message.deleteMany({ conversation: { $in: convos.map((c) => c._id) } });
  await Conversation.deleteMany({ _id: { $in: convos.map((c) => c._id) } });
  await Event.deleteMany({ _id: { $in: evs.map((e) => e._id) } });
  await LostItem.deleteMany({ createdBy: { $in: ids } });
  await MarketItem.deleteMany({ seller: { $in: ids } });
  for (const r of await Resource.find({ uploader: { $in: ids } })) {
    try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(r.file))); } catch {}
    await r.deleteOne();
  }
  await Club.updateMany({}, { $pull: { members: { $in: ids }, requests: { user: { $in: ids } } } });
  await ScoreEvent.deleteMany({ user: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
  console.log(`removed demo content for ${users.length} demo student(s).`);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const cloud = process.env.MONGO_URI.startsWith('mongodb+srv://');
  console.log(`database: ${mongoose.connection.name} (${cloud ? 'Atlas' : 'local'})\n`);

  const existing = await User.find({ email: { $in: STUDENTS.map((s) => s.email) } });
  if (flags.has('--reset') || flags.has('--remove')) {
    if (existing.length) await remove(existing);
    if (flags.has('--remove')) { await mongoose.disconnect(); return; }
  }

  // students
  const U = {};
  const hash = await bcrypt.hash(PASSWORD, 10);
  let newUsers = 0;
  for (const s of STUDENTS) {
    let u = await User.findOne({ email: s.email });
    if (!u) {
      u = await User.create({ name: s.name, email: s.email, passwordHash: hash, branch: s.branch, semester: s.semester, skills: s.skills, learning: s.learning, isVerified: true });
      newUsers += 1;
    }
    U[s.key] = u;
  }
  console.log(`students  : ${newUsers} created, ${STUDENTS.length - newUsers} already there`);

  // posts
  let n = 0;
  for (const e of EVENTS) {
    const by = U[e.by];
    if (await Event.findOne({ title: e.title, createdBy: by._id })) continue;
    const ev = await Event.create({
      title: e.title, description: e.description, category: e.category, skillsNeeded: e.skillsNeeded, teamSize: e.teamSize,
      deadline: daysFromNow(e.deadline), venue: e.venue, createdBy: by._id, status: e.status || 'open',
      applicants: e.applicants.map(([k, status]) => ({ user: U[k]._id, status, message: "I'm interested" })),
      comments: e.comments.map(([k, text]) => ({ user: U[k]._id, text })),
    });
    await award(by._id, 'post_created', ev._id, { refModel: 'Event', note: ev.title });
    for (const [k] of e.comments) if (k !== e.by) await award(U[k]._id, 'comment_posted', ev._id, { refModel: 'Event', note: ev.title });
    for (const a of ev.applicants) {
      if (a.status !== 'approved') continue;
      const convo = await Conversation.create({ participants: [by._id, a.user], event: ev._id, lastMessage: '', lastMessageAt: daysAgo(1) });
      const texts = [
        [by._id, `Your interest for "${ev.title}" is accepted. Let's connect!`],
        [a.user, 'Great! When can we meet to plan?'],
        [by._id, 'Tomorrow 5 PM at the colonnade block? Bring your laptop.'],
      ];
      for (const [sender, text] of texts) await Message.create({ conversation: convo._id, sender, text });
      convo.lastMessage = texts[texts.length - 1][1]; convo.lastMessageAt = daysAgo(0.5); await convo.save();
      await award(a.user, 'team_joined', ev._id, { refModel: 'Event', note: ev.title });
      await award(by._id, 'request_reviewed', a._id, { refModel: 'Event', note: ev.title });
    }
    n += 1;
  }
  console.log(`posts     : ${n} created`);

  // lost & found
  n = 0;
  for (const l of LOST) {
    const by = U[l.by];
    if (await LostItem.findOne({ title: l.title, createdBy: by._id })) continue;
    const item = await LostItem.create({ type: l.type, title: l.title, description: l.description, category: l.category, location: l.location, contact: l.contact, status: l.status || 'open', createdBy: by._id, interested: l.interested.map((k) => U[k]._id) });
    await award(by._id, 'lost_reported', item._id, { refModel: 'LostItem', note: item.title });
    if (item.status === 'resolved') await award(by._id, 'lost_resolved', item._id, { refModel: 'LostItem', note: item.title });
    n += 1;
  }
  console.log(`lost&found: ${n} created`);

  // clubs
  let joined = 0, requested = 0;
  for (const [name, cfg] of Object.entries(CLUB_PEOPLE)) {
    const club = await Club.findOne({ name });
    if (!club) { console.log(`  (club "${name}" not found — run scripts/seedData.js first)`); continue; }
    for (const k of cfg.members) {
      const uid = U[k]._id;
      if (club.members.some((m) => String(m) === String(uid))) continue;
      club.members.push(uid); joined += 1;
      await award(uid, 'club_joined', club._id, { refModel: 'Club', note: club.name });
    }
    for (const [k, why, skills] of cfg.requests) {
      const uid = U[k]._id;
      if (club.requests.some((r) => String(r.user) === String(uid)) || club.members.some((m) => String(m) === String(uid))) continue;
      club.requests.push({ user: uid, why, skills, branch: U[k].branch, semester: U[k].semester, consent: true, status: 'pending' }); requested += 1;
    }
    await club.save();
  }
  console.log(`clubs     : ${joined} members added, ${requested} applications pending`);

  // market
  n = 0;
  for (const m of MARKET) {
    const by = U[m.by];
    if (await MarketItem.findOne({ title: m.title, seller: by._id })) continue;
    const image = fs.existsSync(path.join(UPLOAD_DIR, m.img)) ? `/uploads/${m.img}` : '';
    const item = await MarketItem.create({ title: m.title, description: m.description, price: m.price, category: m.category, condition: m.condition, image, contact: m.contact, status: m.status || 'available', seller: by._id, likes: [U.priya._id, U.rohan._id].filter((id) => String(id) !== String(by._id)) });
    await award(by._id, 'listing_created', item._id, { refModel: 'MarketItem', note: item.title });
    if (item.status === 'sold') await award(by._id, 'item_sold', item._id, { refModel: 'MarketItem', note: item.title });
    n += 1;
  }
  console.log(`market    : ${n} listings created`);

  // resources (real PDFs on disk)
  n = 0;
  for (const r of RESOURCES) {
    const by = U[r.by];
    if (await Resource.findOne({ title: r.title, uploader: by._id })) continue;
    const file = `demo-${slug(r.title)}.pdf`;
    const buf = makePdf(r.title, r.pages);
    fs.writeFileSync(path.join(UPLOAD_DIR, file), buf);
    const res = await Resource.create({ title: r.title, description: `${r.kind === 'pyq' ? 'Previous-year paper' : 'Shared by a senior'} — ${r.subject}.`, kind: r.kind, subject: r.subject, branch: r.branch, semester: r.semester, year: r.year || undefined, file: `/uploads/${file}`, mime: 'application/pdf', size: buf.length, originalName: file, uploader: by._id, downloads: r.downloads });
    await award(by._id, 'resource_uploaded', res._id, { refModel: 'Resource', note: res.title });
    // a few distinct downloaders credit the uploader, like real use would
    for (const k of ['priya', 'rohan', 'ishita']) if (k !== r.by) await award(by._id, 'resource_used', res._id, { refModel: 'Resource', note: res.title, key: `resource_used:${res._id}:${U[k]._id}` });
    n += 1;
  }
  console.log(`resources : ${n} PDFs created`);

  // summary
  console.log('');
  const board = await User.find({ email: { $in: STUDENTS.map((s) => s.email) } }).sort({ campusScore: -1 }).select('name campusScore branch');
  console.log('Campus Score leaderboard (demo students):');
  for (const u of board) console.log(`  ${String(u.campusScore).padStart(4)}  ${u.name}  (${u.branch})`);
  console.log('');
  console.log(`Log in as any demo student with password: ${PASSWORD}`);
  console.log(`  e.g. ${STUDENTS[0].email}  (${STUDENTS[0].name})`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
