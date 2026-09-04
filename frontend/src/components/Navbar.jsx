import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const navLinks = [
  { label: 'Assessments', href: '/assessments' },
  { label: 'Aptitude',    href: '/aptitude'    },
  { label: 'Coding',      href: '/coding'      },
  { label: 'Roadmaps',    href: '/roadmaps'    },
  { label: 'HR Prep',     href: '/hr-prep'     },
];

const Navbar = ({ onDashboard }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href) => location.pathname === href;

  return (
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* ── Brand ── */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1 focus:outline-none"
          >
            <span className="text-primary font-bold text-base sm:text-lg tracking-tight leading-none">
              RVSCET
            </span>
            <span className="text-gray-700 font-semibold text-base sm:text-lg tracking-tight leading-none">
              &nbsp;Career Hub
            </span>
          </button>

          {/* ── Desktop nav links ── */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <button
                  onClick={() => navigate(link.href)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors duration-150
                    ${isActive(link.href)
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-primary'}`}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* ── Right-side icons + Dashboard ── */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Bell */}
            <button className="hidden sm:flex items-center justify-center w-8 h-8 text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-gray-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Help */}
            <button className="hidden sm:flex items-center justify-center w-8 h-8 text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-gray-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </button>

            {/* Avatar */}
            <button className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-bold uppercase">
              ST
            </button>

            {/* Dashboard button */}
            <button
              onClick={onDashboard ?? (() => navigate('/dashboard'))}
              className="bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded transition-colors duration-200"
            >
              Dashboard
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 text-gray-600"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-current transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
          <ul className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <button
                  onClick={() => { navigate(link.href); setMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors
                    ${isActive(link.href) ? 'text-primary bg-primary/5' : 'text-gray-700 hover:text-primary hover:bg-gray-50'}`}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
          {/* Mobile icons row */}
          <div className="flex items-center gap-4 px-3 pt-3 border-t border-gray-100 mt-2">
            <span className="text-xs text-gray-500">Notifications</span>
            <span className="text-xs text-gray-500">Help</span>
            <span className="text-xs text-gray-500 font-semibold">ST</span>
          </div>
        </div>
      )}
    </nav>
  );
};

Navbar.propTypes = {
  onDashboard: PropTypes.func,
};

export default Navbar;
