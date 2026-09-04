import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { dsaAPI } from '../services/dsaApi';

const statusColor = {
  Accepted:              'text-green-600 bg-green-50 border-green-200',
  'Wrong Answer':        'text-red-600 bg-red-50 border-red-200',
  'Runtime Error':       'text-orange-600 bg-orange-50 border-orange-200',
  'Compilation Error':   'text-red-700 bg-red-50 border-red-200',
  'Time Limit Exceeded': 'text-amber-600 bg-amber-50 border-amber-200',
  'Memory Limit Exceeded':'text-purple-600 bg-purple-50 border-purple-200',
  Pending:               'text-gray-500 bg-gray-50 border-gray-200',
};
const diffColor = {
  Easy:'text-green-600', Medium:'text-yellow-600', Hard:'text-red-600',
};
const LANGS = { javascript:'JS', python:'Python', java:'Java', cpp:'C++' };

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

const CodeModal = ({ sub, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
        <div>
          <p className="text-white text-sm font-semibold">{sub.problem?.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor[sub.status]}`}>{sub.status}</span>
            <span className="text-gray-400 text-[10px]">{LANGS[sub.language] || sub.language}</span>
            <span className="text-gray-400 text-[10px]">{sub.passedTests}/{sub.totalTests} tests</span>
            {sub.executionTime > 0 && <span className="text-gray-400 text-[10px]">{sub.executionTime}ms</span>}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {/* Code */}
      <div className="flex-1 overflow-y-auto p-5">
        <pre className="text-green-300 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
          {sub.sourceCode}
        </pre>
      </div>
    </div>
  </div>
);

const DSASubmissionsPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [total,       setTotal]       = useState(0);
  const [filter,      setFilter]      = useState('All'); // All | Accepted | Wrong Answer | ...
  const [viewSub,     setViewSub]     = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const STATUSES = ['All','Accepted','Wrong Answer','Runtime Error','Compilation Error','Time Limit Exceeded'];

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await dsaAPI.getSubmissions({ page: p, limit: 20 });
      const subs = (data.submissions || []).filter(s =>
        filter === 'All' || s.status === filter
      );
      setSubmissions(subs);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch { toast.error('Failed to load submissions'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(1); setPage(1); }, [filter]);

  const openDetail = async (sub) => {
    if (sub.sourceCode) { setViewSub(sub); return; }
    setLoadingDetail(true);
    try {
      const { data } = await dsaAPI.getSubmission(sub._id);
      setViewSub(data.submission);
    } catch { toast.error('Failed to load code'); }
    finally { setLoadingDetail(false); }
  };

  /* Stats */
  const accepted      = submissions.filter(s => s.status === 'Accepted').length;
  const wrongAnswer   = submissions.filter(s => s.status === 'Wrong Answer').length;
  const runtimeError  = submissions.filter(s => s.status === 'Runtime Error' || s.status === 'Compilation Error').length;

  return (
    <DashboardLayout>
      {viewSub && <CodeModal sub={viewSub} onClose={() => setViewSub(null)}/>}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submission History</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total submissions</p>
        </div>
        <button onClick={() => navigate('/dsa')}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Solve More
        </button>
      </div>

      {/* Mini stats */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-green-600">{accepted}</p>
            <p className="text-xs text-gray-500 mt-0.5">Accepted</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-red-500">{wrongAnswer}</p>
            <p className="text-xs text-gray-500 mt-0.5">Wrong Answer</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-orange-500">{runtimeError}</p>
            <p className="text-xs text-gray-500 mt-0.5">Errors</p>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200 mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors
              ${filter===s ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <Spin/> : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide">
            <div className="col-span-4">Problem</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Language</div>
            <div className="col-span-1 text-right">Tests</div>
            <div className="col-span-1 text-right">Time</div>
            <div className="col-span-1 text-right">Memory</div>
            <div className="col-span-1 text-right">Date</div>
          </div>

          <div className="divide-y divide-gray-50">
            {submissions.map(sub => (
              <div key={sub._id}
                onClick={() => openDetail(sub)}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors items-center group">

                {/* Problem */}
                <div className="col-span-4 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                    {sub.problem?.title || '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold ${diffColor[sub.problem?.difficulty]}`}>{sub.problem?.difficulty}</span>
                    <span className="text-[10px] text-gray-400">{sub.problem?.category}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor[sub.status] || 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                    {sub.status}
                  </span>
                </div>

                {/* Language */}
                <div className="col-span-2">
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded capitalize">
                    {LANGS[sub.language] || sub.language}
                  </span>
                </div>

                {/* Tests */}
                <div className="col-span-1 text-right text-xs text-gray-600">{sub.passedTests}/{sub.totalTests}</div>

                {/* Time */}
                <div className="col-span-1 text-right text-xs text-gray-500">
                  {sub.executionTime > 0 ? `${sub.executionTime}ms` : '—'}
                </div>

                {/* Memory */}
                <div className="col-span-1 text-right text-xs text-gray-500">
                  {sub.memoryUsed > 0 ? `${sub.memoryUsed}MB` : '—'}
                </div>

                {/* Date */}
                <div className="col-span-1 text-right text-xs text-gray-400">
                  {new Date(sub.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                </div>
              </div>
            ))}
          </div>

          {submissions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="opacity-30">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <p className="text-sm font-medium">No submissions yet</p>
              <button onClick={() => navigate('/dsa')} className="text-xs text-primary hover:underline">Start solving →</button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 py-4 border-t border-gray-100">
              <button onClick={() => { const p = Math.max(1,page-1); setPage(p); load(p); }} disabled={page===1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:border-primary hover:text-primary transition-colors">← Prev</button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button onClick={() => { const p = Math.min(totalPages,page+1); setPage(p); load(p); }} disabled={page===totalPages}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:border-primary hover:text-primary transition-colors">Next →</button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DSASubmissionsPage;
