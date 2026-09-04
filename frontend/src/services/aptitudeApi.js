import api from './api';

export const aptitudeAPI = {
  // Questions
  getQuestions: (params) => api.get('/aptitude/questions', { params }),
  getQuestion:  (id)     => api.get(`/aptitude/questions/${id}`),
  attemptQuestion: (id, data) => api.post(`/aptitude/questions/${id}/attempt`, data),

  // Tests
  getTests:     (params) => api.get('/aptitude/tests', { params }),
  getTest:      (id)     => api.get(`/aptitude/tests/${id}`),
  startTest:    (id)     => api.post(`/aptitude/tests/${id}/start`),
  submitTest:   (id, data) => api.post(`/aptitude/tests/${id}/submit`, data),
  getResult:    (attemptId) => api.get(`/aptitude/tests/results/${attemptId}`),
  getHistory:   (params) => api.get('/aptitude/tests/history', { params }),

  // Progress
  getProgress:  () => api.get('/aptitude/progress'),

  // Daily challenge
  getDailyChallenge: () => api.get('/aptitude/daily-challenge'),
  submitDailyChallenge: (data) => api.post('/aptitude/daily-challenge/submit', data),

  // Leaderboard
  getLeaderboard: (params) => api.get('/aptitude/leaderboard', { params }),
};
