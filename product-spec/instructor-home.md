# Instructor Home — Product Spec

## 🎯 Goal

Instructor Home must answer ONE question instantly:

👉 “What should I do today?”

This is NOT a dashboard.
This is a **daily action launcher**.

---

## ❗ Core Rules (STRICT)

1. Show ONLY actionable items
2. ONE primary action at a time
3. No analytics-heavy UI
4. No long text or explanations
5. Must be usable in <5 seconds
6. Mobile-first layout

---

## 🧠 Data Sources

Use:

* `/api/instructor-studio/dashboard-today`
* `scheduleToday[]`
* `pendingFeesCount`
* `classInsights[]`

---

---

## 🟢 Page Structure (`/instructor/home`)

---

### 1. Greeting

Dynamic based on time:

* Morning: "Good morning 👋"
* Afternoon: "Good afternoon 👋"
* Evening: "Good evening 👋"

Optional: add instructor name

---

---

### 2. Today Summary (1-line)

Show ONLY if relevant:

Examples:

* "You have 1 class today"
* "2 students haven’t paid this month"
* "No classes today"

Keep it SHORT.

---

---

### 3. 🎯 Primary Action Card (MANDATORY)

System decides what to show.

---

### PRIORITY ORDER:

1. Class happening today → attendance
2. Fees pending → reminder
3. No students → invite
4. Else → all clear

---

---

### CASE 1 — Class Today

Title:
"Mark attendance for today"

Subtitle:
"{Class name} • {time}"

Primary button:
"Mark attendance"

Secondary:
"View class"

---

---

### CASE 2 — Fees Pending

Title:
"{N} students haven’t paid"

Primary button:
"Remind now"

Secondary:
"Open fees"

---

---

### CASE 3 — No Students

Title:
"Add your first students"

Primary button:
"Share invite"

Secondary:
"Add manually"

---

---

### CASE 4 — All Clear

Title:
"You're all set today"

Secondary:
"View your classes"

---

---

## 📦 4. Today’s Classes (if any)

Show minimal list:

Each item:

* Class name
* Time
* Student count

Tap → `/instructor/class/:slug`

---

---

## 📦 5. Quick Actions (SECONDARY)

Small section (not dominant):

* "Create new class"
* "View all classes"

---

---

## 📌 6. DO NOT INCLUDE

* Analytics charts
* Long descriptions
* Multiple CTAs competing
* Teaching tools UI
* Profile forms
* Curriculum editor

---

---

## 🎨 UI Guidelines

* Large primary CTA button
* Clear spacing
* One-card focus
* Mobile-friendly padding
* Use existing Tailwind + shadcn components
* No new design system

---

---

## 🧪 Success Criteria

Instructor should be able to:

* Open app
* Tap one button
* Complete action in <10 seconds

---

If user pauses or scrolls → FAIL

---

---

## 💡 UX Intent

This screen should feel like:

* WhatsApp (quick action)
* Google Pay (clear next step)
* NOT like a dashboard

---

---

## ❌ Anti-patterns

* Showing everything at once
* Making user decide what to do
* Too many cards
* Repeating same action in multiple places

---

---

## 🔁 Navigation

Primary button → always deep link:

* Attendance → `/instructor/class/:slug/attendance`
* Fees → `/instructor/class/:slug/fees`
* Students → `/instructor/class/:slug/students`

---

---

## 🧠 Future (NOT NOW)

* Notifications
* Insights
* Performance analytics

Keep out of MVP.
