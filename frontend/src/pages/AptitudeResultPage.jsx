import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import { aptitudeAPI } from '../services/aptitudeApi';

const COLORS = { correct: '#10b981', wrong: '#ef4444', skipped: '#9ca3af' };

const AptitudeResultPage = () => {
  const { attemptId } = useParams();
  const navigate      = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState('result'); // result | review

  useEffect(() => {
    aptitudeAPI.getResult(attemptId)
      .then(({ data }) => setAttempt(data.attempt))
      .catch(() => { toast.error('Failed to load result'); navigate('/aptitude'); })
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    </div>
  );

  if (!attempt) return null;

  const { test, correctAnswers: correct, wrongAnswers: wrong, skippedQuestions: skipped,
          score, maxScore, percentage, accuracy, timeTaken, categoryStats } = attempt;

  // Clamp values for display
  const displayScore   = Math.max(0, score || 0);
  const displayPct     = Math.max(0, Math.min(100, percentage || 0));

  // SVG ring: circumference of circle r=15.9 ≈ 100 (viewBox trick)
  const ringDash = `${displayPct} ${100 - displayPct}`;
  const ringColor = displayPct >= 60 ? '#10b981' : displayPct >= 40 ? '#f59e0b' : '#ef4444';

  const pieData = [
    { name: 'Correct', value: correct, color: COLORS.correct },
    { name: 'Wrong',   value: wrong,   color: COLORS.wrong   },
    { name: 'Skipped', value: skipped, color: COLORS.skipped },
  ].filter((d) => d.value > 0);

  const catData = (categoryStats || []).map((cs) => ({
    name: cs.category.replace(' Reasoning','').replace(' Ability',''),
    correct: cs.correct,
    wrong: cs.wrong,
    skipped: cs.skipped,
  }));

  const mins = Math.floor((timeTaken || 0) / 60);
  const secs = (timeTaken || 0) % 60;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/aptitude')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
            ← Back to Hub
          </button>
          <div className="flex gap-2">
            <button onClick={() => setView('result')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${view==='result'?'bg-primary text-white border-primary':'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>Result</button>
            <button onClick={() => setView('review')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${view==='review'?'bg-primary text-white border-primary':'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>Review Answers</button>
          </div>
        </div>

        {/* ── RESULT VIEW ── */}
        {view === 'result' && (
          <div className="space-y-5">
            {/* Hero card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
              <div className="text-5xl mb-4">{displayPct >= 60 ? '🎉' : '📚'}</div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Test Completed!</h1>
              <p className="text-sm text-gray-500 mb-6">{test?.name}</p>

              {/* Score ring */}
              <div className="flex justify-center mb-6">
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={ringColor}
                      strokeWidth="3"
                      strokeDasharray={ringDash}
                      strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-extrabold text-gray-900">{displayPct}%</p>
                    <p className="text-xs text-gray-500">{displayScore}/{maxScore}</p>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label:'Correct',  value: correct || 0, color:'text-green-600 bg-green-50'   },
                  { label:'Wrong',    value: wrong   || 0, color:'text-red-500 bg-red-50'        },
                  { label:'Skipped',  value: skipped || 0, color:'text-gray-500 bg-gray-50'      },
                  { label:'Accuracy', value:`${accuracy || 0}%`, color:'text-primary bg-primary/5' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-3 ${s.color}`}>
                    <p className="text-xl font-extrabold">{s.value}</p>
                    <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Score detail */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                <span>Score: <strong className="text-gray-700">{displayScore} / {maxScore}</strong></span>
                <span>·</span>
                <span>Time: <strong className="text-gray-700">{mins}m {secs}s</strong></span>
                <span>·</span>
                <span className={`font-semibold ${attempt.status === 'Completed' ? 'text-green-600' : 'text-amber-600'}`}>
                  {attempt.status}
                </span>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pie */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Score Distribution</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                      {pieData.map((d) => <Cell key={d.name} fill={d.color}/>)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize:12, borderRadius:8 }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}/>
                      <span className="text-xs text-gray-600">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category bar */}
              {catData.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Category Performance</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={catData} barSize={20}>
                      <XAxis dataKey="name" tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
                      <Bar dataKey="correct" fill="#10b981" radius={[3,3,0,0]} name="Correct"/>
                      <Bar dataKey="wrong"   fill="#ef4444" radius={[3,3,0,0]} name="Wrong"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Category breakdown table */}
            {catData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Category Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">
                      {['Category','Total','Correct','Wrong','Skipped','Accuracy'].map((h) => (
                        <th key={h} className="text-left pb-2 text-xs text-gray-500 font-semibold px-2">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {(categoryStats || []).map((cs) => {
                        const acc = cs.total > 0 ? Math.round((cs.correct / cs.total) * 100) : 0;
                        return (
                          <tr key={cs.category} className="border-b border-gray-50">
                            <td className="py-2.5 px-2 font-medium text-gray-800">{cs.category}</td>
                            <td className="py-2.5 px-2 text-gray-600">{cs.total}</td>
                            <td className="py-2.5 px-2 text-green-600 font-semibold">{cs.correct}</td>
                            <td className="py-2.5 px-2 text-red-500 font-semibold">{cs.wrong}</td>
                            <td className="py-2.5 px-2 text-gray-400">{cs.skipped}</td>
                            <td className="py-2.5 px-2"><span className={`font-bold ${acc>=60?'text-green-600':acc>=40?'text-amber-600':'text-red-500'}`}>{acc}%</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => navigate('/aptitude')} className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50">← Back to Hub</button>
              <button onClick={() => setView('review')} className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-3 rounded-xl transition-colors">Review Answers →</button>
            </div>
          </div>
        )}

        {/* ── REVIEW VIEW ── */}
        {view === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Answer Review</h2>
              <div className="flex gap-2 text-xs">
                <span className="bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">✓ {correct} Correct</span>
                <span className="bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-full">✗ {wrong} Wrong</span>
                <span className="bg-gray-100 text-gray-500 font-bold px-2.5 py-1 rounded-full">— {skipped} Skipped</span>
              </div>
            </div>

            {(attempt.answers || []).map((ans, i) => {
              const q = ans.questionId;
              if (!q) return null;
              const status = ans.selectedAnswer === -1 ? 'skipped' : ans.isCorrect ? 'correct' : 'wrong';
              return (
                <div key={i} className={`bg-white border-l-4 rounded-xl p-5 shadow-sm ${status==='correct'?'border-l-green-500':status==='wrong'?'border-l-red-500':'border-l-gray-300'}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-gray-900 flex-1">
                      <span className="text-primary mr-2">Q{i+1}.</span>{q.question}
                    </p>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0
                      ${status==='correct'?'bg-green-100 text-green-700':status==='wrong'?'bg-red-100 text-red-600':'bg-gray-100 text-gray-500'}`}>
                      {status==='correct'?'✓ Correct':status==='wrong'?'✗ Wrong':'— Skipped'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {(q.options || []).map((opt, oi) => {
                      const isYours   = oi === ans.selectedAnswer;
                      const isCorrect = oi === q.correctAnswer;
                      return (
                        <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                          ${isCorrect ? 'bg-green-50 border border-green-300 text-green-800 font-semibold'
                          : isYours && !isCorrect ? 'bg-red-50 border border-red-300 text-red-700'
                          : 'bg-gray-50 text-gray-600'}`}>
                          <span className="font-bold flex-shrink-0">{String.fromCharCode(65+oi)}.</span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && <span className="text-green-600 flex-shrink-0">✓</span>}
                          {isYours && !isCorrect && <span className="text-red-500 flex-shrink-0">✗</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-blue-700 mb-1">💡 Explanation</p>
                      <p className="text-xs text-blue-800 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}

                  {/* Your answer vs correct */}
                  {ans.selectedAnswer !== -1 && !ans.isCorrect && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span>Your answer: </span>
                      <span className="text-red-600 font-semibold">{q.options?.[ans.selectedAnswer] || '—'}</span>
                      <span> · Correct: </span>
                      <span className="text-green-600 font-semibold">{q.options?.[q.correctAnswer] || '—'}</span>
                    </div>
                  )}
                </div>
              );
            })}

            <button onClick={() => setView('result')} className="w-full border border-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50">← Back to Results</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AptitudeResultPage;
