const Roadmap      = require('../models/Roadmap');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/* Default SDE roadmap for new users */
const defaultMilestones = () => [
  {
    phase: 'Phase 1', title: 'Foundation', duration: 'Weeks 1 – 4', status: 'completed',
    steps: [
      { id: 1, title: 'Data Structures Mastery',  status: 'completed',   date: 'Oct 12', skills: ['Arrays', 'Linked Lists', 'Trees'] },
      { id: 2, title: 'Algorithm Fundamentals',   status: 'completed',   date: 'Oct 18', skills: ['Sorting', 'Searching', 'Recursion'] },
      { id: 3, title: 'OOP Concepts',             status: 'completed',   date: 'Oct 25', skills: ['Java / C++', 'Inheritance', 'Polymorphism'] },
    ],
  },
  {
    phase: 'Phase 2', title: 'Core Skills', duration: 'Weeks 5 – 8', status: 'in-progress',
    steps: [
      { id: 4, title: 'Dynamic Programming',      status: 'in-progress', date: null, skills: ['Memoisation', 'Tabulation'] },
      { id: 5, title: 'System Design Basics',     status: 'locked',      date: null, skills: ['Scalability', 'Caching'] },
      { id: 6, title: 'DBMS & SQL',               status: 'locked',      date: null, skills: ['Normalisation', 'Queries'] },
    ],
  },
  {
    phase: 'Phase 3', title: 'Placement Prep', duration: 'Weeks 9 – 12', status: 'locked',
    steps: [
      { id: 7, title: 'Mock Technical Interviews', status: 'locked', date: null, skills: ['LeetCode', 'HackerRank'] },
      { id: 8, title: 'Mock HR Interview',          status: 'locked', date: null, skills: ['STAR method', 'Behavioural'] },
      { id: 9, title: 'Resume & LinkedIn',          status: 'locked', date: null, skills: ['ATS', 'Keywords'] },
    ],
  },
  {
    phase: 'Phase 4', title: 'Advanced', duration: 'Weeks 13 – 16', status: 'locked',
    steps: [
      { id: 10, title: 'Advanced System Design',       status: 'locked', date: null, skills: ['Microservices', 'Docker'] },
      { id: 11, title: 'Company-specific Preparation', status: 'locked', date: null, skills: ['TCS', 'Infosys', 'Wipro'] },
      { id: 12, title: 'Final Mock Placement Drive',   status: 'locked', date: null, skills: ['Full simulation'] },
    ],
  },
];

/* ── GET /api/roadmap ── */
exports.getRoadmap = asyncHandler(async (req, res) => {
  let roadmap = await Roadmap.findOne({ user: req.user.id });

  if (!roadmap) {
    roadmap = await Roadmap.create({
      user: req.user.id,
      activeTrack: 'sde',
      milestones: defaultMilestones(),
    });
  }

  res.status(200).json({ success: true, roadmap });
});

/* ── PUT /api/roadmap ── */
exports.updateRoadmap = asyncHandler(async (req, res) => {
  const { activeTrack, milestones } = req.body;

  const roadmap = await Roadmap.findOneAndUpdate(
    { user: req.user.id },
    { activeTrack, milestones },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, roadmap });
});

/* ── PATCH /api/roadmap/step ── */
exports.updateStepStatus = asyncHandler(async (req, res, next) => {
  const { phaseIndex, stepId, status } = req.body;

  const roadmap = await Roadmap.findOne({ user: req.user.id });
  if (!roadmap) return next(new ApiError('Roadmap not found', 404));

  const phase = roadmap.milestones[phaseIndex];
  if (!phase) return next(new ApiError('Phase not found', 404));

  const step = phase.steps.find((s) => s.id === stepId);
  if (!step) return next(new ApiError('Step not found', 404));

  step.status = status;
  if (status === 'completed') step.date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  // Recalculate phase status
  const allDone     = phase.steps.every((s) => s.status === 'completed');
  const anyProgress = phase.steps.some((s) => s.status === 'in-progress' || s.status === 'completed');
  phase.status = allDone ? 'completed' : anyProgress ? 'in-progress' : 'locked';

  await roadmap.save();
  res.status(200).json({ success: true, roadmap });
});
