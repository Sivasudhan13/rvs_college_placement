import axios from 'axios';

// With Vite proxy configured, /api is same-origin in development.
// In production VITE_API_URL must point to the Render backend.
// Normalise: always ensure the base URL ends with /api
const _raw = import.meta.env.VITE_API_URL || '/api';
const BASE_URL = _raw.endsWith('/api') ? _raw : _raw.replace(/\/$/, '') + '/api';

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

/* ════════════════════════════════════════
   PROFILE  (new)
════════════════════════════════════════ */
// Separate axios instance that sends multipart/form-data for uploads
const uploadApi = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,
});
uploadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const profileAPI = {
  get:                ()         => api.get('/profile'),
  update:             (data)     => api.put('/profile', data),
  uploadPhoto:        (formData) => uploadApi.post('/profile/photo',       formData),
  deletePhoto:        ()         => api.delete('/profile/photo'),
  uploadCertificate:  (formData) => uploadApi.post('/profile/certificate', formData),
  deleteCertificate:  ()         => api.delete('/profile/certificate'),
};

/* ════════════════════════════════════════
   AI HR INTERVIEW  (new)
════════════════════════════════════════ */
export const interviewAPI = {
  start:      (data)   => api.post('/interview/start',       data),
  answer:     (id, data) => api.post(`/interview/${id}/answer`,    data),
  complete:   (id, data) => api.post(`/interview/${id}/complete`,  data),
  evaluate:   (id)     => api.post(`/interview/${id}/evaluate`),
  getHistory: (params) => api.get('/interview/history',      { params }),
  getSession: (id)     => api.get(`/interview/${id}`),
  adminStats: ()       => api.get('/interview/admin/stats'),
  getAutoListenConfig:   ()       => api.get('/interview/auto-listen/config'),
  processTranscript:     (data)   => api.post('/interview/auto-listen/process', data),
  getAutoListenFunctions:()       => api.get('/interview/auto-listen/functions'),
};

export default api;
