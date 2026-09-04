import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { quizAPI } from '../services/api';

/* ─── colour maps ──────────────────────── */
const CAT_COLOR = {
  Aptitude:         { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-t-blue-500',   badge: 'bg-blue-100 text-blue-700'   },
  Technical:        { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-t-green-500',  badge: 'bg-green-100 text-green-700'  },
  'HR / Soft Skills':{ bg: 'bg-red-50',   icon: 'text-red-500',    border: 'border-t-red-500',    badge: 'bg-red-100 text-red-700'      },
  Coding:           { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-t-purple-500', badge: 'bg-purple-100 text-purple-700' },
  Reasoning:        { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-t-orange-500', badge: 'bg-orange-100 text-orange-700' },
};
const DIFF_COLOR = {
  Easy:   'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard:   'bg-red-100 text-red-700',
};
const CAT_ICONS = {
  Aptitude:          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M14 17.5h7M17.5 14v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Technical:         <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  'HR / Soft Skills': <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Coding:            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 8l-2 2 2 2M17 8l2 2-2 2M13 7l-2 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Reasoning:         <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26A7 7 0 0 0 19 9c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><path d="M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
};
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const CATEGORIES   = ['All', 'Aptitude', 'Technical', 'HR / Soft Skills', 'Coding', 'Reasoning'];

/* ─── Spinner ───────────────────────────── */
const Spin = () => (
  <div className="flex justify-center py-20">
    <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ─── Category summary cards ─────────────── */
const CategoryCards = ({ quizzes, onSelect }) => {
  const summary = CATEGORIES.slice(1).map((cat) => {
    const list = quizzes.filter((q) => q.category === cat);
    return { cat, count: list.length, c: CAT_COLOR[cat] || CAT_COLOR.Aptitude };
  }).filter((s) => s.count > 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
      {summary.map(({ cat, count, c }) => (
        <button key={cat} onClick={() => onSelect(cat)}
          className={`text-left bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group`}>
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${c.bg} ${c.icon} mb-4`}>
            {CAT_ICONS[cat]}
          </div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-bold text-gray-900">{cat}</h3>
            <span className="text-xs text-gray-400 font-medium">{count} Tests</span>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            {cat === 'Aptitude'          && 'Master foundational concepts crucial for initial screening rounds.'}
            {cat === 'Technical'         && 'Test your syntax knowledge, algorithm design and debugging skills.'}
            {cat === 'HR / Soft Skills'  && 'Simulate cultural-fit and behavioral interview rounds.'}
            {cat === 'Coding'            && 'Browser-based environment supporting multiple languages.'}
            {cat === 'Reasoning'         && 'Enhance analytical thinking and data interpretation capabilities.'}
          </p>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${c.icon} group-hover:underline`}>
            Start Practice
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
      ))}
    </div>
  );
};

/* ─── Quiz list cards ────────────────────── */
const QuizCard = ({ quiz, onStart }) => {
  const c = CAT_COLOR[quiz.category] || CAT_COLOR.Aptitude;
  return (
    <div className={`bg-white border border-gray-200 border-t-4 ${c.border} rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{quiz.category}</span>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${DIFF_COLOR[quiz.difficulty] || 'bg-gray-100 text-gray-500'}`}>
          {quiz.difficulty}
        </span>
      </div>
      <h4 className="text-sm font-bold text-gray-900 leading-snug mb-2">{quiz.title}</h4>
      {quiz.description && <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{quiz.description}</p>}
      <div className="flex flex-wrap gap-2 mb-4">
        {(quiz.tags || []).map((tag) => (
          <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{tag}</span>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          {quiz.duration} mins
        </span>
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/></svg>
          {quiz.totalQuestions} Qs
        </span>
      </div>
      <button onClick={() => onStart(quiz)}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
        Start Quiz →
      </button>
    </div>
  );
};

/* ─── Main Page ──────────────────────────── */
const QuizPage = () => {
  const navigate = useNavigate();
  const [quizzes,    setQuizzes]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [difficulty,     setDifficulty]     = useState('All');
  const [search,         setSearch]         = useState('');
  const [view,           setView]           = useState('categories'); // 'categories' | 'list'

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await quizAPI.getAll();
        setQuizzes(data.quizzes || []);
      } catch { toast.error('Failed to load quizzes'); }
      finally  { setLoading(false); }
    };
    load();
  }, []);

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    setView('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = quizzes.filter((q) => {
    const matchCat  = activeCategory === 'All' || q.category === activeCategory;
    const matchDiff = difficulty === 'All' || q.difficulty === difficulty;
    const matchSrch = q.title.toLowerCase().includes(search.toLowerCase()) ||
                      (q.description || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchDiff && matchSrch;
  });

  const handleStart = (quiz) => {
    // Navigate to the attempt page with the quiz ID
    navigate(`/dashboard/quiz-attempt/${quiz._id}`, { state: { quiz } });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          {view === 'list' && (
            <button onClick={() => { setView('categories'); setActiveCategory('All'); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
          )}
          {view === 'list' && <span className="text-gray-300">/</span>}
          <h1 className="text-2xl font-bold text-gray-900">
            {view === 'categories' ? 'Quiz Practice Center' : `${activeCategory} Quizzes`}
          </h1>
        </div>
        <p className="text-sm text-gray-500 max-w-xl">
          {view === 'categories'
            ? <>Sharpen your skills with our curated collection of placement-focused quizzes across <span className="text-primary font-medium">key engineering domains</span>.</>
            : `${filtered.length} quiz${filtered.length !== 1 ? 'zes' : ''} available`}
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-7">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-gray-400 flex-shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Search quiz topics, e.g., 'Data Structures'"
            value={search} onChange={(e) => { setSearch(e.target.value); setView('list'); }}
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"/>
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => handleCategorySelect(c === 'All' ? 'All' : c)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors
                ${activeCategory === c && view === 'list'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Difficulty */}
        <div className="relative">
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none cursor-pointer hover:border-primary transition-colors pr-8 shadow-sm">
            {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
          </select>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Content */}
      {loading ? <Spin /> : (
        view === 'categories' && !search ? (
          <CategoryCards quizzes={quizzes} onSelect={handleCategorySelect}/>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="opacity-40">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p className="text-sm font-medium">No quizzes found</p>
                <button onClick={() => { setSearch(''); setActiveCategory('All'); setView('categories'); }}
                  className="text-xs text-primary hover:underline">Clear filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((q) => (
                  <QuizCard key={q._id} quiz={q} onStart={handleStart}/>
                ))}
              </div>
            )}
          </>
        )
      )}
    </DashboardLayout>
  );
};

export default QuizPage;
