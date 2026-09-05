import api from './client';

export const SearchApi = {
  // { q, posts, resources, clubs, items, lost, people }
  query: (q, limit = 6) => api.get('/search', { params: { q, limit } }).then((r) => r.data),
};
