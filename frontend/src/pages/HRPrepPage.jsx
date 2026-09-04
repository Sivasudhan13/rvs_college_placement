import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const hrCategories = [
  {
    id: 'behavioral',
    icon: '🗣️',
    title: 'Behavioral Questions',
    desc: 'STAR method answers for common HR interview questions.',
    count: 50,
    color: 'border-t-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'situational',
    icon: '🎯',
    title: 'Situational Judgement',
    desc: 'Scenario-based questions to test decision-making and values.',
    count: 30,
    color: 'border-t-green-500',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'company',
    icon: '🏢',
    title: 'Company-Specific Prep',
    desc: 'Tailored question banks for TCS, Infosys, Wipro, Accenture & more.',
    count: 120,
    color: 'border-t-purple-500',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'resume',
    icon: '📄',
    title: 'Resume & Profile Review',
    desc: 'Tips to optimize your resume, LinkedIn and academic portal profile.',
    count: 20,
    color: 'border-t-amber-500',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
];

const starQuestions = [
  {
    id: 1,
    question: 'Tell me about yourself.',
    tips: ['Keep it under 2 minutes', 'Focus on academics, skills and career goals', "End with why you're interested in this company"],
    sample: 'I am a final-year Computer Science student at RVSCET with a CGPA of 8.4. I have hands-on experience in Java and Python through academic projects. I am particularly passionate about problem-solving and have solved 200+ LeetCode problems. I am eager to join your organization because of its strong training programs and growth opportunities.',
  },
  {
    id: 2,
    question: 'Describe a challenge you faced and how you overcame it.',
    tips: ['Use the STAR framework (Situation, Task, Action, Result)', 'Choose a real academic or project challenge', 'Quantify results where possible'],
    sample: 'During my third year, our team faced a critical bug two days before our project demo (Situation). I was responsible for the backend module (Task). I stayed up late, debugged systematically using logs, and identified a concurrency issue (Action). We fixed it in time and scored 95% in the evaluation (Result).',
  },
  {
    id: 3,
    question: 'Where do you see yourself in 5 years?',
    tips: ['Align with the company\'s growth path', 'Show ambition but stay realistic', 'Mention skills you want to develop'],
    sample: 'In five years, I see myself as a skilled software engineer with expertise in cloud technologies and system design. I aim to take on leadership responsibilities within a team and contribute to meaningful products. I believe joining your organization will accelerate this journey through structured learning and real-world exposure.',
  },
  {
    id: 4,
    question: 'Why should we hire you?',
    tips: ['Highlight unique strengths', 'Connect skills to the job requirements', 'Show enthusiasm for the role'],
    sample: 'I bring a strong foundation in data structures and algorithms, combined with hands-on project experience in full-stack development. I am a quick learner, team player, and I am particularly motivated by solving complex problems. My track record of consistent academic performance and active participation in coding contests demonstrates my drive and commitment.',
  },
  {
    id: 5,
    question: 'What are your strengths and weaknesses?',
    tips: ['For strengths: pick relevant ones and back them with examples', 'For weakness: show self-awareness and what you\'re doing to improve', 'Avoid clichés like "I work too hard"'],
    sample: 'My key strength is analytical thinking — I break down complex problems systematically, which helped me score in the top 10% in aptitude assessments. My weakness is that I sometimes over-analyse decisions. I am actively working on this by setting time limits for my decision-making process during practice interviews.',
  },
];

const companies = [
  { name: 'TCS',       rounds: ['Aptitude', 'Coding', 'Technical HR', 'HR'],        tips: 'Focus on TCS NQT pattern — strong aptitude and basic coding required.' },
  { name: 'Infosys',   rounds: ['Aptitude', 'Pseudocode', 'HR'],                    tips: 'Pseudocode round is unique — practice flowchart and logic tracing.' },
  { name: 'Wipro',     rounds: ['Aptitude', 'Written Comm', 'Technical', 'HR'],     tips: 'Written communication test — practice essay and email writing.' },
  { name: 'Cognizant', rounds: ['GenC Aptitude', 'Coding', 'Technical HR', 'HR'], tips: 'Two tracks — GenC and GenC Next (for high performers).' },
  { name: 'Accenture', rounds: ['Cognitive', 'Coding', 'Communication', 'HR'],     tips: 'Communication and soft skills are heavily weighted in the final round.' },
];

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
const HRPrepPage = () => {
  const [activeTab, setActiveTab] = useState('questions');
  const [expanded, setExpanded]   = useState(null);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">HR Prep</h1>
        <p className="text-sm text-gray-500 mt-1">
          Prepare for HR interviews with curated questions, company insights, and communication tips.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-7">
        {[
          { id: 'questions', label: 'Question Bank' },
          { id: 'star',      label: 'STAR Answers'  },
          { id: 'companies', label: 'Company Guides' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${activeTab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ QUESTION BANK ══ */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {hrCategories.map((cat) => (
            <div key={cat.id} className={`bg-white border border-gray-200 border-t-4 ${cat.color} rounded-xl p-6 flex flex-col hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{cat.icon}</span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cat.badgeColor}`}>
                  {cat.count} Questions
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{cat.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-5">{cat.desc}</p>
              <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                Start Practice
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ══ STAR ANSWERS ══ */}
      {activeTab === 'star' && (
        <div className="max-w-3xl space-y-4">
          {/* STAR explainer */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-bold text-primary mb-2">The STAR Framework</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { letter: 'S', word: 'Situation', desc: 'Set the context' },
                { letter: 'T', word: 'Task',      desc: 'Your responsibility' },
                { letter: 'A', word: 'Action',    desc: 'What you did' },
                { letter: 'R', word: 'Result',    desc: 'The outcome' },
              ].map((s) => (
                <div key={s.letter} className="text-center">
                  <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-extrabold text-base mx-auto mb-1">
                    {s.letter}
                  </div>
                  <p className="text-xs font-bold text-gray-800">{s.word}</p>
                  <p className="text-[10px] text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {starQuestions.map((q) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <p className="text-sm font-semibold text-gray-900">{q.id}. {q.question}</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`text-gray-400 flex-shrink-0 ml-3 transition-transform ${expanded === q.id ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {expanded === q.id && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  {/* Tips */}
                  <div className="mt-4 mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tips</p>
                    <ul className="space-y-1">
                      {q.tips.map((tip, ti) => (
                        <li key={ti} className="flex gap-2 text-xs text-gray-600">
                          <span className="text-primary mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Sample answer */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Sample Answer</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{q.sample}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ COMPANY GUIDES ══ */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {companies.map((c) => (
            <div key={c.name} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <h3 className="text-base font-bold text-gray-900 mb-1">{c.name}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{c.tips}</p>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Interview Rounds</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {c.rounds.map((r, ri) => (
                  <div key={r} className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                      {ri + 1}
                    </span>
                    <span className="text-xs text-gray-700 font-medium">{r}</span>
                    {ri < c.rounds.length - 1 && <span className="text-gray-300 text-xs">›</span>}
                  </div>
                ))}
              </div>

              <button className="w-full flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary hover:text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                View Full Guide
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default HRPrepPage;
