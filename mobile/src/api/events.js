import api from './client';

export const EventsApi = {
  list: (params = {}) => api.get('/events', { params }).then((r) => r.data),
  get: (id) => api.get(`/events/${id}`).then((r) => r.data.event),
  create: (payload) => api.post('/events', payload).then((r) => r.data.event),
  apply: (id, message) => api.post(`/events/${id}/apply`, { message }).then((r) => r.data),
  review: (id, applicantId, status) =>
    api.patch(`/events/${id}/applicants/${applicantId}`, { status }).then((r) => r.data.event),
  setStatus: (id, status) =>
    api.patch(`/events/${id}/status`, { status }).then((r) => r.data.event),
  remove: (id) => api.delete(`/events/${id}`).then((r) => r.data),
  myCreated: () => api.get('/events/me/created').then((r) => r.data.events),
  myApplications: () => api.get('/events/me/applications').then((r) => r.data.applications),
};

export const CATEGORIES = [
  { key: 'hackathon', label: 'Hackathon' },
  { key: 'cultural', label: 'Cultural' },
  { key: 'competition', label: 'Competition' },
  { key: 'project', label: 'Project' },
  { key: 'other', label: 'Other' },
];

export const categoryTone = {
  hackathon: 'accent',
  cultural: 'success',
  competition: 'danger',
  project: 'default',
  other: 'muted',
};
