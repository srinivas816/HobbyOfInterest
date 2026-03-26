# Deployment for beginners — learn the process & document your own

This guide assumes you’ve never deployed a full-stack app before. It explains **what** you’re doing and **why**, then shows **how to write it down** so future you (or a teammate) can repeat it without guessing.

For the **exact click-by-click steps** for this project, use **[DEPLOY.md](./DEPLOY.md)** after you read the concepts below.

For a **single full reference** — repo layout, frontend/backend breakdown, Neon/Render/Netlify, env vars, and **issues we already hit in production** (CORS, Prisma, INT4, Render port binding, etc.) — see **[APPLICATION-AND-DEPLOY-REFERENCE.md](./APPLICATION-AND-DEPLOY-REFERENCE.md)**.

---

## 1. What “deploy” means here

Today your app runs on **your computer**: the website in the browser talks to an API on your machine, and data lives in a database (often also on your machine or in Docker).

**Deploying** means:

1. Putting the **database** on a computer in the cloud that’s always on (or “serverless” — still managed for you).
2. Putting the **API** (the `server/` folder — Express + Prisma) on a **host** that runs Node.js 24/7 (or wakes up when someone calls it, on free tiers).
3. Putting the **website** (the built React app — the `dist/` folder after `npm run build`) on a **static host** that only serves files + handles “single page app” URLs.

Users then open a **public URL** (e.g. `https://my-app.vercel.app` or `https://my-app.netlify.app`). Their browser loads your site from **Vercel** or **Netlify**; the site calls your API on Render using `VITE_API_URL`; the API talks to Neon using `DATABASE_URL`.

You are **not** copying files by hand each time — you connect **GitHub** so that when you push code, hosts can **rebuild** and **redeploy** automatically (if you turn that on).

---

## 2. The three boxes (remember this)

| Box | Plain English | In this repo | Typical free host |
|-----|----------------|--------------|-------------------|
| **Database** | Where users, courses, logins are stored | PostgreSQL via Prisma | **Neon** |
| **Backend / API** | The “brain”: login, enroll, save data | Folder **`server/`** | **Render** (Web Service) |
| **Frontend** | What people see and click | Built from **repo root** → `dist/` | **Vercel** or **Netlify** |

They are **three separate services**. Each has its own URL or connection string. They only work together if you **configure** them (environment variables + CORS).

---

## 3. Words you’ll see everywhere

| Term | Simple meaning |
|------|----------------|
| **Repository (repo)** | Your project on GitHub — source code + folders like `server/`. |
| **Monorepo** | One repo with **both** frontend code (root) and backend (`server/`). |
| **Build** | Turning source code into something runnable (e.g. `npm run build` → `dist/`). |
| **Environment variable** | A secret or setting the host injects at runtime (e.g. `DATABASE_URL`). Never commit real secrets to Git — set them in the host’s dashboard. |
| **Connection string** | A long URL-like string that tells the API how to log into the database. |
| **CORS** | Browser security: your API must **allow** your website’s exact URL, or the browser blocks requests. That’s why `CORS_ORIGIN` on Render must list your **Vercel or Netlify** site URL. |
| **HTTPS** | Encrypted `https://` URLs. Production almost always uses this. |
| **DNS / domain** | Optional later: `www.yoursite.com` pointing to Vercel/Netlify. Free tiers give you a random subdomain first. |
| **Health check** | A simple URL (here: `/api/health`) hosts use to see if the API is alive. |
| **Cold start** | On free Render, the API **sleeps** when idle; first request after sleep can take ~30–60 seconds. |

---

## 4. First-time setup vs future deploys

### First time (one-time learning curve)

**Short version:** accounts → Neon DB → Render API + env + seed → **Vercel or Netlify** frontend + `VITE_API_URL` → CORS matches that frontend URL.

Below is the **same path with enough detail** that you can follow it without guessing. For host-specific screenshots and troubleshooting, keep **[DEPLOY.md](./DEPLOY.md)** open in another tab.

#### Step 1 — Create the accounts (about 15 minutes)

Do these in any order; you need all four roles before the chain works end-to-end.

1. **GitHub** ([github.com](https://github.com))  
   - Sign up → confirm email.  
   - Create a **new repository** (or use an existing one) and **push this project** so Render and Vercel can read it (`git remote add origin …`, `git push -u origin main`).  
   - You do **not** need to upload `.env` files; secrets stay in each host’s dashboard.  
   - You can use **Vercel** or **Netlify** for the website — same env var (`VITE_API_URL`), different dashboard URLs.

2. **Neon** ([neon.tech](https://neon.tech))  
   - Sign up → create a **Project** → create a **branch** (default is fine).  
   - You’ll use this only as **Postgres** for Prisma (this repo’s production DB is not SQLite).

3. **Render** ([render.com](https://render.com))  
   - Sign up → connect your **GitHub** account when asked (so Render can “see” your repo).

4. **Vercel** ([vercel.com](https://vercel.com)) **or** **Netlify** ([netlify.com](https://netlify.com))  
   - Sign up → connect **GitHub** the same way.  
   - [DEPLOY.md](./DEPLOY.md) has full steps for **both** Vercel and Netlify (see sections 3 and 4 there). This repo includes `netlify.toml` (SPA redirects for React Router).

#### Step 2 — Create the database and save `DATABASE_URL`

1. In **Neon**: open your project → find **Connection details** (or “Connect”).  
2. Copy the **connection string** for **Node** / **Prisma** — it usually looks like  
   `postgresql://USER:PASSWORD@HOST/DB?sslmode=require`.  
3. Treat this entire string as **`DATABASE_URL`**.  
   - Paste it **only** into Render’s environment variables (next step), not into a public README or GitHub issue.  
4. **Why:** the API on Render runs `npx prisma db push` on deploy so Postgres gets the same tables as your local schema.

#### Step 3 — Create the API on Render (env vars, deploy, seed once)

1. **Render** → **New** → **Web Service** → pick the **GitHub repo** that contains this project.  
2. **Critical settings** (must match this monorepo):

   | Field | Value |
   |--------|--------|
   | **Root Directory** | `server` |
   | **Build Command** | `npm install && npm run build && npx prisma db push` (if build fails, see [DEPLOY.md](./DEPLOY.md) for the `--include=dev` variant) |
   | **Start Command** | `npm start` |
   | **Instance type** | Free tier is OK (expect **cold starts** after idle) |

3. **Environment variables** on Render (Production) — add **before** or **after** first deploy, then redeploy if you changed them:

   | Key | What to put |
   |-----|----------------|
   | `DATABASE_URL` | The Neon string from Step 2 |
   | `JWT_SECRET` | Long random secret (e.g. run `openssl rand -hex 32` on your machine) |
   | `NODE_ENV` | `production` |
   | `ADMIN_EMAILS` | Comma-separated emails allowed to use admin API (e.g. your real email) |
   | `CORS_ORIGIN` | For the **first** deploy you can temporarily use `http://localhost:8080` **or** skip until Step 5 — you **must** set your real frontend URL once **Vercel or Netlify** gives you one (see Step 5) |

   **Do not** set `PORT` on Render; the platform sets it.  
   Optional: `CLOUDINARY_*`, `GEMINI_API_KEY`, etc., only if you use those features ([DEPLOY.md](./DEPLOY.md)).

4. **Create Web Service** and wait until the deploy finishes.  
5. Copy the public API URL (e.g. `https://something.onrender.com`).  
6. **Smoke test:** open `https://YOUR-SERVICE.onrender.com/api/health` in a browser → expect `{"ok":true}`.  
7. **Seed once** (creates demo users — see root `README.md` for `learner@demo.com` / `demo12345`). Without seed, login tests on production won’t work.

   **Free tier (no Render Shell):** run the seed **from your own computer** against the **same Postgres** your API uses (the `DATABASE_URL` you put on Render — copy it from **Render → Environment** or from **Neon → Connection details**). Do **not** commit that string or paste it into GitHub.

   ```bash
   cd server
   npm install
   export DATABASE_URL="paste-your-postgres-url-here"
   npm run db:seed
   ```

   On **Windows (PowerShell)**:

   ```powershell
   cd server
   npm install
   $env:DATABASE_URL="paste-your-postgres-url-here"
   npm run db:seed
   ```

   **Paid Render Shell (optional):** Render dashboard → your web service → **Shell** → `npm run db:seed`. If `tsx` is missing in that environment, use `npx tsx prisma/seed.ts` instead.

#### Step 4 — Create the frontend on **Vercel** or **Netlify** and point it at the API

Use **one** host for the website. Settings are the same idea: repo **root** (not `server`), build produces **`dist/`**, and **`VITE_API_URL`** must be your Render API URL **with no trailing slash**.

##### Option A — Vercel

1. **Vercel** → **Add New** → **Project** → import the **same** GitHub repo.  
2. **Root Directory:** **repository root** (empty / default) — **not** `server`.  
3. Framework: **Vite** (usually auto-detected).  
4. **Build Command:** `npm run build` · **Output Directory:** `dist`.  
5. **Environment variable (Production):**

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://YOUR-API.onrender.com` — **no trailing slash** |

6. **Deploy**, then copy your site URL (e.g. `https://your-project.vercel.app`).

##### Option B — Netlify

1. **Netlify** → **Add new site** → **Import an existing project** → connect the **same** GitHub repo.  
2. **Base directory:** leave **empty** (repo root) — **not** `server`.  
3. **Build command:** `npm run build`  
4. **Publish directory:** `dist`  
5. **Environment variables** → **Add a variable** (Production):

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://YOUR-API.onrender.com` — **no trailing slash** |

6. **Deploy site**, then copy your URL (e.g. `https://random-name.netlify.app`).  
   SPA routing: this repo’s **`netlify.toml`** already redirects client-side routes to `index.html` (same idea as `vercel.json` on Vercel).

**Both hosts:** `VITE_*` variables are baked in at **build time**. If you change `VITE_API_URL` later, trigger a **new** deployment on that host.

**After deploy:** open your live site. If catalog/API calls fail, check **DevTools → Console** — often you’ll see a **CORS** error until Step 5 matches your real frontend origin.

#### Step 5 — Fix CORS (when the frontend URL wasn’t known at Step 3)

Browsers only allow your site to call your API if the API **explicitly allows** your site’s origin.

1. Copy your **exact** frontend origin (no path, **no** trailing `/`), for example:  
   - Vercel: `https://your-project.vercel.app`  
   - Netlify: `https://your-site.netlify.app` (or your custom domain)  
2. **Render** → your API service → **Environment** → edit **`CORS_ORIGIN`**:  
   - One URL: paste that origin only.  
   - Several (e.g. Netlify deploy previews + production, or Vercel preview + production): comma-separated, still **no** trailing slashes, e.g.  
     `https://main--your-site.netlify.app,https://your-site.netlify.app`  
3. **Save** → trigger a **redeploy** of the API (Manual Deploy → **Clear build cache & deploy** is fine if things were cached oddly).  
4. Hard-refresh the live site (or open in a private window) and check **Console** again — API requests should succeed.

**Order reminder:** you need a **final** `VITE_API_URL` on **Vercel or Netlify** and a matching **`CORS_ORIGIN`** on Render. If either is wrong, you get a working API in isolation (`/api/health` OK) but a broken site in the browser.

### Later deploys (when you change code)

Usually:

1. **Push** to GitHub (`main` or your production branch).
2. **Render** rebuilds the API if auto-deploy is on.
3. **Vercel** or **Netlify** rebuilds the site if auto-deploy is on.

You **only** touch dashboards again when you:

- Add or change **environment variables**
- Change **database schema** (then you rely on `prisma db push` in the API build, or run migrations — this project uses `db push` in the deploy doc)
- Change **CORS** (new frontend URL, Netlify preview URL, or Vercel preview URL)

---

## 5. How to document *your* deploy (template)

Copy this into your own note (Notion, Google Doc, `MY-DEPLOY-NOTES.md` in a **private** place — not public Git with secrets).

### A. My services (fill when created)

| Piece | Provider | Dashboard link | Public URL or note |
|-------|----------|----------------|-------------------|
| Database | Neon | | Internal: `DATABASE_URL` (never paste full string in public docs) |
| API | Render | | `https://____________.onrender.com` |
| Website | Vercel *or* Netlify | | `https://____________.vercel.app` or `https://____________.netlify.app` |

### B. Environment variables (names only — values stay in dashboards)

**Render (API)**

- [ ] `DATABASE_URL` — from Neon  
- [ ] `JWT_SECRET` — long random secret  
- [ ] `NODE_ENV` — `production`  
- [ ] `ADMIN_EMAILS` — comma-separated emails  
- [ ] `CORS_ORIGIN` — **exact** frontend URL(s), no trailing `/`  

**Vercel or Netlify (frontend)**

- [ ] `VITE_API_URL` — **exact** Render API URL, no trailing `/` (same variable name on both hosts)  

### C. Build settings (this repo)

| Service | Root directory | Build command | Start / output |
|---------|----------------|-----------------|----------------|
| Render | `server` | `npm install && npm run build && npx prisma db push` | `npm start` |
| Vercel | repo root | `npm run build` | Output: `dist` |
| Netlify | repo root (base dir empty) | `npm run build` | Publish: `dist` |

### D. After first deploy checklist

- [ ] Open `https://YOUR-API.onrender.com/api/health` → `{"ok":true}`  
- [ ] Open your Vercel URL → site loads, no CORS errors in browser **DevTools → Console**  
- [ ] Ran `npm run db:seed` once in **Render Shell**  
- [ ] Logged in with test user from README  

### E. When something breaks — write it down

Keep a tiny log:

| Date | What I changed | What broke | Fix |
|------|----------------|------------|-----|
| | | | |

---

## 6. How to learn (gentle path)

1. **Do one deploy** following [DEPLOY.md](./DEPLOY.md) — expect one or two retries (CORS and `VITE_API_URL` are the usual gotchas).  
2. **Open DevTools → Network** on your live site: see requests to your API domain; if red/blocked, read the error (often CORS).  
3. **Read your host’s docs** for “environment variables” and “build logs” — that’s 80% of debugging.  
4. Later: learn **Git branches** (e.g. `main` = production), **preview deployments** on Vercel or Netlify, and **database migrations** vs `db push` (Prisma docs).  

---

## 7. Safety rules (beginner-friendly)

- **Never** commit `.env` files or paste live `DATABASE_URL` / `JWT_SECRET` into public GitHub issues or screenshots.  
- **Rotate** `JWT_SECRET` if it ever leaks (users will need to log in again).  
- Free tiers are for **learning and demos**; for a real business, plan for paid uptime and backups.

---

## 8. Where to go next in this repo

| Doc | Use when |
|-----|----------|
| **[DEPLOY.md](./DEPLOY.md)** | You’re ready to click through Neon → Render → Vercel **or** Netlify. |
| **[README.md](../README.md)** | Local dev, `dev:stack`, demo accounts. |
| **`server/.env.example`** | Lists every API setting (copy to `server/.env` locally only). |
| **Root `.env.example`** | `VITE_API_URL` for local vs production builds. |

You’re not expected to memorize everything. **Save your filled template**, keep **DEPLOY.md** as the technical recipe, and add **your own notes** when something unique to your setup happens.
