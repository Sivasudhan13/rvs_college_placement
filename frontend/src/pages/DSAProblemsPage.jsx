import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { dsaAPI } from '../services/dsaApi';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const CATEGORIES = [
  'All','Arrays','Strings','Linked List','Stack','Queue','Hashing',
  'Two Pointers','Sliding Window','Binary Search','Recursion','Backtracking',
  'Trees','Binary Search Tree','Heap','Priority Queue','Graphs',
  'Dynamic Programming','Greedy','Bit Manipulation','Sorting','Searching','Math',
];

const diffColor = { Easy:'text-green-600 bg-green-50', Medium:'text-yellow-600 bg-yellow-50', Hard:'text-red-600 bg-red-50' };
const diffDot   = { Easy:'bg-green-500', Medium:'bg-yellow-500', Hard:'bg-red-500' };

const Spin = () => (
  <div className="flex justify-center py-20">
    <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

const DSAProblemsPage = () => {
  const navigate = useNavigate();
  const [problems,   setProblems]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [category,   setCategory]   = useState('All');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [progress,   setProgress]   = useState(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 30 };
      if (search)     params.search     = search;
      if (difficulty !== 'All') params.difficulty = difficulty;
      if (category   !== 'All') params.category   = category;

      const [probRes, progRes] = await Promise.all([
        dsaAPI.getProblems(params),
        dsaAPI.getMyProgress().catch(() => ({ data: { progress: null } })),
      ]);

      setProblems(probRes.data.problems || []);
      setTotal(probRes.data.total || 0);
      setTotalPages(probRes.data.totalPages || 1);
      setProgress(progRes.data.progress);
    } catch { toast.error('Failed to load problems'); }
    finally  { setLoading(false); }
  }, [search, difficulty, category]);

  useEffect(() => { setPage(1); load(1); }, [search, difficulty, category]);

  const totalSolved = progress
    ? (progress.easySolved || 0) + (progress.mediumSolved || 0) + (progress.hardSolved || 0)
    : 0;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DSA Problems</h1>
          <p className="text-sm text-gray-500 mt-1">{total} problems · {totalSolved} solved</p>
        </div>
        {/* Mini progress */}
        {progress && (
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <div className="flex gap-3 text-xs">
              <span className="text-green-600 font-semibold">{progress.easySolved} Easy</span>
              <span className="text-yellow-600 font-semibold">{progress.mediumSolved} Med</span>
              <span className="text-red-600 font-semibold">{progress.hardSolved} Hard</span>
            </div>
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min((totalSolved / (progress.totalProblems || 100)) * 100, 100)}%` }}/>
            </div>
            <span className="text-xs font-bold text-primary">{totalSolved}/{progress.totalProblems || 100}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400 flex-shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Search problems…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"/>
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>
        {/* Difficulty */}
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap
                ${difficulty === d ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>
              {d}
            </button>
          ))}
        </div>
        {/* Category */}
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none cursor-pointer hover:border-primary transition-colors shadow-sm">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Problem table */}
      {loading ? <Spin/> : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-1 text-right">Rate</div>
          </div>

          <div className="divide-y divide-gray-50">
            {problems.map((prob) => (
              <div key={prob._id}
                onClick={() => navigate(`/dsa/${prob.slug}`)}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors group items-center">

                {/* Order */}
                <div className="col-span-1 text-center text-sm text-gray-400 font-medium">{prob.order}</div>

                {/* Status */}
                <div className="col-span-1 flex justify-center">
                  {prob.isSolved ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#10b981"/>
                      <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : prob.isAttempted ? (
                    <div className="w-3 h-3 rounded-full border-2 border-yellow-400"/>
                  ) : (
                    <div className="w-3 h-3 rounded-full border-2 border-gray-300"/>
                  )}
                </div>

                {/* Title */}
                <div className="col-span-5">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                    {prob.title}
                  </p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(prob.tags || []).slice(0,3).map(tag => (
                      <span key={tag} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2 text-xs text-gray-500 truncate">{prob.category}</div>

                {/* Difficulty */}
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${diffColor[prob.difficulty]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${diffDot[prob.difficulty]}`}/>
                    {prob.difficulty}
                  </span>
                </div>

                {/* Acceptance Rate */}
                <div className="col-span-1 text-right text-xs text-gray-400">
                  {prob.totalSubmissions > 0
                    ? `${Math.round((prob.acceptedSubmissions / prob.totalSubmissions) * 100)}%`
                    : '—'}
                </div>
              </div>
            ))}
          </div>

          {problems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="opacity-30">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-sm font-medium">No problems found</p>
              <button onClick={() => { setSearch(''); setDifficulty('All'); setCategory('All'); }}
                className="text-xs text-primary hover:underline">Clear filters</button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 py-4 border-t border-gray-100">
              <button onClick={() => { setPage(p => Math.max(1,p-1)); load(Math.max(1,page-1)); }}
                disabled={page===1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:border-primary hover:text-primary transition-colors">← Prev</button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button onClick={() => { setPage(p => Math.min(totalPages,p+1)); load(Math.min(totalPages,page+1)); }}
                disabled={page===totalPages}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:border-primary hover:text-primary transition-colors">Next →</button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DSAProblemsPage;
