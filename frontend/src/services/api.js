import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  participantSignup: (data) => api.post('/auth/participant/signup', data),
  participantLogin: (data) => api.post('/auth/participant/login', data),
  organizerLogin: (data) => api.post('/auth/organizer/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// User API (Common for all roles)
export const userAPI = {
  getProfile: () => api.get('/participant/profile'),
  updateProfile: (data) => api.put('/participant/profile', data),
};

// Event API
export const eventAPI = {
  getAllEvents: (filters) => api.get('/events', { params: filters }),
  getEventDetails: (id) => api.get(`/events/${id}`),
  registerForEvent: (id, data) => api.post(`/events/${id}/register`, data),
  getMyEvents: () => api.get('/events/participant/my-events'),
};

// Participant API
export const participantAPI = {
  getProfile: () => api.get('/participant/profile'),
  updateProfile: (data) => api.put('/participant/profile', data),
  changePassword: (data) => api.post('/participant/change-password', data),
};

// Organizer API
export const organizerAPI = {
  createEvent: (data) => api.post('/organizer/events', data),
  getEvents: () => api.get('/organizer/events'),
  getEventDetails: (id) => api.get(`/organizer/events/${id}`),
  publishEvent: (id) => api.post(`/organizer/events/${id}/publish`),
  updateEvent: (id, data) => api.put(`/organizer/events/${id}`, data),
  updateEventStatus: (id, data) => api.patch(`/organizer/events/${id}/status`, data),
  updateProfile: (data) => api.put('/organizer/profile', data),
  updateOrganizerProfile: (data) => api.put('/organizer/profile', data),
  getAllOrganizers: () => api.get('/organizer/all'),
  getOrganizerDetails: (id) => api.get(`/organizer/${id}`),
  getOrganizerEvents: (id) => api.get(`/organizer/${id}/events`),
  updateMerchandiseItems: (eventId, formData) =>
    api.put(`/organizer/events/${eventId}/merchandise`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Admin API
export const adminAPI = {
  createOrganizer: (data) => api.post('/admin/organizers', data),
  getAllOrganizers: () => api.get('/admin/organizers'),
  getArchivedOrganizers: () => api.get('/admin/organizers/archived/list'),
  removeOrganizer: (id) => api.delete(`/admin/organizers/${id}`),
  archiveOrganizer: (id) => api.patch(`/admin/organizers/${id}/archive`),
  unarchiveOrganizer: (id) => api.patch(`/admin/organizers/${id}/unarchive`),
  getDashboardStats: () => api.get('/admin/dashboard'),
};

// Team API (Hackathon Team Registration)
export const teamAPI = {
  createTeam: (data) => api.post('/team/create', data),
  getTeamDetails: (teamId) => api.get(`/team/${teamId}`),
  joinTeam: (data) => api.post('/team/join', data),
  getMyTeams: () => api.get('/team/dashboard/my-teams'),
  completeTeamRegistration: (teamId) => api.post(`/team/${teamId}/complete-registration`),
  removeTeamMember: (teamId, memberId) => api.delete(`/team/${teamId}/members/${memberId}`),
  deleteTeam: (teamId) => api.delete(`/team/${teamId}`),
};

// Merchandise API
export const merchandiseAPI = {
  getMerchandiseItems: (eventId) => api.get(`/merchandise/event/${eventId}`),
  placeOrder: (eventId, items) => api.post('/merchandise/order/place', { eventId, items }),
  uploadPaymentProof: (orderId, formData) => api.post(`/merchandise/order/${orderId}/payment-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyOrders: () => api.get('/merchandise/orders/my-orders'),
  getMyOrderForEvent: async (eventId) => {
    const res = await api.get('/merchandise/orders/my-orders');
    const orders = res.data.orders || [];
    const match = orders.find(o => {
      const eid = o.eventId?.toString?.() || o.eventId;
      const eventMatches = eid === eventId || eid === eventId?.toString();
      // Return the latest order for this event (including successful ones)
      return eventMatches;
    });
    return match || null;
  },
  getPendingOrders: () => api.get('/merchandise/approval/pending-orders'),
  getAllOrders: () => api.get('/merchandise/approval/all-orders'),
  approveOrder: (orderId) => api.post(`/merchandise/approval/${orderId}/approve`),
  rejectOrder: (orderId, reason) => api.post(`/merchandise/approval/${orderId}/reject`, { rejectionReason: reason }),
  getOrderDetails: (orderId) => api.get(`/merchandise/order/${orderId}`),
};

// Password Reset API
export const passwordResetAPI = {
  requestReset: (email, role, reason) => api.post('/password-reset/request', { email, role, reason }),
  getResetRequests: () => api.get('/password-reset/requests'),
  getResetHistory: () => api.get('/password-reset/history'),
  getMyRequests: () => api.get('/password-reset/my-requests'),
  approveReset: (requestId) => api.post(`/password-reset/requests/${requestId}/approve`),
  rejectReset: (requestId, reason) => api.post(`/password-reset/requests/${requestId}/reject`, { reason }),
};

// Forum API
export const forumAPI = {
  getMessages: (eventId, since) => api.get(`/forum/${eventId}`, { params: since ? { since } : {} }),
  postMessage: (eventId, data) => api.post(`/forum/${eventId}`, data),
  deleteMessage: (eventId, messageId) => api.delete(`/forum/${eventId}/messages/${messageId}`),
  togglePin: (eventId, messageId) => api.patch(`/forum/${eventId}/messages/${messageId}/pin`),
  reactToMessage: (eventId, messageId, emoji) => api.post(`/forum/${eventId}/messages/${messageId}/react`, { emoji }),
};

export default api;
