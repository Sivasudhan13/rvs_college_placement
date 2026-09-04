 import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ────────────────────────────────────────
   NAV ITEMS
────────────────────────────────────────── */
const navItems = [
  {
    group: null,
    items: [{
      label: 'Dashboard', path: '/dashboard', exact: true,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>,
    }],
  },

  /* ── DSA ── */
  {
    group: 'dsa', label: 'DSA Platform',
    items: [
      { label: 'Problems',    path: '/dsa',              exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
      { label: 'My Progress', path: '/dsa/progress',     exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
      { label: 'Leaderboard', path: '/dsa/leaderboard',  exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
      { label: 'Submissions', path: '/dsa/submissions',  exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="22 2 11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    ],
  },

  /* ── Assessments ── */
  {
    group: 'quiz', label: 'Assessments',
    items: [
      { label: 'Quizzes',      path: '/dashboard/quizzes', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="17" r=".8" fill="currentColor"/></svg> },
      { label: 'Aptitude Hub', path: '/aptitude',          exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26A7 7 0 0 0 19 9c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><path d="M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
      { label: 'Test History', path: '/aptitude/history', exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    ],
  },
  /* ── Mock Tests ── */
  {
    group: 'mocktests', label: 'Mock Tests',
    items: [
      { label: 'All Tests',    path: '/student/mock-tests',         exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.8"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> },
      { label: 'My History',   path: '/student/mock-tests/history', exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
      { label: 'Notifications',path: '/student/notifications',      exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    ],
  },

  /* ── Attendance — admin/faculty only ── */
  {
    group: 'attendance', label: 'Attendance', adminOnly: true,
    items: [
      { label: 'Dashboard',    path: '/attendance',          exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
      { label: 'Mark Attendance', path: '/attendance/mark',  exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
      { label: 'History',      path: '/attendance/history', exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
      { label: 'Reports',      path: '/attendance/reports', exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4"  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="6"  y1="20" x2="6"  y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
      { label: 'Low Attendance', path: '/attendance/low',  exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
    ],
  },

  /* ── Placement — admin/faculty only ── */
  {
    group: 'placement', label: 'Placement', adminOnly: true,
    items: [
      { label: 'Dashboard',      path: '/placement',              exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
      { label: 'Companies',      path: '/placement/companies',   exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
      { label: 'Upcoming Drives',path: '/placement/drives',      exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
      { label: 'Telecalling',    path: '/placement/telecalling', exact: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    ],
  },

  /* ── Tools ── */
  {
    group: 'tools', label: 'Tools',
    items: [
      { label: 'Task Manager', path: '/dashboard/tasks', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    ],
  },

  /* ── Career ── */
  {
    group: 'career', label: 'Career',
    items: [
      { label: 'Career Roadmap', path: '/dashboard/roadmap',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
      { label: 'HR Prep',        path: '/dashboard/hr-prep',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    ],
  },
];

/* ────────────────────────────────────────
   COMPONENT
────────────────────────────────────────── */
const DashboardSidebar = ({ mobileOpen, onClose }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose}/>
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-56 bg-[#0c1929] flex flex-col z-40
        transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* ── Brand ── */}
        <div className="px-5 pt-5 pb-3 border-b border-white/10">
          <button onClick={() => handleNav('/home')} className="text-left focus:outline-none w-full">
            <p className="text-white font-bold text-sm leading-tight">RVS CET</p>
            <p className="text-gray-500 text-[10px] mt-0.5">Academic Portal</p>
          </button>
        </div>

        {/* ── Quick actions ── */}
        <div className="px-3 py-2.5 border-b border-white/10">
          <button onClick={() => handleNav('/dsa')}
            className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-bold py-1.5 rounded transition-colors">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            DSA Problems
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.filter(section =>
            // adminOnly sections only visible to admin and faculty
            !section.adminOnly || ['admin','faculty'].includes(user?.role)
          ).map((section, si) => (
            <div key={si} className={si > 0 ? 'pt-1' : ''}>
              {/* Section group label */}
              {section.label && (
                <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 select-none">
                  {section.label}
                </p>
              )}

              {section.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 text-left
                    ${isActive(item)
                      ? 'bg-primary/20 text-white font-semibold'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                  {/* Active dot */}
                  {isActive(item) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"/>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Admin link (admin only) ── */}
        {user?.role === 'admin' && (
          <div className="px-2 pb-1">
            <button
              onClick={() => handleNav('/admin')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left
                ${location.pathname.startsWith('/admin')
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 1l3 6 6 1-4.5 4.5 1 6L12 16l-5.5 2.5 1-6L3 8l6-1 3-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Admin Panel</span>
            </button>
          </div>
        )}

        {/* ── Bottom: user info + logout ── */}
        <div className="border-t border-white/10 px-3 py-3">
          {/* User info */}
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary-light flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-gray-500 text-[9px] truncate">{user?.role}</p>
            </div>
          </div>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
