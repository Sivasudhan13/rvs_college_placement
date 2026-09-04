import api from './api';

export const attendanceAPI = {
  // Trainings
  getTrainings:   (params) => api.get('/attendance/trainings', { params }),
  createTraining: (data)   => api.post('/attendance/trainings', data),
  updateTraining: (id, d)  => api.put(`/attendance/trainings/${id}`, d),
  deleteTraining: (id)     => api.delete(`/attendance/trainings/${id}`),

  // Mark attendance
  loadStudents:   (params) => api.get('/attendance/load-students', { params }),
  bulkMark:       (data)   => api.post('/attendance/bulk', data),

  // CRUD
  getAttendance:  (params) => api.get('/attendance', { params }),
  updateRecord:   (id, d)  => api.put(`/attendance/${id}`, d),
  deleteRecord:   (id)     => api.delete(`/attendance/${id}`),

  // Reports
  getAnalytics:        ()           => api.get('/attendance/analytics'),
  getLowAttendance:    (params)     => api.get('/attendance/low-attendance', { params }),
  getStudentReport:    (id, params) => api.get(`/attendance/report/student/${id}`, { params }),
  getDepartmentReport: (params)     => api.get('/attendance/report/department', { params }),
  getTrainingReport:   (id)         => api.get(`/attendance/report/training/${id}`),
};
