# Hobby of Interest — product audit (single doc)

Structured reference for routes, flows, pages (experience-level), APIs, UI structure, and frontend state. **No code dumps** — behavior and structure only.  
**Snapshot:** generated from the repo layout (`App.tsx`, layouts, key pages, `server/src/routes/*`). Feature flags: `VITE_MVP_INSTRUCTOR_FOCUS` toggles marketing vs discover home and instructor shell behavior.

---

## Phase 1 — Routes and structure (frontend)

**Access legend**

- **Guest:** page loads without login; some actions redirect to `/login`.
- **Learner / Instructor:** primary persona; others may still open the URL but get redirected or empty states.
- **Open + API-gated:** UI visible; mutations/API return 401 if not logged in.

**Note:** There is **no route-level auth guard** in the router for most marketing routes. Protection is **per page** (e.g. `Navigate` to login) or **API** (`authRequired`).

### Public pages

| Path | Component | Who can open | Purpose |
|------|-----------|--------------|---------|
| `/` | `Index` → `DiscoverHomePage` **or** long marketing stack | Guest + all | **MVP on:** learner-first marketplace home (search, categories, strips). **MVP off:** long marketing landing (hero, how it works, pricing, FAQ, etc.). |
| `/teach` | `TeachLandingPage` | Guest + all | Tutor-oriented pitch + CTAs (start teaching / login); keeps `/` learner-first. |
| `/courses` | `CoursesPage` | Guest + all | Search/filter catalog of public courses. |
| `/courses/:slug` | `CourseDetailPage` | Guest + all | Course detail; enroll / wishlist / reviews depend on auth. |
| `/instructors` | `InstructorsListPage` | Guest + all | Browse instructors. |
| `/instructors/:id` | `InstructorPage` | Guest + all | Instructor profile. |
| `/login` | `LoginPage` | Guest + all | Phone OTP login/signup; respects `?next=` redirect after auth. |
| `/join/:code` | `JoinClassPage` | Guest + all | Invite deep link: preview class by code, OTP if needed, join enrolled class. |
| `/privacy` | `PrivacyPage` | Guest + all | Legal. |
| `/terms` | `TermsPage` | Guest + all | Legal. |
| `/cookies` | `CookiesPage` | Guest + all | Legal. |
| `*` | `NotFound` | Guest + all | 404. |

### Learner-leaning / shared (mostly authenticated workflows)

| Path | Component | Who can open | Purpose |
|------|-----------|--------------|---------|
| `/learn` | `LearnPage` | Typically learner (instructors can have learner role semantics) | “My classes” / enrolled courses hub. |
| `/learn/:courseSlug/classroom` | `ClassroomPage` | Enrolled learner (+ instructor viewing as learner if applicable) | Class feed: announcements, fees context, engagement. |
| `/learn/:courseSlug/lesson/:lessonId` | `LessonPlayerPage` | Enrolled / entitled user | Lesson player. |
| `/wishlist` | `WishlistPage` | Logged-in | Saved courses. |
| `/settings` | `SettingsPage` | Logged-in | Account, plan, preferences. |
| `/onboarding` | `OnboardingPage` | Logged-in | Post-signup onboarding (interests, etc.); uses `?next=`. |
| `/choose-role` | `ChooseRolePage` | Logged-in with `intentChosen === false` (phone signup) | Force choice: teach vs learn → updates role via API. |

### Instructor pages

| Path | Component | Who can open | Purpose |
|------|-----------|--------------|---------|
| `/instructor/activate` | `InstructorActivatePage` | Intended for instructors (redirects if wrong role) | Guided **first class** activation wizard → creates class via activation API → forwards to workspace / ready screen. |
| `/instructor/class-ready/:slug` | `InstructorClassReadyPage` | Instructor | Post-activation confirmation / next steps. |
| `/instructor/studio` | `InstructorStudioPage` | Instructor (guest redirected by page logic) | **Legacy / full studio** (tabs, analytics, class builder, tools). Many deep links from older UX still point here (`#studio-*`, `?tool=`). |
| `/instructor` | `InstructorAppLayout` (wrapper) | **MVP on:** requires auth + `INSTRUCTOR` | Mobile-first instructor app shell (bottom nav). **MVP off:** layout renders `<Outlet />` only (no bottom nav shell). |
| `/instructor/home` | `InstructorHomePage` | Under `/instructor/*` | Today dashboard: greeting, sessions, pending attendance/fees, setup checklist. |
| `/instructor/classes` | `InstructorClassesPage` | Under `/instructor/*` | List of instructor’s classes. |
| `/instructor/students` | `InstructorStudentsPage` | Under `/instructor/*` | Cross-class student view. |
| `/instructor/more` | `InstructorMorePage` | Under `/instructor/*` | Settings links, extras. |
| `/instructor/class/:slug` | `InstructorClassWorkspacePage` | Under `/instructor/*` | **Per-class hub:** tabs Students / Attendance / Fees + announce panel; roster, invite link, sessions, bulk enroll. |

### Admin / special

| Path | Component | Who can open | Purpose |
|------|-----------|--------------|---------|
| `/admin/moderation` | `AdminModerationPage` | Typically admin user (UI may check email/role) | Moderation tools. |

### Grouping summary

- **Public:** `/`, `/teach`, `/courses`, `/courses/:slug`, `/instructors`, `/instructors/:id`, `/login`, `/join/:code`, legal pages, `*`.
- **Learner / shared:** `/learn`, `/learn/...`, `/wishlist`, `/settings`, `/onboarding`, `/choose-role`.
- **Instructor:** `/instructor/activate`, `/instructor/class-ready/:slug`, `/instructor/studio`, `/instructor` subtree (`home`, `classes`, `students`, `more`, `class/:slug`).
- **Overlapping risk:** **`/instructor/studio`** vs **`/instructor/class/:slug`** — two parallel instructor surfaces; navigation and mental model can conflict.

---

## Phase 2 — Navigation and entry points

### Homepage navigation

- **MVP on:** Top `Navbar`: **Classes** (`/courses`), **Teach** (`/teach`) for non-instructors; instructors see studio/home links as today. **Mobile bottom nav:** Home, Explore, Teach, Account (guest) or learner/instructor variants.
- **MVP off:** Navbar uses **hash links** into marketing sections on `/` plus `/courses`.
- **`/` footer:** MVP home uses **minimal copyright**; other routes use full `Footer`.

### Login redirects

- **`/login?next=/path`:** After successful OTP verify, `goAfterAuth`:
  - If `intentChosen === false` → **`/choose-role`** (ignores `next` until intent set).
  - Else if `next` is a safe path starting with `/` → navigate there.
  - Else default: **`/instructor/home`** if role instructor, else **`/learn`**.
- **Instructor app layout:** Unauthenticated visit to `/instructor/*` → **`/login?next=/instructor/home`**.

### Join link flow (`/join/:code`)

1. User opens `/join/{CODE}` (often from WhatsApp/SMS).
2. **Preview:** `GET /api/courses/by-invite/:code` (works without auth; richer if token present).
3. If not logged in: inline **phone OTP** (same auth as login) until `token` exists.
4. **Join:** `POST /api/enrollments/join-invite` with `{ inviteCode }`.
5. Success: navigate to **`/learn/{slug}`** or classroom (per page logic); enrollments list invalidates.
6. **AuthIntentGate:** `/join/...` is **allowed** when `intentChosen === false`, so join can complete before choose-role.

### Deep links (high-signal)

| Entry | Typical next step |
|-------|-------------------|
| `/courses?q=…` | From home search → filtered catalog. |
| `/courses/:slug` | Detail → enroll / login. |
| `/learn` | Requires auth for meaningful data. |
| `/learn/.../classroom` | Daily learner surface. |
| `/instructor/home` | Instructor today (MVP shell). |
| `/instructor/class/:slug?tab=attendance` | Workspace tab deep link. |
| `/instructor/studio?setup=1#studio-create-class` | Legacy create-class entry (still linked from instructor home checklist). |

### Conditions that change routing

- **`AuthIntentGate`:** Any authenticated user with **`intentChosen === false`** is redirected to **`/choose-role`**, except paths: `/login`, `/choose-role`, `/join/*`.
- **`ChooseRolePage`:** If `intentChosen` already true → redirect instructor to **`/instructor/home`**, learner to **`/learn`**.
- **`InstructorAppLayout` (MVP):** Not instructor → **`/learn`**. No token → login with next `/instructor/home`.

---

## Phase 3 — Auth flow (concise)

1. **Session:** JWT stored client-side; on load, if token present, **`GET /api/auth/me`** hydrates `user`.
2. **Login UI:** Phone → **`POST /api/auth/otp/request`** → OTP → **`POST /api/auth/otp/verify`** (new users supply name; created as `LEARNER`, `intentChosen: false`).
3. **Email/password** exists in `AuthContext` (**`register`**, **`login`**) hitting **`/api/auth/register`** and **`/api/auth/login`** — **LoginPage may be OTP-only in UI**; verify whether any UI still exposes email login.
4. **Role / intent:** **`PATCH /api/me`** from Choose Role (body includes `role`) updates server user; **`refreshUser`** reloads session.
5. **Logout:** clears token and user locally.

**Risk:** Two signup channels (OTP vs email) + `intentChosen` only on OTP path → inconsistent onboarding expectations.

---

## Phase 4 — Instructor journey (step-by-step)

| Step | Page / surface | User action | API / effect | Navigation / confusion risk |
|------|----------------|-------------|--------------|------------------------------|
| 1 | `/login` or `/teach` | Start teaching / login | OTP | Multiple CTAs historically; `/teach` consolidates tutor story. |
| 2 | `/choose-role` | Pick “Teach” | `PATCH /api/me` { role: INSTRUCTOR } | If skipped by non-phone users, path differs. |
| 3 | `/instructor/activate` | Multi-step wizard (preset/custom, venue, schedule, price) | `POST /api/instructor-studio/courses/activation` | Draft in **localStorage**. Redirect to class-ready or workspace. |
| 4 | `/instructor/class-ready/:slug` | Read confirmation | — | Short-lived; user may not know studio vs app. |
| 5 | `/instructor/home` | See today, pending fees/attendance, checklist | `GET .../dashboard-today`, `GET .../courses` | **“Create class”** still links to **`/instructor/studio?...`** — **dual surface**. |
| 6 | `/instructor/class/:slug` | Students tab: roster, invite link, bulk enroll | `GET roster`, `GET invite`, `POST bulk-enroll`, `POST invite/regenerate` | Invite URL is product-critical; ensure copy matches `/join/:code` format. |
| 7 | Same — Attendance tab | Pick session, mark present/absent | `GET sessions`, `GET/PUT attendance` | Session selection must be clear when none today. |
| 8 | Same — Fees tab | Month picker, mark paid/pending | `GET/PUT fees/:yearMonth` | Month vs “today” mental model. |
| 9 | Announce panel (`?panel=announce`) | Compose announcement, optional email | `POST .../announcements` | Panel overlays tabs — discoverability. |
| 10 | `/instructor/studio` | Full CMS: sections, lessons, assignments, payouts | Many `instructor-studio` endpoints | **Power users** vs **daily loop** split; easy to feel “two apps.” |

**Subscription / caps:** `GET /api/instructor-studio/subscription-summary` — gating on adding learners (enrollment join + bulk enroll).

---

## Phase 5 — Learner journey (step-by-step)

| Step | Page | User action | API / effect | Friction |
|------|------|-------------|--------------|----------|
| 1 | `/` (MVP) | Search, city chips, scroll strips | `GET /api/courses` (list) | First visit: no tutor fold; good. Logged-in: extra “today” strip from `DiscoverLoggedInHome`. |
| 2 | `/courses`, `/courses/:slug` | Filter, open detail | List + detail endpoints | Enroll CTA clarity (public vs invite-only). |
| 3a | Catalog enroll | Enroll button | `POST /api/enrollments` (and related) | Payment/checkout if priced — see checkout APIs. |
| 3b | `/join/:code` | OTP + join | `by-invite` + `join-invite` | Strong path; ensure code format errors are human-readable. |
| 4 | `/learn` | Open my class | `GET /api/enrollments` | Empty state: invite vs browse. |
| 5 | `/learn/.../lesson/:id` | Watch / complete | `GET lesson`, `POST /api/progress/complete` | Progress must feel instant (React Query cache). |
| 6 | `/learn/.../classroom` | Read announcements, Q&A, assignments | `course-engagement` routes | “Where do I go daily?” — classroom vs lesson player. |

---

## Phase 6 — Component / UI structure

### Layouts

| Layout | Where used | Role |
|--------|------------|------|
| `MarketingLayout` | Most routes in `App.tsx` | `Navbar`, `Outlet`, `Footer` (or minimal on MVP `/`), `BackToTop`, `MobileBottomNav` (hidden on some paths). |
| `InstructorAppLayout` | `/instructor/*` nested routes | **MVP on:** auth + role gate + **fixed bottom nav** for instructor tabs. **MVP off:** passthrough `Outlet` only. |

### Shared / cross-cutting

- **Navigation:** `Navbar`, `MobileBottomNav`, `BackToTop`, `ScrollToTop`.
- **Auth / system:** `AuthProvider`, `AuthIntentGate`, `PostAuthBanner`.
- **Toasts:** `Toaster`, `Sonner`.
- **Discover marketplace:** `CategoryScrollRow`, `HorizontalCourseStrip`, `DiscoverCourseCard`, `DiscoverLoggedInHome`, `InstructorLeadFold` (used on `/teach`), `LearnerConversionBar`.

### Page-specific (examples)

- **Marketing home (non-MVP):** `HeroSection`, `HowItWorksSection`, `PricingSection`, `FAQSection`, etc. (many sections in `Index`).
- **Studio:** Large single page `InstructorStudioPage` with internal tabs/anchors.
- **Workspace:** `InstructorClassWorkspacePage` — heavy use of React Query + URL `tab` / `panel`.

### Duplication / overlap

- **Two instructor UIs:** **`InstructorStudioPage`** vs **`/instructor/class/:slug`** (+ home/students list).
- **Favorites:** `/api/favorites` **and** `/api/me/favorites*` — potential overlap in product semantics (verify single source of truth in UI).
- **Assignments / announcements:** instructor-studio vs course-engagement learner views — same domain, different route prefixes.

---

## Phase 7 — API map (backend)

Base URL prefix as mounted in `server/src/index.ts`. Methods below as defined in route files.

### Auth (`/api/auth`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/register` | POST | Email/password signup |
| `/login` | POST | Email/password login |
| `/me` | GET | Current user (auth) |
| `/otp/request` | POST | Start phone OTP |
| `/otp/verify` | POST | Verify OTP; create phone user if new |

### Courses (`/api/courses`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | List/filter courses (public catalog) |
| `/by-invite/:code` | GET | Invite preview (optional auth) |
| `/:slug` | GET | Course detail |
| `/:slug/reviews` | POST | Submit review |
| `/:slug/reviews/:reviewId/report` | PATCH | Report review |
| `/:slug/lessons/:lessonId` | GET | Lesson payload |

### Enrollments (`/api/enrollments`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/join-invite` | POST | Join class by invite code (auth) |
| `/` | POST | Enroll (e.g. catalog) |
| `/` | GET | List my enrollments |
| `/:slug` | DELETE | Leave / unenroll |

### Instructor studio (`/api/instructor-studio`)

High-level groups (representative; file has many endpoints):

- **Profile / subscription / dashboard:** `GET/ PATCH profile`, `GET subscription-summary`, `GET dashboard-today`, `GET analytics`
- **Courses CRUD:** `GET/POST courses`, `POST courses/activation`, `PATCH courses/:slug`
- **Roster / invite:** `GET roster`, `POST roster/bulk-enroll`, `GET invite`, `POST invite/regenerate`
- **Sessions / attendance:** `GET/POST sessions`, `GET/PUT .../attendance`
- **Fees:** `GET/PUT courses/:slug/fees/:yearMonth`
- **Curriculum CMS:** `POST sections`, `POST lessons`, `PATCH/DELETE` sections & lessons, `POST move`
- **Announcements / assignments (instructor-side):** `POST announcements`, assignments CRUD, submissions
- **Payouts:** `GET summary`, `PATCH tax-profile`, `POST request`

**Overlap note:** Learner-facing **assignments / questions / announcements** also live under **`/api/course-engagement`** — by design split (instructor vs learner) but easy to duplicate logic conceptually.

### Checkout / payments (`/api/checkout`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/create-order` | POST | Create payment order (learner flows) |
| `/instructor-pro/create-order` | POST | Instructor pro checkout |
| `/instructor-pro/upgrade-requested` | POST | Upgrade signal |
| `/instructor-pro/confirm` | POST | Confirm payment |

### Me / profile / favorites (`/api/me`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | PATCH | Update user (e.g. role from choose-role) |
| `/profile` | PATCH | Profile fields |
| `/phone/request-link`, `/phone/verify-link` | POST | Phone linking |
| `/plan` | PATCH | Plan changes |
| `/favorites` | GET | Favorites |
| `/favorites/:slug` | POST | Add favorite |
| `/favorites/:slug` | DELETE | Remove |
| `/for-you` | GET | Recommendations |
| `/enrolled/:slug/tracking` | GET | Enrollment tracking |

### Favorites (`/api/favorites`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | List |
| `/` | POST | Add |
| `/:slug` | DELETE | Remove |

**Redundancy:** `/api/favorites` vs `/api/me/favorites` — two ways to same domain; confirm which the client uses consistently.

### Progress (`/api/progress`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/:courseSlug` | GET | Progress for course |
| `/complete` | POST | Mark lesson complete |

### Course engagement — learner (`/api/course-engagement`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/:slug/announcements` | GET | List |
| `/:slug/questions` | GET, POST | Q&A |
| `/:slug/questions/:questionId` | PATCH | Update question |
| `/:slug/assignments` | GET | List |
| `/:slug/assignments/:assignmentId/submit` | POST | Submit |

### Onboarding (`/api/onboarding`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/catalog` | GET | Catalog for onboarding |
| `/me` | GET | Onboarding state |
| `/` | PATCH | Save onboarding |
| `/skip` | POST | Skip |
| `/suggest` | POST | Suggestions |
| `/instructor-preview`, `/learner-preview` | POST | Preview payloads |

### Other

| Mount | Notable |
|-------|---------|
| `/api/recommendations` | POST recommendations |
| `/api/instructors` | GET list, GET by id |
| `/api/newsletter` | POST subscribe |
| `/api/uploads` | POST upload (auth) |
| `/api/admin` | Reviews + payout requests moderation |
| `/api/health` | GET health |

---

## Phase 8 — State management (frontend)

### AuthContext

- Holds **`user`**, **`token`**, **`ready`**.
- On token change: loads **`GET /api/auth/me`**.
- **Mutations:** `login`, `register`, `requestOtp`, `verifyOtp`, `refreshUser`, `logout`.
- **Risk:** Stale `user` after server-side changes unless **`refreshUser`** is called (Choose Role does call it).

### React Query (`QueryClient`)

- **Defaults (from `App.tsx`):** `staleTime` ~45s, `gcTime` 5m, `refetchOnWindowFocus: false`, queries retry 1×.
- **Typical query keys:** `["courses", filters]`, `["enrollments"]`, `["studio-courses"]`, `["studio-roster", slug, feeMonth]`, `["invite-preview", code, token]`, `["instructor-dashboard-today"]`, etc.

### Where data is cached

- **Server state:** React Query cache (lists, roster, invite, dashboard).
- **Client-only:** Instructor activate **draft** in **localStorage**; various UI steps.

### How updates propagate

- After **join class:** `queryClient.invalidateQueries` on enrollments / preview (see `JoinClassPage`).
- After **attendance / fees / roster mutations:** workspace uses **`queryClient.invalidateQueries`** on roster and related keys (pattern: mutate → invalidate → refetch).

### Inconsistencies / risks

- **Dual instructor surfaces** may cache **same slug** under different query keys or pages if user edits in studio then expects workspace to match — depends on invalidation coverage.
- **`intentChosen` gate** is easy to forget when adding new authenticated routes.
- **Favorites** dual API surface may desync if mixed.

---

# Priority page breakdowns (experience-level)

Format per page: **What you see (top → bottom)** · **Actions** · **On action (API + navigation)** · **Data sources** · **Audience** · **Conditional UI** · **Friction**

---

## `/` — Homepage (`Index` / `DiscoverHomePage`)

**MVP ON (discover)**

- **See:** Optional `PostAuthBanner`. If logged in: **`DiscoverLoggedInHome`** (instructor: today/plan/attendance shortcuts; learner: enrollments, classroom CTA, explore). Sticky header: **“Find your next class”** or **“More to explore”**, **search bar**, **location chips**, **category row**, horizontal strips (**Popular near you / across India**, **Trending**, **Beginner-friendly**). Logged-out footer: **Explore classes** + **Have a class invite? Join** link.
- **Actions:** Search → `/courses?q=…`; chip filters API list; tap category / card → course detail; Teach lives in **nav**, not here.
- **API:** `GET /api/courses` with query params; enrollments/instructor dashboard when logged in.
- **Audience:** Guest = discovery; returning = personalized top fold + same catalog.
- **Conditional:** Logged-in block above; strips always learner-marketplace.
- **Friction:** Two home experiences if MVP flag flips (confusing for team testing).

**MVP OFF (marketing)**

- **See:** Long page: hero, social proof, how it works, categories, planner, skills, instructors, video, testimonials, pricing, FAQ, app CTA, newsletter, final CTA.
- **Actions:** Hash nav jumps; CTAs to login / courses.
- **Audience:** Cold acquisition / SEO.
- **Friction:** Very different from MVP “app” home — same URL.

---

## `/login` — `LoginPage`

- **See:** Phone number step → OTP step → (if new user) name step; optional demo OTP hint; link back.
- **Actions:** Request OTP, verify, resend timer.
- **API:** `POST /api/auth/otp/request`, `POST /api/auth/otp/verify`.
- **Navigation:** If `intentChosen === false` → `/choose-role`. Else `?next=` or role default (`/instructor/home` vs `/learn`).
- **Audience:** Everyone; primary mobile OTP.
- **Friction:** Email/password in `AuthContext` but not obvious in this page — docs vs reality.

---

## `/instructor/activate` — `InstructorActivatePage`

- **See:** Multi-step wizard (preset class, custom title/category, venue chips, schedule chips, price); back navigation; progress saved in **localStorage**.
- **Actions:** Next/back; submit final step.
- **API:** `POST /api/instructor-studio/courses/activation` (creates real course + schedule metadata per server rules).
- **Navigation:** Success → `/instructor/class/:slug` or class-ready (per implementation); unauthenticated → login.
- **Audience:** New instructor post–choose-role.
- **Conditional:** Redirect if not instructor.
- **Friction:** Abandon mid-wizard — draft recovery is local to device only.

---

## `/instructor/home` — `InstructorHomePage`

- **See:** Greeting; loading/error; **Get started** checklist if no class or no students; **Today** schedule list; chips for pending attendance / fees; links to class workspace or studio create.
- **Actions:** Tap **Create** → `/instructor/studio?setup=1#studio-create-class`; tap **Add students** → workspace students tab; open class rows → workspace; WhatsApp/share style links if present.
- **API:** `GET /api/instructor-studio/dashboard-today`, `GET /api/instructor-studio/courses`.
- **Audience:** Returning instructor daily.
- **Conditional:** Setup rail vs “operating” state.
- **Friction:** **Create class** still jumps to **legacy studio** — inconsistent with `/instructor/class/:slug` mental model.

---

## `/instructor/class/:slug` — `InstructorClassWorkspacePage`

- **See:** Header (back, title); **tabs** Attendance / Fees / Students; optional **activation success** banner (`?activated=1`); **announce** side panel (`?panel=announce`). Tab content: session picker + attendance grid; fee month selector + student fee toggles; roster table, invite link/copy, bulk enroll textarea; announcement form.
- **Actions:** Change tab (updates URL `tab=`); save attendance; save fees; copy/regenerate invite; bulk enroll lines; post announcement; email learners toggle.
- **API:** `studio-courses`, `.../roster?feeMonth=`, `.../invite`, `.../sessions`, attendance PUT, fees PUT, bulk-enroll POST, announcements POST, regenerate invite, etc.
- **Audience:** Instructor managing one class.
- **Conditional:** Empty roster vs filled; which session is “today”; errors on cap / permission.
- **Friction:** Many responsibilities in one URL; query-param tab/panel state is powerful but easy to lose in deep links.

---

## `/join/:code` — `JoinClassPage`

- **See:** Invalid code states; class preview card (title, instructor, price, format); if enrolled, success variant; phone + OTP if logged out; join CTA when authenticated.
- **Actions:** Request/verify OTP; submit join.
- **API:** `GET /api/courses/by-invite/:code`; `POST /api/enrollments/join-invite`; OTP endpoints as above.
- **Navigation:** After join → learn/classroom or course (per page).
- **Audience:** Invited learner (cold).
- **Conditional:** Already enrolled; invalid/gone invite; instructor cap errors with server message.
- **Friction:** Long flow on slow networks — page includes slow-network hint patterns.

---

## Other pages (shorter)

| Page | See / do | APIs | Notes |
|------|------------|------|------|
| `/teach` | Tutor value prop, bullets, start teaching / login | — | Mirrors old homepage tutor fold. |
| `/courses` | Filters + grid | `GET /api/courses` | Main browse. |
| `/courses/:slug` | Detail, enroll, reviews | course GET, enroll POST, reviews | Checkout may apply for paid. |
| `/learn` | Enrolled list | `GET /api/enrollments` | Hub. |
| `/learn/.../classroom` | Announcements, threads, assignments | `course-engagement` | Daily learner. |
| `/learn/.../lesson/:id` | Player | lesson GET, progress POST | Learning loop. |
| `/choose-role` | Two big buttons | `PATCH /api/me` | Gate for phone signups. |
| `/onboarding` | Interests / steps | `onboarding` routes | Uses `?next=`. |
| `/instructor/studio` | Heavy dashboard + editor | Many `instructor-studio` | Power user / legacy. |
| `/settings` | Account, plan | `me`, checkout | Cross-role. |

---

## Suggested next steps for your cleanup (for you, not automated)

1. **Pick one primary instructor shell** (studio vs `/instructor/*`) or rename/relate them explicitly in UI (“Advanced / Curriculum”).
2. **Unify favorites** client + one API namespace.
3. **Route guard table** — document which routes should redirect whom (then optionally add a single `ProtectedRoute` wrapper).
4. **Align `/`:** document MVP flag for the team; or split `/` vs `/welcome` to remove dual personality.
5. **Login:** either expose email auth in UI or remove from docs and dead code paths.

---

*End of single-file audit.*
