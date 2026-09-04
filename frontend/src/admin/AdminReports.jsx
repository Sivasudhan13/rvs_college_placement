import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/adminApi';

const deptLabel = { cse:'CSE', ece:'ECE', eee:'EEE', me:'ME', ce:'CE', other:'Other' };

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-6 w-6 text-amber-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

const AdminReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getReports()
      .then(({ data }) => setReports(data.reports))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin/>;
  if (!reports) return null;

  const maxCount  = Math.max(...(reports.submissionTrend.map(t=>t.count)||[1]), 1);
  const maxDeptScore = Math.max(...(reports.departmentStats.map(d=>d.avgScore)||[1]), 1);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports &amp; Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Platform performance insights.</p>
      </div>

      {/* Submission trend bar chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-5">Submission Trend — Last 14 Days</h3>
        {reports.submissionTrend?.length === 0
          ? <p className="text-sm text-gray-400">No submissions in this period.</p>
          : (
            <div className="space-y-3">
              {reports.submissionTrend.map((t) => (
                <div key={t._id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{t._id}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${Math.max((t.count/maxCount)*100, 4)}%` }}
                    >
                      <span className="text-[9px] font-bold text-white">{t.count}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${t.avgScore>=60?'text-green-600':'text-red-500'}`}>
                    {Math.round(t.avgScore)}%
                  </span>
                </div>
              ))}
            </div>
          )
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dept performance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Performance by Department</h3>
          {reports.departmentStats?.length === 0
            ? <p className="text-sm text-gray-400">No data yet</p>
            : (
              <div className="space-y-3.5">
                {reports.departmentStats.map((d) => (
                  <div key={d._id}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-gray-700">{deptLabel[d._id]||d._id}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{d.count} attempts</span>
                        <span className={`font-bold ${d.avgScore>=60?'text-green-600':'text-amber-600'}`}>{Math.round(d.avgScore)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${d.avgScore>=60?'bg-green-500':'bg-amber-400'}`}
                        style={{ width: `${(d.avgScore/maxDeptScore)*100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Quiz pass rates */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Quiz Pass Rates <span className="text-gray-400 font-normal text-xs">(pass ≥ 60%)</span></h3>
          {reports.quizPassRate?.length === 0
            ? <p className="text-sm text-gray-400">No submissions yet</p>
            : (
              <div className="overflow-y-auto max-h-72">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b border-gray-100">
                    <tr>
                      <th className="text-left pb-2 text-gray-500 font-semibold">Quiz</th>
                      <th className="text-right pb-2 text-gray-500 font-semibold">Attempts</th>
                      <th className="text-right pb-2 text-gray-500 font-semibold">Avg</th>
                      <th className="text-right pb-2 text-gray-500 font-semibold">Pass</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.quizPassRate.map((q,i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 text-gray-700 truncate max-w-[150px]">{q.title}</td>
                        <td className="py-2 text-right text-gray-600">{q.total}</td>
                        <td className={`py-2 text-right font-bold ${q.avgScore>=60?'text-green-600':'text-amber-600'}`}>{q.avgScore}%</td>
                        <td className={`py-2 text-right font-bold ${q.passRate>=60?'text-green-600':'text-red-500'}`}>{q.passRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>

      {/* Inactive students */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          ⚠️ Least Active Students
          <span className="ml-2 text-xs text-gray-400 font-normal">Bottom 10 by submission count</span>
        </h3>
        {reports.studentActivity?.length === 0
          ? <p className="text-sm text-gray-400">All students are actively submitting!</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-gray-500 font-semibold">Name</th>
                    <th className="text-left pb-2 text-gray-500 font-semibold">Student ID</th>
                    <th className="text-left pb-2 text-gray-500 font-semibold">Dept</th>
                    <th className="text-right pb-2 text-gray-500 font-semibold">Submissions</th>
                    <th className="text-right pb-2 text-gray-500 font-semibold">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.studentActivity.map((s,i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 font-semibold text-gray-800">{s.name}</td>
                      <td className="py-2 text-gray-500">{s.studentId}</td>
                      <td className="py-2 text-gray-500">{deptLabel[s.department]||s.department}</td>
                      <td className={`py-2 text-right font-bold ${s.submissionCount===0?'text-red-500':'text-amber-600'}`}>{s.submissionCount}</td>
                      <td className="py-2 text-right text-gray-400">{s.lastActive?new Date(s.lastActive).toLocaleDateString():'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
};

export default AdminReports;
