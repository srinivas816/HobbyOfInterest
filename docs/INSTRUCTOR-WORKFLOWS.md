# Instructor workflows (production reference)

This document describes instructor-facing flows that ship in the app today: roster, fees, attendance, bulk add, on-open reminders, and WhatsApp bridges. Use it for onboarding tutors, support, and pilot observation.

---

## 1. Bulk add (realistic + honest)

### API

- **`POST /api/instructor-studio/courses/:slug/roster/bulk-enroll`**
- **Body:** `{ "lines": ["...", "..."] }` — each string may contain multiple lines; the server splits on newlines inside each entry.
- **Limit:** up to **60 unique** non-empty lines per request.
- **Parsing:**
  - **Email:** valid email format (case-insensitive match to `User.email`).
  - **Phone:** at least 10 digits; matching tries **`+91` + last 10 digits** and a normalized `+…` form when the paste includes `+`.
- **Behavior:** resolves to an **existing user** only, then creates an **`Enrollment`** for that class (same rules as invite: **`assertInstructorCanAddLearner`**, cap, **`studentCount`** increment).
- **Response:** `enrolled`, `alreadyEnrolled`, `notFound`, `invalidFormat`, `blocked`, `skippedDuplicate`.
- **Telemetry:** `bulk_enroll_attempt` is logged for funnel/debug (see server `funnelLog`).

### UI (Studio → Teaching tools → Roster)

- **Emails / phones:** textarea + **Add to this class**.
- **Names only:** second textarea + **WhatsApp: invite + name list** — opens `wa.me` with the **invite link** and a **numbered name list** so outreach still **starts from the app**. This does **not** create enrollments.

### Constraint (by design)

You cannot create real enrollments for people who have **no account** without a separate product decision (e.g. invite tokens, guardian accounts, magic links). **Bulk paste is account-based**; **names-only** is **WhatsApp-assisted onboarding**.

**Field note:** “Not found” almost always means the learner has not signed up or has not linked that **email/phone** — they should register or link phone, then you paste again.

---

## 2. “Auto memory” on open (no push yet)

### API

- **`GET /api/instructor-studio/dashboard-today`** includes **`alerts`**: `{ id, kind, message, severity }`.
- Typical cases: **pending fees** for the current calendar month, **pending attendance** for **today’s** sessions (slots not fully marked).

### UI (MVP instructor Studio)

- Uses the same **`instructor-dashboard-today`** query as the logged-in discover home.
- **Dismissible** banners at the top of Studio (**per calendar day**) via **`sessionStorage`** key: `hi-dismiss-alerts-YYYY-MM-DD`.
- Actions: **Open roster**, **Dismiss today**.

Push notifications (FCM / Web Push) are **not** implemented; this is **in-app only**.

---

## 3. WhatsApp anchored in the app

Fee reminders, per-student messages, **Announce → Post + share on WhatsApp**, and the **bulk name list** are all launched from **Studio** so habits and copy stay tied to your product, not ad-hoc chat-only workflows.

---

## 4. Progress memory (roster stats)

### API

- **`GET /api/instructor-studio/courses/:slug/roster`** (with optional **`?feeMonth=YYYY-MM`**) returns each student with **`stats`**:
  - **`sessionsHeld`** — number of **class sessions** logged for that course.
  - **`sessionsPresent`** — attendance records with **`present: true`** for that enrollment (across those sessions).
  - **`feeRecentPaidCount` / `feeRecentMonthCount`** — paid months in the **last three calendar months**; **no row** for a month counts as **not paid**.

### UI

One line under each roster row summarizing attendance + recent fee consistency.

**Field note:** Stats only reflect **data the instructor entered** (sessions + saved attendance + fee marks). They are not automatic calendar or bank truth.

---

## 5. Explicitly not in scope (today)

- **Push notifications** — needs provider, keys, and policy.
- **Native contact import** — permissions and PII handling.
- **Creating users from names only** — needs schema and onboarding flows (invites, magic links, etc.).

---

## 6. Deploy / ops checklist

- **No extra DB migrations** were required for these features beyond your existing Prisma schema (enrollments, fees, sessions, attendance).
- Deploy **API and web app together** so **`alerts`** and roster **`stats`** match client expectations.
- **Razorpay / caps:** instructor tier and **`INSTRUCTOR_ENFORCE_CAP`** still govern whether new learners can be added; bulk enroll respects the same rules as single enroll.

---

## 7. Pilot observation (5–10 instructors)

Signals worth watching:

- **Bulk paste:** how often they use emails/phones vs names-only WhatsApp.
- **Alerts:** dismiss without acting vs **Open roster** and follow-through.
- **WhatsApp:** name-list vs one-by-one invite behavior.

When those behaviors stabilize, you’re validating product–market fit more than the codebase.
