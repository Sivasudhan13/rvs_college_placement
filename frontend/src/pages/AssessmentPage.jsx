import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { quizAPI } from '../services/api';

const tabs        = ['All', 'Aptitude', 'Technical', 'HR / Soft Skills', 'Coding'];
const diffFilters = ['All', 'Easy', 'Medium', 'Hard'];

const borderMap = { Aptitude: 'border-t-blue-500', Technical: 'border-t-green-500', 'HR / Soft Skills': 'border-t-red-500', Coding: 'border-t-purple-500', Reasoning: 'border-t-orange-500' };
const catColor  = { Aptitude: 'bg-blue-100 text-blue-700', Technical: 'bg-green-100 text-green-700', 'HR / Soft Skills': 'bg-red-100 text-red-700', Coding: 'bg-purple-100 text-purple-700', Reasoning: 'bg-orange-100 text-orange-700' };
const diffColor = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-700', Hard: 'bg-red-100 text-red-700' };

const StatCard = ({ label, value, sub, accent }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden">
    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${accent}`}/>
    <p className="text-2xl font-extrabold text-gray-900 pl-2">{value}</p>
    <p className="text-xs font-semibold text-gray-400 pl-2 mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 pl-2">{sub}</p>}
  </div>
);

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [quizzes,    setQuizzes]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');
  const [search,     setSearch]     = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await quizAPI.getAll();
        setQuizzes(data.quizzes || []);
      } catch {
        // fallback handled by empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = quizzes.filter((q) => {
    const matchTab  = activeTab === 'All' || q.category === activeTab;
    const matchDiff = diffFilter === 'All' || q.difficulty === diffFilter;
    const matchSrch = q.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchDiff && matchSrch;
  });

  const stats = {
    total:      quizzes.length,
    easy:       quizzes.filter((q) => q.difficulty === 'Easy').length,
    medium:     quizzes.filter((q) => q.difficulty === 'Medium').length,
    hard:       quizzes.filter((q) => q.difficulty === 'Hard').length,
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assessments &amp; Quizzes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your progress and attempt <span className="text-primary font-medium">placement-ready assessments</span>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        <StatCard label="Total"  value={stats.total}  sub="assessments" accent="bg-primary"/>
        <StatCard label="Easy"   value={stats.easy}   sub="questions"   accent="bg-green-400"/>
        <StatCard label="Medium" value={stats.medium} sub="questions"   accent="bg-yellow-400"/>
        <StatCard label="Hard"   value={stats.hard}   sub="questions"   accent="bg-red-400"/>
      </div>

      {/* Search + difficulty */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-gray-400 flex-shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Search assessments..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {diffFilters.map((d) => (
            <button key={d} onClick={() => setDiffFilter(d)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${diffFilter === d ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-40">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-medium">No assessments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((q) => (
            <div key={q._id} className={`bg-white border border-gray-200 border-t-4 ${borderMap[q.category] || 'border-t-gray-400'} rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${catColor[q.category] || 'bg-gray-100 text-gray-600'}`}>{q.category}</span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${diffColor[q.difficulty] || 'bg-gray-100 text-gray-500'}`}>{q.difficulty}</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 leading-snug mb-2">{q.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{q.description}</p>
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  {q.duration} mins
                </span>
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/></svg>
                  {q.totalQuestions} Qs
                </span>
              </div>
              <button onClick={() => navigate(`/dashboard/quizzes`)}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
                Start
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AssessmentPage;
