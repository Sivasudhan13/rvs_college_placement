import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

/* ─────────────────────────────────────────
   TRACK DATA
───────────────────────────────────────── */
const TRACK_DATA = {
  sde: {
    label: 'Software Engineer',
    skills: [
      { label: 'Data Structures', pct: 82, color: 'bg-primary'      },
      { label: 'Algorithms',      pct: 70, color: 'bg-blue-500'     },
      { label: 'System Design',   pct: 28, color: 'bg-purple-500'   },
      { label: 'Aptitude',        pct: 75, color: 'bg-green-500'    },
      { label: 'Communication',   pct: 60, color: 'bg-amber-500'    },
    ],
    milestones: [
      {
        phase: 'Phase 1', title: 'Foundation', duration: 'Weeks 1 – 4', status: 'completed',
        steps: [
          { id: 1,  title: 'Data Structures Mastery',   status: 'completed',   date: 'Oct 12', skills: ['Arrays', 'Linked Lists', 'Trees', 'Graphs'] },
          { id: 2,  title: 'Algorithm Fundamentals',    status: 'completed',   date: 'Oct 18', skills: ['Sorting', 'Searching', 'Recursion'] },
          { id: 3,  title: 'OOP Concepts',              status: 'completed',   date: 'Oct 25', skills: ['Java / C++', 'Inheritance', 'Polymorphism'] },
        ],
      },
      {
        phase: 'Phase 2', title: 'Core Skills', duration: 'Weeks 5 – 8', status: 'in-progress',
        steps: [
          { id: 4,  title: 'Dynamic Programming',       status: 'in-progress', date: null,     skills: ['Memoisation', 'Tabulation', 'Optimisation'] },
          { id: 5,  title: 'System Design Basics',      status: 'locked',      date: null,     skills: ['Scalability', 'Caching', 'Load Balancing'] },
          { id: 6,  title: 'DBMS & SQL',                status: 'locked',      date: null,     skills: ['Normalisation', 'Queries', 'Indexing'] },
        ],
      },
      {
        phase: 'Phase 3', title: 'Placement Prep', duration: 'Weeks 9 – 12', status: 'locked',
        steps: [
          { id: 7,  title: 'Mock Interviews (Technical)', status: 'locked',    date: null, skills: ['LeetCode', 'HackerRank'] },
          { id: 8,  title: 'Prep for Mock HR Interview',  status: 'locked',    date: null, skills: ['STAR method', 'Behavioural'] },
          { id: 9,  title: 'Resume & LinkedIn Polish',    status: 'locked',    date: null, skills: ['ATS', 'Projects', 'Keywords'] },
        ],
      },
      {
        phase: 'Phase 4', title: 'Advanced', duration: 'Weeks 13 – 16', status: 'locked',
        steps: [
          { id: 10, title: 'Advanced System Design',       status: 'locked',   date: null, skills: ['Microservices', 'Kafka', 'Docker'] },
          { id: 11, title: 'Company-specific Preparation', status: 'locked',   date: null, skills: ['TCS', 'Infosys', 'Wipro'] },
          { id: 12, title: 'Final Mock Placement Drive',   status: 'locked',   date: null, skills: ['Full simulation'] },
        ],
      },
    ],
  },
  data: {
    label: 'Data Analyst',
    skills: [
      { label: 'Python / R',     pct: 65, color: 'bg-purple-500'   },
      { label: 'Statistics',     pct: 55, color: 'bg-blue-500'     },
      { label: 'SQL',            pct: 72, color: 'bg-primary'      },
      { label: 'Visualisation',  pct: 40, color: 'bg-green-500'    },
      { label: 'Machine Learning', pct: 20, color: 'bg-amber-500'  },
    ],
    milestones: [
      {
        phase: 'Phase 1', title: 'Foundations', duration: 'Weeks 1 – 4', status: 'completed',
        steps: [
          { id: 1, title: 'Python Basics',           status: 'completed',   date: 'Oct 10', skills: ['Pandas', 'NumPy', 'Matplotlib'] },
          { id: 2, title: 'SQL & Databases',         status: 'completed',   date: 'Oct 20', skills: ['Joins', 'Aggregations', 'Window Functions'] },
        ],
      },
      {
        phase: 'Phase 2', title: 'Analytics', duration: 'Weeks 5 – 8', status: 'in-progress',
        steps: [
          { id: 3, title: 'Exploratory Data Analysis', status: 'in-progress', date: null, skills: ['Seaborn', 'Plotly', 'Hypothesis Testing'] },
          { id: 4, title: 'Statistics & Probability',  status: 'locked',      date: null, skills: ['Distributions', 'Regression'] },
        ],
      },
      {
        phase: 'Phase 3', title: 'ML Basics', duration: 'Weeks 9 – 12', status: 'locked',
        steps: [
          { id: 5, title: 'Supervised Learning',  status: 'locked', date: null, skills: ['Scikit-learn', 'Decision Trees'] },
          { id: 6, title: 'Model Evaluation',     status: 'locked', date: null, skills: ['ROC', 'Cross-validation'] },
        ],
      },
      {
        phase: 'Phase 4', title: 'Deployment', duration: 'Weeks 13 – 16', status: 'locked',
        steps: [
          { id: 7, title: 'Dashboard Building',  status: 'locked', date: null, skills: ['Power BI', 'Tableau', 'Streamlit'] },
          { id: 8, title: 'Portfolio Project',   status: 'locked', date: null, skills: ['Capstone', 'GitHub'] },
        ],
      },
    ],
  },
  devops: {
    label: 'DevOps Engineer',
    skills: [
      { label: 'Linux / Shell',  pct: 60, color: 'bg-orange-500'   },
      { label: 'Docker',         pct: 45, color: 'bg-blue-500'     },
      { label: 'CI/CD',          pct: 30, color: 'bg-primary'      },
      { label: 'Cloud (AWS)',    pct: 25, color: 'bg-amber-500'    },
      { label: 'Kubernetes',     pct: 15, color: 'bg-red-400'      },
    ],
    milestones: [
      {
        phase: 'Phase 1', title: 'Foundations', duration: 'Weeks 1 – 4', status: 'completed',
        steps: [
          { id: 1, title: 'Linux & Shell Scripting',  status: 'completed',   date: 'Oct 8', skills: ['Bash', 'Cron', 'File Systems'] },
          { id: 2, title: 'Version Control (Git)',    status: 'completed',   date: 'Oct 15', skills: ['Branching', 'Merge', 'GitHub'] },
        ],
      },
      {
        phase: 'Phase 2', title: 'Containers', duration: 'Weeks 5 – 8', status: 'in-progress',
        steps: [
          { id: 3, title: 'Docker Fundamentals',  status: 'in-progress', date: null, skills: ['Images', 'Volumes', 'Compose'] },
          { id: 4, title: 'CI/CD Pipelines',      status: 'locked',      date: null, skills: ['GitHub Actions', 'Jenkins'] },
        ],
      },
      {
        phase: 'Phase 3', title: 'Cloud & Orchestration', duration: 'Weeks 9 – 12', status: 'locked',
        steps: [
          { id: 5, title: 'AWS Core Services', status: 'locked', date: null, skills: ['EC2', 'S3', 'RDS', 'Lambda'] },
          { id: 6, title: 'Kubernetes',        status: 'locked', date: null, skills: ['Pods', 'Deployments', 'Services'] },
        ],
      },
      {
        phase: 'Phase 4', title: 'Monitoring & SRE', duration: 'Weeks 13 – 16', status: 'locked',
        steps: [
          { id: 7, title: 'Observability Stack', status: 'locked', date: null, skills: ['Prometheus', 'Grafana', 'ELK'] },
          { id: 8, title: 'SRE Practices',       status: 'locked', date: null, skills: ['SLOs', 'Error Budgets', 'On-call'] },
        ],
      },
    ],
  },
};

const TRACKS = [
  { id: 'sde',    label: 'Software Engineer', icon: '💻', active: 'bg-blue-50   text-blue-700   border-blue-300'   },
  { id: 'data',   label: 'Data Analyst',      icon: '📊', active: 'bg-purple-50 text-purple-700 border-purple-300' },
  { id: 'devops', label: 'DevOps Engineer',   icon: '⚙️', active: 'bg-orange-50 text-orange-700 border-orange-300' },
];

const COMPANIES = [
  { name: 'TCS',       logo: '🏢', pkg: '3.5 LPA',  slots: 120, deadline: 'Nov 15' },
  { name: 'Infosys',   logo: '🔷', pkg: '3.6 LPA',  slots: 80,  deadline: 'Nov 20' },
  { name: 'Wipro',     logo: '🟠', pkg: '3.5 LPA',  slots: 60,  deadline: 'Nov 25' },
  { name: 'Cognizant', logo: '🔵', pkg: '4.0 LPA',  slots: 45,  deadline: 'Dec 2'  },
  { name: 'HCL',       logo: '🟢', pkg: '3.8 LPA',  slots: 55,  deadline: 'Dec 5'  },
  { name: 'Accenture', logo: '🔺', pkg: '4.5 LPA',  slots: 35,  deadline: 'Dec 10' },
];

const RESOURCES = [
  { icon: '📘', title: 'Cracking the Coding Interview', type: 'Book',     tag: 'bg-blue-50 text-blue-600'   },
  { icon: '🎥', title: 'System Design Primer',          type: 'Video',    tag: 'bg-red-50 text-red-500'     },
  { icon: '💡', title: 'LeetCode Top 150',              type: 'Practice', tag: 'bg-amber-50 text-amber-600' },
  { icon: '📝', title: 'Resume Templates',              type: 'Template', tag: 'bg-green-50 text-green-600' },
];

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const phaseRingColor = { completed: 'bg-green-500', 'in-progress': 'bg-primary', locked: 'bg-gray-300' };
const phaseBadge     = { completed: 'bg-green-100 text-green-700', 'in-progress': 'bg-blue-100 text-primary', locked: 'bg-gray-100 text-gray-500' };
const phaseLabel     = { completed: 'Completed', 'in-progress': 'In Progress', locked: 'Locked' };

const StepDot = ({ status }) => {
  if (status === 'completed')
    return (
      <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  if (status === 'in-progress')
    return (
      <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm ring-4 ring-primary/20">
        <div className="w-2.5 h-2.5 bg-white rounded-full" />
      </span>
    );
  return (
    <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="#9ca3af" strokeWidth="2"/>
        <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </span>
  );
};

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
const CareerRoadmapPage = () => {
  const navigate = useNavigate();
  const [trackId, setTrackId]           = useState('sde');
  const [openPhases, setOpenPhases]     = useState({ 'Phase 1': false, 'Phase 2': true, 'Phase 3': false, 'Phase 4': false });

  const track = TRACK_DATA[trackId];
  const allSteps = track.milestones.flatMap((m) => m.steps);
  const doneCount = allSteps.filter((s) => s.status === 'completed').length;
  const overallPct = Math.round((doneCount / allSteps.length) * 100);

  const togglePhase = (phase) =>
    setOpenPhases((p) => ({ ...p, [phase]: !p[phase] }));

  const activeTrackObj = TRACKS.find((t) => t.id === trackId);

  return (
    <DashboardLayout>

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Career Roadmap</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-xl">
          Personalized, data-driven pathways highlighting required skills, certifications,
          and milestones for your engineering career.
        </p>
      </div>

      {/* ── Track selector ── */}
      <div className="flex flex-wrap gap-2.5 mb-7">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTrackId(t.id); setOpenPhases({ 'Phase 1': false, 'Phase 2': true, 'Phase 3': false, 'Phase 4': false }); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200
              ${trackId === t.id
                ? `${t.active} shadow-sm`
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
            {trackId === t.id && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="ml-0.5">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ════════════════════════════════════
            LEFT + CENTRE  (2 cols on xl)
        ════════════════════════════════════ */}
        <div className="xl:col-span-2 space-y-4">

          {/* ── Overall progress card ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Overall Progress</p>
                <p className="text-xs text-gray-400 mt-0.5">{activeTrackObj.icon} {track.label} Track</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-primary leading-none">{overallPct}%</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{doneCount} / {allSteps.length} steps</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${overallPct}%` }}
              />
            </div>

            {/* Phase markers */}
            <div className="grid grid-cols-4 gap-2">
              {track.milestones.map((m) => (
                <button
                  key={m.phase}
                  onClick={() => togglePhase(m.phase)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={`w-3 h-3 rounded-full ring-2 ring-white shadow ${phaseRingColor[m.status]}`} />
                  <span className={`text-[10px] font-semibold transition-colors group-hover:text-primary
                    ${m.status === 'completed' ? 'text-green-600' : m.status === 'in-progress' ? 'text-primary' : 'text-gray-400'}`}>
                    {m.phase}
                  </span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full hidden sm:inline-block ${phaseBadge[m.status]}`}>
                    {phaseLabel[m.status]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Phase accordion ── */}
          {track.milestones.map((phase) => {
            const isOpen = openPhases[phase.phase];
            const doneInPhase = phase.steps.filter((s) => s.status === 'completed').length;

            return (
              <div
                key={phase.phase}
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all duration-200
                  ${phase.status === 'in-progress' ? 'border-primary/30' : 'border-gray-200'}`}
              >
                {/* Phase header button */}
                <button
                  onClick={() => togglePhase(phase.phase)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Phase status ring */}
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${phaseRingColor[phase.status]}`} />

                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900">{phase.phase}: {phase.title}</p>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${phaseBadge[phase.status]}`}>
                          {phaseLabel[phase.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {phase.duration} &nbsp;·&nbsp;
                        <span className={phase.status === 'locked' ? 'text-gray-400' : 'text-primary font-medium'}>
                          {doneInPhase}/{phase.steps.length} complete
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Mini step progress + chevron */}
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <div className="hidden sm:flex gap-1">
                      {phase.steps.map((s) => (
                        <div
                          key={s.id}
                          className={`w-2 h-2 rounded-full
                            ${s.status === 'completed'   ? 'bg-green-500'
                            : s.status === 'in-progress' ? 'bg-primary'
                            : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <svg
                      width="15" height="15" viewBox="0 0 24 24" fill="none"
                      className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>

                {/* Phase steps */}
                {isOpen && (
                  <div className="px-5 pb-6 border-t border-gray-100">
                    <div className="pt-4 space-y-0">
                      {phase.steps.map((step, si) => (
                        <div key={step.id} className="flex gap-4">
                          {/* Timeline column */}
                          <div className="flex flex-col items-center flex-shrink-0 w-6">
                            <StepDot status={step.status} />
                            {si < phase.steps.length - 1 && (
                              <div className={`w-0.5 flex-1 mt-1.5 ${step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'}`}
                                style={{ minHeight: '32px' }}
                              />
                            )}
                          </div>

                          {/* Step content */}
                          <div className={`flex-1 pb-5 ${si === phase.steps.length - 1 ? 'pb-0' : ''}`}>
                            {/* Title row */}
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <p className={`text-sm font-semibold leading-snug
                                ${step.status === 'locked' ? 'text-gray-400' : 'text-gray-900'}`}>
                                {step.title}
                              </p>
                              {step.status === 'in-progress' && (
                                <span className="text-[9px] bg-primary text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                                  Next Up
                                </span>
                              )}
                              {step.date && (
                                <span className="text-[10px] text-green-600 font-medium ml-auto flex items-center gap-1">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Completed {step.date}
                                </span>
                              )}
                            </div>

                            {/* Skill tags */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {step.skills.map((sk) => (
                                <span
                                  key={sk}
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border
                                    ${step.status === 'locked'
                                      ? 'bg-gray-50 text-gray-400 border-gray-200'
                                      : step.status === 'completed'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-primary/5 text-primary border-primary/20'}`}
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>

                            {/* Action link */}
                            {step.status === 'in-progress' && (
                              <button
                                onClick={() => navigate('/dashboard/aptitude')}
                                className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline mt-0.5"
                              >
                                Continue Learning
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            )}
                            {step.status === 'completed' && (
                              <button
                                onClick={() => navigate('/dashboard/quizzes')}
                                className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold hover:underline mt-0.5"
                              >
                                View Results
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ════════════════════════════════════
            RIGHT COLUMN
        ════════════════════════════════════ */}
        <div className="space-y-5">

          {/* ── Skill Readiness ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Skill Readiness</h3>
              <span className="text-[10px] text-primary font-semibold bg-primary/5 px-2 py-0.5 rounded-full">
                {activeTrackObj.icon} {activeTrackObj.label}
              </span>
            </div>
            <div className="space-y-3.5">
              {track.skills.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-gray-700 font-medium">{s.label}</span>
                    <span className={`font-bold ${s.pct >= 70 ? 'text-green-600' : s.pct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {s.pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full transition-all duration-700`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Upcoming Drives ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Upcoming Drives</h3>
              <span className="text-[10px] bg-red-50 text-red-500 font-semibold px-2 py-0.5 rounded-full">
                {COMPANIES.length} open
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {COMPANIES.map((c) => (
                <div key={c.name} className="flex items-center gap-3 py-2.5 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer group">
                  <span className="text-xl flex-shrink-0">{c.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.pkg} &nbsp;·&nbsp; {c.slots} slots</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-red-500 font-bold">{c.deadline}</p>
                    <p className="text-[9px] text-gray-400">Deadline</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Recommended Resources ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Recommended Resources</h3>
            <div className="space-y-1.5">
              {RESOURCES.map((r) => (
                <div
                  key={r.title}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <span className="text-xl flex-shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">
                      {r.title}
                    </p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block ${r.tag}`}>
                      {r.type}
                    </span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-gray-300 group-hover:text-primary flex-shrink-0 transition-colors">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default CareerRoadmapPage;
