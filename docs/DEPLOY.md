# Deploy Hobby of Interest (free-tier friendly)

**New to deployment?** Start with **[DEPLOY-BEGINNER.md](./DEPLOY-BEGINNER.md)** — concepts, vocabulary, and a template to document your own setup — then come back here for the exact steps.

**Architecture, env vars, and production incident notes** (CORS, Render, Prisma INT4, etc.): **[APPLICATION-AND-DEPLOY-REFERENCE.md](./APPLICATION-AND-DEPLOY-REFERENCE.md)**.

---

Your repo is a **monorepo**:

| Path        | What to deploy        |
|------------|------------------------|
| Repo root  | Vite/React → static host (Vercel or Netlify) |
| `server/`  | Express API → Render (or similar) |
| Database   | **Neon** (free Postgres) or Render Postgres |

**Costs:** Neon + Vercel hobby + Render free web service are $0 to start. Render’s free API **sleeps** after ~15 min idle (cold start ~30–60s).

---

## 1. Database (Neon)

1. Sign up at [neon.tech](https://neon.tech) → create a project → create a database.
2. Copy the **connection string** (must include `?sslmode=require` if Neon shows it).
3. Keep it for step 2 as `DATABASE_URL`.

---

## 2. API on Render

1. Push this repo to **GitHub** (if needed).
2. [Render](https://render.com) → **New** → **Web Service** → connect the repo.
3. Settings:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:**
     ```bash
     npm install && npm run build && npx prisma db push
     ```
     (`postinstall` already runs `prisma generate`.)
   - **Start Command:**
     ```bash
     npm start
     ```
4. **Instance type:** Free.
5. **Environment** → add variables:

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | Neon connection string |
   | `JWT_SECRET` | Long random string (e.g. `openssl rand -hex 32`) |
   | `NODE_ENV` | `production` |
   | `ADMIN_EMAILS` | Your admin email(s), comma-separated (e.g. `admin@demo.com`) |
   | `CORS_ORIGIN` | Your **frontend URL(s)** only, comma-separated, **no trailing slash** (e.g. `https://your-app.vercel.app`) |

   Optional (only if you use them): `CLOUDINARY_*`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `SMTP_*`, `RAZORPAY_*`.

   **Do not set `PORT`** — Render injects it.

6. **Create Web Service** and wait for the first deploy.
7. Copy the service URL, e.g. `https://skillshare-hub-api.onrender.com`.

8. **Health check:** open `https://YOUR-API.onrender.com/api/health` → should return `{"ok":true}`.

9. **Seed demo data (once):** Render dashboard → your service → **Shell**, then:
   ```bash
   npm run db:seed
   ```
   Logins after seed: `learner@demo.com` / `demo12345`, `admin@demo.com` / `demo12345` (see `README.md`).

If the build fails with missing `typescript` or Prisma, change the **Build Command** to:
```bash
npm install --include=dev && npm run build && npx prisma db push
```

---

## 3. Frontend on Vercel (recommended)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import the **same** GitHub repo.
2. **Root Directory:** leave as **repository root** (not `server`).
3. Framework Preset: **Vite** (auto-detected).
4. **Build Command:** `npm run build`  
5. **Output Directory:** `dist`
6. **Environment Variables** (Production):

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://YOUR-API.onrender.com` — **no trailing slash** |

7. Deploy.

8. Update **Render** `CORS_ORIGIN` to include your real Vercel URL, e.g. `https://your-project.vercel.app`, then **Manual Deploy** → **Clear build cache & deploy** (or empty commit) if the API rejected requests before.

`vercel.json` in the repo adds SPA **rewrites** so routes like `/learn` and `/courses/...` work on refresh.

**Preview deployments:** If you use Vercel preview URLs, add each origin to `CORS_ORIGIN` on Render (comma-separated), or temporarily use a wildcard only for demos (not recommended for production).

---

## 4. Frontend on Netlify (alternative)

1. **New site from Git** → same repo.
2. **Base directory:** repo root.
3. **Build command:** `npm run build`
4. **Publish directory:** `dist`
5. **Environment variables:** `VITE_API_URL` = your Render API URL (no trailing slash).
6. `netlify.toml` already includes SPA redirects.

Add your Netlify URL to Render `CORS_ORIGIN`.

---

## 5. After deploy checklist

- [ ] `/api/health` on Render returns OK  
- [ ] Browser: open Vercel/Netlify URL → catalog loads (no CORS errors in devtools)  
- [ ] Login with seeded `learner@demo.com` / `demo12345`  
- [ ] If uploads fail: set Cloudinary env vars on Render  

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| CORS errors | `CORS_ORIGIN` on Render matches the **exact** browser origin (scheme + host, no trailing `/`). |
| 404 on refresh | Vercel: `vercel.json` rewrites. Netlify: `netlify.toml` redirects. |
| API always slow first hit | Render free tier sleep — normal. |
| Prisma / build errors on Render | Use `npm install --include=dev` in build command; ensure `DATABASE_URL` is set. |
| UI calls wrong API | `VITE_API_URL` must be set **before** the frontend build; redeploy after changing it. |

---

## Optional: Render Postgres instead of Neon

Create a **PostgreSQL** instance on Render, use its **Internal Database URL** on the Web Service in the same region/account, and skip Neon. Steps above stay the same except `DATABASE_URL` source.
