import api from './api';

export const adminAPI = {
  // Dashboard
  getStats:    () => api.get('/admin/stats'),

  // Students
  getStudents:   (params) => api.get('/admin/students', { params }),
  getStudent:    (id)     => api.get(`/admin/students/${id}`),
  createStudent: (data)   => api.post('/admin/students', data),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id)     => api.delete(`/admin/students/${id}`),

  // Quizzes
  getQuizzes:  (params) => api.get('/admin/quizzes', { params }),
  getQuiz:     (id)     => api.get(`/admin/quizzes/${id}`),
  createQuiz:  (data)   => api.post('/admin/quizzes', data),
  updateQuiz:  (id, data) => api.put(`/admin/quizzes/${id}`, data),
  deleteQuiz:  (id)     => api.delete(`/admin/quizzes/${id}`),

  // Questions
  addQuestion:    (quizId, data)            => api.post(`/admin/quizzes/${quizId}/questions`, data),
  updateQuestion: (quizId, qId, data)       => api.put(`/admin/quizzes/${quizId}/questions/${qId}`, data),
  deleteQuestion: (quizId, qId)             => api.delete(`/admin/quizzes/${quizId}/questions/${qId}`),
  bulkImport:     (quizId, questions)       => api.post('/admin/quizzes/bulk-import', { quizId, questions }),

  // Reports
  getReports:     ()          => api.get('/admin/reports'),
  getSubmissions: (params)    => api.get('/admin/reports/submissions', { params }),
};
