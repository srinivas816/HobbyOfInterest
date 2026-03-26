# Tutor onboarding, Studio layout & invite link flow

> **Purpose:** Team reference for how the product works today (code-accurate). Paste into Notion via **Import → Markdown** or copy sections into pages.

---

## Product one-liner (positioning)

**A simple tool to manage classes, students, attendance, and fees — without WhatsApp chaos.**

- Ledger and truth live **in the app**.
- **WhatsApp** = outbound reminders and shares, not the source of record.

---

## Part 1 — Tutor journey

### 1.1 Create account (instructor)

| Channel | Where | Result |
|--------|--------|--------|
| Email | `/login` — register with **Teach** / instructor | Instructor account |
| Phone | `/login` — **Teach** → OTP → name (first time) | Instructor account |

### 1.2 First-time activation (MVP mode)

**When:** `VITE_MVP_INSTRUCTOR_FOCUS` = `1` (or `true`) on the **frontend build**.

**Flow:** After **first** successful instructor signup → **`/instructor/activate`** (not straight to Studio).

**Screen: “Create your class”** (`/instructor/activate`)

- Class title, category, online vs in-person (+ city), schedule label, fee (₹ or 0)
- Submit → API creates a **draft** class → **`/instructor/class-ready/:slug`**

> Without MVP flag, new instructors are **not** forced through this page; routing follows `next` / Studio as usual.

### 1.3 Class ready (first win)

**Route:** `/instructor/class-ready/:slug`

- Short celebration + class title
- Goal: invite ~3 people (momentum)
- **Share on WhatsApp** (message + `https://<site>/join/<CODE>`)
- **Copy link**
- **Continue to Studio** (deep link toward teaching tools / roster / invite)

> Tutors can always find the link again under **Teaching tools → Invite**.

### 1.4 Daily hub — Teaching Studio

**Route:** `/instructor/studio`

Single large page; select a class, then use **Teaching tools**.

| Area | Contents |
|------|-----------|
| **Profile** | Name, specialty |
| **Classes** | List, create class, full editor (sections, lessons, cover, publish) |
| **Teaching tools** | Tabs: **Roster** · **Announce** · **Discussion** · **Assignments** · **Payout** (MVP de-emphasizes Assignments tab) |
| **Roster** | Summary: students, **present today**, **pending fees**, fee month; search; per-student fee + stats + WhatsApp; bulk enroll (email/phone); names-only → WhatsApp list; invite link; **today’s session** attendance (chips + bulk) |
| **Announce** | Post to class; presets (update / cancel / fee); optional email learners; **Post + WhatsApp** |
| **Discussion** | Q&A, instructor answers |
| **Assignments / Payout** | Platform-style features |

### 1.5 Home & nav (MVP + instructor)

- **`/`** → **Discover** home; logged-in instructors see **Today** strip (sessions, pending attendance, pending fees) + quick actions (roster, studio, reminders).
- **Navbar:** e.g. **My classes & students** → Studio, **My classes** → `/learn`, **Account** → Settings; Wishlist hidden for this combo.

### 1.6 Retention nudges

- API: `GET /api/instructor-studio/dashboard-today` → `alerts` (fees / attendance).
- Studio: dismissible for the day (`sessionStorage`).

### 1.7 Monetization

- **`/settings`** → Plan & upgrade (Razorpay when configured; non-prod trial path only when server allows).

### 1.8 Optional: “Complete setup”

- If `onboardingCompletedAt` is empty → navbar **Complete setup** → **`/onboarding`** (generic; separate from activation).

---

## Part 2 — Invite link → student flow

### 2.1 URL

`/join/<INVITE_CODE>`

**One link for everyone.** There is no separate “link for people without an account.” Guests and logged-in users open the same URL; only the **auth UI** on the join page differs.

### 2.2 End-to-end flow (code-accurate)

**1. Open the link → `/join/:code`**

- UI: `JoinClassPage` (`src/pages/JoinClassPage.tsx`). The code from the URL is trimmed and uppercased.
- If the code is too short → **“Invalid invite link”** (no preview API call).

**2. Class preview (no login required)**

- `GET /api/courses/by-invite/:code` — **public** (no `Authorization` header). Handler: `server/src/routes/courses.ts`.
- Invalid or rotated code → **“Class not found”** (invite may have been regenerated).
- Valid → card: title, instructor, duration, price, format, city/online; note if listing is **draft** (invite still works).

**3. After preview — depends on browser session**

- While auth is initializing (`ready === false`), a small loader is shown.
- **A. No JWT (guest / not signed in on this device)**  
  - **Phone OTP on the join page** (not a redirect to `/login` for this path).  
  - Send OTP → 6-digit code → optional **name** (first-time account).  
  - **“Verify & join class”** calls `verifyOtp(..., "LEARNER")`, then immediately **`POST /api/enrollments/join-invite`** with the new session token.
- **B. Already has a token** (account signed in on this device; token attached by `apiFetch` from `localStorage` in `src/lib/api.ts`)  
  - **No OTP** on the join page.  
  - **“Join this class”** → same **`POST /api/enrollments/join-invite`** with the current user.

Logged-in users are **not** sent through the guest OTP path unless they log out first.

**4. Server — actually joining**

- **`POST /api/enrollments/join-invite`** — **`authRequired`** (`server/src/routes/enrollments.ts`).
- Resolve course by **invite code**.
- **`assertInstructorCanAddLearner`** (instructor plan / roster cap) — may return **403** if the class cannot accept more students.
- Create **enrollment** for **`req.userId`** (whoever is authenticated). No separate “guest vs member” branch; guests only hit this after OTP gives them a JWT.
- **Already enrolled** (unique constraint) → **409** — `"Already enrolled in this class"`.
- Success: increment course `studentCount`, return **`courseSlug`**.

**5. After successful join (client)**

- Toast **“You're enrolled”**.
- Navigate to **`/learn/<courseSlug>/classroom`**.
- Optional one-shot welcome: `sessionStorage` key `classroomWelcome:<slug>`.

### 2.3 Quick reference

| Situation | What happens |
|-----------|----------------|
| No account / not logged in | Same `/join/...` → preview → phone OTP on join page → **join-invite** as learner. |
| Already logged in | Same link → preview → **Join this class** only → **join-invite** as current user. |
| Already in that class | **409** → error toast; no duplicate enrollment. |

> **Email-only learners:** Join page is optimized for **phone OTP**. They can **log in** first (e.g. email on `/login`), then open the join link again and use **Join this class**.

---

## Part 3 — Environment reminder

| Variable | Where | Role |
|----------|--------|------|
| `VITE_MVP_INSTRUCTOR_FOCUS=1` | **Netlify / Vite build** | Discover home + instructor-first activation + simplified nav |
| `VITE_API_URL` | Frontend | API origin (no trailing slash) |
| Server secrets | **Render** only | `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, Razorpay, etc. |

---

## Part 4 — Quick reality check (1-week test)

After a week of real use, the tutor should be able to say **without WhatsApp or a notebook**:

- Who **paid** (for the month they track)
- Who they **marked present** (including “today” summary when sessions exist)
- **What’s on today** (sessions + pending items)

If yes → positioning matches delivery.
