# 🎓 Campus Bond

A verified campus app that connects students across all branches and semesters — one platform for collaboration, reuse, and engagement, instead of scattered department WhatsApp groups.

## Tech stack

- **Mobile app:** React Native (Expo)
- **Backend:** Node.js + Express (MERN)
- **Database:** MongoDB
- **Auth:** College-email OTP verification + JWT

## Monorepo layout

```
Campus-Bond/
  website/    # React 19 + Vite + Tailwind CSS Web App
  mobile/     # Expo React Native Mobile App
  server/     # Express + MongoDB API & AI Services
```

## Roadmap

Built in layers — each phase is runnable before the next begins.

- [x] **Phase 0 — Foundation:** OTP auth, JWT, User model, and the Event/Hackathon feature with the approval-based apply system.
- [x] **Phase 1 — Mobile foundation:** Expo app, navigation, auth screens (signup → OTP → login), Home Explore grid, Event feed + apply/approve UI. Design inspired by the Sunstone app (navy + gold).
- [ ] **Phase 2+ — One feature per step:**
  - [ ] Lost & Found (post an item with an image)
  - [ ] Second-hand marketplace (buy/sell study items)
  - [ ] Contest & Quiz (branch-wise)
  - [ ] Campus Map
  - [ ] Campus Score (student engagement points)
  - [ ] Campus Q&A
  - [ ] Previous-year papers
  - [ ] Placement Hub (referrals + resume templates)
  - [ ] Club section (management)
  - [ ] Emergency Help (e.g. "Need blood" → notify nearby students)

## Getting started

See [`server/README.md`](server/README.md) to run the backend. The mobile app will live in `mobile/`.
