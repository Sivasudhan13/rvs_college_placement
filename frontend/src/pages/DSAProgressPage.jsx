import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { dsaAPI } from '../services/dsaApi';

const ACHIEVEMENTS_META = {
  first_solve:   { icon: '🎯', label: 'First Solve',    desc: 'Solved your first problem' },
  solve_10:      { icon: '🔥', label: '10 Problems',    desc: 'Solved 10 problems' },
  solve_25:      { icon: '⭐', label: '25 Problems',    desc: 'Solved 25 problems' },
  solve_50:      { icon: '💎', label: '50 Problems',    desc: 'Solved 50 problems' },
  solve_100:     { icon: '🏆', label: '100 Problems',   desc: 'Solved 100 problems' },
  streak_10:     { icon: '🌊', label: '10-Day Streak',  desc: 'Maintained a 10-day streak' },
  streak_30:     { icon: '🌙', label: '30-Day Streak',  desc: 'Maintained a 30-day streak' },
  easy_master:   { icon: '🟢', label: 'Easy Master',    desc: 'Solved 20+ Easy problems' },
  medium_master: { icon: '🟡', label: 'Medium Master',  desc: 'Solved 20+ Medium problems' },
  hard_master:   { icon: '🔴', label: 'Hard Master',    desc: 'Solved 10+ Hard problems' },
};

const Spin = () => (
  <div className="flex justify-center py-20">
    <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ── Radial donut for difficulty ── */
const DonutRing = ({ pct, color, size = 80, stroke = 8 }) => {
  const r  = (size - stroke) / 2;
  const c  = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}/>
    </svg>
  );
};

/* ── Stat card ── */
const StatCard = ({ label, value, sub, accent }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-1.5 h-full rounded-r-2xl ${accent}`}/>
    <p className="text-3xl font-extrabold text-gray-900 leading-none">{value}</p>
    <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const DSAProgressPage = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | solved | achievements

  useEffect(() => {
    dsaAPI.getMyProgress()
      .then(({ data }) => setProgress(data.progress))
      .catch(() => toast.error('Failed to load progress'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><Spin/></DashboardLayout>;
  if (!progress) return <DashboardLayout><p className="text-gray-400 text-sm">No progress data yet. Start solving problems!</p></DashboardLayout>;

  const totalSolved   = (progress.easySolved || 0) + (progress.mediumSolved || 0) + (progress.hardSolved || 0);
  const totalProblems = progress.totalProblems || 100;
  const overallPct    = Math.round((totalSolved / totalProblems) * 100);
  const easyPct       = Math.round(((progress.easySolved || 0)  / Math.max(progress.easyTotal   || 40, 1)) * 100);
  const medPct        = Math.round(((progress.mediumSolved || 0)/ Math.max(progress.mediumTotal || 40, 1)) * 100);
  const hardPct       = Math.round(((progress.hardSolved || 0)  / Math.max(progress.hardTotal   || 20, 1)) * 100);
  const accRate       = progress.acceptanceRate || 0;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DSA Progress</h1>
          <p className="text-sm text-gray-500 mt-1">Your coding journey at a glance.</p>
        </div>
        <button onClick={() => navigate('/dsa')}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
          </svg>
          Solve Problems
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-7">
        {[['overview','Overview'],['solved','Solved Problems'],['achievements','Achievements']].map(([id,label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${activeTab===id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main progress card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Overall donut */}
              <div className="relative flex-shrink-0">
                <DonutRing pct={overallPct} color="#0c5273" size={120} stroke={12}/>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-gray-900">{totalSolved}</span>
                  <span className="text-xs text-gray-400">/ {totalProblems}</span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-1">DSA Progress</h2>
                <p className="text-sm text-gray-500 mb-4">{overallPct}% of problems solved</p>
                {/* Difficulty breakdown */}
                <div className="space-y-2.5">
                  {[
                    { label:'Easy',   solved: progress.easySolved||0,   total: progress.easyTotal||40,   color:'bg-green-500', pct: easyPct  },
                    { label:'Medium', solved: progress.mediumSolved||0, total: progress.mediumTotal||40, color:'bg-yellow-400', pct: medPct  },
                    { label:'Hard',   solved: progress.hardSolved||0,   total: progress.hardTotal||20,   color:'bg-red-500',   pct: hardPct },
                  ].map(d => (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-14 flex-shrink-0 ${d.label==='Easy'?'text-green-600':d.label==='Medium'?'text-yellow-600':'text-red-600'}`}>{d.label}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${d.color} rounded-full transition-all duration-700`} style={{ width:`${d.pct}%` }}/>
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0">{d.solved} / {d.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Total Submissions" value={progress.totalSubmissions||0} accent="bg-primary"/>
            <StatCard label="Accepted"           value={progress.acceptedSubmissions||0} accent="bg-green-400"/>
            <StatCard label="Acceptance Rate"    value={`${accRate}%`} accent="bg-blue-400"/>
            <StatCard label="Current Streak"     value={`${progress.currentStreak||0}d`} sub="days" accent="bg-amber-400"/>
            <StatCard label="Longest Streak"     value={`${progress.longestStreak||0}d`} sub="days" accent="bg-purple-400"/>
          </div>

          {/* Score + Streak visual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Score card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Score Breakdown</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-extrabold text-primary">{progress.score||0}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>Easy × 10pts = <strong className="text-gray-700">{(progress.easySolved||0)*10}</strong></p>
                  <p>Medium × 25pts = <strong className="text-gray-700">{(progress.mediumSolved||0)*25}</strong></p>
                  <p>Hard × 50pts = <strong className="text-gray-700">{(progress.hardSolved||0)*50}</strong></p>
                </div>
              </div>
            </div>

            {/* Difficulty donuts */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Difficulty Split</h3>
              <div className="flex items-center justify-around">
                {[
                  { label:'Easy',   pct:easyPct,  color:'#22c55e', solved:progress.easySolved||0   },
                  { label:'Medium', pct:medPct,   color:'#eab308', solved:progress.mediumSolved||0 },
                  { label:'Hard',   pct:hardPct,  color:'#ef4444', solved:progress.hardSolved||0   },
                ].map(d => (
                  <div key={d.label} className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <DonutRing pct={d.pct} color={d.color} size={64} stroke={7}/>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-700">{d.pct}%</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-500">{d.label}</p>
                    <p className="text-[10px] text-gray-400">{d.solved} solved</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ SOLVED PROBLEMS ══ */}
      {activeTab === 'solved' && (
        <div>
          {!progress.solvedProblems?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <span className="text-5xl">🎯</span>
              <p className="text-sm font-medium">No solved problems yet</p>
              <button onClick={() => navigate('/dsa')} className="text-xs text-primary hover:underline">Start solving →</button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide">
                <div className="col-span-5">Problem</div>
                <div className="col-span-2">Difficulty</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Language</div>
                <div className="col-span-1 text-right">Date</div>
              </div>
              <div className="divide-y divide-gray-50">
                {[...progress.solvedProblems].reverse().map((sp, i) => (
                  <div key={i}
                    onClick={() => sp.problem?.slug && navigate(`/dsa/${sp.problem.slug}`)}
                    className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors items-center">
                    <div className="col-span-5 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#10b981"/>
                        <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {sp.problem?.title || 'Unknown Problem'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-xs font-semibold ${sp.difficulty==='Easy'?'text-green-600':sp.difficulty==='Medium'?'text-yellow-600':'text-red-600'}`}>
                        {sp.difficulty}
                      </span>
                    </div>
                    <div className="col-span-2 text-xs text-gray-500 truncate">{sp.problem?.category}</div>
                    <div className="col-span-2 text-xs text-gray-500 capitalize">{sp.language}</div>
                    <div className="col-span-1 text-right text-xs text-gray-400">
                      {new Date(sp.solvedAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ACHIEVEMENTS ══ */}
      {activeTab === 'achievements' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(ACHIEVEMENTS_META).map(([key, meta]) => {
              const earned = (progress.achievements || []).includes(key);
              return (
                <div key={key} className={`border rounded-2xl p-5 flex items-start gap-4 transition-all ${earned ? 'bg-white border-amber-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${earned ? 'bg-amber-50' : 'bg-gray-100'}`}>
                    {earned ? meta.icon : '🔒'}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${earned ? 'text-gray-900' : 'text-gray-500'}`}>{meta.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
                    {earned && <p className="text-[10px] text-amber-600 font-semibold mt-1">✓ Earned</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DSAProgressPage;
