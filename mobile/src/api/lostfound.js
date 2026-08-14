import api, { BASE_URL } from './client';

/** Build a full image URL from the stored relative path (e.g. /uploads/x.jpg). */
export function imageUrl(pathOrEmpty) {
  if (!pathOrEmpty) return null;
  if (/^https?:\/\//.test(pathOrEmpty)) return pathOrEmpty;
  return `${BASE_URL}${pathOrEmpty}`;
}

export const LostApi = {
  list: (params = {}) => api.get('/lostfound', { params }).then((r) => r.data),
  get: (id) => api.get(`/lostfound/${id}`).then((r) => r.data.item),

  /**
   * Create a post. `image` is an expo-image-picker asset ({ uri, mimeType, fileName })
   * or null. Sent as multipart/form-data.
   */
  create: ({ type, title, description, category, location, contact, image }) => {
    const form = new FormData();
    form.append('type', type);
    form.append('title', title);
    if (description) form.append('description', description);
    if (category) form.append('category', category);
    if (location) form.append('location', location);
    if (contact) form.append('contact', contact);
    if (image?.uri) {
      const name = image.fileName || image.uri.split('/').pop() || 'photo.jpg';
      const ext = (name.split('.').pop() || 'jpg').toLowerCase();
      form.append('image', {
        uri: image.uri,
        name,
        type: image.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      });
    }
    return api
      .post('/lostfound', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.item);
  },

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
