import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { placementAPI } from '../../services/placementApi';

const STATUS_COLOR = {
  'Upcoming':           'bg-blue-100 text-blue-700',
  'Registration Open':  'bg-green-100 text-green-700',
  'Registration Closed':'bg-amber-100 text-amber-700',
  'Completed':          'bg-gray-100 text-gray-600',
  'Cancelled':          'bg-red-100 text-red-600',
};
const CAMPUS_ICON = { 'ON Campus': '🏫', 'OFF Campus': '🏢', 'POOLED Campus': '🤝' };

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

export default function PlacementDashboard() {
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    placementAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><Spin /></DashboardLayout>;

  const s = data?.summary || {};
  const upcomingDrives = data?.upcomingDrives || [];

  const stats = [
    { label: 'Upcoming Drives',    value: s.upcomingCount  || 0, icon: '📅', color: 'bg-blue-50 text-blue-600',   path: '/placement/drives?status=Upcoming'           },
    { label: "Today's Drives",     value: s.todayCount     || 0, icon: '🎯', color: 'bg-green-50 text-green-600',  path: '/placement/drives'                           },
    { label: 'Registration Open',  value: s.openCount      || 0, icon: '📝', color: 'bg-amber-50 text-amber-600',  path: '/placement/drives?status=Registration+Open'  },
    { label: 'Completed',          value: s.completedCount || 0, icon: '✅', color: 'bg-gray-50 text-gray-600',    path: '/placement/drives?status=Completed'          },
    { label: 'Total Companies',    value: s.totalCompanies || 0, icon: '🏢', color: 'bg-purple-50 text-purple-600',path: '/placement/companies'                        },
    { label: 'Students Invited',   value: s.totalInvited   || 0, icon: '📨', color: 'bg-cyan-50 text-cyan-600',    path: '/placement/drives'                           },
    { label: 'Students Selected',  value: s.totalSelected  || 0, icon: '🏆', color: 'bg-emerald-50 text-emerald-600', path: '/placement/drives'                        },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage drives, companies and student invitations.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/placement/drives/new')}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            + Add Drive
          </button>
          <button onClick={() => navigate('/placement/companies')}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Companies
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-7">
        {stats.map(st => (
          <button key={st.label} onClick={() => navigate(st.path)}
            className={`${st.color} rounded-2xl p-4 text-left hover:opacity-90 transition-opacity`}>
            <span className="text-xl block mb-1">{st.icon}</span>
            <p className="text-2xl font-extrabold leading-none">{st.value}</p>
            <p className="text-[10px] font-medium opacity-80 mt-1 leading-tight">{st.label}</p>
          </button>
        ))}
      </div>

      {/* Upcoming drives grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Upcoming Placement Drives</h2>
        <button onClick={() => navigate('/placement/drives')} className="text-xs text-primary font-semibold hover:underline">View All →</button>
      </div>

      {upcomingDrives.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <span className="text-5xl">📋</span>
          <p className="text-sm">No upcoming drives yet</p>
          <button onClick={() => navigate('/placement/drives/new')}
            className="text-xs text-primary font-semibold hover:underline">Create the first drive →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {upcomingDrives.map(drive => (
            <div key={drive._id}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all">
              {/* Company + status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-extrabold text-base flex-shrink-0">
                    {drive.company?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{drive.company?.name}</p>
                    <p className="text-[10px] text-gray-400">{drive.company?.type}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[drive.status]}`}>
                  {drive.status}
                </span>
              </div>

              {/* Role + LPA */}
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-800">{drive.jobRole || 'Role TBD'}</p>
                {drive.packageLPA > 0 && (
                  <p className="text-sm text-green-600 font-bold">₹{drive.packageLPA} LPA</p>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-2 mb-4 text-[10px] text-gray-500">
                {drive.driveDate && (
                  <span className="flex items-center gap-1">
                    📅 {new Date(drive.driveDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                )}
                <span>{CAMPUS_ICON[drive.campusType]} {drive.campusType}</span>
                {drive.departments?.length > 0 && (
                  <span>🎓 {drive.departments.map(d => d.toUpperCase()).join(', ')}</span>
                )}
              </div>

              <button onClick={() => navigate(`/placement/drives/${drive._id}`)}
                className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                View Drive →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-7">
        {[
          { label: 'All Drives',   icon: '📋', path: '/placement/drives',    color: 'bg-primary text-white' },
          { label: 'Companies',    icon: '🏢', path: '/placement/companies', color: 'bg-gray-800 text-white' },
          { label: 'Telecalling',  icon: '📞', path: '/placement/telecalling', color: 'bg-amber-500 text-white' },
          { label: 'My Invitations', icon: '📨', path: '/placement/invitations', color: 'bg-purple-600 text-white' },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className={`${a.color} rounded-2xl p-4 text-left hover:opacity-90 transition-opacity`}>
            <span className="text-2xl block mb-2">{a.icon}</span>
            <p className="text-sm font-bold">{a.label}</p>
          </button>
        ))}
      </div>
    </DashboardLayout>
  );
}
