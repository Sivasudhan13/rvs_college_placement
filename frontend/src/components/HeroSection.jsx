import React from 'react';
import { useNavigate } from 'react-router-dom';
import heroImg from '../assets/hero/college.jpeg';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full overflow-hidden bg-gray-50" style={{ minHeight: '420px' }}>

      {/* ── Background college image (right ~60 %) ── */}
      <div className="absolute inset-0 flex">
        {/* white fade on left */}
        <div className="w-full md:w-2/5 bg-white flex-shrink-0" />
        {/* image */}
        <div className="hidden md:block flex-1 relative">
          <img
            src={heroImg}
            alt="RVSCET Campus"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              // fallback gradient if image missing
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* left-to-right fade overlay so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent" />
        </div>
      </div>

      {/* ── Mobile background image (full bleed, very faded) ── */}
      <div className="absolute inset-0 md:hidden">
        <img
          src={heroImg}
          alt=""
          className="w-full h-full object-cover object-center opacity-10"
          aria-hidden="true"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="max-w-lg">

          {/* Accreditation badge */}
          <span className="inline-flex items-center gap-1.5 border border-yellow-400 text-yellow-600 text-xs font-semibold px-3 py-1 rounded-full bg-yellow-50 mb-6">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            NBA &amp; NAAC A+ Accredited
          </span>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Empowering Your{' '}
            <span className="text-primary">Engineering</span>{' '}
            Journey.
          </h1>

          {/* Sub-text */}
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-8 max-w-sm">
            The Academic Excellence Portal provides a structured, comprehensive
            suite of tools designed to{' '}
            <span className="text-primary font-medium">elevate your technical skills</span>,
            prepare you for placements, and guide your career roadmap with unwavering{' '}
            <span className="text-primary font-medium">reliability</span>.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded transition-colors duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Login to Portal
            </button>

            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 border border-primary text-primary bg-white hover:bg-primary hover:text-white text-sm font-semibold px-5 py-2.5 rounded transition-colors duration-200"
            >
              Register Now
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
