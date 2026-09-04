import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { attendanceAPI } from '../../services/attendanceApi';

const COLORS = ['#0c5273','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

const StatCard = ({ label, value, sub, icon, color }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-extrabold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  </div>
);

const Spin = () => (
  <div className="flex justify-center py-20">
    <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

export default function AttendanceDashboard() {
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceAPI.getAnalytics()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><Spin /></DashboardLayout>;

  const s = data?.summary || {};
  const daily   = data?.dailyTrend  || [];
  const deptData= data?.deptStats   || [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of training attendance across all departments.</p>
        </div>
        <button onClick={() => navigate('/attendance/mark')}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          ✏️ Mark Attendance
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-7">
        <StatCard label="Total Students"       value={s.totalStudents || 0}    icon="👥" color="bg-blue-50"/>
        <StatCard label="Present Today"        value={s.presentToday  || 0}    icon="✅" color="bg-green-50"/>
        <StatCard label="Absent Today"         value={s.absentToday   || 0}    icon="❌" color="bg-red-50"/>
        <StatCard label="Avg Attendance"       value={`${s.avgAttendance || 0}%`} icon="📊" color="bg-purple-50"/>
        <StatCard label="Training Sessions"    value={s.totalTrainings || 0}   icon="📚" color="bg-amber-50"/>
        <StatCard label="Below 75%"            value={s.belowThreshold || 0}   icon="⚠️" color="bg-orange-50"/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Daily trend */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Daily Attendance — Last 14 Days</h3>
          {daily.length === 0 ? <p className="text-sm text-gray-400 text-center py-10">No data yet</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily}>
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }}/>
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={false} name="Present"/>
                <Line type="monotone" dataKey="absent"  stroke="#ef4444" strokeWidth={2} dot={false} name="Absent"/>
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Dept-wise */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Department-wise Attendance %</h3>
          {deptData.length === 0 ? <p className="text-sm text-gray-400 text-center py-10">No data yet</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} barSize={28}>
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}/>
                <YAxis domain={[0,100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip formatter={v => [`${v}%`, 'Attendance']} contentStyle={{ fontSize: 12, borderRadius: 8 }}/>
                <Bar dataKey="pct" radius={[4,4,0,0]} name="Attendance %">
                  {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Mark Attendance', icon: '✏️', path: '/attendance/mark',    color: 'bg-primary text-white' },
          { label: 'View History',    icon: '📋', path: '/attendance/history', color: 'bg-gray-800 text-white' },
          { label: 'Low Attendance',  icon: '⚠️', path: '/attendance/low',     color: 'bg-amber-500 text-white' },
          { label: 'Reports',         icon: '📊', path: '/attendance/reports', color: 'bg-purple-600 text-white' },
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
