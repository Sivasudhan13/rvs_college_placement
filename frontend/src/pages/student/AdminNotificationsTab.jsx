import React, { useState } from 'react';
import { notificationAPI } from '../../services/notificationApi';
import toast from 'react-hot-toast';

const TYPES = ['General','MockTest','Training','Attendance','Placement','Company','Interview','Certificate','System'];
const AUDIENCES = [
  { value: 'all',        label: 'All Students' },
  { value: 'department', label: 'By Department' },
  { value: 'year',       label: 'By Year' },
  { value: 'batch',      label: 'By Batch' },
  { value: 'section',    label: 'By Section' },
];

const DEPTS = ['CSE','IT','ECE','EEE','MECH','CIVIL','MBA','MCA'];

const empty = () => ({
  title: '', message: '', type: 'General',
  targetAudience: 'all',
  department: '', year: '', batch: '', section: '',
  actionUrl: '',
});

export default function AdminNotificationsTab() {
  const [form, setForm] = useState(empty());
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const send = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message required');
      return;
    }
    setSending(true);
    try {
      const { data } = await notificationAPI.create(form);
      toast.success(`Sent to ${data.sent} students`);
      setLastResult({ sent: data.sent, title: form.title });
      setForm(empty());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="text-base font-bold text-gray-900">Send Notification</h2>

      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-600">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Notification Sent!</p>
            <p className="text-xs text-green-600 mt-0.5">"{lastResult.title}" was sent to {lastResult.sent} students.</p>
          </div>
          <button onClick={() => setLastResult(null)} className="ml-auto text-green-500 hover:text-green-700 text-lg leading-none">×</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Notification title"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273]"/>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message *</label>
          <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={4} placeholder="Notification message…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273]"/>
          <p className="text-[11px] text-gray-400 mt-1">{form.message.length} characters</p>
        </div>

        {/* Type + Audience */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Target Audience</label>
            <select value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>

        {/* Conditional filters */}
        {form.targetAudience === 'department' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Department</label>
            <select value={form.department} onChange={e => set('department', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select department</option>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        )}
        {form.targetAudience === 'year' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Year</label>
            <select value={form.year} onChange={e => set('year', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select year</option>
              {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
        )}
        {form.targetAudience === 'batch' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Batch (e.g. 2023-2027)</label>
            <input value={form.batch} onChange={e => set('batch', e.target.value)} placeholder="2023-2027"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20"/>
          </div>
        )}
        {form.targetAudience === 'section' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Section</label>
            <input value={form.section} onChange={e => set('section', e.target.value)} placeholder="e.g. A"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20"/>
          </div>
        )}

        {/* Action URL */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Action URL (optional)</label>
          <input value={form.actionUrl} onChange={e => set('actionUrl', e.target.value)} placeholder="/student/mock-tests"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20"/>
          <p className="text-[11px] text-gray-400 mt-1">Students can click to navigate to this route.</p>
        </div>

        {/* Preview */}
        {(form.title || form.message) && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Preview</p>
            <div className="flex items-start gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{form.title || '—'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{form.message || '—'}</p>
                <p className="text-[10px] text-gray-400 mt-1">just now</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={send} disabled={sending || !form.title || !form.message}
          className="w-full bg-[#0c5273] hover:bg-[#0a4561] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
          {sending ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
              </svg>
              Sending…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Send Notification
            </>
          )}
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">How notifications work:</p>
        <p>• In-app: instantly visible in student notification bell</p>
        <p>• Email: sent automatically via Nodemailer (if SMTP configured)</p>
        <p>• Mock Test notifications are auto-sent when you publish a test</p>
      </div>
    </div>
  );
}
