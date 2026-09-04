import axios from 'axios';

// With Vite proxy configured, /api is same-origin in development.
// In production set VITE_API_URL to your deployed backend URL.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/* ── Axios instance ── */
const api = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor — attach Bearer token from localStorage ── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response interceptor — handle 401 globally ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force-logout on an explicit 401 from the server
    // (not on network errors where error.response is undefined)
    if (error.response?.status === 401) {
      // Don't redirect if already on login/register pages
      const publicPaths = ['/login', '/register', '/home'];
      const isPublic = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!isPublic) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/* ════════════════════════════════════════
   AUTH
════════════════════════════════════════ */
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login',    data),
  logout:   ()     => api.post('/auth/logout'),
  getMe:    ()     => api.get ('/auth/me'),
  updateMe: (data) => api.put ('/auth/me',       data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

/* ════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════ */
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

/* ════════════════════════════════════════
   QUIZZES
════════════════════════════════════════ */
export const quizAPI = {
  getAll:    (params) => api.get('/quizzes',          { params }),
  getOne:    (id)     => api.get(`/quizzes/${id}`),
  submit:    (id, data) => api.post(`/quizzes/${id}/submit`, data),
  getResult: (id)     => api.get(`/quizzes/${id}/result`),
  create:    (data)   => api.post('/quizzes',         data),
  update:    (id, data) => api.put(`/quizzes/${id}`,  data),
  remove:    (id)     => api.delete(`/quizzes/${id}`),
};

/* ════════════════════════════════════════
   TASKS
════════════════════════════════════════ */
export const taskAPI = {
  getAll:       (params) => api.get('/tasks',             { params }),
  create:       (data)   => api.post('/tasks',            data),
  update:       (id, data) => api.put(`/tasks/${id}`,     data),
  remove:       (id)     => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
};

/* ════════════════════════════════════════
   ROADMAP
════════════════════════════════════════ */
export const roadmapAPI = {
  get:            ()      => api.get('/roadmap'),
  update:         (data)  => api.put('/roadmap', data),
  updateStepStatus: (data) => api.patch('/roadmap/step', data),
};

export default api;
