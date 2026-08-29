import api, { BASE_URL } from './client';

/** Build a full image URL from the stored relative path (e.g. /uploads/x.jpg). */
export function imageUrl(pathOrEmpty) {
  if (!pathOrEmpty) return null;
  if (/^https?:\/\//.test(pathOrEmpty)) return pathOrEmpty;
  return `${BASE_URL}${pathOrEmpty}`;
}

/**
 * Build the multipart body. Only defined keys are appended, so a partial edit
 * never blanks out a field it did not mean to touch.
 */
function toForm({ type, title, description, category, location, contact, image }) {
  const form = new FormData();
  const put = (k, v) => { if (v !== undefined && v !== null) form.append(k, v); };
  put('type', type);
  put('title', title);
  put('description', description);
  put('category', category);
  put('location', location);
  put('contact', contact);
  if (image?.uri) {
    const name = image.fileName || image.uri.split('/').pop() || 'photo.jpg';
    const ext = (name.split('.').pop() || 'jpg').toLowerCase();
    form.append('image', { uri: image.uri, name, type: image.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}` });
  }
  return form;
}

export const LostApi = {
  list: (params = {}) => api.get('/lostfound', { params }).then((r) => r.data),
  get: (id) => api.get(`/lostfound/${id}`).then((r) => r.data.item),

  /**
   * Create a post. `image` is an expo-image-picker asset ({ uri, mimeType, fileName })
   * or null. Sent as multipart/form-data.
   */
  create: (data) =>
    api
      .post('/lostfound', toForm(data), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.item),

  /** Partial edit. Omit `image` to keep the existing photo. */
  update: (id, data) =>
    api
      .patch(`/lostfound/${id}`, toForm(data), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.item),

  /** Toggle interest. Tapping again withdraws it. */
  interest: (id) => api.post(`/lostfound/${id}/interest`).then((r) => r.data),

  setStatus: (id, status) =>
    api.patch(`/lostfound/${id}/status`, { status }).then((r) => r.data.item),
  remove: (id) => api.delete(`/lostfound/${id}`).then((r) => r.data),
  myPosts: () => api.get('/lostfound/me/posts').then((r) => r.data.items),
};

export const LOST_CATEGORIES = [
  { key: 'electronics', label: 'Electronics' },
  { key: 'books', label: 'Books' },
  { key: 'id-card', label: 'ID Card' },
  { key: 'keys', label: 'Keys' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'other', label: 'Other' },
];
