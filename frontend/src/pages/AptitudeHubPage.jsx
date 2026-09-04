import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { aptitudeAPI } from '../services/aptitudeApi';
import { useAuth } from '../context/AuthContext';

/* ── Colours ── */
const CAT_CONFIG = {
  'Quantitative':     { icon: '🔢', color: '#0c5273', light: 'bg-blue-50 border-blue-200',   badge: 'bg-blue-100 text-blue-700'   },
  'Logical Reasoning':{ icon: '🧠', color: '#7c3aed', light: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  'Verbal Ability':   { icon: '📖', color: '#059669', light: 'bg-green-50 border-green-200',   badge: 'bg-green-100 text-green-700'  },
};

const DIFF_COLOR = { Easy:'text-green-600 bg-green-50', Medium:'text-yellow-600 bg-yellow-50', Hard:'text-red-600 bg-red-50' };

const Spin = () => (
  <div className="flex justify-center py-20">
    <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ── Small Stat Card ── */
const StatCard = ({ label, value, accent, icon }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${accent}`}>{icon}</div>
    <div>
      <p className="text-2xl font-extrabold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
    </div>
    <div className={`absolute top-0 right-0 w-1.5 h-full rounded-r-2xl ${accent.includes('blue')?'bg-primary':accent.includes('green')?'bg-green-500':accent.includes('purple')?'bg-purple-500':'bg-amber-400'}`}/>
  </div>
);

const AptitudeHubPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [progress, setProgress] = useState(null);
  const [tests,    setTests]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [daily,    setDaily]    = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | practice | tests | leaderboard

  useEffect(() => {
    const load = async () => {
      try {
        const [progRes, testsRes, dailyRes] = await Promise.all([
          aptitudeAPI.getProgress(),
          aptitudeAPI.getTests(),
          aptitudeAPI.getDailyChallenge(),
        ]);
        setProgress(progRes.data.progress);
        setTests(testsRes.data.tests || []);
        setDaily(dailyRes.data);
      } catch { toast.error('Failed to load aptitude data'); }
      finally  { setLoading(false); }
    };
    load();
  }, []);

  const accuracy = progress && (progress.totalCorrect + progress.totalWrong) > 0
    ? Math.round((progress.totalCorrect / (progress.totalCorrect + progress.totalWrong)) * 100) : 0;

  const catChartData = (progress?.categoryStats || []).map((cs) => ({
    name: cs.category.replace(' Aptitude','').replace(' Reasoning',''),
    accuracy: cs.attempted > 0 ? Math.round((cs.correct / cs.attempted) * 100) : 0,
    attempted: cs.attempted,
  }));

  if (loading) return <DashboardLayout><Spin/></DashboardLayout>;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your aptitude practice hub — sharpen your skills daily.</p>
        </div>
        {daily && !daily.completed && (
          <button onClick={() => navigate('/aptitude/daily')}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            🔥 Daily Challenge +25pts
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-7">
        {[['overview','Overview'],['practice','Practice'],['tests','Mock Tests'],['leaderboard','Leaderboard']].map(([id,label]) => (
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
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Questions Attempted" value={progress?.totalAttempted ?? 0} accent="bg-blue-50" icon="📝"/>
            <StatCard label="Correct Answers"     value={progress?.totalCorrect ?? 0}   accent="bg-green-50" icon="✅"/>
            <StatCard label="Wrong Answers"       value={progress?.totalWrong ?? 0}     accent="bg-red-50"   icon="❌"/>
            <StatCard label="Overall Accuracy"    value={`${accuracy}%`}                accent="bg-purple-50" icon="🎯"/>
            <StatCard label="Tests Completed"     value={progress?.testsCompleted ?? 0} accent="bg-amber-50"  icon="📊"/>
            <StatCard label="Current Streak"      value={`${progress?.currentStreak ?? 0}d`} accent="bg-orange-50" icon="🔥"/>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Category cards */}
            <div className="xl:col-span-1 space-y-3">
              {Object.entries(CAT_CONFIG).map(([cat, cfg]) => {
                const cs = (progress?.categoryStats || []).find((c) => c.category === cat);
                const acc = cs && cs.attempted > 0 ? Math.round((cs.correct / cs.attempted) * 100) : 0;
                return (
                  <div key={cat}
                    className={`bg-white border-2 ${cfg.light} rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => navigate(`/aptitude/practice?category=${encodeURIComponent(cat)}`)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cfg.icon}</span>
                        <p className="text-sm font-bold text-gray-900">{cat}</p>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{cs?.attempted || 0} attempted</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width:`${acc}%`, backgroundColor: cfg.color }}/>
                      </div>
                      <span className="text-sm font-bold" style={{ color: cfg.color }}>{acc}%</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/aptitude/practice?category=${encodeURIComponent(cat)}`); }}
                        className="flex-1 text-xs font-semibold py-1.5 rounded-lg text-white transition-colors"
                        style={{ backgroundColor: cfg.color }}>
                        Start Practice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts */}
            <div className="xl:col-span-2 space-y-5">
              {/* Accuracy by category */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Accuracy by Category</h3>
                {catChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={catChartData} barSize={32}>
                      <XAxis dataKey="name" tick={{ fontSize:11, fill:'#6b7280' }} axisLine={false} tickLine={false}/>
                      <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false}/>
                      <Tooltip formatter={(v) => [`${v}%`, 'Accuracy']} contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid #e5e7eb' }}/>
                      <Bar dataKey="accuracy" radius={[6,6,0,0]}>
                        {catChartData.map((_, i) => <Cell key={i} fill={Object.values(CAT_CONFIG)[i]?.color || '#0c5273'}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                    No data yet — start practicing!
                  </div>
                )}
              </div>

              {/* Score details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Best Test Score</p>
                  <p className="text-3xl font-extrabold text-primary">{progress?.bestScore ?? 0}%</p>
                  <p className="text-xs text-gray-400 mt-1">Avg: {progress?.avgScore ?? 0}%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Total Points</p>
                  <p className="text-3xl font-extrabold text-amber-500">{progress?.totalPoints ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Longest streak: {progress?.longestStreak ?? 0}d</p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily challenge card */}
          {daily && (
            <div className={`border rounded-2xl p-5 ${daily.completed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">🔥 Daily Aptitude Challenge</p>
                  <p className="text-xs text-gray-500 mt-0.5">{daily.date} · 5 Questions · +25 Points</p>
                </div>
                {daily.completed ? (
                  <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1.5 rounded-full">✓ Completed</span>
                ) : (
                  <button onClick={() => navigate('/aptitude/daily')}
                    className="bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    Start Now →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ PRACTICE ══ */}
      {activeTab === 'practice' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500 mb-2">Choose a category to start practising.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.entries(CAT_CONFIG).map(([cat, cfg]) => {
              const cs = (progress?.categoryStats || []).find((c) => c.category === cat);
              const acc = cs && cs.attempted > 0 ? Math.round((cs.correct / cs.attempted) * 100) : 0;
              return (
                <div key={cat} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <div className="text-4xl mb-4">{cfg.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{cat}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {cat === 'Quantitative'      && 'Numbers, algebra, geometry, data interpretation & more.'}
                    {cat === 'Logical Reasoning' && 'Series, puzzles, blood relations, direction sense & more.'}
                    {cat === 'Verbal Ability'    && 'Synonyms, grammar, comprehension, sentence correction & more.'}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${acc}%`, backgroundColor: cfg.color }}/>
                    </div>
                    <span className="text-xs font-bold" style={{ color: cfg.color }}>{acc}% acc</span>
                  </div>
                  <div className="space-y-2">
                    <button onClick={() => navigate(`/aptitude/practice?category=${encodeURIComponent(cat)}`)}
                      className="w-full text-sm font-semibold py-2.5 rounded-xl text-white transition-colors"
                      style={{ backgroundColor: cfg.color }}>
                      Start Practice →
                    </button>
                    <button onClick={() => navigate(`/aptitude/practice?category=${encodeURIComponent(cat)}&difficulty=Hard`)}
                      className="w-full text-xs font-semibold py-2 rounded-xl border-2 transition-colors"
                      style={{ borderColor: cfg.color, color: cfg.color }}>
                      Hard Questions Only
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ MOCK TESTS ══ */}
      {activeTab === 'tests' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">Select a mock test to begin.</p>
            <button onClick={() => navigate('/aptitude/history')}
              className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              View History →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {tests.map((test) => (
              <div key={test._id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    test.category === 'Full' ? 'bg-primary/10 text-primary'
                    : test.category === 'Quantitative' ? 'bg-blue-100 text-blue-700'
                    : test.category === 'Logical Reasoning' ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                  }`}>{test.category}</span>
                  {test.company && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{test.company}</span>}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{test.name}</h3>
                <p className="text-xs text-gray-500 mb-4">{test.description}</p>
                <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="font-bold text-gray-800">{test.totalQuestions}</p>
                    <p className="text-gray-400 mt-0.5">Questions</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="font-bold text-gray-800">{test.duration}m</p>
                    <p className="text-gray-400 mt-0.5">Duration</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="font-bold text-gray-800">-{test.negativeMarks}</p>
                    <p className="text-gray-400 mt-0.5">Negative</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/aptitude/test/${test._id}`)}
                  className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  Start Test →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ LEADERBOARD ══ */}
      {activeTab === 'leaderboard' && <AptitudeLeaderboard/>}
    </DashboardLayout>
  );
};

/* ── Embedded Leaderboard ── */
const AptitudeLeaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aptitudeAPI.getLeaderboard({ limit: 20 })
      .then(({ data }) => setEntries(data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin/>;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-gradient-to-r from-primary to-cyan-500">
        <h2 className="text-base font-bold text-white">🏆 Aptitude Leaderboard</h2>
        <p className="text-xs text-white/70 mt-0.5">Ranked by total points</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Rank','User','Points','Accuracy','Questions','Tests','Streak'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((e) => {
              const isMe = e.userInfo?._id === user?.id;
              return (
                <tr key={e.rank} className={`${isMe ? 'bg-primary/5' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-4 py-3">
                    {e.rank <= 3
                      ? <span className="text-lg">{e.rank===1?'🥇':e.rank===2?'🥈':'🥉'}</span>
                      : <span className="text-sm font-bold text-gray-500">#{e.rank}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isMe ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {e.userInfo?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isMe ? 'text-primary' : 'text-gray-900'}`}>
                          {e.userInfo?.name} {isMe && <span className="text-[10px] text-primary/70">(you)</span>}
                        </p>
                        <p className="text-[10px] text-gray-400">{e.userInfo?.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="font-extrabold text-amber-500">{e.totalPoints}</span></td>
                  <td className="px-4 py-3"><span className={`font-semibold ${e.accuracy>=70?'text-green-600':e.accuracy>=50?'text-yellow-600':'text-red-500'}`}>{e.accuracy}%</span></td>
                  <td className="px-4 py-3 text-gray-600">{e.totalAttempted}</td>
                  <td className="px-4 py-3 text-gray-600">{e.testsCompleted}</td>
                  <td className="px-4 py-3"><span className="text-orange-500 font-semibold">{e.currentStreak}d 🔥</span></td>
                </tr>
              );
            })}
            {!entries.length && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">No rankings yet. Start practicing!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AptitudeHubPage;
