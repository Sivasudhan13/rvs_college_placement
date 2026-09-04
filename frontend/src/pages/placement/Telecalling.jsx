import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { placementAPI } from '../../services/placementApi';

const CALL_STATUSES = ['Not Contacted','Called','Interested','Not Interested','Call Back','Email Sent','Meeting Scheduled','Drive Confirmed','Rejected'];
const STATUS_COLOR = {
  'Not Contacted':'bg-gray-100 text-gray-500','Called':'bg-blue-100 text-blue-700',
  'Interested':'bg-green-100 text-green-700','Not Interested':'bg-red-100 text-red-600',
  'Call Back':'bg-amber-100 text-amber-700','Email Sent':'bg-purple-100 text-purple-600',
  'Meeting Scheduled':'bg-cyan-100 text-cyan-700','Drive Confirmed':'bg-emerald-100 text-emerald-700',
  'Rejected':'bg-red-100 text-red-600',
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

/* ── Add / Edit Modal ── */
const RecordModal = ({ record, onClose, onSaved }) => {
  const isEdit = !!record?._id;
  const today  = new Date().toISOString().split('T')[0];
  const empty  = { organizationName:'', hrName:'', contactNumber:'', email:'', location:'', address:'', domain:'IT', callDate: today, callStatus:'Not Contacted', nextFollowUpDate:'', remarks:'' };
  const [form, setForm] = useState(isEdit ? {
    ...record,
    callDate: record.callDate ? record.callDate.split('T')[0] : today,
    nextFollowUpDate: record.nextFollowUpDate ? record.nextFollowUpDate.split('T')[0] : '',
  } : empty);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.organizationName.trim()) { toast.error('Organization name required'); return; }
    setSaving(true);
    try {
      if (isEdit) await placementAPI.updateTelecalling(record._id, form);
      else        await placementAPI.createTelecalling(form);
      toast.success(isEdit ? 'Record updated!' : 'Contact added!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit Contact' : 'Add Company Contact'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Organization Name *</label><input className={inp} value={form.organizationName} onChange={e=>set('organizationName',e.target.value)} autoFocus/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">HR Name</label><input className={inp} value={form.hrName} onChange={e=>set('hrName',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Contact Number</label><input className={inp} value={form.contactNumber} onChange={e=>set('contactNumber',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input type="email" className={inp} value={form.email} onChange={e=>set('email',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Domain</label>
              <select className={inp} value={form.domain} onChange={e=>set('domain',e.target.value)}>
                {['IT','Core','Both'].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Location</label><input className={inp} value={form.location} onChange={e=>set('location',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Call Date</label><input type="date" className={inp} value={form.callDate} onChange={e=>set('callDate',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Call Status</label>
              <select className={inp} value={form.callStatus} onChange={e=>set('callStatus',e.target.value)}>
                {CALL_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Follow-up Date</label><input type="date" className={inp} value={form.nextFollowUpDate} onChange={e=>set('nextFollowUpDate',e.target.value)}/></div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Address</label><input className={inp} value={form.address} onChange={e=>set('address',e.target.value)}/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Remarks</label><textarea rows={3} className={inp} value={form.remarks} onChange={e=>set('remarks',e.target.value)}/></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Follow-up Modal ── */
const FollowUpModal = ({ record, onClose, onSaved }) => {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ date: today, notes:'', status: record.callStatus, nextFollowUpDate:'' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await placementAPI.addFollowUp(record._id, form);
      toast.success('Follow-up added!');
      onSaved();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Add Follow-up — {record.organizationName}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Call Date</label><input type="date" className={inp} value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Call Status</label>
            <select className={inp} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
              {CALL_STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Next Follow-up Date</label><input type="date" className={inp} value={form.nextFollowUpDate} onChange={e=>setForm(p=>({...p,nextFollowUpDate:e.target.value}))}/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label><textarea rows={3} className={inp} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Convert to Drive Modal ── */
const ConvertModal = ({ record, onClose, onSaved }) => {
  const [form, setForm] = useState({ driveDate:'', campusType:'ON Campus', departments:[], jobRole:'', packageLPA:'', venue:'' });
  const [saving, setSaving] = useState(false);
  const DEPTS = ['cse','ece','eee','me','ce','it'];

  const toggleDept = (d) => setForm(p => ({
    ...p, departments: p.departments.includes(d) ? p.departments.filter(x=>x!==d) : [...p.departments, d],
  }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await placementAPI.convertToDrive(record._id, { ...form, packageLPA: Number(form.packageLPA) });
      toast.success('Placement drive created!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="font-bold text-gray-900 mb-1">Create Placement Drive</h2>
        <p className="text-xs text-gray-500 mb-4">{record.organizationName} — company info will be auto-filled</p>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Drive Date</label><input type="date" className={inp} value={form.driveDate} onChange={e=>setForm(p=>({...p,driveDate:e.target.value}))}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Campus Type</label>
              <select className={inp} value={form.campusType} onChange={e=>setForm(p=>({...p,campusType:e.target.value}))}>
                {['ON Campus','OFF Campus','POOLED Campus'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Job Role</label><input className={inp} value={form.jobRole} onChange={e=>setForm(p=>({...p,jobRole:e.target.value}))}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Package (LPA)</label><input type="number" className={inp} value={form.packageLPA} onChange={e=>setForm(p=>({...p,packageLPA:e.target.value}))}/></div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Venue</label><input className={inp} value={form.venue} onChange={e=>setForm(p=>({...p,venue:e.target.value}))}/></div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Departments</label>
            <div className="flex flex-wrap gap-2">
              {DEPTS.map(d=>(
                <button key={d} type="button" onClick={()=>toggleDept(d)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border-2 transition-all ${form.departments.includes(d)?'bg-primary border-primary text-white':'border-gray-200 text-gray-600'}`}>
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Drive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Telecalling() {
  const navigate = useNavigate();
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dueToday,   setDueToday]   = useState(false);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [followup,   setFollowup]   = useState(null);
  const [converting, setConverting] = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await placementAPI.getTelecalling({ search, status: statusFilter, dueToday: dueToday ? 'true' : '', page: p, limit: 15 });
      setRecords(data.records || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); setPage(1); }, [search, statusFilter, dueToday]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try { await placementAPI.deleteTelecalling(id); toast.success('Deleted'); load(page); }
    catch { toast.error('Failed'); }
  };

  // Follow-ups due today count
  const dueTodayCount = records.filter(r => {
    if (!r.nextFollowUpDate) return false;
    const d = new Date(r.nextFollowUpDate); d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d.getTime() === t.getTime();
  }).length;

  return (
    <DashboardLayout>
      {(modal || editing) && (
        <RecordModal
          record={editing}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={() => { setModal(false); setEditing(null); load(page); }}
        />
      )}
      {followup && (
        <FollowUpModal
          record={followup}
          onClose={() => setFollowup(null)}
          onSaved={() => { setFollowup(null); load(page); }}
        />
      )}
      {converting && (
        <ConvertModal
          record={converting}
          onClose={() => setConverting(null)}
          onSaved={() => { setConverting(null); load(page); }}
        />
      )}

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telecalling</h1>
          <p className="text-sm text-gray-500 mt-1">{total} company contacts</p>
        </div>
        <div className="flex gap-2">
          {dueTodayCount > 0 && (
            <button onClick={() => setDueToday(v => !v)}
              className={`flex items-center gap-2 text-sm font-semibold px-3 py-2.5 rounded-xl border transition-colors ${dueToday ? 'bg-amber-400 text-white border-amber-400' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}`}>
              ⏰ Follow-ups Due ({dueTodayCount})
            </button>
          )}
          <button onClick={() => { setEditing(null); setModal(true); }}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            + Add Company Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Search organization…" value={search} onChange={e=>setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">All Statuses</option>
          {CALL_STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? <Spin/> : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Organization','HR Name','Contact','Domain','Call Date','Status','Follow-up','Drive','Actions'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => {
                  const followDue = r.nextFollowUpDate && (() => {
                    const d = new Date(r.nextFollowUpDate); d.setHours(0,0,0,0);
                    const t = new Date(); t.setHours(0,0,0,0);
                    return d <= t;
                  })();
                  return (
                    <tr key={r._id} className={`hover:bg-gray-50 transition-colors ${followDue && !r.driveCreated ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-gray-900">{r.organizationName}</td>
                      <td className="px-4 py-3 text-gray-700">{r.hrName || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{r.contactNumber || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{r.domain}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.callDate ? new Date(r.callDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.callStatus]}`}>{r.callStatus}</span></td>
                      <td className="px-4 py-3 text-xs">
                        {r.nextFollowUpDate ? (
                          <span className={`font-medium ${followDue ? 'text-red-500' : 'text-gray-600'}`}>
                            {new Date(r.nextFollowUpDate).toLocaleDateString('en-GB')}
                            {followDue && <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1 rounded">Due</span>}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.driveCreated
                          ? <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ Created</span>
                          : r.callStatus === 'Drive Confirmed'
                            ? <button onClick={() => setConverting(r)} className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full hover:bg-green-200 transition-colors">Create Drive</button>
                            : <span className="text-[9px] text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => setFollowup(r)}
                            className="text-[10px] font-semibold text-primary hover:underline whitespace-nowrap">+Followup</button>
                          <button onClick={() => { setEditing(r); setModal(true); }}
                            className="p-1 rounded text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          </button>
                          <button onClick={() => handleDelete(r._id)}
                            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!records.length && <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">No records found</td></tr>}
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
