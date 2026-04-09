# Public Home (Discover) — Product Spec

## 🎯 Goal

Help a user:

1. Understand the product instantly
2. Discover classes quickly
3. Take action (search / explore / join)

---

## ❗ Core Rules

1. NO long marketing page
2. NO scroll fatigue
3. Focus on browsing (like Swiggy / Zomato)
4. Everything should be tappable
5. Mobile-first

---

## 🧠 Mental Model

This is NOT a landing page.

This is a:

👉 “Class discovery app”

---

---

## 🟢 Structure (`/`)

---

### 1. Sticky Search Header

Always visible.

Contains:

* Short headline:
  "Find your next hobby"

* Search bar:
  Placeholder:
  "Pottery, guitar, dance…"

* Location chips:

  * All India
  * Mumbai
  * Bengaluru
  * Hyderabad
  * etc.

---

---

### 2. Category Scroll (Horizontal)

Swipeable row.

Each item:

* Emoji + label

Examples:

* 🎨 Art
* 🎸 Music
* 💃 Dance
* 🏸 Sports
* 🧘 Wellness
* 💻 Online

Tap → `/courses?category=...`

---

---

### 3. Nearby / Popular Strip

Title:

* "Popular in {city}" OR
* "Popular across India"

Horizontal scroll.

Each card:

* Image
* Title
* Instructor
* Price
* Rating
* Tag:

  * Nearby
  * Online

Tap → Course page

---

---

### 4. Trending Strip

Title:

"Trending now"

Horizontal scroll.

Tags:

* Popular
* Beginner

---

---

### 5. Quick Join (IMPORTANT)

Small section:

```text
Have a class invite?
[ Enter code ]
```

OR

```text
Join with invite
```

Tap → `/join`

---

---

### 6. CTA (Light, not heavy)

```text
Start your hobby today
```

Buttons:

* Explore classes
* Log in

---

---

## ❌ REMOVE COMPLETELY

---

* How it works
* Pricing
* Testimonials
* FAQ
* Newsletter
* Long text sections
* Corporate landing content

---

---

## 🎨 UI Guidelines

* Horizontal scroll everywhere
* Cards ~260px width
* Snap scroll
* Minimal text
* Warm + premium feel (your current theme is good)

---

---

## 🧪 Success Criteria

User should:

* Scroll instinctively
* Tap a class within 5–10 seconds
* Not read long text

---

---

## 🧠 UX Intent

Feels like:

* Swiggy → browsing food
* Udemy → browsing courses

NOT:

* Corporate website

---

---

## 🔁 Navigation

Search → `/courses?q=...`

Category → `/courses?category=...`

Card → `/courses/:slug`

Join → `/join`

---

---

## 💡 Future (NOT NOW)

* Personalization
* Recommendations
* AI onboarding

---
