import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { quizAPI } from '../services/api';

/* ── timer helpers ── */
const pad = (n) => String(n).padStart(2, '0');

/* ── legend entry ── */
const LegendDot = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${color}`}/>
    <span className="text-[10px] text-gray-500 leading-tight">{label}</span>
  </div>
);

/* ── Result screen ── */
const ResultScreen = ({ result, quiz, onRetry, onBack }) => {
  const pct = Math.round((result.correctCount / Math.max(result.total, 1)) * 100);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-10 max-w-md w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${result.status === 'Accepted' ? 'bg-green-50' : 'bg-red-50'}`}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            {result.status === 'Accepted'
              ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/></>
              : <><circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></>
            }
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
          {pct >= 60 ? 'Well Done!' : 'Keep Practising!'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">{quiz?.title}</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-3"><p className="text-2xl font-bold text-green-600">{result.correctCount}</p><p className="text-xs text-gray-500 mt-1">Correct</p></div>
          <div className="bg-red-50 rounded-xl p-3"><p className="text-2xl font-bold text-red-500">{result.wrongCount}</p><p className="text-xs text-gray-500 mt-1">Wrong</p></div>
          <div className="bg-primary/5 rounded-xl p-3"><p className="text-2xl font-bold text-primary">{result.score}</p><p className="text-xs text-gray-500 mt-1">Score</p></div>
        </div>

        <div className="h-2 bg-gray-100 rounded-full mb-1 overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }}/>
        </div>
        <p className="text-xs text-gray-400 mb-7">{pct}% accuracy</p>

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Back to Quizzes</button>
          <button onClick={onRetry} className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">Retry Quiz</button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const QuizAttemptLivePage = () => {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const location  = useLocation();

  const [quiz,      setQuiz]      = useState(location.state?.quiz || null);
  const [loading,   setLoading]   = useState(!location.state?.quiz);
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState({});   // { questionIndex: optionIndex }
  const [marked,    setMarked]    = useState(new Set());
  const [visited,   setVisited]   = useState(new Set([0]));
  const [seconds,   setSeconds]   = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result,    setResult]    = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef  = useRef(null);

  /* load quiz if not passed via state */
  useEffect(() => {
    if (!quiz && id) {
      quizAPI.getOne(id)
        .then(({ data }) => {
          setQuiz(data.quiz);
          setSeconds(data.quiz.duration * 60);
          setLoading(false);
        })
        .catch(() => { toast.error('Failed to load quiz'); navigate('/dashboard/quizzes'); });
    } else if (quiz) {
      setSeconds(quiz.duration * 60);
    }
  }, [id]);

  /* countdown */
  useEffect(() => {
    if (seconds === null || submitted) return;
    if (seconds <= 0) { handleSubmit(true); return; }
    timerRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [seconds !== null, submitted]);

  const goTo = (idx) => {
    setVisited((v) => new Set([...v, idx]));
    setCurrent(idx);
  };

  const selectAnswer = (optIdx) => {
    setAnswers((a) => ({ ...a, [current]: optIdx }));
  };

  const toggleMark = () => {
    setMarked((m) => { const n = new Set(m); n.has(current) ? n.delete(current) : n.add(current); return n; });
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    setSubmitted(true);

    try {
      const answersArr = Object.entries(answers).map(([qi, sel]) => ({
        questionIndex: parseInt(qi), selectedOption: sel,
      }));
      const { data } = await quizAPI.submit(id, {
        answers: answersArr,
        timeTaken: quiz ? quiz.duration * 60 - seconds : 0,
      });
      setResult(data.submission);
    } catch {
      toast.error('Submission failed');
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  }, [answers, id, quiz, seconds, submitted, submitting]);

  const handleRetry = () => {
    setAnswers({}); setMarked(new Set()); setVisited(new Set([0]));
    setCurrent(0); setSubmitted(false); setResult(null);
    setSeconds(quiz ? quiz.duration * 60 : 1800);
  };

  /* status for navigator */
  const getStatus = (idx) => {
    if (idx === current) return 'current';
    if (marked.has(idx)) return 'marked';
    if (answers[idx] !== undefined) return 'answered';
    if (visited.has(idx)) return 'notAnswered';
    return 'notVisited';
  };
  const navClass = {
    current:    'ring-2 ring-primary font-bold text-primary bg-white',
    answered:   'bg-[#0c5273] text-white',
    marked:     'bg-amber-500 text-white',
    notAnswered:'bg-pink-200 text-gray-700',
    notVisited: 'border border-gray-300 text-gray-500 bg-white',
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  if (result) return (
    <ResultScreen
      result={result} quiz={quiz}
      onRetry={handleRetry}
      onBack={() => navigate('/dashboard/quizzes')}
    />
  );

  if (!quiz || !quiz.questions?.length) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <p className="text-gray-500 text-sm">No questions available for this quiz.</p>
      <button onClick={() => navigate('/dashboard/quizzes')} className="text-primary text-sm font-semibold hover:underline">← Back to Quizzes</button>
    </div>
  );

  const q             = quiz.questions[current];
  const totalQ        = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const mins          = Math.floor((seconds || 0) / 60);
  const secs          = (seconds || 0) % 60;
  const isLowTime     = seconds !== null && seconds < 300;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-12 flex items-center gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-primary flex-shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/></svg>
          </span>
          <span className="text-sm font-semibold text-gray-800 truncate">{quiz.title}</span>
        </div>
        {/* Timer */}
        <div className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-sm font-bold flex-shrink-0 ${isLowTime ? 'border-red-400 text-red-500 bg-red-50 animate-pulse' : 'border-gray-300 text-gray-700'}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          {pad(mins)}:{pad(secs)}
        </div>
        <button onClick={() => navigate('/dashboard/quizzes')} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-semibold flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Exit
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 p-4 sm:p-6 max-w-3xl w-full">
            {/* Q header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-primary">Question {current + 1} <span className="text-gray-400 font-normal text-sm">/ {totalQ}</span></h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">+{q.marks || 4} Marks</span>
                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">-{q.negativeMarks ?? 1} Negative</span>
              </div>
            </div>

            {/* Question text */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed">{q.questionText}</p>
              {q.code && (
                <pre className="mt-3 bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto font-mono">{q.code}</pre>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {(q.options || []).map((opt, oi) => {
                const isSelected = answers[current] === oi;
                return (
                  <button key={oi} onClick={() => selectAnswer(oi)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium text-left transition-all duration-150
                      ${isSelected ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5'}`}>
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-white' : 'border-gray-400'}`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"/>}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <button onClick={() => goTo(Math.max(0, current - 1))} disabled={current === 0}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Previous
            </button>
            <button onClick={toggleMark}
              className={`flex items-center gap-1.5 border text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${marked.has(current) ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {marked.has(current) ? 'Marked' : 'Mark for Review'}
            </button>
            {current < totalQ - 1 ? (
              <button onClick={() => goTo(current + 1)}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                Save &amp; Next
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            ) : (
              <button onClick={() => handleSubmit(false)}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                Finish
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Navigator */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Question Navigator</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
            <LegendDot color="bg-[#0c5273]"      label={`Answered (${answeredCount})`}/>
            <LegendDot color="border border-gray-300 bg-white" label={`Not Visited (${totalQ - visited.size})`}/>
            <LegendDot color="bg-pink-200"        label={`Not Answered (${[...visited].filter((i) => answers[i] === undefined).length})`}/>
            <LegendDot color="bg-amber-500"        label={`Marked (${marked.size})`}/>
          </div>
          <div className="grid grid-cols-5 gap-1.5 mb-6">
            {quiz.questions.map((_, idx) => (
              <button key={idx} onClick={() => goTo(idx)}
                className={`w-9 h-9 rounded text-xs font-semibold flex items-center justify-center transition-all ${navClass[getStatus(idx)]}`}>
                {idx + 1}
              </button>
            ))}
          </div>
          <button onClick={() => handleSubmit(false)} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-60">
            {submitting ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            Submit Quiz
          </button>
        </aside>
      </div>
    </div>
  );
};

export default QuizAttemptLivePage;
