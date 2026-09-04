import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { aptitudeAPI } from '../services/aptitudeApi';

const pad = (n) => String(n).padStart(2, '0');

const NAV_STATUS = {
  answered:   'bg-primary text-white',
  marked:     'bg-amber-400 text-white',
  notAnswered:'bg-pink-200 text-gray-700',
  notVisited: 'border border-gray-300 text-gray-500 bg-white',
  current:    'ring-2 ring-primary font-bold text-primary bg-white',
};

/* ── Confirm submit modal ── */
const ConfirmModal = ({ answered, total, onCancel, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
      <h2 className="text-lg font-extrabold text-gray-900 mb-2">Submit Test?</h2>
      <div className="grid grid-cols-2 gap-3 my-5">
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-2xl font-bold text-green-600">{answered}</p>
          <p className="text-xs text-gray-500 mt-0.5">Answered</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-2xl font-bold text-red-500">{total - answered}</p>
          <p className="text-xs text-gray-500 mt-0.5">Unanswered</p>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Unanswered questions will be marked as skipped. This action cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading ? 'Submitting…' : 'Submit Test'}
        </button>
      </div>
    </div>
  </div>
);

const AptitudeTestPage = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [test,       setTest]       = useState(null);
  const [attemptId,  setAttemptId]  = useState(null);
  const [startedAt,  setStartedAt]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [starting,   setStarting]   = useState(false);
  const [testStarted,setTestStarted]= useState(false);

  const [current,   setCurrent]    = useState(0);
  const [answers,   setAnswers]    = useState({});
  const [marked,    setMarked]     = useState(new Set());
  const [visited,   setVisited]    = useState(new Set([0]));
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const timerRef = useRef(null);

  /* load test info */
  useEffect(() => {
    aptitudeAPI.getTest(id)
      .then(({ data }) => setTest(data.test))
      .catch(() => { toast.error('Test not found'); navigate('/aptitude'); })
      .finally(() => setLoading(false));
  }, [id]);

  /* start test */
  const startTest = async () => {
    setStarting(true);
    try {
      const { data } = await aptitudeAPI.startTest(id);
      setAttemptId(data.attemptId);
      setStartedAt(new Date(data.startedAt));
      setSecondsLeft(data.durationSeconds);
      setTest(data.test);
      setTestStarted(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to start test'); }
    finally { setStarting(false); }
  };

  /* countdown — stable effect, only runs when testStarted flips true */
  useEffect(() => {
    if (!testStarted || secondsLeft === null) return;

    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tick);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    timerRef.current = tick;
    return () => clearInterval(tick);
  }, [testStarted]); // only re-run when test starts

  /* auto-submit when time runs out */
  useEffect(() => {
    if (testStarted && secondsLeft === 0) {
      handleSubmit(true);
    }
  }, [secondsLeft, testStarted]);

  /* submit — stable callback, reads latest answers via ref */
  const answersRef = useRef({});
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const [scoreResult, setScoreResult] = useState(null); // holds result for popup

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    setShowConfirm(false);
    try {
      const latestAnswers = answersRef.current;
      const answersArr = (test?.questions || []).map((q, qi) => ({
        questionId:     q._id,
        selectedAnswer: latestAnswers[qi] !== undefined ? latestAnswers[qi] : -1,
        timeTaken:      30,
      }));
      const { data } = await aptitudeAPI.submitTest(id, { attemptId, answers: answersArr });
      // Show score popup instead of immediately navigating
      setScoreResult(data.result);
      toast.success(auto ? 'Time up! Test auto-submitted.' : '✅ Test submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  }, [submitting, test, id, attemptId]);

  const goTo = (idx) => { setVisited((v) => new Set([...v, idx])); setCurrent(idx); };
  const toggleMark = () => setMarked((m) => { const n = new Set(m); n.has(current) ? n.delete(current) : n.add(current); return n; });

  const getNavStatus = (idx) => {
    if (idx === current) return NAV_STATUS.current;
    if (marked.has(idx)) return NAV_STATUS.marked;
    if (answers[idx] !== undefined) return NAV_STATUS.answered;
    if (visited.has(idx)) return NAV_STATUS.notAnswered;
    return NAV_STATUS.notVisited;
  };

  const mins = Math.floor((secondsLeft || 0) / 60);
  const secs = (secondsLeft || 0) % 60;
  const isLowTime = secondsLeft !== null && secondsLeft < 300;
  const answeredCount = Object.values(answers).filter((v) => v !== undefined).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    </div>
  );

  /* ── Pre-test info screen ── */
  if (!testStarted && test) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">📝</div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">{test.name}</h1>
            <p className="text-sm text-gray-500">{test.category}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            ['📋 Questions',    test.totalQuestions],
            ['⏱ Duration',      `${test.duration} minutes`],
            ['✅ Marks/Q',       `+${test.marks}`],
            ['❌ Negative',      `-${test.negativeMarks}`],
          ].map(([label, val]) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm font-bold text-gray-800">{val}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {test.description && <p className="text-sm text-gray-600 mb-6 bg-blue-50 p-3 rounded-xl">{test.description}</p>}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
          <p className="text-xs font-bold text-amber-700 mb-1">⚠️ Instructions</p>
          <ul className="text-xs text-amber-600 space-y-0.5 list-disc list-inside">
            <li>Timer starts immediately when you click Start.</li>
            <li>Test auto-submits when time runs out.</li>
            <li>Negative marks apply for wrong answers.</li>
            <li>Skipped questions get zero marks.</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/aptitude')} className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50">← Back</button>
          <button onClick={startTest} disabled={starting} className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
            {starting ? 'Starting…' : 'Start Test →'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!test?.questions?.length) return null;

  const q = test.questions[current];

  /* ── Score Popup — shown immediately after submission ── */
  if (scoreResult) {
    const pct  = scoreResult.percentage || 0;
    const pass = pct >= 60;
    return (
      <div className="min-h-screen bg-gray-900/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeIn_0.3s_ease]">
          {/* Coloured top band */}
          <div className={`h-2 w-full ${pass ? 'bg-green-500' : 'bg-amber-400'}`}/>

          <div className="p-8 text-center">
            <div className="text-6xl mb-4">{pass ? '🎉' : '📚'}</div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              {pass ? 'Excellent Work!' : 'Keep Practising!'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{test?.name}</p>

            {/* Big score circle */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5"/>
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={pass ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3.5"
                    strokeDasharray={`${pct} ${100 - pct}`}
                    strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-gray-900">{pct}%</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    {Math.max(0, scoreResult.score)}/{scoreResult.maxScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-2xl font-extrabold text-green-600">{scoreResult.correct}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Correct</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-2xl font-extrabold text-red-500">{scoreResult.wrong}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Wrong</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-2xl font-extrabold text-gray-500">{scoreResult.skipped}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Skipped</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-6">
              Accuracy: <strong className="text-gray-700">{scoreResult.accuracy}%</strong>
              &nbsp;·&nbsp; Time: <strong className="text-gray-700">
                {Math.floor((scoreResult.timeTaken || 0) / 60)}m {(scoreResult.timeTaken || 0) % 60}s
              </strong>
            </p>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/aptitude/history')}
                className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                📋 View History
              </button>
              <button
                onClick={() => navigate(`/aptitude/result/${scoreResult.attemptId}`)}
                className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-3 rounded-xl transition-colors"
              >
                Review Answers →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {showConfirm && (
        <ConfirmModal answered={answeredCount} total={test.questions.length}
          onCancel={() => setShowConfirm(false)} onConfirm={() => handleSubmit(false)} loading={submitting}/>
      )}

      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-primary font-extrabold text-sm hidden sm:block">{test.name}</span>
          <span className="text-gray-300 hidden sm:block">|</span>
          <span className={`text-xs font-medium flex-shrink-0 ${isLowTime ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
            Q {current + 1} / {test.questions.length}
          </span>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-1.5 border-2 rounded-full px-4 py-1.5 text-sm font-extrabold flex-shrink-0 transition-all
          ${isLowTime ? 'border-red-400 text-red-500 bg-red-50 animate-pulse scale-105' : 'border-gray-200 text-gray-700 bg-gray-50'}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {pad(mins)}:{pad(secs)}
        </div>

        {/* Answered count badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"/>
          <span className="text-xs font-semibold text-green-700">{answeredCount}/{test.questions.length}</span>
        </div>

        {/* Submit button — always visible, prominent */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-60 flex-shrink-0 shadow-sm"
        >
          {submitting
            ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          }
          {submitting ? 'Submitting…' : 'Submit Test'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-3xl w-full">
            {/* Q header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">Q {current + 1}</span>
                <span className="text-gray-400 text-sm">/ {test.questions.length}</span>
                {q.subCategory && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{q.subCategory}</span>}
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">+{q.marks || 1}</span>
                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">-{q.negativeMarks || 0.25}</span>
              </div>
            </div>

            {/* Question text */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 shadow-sm">
              <p className="text-base text-gray-900 leading-relaxed">{q.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {(q.options || []).map((opt, oi) => {
                const isSelected = answers[current] === oi;
                return (
                  <button key={oi} onClick={() => setAnswers((a) => ({ ...a, [current]: oi }))}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-medium text-left transition-all
                      ${isSelected ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5'}`}>
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold
                      ${isSelected ? 'border-white' : 'border-gray-400'}`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
            <button onClick={() => goTo(Math.max(0, current - 1))} disabled={current === 0}
              className="flex items-center gap-1 border border-gray-300 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-40">
              ← Prev
            </button>
            <button onClick={toggleMark}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border transition-colors
                ${marked.has(current) ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              🔖 {marked.has(current) ? 'Marked' : 'Mark'}
            </button>
            <div className="flex-1"/>
            {/* Mobile submit — only visible on small screens where sidebar is hidden */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="md:hidden flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              Submit
            </button>
            <button onClick={() => { if (current < test.questions.length - 1) goTo(current + 1); }}
              disabled={current === test.questions.length - 1}
              className="flex items-center gap-1 bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40 transition-colors">
              Save & Next →
            </button>
          </div>
        </div>

        {/* Navigator */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Question Navigator</h3>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {[['bg-primary','Answered'],['bg-pink-200','Not Answered'],['bg-amber-400','Marked'],['border border-gray-300 bg-white','Not Visited']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${c}`}/>
                <span className="text-[9px] text-gray-500">{l}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {test.questions.map((_, idx) => (
              <button key={idx} onClick={() => goTo(idx)}
                className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${getNavStatus(idx)}`}>
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-3">
            <p>✅ {answeredCount} answered</p>
            <p>🔖 {marked.size} marked</p>
            <p>📝 {test.questions.length - answeredCount} remaining</p>
          </div>
          <button onClick={() => setShowConfirm(true)} disabled={submitting}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold py-3.5 rounded-xl transition-colors shadow-md disabled:opacity-60">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Submit Test
          </button>
        </aside>
      </div>
    </div>
  );
};

export default AptitudeTestPage;
