import React from 'react';
import { useNavigate } from 'react-router-dom';

/* ── individual card data ── */
const features = [
  {
    id: 'assessments',
    icon: (
      /* clipboard-list */
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="2" stroke="#0c5273" strokeWidth="1.8"/>
        <path d="M9 7h6M9 11h6M9 15h4" stroke="#0c5273" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M9 2v2h6V2" stroke="#0c5273" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-blue-50',
    title: 'Comprehensive Assessments',
    description:
      'Rigorous, structured evaluation modules designed to test core engineering competencies and track continuous academic growth across multiple semesters.',
    link: { label: 'View Modules →', href: '/assessments' },
    linkColor: 'text-primary',
    border: 'border-gray-200',
  },
  {
    id: 'aptitude',
    icon: (
      /* brain / aptitude */
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="5" stroke="#16a34a" strokeWidth="1.8"/>
        <path d="M7.75 13.5C5.68 14.54 4 16.6 4 19h16c0-2.4-1.68-4.46-3.75-5.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M9 8h.01M12 6h.01M15 8h.01" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: 'bg-green-50',
    title: 'Aptitude Training',
    description:
      'Quantitative and qualitative reasoning exercises simulating top-tier placement examinations.',
    link: null,
    linkColor: '',
    border: 'border-gray-200',
  },
  {
    id: 'coding',
    icon: (
      /* code brackets */
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <polyline points="16 18 22 12 16 6" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="8 6 2 12 8 18"   stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-red-50',
    title: 'Coding IDE',
    description:
      'Browser-based, robust development environment supporting multiple languages for immediate algorithmic practice.',
    descriptionHighlight: true,
    link: null,
    linkColor: '',
    border: 'border-red-200',
  },
  {
    id: 'roadmap',
    icon: (
      /* trending-up / roadmap */
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="#0c5273" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="17 6 23 6 23 12" stroke="#0c5273" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-blue-50',
    title: 'Career Roadmap',
    description:
      'Personalized, data-driven pathways highlighting required skills, certifications, and milestones for specific engineering disciplines and corporate roles.',
    link: null,
    linkColor: '',
    border: 'border-gray-200',
    hasChart: true,
  },
];

/* ── tiny sparkline/chart decoration for Career Roadmap card ── */
const MiniChart = () => (
  <div className="absolute bottom-4 right-4 opacity-60 pointer-events-none">
    <svg width="90" height="55" viewBox="0 0 90 55" fill="none">
      <rect width="90" height="55" rx="4" fill="#f0f9ff"/>
      <polyline
        points="8,44 20,34 32,36 44,22 56,24 68,12 80,8"
        stroke="#0c5273" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <circle cx="80" cy="8" r="3" fill="#0c5273"/>
      {/* x-axis labels */}
      <text x="6"  y="53" fontSize="5" fill="#94a3b8">Jan</text>
      <text x="28" y="53" fontSize="5" fill="#94a3b8">Mar</text>
      <text x="50" y="53" fontSize="5" fill="#94a3b8">Jun</text>
      <text x="72" y="53" fontSize="5" fill="#94a3b8">Sep</text>
    </svg>
    <p className="text-center text-gray-400 mt-0.5" style={{fontSize:'7px'}}>
      Skill Progression Career Registry
    </p>
  </div>
);

const FeatureCards = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Integrated Learning Tools
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Systematic progression through{' '}
            <span className="text-primary font-medium">academic rigor</span>.
          </p>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
          {features.map((f) => (
            <div
              key={f.id}
              className={`relative border ${f.border} rounded-xl p-6 bg-white hover:shadow-md transition-shadow duration-200 overflow-hidden`}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-lg ${f.iconBg} mb-4`}>
                {f.icon}
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {f.title}
              </h3>

              {/* Description */}
              {f.descriptionHighlight ? (
                <p className="text-sm text-gray-500 leading-relaxed pr-24">
                  <span className="text-primary font-medium">
                    Browser-based, robust development environment
                  </span>{' '}
                  supporting multiple languages for immediate{' '}
                  <span className="text-primary font-medium">
                    algorithmic practice
                  </span>.
                </p>
              ) : (
                <p className="text-sm text-gray-500 leading-relaxed pr-24 sm:pr-0">
                  {f.description}
                </p>
              )}

              {/* Optional link */}
              {f.link && (
                <button
                  onClick={() => navigate(f.link.href)}
                  className={`mt-4 text-xs font-semibold ${f.linkColor} hover:underline flex items-center gap-1`}
                >
                  {f.link.label}
                </button>
              )}

              {/* Career Roadmap mini chart decoration */}
              {f.hasChart && <MiniChart />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
