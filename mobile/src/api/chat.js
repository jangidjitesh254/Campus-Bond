import api from './client';

export const ChatApi = {
  // Open (or fetch) the conversation for an accepted request.
  open: (eventId, userId) =>
    api.post('/chat/open', { eventId, userId }).then((r) => r.data.conversation),
  conversations: () => api.get('/chat/conversations').then((r) => r.data.conversations),
  messages: (conversationId) =>
    api.get(`/chat/conversations/${conversationId}/messages`).then((r) => r.data.messages),
  send: (conversationId, text) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { text }).then((r) => r.data.message),
};
