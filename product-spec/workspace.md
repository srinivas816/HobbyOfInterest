# Instructor Class Workspace — Product Spec

## 🎯 Goal

The class workspace must feel like a **daily assistant**, not a dashboard.

Instructor should be able to:

* Open the app
* Understand what to do instantly
* Complete action in <10 seconds

---

## ❗ Core Rules (STRICT)

1. NO tabs on the main class screen
2. ONLY ONE primary action visible at a time
3. DO NOT show multiple competing actions
4. UI must be mobile-first
5. No long explanations or instructional text

---

## 🧠 Today Engine (PRIORITY LOGIC)

The system decides what to show.

Priority order:

1. If session exists today → show attendance action
2. Else if fees pending → show fees action
3. Else if no students → show invite action
4. Else → show “all clear”

---

## 🟢 Hub Screen (`/instructor/class/:slug`)

### Header

* Back button → `/instructor/classes`
* Class name
* Subtitle:

  * `{N} students`
  * `{₹fee}/month` (if available)
* No extra metadata

---

### 🎯 Today Action Card (MANDATORY)

Only ONE of the following appears:

---

#### 1. Attendance (highest priority)

Title:
"Mark attendance for today"

Primary button:
"Mark all present"

Secondary (small link):
"Open attendance"

---

#### 2. Fees pending

Title:
"{N} students haven’t paid this month"

Primary button:
"Remind"

Secondary:
"Open fees"

---

#### 3. No students

Title:
"Add your first students"

Primary button:
"Share invite"

Secondary:
"Add student"

---

#### 4. All clear

Title:
"You're all set today"

Secondary:
"View students"

---

---

### 📦 Minimal Sections (LOW PRIORITY)

Only show lightweight previews:

---

#### Students

* Show:

  * "Students: {count}"
* No list by default
* Tap → `/instructor/class/:slug/students`

---

#### Fees

* Show:

  * "{N} pending this month"
* Tap → `/instructor/class/:slug/fees`

---

#### Attendance

* Show:

  * "Today: Session at {time}" OR "No session today"
* Tap → `/instructor/class/:slug/attendance`

---

---

### 📌 Footer Actions

* "Message class" → `/instructor/class/:slug/announce`
* "More" → `/instructor/more`

---

---

## 📄 Attendance Page (`/attendance`)

### Must show:

* "Today: {session time OR no session}"

---

### Actions:

* "Start session" (if none exists)
* "Mark all present"
* Student list with:

  * Present / Absent toggle

---

### Behavior:

* Auto-save ON
* Show feedback:

  * "Saving..."
  * "Saved ✓"

---

---

## 📄 Fees Page (`/fees`)

### Header:

* "March 2026 fees"

---

### Summary:

* "₹X collected"
* "₹Y pending"

---

### Actions:

* "Remind all"

---

### List:

Each student:

* Name
* Status: Paid / Pending
* Actions:

  * "Mark paid"
  * "Remind"

---

### Month control:

* Hidden under:

  * "Change month →"

---

---

## 📄 Students Page (`/students`)

### Top actions:

* "Share invite" (WhatsApp)
* "Add student" (bulk)

---

### List:

Each student:

* Name
* Email or phone
* Joined (relative time)

---

### ❗ DO NOT show:

* Fee status here
* Attendance here

---

---

## 📄 Announce Page (`/announce`)

### Must:

* Be separate screen (not overlay)

---

### Actions:

* Write message
* "Post"
* "Post + WhatsApp"

---

---

## ❌ Forbidden (IMPORTANT)

* No duplicate buttons
* No repeating actions in multiple places
* No mixing attendance + fees + students in same section
* No hidden logic (must be visible to user)
* No auto-navigation without user action

---

---

## 🎨 UI Guidelines (IMPORTANT FOR CURSOR)

* Use existing Tailwind tokens
* Maintain spacing system
* Use existing Button variants
* Follow current typography (Fraunces + Inter)
* Do NOT introduce new design system

---

---

## 🧪 Success Criteria

Instructor can:

* Mark attendance in <10 seconds
* Send fee reminder in <10 seconds
* Invite students in <10 seconds

---

If any action takes more than 2 steps → FAIL
