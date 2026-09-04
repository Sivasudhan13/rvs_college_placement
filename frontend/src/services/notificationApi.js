import axios from 'axios';

const _raw = import.meta.env.VITE_API_URL || '/api';
const BASE_URL = _raw.endsWith('/api') ? _raw : _raw.replace(/\/$/, '') + '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const notificationAPI = {
  getAll:       (params) => api.get('/notifications', { params }),
  getUnread:    ()       => api.get('/notifications/unread-count'),
  markRead:     (id)     => api.put(`/notifications/${id}/read`),
  markAllRead:  ()       => api.put('/notifications/read-all'),
  create:       (data)   => api.post('/notifications', data),
  remove:       (id)     => api.delete(`/notifications/${id}`),
};

export default notificationAPI;
