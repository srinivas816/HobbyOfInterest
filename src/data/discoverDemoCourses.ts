import type { CourseListItem } from "@/types/course";

function inr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

/**
 * Demo / seed-aligned rows so discover never renders an empty strip (matches `server/prisma/seed.ts` slugs).
 */
export const DISCOVER_DEMO_COURSES: CourseListItem[] = [
  {
    id: "demo-weekend-pottery-wheel-basics",
    slug: "weekend-pottery-wheel-basics",
    title: "Weekend Pottery Wheel Basics",
    description: "Hands-on wheel throwing for beginners.",
    category: "DIY & Maker",
    format: "IN_PERSON",
    locationLabel: "In-person",
    city: "Mumbai",
    durationLabel: "Sat–Sun",
    priceCents: 399_900,
    priceDisplay: inr(399_900),
    outcomes: null,
    imageKey: "hero-pottery",
    coverImageUrl: null,
    rating: 4.9,
    studentCount: 234,
    badge: "Bestseller",
    instructor: { id: "demo-ananya", name: "Ananya" },
  },
  {
    id: "demo-artisan-bread-pastry-lab",
    slug: "artisan-bread-pastry-lab",
    title: "Artisan Bread & Pastry Lab",
    description: "Sourdough and laminated dough online.",
    category: "Food & Baking",
    format: "ONLINE",
    locationLabel: "Online",
    city: null,
    durationLabel: "4 sessions",
    priceCents: 329_900,
    priceDisplay: inr(329_900),
    outcomes: null,
    imageKey: "category-baking",
    coverImageUrl: null,
    rating: 4.8,
    studentCount: 512,
    badge: "Popular",
    instructor: { id: "demo-rhea", name: "Rhea" },
  },
  {
    id: "demo-woodcraft-home-decor",
    slug: "woodcraft-home-decor",
    title: "Woodcraft for Home Decor",
    description: "Shelves, frames, and small furniture.",
    category: "DIY & Maker",
    format: "IN_PERSON",
    locationLabel: "In-person",
    city: "Bengaluru",
    durationLabel: "6 sessions",
    priceCents: 489_900,
    priceDisplay: inr(489_900),
    outcomes: null,
    imageKey: "category-woodworking",
    coverImageUrl: null,
    rating: 4.7,
    studentCount: 187,
    badge: null,
    instructor: { id: "demo-karthik", name: "Karthik" },
  },
  {
    id: "demo-watercolor-mixed-media",
    slug: "watercolor-mixed-media",
    title: "Watercolor & Mixed Media",
    description: "Color theory, washes, and mixed media.",
    category: "Art & Craft",
    format: "ONLINE",
    locationLabel: "Online",
    city: null,
    durationLabel: "5 weeks",
    priceCents: 289_900,
    priceDisplay: inr(289_900),
    outcomes: null,
    imageKey: "category-watercolor",
    coverImageUrl: null,
    rating: 4.9,
    studentCount: 421,
    badge: "Top Rated",
    instructor: { id: "demo-neha", name: "Neha" },
  },
  {
    id: "demo-sewing-small-labels",
    slug: "sewing-small-labels",
    title: "Sewing for Small Labels",
    description: "Pattern reading and machine basics.",
    category: "DIY & Maker",
    format: "IN_PERSON",
    locationLabel: "In-person",
    city: "Delhi NCR",
    durationLabel: "Weekend batch",
    priceCents: 449_900,
    priceDisplay: inr(449_900),
    outcomes: null,
    imageKey: "category-sewing",
    coverImageUrl: null,
    rating: 4.6,
    studentCount: 156,
    badge: null,
    instructor: { id: "demo-sana", name: "Sana" },
  },
  {
    id: "demo-acoustic-guitar-starter",
    slug: "acoustic-guitar-starter",
    title: "Acoustic Guitar Starter",
    description: "Chords, rhythm, and first songs.",
    category: "Music",
    format: "ONLINE",
    locationLabel: "Online",
    city: null,
    durationLabel: "8 weeks",
    priceCents: 239_900,
    priceDisplay: inr(239_900),
    outcomes: null,
    imageKey: "category-music",
    coverImageUrl: null,
    rating: 4.8,
    studentCount: 890,
    badge: "Bestseller",
    instructor: { id: "demo-arjun", name: "Arjun" },
  },
  {
    id: "demo-canvas-painting-essentials",
    slug: "canvas-painting-essentials",
    title: "Canvas Painting Essentials",
    description: "Acrylic fundamentals in the studio.",
    category: "Art & Craft",
    format: "IN_PERSON",
    locationLabel: "In-person",
    city: "Hyderabad",
    durationLabel: "3 weekends",
    priceCents: 349_900,
    priceDisplay: inr(349_900),
    outcomes: null,
    imageKey: "hero-painting",
    coverImageUrl: null,
    rating: 4.7,
    studentCount: 312,
    badge: null,
    instructor: { id: "demo-devika", name: "Devika" },
  },
  {
    id: "demo-mindful-floral-arrangement",
    slug: "mindful-floral-arrangement",
    title: "Mindful Floral Arrangement",
    description: "Seasonal arrangements and styling.",
    category: "Wellness",
    format: "IN_PERSON",
    locationLabel: "In-person",
    city: "Pune",
    durationLabel: "2 workshops",
    priceCents: 289_900,
    priceDisplay: inr(289_900),
    outcomes: null,
    imageKey: "hero-floristry",
    coverImageUrl: null,
    rating: 4.9,
    studentCount: 198,
    badge: "New",
    instructor: { id: "demo-ira", name: "Ira" },
  },
  {
    id: "demo-contemporary-movement-foundation",
    slug: "contemporary-movement-foundation",
    title: "Contemporary Movement Foundation",
    description: "Strength and expression — no experience needed.",
    category: "Wellness",
    format: "ONLINE",
    locationLabel: "Online",
    city: null,
    durationLabel: "Weekday evenings",
    priceCents: 289_900,
    priceDisplay: inr(289_900),
    outcomes: null,
    imageKey: "hero-floristry",
    coverImageUrl: null,
    rating: 4.8,
    studentCount: 412,
    badge: "Popular",
    instructor: { id: "demo-ira-2", name: "Ira" },
  },
  {
    id: "demo-street-travel-photography-bootcamp",
    slug: "street-travel-photography-bootcamp",
    title: "Street & Travel Photography Bootcamp",
    description: "Light, framing, and editing outdoors.",
    category: "Art & Craft",
    format: "IN_PERSON",
    locationLabel: "In-person",
    city: "Chennai",
    durationLabel: "Weekend outdoor",
    priceCents: 349_900,
    priceDisplay: inr(349_900),
    outcomes: null,
    imageKey: "category-watercolor",
    coverImageUrl: null,
    rating: 4.9,
    studentCount: 305,
    badge: "Top Rated",
    instructor: { id: "demo-neha-2", name: "Neha" },
  },
];

const MIN_DISCOVER_CARDS = 8;
const MAX_STRIP_CARDS = 24;

/** Ensures at least `minCards` tappable cards by padding with demo data (deduped by `id`). */
export function fillDiscoverStripCourses(
  primary: CourseListItem[],
  minCards = MIN_DISCOVER_CARDS,
  excludeSlugs?: Set<string>,
): CourseListItem[] {
  const seen = new Set<string>();
  const out: CourseListItem[] = [];
  const push = (c: CourseListItem) => {
    if (seen.has(c.id)) return;
    if (excludeSlugs?.has(c.slug)) return;
    seen.add(c.id);
    out.push(c);
  };
  for (const c of primary) push(c);
  for (const d of DISCOVER_DEMO_COURSES) {
    if (out.length >= minCards) break;
    push(d);
  }
  if (out.length < minCards) {
    for (const d of DISCOVER_DEMO_COURSES) {
      if (out.length >= minCards) break;
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      out.push(d);
    }
  }
  return out.slice(0, MAX_STRIP_CARDS);
}
