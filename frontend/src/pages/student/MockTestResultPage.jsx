import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { mockTestAPI } from '../../services/mockTestApi';
import toast from 'react-hot-toast';

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`rounded-xl p-4 text-center ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-0.5 opacity-80">{sub}</p>}
      <p className="text-xs mt-1 font-medium opacity-70">{label}</p>
    </div>
  );
}

function formatTime(sec) {
  if (!sec) return '0m 0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function MockTestResultPage() {
  const { id }  = useParams();
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showDetail, setDetail] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await mockTestAPI.getResult(id);
        setData(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Result not found');
        navigate('/student/mock-tests');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="animate-spin w-10 h-10 text-[#0c5273]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
        </svg>
      </div>
    </DashboardLayout>
  );

  if (!data) return null;

  const { attempt, test, questions, rank } = data;
  const pct = attempt.percentage;
  const passed = attempt.passed;
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Result hero */}
        <div className={`rounded-2xl p-8 text-center ${passed ? 'bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200' : 'bg-gradient-to-br from-red-50 to-rose-100 border border-red-200'}`}>
          <div className="flex flex-col items-center gap-4">
            {/* Circular progress */}
            <div className="relative w-36 h-36">
              <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
                <circle cx="72" cy="72" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
                <circle cx="72" cy="72" r="52" fill="none"
                  stroke={passed ? '#10b981' : '#ef4444'} strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${passed ? 'text-green-700' : 'text-red-600'}`}>{pct}%</span>
              </div>
            </div>

            <div>
              <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-2 ${passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {passed
                  ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg> PASS</>
                  : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg> FAIL</>
                }
              </div>
              <h1 className="text-xl font-bold text-gray-900">{test?.title || 'Test Completed'}</h1>
              <p className="text-gray-500 text-sm mt-1">Score: {attempt.finalScore} / {attempt.totalMarks} marks</p>
              {rank && <p className="text-gray-500 text-sm">Your Rank: #{rank}</p>}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Questions" value={attempt.totalQuestions} color="bg-blue-50 text-blue-800"/>
          <StatCard label="Attempted"       value={attempt.attempted}     color="bg-purple-50 text-purple-800"/>
          <StatCard label="Correct"         value={attempt.correct}       color="bg-green-50 text-green-800"/>
          <StatCard label="Wrong"           value={attempt.wrong}         sub={attempt.negativeMarks > 0 ? `-${attempt.negativeMarks} marks` : ''} color="bg-red-50 text-red-800"/>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Unanswered"    value={attempt.unanswered}  color="bg-gray-100 text-gray-700"/>
          <StatCard label="Score"         value={`${attempt.finalScore}/${attempt.totalMarks}`} color="bg-indigo-50 text-indigo-800"/>
          <StatCard label="Percentage"    value={`${pct}%`}           color={passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}/>
          <StatCard label="Time Taken"    value={formatTime(attempt.timeTaken)} color="bg-yellow-50 text-yellow-800"/>
        </div>

        {/* Pass threshold */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Your Score</span>
            <span className="font-semibold">{pct}% (pass: {test?.passingPercentage || 60}%)</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className={`h-3 rounded-full transition-all duration-1000 ${passed ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }}/>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>0%</span>
            <span>Pass: {test?.passingPercentage || 60}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Answer review (if admin allows) */}
        {questions?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setDetail(v => !v)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-800">Answer Review</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                className={`text-gray-500 transition-transform ${showDetail ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showDetail && (
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {questions.map((q, i) => {
                  const your   = q.yourAnswer || [];
                  const correct= q.correctAnswer || [];
                  const isRight= q.isCorrect;
                  return (
                    <div key={i} className="p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isRight ? 'bg-green-100 text-green-700' : your.length === 0 ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'}`}>
                          {i+1}
                        </span>
                        <p className="text-sm text-gray-800">{q.question}</p>
                      </div>
                      <div className="ml-8 space-y-1.5">
                        {q.options.map((opt, oi) => {
                          const isYour    = your.includes(oi);
                          const isCorrect = correct.includes(oi);
                          return (
                            <div key={oi} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
                              isCorrect ? 'bg-green-50 border border-green-200' :
                              isYour    ? 'bg-red-50 border border-red-200' :
                              'bg-gray-50'
                            }`}>
                              <span className="font-bold text-gray-500">{String.fromCharCode(65+oi)}.</span>
                              <span className="flex-1">{opt}</span>
                              {isCorrect && <span className="text-green-600 font-bold text-[10px]">✓ Correct</span>}
                              {isYour && !isCorrect && <span className="text-red-500 font-bold text-[10px]">✗ Your Answer</span>}
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <div className="ml-8 mt-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center pb-6">
          <button onClick={() => navigate('/student/mock-tests')}
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            ← All Tests
          </button>
          <button onClick={() => navigate('/student/mock-tests/history')}
            className="px-6 py-2.5 border border-[#0c5273] text-[#0c5273] rounded-lg text-sm font-semibold hover:bg-[#0c5273]/5 transition-colors">
            My History
          </button>
          {test?.showLeaderboard && (
            <button onClick={() => navigate(`/student/mock-tests/${id}/leaderboard`)}
              className="px-6 py-2.5 bg-[#0c5273] text-white rounded-lg text-sm font-semibold hover:bg-[#0a4561] transition-colors">
              View Leaderboard
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
