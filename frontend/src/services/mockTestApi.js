import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const publicPaths = ['/login', '/register', '/home', '/forgot-password', '/reset-password'];
      const isPublic = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!isPublic) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const mockTestAPI = {
  /* Student */
  getTests:      (params) => api.get('/mock-tests', { params }),
  getTest:       (id)     => api.get(`/mock-tests/${id}`),
  startTest:     (id)     => api.post(`/mock-tests/${id}/start`),
  submitTest:    (id, body) => api.post(`/mock-tests/${id}/submit`, body),
  getResult:     (id)     => api.get(`/mock-tests/${id}/result`),
  getHistory:    (params) => api.get('/mock-tests/history', { params }),
  getLeaderboard:(id)     => api.get(`/mock-tests/${id}/leaderboard`),

  /* Admin */
  getAdminStats: ()       => api.get('/mock-tests/stats'),
  createTest:    (data)   => api.post('/mock-tests', data),
  updateTest:    (id, data) => api.put(`/mock-tests/${id}`, data),
  deleteTest:    (id)     => api.delete(`/mock-tests/${id}`),
  addQuestion:   (id, q)  => api.post(`/mock-tests/${id}/questions`, q),
  updateQuestion:(id, qId, q) => api.put(`/mock-tests/${id}/questions/${qId}`, q),
  deleteQuestion:(id, qId) => api.delete(`/mock-tests/${id}/questions/${qId}`),
};

export default mockTestAPI;
