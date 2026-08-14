import api from './client';
export { imageUrl } from './lostfound';

function toForm({ name, description, category, image }) {
  const form = new FormData();
  form.append('name', name);
  if (description) form.append('description', description);
  if (category) form.append('category', category);
  if (image?.uri) {
    const fname = image.fileName || image.uri.split('/').pop() || 'logo.jpg';
    const ext = (fname.split('.').pop() || 'jpg').toLowerCase();
    form.append('image', { uri: image.uri, name: fname, type: image.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}` });
  }
  return form;
}

export const ClubApi = {
  list: (params = {}) => api.get('/clubs', { params }).then((r) => r.data.clubs),
  get: (id) => api.get(`/clubs/${id}`).then((r) => r.data.club),
  create: (data) =>
    api.post('/clubs', toForm(data), { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.club),
  join: (id) => api.post(`/clubs/${id}/join`).then((r) => r.data),
  leave: (id) => api.post(`/clubs/${id}/leave`).then((r) => r.data),
  remove: (id) => api.delete(`/clubs/${id}`).then((r) => r.data),
  mine: () => api.get('/clubs/me/joined').then((r) => r.data.clubs),
};

export const CLUB_CATEGORIES = [
  { key: 'tech', label: 'Tech' },
  { key: 'cultural', label: 'Cultural' },
  { key: 'sports', label: 'Sports' },
  { key: 'academic', label: 'Academic' },
  { key: 'arts', label: 'Arts' },
  { key: 'social', label: 'Social' },
  { key: 'other', label: 'Other' },
];
