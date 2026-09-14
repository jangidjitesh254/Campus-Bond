import api from './client';

export const AnnouncementsApi = {
  // Live announcements for the Home banner, pinned first.
  list: () => api.get('/announcements').then((r) => r.data.announcements),
  create: (payload) => api.post('/announcements', payload).then((r) => r.data.announcement),
  remove: (id) => api.delete(`/announcements/${id}`).then((r) => r.data),
};
