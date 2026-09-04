import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { aptitudeAPI } from '../services/aptitudeApi';

const STATUS_COLOR = {
  Completed:  'bg-green-100 text-green-700',
  'Timed Out':'bg-amber-100 text-amber-700',
  'In Progress':'bg-blue-100 text-blue-700',
};

const CAT_COLOR = {
  Quantitative:    'bg-blue-100 text-blue-700',
  'Logical Reasoning': 'bg-purple-100 text-purple-700',
  'Verbal Ability':'bg-green-100 text-green-700',
  Full:            'bg-primary/10 text-primary',
};

const Spin = () => (
  <div className="flex justify-center py-20">
    <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ── Mini score ring ── */
const ScoreRing = ({ pct, size = 56 }) => {
  const color = pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" width={size} height={size} className="-rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="4"/>
        <circle cx="18" cy="18" r="15.9" fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${pct} ${100 - pct}`}
          strokeLinecap="round"/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-extrabold" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
};

const AptitudeHistoryPage = () => {
  const navigate = useNavigate();
  const [attempts,   setAttempts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [filter,     setFilter]     = useState('All'); // All | Completed | Timed Out

  /* ── Load history ── */
  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await aptitudeAPI.getHistory({ page: p, limit: 10 });
      setAttempts(data.attempts || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch { toast.error('Failed to load history'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(1); }, []);

  const filtered = filter === 'All'
    ? attempts
    : attempts.filter((a) => a.status === filter);

  /* ── Summary stats from loaded page ── */
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length)
    : 0;
  const bestScore = attempts.length
    ? Math.max(...attempts.map((a) => a.percentage || 0))
    : 0;
  const completed = attempts.filter((a) => a.status === 'Completed').length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test History</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} test{total !== 1 ? 's' : ''} attempted
          </p>
        </div>
        <button
          onClick={() => navigate('/aptitude')}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + Take New Test
        </button>
      </div>

      {/* Summary cards */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tests Taken',  value: total,      accent: 'bg-primary',     icon: '📝' },
            { label: 'Completed',    value: completed,  accent: 'bg-green-500',   icon: '✅' },
            { label: 'Avg Score',    value: `${avgScore}%`, accent: 'bg-blue-500', icon: '📊' },
            { label: 'Best Score',   value: `${bestScore}%`, accent: 'bg-amber-400', icon: '🏆' },
          ].map(({ label, value, accent, icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 relative overflow-hidden flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-xl font-extrabold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
              <div className={`absolute top-0 right-0 w-1.5 h-full rounded-r-2xl ${accent}`}/>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5">
        {['All', 'Completed', 'Timed Out'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors
              ${filter === f ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* History list */}
      {loading ? <Spin/> : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
          <span className="text-6xl">📋</span>
          <p className="text-base font-medium">No test attempts yet</p>
          <button onClick={() => navigate('/aptitude')}
            className="text-sm text-primary font-semibold hover:underline">
            Start your first test →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((attempt) => {
            const mins  = Math.floor((attempt.timeTaken || 0) / 60);
            const secs  = (attempt.timeTaken || 0) % 60;
            const pct   = Math.max(0, attempt.percentage || 0);
            const date  = new Date(attempt.completedAt || attempt.createdAt);

            return (
              <div key={attempt._id}
                onClick={() => navigate(`/aptitude/result/${attempt._id}`)}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  {/* Score ring */}
                  <ScoreRing pct={pct}/>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                        {attempt.test?.name || 'Aptitude Test'}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${CAT_COLOR[attempt.test?.category] || 'bg-gray-100 text-gray-600'}`}>
                        {attempt.test?.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[attempt.status] || 'bg-gray-100 text-gray-500'}`}>
                        {attempt.status}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"/>
                        {attempt.correctAnswers} correct
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"/>
                        {attempt.wrongAnswers} wrong
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"/>
                        {attempt.skippedQuestions} skipped
                      </span>
                      <span>· {attempt.totalQuestions} total</span>
                      <span>· {mins}m {secs}s</span>
                    </div>
                  </div>

                  {/* Score + date */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className={`text-lg font-extrabold ${pct >= 60 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {Math.max(0, attempt.score || 0)}/{attempt.maxScore}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    className="text-gray-300 group-hover:text-primary transition-colors flex-shrink-0">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Category breakdown bar */}
                {(attempt.categoryStats || []).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
                    {attempt.categoryStats.map((cs) => {
                      const catAcc = cs.total > 0 ? Math.round((cs.correct / cs.total) * 100) : 0;
                      return (
                        <div key={cs.category}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-gray-500 truncate">
                              {cs.category.replace(' Aptitude','').replace(' Reasoning','').replace(' Ability','')}
                            </span>
                            <span className={`font-bold ${catAcc >= 60 ? 'text-green-600' : catAcc >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                              {catAcc}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${catAcc >= 60 ? 'bg-green-500' : catAcc >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
                              style={{ width: `${catAcc}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button onClick={() => { const p = Math.max(1, page-1); setPage(p); load(p); }} disabled={page === 1}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:border-primary hover:text-primary transition-colors">
            ← Prev
          </button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => { const p = Math.min(totalPages, page+1); setPage(p); load(p); }} disabled={page === totalPages}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:border-primary hover:text-primary transition-colors">
            Next →
          </button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AptitudeHistoryPage;
