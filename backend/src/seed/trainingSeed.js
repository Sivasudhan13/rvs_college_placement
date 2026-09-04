/**
 * Seed default trainings for the Attendance module.
 * Run: npm run seed:training
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const connectDB = require('../config/db');
const Training  = require('../models/Training');

const trainings = [
  { title: 'Full Stack Web Development', type: 'Technical',     departments: ['cse','it'],       years: [3,4], batches: ['A','B'], status: 'Ongoing',   description: 'MERN stack training covering React, Node.js, MongoDB.' },
  { title: 'Quantitative Aptitude',      type: 'Aptitude',      departments: ['cse','ece','it'],  years: [2,3], batches: ['A','B','C'], status: 'Ongoing',description: 'Covers number systems, percentages, time & work, etc.' },
  { title: 'Logical Reasoning',          type: 'Aptitude',      departments: ['cse','ece','it'],  years: [2,3], batches: ['A','B','C'], status: 'Ongoing',description: 'Blood relations, series, coding-decoding, puzzles.' },
  { title: 'Communication Skills',       type: 'Soft Skills',   departments: ['cse','ece','eee','me','ce','it'], years: [1,2,3,4], batches: ['A','B','C'], status: 'Ongoing', description: 'English communication, presentation, and group discussion.' },
  { title: 'Data Structures & Algorithms', type: 'Technical',   departments: ['cse','it'],       years: [2,3], batches: ['A','B'], status: 'Upcoming',  description: 'Arrays, linked lists, trees, graphs, sorting and searching.' },
  { title: 'Resume Building & Interview Prep', type: 'Placement Prep', departments: ['cse','ece','eee','me','ce','it'], years: [4], batches: ['A','B','C'], status: 'Upcoming', description: 'Resume writing, mock interviews, and GD preparation.' },
  { title: 'Cloud Computing (AWS)',       type: 'Technical',     departments: ['cse','it'],       years: [3,4], batches: ['A','B'], status: 'Upcoming',  description: 'AWS fundamentals, EC2, S3, Lambda, and cloud architecture.' },
  { title: 'Python Programming',         type: 'Technical',     departments: ['cse','it','ece'], years: [1,2], batches: ['A','B','C'], status: 'Completed', description: 'Python basics, data structures, file handling, OOP.' },
  { title: 'TCS NQT Mock Test Series',   type: 'Placement Prep', departments: ['cse','ece','eee','me','ce','it'], years: [3,4], batches: ['A','B','C'], status: 'Ongoing', description: 'Full-length mock tests simulating TCS NQT pattern.' },
  { title: 'VLSI & Embedded Systems',    type: 'Technical',     departments: ['ece','eee'],      years: [3,4], batches: ['A','B'], status: 'Upcoming',  description: 'VLSI design, microcontrollers, and embedded C programming.' },
];

const seed = async () => {
  await connectDB();
  let inserted = 0, skipped = 0;
  for (const t of trainings) {
    const exists = await Training.findOne({ title: t.title });
    if (exists) { skipped++; continue; }
    await Training.create({ ...t, isActive: true });
    inserted++;
  }
  console.log(`✅  Trainings: ${inserted} inserted, ${skipped} skipped`);
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
