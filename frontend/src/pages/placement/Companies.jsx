import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { placementAPI } from '../../services/placementApi';

const TYPES = ['IT','Core','Analytics','Consulting','Finance','Manufacturing','Healthcare','Startup','Other'];
const DOMAIN = ['Core','IT','Both'];
const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary transition-all bg-white';

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ── Company Form Modal ── */
const CompanyModal = ({ company, onClose, onSaved }) => {
  const isEdit = !!company?._id;
  const empty = { name:'', industry:'', type:'IT', domain:'IT', website:'', location:'', address:'', hrName:'', hrPhone:'', hrEmail:'', description:'', notes:'' };
  const [form, setForm] = useState(isEdit ? { ...company } : empty);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Company name required'); return; }
    setSaving(true);
    try {
      if (isEdit) await placementAPI.updateCompany(company._id, form);
      else        await placementAPI.createCompany(form);
      toast.success(isEdit ? 'Company updated!' : 'Company created!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Company' : 'Add New Company'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Name + Type + Domain */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name *</label>
              <input className={inp} value={form.name} onChange={e=>set('name',e.target.value)} autoFocus/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Domain</label>
              <select className={inp} value={form.domain} onChange={e=>set('domain',e.target.value)}>
                {DOMAIN.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Company Type</label>
              <select className={inp} value={form.type} onChange={e=>set('type',e.target.value)}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label>
              <input className={inp} value={form.industry} onChange={e=>set('industry',e.target.value)} placeholder="e.g. Software"/>
            </div>
          </div>

          {/* HR */}
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">HR Name</label><input className={inp} value={form.hrName} onChange={e=>set('hrName',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">HR Phone</label><input className={inp} value={form.hrPhone} onChange={e=>set('hrPhone',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">HR Email</label><input type="email" className={inp} value={form.hrEmail} onChange={e=>set('hrEmail',e.target.value)}/></div>
          </div>

          {/* Location + Website */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Location</label><input className={inp} value={form.location} onChange={e=>set('location',e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Website</label><input className={inp} value={form.website} onChange={e=>set('website',e.target.value)} placeholder="https://"/></div>
          </div>

          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Address</label><textarea rows={2} className={inp} value={form.address} onChange={e=>set('address',e.target.value)}/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Description</label><textarea rows={2} className={inp} value={form.description} onChange={e=>set('description',e.target.value)}/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label><textarea rows={2} className={inp} value={form.notes} onChange={e=>set('notes',e.target.value)}/></div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60">
              {saving ? 'Saving…' : isEdit ? 'Update Company' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [type,      setType]      = useState('');
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await placementAPI.getCompanies({ search, type });
      setCompanies(data.companies || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, type]);

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this company?')) return;
    try { await placementAPI.deleteCompany(id); toast.success('Archived'); load(); }
    catch { toast.error('Failed'); }
  };

  const TYPE_BADGE = { IT:'bg-blue-100 text-blue-700', Core:'bg-orange-100 text-orange-700', Analytics:'bg-purple-100 text-purple-700', Startup:'bg-green-100 text-green-700' };

  return (
    <DashboardLayout>
      {(modal || editing) && (
        <CompanyModal
          company={editing}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={() => { setModal(false); setEditing(null); load(); }}
        />
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-1">{companies.length} companies registered</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          + Add Company
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Search companies…" value={search} onChange={e=>setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"/>
        </div>
        <select value={type} onChange={e=>setType(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">All Types</option>
          {TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? <Spin/> : companies.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <span className="text-5xl">🏢</span>
          <p className="text-sm">No companies found</p>
          <button onClick={() => setModal(true)} className="text-xs text-amber-500 font-semibold hover:underline">Add the first company</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map(c => (
            <div key={c._id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-extrabold text-lg flex-shrink-0">
                    {c.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{c.name}</p>
                    <p className="text-[10px] text-gray-400">{c.industry || c.location}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_BADGE[c.type] || 'bg-gray-100 text-gray-600'}`}>{c.type}</span>
              </div>

              {/* HR info */}
              {c.hrName && <p className="text-xs text-gray-600 mb-1">👤 {c.hrName}{c.hrPhone ? ` · ${c.hrPhone}` : ''}</p>}
              {c.hrEmail && <p className="text-xs text-gray-600 mb-3 truncate">✉️ {c.hrEmail}</p>}

              {/* Domain badge */}
              <div className="flex gap-2 mb-4">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{c.domain}</span>
                {c.location && <span className="text-[9px] text-gray-400">📍 {c.location}</span>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => navigate(`/placement/companies/${c._id}`)}
                  className="flex-1 text-xs font-semibold py-2 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                  View Drives
                </button>
                <button onClick={() => { setEditing(c); setModal(true); }}
                  className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
                <button onClick={() => handleDelete(c._id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
