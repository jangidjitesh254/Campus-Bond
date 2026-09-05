import { Linking } from 'react-native';
import api from './client';
import { imageUrl } from './lostfound';

/** Absolute URL for a stored file path (`/uploads/...`). */
export const fileUrl = imageUrl;

export const RESOURCE_KINDS = [
  { key: 'pyq', label: 'Past paper', short: 'PYQ' },
  { key: 'notes', label: 'Notes', short: 'NOTES' },
  { key: 'slides', label: 'Slides', short: 'SLIDES' },
  { key: 'other', label: 'Other', short: 'FILE' },
];

export function kindLabel(kind) {
  return RESOURCE_KINDS.find((k) => k.key === kind)?.label || 'File';
}

export function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toForm({ title, description, kind, subject, branch, semester, year, file }) {
  const form = new FormData();
  form.append('title', title);
  form.append('subject', subject);
  if (kind) form.append('kind', kind);
  if (description) form.append('description', description);
  if (branch) form.append('branch', branch);
  if (semester) form.append('semester', String(semester));
  if (year) form.append('year', String(year));
  if (file?.uri) {
    const name = file.name || file.uri.split('/').pop() || 'file';
    form.append('file', { uri: file.uri, name, type: file.mimeType || 'application/octet-stream' });
  }
  return form;
}

export const ResourcesApi = {
  list: (params = {}) => api.get('/resources', { params }).then((r) => r.data),
  get: (id) => api.get(`/resources/${id}`).then((r) => r.data.resource),
  create: (data) =>
    api
      .post('/resources', toForm(data), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.resource),
  // Counts the download (and credits the uploader); returns { downloads, file }.
  download: (id) => api.post(`/resources/${id}/download`).then((r) => r.data),
  remove: (id) => api.delete(`/resources/${id}`).then((r) => r.data),
  myUploads: () => api.get('/resources/me/uploads').then((r) => r.data.resources),
};

/**
 * Open a shared file in whatever the phone uses for it (browser / PDF viewer).
 * The download is recorded first so the uploader gets credit, but a failure
 * there must never stop the file from opening.
 */
export async function openResource(resource) {
  ResourcesApi.download(resource._id).catch(() => {});
  const url = fileUrl(resource.file);
  if (url) await Linking.openURL(url);
}
