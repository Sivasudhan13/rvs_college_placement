/**
 * Aptitude seed — uses bulkWrite for speed on Atlas.
 * Run: npm run seed:aptitude
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const connectDB        = require('../config/db');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const AptitudeTest     = require('../models/AptitudeTest');
const questions        = require('./aptitudeQuestions');

const testDefs = [
  { name:'Quantitative Aptitude - Easy Test',   description:'Basic quantitative questions.',               category:'Quantitative',     duration:20, totalQuestions:20, marks:1, negativeMarks:0.25, difficulty:'Easy'   },
  { name:'Quantitative Aptitude - Medium Test',  description:'Intermediate quantitative questions.',        category:'Quantitative',     duration:30, totalQuestions:30, marks:1, negativeMarks:0.25, difficulty:'Medium' },
  { name:'Logical Reasoning Test',               description:'Test logical and analytical thinking.',       category:'Logical Reasoning', duration:25, totalQuestions:25, marks:1, negativeMarks:0.25, difficulty:'Mixed'  },
  { name:'Verbal Ability Test',                  description:'Assess English and verbal skills.',           category:'Verbal Ability',   duration:25, totalQuestions:25, marks:1, negativeMarks:0.25, difficulty:'Mixed'  },
  { name:'Full Aptitude Mock Test - Standard',   description:'Complete aptitude test — all sections.',     category:'Full',             duration:60, totalQuestions:60, marks:1, negativeMarks:0.25, difficulty:'Mixed'  },
  { name:'Full Aptitude Mock Test - Advanced',   description:'Full 90-minute placement simulation.',       category:'Full',             duration:90, totalQuestions:90, marks:1, negativeMarks:0.25, difficulty:'Mixed'  },
  { name:'TCS Aptitude Mock Test',               description:'TCS NQT-pattern: quant + logical + verbal.', category:'Full',             duration:60, totalQuestions:60, marks:1, negativeMarks:0.33, difficulty:'Mixed',  company:'TCS'      },
  { name:'Infosys Aptitude Mock Test',           description:'Infosys-pattern aptitude test.',             category:'Full',             duration:60, totalQuestions:60, marks:1, negativeMarks:0,    difficulty:'Mixed',  company:'Infosys'  },
];

const seedAptitude = async () => {
  await connectDB();

  /* ── Questions — bulk upsert ── */
  const existingOrders = new Set(
    (await AptitudeQuestion.find({}, 'order').lean()).map((q) => q.order)
  );

  const toInsert = questions.filter((q) => !existingOrders.has(q.order));

  if (toInsert.length === 0) {
    console.log('✅  Questions: 0 inserted, all already exist');
  } else {
    await AptitudeQuestion.insertMany(toInsert, { ordered: false });
    console.log(`✅  Questions: ${toInsert.length} inserted, ${existingOrders.size} skipped`);
  }

  /* ── Tests ── */
  for (const def of testDefs) {
    const exists = await AptitudeTest.findOne({ name: def.name }).lean();
    if (exists) { console.log(`  ⏭  Test "${def.name}" already exists`); continue; }

    const filter = { isPublished: true };
    if (def.category !== 'Full')   filter.category  = def.category;
    if (def.difficulty !== 'Mixed') filter.difficulty = def.difficulty;

    const pool     = await AptitudeQuestion.find(filter, '_id').sort({ order: 1 }).lean();
    const selected = pool.slice(0, def.totalQuestions).map((q) => q._id);

    await AptitudeTest.create({ ...def, questions: selected });
    console.log(`  ✅  Created test "${def.name}" with ${selected.length} questions`);
  }

  console.log('\n✅  Aptitude seed complete!');
  process.exit(0);
};

seedAptitude().catch((err) => { console.error(err); process.exit(1); });
