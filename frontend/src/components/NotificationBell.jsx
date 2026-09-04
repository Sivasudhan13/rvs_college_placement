import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/notificationApi';

const TYPE_ICONS = {
  MockTest: '📝', Training: '🎓', Attendance: '📅',
  Placement: '🏢', Company: '💼', Interview: '🤝',
  Certificate: '🏆', General: '🔔', System: '⚙️',
};

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-GB');
}

export default function NotificationBell() {
  const navigate     = useNavigate();
  const [open, setOpen]   = useState(false);
  const [count, setCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);
  const polling = useRef(null);

  /* ── Fetch unread count ── */
  const fetchCount = useCallback(async () => {
    try {
      const { data } = await notificationAPI.getUnread();
      setCount(data.count || 0);
    } catch {}
  }, []);

  /* ── Fetch recent 5 for dropdown ── */
  const fetchRecent = async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll({ page: 1, limit: 5 });
      setRecent(data.notifications || []);
      setCount(data.unreadCount || 0);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    polling.current = setInterval(fetchCount, 30000); // poll every 30s
    return () => clearInterval(polling.current);
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchRecent();
  }, [open]);

  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (n) => {
    if (!n.isRead) {
      setRecent(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));
      setCount(c => Math.max(0, c - 1));
      try { await notificationAPI.markRead(n._id); } catch {}
    }
    setOpen(false);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const markAll = async () => {
    setRecent(prev => prev.map(n => ({ ...n, isRead: true })));
    setCount(0);
    try { await notificationAPI.markAllRead(); } catch {}
  };

  return (
    <div className="relative" ref={dropRef}>
      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-8 h-8 text-gray-500 hover:text-[#0c5273] rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5 leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">
              Notifications {count > 0 && <span className="text-[#0c5273] font-bold">({count})</span>}
            </h3>
            {count > 0 && (
              <button onClick={markAll} className="text-xs text-[#0c5273] font-medium hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <svg className="animate-spin w-6 h-6 text-[#0c5273] mx-auto" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
                </svg>
              </div>
            ) : recent.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              recent.map(n => (
                <button
                  key={n._id}
                  onClick={() => markRead(n)}
                  className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    !n.isRead ? 'bg-[#0c5273]/3' : ''
                  }`}
                >
                  {!n.isRead && <span className="absolute left-2 mt-1 w-1.5 h-1.5 bg-[#0c5273] rounded-full"/>}
                  <span className="flex-shrink-0 text-base mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'} truncate`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              onClick={() => { setOpen(false); navigate('/student/notifications'); }}
              className="w-full text-center text-xs font-semibold text-[#0c5273] hover:underline"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
