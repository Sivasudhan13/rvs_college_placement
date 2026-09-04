import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { aptitudeAPI } from '../services/aptitudeApi';

const DIFF_COLOR = { Easy:'bg-green-100 text-green-700', Medium:'bg-yellow-100 text-yellow-700', Hard:'bg-red-100 text-red-700' };
const NAV_STATUS = {
  answered:   'bg-primary text-white',
  marked:     'bg-amber-400 text-white',
  notAnswered:'bg-pink-200 text-gray-700',
  notVisited: 'border border-gray-300 text-gray-500 bg-white',
  current:    'ring-2 ring-primary font-bold text-primary bg-white',
};

const Spin = () => (
  <div className="flex justify-center py-20">
    <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

const AptitudePracticePage = () => {
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const category     = params.get('category') || 'Quantitative';
  const difficulty   = params.get('difficulty') || '';

  const [questions,  setQuestions]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState({});      // { index: optionIndex }
  const [marked,     setMarked]     = useState(new Set());
  const [visited,    setVisited]    = useState(new Set([0]));
  const [revealed,   setRevealed]   = useState({});     // { index: {isCorrect, correctAnswer, explanation} }
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(null);
  const [filter,     setFilter]     = useState({ diff: difficulty, sub: '' });
  const [subCats,    setSubCats]    = useState([]);

  /* ── load questions ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = { category, limit: 50 };
        if (filter.diff) p.difficulty = filter.diff;
        if (filter.sub)  p.subCategory = filter.sub;
        const { data } = await aptitudeAPI.getQuestions(p);
        setQuestions(data.questions || []);
        const subs = [...new Set((data.questions || []).map((q) => q.subCategory))];
        setSubCats(subs);
        setCurrent(0); setAnswers({}); setMarked(new Set()); setVisited(new Set([0])); setRevealed({});
      } catch { toast.error('Failed to load questions'); }
      finally { setLoading(false); }
    };
    load();
  }, [category, filter]);

  const q = questions[current];
  const progress = questions.length > 0 ? Math.round(((current + 1) / questions.length) * 100) : 0;

  const goTo = (idx) => { setVisited((v) => new Set([...v, idx])); setCurrent(idx); };

  /* ── select answer ── */
  const selectAnswer = (optIdx) => {
    if (revealed[current]) return; // already submitted this Q
    setAnswers((a) => ({ ...a, [current]: optIdx }));
  };

  /* ── check answer (practice mode: reveal after selecting) ── */
  const checkAnswer = useCallback(async () => {
    if (answers[current] === undefined) { toast.error('Please select an answer first'); return; }
    if (revealed[current]) return;
    setSubmitting(true);
    try {
      const { data } = await aptitudeAPI.attemptQuestion(q._id, {
        selectedAnswer: answers[current], timeTaken: 30,
      });
      setRevealed((r) => ({ ...r, [current]: data }));
      if (data.isCorrect) toast.success('Correct! +' + data.points + ' pts');
      else toast.error('Incorrect answer');
    } catch { toast.error('Failed to submit answer'); }
    finally { setSubmitting(false); }
  }, [answers, current, q]);

  const toggleMark = () => setMarked((m) => { const n = new Set(m); n.has(current) ? n.delete(current) : n.add(current); return n; });
  const clearAnswer = () => { if (revealed[current]) return; setAnswers((a) => { const n = {...a}; delete n[current]; return n; }); };

  const getNavStatus = (idx) => {
    if (idx === current) return NAV_STATUS.current;
    if (marked.has(idx)) return NAV_STATUS.marked;
    if (answers[idx] !== undefined) return NAV_STATUS.answered;
    if (visited.has(idx)) return NAV_STATUS.notAnswered;
    return NAV_STATUS.notVisited;
  };

  const answeredCount = Object.keys(answers).length;

  if (loading) return <DashboardLayout><Spin/></DashboardLayout>;

  if (!questions.length) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
        <span className="text-5xl">😕</span>
        <p className="text-sm font-medium">No questions found for this selection</p>
        <button onClick={() => navigate('/aptitude')} className="text-xs text-primary hover:underline">← Back to Hub</button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/aptitude')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-bold text-gray-900">{category} Practice</h1>
          {q && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>}
        </div>
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {['','Easy','Medium','Hard'].map((d) => (
            <button key={d} onClick={() => setFilter((f) => ({ ...f, diff: d }))}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors
                ${filter.diff===d ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
              {d || 'All'}
            </button>
          ))}
          <select value={filter.sub} onChange={(e) => setFilter((f) => ({ ...f, sub: e.target.value }))}
            className="px-2.5 py-1 text-xs font-medium border border-gray-200 rounded-lg bg-white text-gray-600 outline-none hover:border-primary transition-colors">
            <option value="">All Topics</option>
            {subCats.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* ── Question panel ── */}
        <div className="lg:col-span-3">
          {/* Progress bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="font-semibold text-gray-700">Question {current + 1} / {questions.length}</span>
              <span>{answeredCount} answered · {marked.size} marked</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width:`${progress}%` }}/>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
            {q.subCategory && (
              <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 mb-3">
                {q.subCategory}
              </span>
            )}
            <p className="text-base text-gray-900 leading-relaxed font-medium mb-6">{q.question}</p>

            {/* Options */}
            <div className="space-y-3">
              {(q.options || []).map((opt, oi) => {
                const rev = revealed[current];
                const isSelected = answers[current] === oi;
                const isCorrect  = rev && oi === rev.correctAnswer;
                const isWrong    = rev && isSelected && !rev.isCorrect;

                let cls = 'flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-medium text-left transition-all duration-150 w-full cursor-pointer';
                if (rev) {
                  if (isCorrect) cls += ' bg-green-50 border-green-500 text-green-800';
                  else if (isWrong) cls += ' bg-red-50 border-red-400 text-red-800';
                  else cls += ' border-gray-200 text-gray-500 bg-gray-50';
                } else {
                  if (isSelected) cls += ' bg-primary border-primary text-white shadow-sm';
                  else cls += ' bg-white border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5';
                }

                return (
                  <button key={oi} onClick={() => selectAnswer(oi)} className={cls}>
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold
                      ${rev && isCorrect ? 'border-green-500 bg-green-500 text-white' : rev && isWrong ? 'border-red-400' : isSelected ? 'border-white' : 'border-gray-400'}`}>
                      {rev && isCorrect ? '✓' : rev && isWrong ? '✗' : String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Explanation after reveal */}
            {revealed[current] && (
              <div className={`mt-4 p-4 rounded-xl border ${revealed[current].isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-xs font-bold text-gray-700 mb-1">💡 Explanation</p>
                <p className="text-sm text-gray-700 leading-relaxed">{revealed[current].explanation || 'No explanation available.'}</p>
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => goTo(Math.max(0, current - 1))} disabled={current === 0}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
              ← Previous
            </button>
            <button onClick={clearAnswer} disabled={!!revealed[current] || answers[current] === undefined}
              className="text-xs font-semibold px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              Clear
            </button>
            <button onClick={toggleMark}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg border transition-colors
                ${marked.has(current) ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {marked.has(current) ? '🔖 Marked' : '🔖 Mark for Review'}
            </button>
            <div className="flex-1"/>
            {!revealed[current] && answers[current] !== undefined && (
              <button onClick={checkAnswer} disabled={submitting}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60">
                {submitting ? '...' : '✓ Check Answer'}
              </button>
            )}
            <button onClick={() => { if (current < questions.length - 1) goTo(current + 1); }}
              disabled={current === questions.length - 1}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-4 py-2.5 rounded-lg disabled:opacity-40 transition-colors">
              Next →
            </button>
            <button onClick={() => navigate('/aptitude')}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Finish
            </button>
          </div>
        </div>

        {/* ── Navigator ── */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-4 h-fit sticky top-16">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Navigator</h3>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {[
              { color:'bg-primary', label:`Answered (${answeredCount})` },
              { color:'border border-gray-300 bg-white', label:`Not Visited` },
              { color:'bg-pink-200', label:`Not Answered` },
              { color:'bg-amber-400', label:`Marked (${marked.size})` },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${l.color}`}/>
                <span className="text-[9px] text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5 max-h-80 overflow-y-auto">
            {questions.map((_, idx) => (
              <button key={idx} onClick={() => goTo(idx)}
                className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${getNavStatus(idx)}`}>
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
            <p>✅ Answered: {answeredCount}</p>
            <p>🔖 Marked: {marked.size}</p>
            <p>📝 Total: {questions.length}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AptitudePracticePage;
