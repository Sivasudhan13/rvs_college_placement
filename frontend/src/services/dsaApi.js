import api from './api';

export const dsaAPI = {
  // Problems
  getProblems:    (params) => api.get('/dsa/problems', { params }),
  getProblem:     (slug)   => api.get(`/dsa/problems/${slug}`),
  runCode:        (id, data)    => api.post(`/dsa/problems/${id}/run`, data),
  submitCode:     (id, data)    => api.post(`/dsa/problems/${id}/submit`, data),
  getNextProblem: (slug)   => api.get(`/dsa/problems/next/${slug}`),

  // Submissions
  getSubmissions: (params) => api.get('/dsa/submissions', { params }),
  getSubmission:  (id)     => api.get(`/dsa/submissions/${id}`),

  // Progress
  getMyProgress:    ()       => api.get('/dsa/progress'),
  getUserProgress:  (userId) => api.get(`/dsa/progress/${userId}`),

  // Leaderboard
  getLeaderboard: (params) => api.get('/dsa/leaderboard', { params }),
};
