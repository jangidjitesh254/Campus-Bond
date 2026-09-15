/**
 * Seed the Home banner with the current campus announcements.
 *
 *   node scripts/seedAnnouncements.js            # upsert (safe to re-run)
 *   node scripts/seedAnnouncements.js --remove   # remove the ones this script created
 *
 * Edit the ANNOUNCEMENTS list below and re-run to change what students see.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Announcement from '../src/models/Announcement.js';
import { connectDB, explainDBError } from '../src/config/db.js';

const days = (n) => new Date(Date.now() + n * 86400000);

const ANNOUNCEMENTS = [
  {
    title: 'Smart India Hackathon 2026 is coming',
    body: 'Internal hackathon on campus first — form your team of six and register before the deadline.',
    tag: 'Hackathon',
    tone: 'brand',
    cta: 'Find a team',
    link: 'https://www.sih.gov.in/',
    pinned: true,
    startsAt: days(0),
    expiresAt: days(45),
  },
  {
    // VGU's own cultural fest — every March. Shown with its wordmark, right after SIH.
    title: 'Panache is back this March',
    body: "VGU's cultural fest — one stage, many stories. Auditions and club sign-ups open soon.",
    tag: 'Fest',
    tone: 'panache',
    art: 'panache',
    cta: 'vgupanache.com',
    link: 'https://www.vgupanache.com/',
    startsAt: days(-1),
    expiresAt: new Date(new Date().getFullYear() + (new Date().getMonth() >= 2 ? 1 : 0), 3, 1), // 1 April after the next March
  },
  {
    title: 'Mid-semester exams start 6 Oct',
    body: 'Timetable is on the notice board and the ERP. Past papers are in Papers & notes.',
    tag: 'Exams',
    tone: 'blue',
    cta: 'Past papers',
    startsAt: days(-2),
    expiresAt: days(25),
  },
  {
    title: 'Placement drive: TCS & Infosys on campus',
    body: 'Pre-final and final year. Upload your resume on the placement portal by 20 Sept.',
    tag: 'Placements',
    tone: 'neutral',
    cta: 'Details',
    startsAt: days(-3),
    expiresAt: days(20),
  },
];
// Seeds this script no longer lists (removed on every run).
const RETIRED = ['Vivacity 2026 — cultural fest registrations open', "Panache — VGU's cultural fest is back this March"];

async function main() {
  await connectDB();
  const remove = process.argv.includes('--remove');
  const titles = ANNOUNCEMENTS.map((a) => a.title);

  if (remove) {
    const { deletedCount } = await Announcement.deleteMany({ title: { $in: titles } });
    console.log(`Removed ${deletedCount} announcement(s).`);
    return;
  }

  await Announcement.deleteMany({ title: { $in: RETIRED } });
  for (const a of ANNOUNCEMENTS) {
    await Announcement.findOneAndUpdate({ title: a.title }, { $set: a }, { upsert: true, new: true });
    console.log(`✓ ${a.title}`);
  }
  console.log(`\n${ANNOUNCEMENTS.length} announcement(s) live on the Home banner.`);
}

main()
  .catch((err) => {
    explainDBError(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
