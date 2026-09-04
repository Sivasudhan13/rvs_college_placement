import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const topLinks = [
  { label: 'Assessments', path: '/dashboard/assessments'  },
  { label: 'Aptitude',    path: '/dashboard/aptitude'     },
  { label: 'Roadmaps',    path: '/dashboard/roadmap'      },
  { label: 'HR Prep',     path: '/dashboard/hr-prep'      },
];

const DashboardNavbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-12 flex items-center px-4 gap-3">

      {/* Mobile hamburger */}
      <button
        className="lg:hidden flex-shrink-0 text-gray-500 hover:text-primary"
        onClick={onMenuToggle}
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Nav links (hidden on small) */}
      <nav className="hidden md:flex items-center gap-0.5 flex-shrink-0">
        {topLinks.map((l) => (
          <button
            key={l.path}
            onClick={() => navigate(l.path)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors
              ${location.pathname === l.path
                ? 'text-primary'
                : 'text-gray-600 hover:text-primary'}`}
          >
            {l.label}
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-md px-3 py-1.5 w-40 lg:w-52">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-gray-400 flex-shrink-0">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-xs text-gray-700 placeholder:text-gray-400 outline-none w-full"
        />
      </div>

      {/* Bell */}
      <NotificationBell />

      {/* Help */}
      <button className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="12" cy="17" r=".8" fill="currentColor"/>
        </svg>
      </button>

      {/* Avatar */}
      <button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
        {user?.name?.[0]?.toUpperCase() || 'U'}
      </button>

      {/* Dashboard active pill */}
      <button
        onClick={() => navigate('/dashboard')}
        className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors flex-shrink-0"
      >
        Dashboard
      </button>
    </header>
  );
};

export default DashboardNavbar;
