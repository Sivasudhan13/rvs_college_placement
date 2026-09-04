import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

/* ──────────────────────────────────────────
   DATA – 20 sample questions
────────────────────────────────────────── */
const QUESTIONS = [
  {
    id: 1,
    text: "If a 9-digit number 985x3678y is divisible by 72, then the value of (4x − 3y) is:",
    code: null,
    options: ['A.  5', 'B.  4', 'C.  6', 'D.  3'],
    answer: 1,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 2,
    text: "A train travels 360 km at a uniform speed. If the speed had been 5 km/h more, it would have taken 1 hour less. Find the original speed of the train.",
    code: null,
    options: ['A.  40 km/h', 'B.  45 km/h', 'C.  36 km/h', 'D.  50 km/h'],
    answer: 0,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 3,
    text: "What is the remainder when 7¹⁰⁰ is divided by 24?",
    code: null,
    options: ['A.  1', 'B.  7', 'C.  3', 'D.  5'],
    answer: 0,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 4,
    text: "The LCM of two numbers is 2310 and their HCF is 30. If one number is 210, what is the other?",
    code: null,
    options: ['A.  310', 'B.  330', 'C.  315', 'D.  300'],
    answer: 1,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 5,
    text: "If x + 1/x = 5, find the value of x³ + 1/x³.",
    code: null,
    options: ['A.  110', 'B.  125', 'C.  95', 'D.  100'],
    answer: 0,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 6,
    text: "A can do a piece of work in 10 days and B can do it in 15 days. In how many days can they finish if they work together?",
    code: null,
    options: ['A.  5 days', 'B.  6 days', 'C.  7 days', 'D.  8 days'],
    answer: 1,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 7,
    text: "The difference between simple and compound interest for 2 years at 10% p.a. on ₹5000 is:",
    code: null,
    options: ['A.  ₹50', 'B.  ₹100', 'C.  ₹75', 'D.  ₹25'],
    answer: 0,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 8,
    text: "If the radius of a circle is increased by 50%, what is the percentage increase in its area?",
    code: null,
    options: ['A.  100%', 'B.  125%', 'C.  50%', 'D.  75%'],
    answer: 1,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 9,
    text: "A shopkeeper sells an article for ₹720, making a profit of 20%. Find the cost price.",
    code: null,
    options: ['A.  ₹580', 'B.  ₹600', 'C.  ₹620', 'D.  ₹640'],
    answer: 1,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 10,
    text: "In how many ways can the letters of the word 'LEADER' be arranged?",
    code: null,
    options: ['A.  360', 'B.  720', 'C.  240', 'D.  480'],
    answer: 0,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 11,
    text: "Find the next term in the series: 2, 6, 12, 20, 30, __",
    code: null,
    options: ['A.  40', 'B.  42', 'C.  44', 'D.  46'],
    answer: 1,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 12,
    text: "Three numbers are in ratio 3:4:5 and their LCM is 2400. Find their sum.",
    code: null,
    options: ['A.  480', 'B.  520', 'C.  540', 'D.  560'],
    answer: 0,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 13,
    text: "What is the value of log₂(512)?",
    code: null,
    options: ['A.  7', 'B.  8', 'C.  9', 'D.  6'],
    answer: 2,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 14,
    text: "If 20% of (A + B) = 30% of (A − B), then what percent of B is A?",
    code: null,
    options: ['A.  400%', 'B.  500%', 'C.  300%', 'D.  250%'],
    answer: 1,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 15,
    text: "A vessel contains a mixture of milk and water in the ratio 5:2. If 14 litres of the mixture is replaced by 14 litres of milk, the ratio becomes 7:2. Find the original quantity.",
    code: null,
    options: ['A.  63 L', 'B.  70 L', 'C.  56 L', 'D.  84 L'],
    answer: 0,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 16,
    text: "Two pipes A and B can fill a tank in 20 and 30 minutes respectively. If both are opened together and B is closed after 10 minutes, how long will A take to fill the remainder?",
    code: null,
    options: ['A.  6⅔ min', 'B.  8 min', 'C.  10 min', 'D.  5 min'],
    answer: 0,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 17,
    text: "Find the area of a triangle whose sides are 13 cm, 14 cm and 15 cm.",
    code: null,
    options: ['A.  84 cm²', 'B.  90 cm²', 'C.  78 cm²', 'D.  96 cm²'],
    answer: 0,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 18,
    text: "In a class of 60 students, 40% play cricket and 30% play football. If 15% play both, what percentage plays neither?",
    code: null,
    options: ['A.  40%', 'B.  45%', 'C.  35%', 'D.  50%'],
    answer: 1,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 19,
    text: "The compound interest on a sum for 2 years at 10% per annum, compounded annually, is ₹2100. Find the principal.",
    code: null,
    options: ['A.  ₹9,000', 'B.  ₹10,000', 'C.  ₹8,000', 'D.  ₹11,000'],
    answer: 1,
    marks: 4,
    negativeMarks: 1,
  },
  {
    id: 20,
    text: "A man rows downstream 32 km and upstream 14 km, taking 6 hours each time. Find the speed of the current.",
    code: null,
    options: ['A.  1.5 km/h', 'B.  2 km/h', 'C.  2.5 km/h', 'D.  3 km/h'],
    answer: 0,
    marks: 4,
    negativeMarks: 1,
  },
];

const TOTAL_SECONDS = 24 * 60 + 28; // 24:28 from screenshot

/* status colours for navigator */
const STATUS = {
  answered:    'bg-[#0c5273] text-white',
  notVisited:  'border border-gray-300 text-gray-500 bg-white',
  notAnswered: 'bg-pink-200 text-gray-700',
  marked:      'bg-[#0c5273]/70 text-white',
  current:     'ring-2 ring-primary bg-white text-primary font-bold',
};

/* ──────────────────────────────────────────
   COMPONENT
────────────────────────────────────────── */
const QuizAttemptPage = () => {
  const navigate   = useNavigate();
  const { id }     = useParams();

  const [current,   setCurrent]   = useState(11); // 0-based; shows Q12
  const [answers,   setAnswers]   = useState({});  // { qIndex: optionIndex }
  const [marked,    setMarked]    = useState(new Set());
  const [visited,   setVisited]   = useState(new Set([11]));
  const [seconds,   setSeconds]   = useState(TOTAL_SECONDS);
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  /* ── countdown ── */
  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); handleSubmit(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submitted]);

  const pad = (n) => String(n).padStart(2, '0');
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  /* ── navigate to question ── */
  const goTo = (idx) => {
    setVisited((v) => new Set([...v, idx]));
    setCurrent(idx);
  };

  /* ── select answer ── */
  const selectAnswer = (optIdx) => {
    setAnswers((a) => ({ ...a, [current]: optIdx }));
  };

  /* ── mark for review ── */
  const toggleMark = () => {
    setMarked((m) => {
      const n = new Set(m);
      n.has(current) ? n.delete(current) : n.add(current);
      return n;
    });
  };

  /* ── submit ── */
  const handleSubmit = useCallback((auto = false) => {
    setSubmitted(true);
    const correct = QUESTIONS.filter((q, i) => answers[i] === q.answer).length;
    const wrong   = Object.keys(answers).length - correct;
    const score   = correct * 4 - wrong * 1;
    toast.success(`Quiz submitted! Score: ${score}/${QUESTIONS.length * 4}`);
    setShowResult({ correct, wrong, score, total: QUESTIONS.length });
  }, [answers]);

  /* ── status for navigator ── */
  const getStatus = (idx) => {
    if (idx === current)           return STATUS.current;
    if (marked.has(idx))           return STATUS.marked;
    if (answers[idx] !== undefined) return STATUS.answered;
    if (visited.has(idx))          return STATUS.notAnswered;
    return STATUS.notVisited;
  };

  const answeredCount   = Object.keys(answers).length;
  const notVisitedCount = QUESTIONS.length - visited.size;
  const notAnsweredCount= [...visited].filter((i) => answers[i] === undefined).length;
  const markedCount     = marked.size;

  const q = QUESTIONS[current];

  /* ──────── RESULT SCREEN ──────── */
  if (showResult) {
    const { correct, wrong, score } = showResult;
    const pct = Math.round((correct / QUESTIONS.length) * 100);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#0c5273" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22 4 12 14.01 9 11.01" stroke="#0c5273" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Quiz Complete!</h2>
          <p className="text-sm text-gray-500 mb-6">Quantitative Aptitude: Number Systems</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-600">{correct}</p>
              <p className="text-xs text-gray-500 mt-1">Correct</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-red-500">{wrong}</p>
              <p className="text-xs text-gray-500 mt-1">Wrong</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-3">
              <p className="text-2xl font-bold text-primary">{score}</p>
              <p className="text-xs text-gray-500 mt-1">Score</p>
            </div>
          </div>

          <div className="h-2 bg-gray-100 rounded-full mb-1 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mb-7">{pct}% accuracy</p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard/aptitude')}
              className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Hub
            </button>
            <button
              onClick={() => { setSubmitted(false); setShowResult(false); setAnswers({}); setVisited(new Set([0])); setCurrent(0); setSeconds(TOTAL_SECONDS); }}
              className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ──────── QUIZ SCREEN ──────── */
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-12 flex items-center gap-4 sticky top-0 z-20">
        {/* Quiz icon + title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-primary flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="text-sm font-semibold text-gray-800 truncate">
            Quantitative Aptitude: Number Systems
          </span>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-sm font-bold flex-shrink-0
          ${seconds < 300 ? 'border-red-400 text-red-500 bg-red-50' : 'border-gray-300 text-gray-700'}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {pad(mins)}:{pad(secs)}
        </div>

        {/* Exit */}
        <button
          onClick={() => navigate('/dashboard/aptitude')}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-semibold flex-shrink-0"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Exit
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ════ LEFT: Question panel ════ */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 p-4 sm:p-6 max-w-3xl">

            {/* Question header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-primary">Question {current + 1}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                  +{q.marks} Marks
                </span>
                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                  -{q.negativeMarks} Negative
                </span>
              </div>
            </div>

            {/* Question text */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed">
                {/* highlight inline code spans */}
                {q.text.split(/(\b985x3678y\b|\(4x − 3y\))/g).map((part, i) =>
                  /985x3678y|\(4x − 3y\)/.test(part)
                    ? <code key={i} className="font-mono bg-gray-100 px-1 rounded text-primary">{part}</code>
                    : part
                )}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, oi) => {
                const isSelected = answers[current] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => selectAnswer(oi)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border text-sm font-medium text-left transition-all duration-150
                      ${isSelected
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5'}`}
                  >
                    {/* radio circle */}
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? 'border-white' : 'border-gray-400'}`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Bottom navigation bar ── */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <button
              onClick={() => goTo(Math.max(0, current - 1))}
              disabled={current === 0}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Previous
            </button>

            <button
              onClick={toggleMark}
              className={`flex items-center gap-1.5 border text-xs font-semibold px-4 py-2 rounded-lg transition-colors
                ${marked.has(current)
                  ? 'border-amber-400 bg-amber-50 text-amber-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {marked.has(current) ? 'Marked' : 'Mark for Review'}
            </button>

            <button
              onClick={() => {
                if (current < QUESTIONS.length - 1) goTo(current + 1);
              }}
              disabled={current === QUESTIONS.length - 1}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save &amp; Next
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ════ RIGHT: Question Navigator ════ */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Question Navigator</h3>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
            {[
              { color: 'bg-[#0c5273]',      label: `Answered (${answeredCount})` },
              { color: 'border border-gray-300 bg-white', label: `Not Visited (${notVisitedCount})` },
              { color: 'bg-pink-200',        label: `Not Answered (${notAnsweredCount})` },
              { color: 'bg-[#0c5273]/60',    label: `Marked (${markedCount})` },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${l.color}`} />
                <span className="text-[10px] text-gray-500 leading-tight">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {QUESTIONS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`w-9 h-9 rounded text-xs font-semibold flex items-center justify-center transition-all ${getStatus(idx)}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Submit */}
          <button
            onClick={() => handleSubmit(false)}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-[#0c5273] hover:bg-primary-dark text-white text-sm font-bold py-3 rounded-xl transition-colors duration-200 shadow-sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Submit Quiz
          </button>
        </aside>
      </div>
    </div>
  );
};

export default QuizAttemptPage;
