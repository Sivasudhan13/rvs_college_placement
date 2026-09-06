import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { interviewAPI } from '../services/api';
import toast from 'react-hot-toast';

/* ── helpers ── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtTime = (sec) => { if (!sec) return '0m'; const m = Math.floor(sec/60), s = sec%60; return s ? `${m}m ${s}s` : `${m}m`; };
const scoreColor = (v) => v >= 75 ? 'text-green-700 bg-green-100' : v >= 50 ? 'text-blue-700 bg-blue-100' : 'text-orange-700 bg-orange-100';
const scoreBarColor = (v) => v >= 75 ? 'bg-green-500' : v >= 50 ? 'bg-blue-500' : 'bg-orange-400';

/* ── Score pill ── */
const ScorePill = ({ value }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${scoreColor(value ?? 0)}`}>
    {value ?? '—'}<span className="font-normal opacity-70">/100</span>
  </span>
);

/* ══════════════════════════════════════════════════
   DETAIL MODAL
══════════════════════════════════════════════════ */
const DetailModal = ({ session, onClose }) => {
  if (!session) return null;
  const s = session.scores || {};
  const scoreItems = [
    { label: 'Overall',           value: s.overall },
    { label: 'Communication',     value: s.communication },
    { label: 'Fluency',           value: s.fluency },
    { label: 'Role Knowledge',    value: s.roleKnowledge },
    { label: 'Answer Relevance',  value: s.answerRelevance },
    { label: 'Behavioral',        value: s.behavioralSkills },
    { label: 'Professionalism',   value: s.professionalism },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{session.jobRole}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {fmt(session.completedAt || session.createdAt)} · {session.durationMinutes} min · {session.qa?.length ?? 0} questions
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors ml-4 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Scores grid */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Scores</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {scoreItems.map(item => (
                <div key={item.label} className="text-center bg-gray-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-gray-800">{item.value ?? '—'}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 my-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${scoreBarColor(item.value ?? 0)}`}
                      style={{ width: `${item.value ?? 0}%` }}/>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths / Improvements / Recommendations */}
          {[
            { title: '✅ Strengths',           items: session.strengths,       bg: 'bg-green-50  border-green-200',  text: 'text-green-800' },
            { title: '📈 Needs Improvement',   items: session.improvements,    bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800' },
            { title: '💡 AI Recommendations',  items: session.recommendations, bg: 'bg-blue-50   border-blue-200',   text: 'text-blue-800' },
          ].filter(sec => sec.items?.length > 0).map(sec => (
            <div key={sec.title} className={`rounded-xl border p-4 ${sec.bg}`}>
              <h3 className={`font-bold text-xs mb-2 ${sec.text}`}>{sec.title}</h3>
              <ul className="space-y-1">
                {sec.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="mt-1 flex-shrink-0 text-gray-400">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Q&A transcript */}
          {session.qa?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Interview Transcript</h3>
              <div className="space-y-3">
                {session.qa.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-[#0c5273]">Q{i + 1}</p>
                    <p className="text-sm font-medium text-gray-800">{item.question}</p>
                    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                      <p className="text-xs text-gray-400 font-semibold mb-1">Your answer</p>
                      <p className="text-sm text-gray-700">
                        {item.answer || <em className="text-gray-400">No answer given</em>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
export default function InterviewHistoryPage() {
  const navigate = useNavigate();
  const [sessions,    setSessions]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [selected,    setSelected]    = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchHistory(1); }, []);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await interviewAPI.getHistory({ page: p, limit: 10 });
      setSessions(p === 1 ? data.sessions : prev => [...prev, ...data.sessions]);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch { toast.error('Failed to load interview history'); }
    finally { setLoading(false); }
  };

  const openDetail = async (session) => {
    // If qa is missing (list view omits it), fetch full session
    if (!session.qa) {
      setDetailLoading(true);
      try {
        const { data } = await interviewAPI.getSession(session._id);
        setSelected(data.session);
      } catch { toast.error('Failed to load interview details'); }
      finally { setDetailLoading(false); }
    } else {
      setSelected(session);
    }
  };

  /* ── Stats from loaded sessions ── */
  const evaluated = sessions.filter(s => s.status === 'evaluated');
  const avgScore  = evaluated.length
    ? Math.round(evaluated.reduce((sum, s) => sum + (s.scores?.overall ?? 0), 0) / evaluated.length)
    : 0;

  return (
    <DashboardLayout>
      {selected && <DetailModal session={selected} onClose={() => setSelected(null)}/>}

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Interview History</h1>
            <p className="text-sm text-gray-500 mt-0.5">All your AI mock interviews</p>
          </div>
          <button
            onClick={() => navigate('/hr-prep/live-interview')}
            className="flex items-center gap-2 bg-[#0c5273] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0a4561] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
            </svg>
            New Interview
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Interviews', value: sessions.length,    color: 'bg-blue-50   text-blue-700' },
            { label: 'Evaluated',        value: evaluated.length,   color: 'bg-green-50  text-green-700' },
            { label: 'Avg Score',        value: `${avgScore}/100`,  color: 'bg-purple-50 text-purple-700' },
            { label: 'In Progress',      value: sessions.filter(s => s.status === 'in_progress').length, color: 'bg-amber-50 text-amber-700' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl p-4 text-center ${stat.color}`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading && sessions.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="animate-spin w-8 h-8 text-[#0c5273] mx-auto" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
              </svg>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-4">🎤</div>
              <h3 className="text-gray-500 font-medium">No interviews yet</h3>
              <p className="text-gray-400 text-sm mt-1">Start your first AI mock interview to see results here</p>
              <button onClick={() => navigate('/hr-prep/live-interview')}
                className="mt-4 bg-[#0c5273] text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-[#0a4561] transition-colors">
                Start Interview
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Job Role', 'Date', 'Duration', 'Questions', 'Overall Score', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map(session => (
                      <tr key={session._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px]">
                          <span className="truncate block">{session.jobRole}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {fmt(session.completedAt || session.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {session.durationMinutes} min
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {session.qa?.length ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {session.status === 'evaluated'
                            ? <ScorePill value={session.scores?.overall}/>
                            : <span className="text-xs text-gray-400">—</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                            session.status === 'evaluated'  ? 'bg-green-100 text-green-700' :
                            session.status === 'completed'  ? 'bg-blue-100  text-blue-700'  :
                            session.status === 'in_progress'? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {session.status === 'in_progress' ? 'In Progress' : session.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openDetail(session)}
                            disabled={detailLoading}
                            className="text-xs text-[#0c5273] font-semibold hover:underline disabled:opacity-50 whitespace-nowrap"
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load more */}
              {page < totalPages && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <button
                    onClick={() => fetchHistory(page + 1)}
                    disabled={loading}
                    className="w-full py-2 text-sm font-medium text-[#0c5273] hover:bg-gray-50 rounded-lg transition-colors border border-dashed border-gray-200"
                  >
                    {loading ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
