import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { placementAPI } from '../../services/placementApi';

const STATUS_COLOR = {
  Invited:'bg-blue-100 text-blue-700', Accepted:'bg-green-100 text-green-700',
  Declined:'bg-red-100 text-red-600',  Attended:'bg-purple-100 text-purple-700',
  Selected:'bg-emerald-100 text-emerald-700', Rejected:'bg-gray-100 text-gray-500',
  'Not Invited':'bg-gray-100 text-gray-400',
};
const ALL_STATUSES = ['Invited','Accepted','Declined','Attended','Selected','Rejected'];

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ── Invite Confirm Modal ── */
const InviteModal = ({ count, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">
      <div className="text-5xl mb-3">📨</div>
      <h2 className="text-lg font-extrabold text-gray-900 mb-2">Send Placement Invitation?</h2>
      <p className="text-sm text-gray-500 mb-5"><strong>{count}</strong> student{count !== 1 ? 's' : ''} selected</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60">
          {loading ? 'Sending…' : 'Send Invitation'}
        </button>
      </div>
    </div>
  </div>
);

export default function DriveDetails() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [drive,   setDrive]   = useState(null);
  const [tab,     setTab]     = useState('overview');
  const [loading, setLoading] = useState(true);

  // Eligible students
  const [eligible,   setEligible]   = useState([]);
  const [selected,   setSelected]   = useState(new Set());
  const [eligLoading,setEligLoading]= useState(false);

  // Invitations
  const [invitations, setInvitations] = useState([]);
  const [invLoading,  setInvLoading]  = useState(false);
  const [invFilter,   setInvFilter]   = useState('');

  // Stats
  const [invStats, setInvStats] = useState({});

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [sending,    setSending]    = useState(false);

  const loadDrive = async () => {
    try {
      const { data } = await placementAPI.getDrive(id);
      setDrive(data.drive);
      setInvStats(data.invitationStats || {});
    } catch { toast.error('Drive not found'); navigate('/placement/drives'); }
    finally { setLoading(false); }
  };

  const loadEligible = async () => {
    setEligLoading(true);
    try {
      const { data } = await placementAPI.findEligible(id);
      setEligible(data.students || []);
    } catch { toast.error('Failed to load eligible students'); }
    finally { setEligLoading(false); }
  };

  const loadInvitations = async () => {
    setInvLoading(true);
    try {
      const { data } = await placementAPI.getInvitations(id, { status: invFilter });
      setInvitations(data.invitations || []);
    } catch { toast.error('Failed to load invitations'); }
    finally { setInvLoading(false); }
  };

  useEffect(() => { loadDrive(); }, [id]);
  useEffect(() => { if (tab === 'eligible')   loadEligible(); },    [tab]);
  useEffect(() => { if (tab === 'invited')    loadInvitations(); }, [tab, invFilter]);

  const toggleStudent = (sid) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(sid) ? n.delete(sid) : n.add(sid);
      return n;
    });
  };

  const handleSendInvitations = async () => {
    if (!selected.size) { toast.error('Select at least one student'); return; }
    setShowInvite(true);
  };

  const confirmSend = async () => {
    setSending(true);
    try {
      const { data } = await placementAPI.sendInvitations(id, { studentIds: [...selected] });
      toast.success(`✅ ${data.sent} invitations sent!`);
      setShowInvite(false);
      setSelected(new Set());
      loadDrive();
      loadEligible();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSending(false); }
  };

  const handleUpdateStatus = async (driveId, invId, status) => {
    try {
      await placementAPI.updateInvitation(driveId, invId, { status });
      toast.success('Status updated');
      loadInvitations();
      loadDrive();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <DashboardLayout><Spin/></DashboardLayout>;
  if (!drive)  return null;

  const c = drive.company || {};
  const statList = [
    { label:'Total Eligible', value: drive.eligibleCount  || 0, color:'text-gray-700'     },
    { label:'Invited',        value: invStats.Invited      || 0, color:'text-blue-600'     },
    { label:'Accepted',       value: invStats.Accepted     || 0, color:'text-green-600'    },
    { label:'Declined',       value: invStats.Declined     || 0, color:'text-red-500'      },
    { label:'Attended',       value: invStats.Attended     || 0, color:'text-purple-600'   },
    { label:'Selected',       value: invStats.Selected     || 0, color:'text-emerald-600'  },
    { label:'Rejected',       value: invStats.Rejected     || 0, color:'text-gray-400'     },
  ];

  return (
    <DashboardLayout>
      {showInvite && (
        <InviteModal count={selected.size} onClose={() => setShowInvite(false)} onConfirm={confirmSend} loading={sending}/>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/placement/drives')} className="text-gray-400 hover:text-primary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{c.name}</h1>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                drive.status==='Upcoming'?'bg-blue-100 text-blue-700':drive.status==='Completed'?'bg-gray-100 text-gray-600':'bg-green-100 text-green-700'}`}>
                {drive.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">{drive.jobRole} · {drive.campusType}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTab('eligible'); loadEligible(); }}
            className="flex items-center gap-1.5 border border-primary text-primary text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary hover:text-white transition-colors">
            🔍 Find Eligible Students
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-6">
        {statList.map(st => (
          <div key={st.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className={`text-xl font-extrabold ${st.color}`}>{st.value}</p>
            <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{st.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {[['overview','Overview'],['eligible','Eligible Students'],['invited','Invited Students']].map(([id2, label]) => (
          <button key={id2} onClick={() => setTab(id2)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors
              ${tab===id2 ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Company info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Company Information</h3>
            <div className="space-y-2 text-sm">
              {c.hrName  && <div className="flex gap-2"><span className="text-gray-400 w-20 flex-shrink-0">HR</span><span className="font-medium text-gray-800">{c.hrName}</span></div>}
              {c.hrPhone && <div className="flex gap-2"><span className="text-gray-400 w-20 flex-shrink-0">Phone</span><span className="text-gray-700">{c.hrPhone}</span></div>}
              {c.hrEmail && <div className="flex gap-2"><span className="text-gray-400 w-20 flex-shrink-0">Email</span><span className="text-gray-700 truncate">{c.hrEmail}</span></div>}
              {c.location && <div className="flex gap-2"><span className="text-gray-400 w-20 flex-shrink-0">Location</span><span className="text-gray-700">{c.location}</span></div>}
              {c.website && <div className="flex gap-2"><span className="text-gray-400 w-20 flex-shrink-0">Website</span><a href={c.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{c.website}</a></div>}
            </div>
          </div>

          {/* Drive info */}
          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Drive Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Job Role',    drive.jobRole || '—'],
                ['Package',     drive.packageLPA ? `₹${drive.packageLPA} LPA` : '—'],
                ['Drive Date',  drive.driveDate ? new Date(drive.driveDate).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—'],
                ['Reg Deadline',drive.registrationDeadline ? new Date(drive.registrationDeadline).toLocaleDateString('en-GB') : '—'],
                ['Campus Type', drive.campusType],
                ['Venue',       drive.venue || '—'],
                ['Min CGPA',    drive.minCGPA || 'None'],
                ['Max Backlogs',drive.maxBacklogs !== undefined ? drive.maxBacklogs : 'None'],
              ].map(([k,v]) => (
                <div key={k}><p className="text-[10px] text-gray-400 uppercase tracking-wide">{k}</p><p className="font-semibold text-gray-800 mt-0.5">{v}</p></div>
              ))}
            </div>
            {drive.departments?.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Eligible Departments</p>
                <div className="flex flex-wrap gap-1.5">
                  {drive.departments.map(d => <span key={d} className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{d.toUpperCase()}</span>)}
                </div>
              </div>
            )}
            {drive.requiredSkills?.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {drive.requiredSkills.map(s => <span key={s} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>)}
                </div>
              </div>
            )}
            {drive.description && <p className="mt-4 text-xs text-gray-600 leading-relaxed">{drive.description}</p>}
          </div>
        </div>
      )}

      {/* ── ELIGIBLE STUDENTS ── */}
      {tab === 'eligible' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">{eligible.length}</span> eligible students found</p>
            <div className="flex gap-2">
              <button onClick={() => setSelected(new Set(eligible.map(s=>s._id)))}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                Select All
              </button>
              <button onClick={() => setSelected(new Set())} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                Unselect All
              </button>
              {selected.size > 0 && (
                <button onClick={handleSendInvitations}
                  className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">
                  📨 Invite {selected.size} Selected
                </button>
              )}
            </div>
          </div>

          {eligLoading ? <Spin/> : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 w-10"></th>
                      {['Student Name','Register No','Department','Batch','Invitation Status'].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {eligible.map(s => {
                      const isSel = selected.has(s._id);
                      return (
                        <tr key={s._id} onClick={() => toggleStudent(s._id)}
                          className={`cursor-pointer transition-colors ${isSel ? 'bg-primary/5' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={isSel} onChange={() => toggleStudent(s._id)}
                              onClick={e=>e.stopPropagation()} className="w-4 h-4 accent-primary"/>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.studentId}</td>
                          <td className="px-4 py-3 text-gray-600">{s.department?.toUpperCase()}</td>
                          <td className="px-4 py-3 text-gray-600">{s.batch || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[s.invitationStatus] || STATUS_COLOR['Not Invited']}`}>
                              {s.invitationStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {!eligible.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No eligible students found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INVITED STUDENTS ── */}
      {tab === 'invited' && (
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {['', ...ALL_STATUSES].map(s => (
              <button key={s} onClick={() => setInvFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors
                  ${invFilter===s ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {invLoading ? <Spin/> : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Student','Register No','Department','Batch','Status','Invited On','Update Status'].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invitations.map(inv => (
                      <tr key={inv._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{inv.student?.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{inv.student?.studentId}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.student?.department?.toUpperCase()}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.student?.batch || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[inv.status]}`}>{inv.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(inv.invitedAt).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3">
                          <select value={inv.status}
                            onChange={e => handleUpdateStatus(id, inv._id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-primary">
                            {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {!invitations.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No invitations found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
