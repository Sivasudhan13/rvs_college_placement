import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { attendanceAPI } from '../../services/attendanceApi';

const DEPT_LABEL = { cse:'CSE', ece:'ECE', eee:'EEE', me:'ME', ce:'CE', it:'IT', other:'Other' };

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

export default function LowAttendance() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [threshold, setThreshold] = useState(75);
  const [department, setDept]   = useState('');
  const [batch,     setBatch]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getLowAttendance({ threshold, department, batch });
      setStudents(data.students || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [threshold, department, batch]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Low Attendance Students</h1>
          <p className="text-sm text-gray-500 mt-1">Students below the attendance threshold</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">Threshold:</span>
          <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
            min={0} max={100} className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-center outline-none focus:border-primary"/>
          <span className="text-sm font-bold text-gray-500">%</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={department} onChange={e => setDept(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">All Departments</option>
          {['cse','ece','eee','me','ce','it'].map(d=><option key={d} value={d}>{d.toUpperCase()}</option>)}
        </select>
        <select value={batch} onChange={e => setBatch(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">All Batches</option>
          {['A','B','C','D'].map(b=><option key={b} value={b}>{b}</option>)}
        </select>
        <button onClick={load} className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="text-sm font-bold text-amber-800">{students.length} student{students.length !== 1 ? 's' : ''} below {threshold}% attendance</p>
          <p className="text-xs text-amber-600">These students may be ineligible for placements and certifications.</p>
        </div>
      </div>

      {loading ? <Spin/> : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#','Student Name','Register No','Department','Batch','Sessions','Present','Absent','Attendance','Required','Status'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s, i) => {
                  const gap = threshold - s.pct;
                  return (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-400">{i+1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.studentId}</td>
                      <td className="px-4 py-3 text-gray-600">{DEPT_LABEL[s.department] || s.department}</td>
                      <td className="px-4 py-3 text-gray-600">{s.batch || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{s.total}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">{s.present}</td>
                      <td className="px-4 py-3 text-red-500 font-semibold">{s.total - s.present}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${s.pct}%` }}/>
                          </div>
                          <span className="font-bold text-red-500">{s.pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{threshold}%</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Not Eligible</span>
                          <p className="text-[9px] text-gray-400 mt-0.5">Short by {gap.toFixed(1)}%</p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!students.length && (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <span className="text-4xl">🎉</span>
                        <p className="text-sm font-medium">All students meet the attendance requirement!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
