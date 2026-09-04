import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { attendanceAPI } from '../../services/attendanceApi';

const deptOptions = ['cse','ece','eee','me','ce','it'].map(d => ({ value: d, label: d.toUpperCase() }));
const yearOptions = [1,2,3,4];
const batchOptions = ['A','B','C','D'];

const DEPT_LABEL = { cse:'CSE', ece:'ECE', eee:'EEE', me:'ME', ce:'CE', it:'IT', other:'Other' };

/* ── Confirm dialog ── */
const ConfirmDialog = ({ filters, presentCount, totalCount, onCancel, onConfirm, loading }) => {
  const absent = totalCount - presentCount;
  const dateStr = new Date(filters.date).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Confirm Attendance</h2>
        <p className="text-xs text-gray-400 mb-5">Review before submitting</p>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5">
          <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold">{dateStr}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Training</span><span className="font-semibold">{filters.trainingTitle}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Department</span><span className="font-semibold">{DEPT_LABEL[filters.department] || filters.department}</span></div>
          {filters.year  && <div className="flex justify-between"><span className="text-gray-500">Year</span><span className="font-semibold">{filters.year}</span></div>}
          {filters.batch && <div className="flex justify-between"><span className="text-gray-500">Batch</span><span className="font-semibold">{filters.batch}</span></div>}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-gray-900">{totalCount}</p><p className="text-[10px] text-gray-500 mt-0.5">Total</p></div>
          <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-green-600">{presentCount}</p><p className="text-[10px] text-gray-500 mt-0.5">Present</p></div>
          <div className="bg-red-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-red-500">{absent}</p><p className="text-[10px] text-gray-500 mt-0.5">Absent</p></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60">
            {loading ? 'Submitting…' : 'Confirm & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MarkAttendance() {
  const today = new Date().toISOString().split('T')[0];

  const [trainings,    setTrainings]    = useState([]);
  const [students,     setStudents]     = useState([]);
  const [present,      setPresent]      = useState(new Set()); // set of studentId strings
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  const [filters, setFilters] = useState({
    date: today, trainingId: '', trainingTitle: '',
    department: '', year: '', batch: '', section: '',
  });

  useEffect(() => {
    attendanceAPI.getTrainings()
      .then(r => setTrainings(r.data.trainings || []))
      .catch(() => {});
  }, []);

  const setFilter = (k, v) => {
    setFilters(p => ({ ...p, [k]: v }));
    setStudentsLoaded(false);
    setStudents([]);
  };

  const loadStudents = async () => {
    if (!filters.trainingId) { toast.error('Please select a training'); return; }
    if (!filters.department)  { toast.error('Please select a department'); return; }
    setLoadingStudents(true);
    try {
      const { data } = await attendanceAPI.loadStudents({
        department: filters.department, year: filters.year,
        batch: filters.batch, section: filters.section,
        trainingId: filters.trainingId, date: filters.date,
      });
      setStudents(data.students || []);
      // Pre-check: already marked as Present, or default all to Present
      const ids = new Set();
      (data.students || []).forEach(s => {
        if (s.currentStatus === 'Present' || !s.alreadyMarked) ids.add(s._id);
        else if (s.currentStatus === 'Absent') {} // leave unchecked
      });
      setPresent(ids);
      setStudentsLoaded(true);
      if (!data.students?.length) toast.error('No students found for selected criteria');
    } catch { toast.error('Failed to load students'); }
    finally  { setLoadingStudents(false); }
  };

  const toggleStudent = (id) => {
    setPresent(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll  = () => setPresent(new Set(students.map(s => s._id)));
  const clearAll   = () => setPresent(new Set());
  const markAllPresent = () => setPresent(new Set(students.map(s => s._id)));

  const handleSubmit = async () => {
    if (!students.length) { toast.error('No students loaded'); return; }
    setSubmitting(true);
    setShowConfirm(false);
    try {
      const payload = {
        date: filters.date,
        trainingId: filters.trainingId,
        department: filters.department,
        year: filters.year ? parseInt(filters.year) : undefined,
        batch: filters.batch,
        section: filters.section,
        students: students.map(s => ({
          studentId: s._id,
          status: present.has(s._id) ? 'Present' : 'Absent',
        })),
      };
      const { data } = await attendanceAPI.bulkMark(payload);
      toast.success(`✅ ${data.message}`);
      setStudentsLoaded(false);
      setStudents([]);
      setPresent(new Set());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const presentCount = present.size;
  const absentCount  = students.length - presentCount;

  return (
    <DashboardLayout>
      {showConfirm && (
        <ConfirmDialog
          filters={{ ...filters, trainingTitle: trainings.find(t => t._id === filters.trainingId)?.title || '—' }}
          presentCount={presentCount} totalCount={students.length}
          onCancel={() => setShowConfirm(false)} onConfirm={handleSubmit} loading={submitting}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Select filters → Load Students → Select All → Uncheck absentees → Submit</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Session Filters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date *</label>
            <input type="date" value={filters.date} onChange={e => setFilter('date', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"/>
          </div>

          {/* Training */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Training / Event *</label>
            <select value={filters.trainingId}
              onChange={e => { setFilter('trainingId', e.target.value); setFilter('trainingTitle', trainings.find(t => t._id === e.target.value)?.title || ''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">Select Training</option>
              {trainings.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Department *</label>
            <select value={filters.department} onChange={e => setFilter('department', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">All Depts</option>
              {deptOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
            <select value={filters.year} onChange={e => setFilter('year', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">All Years</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Batch */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Batch</label>
            <select value={filters.batch} onChange={e => setFilter('batch', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">All Batches</option>
              {batchOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <button onClick={loadStudents} disabled={loadingStudents}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loadingStudents ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Loading…</> : '📋 Load Students'}
        </button>
      </div>

      {/* Students table */}
      {studentsLoaded && students.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={presentCount === students.length && students.length > 0}
                onChange={e => e.target.checked ? selectAll() : clearAll()}
                className="w-4 h-4 accent-primary"/>
              <span className="text-sm font-semibold text-gray-800">Select All</span>
            </label>
            <div className="flex-1"/>
            <span className="text-xs text-gray-500">
              <span className="text-green-600 font-bold">{presentCount}</span> Present &nbsp;·&nbsp;
              <span className="text-red-500 font-bold">{absentCount}</span> Absent &nbsp;·&nbsp;
              {students.length} Total
            </span>
            <button onClick={markAllPresent} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">Mark All Present</button>
            <button onClick={clearAll} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Clear All</button>
            <button onClick={() => setShowConfirm(true)} disabled={submitting}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-60">
              ✅ Submit Attendance
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Register No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Batch</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(s => {
                  const isPresent = present.has(s._id);
                  return (
                    <tr key={s._id} onClick={() => toggleStudent(s._id)}
                      className={`cursor-pointer transition-colors ${isPresent ? 'bg-green-50/50 hover:bg-green-50' : 'bg-red-50/30 hover:bg-red-50/50'}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={isPresent} onChange={() => toggleStudent(s._id)}
                          onClick={e => e.stopPropagation()} className="w-4 h-4 accent-primary cursor-pointer"/>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.studentId}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600">{DEPT_LABEL[s.department] || s.department}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{s.batch || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {isPresent ? 'Present' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {studentsLoaded && students.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <span className="text-5xl">👥</span>
          <p className="text-sm">No students found for selected criteria</p>
        </div>
      )}
    </DashboardLayout>
  );
}
