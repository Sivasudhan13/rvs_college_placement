import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { notificationAPI } from '../../services/notificationApi';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  MockTest:   'bg-blue-100 text-blue-700',
  Training:   'bg-purple-100 text-purple-700',
  Attendance: 'bg-orange-100 text-orange-700',
  Placement:  'bg-green-100 text-green-700',
  Company:    'bg-teal-100 text-teal-700',
  Interview:  'bg-indigo-100 text-indigo-700',
  Certificate:'bg-yellow-100 text-yellow-700',
  General:    'bg-gray-100 text-gray-700',
  System:     'bg-red-100 text-red-700',
};

const TYPE_ICONS = {
  MockTest:   '📝',
  Training:   '🎓',
  Attendance: '📅',
  Placement:  '🏢',
  Company:    '💼',
  Interview:  '🤝',
  Certificate:'🏆',
  General:    '🔔',
  System:     '⚙️',
};

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-GB');
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('All');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotal]    = useState(1);
  const [unread, setUnread]       = useState(0);

  useEffect(() => { fetchData(1); }, [filter]);

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (filter === 'Unread') params.unreadOnly = true;
      const { data } = await notificationAPI.getAll(params);
      setItems(p === 1 ? (data.notifications || []) : prev => [...prev, ...(data.notifications || [])]);
      setTotal(data.totalPages || 1);
      setUnread(data.unreadCount || 0);
      setPage(p);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    setItems(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnread(u => Math.max(0, u - 1));
    try { await notificationAPI.markRead(id); } catch {}
  };

  const markAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await notificationAPI.markAllRead();
      toast.success('All marked as read');
    } catch {
      toast.error('Failed');
    }
  };

  const remove = async (id) => {
    const removed = items.find(n => n._id === id);
    setItems(prev => prev.filter(n => n._id !== id));
    if (!removed?.isRead) setUnread(u => Math.max(0, u - 1));
    try {
      await notificationAPI.remove(id);
    } catch {
      setItems(prev => [removed, ...prev]);
    }
  };

  const handleClick = (n) => {
    if (!n.isRead) markRead(n._id);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const filtered = filter === 'All' ? items : items.filter(n => !n.isRead);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            {unread > 0 && <p className="text-sm text-gray-500 mt-0.5">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead}
              className="text-sm text-[#0c5273] font-semibold hover:underline">
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {['All','Unread'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                filter === f ? 'border-[#0c5273] text-[#0c5273]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {f}
              {f === 'Unread' && unread > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"/>
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4"/>
                  <div className="h-3 bg-gray-200 rounded w-full"/>
                  <div className="h-3 bg-gray-200 rounded w-1/3"/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="text-gray-500 font-medium">{filter === 'Unread' ? 'All caught up!' : 'No notifications yet'}</h3>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'Unread' ? 'You have no unread notifications.' : 'New notifications will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={`relative bg-white rounded-xl border transition-all cursor-pointer group ${
                  !n.isRead ? 'border-[#0c5273]/30 bg-[#0c5273]/2 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {!n.isRead && (
                  <span className="absolute top-4 left-3 w-2 h-2 bg-[#0c5273] rounded-full"/>
                )}
                <div className={`flex gap-3 p-4 ${!n.isRead ? 'pl-7' : ''}`}>
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${TYPE_COLORS[n.type] || TYPE_COLORS.General}`}>
                    {TYPE_ICONS[n.type] || '🔔'}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {n.title}
                      </h3>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[n.type] || TYPE_COLORS.General}`}>
                        {n.type}
                      </span>
                      {n.actionUrl && (
                        <span className="text-[11px] text-[#0c5273] font-medium">View →</span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#0c5273] hover:bg-gray-100 transition-colors"
                        title="Mark as read"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(n._id); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Load more */}
            {page < totalPages && (
              <button onClick={() => fetchData(page + 1)} disabled={loading}
                className="w-full py-3 text-sm font-medium text-[#0c5273] hover:bg-gray-50 rounded-xl border border-dashed border-gray-200 transition-colors">
                {loading ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
