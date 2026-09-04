import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { placementAPI } from '../../services/placementApi';

const STATUSES = ['Upcoming','Registration Open','Registration Closed','Completed','Cancelled'];
const CAMPUS   = ['ON Campus','OFF Campus','POOLED Campus'];
const DEPTS    = ['cse','ece','eee','me','ce','it'];
const STATUS_COLOR = {
  'Upcoming':'bg-blue-100 text-blue-700','Registration Open':'bg-green-100 text-green-700',
  'Registration Closed':'bg-amber-100 text-amber-700','Completed':'bg-gray-100 text-gray-600','Cancelled':'bg-red-100 text-red-600',
};
const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary transition-all bg-white';

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ── Drive Form Modal ── */
export const DriveModal = ({ drive, onClose, onSaved }) => {
  const isEdit = !!drive?._id;
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(isEdit ? {
    company: drive.company?._id || drive.company || '',
    driveDate: drive.driveDate ? drive.driveDate.split('T')[0] : '',
    registrationDeadline: drive.registrationDeadline ? drive.registrationDeadline.split('T')[0] : '',
    campusType: drive.campusType || 'ON Campus',
    departments: drive.departments || [],
    batches: drive.batches || [],
    jobRole: drive.jobRole || '',
    packageLPA: drive.packageLPA || '',
    venue: drive.venue || '',
    description: drive.description || '',
    status: drive.status || 'Upcoming',
    minCGPA: drive.minCGPA || '',
    maxBacklogs: drive.maxBacklogs ?? '',
    requiredSkills: (drive.requiredSkills || []).join(', '),
    eligibilityCriteria: drive.eligibilityCriteria || '',
  } : {
    company:'', driveDate:'', registrationDeadline:'', campusType:'ON Campus',
    departments:[], batches:[], jobRole:'', packageLPA:'', venue:'',
    description:'', status:'Upcoming', minCGPA:'', maxBacklogs:'', requiredSkills:'', eligibilityCriteria:'',
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  useEffect(() => {
    placementAPI.getCompanies()
      .then(r => setCompanies(r.data.companies || []))
      .catch(() => {});
  }, []);

  const toggleDept = (d) => {
    setForm(p => ({
      ...p,
      departments: p.departments.includes(d) ? p.departments.filter(x=>x!==d) : [...p.departments, d],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.company) { toast.error('Select a company'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        packageLPA: form.packageLPA ? Number(form.packageLPA) : 0,
        minCGPA:    form.minCGPA    ? Number(form.minCGPA)    : 0,
        maxBacklogs:form.maxBacklogs !== '' ? Number(form.maxBacklogs) : 0,
        requiredSkills: form.requiredSkills ? form.requiredSkills.split(',').map(s=>s.trim()).filter(Boolean) : [],
      };
      if (isEdit) await placementAPI.updateDrive(drive._id, payload);
      else        await placementAPI.createDrive(payload);
      toast.success(isEdit ? 'Drive updated!' : 'Drive created!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Drive' : 'Add Upcoming Drive'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Company *</label>
            <select className={inp} value={form.company} onChange={e=>set('company',e.target.value)}>
              <option value="">Select Company</option>
              {companies.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {companies.length === 0 && <p className="text-[10px] text-amber-600 mt-0.5">No companies found. <a href="/placement/companies" className="underline">Add a company first.</a></p>}
          </div>

          {/* Dates + Campus */}
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Drive Date</label><input type="date" className={inp} value={form.driveDate} onChange={e=>set('driveDate',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Registration Deadline</label><input type="date" className={inp} value={form.registrationDeadline} onChange={e=>set('registrationDeadline',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Campus Type</label>
              <select className={inp} value={form.campusType} onChange={e=>set('campusType',e.target.value)}>
                {CAMPUS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Departments (multi-select) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Branch / Department</label>
            <div className="flex flex-wrap gap-2">
              {DEPTS.map(d => (
                <button key={d} type="button" onClick={() => toggleDept(d)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all
                    ${form.departments.includes(d) ? 'bg-primary border-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary'}`}>
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Role + LPA */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Job Role</label><input className={inp} value={form.jobRole} onChange={e=>set('jobRole',e.target.value)} placeholder="e.g. Software Engineer"/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Package (LPA)</label><input type="number" className={inp} value={form.packageLPA} onChange={e=>set('packageLPA',e.target.value)} placeholder="e.g. 6"/></div>
          </div>

          {/* Venue + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Venue</label><input className={inp} value={form.venue} onChange={e=>set('venue',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select className={inp} value={form.status} onChange={e=>set('status',e.target.value)}>
                {STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Eligibility */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Min CGPA</label><input type="number" step="0.1" className={inp} value={form.minCGPA} onChange={e=>set('minCGPA',e.target.value)} placeholder="e.g. 7.5"/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Max Backlogs</label><input type="number" className={inp} value={form.maxBacklogs} onChange={e=>set('maxBacklogs',e.target.value)} placeholder="e.g. 0"/></div>
          </div>

          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Required Skills (comma separated)</label><input className={inp} value={form.requiredSkills} onChange={e=>set('requiredSkills',e.target.value)} placeholder="JavaScript, React, Node.js"/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Eligibility Criteria</label><textarea rows={2} className={inp} value={form.eligibilityCriteria} onChange={e=>set('eligibilityCriteria',e.target.value)}/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Description</label><textarea rows={2} className={inp} value={form.description} onChange={e=>set('description',e.target.value)}/></div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60">
              {saving ? 'Saving…' : isEdit ? 'Update Drive' : 'Create Drive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function UpcomingDrives() {
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const [drives,     setDrives]    = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [search,     setSearch]    = useState('');
  const [statusFilter, setStatus]  = useState(params.get('status') || '');
  const [modal,      setModal]     = useState(false);
  const [editing,    setEditing]   = useState(null);
  const [total,      setTotal]     = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await placementAPI.getDrives({ search, status: statusFilter });
      setDrives(data.drives || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this drive?')) return;
    try { await placementAPI.deleteDrive(id); toast.success('Drive deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <DashboardLayout>
      {(modal || editing) && (
        <DriveModal
          drive={editing}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={() => { setModal(false); setEditing(null); load(); }}
        />
      )}

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upcoming Drives</h1>
          <p className="text-sm text-gray-500 mt-1">{total} placement drives</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          + Add Upcoming Drive
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Search company…" value={search} onChange={e=>setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"/>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['', ...STATUSES].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap
                ${statusFilter===s ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <Spin/> : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Company','Drive Date','Campus','Departments','Role','LPA','Eligible','Invited','Selected','Status','Actions'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drives.map(d => (
                  <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{d.company?.name?.[0]}</div>
                        <p className="font-semibold text-gray-900 whitespace-nowrap">{d.company?.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{d.driveDate ? new Date(d.driveDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{d.campusType}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{d.departments?.map(x=>x.toUpperCase()).join(', ') || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{d.jobRole || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{d.packageLPA ? `₹${d.packageLPA}` : '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{d.eligibleCount || 0}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{d.invitedCount || 0}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{d.selectedCount || 0}</td>
                    <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[d.status]}`}>{d.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => navigate(`/placement/drives/${d._id}`)}
                          className="text-[10px] font-semibold text-primary hover:underline whitespace-nowrap">View</button>
                        <button onClick={() => { setEditing(d); setModal(true); }}
                          className="p-1 rounded text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                        <button onClick={() => handleDelete(d._id)}
                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!drives.length && (
                  <tr><td colSpan={11} className="px-4 py-12 text-center text-gray-400 text-sm">No drives found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
