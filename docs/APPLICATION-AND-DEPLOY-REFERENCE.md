# Hobby of Interest — application, deployment & incident reference

This document is the **single place** for architecture, how each part of the stack fits together, environment variables, issues we hit in production, how they were fixed, and what to do next time. For step-by-step first-time deploy, still use **[DEPLOY-BEGINNER.md](./DEPLOY-BEGINNER.md)** and **[DEPLOY.md](./DEPLOY.md)**.

---

## 1. Repository layout (monorepo)

| Path | Role |
|------|------|
| **Repo root** | Vite + React + TypeScript SPA (“the website”) |
| **`server/`** | Node.js + Express API + Prisma (`DATABASE_URL` → Postgres) |
| **`docs/`** | Deployment and reference documentation |
| **`public/`** | Static assets served as-is by Vite/Netlify (e.g. `favicon.svg`, `og-placeholder.svg`) |
| **`netlify.toml`** | Netlify build + SPA fallback to `index.html` |
| **`vercel.json`** | Vercel SPA rewrites (if you use Vercel instead of Netlify) |

There is **one Git repository**. **Render** deploys only `server/`; **Netlify** (or Vercel) deploys the **root** frontend.

---

## 2. Architecture (request flow)

```text
Browser
  → loads HTML/JS/CSS from Netlify (or Vercel)
  → JavaScript calls VITE_API_URL + "/api/..."  (cross-origin)
  → Render runs Express
  → Prisma uses DATABASE_URL → Neon Postgres
```

- **Never** put `DATABASE_URL` or `JWT_SECRET` in the frontend. Only **`VITE_*`** vars are exposed to the browser (and only at **build** time).
- **CORS** is enforced on the **API** (Render). The browser’s **Origin** (your Netlify URL) must be listed in **`CORS_ORIGIN`**.

---

## 3. Frontend (detailed)

### 3.1 Stack

- **React 18**, **TypeScript**, **Vite 5**
- **React Router** (`BrowserRouter`, routes in `src/App.tsx`)
- **TanStack Query** — server state, caching, refetch
- **Tailwind CSS** + **shadcn-style** UI under `src/components/ui/`
- **Framer Motion** — marketing animations
- **Auth** — `src/context/AuthContext.tsx`; JWT in `localStorage` (key managed in `src/lib/api.ts`)

### 3.2 Entry and app shell

| File | Purpose |
|------|---------|
| `index.html` | Title, meta, OG tags, `/favicon.svg` |
| `src/main.tsx` | React root mount |
| `src/App.tsx` | `QueryClientProvider`, `AuthProvider`, routes |
| `src/layouts/MarketingLayout.tsx` | Shared chrome (e.g. `Navbar`, `Footer`) |

### 3.3 API client (critical for deploy)

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | **`apiFetch`**: prefixes `VITE_API_URL`, sets `Authorization` from token, **no** unsafe fallback to same-origin `/api` on failure (that used to hit Netlify and return 404). |
| `src/lib/courseImages.ts` | Resolves course image URLs / keys |
| `src/lib/inr.ts` | INR formatting helpers |

**Production:** set **`VITE_API_URL`** on Netlify (or Vercel) to your Render API origin, e.g. `https://hobbyofinterest.onrender.com` — **no trailing slash**. Changing it requires a **new frontend build**.

### 3.4 Notable pages (by area)

| Area | Paths / files |
|------|----------------|
| Marketing home | `src/pages/Index.tsx` + sections in `src/components/*Section.tsx` |
| Catalog | `src/pages/CoursesPage.tsx`, `CourseDetailPage.tsx`, `CourseCard.tsx` |
| Learn / classroom | `LearnPage`, `ClassroomPage`, `LessonPlayerPage` |
| Instructors | `InstructorsListPage`, `InstructorPage`, `InstructorsSection` |
| Auth | `LoginPage`, `AuthContext` |
| Onboarding | `OnboardingPage` |
| Instructor tools | `InstructorStudioPage` |
| Admin | `AdminModerationPage` |
| Legal | `PrivacyPage`, `TermsPage`, `CookiesPage` |
| Settings | `SettingsPage` |

### 3.5 Branding

- **`public/favicon.svg`** — app icon + used in `Navbar` / `Footer`
- **`public/og-placeholder.svg`** — default social preview image

---

## 4. Backend (detailed)

### 4.1 Stack

- **Node 20+**, **Express 4**, **TypeScript** (compiled to `server/dist/`)
- **Prisma** — schema in `server/prisma/schema.prisma`, client generated on `postinstall` / build
- **Zod** — request validation in routes
- **JWT** — `jsonwebtoken` in `server/src/middleware/auth.ts`

### 4.2 Entry

| File | Purpose |
|------|---------|
| `server/src/index.ts` | Express app: **manual CORS** (allowed origins from `CORS_ORIGIN`), JSON body limit, mounts `/api/*` routes, **`GET /`** info JSON, **`listen(PORT, "0.0.0.0")`** for Render |

### 4.3 Routes (mounted under `/api`)

| Mount path | File | Role |
|------------|------|------|
| `/auth` | `routes/auth.ts` | Register, login, `/me` |
| `/courses` | `routes/courses.ts` | List/detail courses, reviews, lessons |
| `/recommendations` | `routes/recommendations.ts` | POST planner recommendations |
| `/enrollments` | `routes/enrollments.ts` | Enroll / unenroll |
| `/newsletter` | `routes/newsletter.ts` | Newsletter + rate limit |
| `/instructors` | `routes/instructors.ts` | Instructor directory |
| `/me` | `routes/me.ts` | Profile, favorites subset |
| `/favorites` | `routes/favorites.ts` | Wishlist |
| `/progress` | `routes/progress.ts` | Lesson progress |
| `/checkout` | `routes/checkout.ts` | Orders / payments scaffold |
| `/instructor-studio` | `routes/instructorStudio.ts` | Instructor CRUD |
| `/admin` | `routes/admin.ts` | Moderation (email allowlist) |
| `/uploads` | `routes/uploads.ts` | Cloudinary uploads |
| `/onboarding` | `routes/onboarding.ts` | Onboarding + optional AI |
| `/course-engagement` | `routes/courseEngagement.ts` | Announcements, Q&A, assignments |

Health: **`GET /api/health`** → `{ ok: true }`.

### 4.4 Database

- **Provider:** PostgreSQL (local Docker or **Neon** in production).
- **ORM:** Prisma; deploy build often includes **`npx prisma db push`** to align schema (see `DEPLOY.md`).
- **Important:** Prisma **`Int`** maps to Postgres **INT4**. Filter values must stay within **−2 147 483 648 … 2 147 483 647** (see incidents below).

### 4.5 Environment variables (API)

Documented in **`server/.env.example`**. Production essentials:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon (or Postgres) connection string |
| `JWT_SECRET` | Sign JWTs |
| `NODE_ENV` | `production` on Render |
| `ADMIN_EMAILS` | Comma-separated emails for `/api/admin/*` |
| `CORS_ORIGIN` | Comma-separated **exact** frontend origins, **no trailing slash** |
| `PORT` | **Do not set** on Render (platform sets it) |

Optional: Cloudinary, Gemini/OpenAI, SMTP, Razorpay — see `.env.example`.

---

## 5. Deployment matrix

### 5.1 Neon (database)

- Create project → copy **connection string** (include `sslmode=require` if shown).
- Store as **`DATABASE_URL`** on Render only.
- Free tier may **suspend** when idle — wake from Neon console before debugging “can’t connect” from local seed.

### 5.2 Render (API)

| Setting | Typical value |
|---------|----------------|
| **Root directory** | `server` |
| **Build command** | `npm install && npm run build && npx prisma db push` (see `DEPLOY.md` if install omits deps) |
| **Start command** | `npm start` → `node dist/index.js` |

**Runtime:** bind **`0.0.0.0`** and **`process.env.PORT`** (already in `index.ts`).

**Logs:** On boot you should see **`CORS allow list (N): ...`** — confirms parsed `CORS_ORIGIN`.

### 5.3 Netlify (frontend)

| Setting | Typical value |
|---------|----------------|
| **Base directory** | *(empty — repo root)* |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Env** | `VITE_API_URL` = Render API URL (no trailing `/`) |

`netlify.toml` can duplicate build settings and adds SPA redirects.

### 5.4 Seeding (demo users)

- **Render Shell** is often paid; **recommended:** run seed **locally** with the **same** `DATABASE_URL` as production (see `DEPLOY-BEGINNER.md`).
- Command: `cd server && npm install && npm run db:seed` (with env set).

---

## 6. Issues encountered and how they were resolved

Below is a concise **incident log** for this project’s deploy journey (Render + Netlify + Neon).

### 6.1 Prisma CLI missing on Render (`prisma: not found`)

- **Symptom:** `postinstall` → `prisma generate` failed during `npm install`.
- **Cause:** `prisma` package was not installed in production dependency set.
- **Fix:** Add **`prisma`** to **`server/package.json` `dependencies`** (same major as `@prisma/client`).

### 6.2 TypeScript build failures on Render (`@types/*`, `express`, `multer`)

- **Symptom:** `tsc` failed; implicit `any`, missing `process`, etc.
- **Cause:** `devDependencies` often **not** installed in production-style installs; types and `typescript` were dev-only.
- **Fix:** Move **`typescript`** and required **`@types/*`** into **`dependencies`**. Keep **`tsx`** in **`devDependencies`** for local `db:seed` / `dev`.

### 6.3 `uploads.ts` typing and Cloudinary stream

- **Symptom:** Strict TS errors on multer/Express/`UploadStream.end`.
- **Fix:** Explicit Express types, `AuthedRequest & { file? }`, cast upload stream to Node **`Writable`**, ensure types available in CI.

### 6.4 CORS errors from the Netlify site

- **Symptom:** Browser: “No `Access-Control-Allow-Origin`” on `/api/*`.
- **Causes (multiple):**
  1. **`CORS_ORIGIN`** on Render did not include the **exact** Netlify origin.
  2. **502 / connection failure** — error pages lack CORS headers → browser still says “CORS”.
  3. Preflight **`Access-Control-Request-Headers`** not fully allowed.
- **Fixes:**
  - Set **`CORS_ORIGIN`** correctly (comma-separated, no trailing slashes; strip quotes / invisible chars in parser).
  - **Manual CORS middleware** — echo request’s `access-control-request-headers`; answer **OPTIONS** with **204**; **`Vary: Origin`**.
  - **`apiFetch`** no longer falls back to Netlify `/api/...` on failure.

### 6.5 API root `GET /` returned 404

- **Symptom:** Opening the Render URL showed `{"error":"Not found"}`.
- **Cause:** No route for `/`; only `/api/*` existed.
- **Fix:** **`GET /`** returns short JSON describing the API + link to `/api/health`.

### 6.6 Render deploy: “port scan timeout” / service not reachable

- **Symptom:** Deploy timed out; no open port detected.
- **Cause:** Server listened in a way the platform could not reach (loopback-only behavior in container).
- **Fix:** **`app.listen(PORT, "0.0.0.0", ...)`**.

### 6.7 `/api/courses` crashes → 502 / “fake CORS”

- **Symptoms:** Catalog failed; console blamed CORS; sometimes **500** from Prisma.
- **Causes fixed:**
  1. **Unhandled async errors** — wrapped **`GET /api/courses`** in **`try/catch`**, return **500 JSON**, log server-side.
  2. **Unsafe `.toLowerCase()`** in search filter — use **`?? ""`** and **`c.instructor?.name`**.
  3. **Invalid query numbers** — **`NaN`** for `page` / `pageSize` / prices; use **`finiteNumber` / `priceCentsFilterBound`** helpers.
  4. **INT4 overflow (confirmed Prisma/Postgres error):** default **`maxPrice`** used **`Number.MAX_SAFE_INTEGER`**, which exceeds **Postgres INT4** for `priceCents`.
- **Fix:** Default and clamp price bounds to **`PG_INT4_MAX` (2 147 483 647)** and **`[0, PG_INT4_MAX]`**; swap min/max if reversed.

### 6.8 Branding / favicon

- **Symptom:** Generic or wrong tab icon after export from another tool.
- **Fix:** Custom **`public/favicon.svg`**, link in **`index.html`**, reuse in **`Navbar`** / **`Footer`**; refreshed **`og-placeholder.svg`**.

### 6.9 Documentation gaps

- **Seed on Render without paid Shell** — **`DEPLOY-BEGINNER.md`** updated: seed from **local** with production `DATABASE_URL`.
- **Netlify** — beginner guide extended with **Option B** parallel to Vercel.

---

## 7. What to do in the future (operations checklist)

### 7.1 After any code push

1. **Render** auto-deploy (or manual) for `server/` changes.
2. **Netlify** auto-deploy for root/frontend changes.
3. If you only changed **API URL** or **CORS**: update env on the right host and **redeploy** (frontend rebuild if `VITE_*` changed).

### 7.2 When adding a new frontend URL

1. Add origin to **`CORS_ORIGIN`** on Render (comma-separated).
2. Redeploy API (or restart).
3. Confirm logs: **`CORS allow list`** includes the new URL.

### 7.3 When the site “breaks” with CORS in the console

1. Open **`/api/health`** on the API domain — **200**?
2. If **502** / timeout — fix **Render** (logs, cold start, crash) first; CORS message may be a red herring.
3. If **200** — **`curl -I -H "Origin: https://YOUR-NETLIFY.netlify.app" https://YOUR-API.../api/health`** and check **`access-control-allow-origin`**.

### 7.4 When `/api/courses` errors

1. **Render logs** — look for **`GET /api/courses failed:`** or Prisma **`ConversionError`**.
2. Remember **INT4** limits for any new numeric filters on **`Int`** columns.

### 7.5 Prisma / schema changes

- Prefer **`prisma db push`** in this project’s deploy doc flow, or migrate to formal migrations when you outgrow it.
- Watch Prisma 7 deprecation of `package.json#prisma` seed config (log warning today).

### 7.6 Security hygiene

- Never commit **`server/.env`** or production secrets.
- Rotate **`JWT_SECRET`** if leaked.
- Keep **`CORS_ORIGIN`** minimal (your real frontends + local dev only if needed).

---

## 8. Quick reference tables

### 8.1 Environment variables by host

| Host | Variable | Notes |
|------|----------|--------|
| **Render** | `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `ADMIN_EMAILS`, `CORS_ORIGIN`, optional integrations | No `PORT` |
| **Netlify** | `VITE_API_URL` | Baked in at build |
| **Local frontend** | `VITE_API_URL` in root `.env` or unset to use Vite proxy | See root `.env.example` |
| **Local API** | `server/.env` from `server/.env.example` | |

### 8.2 Useful URLs (replace with yours)

| Check | URL pattern |
|-------|-------------|
| API alive | `https://<api>.onrender.com/api/health` |
| API info | `https://<api>.onrender.com/` |
| App | `https://<site>.netlify.app` |

---

## 9. User interface — look & feel

This section describes **how the product presents itself** in the browser (design system, layout, motion). It is not a pixel-perfect spec; it matches `src/index.css`, Tailwind tokens, and key marketing components.

### 9.1 Overall aesthetic

- **Positioning:** Premium hobby / learning marketplace — warm, editorial, not a cold admin dashboard.
- **Layout:** Centered **container** (~1400px max on `2xl`), generous padding, long scrolling **marketing homepage** with many sections.
- **Motion:** **Framer Motion** on the nav and hero-style blocks; **ScrollReveal**-style entrances on homepage sections; **hover** scale on course imagery.
- **Components:** **shadcn-style** primitives (buttons, dialogs, forms, toasts) — rounded corners (`--radius` ≈ 12px), clear focus rings, accessible patterns.

### 9.2 Typography

| Role | Font | Usage |
|------|------|--------|
| **Headings** | **Fraunces** (variable serif) | Logo wordmark, H1–H6, emphasis in cards and CTAs |
| **Body / UI** | **Inter** | Paragraphs, nav, labels, metadata |

Headings are often **light weight** at large sizes (e.g. hero H1) for an airy, magazine-like feel; buttons and chips use **semibold** Fraunces or medium Inter as needed.

### 9.3 Color palette (light mode default)

Semantic tokens in **HSL** (see `src/index.css`):

| Token | Role | Perceived look |
|-------|------|----------------|
| **Background** | Page base | Soft **warm off-white** (~cream) |
| **Foreground** | Main text | Deep **blue-slate** |
| **Primary** | Brand emphasis, badges | **Terracotta / coral** (~hue 11°) |
| **Accent** | CTAs, highlights, logo dot | **Fresh green** (~hue 152°) — “Explore” button, active nav, ratings |
| **Muted** | Secondary surfaces & text | Light warm gray / subdued slate |
| **Card** | Panels | Same family as background; borders subtle |
| **Dark** (`section-dark`) | Footer and some bands | **Near-navy** background, light text — strong contrast break |

The **hero** uses a **mesh gradient** (`.hero-gradient`): soft washes of primary and accent over the cream background — no flat white slab.

### 9.4 Chrome: navbar & footer

- **Navbar:** **Sticky** with **backdrop blur**; gains a light **shadow** and border when scrolled. Wordmark **“Hobby of Interest.”** with **accent-colored period** and **custom favicon** tile. Desktop: text links (hash sections + `/courses`); mobile: **sheet / overlay** menu with **Lucide** icons.
- **Footer:** **Dark section** (`section-dark`), multi-column links, brand repeat, legal links.
- **BackToTop** floating control for long pages.

### 9.5 Homepage composition (`/`)

Order of sections (see `src/pages/Index.tsx`):

1. Optional **PostAuthBanner** after login  
2. **Hero** — split layout: left = headline, subcopy, **large search bar** (rounded-2xl) with **accent** submit; right = **rotating / featured imagery** (pottery, painting, floristry); trending search chips  
3. **TrustedBy**, **StatsBar** — social proof strip  
4. **HowItWorks**, **Categories**, **LearningPlanner** (smart finder + API-backed recommendations)  
5. **Skills**, **Instructors**, **Video**, **Testimonials**  
6. **Pricing**, **FAQ**, **AppDownload**, **Newsletter**, **CTA**  

Alternate sections use **warm tinted** (`.section-warm`) or **dark** bands to rhythm the scroll.

### 9.6 Catalog & detail (classes)

- **Course cards:** **4:3** image, **rounded-2xl**, **hover zoom** on image, gradient overlay and **arrow** affordance on hover. **Pills** for online vs in-person (accent vs neutral), **badge** optional, **price** chip, title in Fraunces, instructor · duration · city, **star** rating in accent.
- **Listing pages** use grids and filters consistent with Tailwind spacing and card language above.
- **Instructor** and **learn** flows reuse the same typography and button styles for cohesion.

### 9.7 App surfaces (logged-in)

- **Login**, **onboarding** (long multi-step), **learn dashboard**, **instructor studio** (dense forms, tables, selects), **settings**, **admin moderation** — built from the same **shadcn** kit; functional density is higher than marketing but **colors and fonts** stay aligned.

### 9.8 Dark mode

- **`dark` class** tokens are defined in `index.css` (deep background, light foreground). The app is wired for **class-based** dark mode (`tailwind.config`); whether every page toggles it depends on product wiring — the **design tokens** are ready.

### 9.9 Icons & imagery

- **Lucide React** for UI icons (nav, cards, forms).  
- **Photography:** Local **hero** JPGs under `src/assets/`; course images from **keys** / optional **Cloudinary** URLs (`courseImages` helper).

---

## 10. Related docs

| Doc | Use when |
|-----|----------|
| **[DEPLOY-BEGINNER.md](./DEPLOY-BEGINNER.md)** | First deploy, vocabulary, checklist template |
| **[DEPLOY.md](./DEPLOY.md)** | Short technical recipe (Neon → Render → Vercel/Netlify) |
| **[README.md](../README.md)** | Local dev, `dev:stack`, demo accounts |
| **`server/.env.example`** | All API env var names |

---

*Last updated to reflect deploy hardening, `/api/courses` fixes, and UI documentation. Update when you add services, change hosts, or hit new production issues worth remembering.*
