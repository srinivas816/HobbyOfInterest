# Hobby of Interest (skillshare-hub)

Full-stack **creative-class marketplace** with **instructor studio**, **learner classroom**, **invite-based joining**, **manual fee & attendance tracking**, and **demo phone OTP** — no Razorpay in-app. **Vite + React** frontend, **Express + Prisma + PostgreSQL** API.

---

## Table of contents

1. [What is implemented](#1-what-is-implemented-summary)
2. [Database (Prisma)](#2-database-prisma)
3. [Backend API](#3-backend-api)
4. [Frontend: routes, UI & UX](#4-frontend-routes-ui--ux)
5. [End-to-end flows](#5-end-to-end-flows)
6. [Demo / environment behaviour](#6-demo--environment-behaviour)
7. [Not in scope (yet)](#7-not-in-scope-yet)
8. [Quick start (local)](#8-quick-start-local)
9. [Scripts & demo accounts](#9-scripts--demo-accounts)
10. [Deploy & docs](#10-deploy--docs)

---

## 1. What is implemented (summary)

| Layer | What you get |
|--------|----------------|
| **Marketplace** | Browse/filter courses, course detail, enroll on published classes, wishlist, reviews, checkout scaffold, instructor public pages |
| **Learning** | My learning hub, lesson player, per-lesson completion (`LessonProgress`) |
| **Classroom** | Per-course announcements, Q&A, assignments + submissions; learners see attendance/fee summary when the tutor records sessions |
| **Instructor Studio** | Profile, create/edit courses, sections & lessons, media uploads, publish toggle, roster, announcements (optional email via SMTP), Q&A, assignments, **invite link + WhatsApp share**, **class sessions + attendance**, **monthly fee ledger per student**, **manual payout requests** (demo balance math) |
| **Join by invite** | Public preview by code, authenticated `POST` enroll; works for **draft** classes |
| **Auth** | Email/password register & login; **phone OTP** (passwordless learner); **link phone** in Settings (OTP); JWT in `Authorization` header |
| **Onboarding** | Learner/instructor flows with optional LLM assist (Gemini/OpenAI) or catalog fallbacks |
| **Admin** | Moderation for reported/hidden reviews (emails in `ADMIN_EMAILS`) |

---

## 2. Database (Prisma)

PostgreSQL. After schema changes: `cd server && npx prisma db push` (and `npm run db:seed` as needed).

### Enums

- `Role`: `LEARNER`, `INSTRUCTOR`
- `PlanTier`: `EXPLORER`, `CREATOR_PLUS`, `INSTRUCTOR_PRO`
- `CourseFormat`: `ONLINE`, `IN_PERSON`
- `PayoutRequestStatus`: `PENDING`, `APPROVED`, `PAID`, `REJECTED`
- `FeePaymentStatus`: `PENDING`, `PAID`

### Core identity & auth

| Model | Purpose |
|--------|---------|
| **User** | `email` (unique), `passwordHash`, optional `phone` (unique), `name`, `role`, `planTier`, `specialty`, instructor counters, `onboardingProfile` (JSON), `onboardingCompletedAt` |

### Marketplace & content

| Model | Purpose |
|--------|---------|
| **Course** | Listing: slug, title, description, category, format, location/city, price (`priceCents`), media, rating, `studentCount`, `published`, **`inviteCode`** (unique, optional until generated) |
| **CourseSection** / **Lesson** | Curriculum tree; lesson has `videoUrl`, `preview`, `durationMin` |
| **Enrollment** | `userId` + `courseId` (unique pair); ties user to fee periods & attendance |
| **Favorite**, **Review** | Wishlist + per-user review (moderation flags) |
| **NewsletterSubscriber** | Email capture |

### Progress & classroom

| Model | Purpose |
|--------|---------|
| **LessonProgress** | `userId` + `lessonId` — completed lessons |
| **CourseAnnouncement** | Instructor posts; optional `emailed` when SMTP sends |
| **CourseQuestion** | Thread: question + optional instructor answer |
| **CourseAssignment** / **AssignmentSubmission** | Assignments + one submission per user per assignment |

### Local-class MVP (manual money & attendance)

| Model | Purpose |
|--------|---------|
| **ClassSession** | One row per “class held” datetime for a `courseId` |
| **AttendanceRecord** | Per `sessionId` + `enrollmentId`: `present` boolean |
| **EnrollmentFeePeriod** | Per enrollment + `yearMonth` (`YYYY-MM`): `PENDING` / `PAID` (manual monthly fee) |

### OTP

| Model | Purpose |
|--------|---------|
| **OtpChallenge** | Hashed 6-digit code, expiry, attempts; `linkUserId` null = login OTP, set = **link phone** to that user |

### Instructor payouts (ledger only — not Razorpay)

| Model | Purpose |
|--------|---------|
| **InstructorTaxProfile** | Legal name, PAN ref, GSTIN (demo fields) |
| **PayoutRequest** | Instructor requests amount; admin updates status; **available balance** in API is demo formula (e.g. ₹500 × enrollments minus paid/pending) |

---

## 3. Backend API

Mounted under `/api` (see `server/src/index.ts`).

| Prefix | Responsibility |
|--------|------------------|
| **`/api/auth`** | `POST /register`, `POST /login`, `GET /me` (JWT); `POST /otp/request`, `POST /otp/verify` (phone login; uses `OtpChallenge` with `linkUserId: null`) |
| **`/api/courses`** | List/search/filter courses; **`GET /by-invite/:code`** (public preview); `GET /:slug` detail; lessons; reviews |
| **`/api/enrollments`** | `POST /` enroll (published courses); **`POST /join-invite`** `{ inviteCode }` (draft OK); `GET /` my enrollments; `DELETE /:slug` |
| **`/api/me`** | `PATCH /profile` (name); **`POST /phone/request-link`**, **`POST /phone/verify-link`**; plan patch; favorites; **`GET /enrolled/:slug/tracking`** (attendance % + current month fee status); `GET /for-you` (learners) |
| **`/api/instructor-studio`** | Courses CRUD-ish, sections/lessons, profile, announcements, assignments, roster, **invite** + regenerate, **sessions** + **attendance** PUT, **fees** GET/PUT by `yearMonth`, payouts summary/tax/request |
| **`/api/course-engagement`** | Classroom: announcements, questions, answers (used by learner UI + studio tools) |
| **`/api/progress`** | Mark lesson complete; fetch progress |
| **`/api/checkout`** | Checkout scaffold (not full Razorpay) |
| **`/api/favorites`**, **`/api/recommendations`**, **`/api/instructors`**, **`/api/newsletter`**, **`/api/uploads`**, **`/api/onboarding`**, **`/api/admin`** | As named |

**Auth:** Bearer JWT. CORS from `CORS_ORIGIN` (comma-separated).

---

## 4. Frontend: routes, UI & UX

All app routes live under `MarketingLayout` (navbar, footer, mobile bottom nav).

### Routes (`src/App.tsx`)

| Path | Page / role |
|------|-------------|
| `/` | Marketing home |
| `/courses`, `/courses/:slug` | Catalog & detail |
| `/instructors`, `/instructors/:id` | Instructor discovery & profile |
| `/login` | Email/password **or** **Phone OTP** (learners) |
| `/onboarding` | Post-signup learner/instructor setup |
| `/join/:code` | Invite preview → sign in → enroll |
| `/learn` | My learning (enrollments, progress) |
| `/learn/:slug/lesson/:lessonId` | Lesson player |
| `/learn/:slug/classroom` | Classroom (announcements, discussion, assignments) + **tracking strip** (attendance / fee when data exists) |
| `/wishlist` | Saved courses |
| `/settings` | Display name, **link mobile** (OTP), logout |
| `/instructor/studio` | Instructor hub (single page, deep links via hash/`?tool=`) |
| `/admin/moderation` | Admin review moderation |
| `/privacy`, `/terms`, `/cookies` | Legal placeholders |

### Design system (UI/UX)

- **Typography:** Fraunces (headings), Inter (body) — see `src/index.css` / `tailwind.config.ts`
- **Theme:** Warm cream background, coral primary, green accent; dark section tokens for contrast blocks
- **Components:** shadcn-style Radix UI primitives under `src/components/ui/`
- **Data fetching:** TanStack Query (stale time, limited retries, no refetch-on-focus by default)
- **Mobile:** **`MobileBottomNav`** (`md:hidden`): **Guest** — Home, Explore, Teach, Account; **Learner** — Home, Explore, My classes, Profile; **Instructor** — Home (analytics hash), Classes (curriculum hash), Students (roster + `?tool=roster`), Profile. Main content has bottom padding; **Back to top** sits above the nav on small screens
- **PWA-ish:** `viewport-fit=cover`, `theme-color` in `index.html`

---

## 5. End-to-end flows

### A. Email learner: discover → enroll → learn

1. User browses **`/courses`** → opens **`/courses/:slug`**.
2. Registers/logs in via **`/login`** (email path) → may be redirected to **`/onboarding`** until `onboardingCompletedAt` is set.
3. Enrolls via course page (**`POST /api/enrollments`**) if class is **published**.
4. **`/learn`** lists enrollments; opens lesson player or **`/learn/:slug/classroom`**.
5. Completing lessons hits **`/api/progress`**; classroom loads **`/api/course-engagement/...`**.

### B. Phone learner (passwordless, demo OTP on screen)

1. **`/login`** → **Phone OTP** tab → enter any non-empty “phone” (digits or text; server normalizes).
2. **`POST /api/auth/otp/request`** → when demo mode, UI shows **`demoOtp`**; user types it + name on first account.
3. **`POST /api/auth/otp/verify`** → JWT; new users get synthetic `p_*@phone.hoi` email and `phone` set.
4. Same onboarding redirect rules as email learners if onboarding incomplete.

### C. Instructor: create class → invite → roster / attendance / fees

1. Register as **Instructor** on **`/login`** (email) → **`/onboarding`** → **`/instructor/studio`**.
2. **Create class** (draft allowed); API assigns **`inviteCode`** on create (or on first invite fetch).
3. **Roster tab:** copy **`/join/{code}`**, **WhatsApp** prefilled message, regenerate code; **add ClassSession** (datetime); select session → toggle **attendance** → save; pick **month** → **Paid/Pending** per student → save ( **`EnrollmentFeePeriod`** ).
4. **Announce / Q&A / Assignments** use same selected class; optional **email** if SMTP configured.
5. **Payouts tab:** sees **demo accrued** from enrollments; submits **PayoutRequest** (ledger only; admin marks paid outside app).

### D. Student joins via invite (draft or published)

1. Opens **`/join/ABC12XYZ`** → **`GET /api/courses/by-invite/:code`** shows preview.
2. If not logged in → **`/login?next=/join/...`**.
3. **`POST /api/enrollments/join-invite`** → enrollment + `studentCount` increment → redirect to **classroom**.

### E. Link phone to existing email account

1. Signed-in user → **`/settings`** → **Mobile number** → send code → **`POST /api/me/phone/request-link`** (`OtpChallenge.linkUserId` set).
2. Enter **`demoOtp`** (if enabled) → **`POST /api/me/phone/verify-link`** → `User.phone` updated.

### F. Learner sees tutor-tracked attendance & fee

1. Tutor saves attendance for sessions and fee rows for the month.
2. Learner opens **`/learn/:slug/classroom`** → **`GET /api/me/enrolled/:slug/tracking`** → banner with **attendance %** and **fee status** for current month (or placeholder if no sessions yet).

### G. Admin moderation

1. User flagged as admin (`admin@demo.com` + `ADMIN_EMAILS`) uses **`/admin/moderation`** and **`/api/admin`** to hide/review content.

---

## 6. Demo / environment behaviour

| Topic | Behaviour |
|--------|-----------|
| **OTP on screen** | `demoOtp` returned when `shouldExposeDemoOtp()` — non-production, or no `SMS_API_KEY`, or `DEMO_OTP_ON_SCREEN=1`. **Disable** with `DEMO_OTP_ON_SCREEN=0`. |
| **Payout math** | **Not** Razorpay; “available” uses demo rule (e.g. **₹500 per enrollment** in paise) minus recorded payout requests. |
| **Monthly student fees** | **Manual** `PAID`/`PENDING` per enrollment per month — no gateway. |
| **Checkout** | Scaffold only; not production billing. |
| **Legal pages** | Placeholder copy. |

---

## 7. Not in scope (yet)

- Real **SMS** delivery (wire `SMS_API_KEY` + provider integration).
- **Razorpay** (or other) **in-app** tuition or platform subscription billing.
- **Native** iOS/Android apps (responsive web + bottom nav; PWA-friendly meta only).
- **Email/password change** or **forgot password** flows in Settings.
- **Merge** phone-only account with existing email account automatically.

---

## 8. Quick start (local)

### Prerequisites

- Node.js **20+** (or 18 LTS) and npm  
- **PostgreSQL 14+** (local, Docker, or cloud e.g. Neon)

### API + database

```bash
cd server
cp .env.example .env
# Set DATABASE_URL in .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

API: **http://localhost:3001** (`PORT` in `server/.env`).

### Frontend

From repo **root**:

```bash
npm install
npm run dev
```

App: **http://localhost:8080** — `/api` proxied in dev (`vite.config.ts`). For split hosting set **`VITE_API_URL`**.

### Optional AI onboarding

Set `GEMINI_API_KEY` and/or `OPENAI_API_KEY` in `server/.env`; otherwise catalog fallbacks apply.

### Both servers

```bash
npm install
cd server && npm install && cd ..
npm run dev:stack
```

---

## 9. Scripts & demo accounts

| Location | Command | Purpose |
|----------|---------|---------|
| Root | `npm run dev` | Vite |
| Root | `npm run dev:stack` | Vite + API |
| Root | `npm run build` | Production build |
| Root | `npm test` | Vitest |
| `server/` | `npm run dev` | API watch |
| `server/` | `npm run db:push` | Prisma push |
| `server/` | `npm run db:seed` | Seed |
| `server/` | `npm run db:studio` | Prisma Studio |

After seed (password **`demo12345`** unless changed):

- Learner: **`learner@demo.com`**
- Admin moderation: **`admin@demo.com`** (also in `ADMIN_EMAILS`)

---

## 10. Deploy & docs

- **Beginner-oriented:** [docs/DEPLOY-BEGINNER.md](docs/DEPLOY-BEGINNER.md)  
- **Technical:** [docs/DEPLOY.md](docs/DEPLOY.md)  
- **Reference + UI notes:** [docs/APPLICATION-AND-DEPLOY-REFERENCE.md](docs/APPLICATION-AND-DEPLOY-REFERENCE.md)  

Repo includes **`vercel.json`** and **`netlify.toml`** for SPA routing.

---

## Tech stack (short)

- **UI:** React 18, React Router, TanStack Query, Tailwind, shadcn-style components, Framer Motion (marketing)  
- **API:** Express, Zod, JWT, Prisma, PostgreSQL  

---

*This README reflects the codebase as of the last update; for deploy-specific env vars see `server/.env.example`.*
