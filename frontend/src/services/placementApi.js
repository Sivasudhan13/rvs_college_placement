import api from './api';

export const placementAPI = {
  // Dashboard
  getDashboard: () => api.get('/placement/dashboard'),

  // Companies
  getCompanies:   (params)   => api.get('/placement/companies', { params }),
  createCompany:  (data)     => api.post('/placement/companies', data),
  getCompany:     (id)       => api.get(`/placement/companies/${id}`),
  updateCompany:  (id, data) => api.put(`/placement/companies/${id}`, data),
  deleteCompany:  (id)       => api.delete(`/placement/companies/${id}`),

  // Drives
  getDrives:      (params)   => api.get('/placement/drives', { params }),
  createDrive:    (data)     => api.post('/placement/drives', data),
  getDrive:       (id)       => api.get(`/placement/drives/${id}`),
  updateDrive:    (id, data) => api.put(`/placement/drives/${id}`, data),
  deleteDrive:    (id)       => api.delete(`/placement/drives/${id}`),

  // Eligibility & Invitations
  findEligible:       (id)        => api.get(`/placement/drives/${id}/eligible`),
  sendInvitations:    (id, data)  => api.post(`/placement/drives/${id}/invite`, data),
  getInvitations:     (id, p)     => api.get(`/placement/drives/${id}/invitations`, { params: p }),
  updateInvitation:   (did, iid, data) => api.put(`/placement/drives/${did}/invitations/${iid}`, data),

  // Student's own invitations
  getMyInvitations: () => api.get('/placement/my-invitations'),

  // Telecalling
  getTelecalling:    (params)   => api.get('/placement/telecalling', { params }),
  createTelecalling: (data)     => api.post('/placement/telecalling', data),
  updateTelecalling: (id, data) => api.put(`/placement/telecalling/${id}`, data),
  deleteTelecalling: (id)       => api.delete(`/placement/telecalling/${id}`),
  addFollowUp:       (id, data) => api.post(`/placement/telecalling/${id}/followup`, data),
  convertToDrive:    (id, data) => api.post(`/placement/telecalling/${id}/convert`, data),
};
