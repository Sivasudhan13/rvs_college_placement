import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardNavbar  from '../components/DashboardNavbar';
import { useAuth }      from '../context/AuthContext';
import { dashboardAPI, taskAPI, quizAPI as quizAPIService } from '../services/api';

/* ── small helpers ── */
const StatCard = ({ label, value, sub, accent }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-1.5 h-full rounded-r-xl ${accent}`}/>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-4xl font-extrabold text-gray-900 leading-none">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

/* ── Welcome + Daily Challenge + Stat cards ── */
const WelcomeSection = ({ user, stats }) => {
  const navigate = useNavigate();
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0] || 'Alex'}!</h1>
      <p className="text-sm text-gray-500 mt-0.5">Ready for your next challenge?</p>

      <div className="mt-5 flex flex-col lg:flex-row gap-4">
        {/* Daily Challenge card */}
        <div className="flex-1 rounded-xl p-6 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0c1929 0%,#1a3a52 60%,#0c5273 100%)' }}>
          <div className="inline-flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-[10px] font-semibold px-2.5 py-1 rounded-full mb-4 uppercase tracking-wide">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Daily Challenge
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold mb-2 leading-tight">Reverse Linked List II</h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-6">
            Medium difficulty. Focus on pointer manipulation and edge cases when reversing a{' '}
            <span className="text-yellow-300 underline underline-offset-2">sublist</span>.
          </p>
          <button onClick={() => navigate('/dashboard/ide')}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            Launch IDE
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none"/>
          <div className="absolute -bottom-10 right-10 w-28 h-28 rounded-full bg-primary/20 pointer-events-none"/>
        </div>

        {/* Stat cards */}
        <div className="flex flex-row lg:flex-col gap-4 lg:w-52">
          <div className="flex-1 lg:flex-none">
            <StatCard label="Assessment Progress" value={`${stats?.assessmentProgress ?? 0}%`} sub="+7% this week" accent="bg-primary"/>
          </div>
          <div className="flex-1 lg:flex-none">
            <StatCard label="Tasks Completed" value={`${stats?.tasksCompleted ?? 0}`} sub={`/ ${stats?.tasksTotal ?? 0} this week`} accent="bg-green-400"/>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Priority Tasks ── */
const PriorityTasks = ({ tasks, onToggle }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-bold text-gray-900">Priority Tasks</h3>
        <p className="text-xs text-gray-400 mt-0.5">Stay on top of your schedule</p>
      </div>
    </div>
    <div className="space-y-3">
      {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No pending tasks 🎉</p>}
      {tasks.map((task) => (
        <div key={task._id || task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
          <button onClick={() => onToggle(task._id || task.id)}
            className="flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 border-gray-300 group-hover:border-primary flex items-center justify-center transition-colors"/>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-snug">{task.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{task.category}</p>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0
            ${task.priority === 'High' ? 'bg-red-100 text-red-600' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
            {task.priority}
          </span>
        </div>
      ))}
    </div>
  </div>
);

/* ── Assessment cards ── */
const quizzesFallback = [
  { id: 1, title: 'TCS NQT Pattern Mock Test',   category: 'Aptitude',      difficulty: 'Medium', duration: 90, borderColor: 'border-t-blue-500',   categoryColor: 'bg-blue-100 text-blue-700',   status: 'Not Started' },
  { id: 2, title: 'Core Java Concepts Quiz',       category: 'Technical',     difficulty: 'Easy',   duration: 30, borderColor: 'border-t-green-500',  categoryColor: 'bg-green-100 text-green-700', status: 'Not Started' },
  { id: 3, title: 'Behavioral Interview Prep',     category: 'HR / Soft Skills', difficulty: 'Medium', duration: 45, borderColor: 'border-t-red-500',  categoryColor: 'bg-red-100 text-red-700',     status: 'Not Started' },
  { id: 4, title: 'Weekly DSA Contest',            category: 'Coding',        difficulty: 'Hard',   duration: 120, borderColor: 'border-t-purple-500', categoryColor: 'bg-purple-100 text-purple-700', status: 'Upcoming' },
];

const diffColor = { Easy: 'bg-green-100 text-green-600', Medium: 'bg-yellow-100 text-yellow-600', Hard: 'bg-red-100 text-red-600' };
const borderMap  = { Aptitude: 'border-t-blue-500', Technical: 'border-t-green-500', 'HR / Soft Skills': 'border-t-red-500', Coding: 'border-t-purple-500', Reasoning: 'border-t-orange-500' };
const catColor   = { Aptitude: 'bg-blue-100 text-blue-700', Technical: 'bg-green-100 text-green-700', 'HR / Soft Skills': 'bg-red-100 text-red-700', Coding: 'bg-purple-100 text-purple-700', Reasoning: 'bg-orange-100 text-orange-700' };

const AssessmentsSection = ({ quizzes }) => {
  const navigate = useNavigate();
  const list = quizzes.length ? quizzes : quizzesFallback;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Assessments &amp; Quizzes</h2>
        <button onClick={() => navigate('/dashboard/assessments')} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
          View All <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {list.slice(0, 4).map((q) => (
          <div key={q._id || q.id} className={`bg-white border border-gray-200 border-t-4 ${borderMap[q.category] || 'border-t-gray-400'} rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${catColor[q.category] || 'bg-gray-100 text-gray-600'}`}>{q.category}</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${diffColor[q.difficulty] || 'bg-gray-100 text-gray-500'}`}>{q.difficulty}</span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 leading-snug mb-2 flex-1">{q.title}</h4>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                {q.duration} mins
              </div>
              <button onClick={() => navigate('/dashboard/quizzes')} className="text-xs font-semibold text-primary hover:underline">Start</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── ROOT ── */
const DashboardPage = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats,  setStats]  = useState(null);
  const [tasks,  setTasks]  = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, taskRes, quizRes] = await Promise.all([
          dashboardAPI.getStats(),
          taskAPI.getAll({ status: 'Todo' }),
          quizAPIService.getAll(),
        ]);
        setStats(dashRes.data.data);
        setTasks(taskRes.data.tasks?.slice(0, 3) || []);
        setQuizzes(quizRes.data.quizzes?.slice(0, 4) || []);
      } catch {
        // Use fallback data silently
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, []);

  const handleTaskToggle = async (id) => {
    try {
      await taskAPI.updateStatus(id, 'Completed');
      setTasks((prev) => prev.filter((t) => (t._id || t.id) !== id));
    } catch { /* silent */ }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardNavbar onMenuToggle={() => setSidebarOpen((v) => !v)}/>
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {loadingData ? (
            <div className="flex items-center justify-center h-48">
              <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : (
            <>
              <WelcomeSection user={user} stats={stats}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Career Roadmap teaser */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">Career Roadmap</h3>
                    <button onClick={() => navigate('/dashboard/roadmap')} className="text-xs text-primary hover:underline">View All →</button>
                  </div>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"/><span>Data Structures Mastery — Completed Oct 12</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary animate-pulse"/><span className="text-primary font-medium">Dynamic Programming — In Progress</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-300"/><span className="text-gray-400">System Design Basics — Locked</span></div>
                  </div>
                </div>
                <PriorityTasks tasks={tasks} onToggle={handleTaskToggle}/>
              </div>
              <AssessmentsSection quizzes={quizzes}/>
            </>
          )}
        </main>
        <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-gray-700">RVS CET</p>
              <p className="text-[10px] text-gray-400">© 2024 RVS College of Engineering &amp; Technology. All rights reserved.</p>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              {['Privacy Policy','Terms of Service','Campus Map','Contact'].map((item) => (
                <a key={item} href="#" className="text-[11px] text-gray-500 hover:text-primary hover:underline whitespace-nowrap">{item}</a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
