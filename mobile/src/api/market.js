import api from './client';
export { imageUrl } from './lostfound';

function toForm({ title, description, price, category, condition, contact, image }) {
  const form = new FormData();
  form.append('title', title);
  form.append('price', String(price));
  if (description) form.append('description', description);
  if (category) form.append('category', category);
  if (condition) form.append('condition', condition);
  if (contact) form.append('contact', contact);
  if (image?.uri) {
    const name = image.fileName || image.uri.split('/').pop() || 'photo.jpg';
    const ext = (name.split('.').pop() || 'jpg').toLowerCase();
    form.append('image', { uri: image.uri, name, type: image.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}` });
  }
  return form;
}

export const MarketApi = {
  list: (params = {}) => api.get('/market', { params }).then((r) => r.data),
  get: (id) => api.get(`/market/${id}`).then((r) => r.data.item),
  create: (data) =>
    api.post('/market', toForm(data), { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.item),
  setStatus: (id, status) => api.patch(`/market/${id}/status`, { status }).then((r) => r.data.item),
  remove: (id) => api.delete(`/market/${id}`).then((r) => r.data),
  myListings: () => api.get('/market/me/listings').then((r) => r.data.items),
};

export const MARKET_CATEGORIES = [
  { key: 'books', label: 'Books' },
  { key: 'notes', label: 'Notes' },
  { key: 'kit', label: 'Drawing Kit' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'instruments', label: 'Instruments' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'other', label: 'Other' },
];

export const CONDITIONS = [
  { key: 'new', label: 'New' },
  { key: 'like-new', label: 'Like new' },
  { key: 'good', label: 'Good' },
  { key: 'fair', label: 'Fair' },
];
