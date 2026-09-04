import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminApi';
import toast from 'react-hot-toast';

const Spin = () => (
  <div className="flex justify-center items-center py-20">
    <svg className="animate-spin h-7 w-7 text-amber-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

const deptLabel = { cse:'CSE', ece:'ECE', eee:'EEE', me:'ME', ce:'CE', other:'Other' };
const catColor  = {
  Aptitude: 'bg-blue-100 text-blue-700', Technical: 'bg-green-100 text-green-700',
  'HR / Soft Skills': 'bg-red-100 text-red-700', Coding: 'bg-purple-100 text-purple-700', Reasoning: 'bg-orange-100 text-orange-700',
};

const KpiCard = ({ label, value, icon, gradient, sub }) => (
  <div className={`rounded-2xl p-5 text-white ${gradient} relative overflow-hidden`}>
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none"/>
    <div className="relative">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-3xl font-extrabold leading-none mb-1">{value ?? '—'}</p>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AdminOverview = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(({ data }) => setStats(data.stats))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin/>;
  if (!stats)  return null;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Platform summary and recent activity.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Students" value={stats.totalStudents}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2"/></svg>}/>
        <KpiCard label="Faculty" value={stats.totalFaculty}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 14l9-5-9-5-9 5 9 5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}/>
        <KpiCard label="Quizzes" value={stats.totalQuizzes}
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="white" strokeWidth="2"/></svg>}/>
        <KpiCard label="Submissions" value={stats.totalSubmissions}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Top performers */}
        <div className="xl:col-span-1 bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 text-xs">🏆</span>
            Top Performers
          </h3>
          {stats.topPerformers?.length === 0
            ? <p className="text-sm text-gray-400">No data yet</p>
            : (
              <div className="space-y-3">
                {(stats.topPerformers || []).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0
                      ${i===0?'bg-amber-400 text-white':i===1?'bg-gray-300 text-gray-700':i===2?'bg-orange-300 text-white':'bg-gray-100 text-gray-500'}`}>{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.user?.name}</p>
                      <p className="text-xs text-gray-400">{p.user?.studentId} · {deptLabel[p.user?.department]}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-primary">{Math.round(p.avgScore)}%</p>
                      <p className="text-[10px] text-gray-400">{p.count} tests</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Recent submissions */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs">🕐</span>
            Recent Submissions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-gray-400 font-semibold">Student</th>
                  <th className="text-left pb-2 text-gray-400 font-semibold">Quiz</th>
                  <th className="text-right pb-2 text-gray-400 font-semibold">Score</th>
                  <th className="text-right pb-2 text-gray-400 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentSubmissions || []).map((s, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {s.user?.name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{s.user?.name}</p>
                          <p className="text-gray-400">{s.user?.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-gray-600 max-w-[180px]">
                      <p className="truncate">{s.quiz?.title}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${catColor[s.quiz?.category]||'bg-gray-100 text-gray-500'}`}>{s.quiz?.category}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`text-sm font-bold ${s.percentage>=60?'text-green-600':'text-red-500'}`}>{s.percentage}%</span>
                    </td>
                    <td className="py-2.5 text-right text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!stats.recentSubmissions?.length && (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400">No submissions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quizzes by category */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Quiz Distribution by Category</h3>
        <div className="flex flex-wrap gap-3">
          {(stats.quizzesByCategory||[]).map((c) => (
            <div key={c._id} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${catColor[c._id]||'bg-gray-100 text-gray-700'}`}>
              <span className="text-sm font-bold">{c._id}</span>
              <span className="text-xs opacity-70 bg-white/40 rounded-full px-2 py-0.5 font-semibold">{c.count}</span>
            </div>
          ))}
          {!stats.quizzesByCategory?.length && <p className="text-sm text-gray-400">No quizzes yet</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
