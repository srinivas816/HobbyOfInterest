# Hobby of Interest (skillshare-hub)

Creative-class marketplace demo: **Vite + React** frontend and **Express + Prisma** API. Learners browse classes, enroll, watch lessons, and use **Classroom** (`/learn/:slug/classroom`) for announcements, Q&A, and assignments. Instructors manage curriculum and teaching tools in **Instructor Studio** (announcements, assignments, demo payouts). After schema changes, run `npx prisma db push` in `server/`. Demo payout balances use **₹500 per enrollment** (paise in DB) for UI only.

## Prerequisites

- Node.js 20+ (or 18 LTS) and npm
- **PostgreSQL 14+** (local install, cloud instance, or Docker — see below)

## Quick start (local)

### 1. API + database

```bash
cd server
cp .env.example .env
# Set DATABASE_URL in .env (default in .env.example matches docker-compose).
# Optional: start local Postgres — docker compose up -d
# Edit server/.env if needed (JWT_SECRET, optional Cloudinary / Gemini / OpenAI)
npm install
npx prisma db push
npm run db:seed
npm run dev
```

If you previously used SQLite, point `DATABASE_URL` at Postgres and run `db push` + `db:seed` again (data does not migrate automatically).

API runs at **http://localhost:3001** (see `PORT` in `server/.env`).

### 2. Frontend

From the **repository root**:

```bash
npm install
npm run dev
```

App runs at **http://localhost:8080**. In dev, `/api` is proxied to the API (`vite.config.ts`).

Optional: set `VITE_API_URL` in root `.env.example` → copy to `.env` if the UI and API are on different origins.

### 3. Optional AI onboarding

If `GEMINI_API_KEY` or `OPENAI_API_KEY` is set in `server/.env`, onboarding can use LLM-assisted suggestions. If unset, the app should still run using catalog fallbacks (see `OnboardingPage` / `server/src/routes/onboarding.ts`).

## One command (both servers)

From the repo root after installing dependencies in **both** root and `server/`:

```bash
npm install
cd server && npm install && cd ..
npm run dev:stack
```

This runs Vite and the API together (requires the `concurrently` dev dependency from root `npm install`).

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| Root | `npm run dev` | Vite dev server |
| Root | `npm run dev:stack` | Vite + API via concurrently |
| Root | `npm run build` | Production build |
| Root | `npm test` | Vitest |
| `server/` | `npm run dev` | API with watch |
| `server/` | `npm run db:push` | Apply Prisma schema to DB |
| `server/` | `npm run db:seed` | Seed demo users & classes |
| `server/` | `npm run db:studio` | Prisma Studio |

## Demo accounts

After seeding, typical logins (password `demo12345` unless you changed seed):

- Learner: `learner@demo.com`
- Admin moderation: `admin@demo.com` (also listed in `ADMIN_EMAILS`)

## Legal placeholders

`/privacy`, `/terms`, and `/cookies` ship with **demo copy** only. Replace with counsel-approved text before production.

## Tech stack

- UI: React 18, React Router, TanStack Query, Tailwind, shadcn-style components
- API: Express, Zod, JWT auth, **PostgreSQL** (Prisma)

## Deploy (free tier: Neon + Render + Vercel)

- **Learning + documenting (beginners):** **[docs/DEPLOY-BEGINNER.md](docs/DEPLOY-BEGINNER.md)** — what each piece does, key terms, and a copy-paste checklist for your own notes.  
- **Technical steps:** **[docs/DEPLOY.md](docs/DEPLOY.md)** — Neon → Render (`server/`) → Vercel/Netlify (repo root), `VITE_API_URL` + `CORS_ORIGIN`.

Repo includes **`vercel.json`** (SPA rewrites) and **`netlify.toml`** (optional Netlify build + redirects).
