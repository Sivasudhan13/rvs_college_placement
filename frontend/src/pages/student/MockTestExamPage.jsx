import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockTestAPI } from '../../services/mockTestApi';
import toast from 'react-hot-toast';

/* ── Question nav status colours ── */
const Q_STATUS = {
  answered:  'bg-green-500 text-white',
  marked:    'bg-yellow-400 text-white',
  visited:   'bg-red-100 text-red-700 border border-red-300',
  current:   'bg-[#0c5273] text-white ring-2 ring-[#0c5273]/50',
  notvisited:'bg-gray-100 text-gray-600 border border-gray-200',
};

function qStatus(idx, currentIdx, answers, markedForReview) {
  if (idx === currentIdx) return 'current';
  if (markedForReview.has(idx)) return 'marked';
  if (answers[idx] !== undefined && answers[idx].length > 0) return 'answered';
  if (markedForReview.has(idx) || answers[idx] !== undefined) return 'visited';
  return 'notvisited';
}

function Timer({ seconds, onExpire }) {
  const [rem, setRem] = useState(seconds);
  const int = useRef(null);

  useEffect(() => {
    setRem(seconds);
  }, [seconds]);

  useEffect(() => {
    if (rem <= 0) { onExpire(); return; }
    int.current = setInterval(() => setRem(r => {
      if (r <= 1) { clearInterval(int.current); onExpire(); return 0; }
      return r - 1;
    }), 1000);
    return () => clearInterval(int.current);
  }, []);

  const m = String(Math.floor(rem / 60)).padStart(2,'0');
  const s = String(rem % 60).padStart(2,'0');
  const critical = rem < 120;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${critical ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-800'}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
        <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      {m}:{s}
    </div>
  );
}

export default function MockTestExamPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [loading, setLoading]         = useState(true);
  const [testMeta, setTestMeta]       = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [attemptId, setAttemptId]     = useState(null);
  const [remainSec, setRemainSec]     = useState(0);

  const [currentIdx, setCurrentIdx]   = useState(0);
  const [answers, setAnswers]         = useState({});         // { qIdx: [optionIdx, ...] }
  const [markedForReview, setMarked]  = useState(new Set());
  const [submitting, setSubmitting]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNav, setShowNav]         = useState(true);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    startTest();
  }, [id]);

  const startTest = async () => {
    try {
      const { data } = await mockTestAPI.startTest(id);
      setTestMeta(data.test);
      setQuestions(data.questions);
      setAttemptId(data.attemptId);
      setRemainSec(data.remainingSeconds);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot start test');
      navigate('/student/mock-tests');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionToggle = (optionIdx) => {
    const q = questions[currentIdx];
    setAnswers(prev => {
      const curr = prev[currentIdx] || [];
      if (q.questionType === 'MultiSelect') {
        return {
          ...prev,
          [currentIdx]: curr.includes(optionIdx)
            ? curr.filter(o => o !== optionIdx)
            : [...curr, optionIdx],
        };
      }
      return { ...prev, [currentIdx]: curr[0] === optionIdx ? [] : [optionIdx] };
    });
  };

  const handleClearAnswer = () => {
    setAnswers(prev => { const n = {...prev}; delete n[currentIdx]; return n; });
  };

  const toggleMark = () => {
    setMarked(prev => {
      const n = new Set(prev);
      n.has(currentIdx) ? n.delete(currentIdx) : n.add(currentIdx);
      return n;
    });
  };

  const submitTest = useCallback(async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    const ans = Object.entries(answersRef.current).map(([qIdx, opts]) => ({
      questionIndex: parseInt(qIdx),
      selectedOptions: opts,
    }));
    try {
      const { data } = await mockTestAPI.submitTest(id, { attemptId, answers: ans });
      if (auto) toast('Time up — test auto-submitted', { icon: '⏰' });
      else toast.success('Test submitted!');
      navigate(`/student/mock-tests/${id}/result`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [id, attemptId, submitting, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <svg className="animate-spin w-10 h-10 text-[#0c5273] mx-auto" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
        </svg>
        <p className="text-gray-600 font-medium">Loading test…</p>
      </div>
    </div>
  );

  if (!testMeta) return null;

  const q = questions[currentIdx];
  const selectedOpts = answers[currentIdx] || [];
  const isMarked     = markedForReview.has(currentIdx);
  const answeredCount = Object.values(answers).filter(a => a?.length > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 text-sm truncate">{testMeta.title}</h1>
          <p className="text-xs text-gray-500">
            Q {currentIdx + 1} / {questions.length} &bull; {answeredCount} answered
          </p>
        </div>
        <Timer seconds={remainSec} onExpire={() => submitTest(true)}/>
        <button
          onClick={() => setShowConfirm(true)}
          className="bg-[#0c5273] hover:bg-[#0a4561] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Submit
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Main question area ── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-3xl">
          {/* Question card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            {/* Meta */}
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
              <span className="bg-[#0c5273]/10 text-[#0c5273] font-semibold px-2 py-0.5 rounded">Q {currentIdx + 1}</span>
              {q.marks > 0 && <span>+{q.marks} mark{q.marks > 1 ? 's' : ''}</span>}
              {q.negativeMarks > 0 && <span className="text-red-500">−{q.negativeMarks} wrong</span>}
              {q.difficulty && <span className={`px-2 py-0.5 rounded ${
                q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>{q.difficulty}</span>}
              {isMarked && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Marked for Review</span>}
            </div>

            {/* Question text */}
            <p className="text-gray-800 font-medium text-base leading-relaxed mb-6 whitespace-pre-wrap">{q.question}</p>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, oi) => {
                const sel = selectedOpts.includes(oi);
                return (
                  <button
                    key={oi}
                    onClick={() => handleOptionToggle(oi)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                      sel
                        ? 'border-[#0c5273] bg-[#0c5273]/5 text-[#0c5273] font-medium'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${
                      sel ? 'bg-[#0c5273] border-[#0c5273] text-white' : 'border-gray-300 text-gray-500'
                    }`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={toggleMark}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                isMarked ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50'
              }`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {isMarked ? 'Unmark' : 'Mark for Review'}
            </button>
            <button onClick={handleClearAnswer}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              Clear Answer
            </button>
          </div>

          {/* Prev / Next */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-400">{currentIdx + 1} / {questions.length}</span>
            <button
              onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
              disabled={currentIdx === questions.length - 1}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0c5273] text-white hover:bg-[#0a4561] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </main>

        {/* ── Question navigator (desktop) ── */}
        <aside className={`hidden lg:flex flex-col w-64 border-l border-gray-200 bg-white overflow-y-auto`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Question Navigator</h2>
            {/* Legend */}
            <div className="mt-3 space-y-1.5 text-[10px] text-gray-500">
              {[
                { cls: 'bg-green-500', label: 'Answered' },
                { cls: 'bg-yellow-400', label: 'Marked for Review' },
                { cls: 'bg-[#0c5273]', label: 'Current' },
                { cls: 'bg-gray-100 border border-gray-200', label: 'Not visited' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex-shrink-0 ${l.cls}`}/>
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 grid grid-cols-5 gap-2">
            {questions.map((_, i) => {
              const status = qStatus(i, currentIdx, answers, markedForReview);
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${Q_STATUS[status]}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="p-4 border-t border-gray-100 mt-auto space-y-2">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between"><span>Answered</span><span className="font-bold text-green-600">{answeredCount}</span></div>
              <div className="flex justify-between"><span>Not Answered</span><span className="font-bold text-red-500">{questions.length - answeredCount}</span></div>
              <div className="flex justify-between"><span>Marked</span><span className="font-bold text-yellow-500">{markedForReview.size}</span></div>
            </div>
            <button onClick={() => setShowConfirm(true)}
              className="w-full bg-[#0c5273] hover:bg-[#0a4561] text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
              Submit Test
            </button>
          </div>
        </aside>
      </div>

      {/* ── Mobile nav toggle ── */}
      <div className="lg:hidden fixed bottom-4 right-4 z-20">
        <button onClick={() => setShowNav(v => !v)}
          className="w-12 h-12 bg-[#0c5273] text-white rounded-full shadow-lg flex items-center justify-center text-xs font-bold">
          {answeredCount}/{questions.length}
        </button>
      </div>

      {/* ── Mobile question nav drawer ── */}
      {showNav && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setShowNav(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">Question Navigator</h3>
              <button onClick={() => setShowNav(false)} className="text-gray-500">✕</button>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {questions.map((_, i) => {
                const status = qStatus(i, currentIdx, answers, markedForReview);
                return (
                  <button key={i} onClick={() => { setCurrentIdx(i); setShowNav(false); }}
                    className={`w-10 h-10 rounded-lg text-xs font-bold ${Q_STATUS[status]}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <button onClick={() => { setShowNav(false); setShowConfirm(true); }}
              className="w-full bg-[#0c5273] text-white font-bold py-2.5 rounded-lg text-sm">
              Submit Test
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm submit dialog ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-[#0c5273]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#0c5273]">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Submit Test?</h3>
              <p className="text-gray-500 text-sm mt-1">This action cannot be undone.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Total Questions</span><span className="font-semibold">{questions.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Answered</span><span className="font-semibold text-green-600">{answeredCount}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Unanswered</span><span className="font-semibold text-red-500">{questions.length - answeredCount}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Marked</span><span className="font-semibold text-yellow-500">{markedForReview.size}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Continue
              </button>
              <button onClick={() => { setShowConfirm(false); submitTest(); }}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#0c5273] text-white rounded-lg text-sm font-semibold hover:bg-[#0a4561] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {submitting ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/></svg>Submitting…</> : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
