# Campus Bond — Backend API

Express + MongoDB (MERN) backend for the Campus Bond app.

## Prerequisites

- **Node.js** 18+ (you have v24)
- **MongoDB Community Server** running locally on `mongodb://127.0.0.1:27017`
  - Check it's running: `mongosh "mongodb://127.0.0.1:27017" --eval "db.runCommand({ping:1})"`

## Setup

```bash
cd server
npm install
cp .env.example .env      # then edit .env (a JWT secret is already generated for you)
npm run dev               # starts on http://localhost:5000 with auto-reload
```

### Email / OTP in development

If you leave the `SMTP_*` values blank in `.env`, verification codes are **printed to the
server console** instead of being emailed. That lets you test signup without a mail server.
To send real emails, fill in `SMTP_HOST/PORT/USER/PASS` (for Gmail, use an App Password).

### Restricting to your campus email

Set `ALLOWED_EMAIL_DOMAIN=yourcollege.edu` in `.env` to only allow that domain to register.
Leave it blank to allow any email during development.

## Deploying to Vercel

The API is deployed as a single Vercel Function (`api/index.js` wraps the Express
app; `vercel.json` rewrites every path to it). Two things differ from local dev:

- **Database** — set `MONGO_URI` to a hosted MongoDB (e.g. Atlas). Connections are
  cached per function instance (`src/config/db.js`).
- **Images** — when `BLOB_READ_WRITE_TOKEN` is present, uploads go to **Vercel Blob**
  and documents store the full Blob URL instead of `/uploads/...`. Locally (no token)
  files still go to `server/uploads/`.

```bash
cd server
vercel link                                  # once
vercel env add MONGO_URI production --sensitive
vercel env add JWT_SECRET production --sensitive
vercel deploy --prod
```

Production URL: `https://campus-bond-api.vercel.app` — the mobile app points at it via
`mobile/.env` (`EXPO_PUBLIC_API_URL`). Without SMTP variables, OTP codes are only
printed to the function logs (`vercel logs`), so set `SMTP_*` for real signups.

## API reference

### Auth — `/api/auth`
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/register` | `name, email, password, branch, semester` | Sends OTP; account not created yet |
| POST | `/verify-otp` | `email, code` | Creates the account, returns `{ token, user }` |
| POST | `/resend-otp` | `email` | New code for a pending signup |
| POST | `/login` | `email, password` | Returns `{ token, user }` |
| GET  | `/me` | — | Current user (requires `Authorization: Bearer <token>`) |

### Events / Team requests — `/api/events` (all require auth)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | Feed. Filters: `?category=&search=&status=&page=&limit=` |
| POST | `/` | Create a post (`title, description, category, skillsNeeded, teamSize, deadline`) |
| GET | `/:id` | Post details + applicants |
| POST | `/:id/apply` | Apply with an optional `message` |
| PATCH | `/:id/applicants/:applicantId` | Owner approves/rejects (`status: approved\|rejected`) |
| PATCH | `/:id/status` | Owner opens/closes (`status: open\|closed`) |
| DELETE | `/:id` | Owner deletes |
| GET | `/me/created` | Posts I created |
| GET | `/me/applications` | Posts I applied to (with my status) |

Auth header for protected routes:

```
Authorization: Bearer <token>
```

## Project structure

```
server/src/
  server.js            # app entry: middleware, routes, startup
  config/db.js         # MongoDB connection
  models/              # User, Otp, Event (Mongoose schemas)
  middleware/          # protect (JWT), adminOnly, error handling
  utils/               # sendEmail (dev-console fallback), generateToken
  controllers/         # authController, eventController
  routes/              # authRoutes, eventRoutes
```
