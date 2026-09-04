import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { attendanceAPI } from '../../services/attendanceApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DEPT_LABEL = { cse:'CSE', ece:'ECE', eee:'EEE', me:'ME', ce:'CE', it:'IT', other:'Other' };
const STATUS_COLOR = { Present:'text-green-600', Absent:'text-red-500' };

const Spin = () => (
  <div className="flex justify-center py-12">
    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ─── Student Report ─── */
function StudentReport() {
  const [studentId, setStudentId] = useState('');
  const [students, setStudents]   = useState([]);
  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    fetch('/api/admin/students?limit=200', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.json()).then(d => setStudents(d.students || [])).catch(() => {});
  }, []);

  const load = async () => {
    if (!studentId) { toast.error('Select a student'); return; }
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getStudentReport(studentId);
      setReport(data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <select value={studentId} onChange={e => setStudentId(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">Select Student…</option>
          {students.map(s => <option key={s._id} value={s._id}>{s.name} — {s.studentId}</option>)}
        </select>
        <button onClick={load} disabled={loading}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading ? '…' : 'Generate'}
        </button>
      </div>

      {loading && <Spin/>}

      {report && !loading && (
        <div className="space-y-5">
          {/* Student info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-5 items-start flex-wrap">
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">{report.student.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{report.student.studentId} · {DEPT_LABEL[report.student.department]}</p>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                ['Total', report.stats.total, 'text-gray-900'],
                ['Present', report.stats.present, 'text-green-600'],
                ['Absent', report.stats.absent, 'text-red-500'],
                [`${report.stats.percentage}%`, 'Attendance', 'text-primary'],
              ].map(([val, label, color]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className={`text-xl font-extrabold ${color}`}>{val}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.stats.eligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {report.stats.eligible ? '✅ Eligible' : '❌ Not Eligible'}
            </span>
          </div>

          {/* Records */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Date','Training','Type','Status'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.records.map(r => (
                    <tr key={r._id}>
                      <td className="px-4 py-2.5 text-xs text-gray-700">{new Date(r.date).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{r.training?.title}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{r.training?.type}</td>
                      <td className="px-4 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status==='Present'?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                  {!report.records.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No records</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Department Report ─── */
function DeptReport() {
  const [department, setDepartment] = useState('cse');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await attendanceAPI.getDepartmentReport({ department }); setReport(data); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  const chartData = report?.students?.slice(0, 20).map(s => ({
    name: s.name?.split(' ')[0] || s.studentId,
    pct: s.percentage,
  })) || [];

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <select value={department} onChange={e => setDepartment(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary">
          {['cse','ece','eee','me','ce','it'].map(d=><option key={d} value={d}>{d.toUpperCase()}</option>)}
        </select>
        <button onClick={load} disabled={loading}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60">
          {loading ? '…' : 'Generate'}
        </button>
      </div>

      {loading && <Spin/>}

      {report && !loading && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Students', report.stats.totalStudents, 'bg-blue-50 text-primary'],
              ['Present',  report.stats.totalPresent,  'bg-green-50 text-green-600'],
              ['Absent',   report.stats.totalAbsent,   'bg-red-50 text-red-600'],
              [`${report.stats.avgPercentage}%`, 'Avg',  'bg-purple-50 text-purple-600'],
            ].map(([v, l, c]) => (
              <div key={l} className={`${c} rounded-2xl p-4 text-center`}>
                <p className="text-2xl font-extrabold">{v}</p>
                <p className="text-xs opacity-70 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          {chartData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Student Attendance % (Top 20)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={16}>
                  <XAxis dataKey="name" tick={{fontSize:9}} tickLine={false} axisLine={false}/>
                  <YAxis domain={[0,100]} tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={v=>[`${v}%`,'Attendance']}/>
                  <Bar dataKey="pct" fill="#0c5273" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Student','ID','Total','Present','Absent','%','Eligible'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.students.map((s, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{s.student?.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{s.student?.studentId}</td>
                      <td className="px-4 py-2.5 text-gray-700">{s.total}</td>
                      <td className="px-4 py-2.5 text-green-600 font-semibold">{s.present}</td>
                      <td className="px-4 py-2.5 text-red-500 font-semibold">{s.absent}</td>
                      <td className="px-4 py-2.5"><span className={`font-bold ${s.percentage>=75?'text-green-600':'text-red-500'}`}>{s.percentage}%</span></td>
                      <td className="px-4 py-2.5"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.percentage>=75?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>{s.percentage>=75?'Yes':'No'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendanceReports() {
  const [tab, setTab] = useState('student');

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
      </div>
      <div className="flex gap-1 border-b border-gray-200 mb-7">
        {[['student','Student Report'],['department','Department Report']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===id?'border-primary text-primary':'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'student'     && <StudentReport/>}
      {tab === 'department'  && <DeptReport/>}
    </DashboardLayout>
  );
}
