import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { mockTestAPI } from '../../services/mockTestApi';
import toast from 'react-hot-toast';

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
}
function formatTime(sec) {
  if (!sec) return '0m';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function MockTestHistoryPage() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotal]  = useState(1);
  const [filter, setFilter]     = useState('All'); // All | PASS | FAIL

  useEffect(() => {
    fetch(page);
  }, [page]);

  const fetch = async (p) => {
    setLoading(true);
    try {
      const { data } = await mockTestAPI.getHistory({ page: p, limit: 15 });
      setAttempts(data.attempts || []);
      setTotal(data.totalPages || 1);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'All' ? attempts
    : attempts.filter(a => filter === 'PASS' ? a.passed : !a.passed);

  const stats = {
    total: attempts.length,
    pass:  attempts.filter(a => a.passed).length,
    fail:  attempts.filter(a => !a.passed).length,
    avg:   attempts.length
      ? Math.round(attempts.reduce((s,a) => s + a.percentage, 0) / attempts.length)
      : 0,
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Test History</h1>
            <p className="text-sm text-gray-500 mt-0.5">All your past mock test results</p>
          </div>
          <button onClick={() => navigate('/student/mock-tests')}
            className="flex items-center gap-2 text-sm text-[#0c5273] font-medium border border-[#0c5273] px-4 py-2 rounded-lg hover:bg-[#0c5273]/5 transition-colors">
            ← All Tests
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Tests Taken', value: stats.total, color: 'bg-blue-50 text-blue-700' },
            { label: 'Passed',      value: stats.pass,  color: 'bg-green-50 text-green-700' },
            { label: 'Failed',      value: stats.fail,  color: 'bg-red-50 text-red-700' },
            { label: 'Avg Score',   value: `${stats.avg}%`, color: 'bg-purple-50 text-purple-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['All','PASS','FAIL'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filter === f ? 'bg-[#0c5273] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <svg className="animate-spin w-8 h-8 text-[#0c5273] mx-auto" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto text-gray-300 mb-4">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <h3 className="text-gray-500 font-medium">No test history yet</h3>
              <p className="text-gray-400 text-sm mt-1">Take a mock test to see your results here</p>
              <button onClick={() => navigate('/student/mock-tests')}
                className="mt-4 bg-[#0c5273] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#0a4561] transition-colors">
                Browse Tests
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Test','Category','Date','Score','Percentage','Time','Result',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((a) => (
                      <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px]">
                          <span className="truncate block">{a.mockTest?.title || 'Test'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <span className="bg-blue-50 text-blue-700 text-[11px] font-medium px-2 py-0.5 rounded">
                            {a.mockTest?.category || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(a.submittedAt)}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{a.finalScore}/{a.totalMarks}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-1.5 rounded-full ${a.passed ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${a.percentage}%` }}/>
                            </div>
                            <span className="text-gray-700 font-medium">{a.percentage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatTime(a.timeTaken)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {a.passed ? '✓ PASS' : '✗ FAIL'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => navigate(`/student/mock-tests/${a.mockTest?._id}/result`)}
                            className="text-xs text-[#0c5273] font-semibold hover:underline whitespace-nowrap">
                            View Result →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                      ← Prev
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
