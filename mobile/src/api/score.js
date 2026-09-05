import api from './client';

export const ScoreApi = {
  // { total, rank, students, breakdown: [{action,label,count,points}], recent: [...] }
  me: () => api.get('/score/me').then((r) => r.data),
  user: (id) => api.get(`/score/user/${id}`).then((r) => r.data),
  // { leaders: [{rank, name, branch, avatar, campusScore}], me: { rank, total } }
  leaderboard: (limit = 10) => api.get('/score/leaderboard', { params: { limit } }).then((r) => r.data),
  // [{ action, label, points }]
  rules: () => api.get('/score/rules').then((r) => r.data.rules),
};

/** The next round number the ring fills towards, so it never sits at 100%. */
export function nextMilestone(total) {
  const steps = [50, 100, 250, 500, 1000, 2500, 5000];
  return steps.find((s) => s > total) || Math.ceil((total + 1) / 5000) * 5000;
}
