import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/adminApi';

const deptLabel  = { cse:'CSE', ece:'ECE', eee:'EEE', me:'ME', ce:'CE', other:'Other' };
const DEPTS      = ['All','CSE','ECE','EEE','ME','CE'];
const DEPT_VALS  = { CSE:'cse', ECE:'ece', EEE:'eee', ME:'me', CE:'ce' };
const ROLES      = ['student','faculty'];

// Generate batch options: 2020-2024 → 2028-2032
const currentYear = new Date().getFullYear();
const BATCHES = ['All', ...Array.from({ length: 10 }, (_, i) => {
  const s = currentYear - 6 + i;
  return `${s}-${s + 4}`;
})];

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-6 w-6 text-amber-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ── Add User Modal ── */
const AddUserModal = ({ onClose, onAdded }) => {
  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-white';
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', studentId: '', admissionNumber: '',
    department: 'cse', batch: `${currentYear}-${currentYear + 4}`,
    role: 'student', password: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.studentId || !form.password) {
      toast.error('Name, Email, Student ID and Password are required');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await adminAPI.createStudent(form);
      toast.success('User created successfully!');
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Add New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
            <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ravi Kumar" autoFocus/>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Institutional Email *</label>
            <input type="email" className={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@rvscet.ac.in"/>
          </div>

          {/* Student ID + Admission Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Student / Faculty ID *</label>
              <input className={inp} value={form.studentId} onChange={e => set('studentId', e.target.value)} placeholder="e.g. 21CSE001"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Admission Number</label>
              <input className={inp} value={form.admissionNumber} onChange={e => set('admissionNumber', e.target.value)} placeholder="Same as ID if blank"/>
            </div>
          </div>

          {/* Department + Batch */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
              <select className={inp} value={form.department} onChange={e => set('department', e.target.value)}>
                {[['cse','CSE'],['ece','ECE'],['eee','EEE'],['me','ME'],['ce','CE'],['other','Other']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Batch</label>
              <select className={inp} value={form.batch} onChange={e => set('batch', e.target.value)}>
                {BATCHES.filter(b => b !== 'All').map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Role + Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
              <select className={inp} value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
              <input type="password" className={inp} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters"/>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AdminStudents = () => {
  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [dept,         setDept]         = useState('All');
  const [batch,        setBatch]        = useState('All');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const [selected,     setSelected]     = useState(null);
  const [detail,       setDetail]       = useState(null);
  const [loadingDetail,setLoadingDetail]= useState(false);
  const [showAdd,      setShowAdd]      = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (search)        params.search     = search;
      if (dept  !== 'All') params.department = DEPT_VALS[dept] || dept.toLowerCase();
      if (batch !== 'All') params.batch     = batch;
      const { data } = await adminAPI.getStudents(params);
      setStudents(data.students || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch { toast.error('Failed to load'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(1); setPage(1); }, [search, dept, batch]);

  const loadDetail = async (id) => {
    setLoadingDetail(true);
    try { const { data } = await adminAPI.getStudent(id); setDetail(data); }
    catch { toast.error('Failed to load details'); }
    finally { setLoadingDetail(false); }
  };

  const toggleActive = async (s) => {
    try {
      await adminAPI.updateStudent(s._id, { isActive: !s.isActive });
      toast.success(s.isActive ? 'Student deactivated' : 'Student activated');
      load(page);
      if (selected?._id === s._id) loadDetail(s._id);
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this student and all their data?')) return;
    try {
      await adminAPI.deleteStudent(id);
      toast.success('Student deleted');
      load(page);
      if (selected?._id === id) { setSelected(null); setDetail(null); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const avgScore = (subs) => {
    if (!subs?.length) return 0;
    return Math.round(subs.reduce((s, sub) => s + sub.percentage, 0) / subs.length);
  };

  return (
    <div>
      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); load(1); setPage(1); }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">{total} registered students</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* ── Student list ── */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 space-y-2.5">

            {/* Department filter */}
            <div className="flex gap-1.5 flex-wrap">
              {DEPTS.map(d => (
                <button key={d} onClick={() => setDept(d)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors
                    ${dept === d ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {d}
                </button>
              ))}
            </div>

            {/* Batch filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex-shrink-0">Batch:</span>
              <div className="flex gap-1.5 flex-wrap">
                {BATCHES.map(b => (
                  <button key={b} onClick={() => setBatch(b)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors
                      ${batch === b ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by name, ID, email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-gray-50 rounded-lg px-3 py-2 border border-transparent focus:border-amber-300 transition-all"
            />
          </div>

          {loading ? <Spin/> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>
                      <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase">Dept</th>
                      <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase">Batch</th>
                      <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map(s => (
                      <tr key={s._id}
                        onClick={() => { setSelected(s); loadDetail(s._id); }}
                        className={`cursor-pointer transition-colors ${selected?._id === s._id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {s.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                              <p className="text-xs text-gray-400">{s.studentId}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs text-gray-600">{deptLabel[s.department] || s.department}</td>

                        <td className="px-3 py-3">
                          {s.batch ? (
                            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {s.batch}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={e => { e.stopPropagation(); toggleActive(s); }}
                              className="p-1.5 rounded text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors" title="Toggle active">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(s._id); }}
                              className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!students.length && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">No students found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 py-3 border-t border-gray-100">
                  <button onClick={() => { const p = Math.max(1, page-1); setPage(p); load(p); }} disabled={page === 1}
                    className="px-3 py-1 text-xs font-medium rounded border border-gray-200 disabled:opacity-40">←</button>
                  <span className="px-3 py-1 text-xs text-gray-600">{page} / {totalPages}</span>
                  <button onClick={() => { const p = Math.min(totalPages, page+1); setPage(p); load(p); }} disabled={page === totalPages}
                    className="px-3 py-1 text-xs font-medium rounded border border-gray-200 disabled:opacity-40">→</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Student detail ── */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="opacity-30">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <p className="text-sm">Select a student to view details</p>
            </div>
          ) : loadingDetail ? <Spin/> : detail && (
            <div className="p-5 overflow-y-auto max-h-[720px]">
              {/* Avatar + info */}
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-extrabold text-primary flex-shrink-0">
                  {detail.student?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{detail.student?.name}</p>
                  <p className="text-xs text-gray-500">{detail.student?.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {detail.student?.studentId} · {deptLabel[detail.student?.department]}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {detail.student?.batch && (
                      <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {detail.student.batch}
                      </span>
                    )}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${detail.student?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {detail.student?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-primary">{detail.submissions?.length || 0}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Attempts</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-green-600">{avgScore(detail.submissions)}%</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Avg Score</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-amber-500">
                    {detail.submissions?.filter(s => s.percentage >= 60).length || 0}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Passed</p>
                </div>
              </div>

              {/* Submission history */}
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Submission History</h4>
              <div className="space-y-2">
                {(detail.submissions || []).slice(0, 10).map((sub, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{sub.quiz?.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {sub.quiz?.category} · {new Date(sub.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${sub.percentage >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                      {sub.percentage}%
                    </span>
                  </div>
                ))}
                {!detail.submissions?.length && (
                  <p className="text-xs text-gray-400">No submissions yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStudents;
