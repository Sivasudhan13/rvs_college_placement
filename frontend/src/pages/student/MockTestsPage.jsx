import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { mockTestAPI } from '../../services/mockTestApi';
import toast from 'react-hot-toast';

const CATEGORIES = ['All','Aptitude','Logical Reasoning','Verbal Ability','Quantitative Aptitude','Technical','Programming','Company Specific','Mixed'];
const DIFFICULTY  = ['All','Easy','Medium','Hard'];

const diffColor = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-700', Hard: 'bg-red-100 text-red-700', Mixed: 'bg-purple-100 text-purple-700' };
const catColor  = 'bg-blue-50 text-blue-700';

function TestCard({ test, onStart }) {
  const hasAttempt  = test.attempt?.status === 'Completed';
  const inProgress  = test.attempt?.status === 'In Progress';
  const isClosed    = test.status === 'Closed';
  const isExpired   = test.endDate && new Date() > new Date(test.endDate);
  const available   = !hasAttempt && !isClosed && !isExpired;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{test.title}</h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${diffColor[test.difficulty] || diffColor.Mixed}`}>
          {test.difficulty}
        </span>
      </div>

      {test.description && <p className="text-xs text-gray-500 line-clamp-2">{test.description}</p>}

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.8"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>
          {test.totalQuestions} Questions
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          {test.duration} min
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26A7 7 0 0 0 19 9c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/></svg>
          <span className={`px-1.5 py-0 rounded text-[10px] font-medium ${catColor}`}>{test.category}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>
          Pass: {test.passingPercentage}%
        </div>
      </div>

      {test.endDate && (
        <p className="text-[11px] text-orange-600 font-medium">
          Ends: {new Date(test.endDate).toLocaleDateString('en-GB')}
        </p>
      )}

      <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
        {hasAttempt ? (
          <>
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
              Completed — {test.attempt.percentage}%
            </span>
            <button onClick={() => onStart(test._id, true)} className="text-xs text-[#0c5273] font-semibold hover:underline">
              View Result →
            </button>
          </>
        ) : inProgress ? (
          <button onClick={() => onStart(test._id)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
            Resume Test
          </button>
        ) : available ? (
          <button onClick={() => onStart(test._id)} className="w-full bg-[#0c5273] hover:bg-[#0a4561] text-white text-xs font-semibold py-2 rounded-lg transition-colors">
            Start Test →
          </button>
        ) : (
          <span className="text-xs text-gray-400 font-medium">{isExpired ? 'Test Expired' : 'Not Available'}</span>
        )}
      </div>
    </div>
  );
}

export default function MockTestsPage() {
  const navigate  = useNavigate();
  const [tests, setTests]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('All');
  const [diff, setDiff]         = useState('All');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const { data } = await mockTestAPI.getTests({ status: 'Published' });
      setTests(data.tests || []);
    } catch {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const filtered = tests.filter(t => {
    if (category !== 'All' && t.category !== category) return false;
    if (diff !== 'All' && t.difficulty !== diff) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleStart = (id, viewResult = false) => {
    if (viewResult) navigate(`/student/mock-tests/${id}/result`);
    else navigate(`/student/mock-tests/${id}`);
  };

  const stats = {
    available: tests.filter(t => !t.attempt).length,
    completed: tests.filter(t => t.attempt?.status === 'Completed').length,
    avgScore:  tests.filter(t => t.attempt?.percentage).length
      ? Math.round(tests.filter(t => t.attempt?.percentage).reduce((s,t) => s + t.attempt.percentage, 0) / tests.filter(t => t.attempt?.percentage).length)
      : 0,
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mock Tests</h1>
            <p className="text-sm text-gray-500 mt-0.5">Practice with timed assessments</p>
          </div>
          <button onClick={() => navigate('/student/mock-tests/history')}
            className="flex items-center gap-2 text-sm text-[#0c5273] font-medium border border-[#0c5273] px-4 py-2 rounded-lg hover:bg-[#0c5273]/5 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            My History
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Available', value: stats.available, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Avg Score', value: `${stats.avgScore}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tests…"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273]"/>
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={diff} onChange={e => setDiff(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20">
            {DIFFICULTY.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"/>
                <div className="h-3 bg-gray-200 rounded w-full"/>
                <div className="h-3 bg-gray-200 rounded w-1/2"/>
                <div className="h-8 bg-gray-200 rounded mt-4"/>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto text-gray-300 mb-4">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <h3 className="text-gray-500 font-medium">No tests found</h3>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => <TestCard key={t._id} test={t} onStart={handleStart}/>)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
