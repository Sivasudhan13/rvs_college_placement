import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { aptitudeAPI } from '../services/aptitudeApi';

/* ── Score popup shown after submit ── */
const ScorePopup = ({ correct, total, points, alreadyDone, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
      <div className={`h-1.5 w-full ${correct === total ? 'bg-green-500' : correct >= 3 ? 'bg-amber-400' : 'bg-red-400'}`}/>
      <div className="p-8 text-center">
        <div className="text-5xl mb-3">
          {correct === total ? '🔥' : correct >= 3 ? '⭐' : '💪'}
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">
          {alreadyDone ? 'Already Completed!' : correct === total ? 'Perfect Score!' : 'Challenge Done!'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">Daily Aptitude Challenge</p>

        {/* Score ring */}
        <div className="flex justify-center mb-5">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="4"/>
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={correct === total ? '#10b981' : correct >= 3 ? '#f59e0b' : '#ef4444'}
                strokeWidth="4"
                strokeDasharray={`${Math.round((correct / total) * 100)} ${100 - Math.round((correct / total) * 100)}`}
                strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-gray-900">{correct}</span>
              <span className="text-[10px] text-gray-400">/ {total}</span>
            </div>
          </div>
        </div>

        {/* Points awarded */}
        {!alreadyDone && (
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-bold text-amber-700">+{points} Points Earned!</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-bold py-3 rounded-xl transition-colors"
        >
          Back to Aptitude Hub →
        </button>
      </div>
    </div>
  </div>
);

const AptitudeDailyPage = () => {
  const navigate = useNavigate();

  const [questions,  setQuestions]  = useState([]);
  const [date,       setDate]       = useState('');
  const [completed,  setCompleted]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState({}); // { qIndex: optionIndex }
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null); // shown in popup

  /* Load daily challenge */
  useEffect(() => {
    aptitudeAPI.getDailyChallenge()
      .then(({ data }) => {
        setQuestions(data.questions || []);
        setDate(data.date || '');
        setCompleted(data.completed || false);
      })
      .catch(() => toast.error('Failed to load daily challenge'))
      .finally(() => setLoading(false));
  }, []);

  const answeredCount = Object.keys(answers).length;
  const allAnswered   = answeredCount === questions.length && questions.length > 0;

  /* Submit all 5 answers */
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    if (answeredCount === 0) {
      toast.error('Please answer at least one question before submitting');
      return;
    }
    setSubmitting(true);
    try {
      const answersArr = questions.map((q, i) => ({
        questionId:     q._id,
        selectedAnswer: answers[i] !== undefined ? answers[i] : -1,
      }));
      const { data } = await aptitudeAPI.submitDailyChallenge({ answers: answersArr });
      setResult({
        correct:    answers ? Object.values(answers).length : 0, // best effort
        total:      questions.length,
        points:     data.pointsAwarded || 25,
        alreadyDone: data.alreadyDone,
      });
      toast.success(data.alreadyDone ? 'Already completed today!' : '🔥 Daily challenge submitted! +25 pts');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, questions, answers, answeredCount]);

  const q = questions[current];

  /* ── Spinner ── */
  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20">
        <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    </DashboardLayout>
  );

  /* ── Already completed banner ── */
  if (completed && !result) return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Already Completed!</h1>
        <p className="text-gray-500 mb-2">You have finished today's daily challenge.</p>
        <p className="text-xs text-gray-400 mb-8">Date: {date}</p>
        <button onClick={() => navigate('/aptitude')}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
          ← Back to Aptitude Hub
        </button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Score popup */}
      {result && (
        <ScorePopup
          correct={result.correct}
          total={result.total}
          points={result.points}
          alreadyDone={result.alreadyDone}
          onClose={() => navigate('/aptitude')}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔥</span>
            <h1 className="text-2xl font-bold text-gray-900">Daily Challenge</h1>
          </div>
          <p className="text-sm text-gray-500">{date} · 5 Questions · +25 Points on completion</p>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${
                answers[i] !== undefined ? 'bg-primary' : i === current ? 'bg-primary/40 ring-2 ring-primary' : 'bg-gray-200'
              }`}/>
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-600">{answeredCount}/{questions.length}</span>
        </div>
      </div>

      <div className="max-w-3xl">
        {/* Progress bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 flex items-center gap-4">
          <span className="text-xs font-semibold text-gray-500 flex-shrink-0">Question {current + 1} of {questions.length}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}/>
          </div>
          {/* Question dots nav */}
          <div className="flex gap-1.5 flex-shrink-0">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                  i === current       ? 'bg-primary text-white ring-2 ring-primary/30'
                  : answers[i] !== undefined ? 'bg-primary/20 text-primary'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question card */}
        {q && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
            {/* Q meta */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                {q.category}
              </span>
              {q.subCategory && (
                <span className="text-[10px] bg-gray-100 text-gray-600 font-medium px-2.5 py-1 rounded-full">
                  {q.subCategory}
                </span>
              )}
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ml-auto ${
                q.difficulty === 'Easy'   ? 'bg-green-100 text-green-700'
                : q.difficulty === 'Hard' ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'}`}>
                {q.difficulty}
              </span>
            </div>

            {/* Question text */}
            <p className="text-base text-gray-900 leading-relaxed font-medium mb-6">{q.question}</p>

            {/* Options */}
            <div className="space-y-3">
              {(q.options || []).map((opt, oi) => {
                const isSelected = answers[current] === oi;
                return (
                  <button key={oi}
                    onClick={() => setAnswers((a) => ({ ...a, [current]: oi }))}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-medium text-left transition-all duration-150
                      ${isSelected
                        ? 'bg-primary border-primary text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5'}`}>
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-extrabold
                      ${isSelected ? 'border-white bg-white/20 text-white' : 'border-gray-300 text-gray-500'}`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation + Submit row */}
        <div className="flex items-center gap-3">
          {/* Prev */}
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>

          {/* Next */}
          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              Next →
            </button>
          ) : null}

          <div className="flex-1"/>

          {/* ── SUBMIT BUTTON ── */}
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
            className={`flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm
              ${allAnswered
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                : 'bg-primary hover:bg-primary-dark text-white'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Submitting…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {allAnswered ? '🔥 Submit Challenge' : `Submit (${answeredCount}/${questions.length})`}
              </>
            )}
          </button>
        </div>

        {/* Tip */}
        {answeredCount < questions.length && (
          <p className="text-xs text-gray-400 text-center mt-3">
            You can submit with {questions.length - answeredCount} unanswered question{questions.length - answeredCount !== 1 ? 's' : ''}.
            Unanswered = skipped.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AptitudeDailyPage;
