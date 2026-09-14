import axios from 'axios';

export const TOKEN_KEY = 'campusbond_token';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors, auto-retry transient glitches, & auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Seamless auto-retry once on transient network drop, timeout, or 503 (DB reconnecting)
    const isTransientError =
      !error.response ||
      error.response.status === 503 ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error');

    if (isTransientError && config && !config._retry) {
      config._retry = true;
      // Wait 1.2s for backend/heartbeat self-healing to finish
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return api(config);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // If we're not already on login or register, redirect to login
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.message ||
      (error.request ? 'Cannot reach the server. Make sure backend is running.' : error.message);
    return Promise.reject(new Error(message));
  }
);

// --- Auth APIs ---
export const authService = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// --- Events & Collaborations APIs ---
export const eventService = {
  getEvents: (params) => api.get('/events', { params }),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  applyToEvent: (id, message) => api.post(`/events/${id}/apply`, { message }),
  expressInterest: (id) => api.post(`/events/${id}/interest`),
  addComment: (id, text) => api.post(`/events/${id}/comments`, { text }),
  updateEventStatus: (id, status) => api.patch(`/events/${id}/status`, { status }),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  reviewApplicant: (id, applicantId, status) =>
    api.patch(`/events/${id}/applicants/${applicantId}`, { status }),
  getMyCreated: () => api.get('/events/me/created'),
  getMyApplications: () => api.get('/events/me/applications'),
};

// --- Lost & Found APIs ---
export const lostFoundService = {
  getLostItems: (params) => api.get('/lostfound', { params }),
  getLostItemById: (id) => api.get(`/lostfound/${id}`),
  createLostItem: (formData) => api.post('/lostfound', formData),
  updateLostStatus: (id, status) => api.patch(`/lostfound/${id}/status`, { status }),
  deleteLostItem: (id) => api.delete(`/lostfound/${id}`),
  getMyPosts: () => api.get('/lostfound/me/posts'),
};

// --- Marketplace APIs ---
export const marketService = {
  getMarketItems: (params) => api.get('/market', { params }),
  getMarketItemById: (id) => api.get(`/market/${id}`),
  createMarketItem: (formData) => api.post('/market', formData),
  updateMarketStatus: (id, status) => api.patch(`/market/${id}/status`, { status }),
  deleteMarketItem: (id) => api.delete(`/market/${id}`),
  getMyListings: () => api.get('/market/me/listings'),
};

// --- Clubs APIs ---
export const clubService = {
  getClubs: (params) => api.get('/clubs', { params }),
  getClubById: (id) => api.get(`/clubs/${id}`),
  createClub: (formData) => api.post('/clubs', formData),
  joinClub: (id) => api.post(`/clubs/${id}/join`),
  leaveClub: (id) => api.post(`/clubs/${id}/leave`),
  deleteClub: (id) => api.delete(`/clubs/${id}`),
  getMyJoined: () => api.get('/clubs/me/joined'),
};

// --- Chat & Messages APIs ---
export const chatService = {
  getCampusStudents: (search) => api.get('/chat/users', { params: { search } }),
  openConversation: (participantId, eventId, message) =>
    api.post('/chat/open', { participantId, userId: participantId, eventId, message }),
  respondToChatRequest: (conversationId, action) =>
    api.patch(`/chat/conversations/${conversationId}/respond`, { action }),
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId) =>
    api.get(`/chat/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, text) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { text }),
};

// --- AI Assistant APIs ---
export const assistantService = {
  ask: (query, userName, history = []) =>
    api.post('/assistant/query', { query, userName, history }),
};

// --- AI Skill Match APIs ---
export const skillMatchService = {
  getMatchedEvents: () => api.get('/skill-match/events'),
  getMatchedTeammates: (params) => api.get('/skill-match/teammates', { params }),
  searchSkillMatches: (query) => api.post('/skill-match/query', { query }),
  extractSkills: (text) => api.post('/skill-match/extract', { text }),
};

export default api;
