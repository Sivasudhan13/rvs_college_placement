import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { attendanceAPI } from '../../services/attendanceApi';

const DEPT_LABEL = { cse:'CSE', ece:'ECE', eee:'EEE', me:'ME', ce:'CE', it:'IT', other:'Other' };
const STATUS_COLOR = { Present:'bg-green-100 text-green-700', Absent:'bg-red-100 text-red-600' };

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ── Edit Modal ── */
const EditModal = ({ record, onClose, onSaved }) => {
  const [status, setStatus] = useState(record.status);
  const [remarks, setRemarks] = useState(record.remarks || '');
  const [saving, setSaving]  = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await attendanceAPI.updateRecord(record._id, { status, remarks });
      toast.success('Attendance updated');
      onSaved();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Edit Attendance</h2>
        <div className="space-y-3 mb-5">
          <div>
            <p className="text-xs text-gray-500 mb-1">Student</p>
            <p className="text-sm font-semibold">{record.student?.name} ({record.student?.studentId})</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Training</p>
            <p className="text-sm font-semibold">{record.training?.title}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Date</p>
            <p className="text-sm font-semibold">{new Date(record.date).toLocaleDateString('en-GB')}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <div className="flex gap-3">
              {['Present','Absent'].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${status===s ? (s==='Present'?'bg-green-600 text-white border-green-600':'bg-red-500 text-white border-red-500') : 'border-gray-200 text-gray-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks</label>
            <input value={remarks} onChange={e=>setRemarks(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"/>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AttendanceHistory() {
  const today = new Date().toISOString().split('T')[0];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState(null);

  const [filters, setFilters] = useState({
    search:'', dateFrom:'', dateTo: today,
    department:'', status:'', training:'', batch:'', year:'',
  });

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 30 };
      if (filters.dateFrom)   params.dateFrom   = filters.dateFrom;
      if (filters.dateTo)     params.dateTo     = filters.dateTo;
      if (filters.department) params.department = filters.department;
      if (filters.status)     params.status     = filters.status;
      if (filters.batch)      params.batch      = filters.batch;
      if (filters.year)       params.year       = filters.year;
      const { data } = await attendanceAPI.getAttendance(params);
      setRecords(data.records || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(1); setPage(1); }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try { await attendanceAPI.deleteRecord(id); toast.success('Deleted'); load(page); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <DashboardLayout>
      {editing && <EditModal record={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(page); }}/>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
          <p className="text-sm text-gray-500 mt-1">{total} records found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <input type="date" value={filters.dateFrom} onChange={e => setFilters(p => ({...p, dateFrom: e.target.value}))}
          placeholder="From" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"/>
        <input type="date" value={filters.dateTo} onChange={e => setFilters(p => ({...p, dateTo: e.target.value}))}
          placeholder="To" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"/>
        <select value={filters.department} onChange={e => setFilters(p=>({...p,department:e.target.value}))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">All Depts</option>
          {['cse','ece','eee','me','ce','it'].map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
        </select>
        <select value={filters.year} onChange={e => setFilters(p=>({...p,year:e.target.value}))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">All Years</option>
          {[1,2,3,4].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filters.batch} onChange={e => setFilters(p=>({...p,batch:e.target.value}))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">All Batches</option>
          {['A','B','C','D'].map(b=><option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(p=>({...p,status:e.target.value}))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">All Status</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      {/* Table */}
      {loading ? <Spin/> : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Date','Student','Register No','Training','Dept','Batch','Status','Marked By','Actions'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{new Date(r.date).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.student?.name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.student?.studentId || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{r.training?.title || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{DEPT_LABEL[r.department] || r.department}</td>
                    <td className="px-4 py-3 text-gray-600">{r.batch || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{r.markedBy?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditing(r)} className="p-1.5 rounded text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors" title="Edit">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                        <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!records.length && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 py-3 border-t border-gray-100">
              <button onClick={() => { const p=Math.max(1,page-1); setPage(p); load(p); }} disabled={page===1}
                className="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40">←</button>
              <span className="px-3 py-1 text-xs text-gray-600">{page}/{totalPages}</span>
              <button onClick={() => { const p=Math.min(totalPages,page+1); setPage(p); load(p); }} disabled={page===totalPages}
                className="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40">→</button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
