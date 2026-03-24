import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { formatInrFromPaise } from "../lib/inr.js";
import { CourseFormat, type Prisma } from "@prisma/client";
import { pathParam } from "../lib/httpParams.js";
import { authRequired, optionalAuth, type AuthedRequest } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

function courseJson(c: {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  format: CourseFormat;
  locationLabel: string;
  city: string | null;
  durationLabel: string;
  priceCents: number;
  outcomes: string | null;
  imageKey: string;
  coverImageUrl: string | null;
  rating: number;
  studentCount: number;
  badge: string | null;
  instructor: { name: string; id: string };
}) {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    category: c.category,
    format: c.format,
    locationLabel: c.locationLabel,
    city: c.city,
    durationLabel: c.durationLabel,
    priceCents: c.priceCents,
    priceDisplay: formatInrFromPaise(c.priceCents),
    outcomes: c.outcomes,
    imageKey: c.imageKey,
    coverImageUrl: c.coverImageUrl,
    rating: c.rating,
    studentCount: c.studentCount,
    badge: c.badge,
    instructor: { id: c.instructor.id, name: c.instructor.name },
  };
}

router.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const onlineOnly = req.query.onlineOnly === "1" || req.query.onlineOnly === "true";
  const city = typeof req.query.city === "string" ? req.query.city : "";
  const format = typeof req.query.format === "string" ? req.query.format : "";
  const minPrice = Number(req.query.minPrice ?? 0);
  const maxPrice = Number(req.query.maxPrice ?? Number.MAX_SAFE_INTEGER);
  const minRating = Number(req.query.minRating ?? 0);
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(24, Math.max(1, Number(req.query.pageSize ?? 12)));
  const sort = typeof req.query.sort === "string" ? req.query.sort : "popular";

  const where: Prisma.CourseWhereInput = { published: true };

  if (onlineOnly) {
    where.format = "ONLINE";
  } else if (category && category !== "All" && category !== "Online Only") {
    where.category = category;
  }
  if (city && city !== "All") {
    where.city = city;
  }
  if (format === "ONLINE" || format === "IN_PERSON") {
    where.format = format;
  }
  where.priceCents = { gte: Number.isFinite(minPrice) ? minPrice : 0, lte: Number.isFinite(maxPrice) ? maxPrice : Number.MAX_SAFE_INTEGER };
  if (minRating > 0) {
    where.rating = { gte: minRating };
  }

  const orderBy =
    sort === "price-asc"
      ? [{ priceCents: "asc" as const }]
      : sort === "price-desc"
        ? [{ priceCents: "desc" as const }]
        : sort === "rating"
          ? [{ rating: "desc" as const }, { studentCount: "desc" as const }]
          : [{ studentCount: "desc" as const }];

  let courses = await prisma.course.findMany({
    where,
    orderBy,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      format: true,
      locationLabel: true,
      city: true,
      durationLabel: true,
      priceCents: true,
      outcomes: true,
      imageKey: true,
      coverImageUrl: true,
      rating: true,
      studentCount: true,
      badge: true,
      plannerTag: true,
      instructor: { select: { id: true, name: true } },
    },
  });

  if (search) {
    const q = search.toLowerCase();
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.instructor.name.toLowerCase().includes(q) ||
        (c.plannerTag && c.plannerTag.toLowerCase().includes(q)),
    );
  }

  if (category === "Online Only") {
    courses = courses.filter((c) => c.format === "ONLINE");
  }

  const total = courses.length;
  const start = (page - 1) * pageSize;
  const pageRows = courses.slice(start, start + pageSize);
  res.json({
    courses: pageRows.map(courseJson),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
});

router.get("/:slug", optionalAuth, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    include: {
      instructor: { select: { id: true, name: true, specialty: true } },
      reviews: {
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
        take: 20,
      },
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!course) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  const [favorite, enrollment] = req.userId
    ? await Promise.all([
        prisma.favorite.findFirst({ where: { userId: req.userId, courseId: course.id } }),
        prisma.enrollment.findFirst({ where: { userId: req.userId, courseId: course.id } }),
      ])
    : [null, null];

  const avgRating =
    course.reviews.length > 0
      ? Number((course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length).toFixed(1))
      : course.rating;

  res.json({
    course: {
      ...courseJson(course),
      description: course.description,
      rating: avgRating,
      instructor: course.instructor,
      isFavorite: Boolean(favorite),
      isEnrolled: Boolean(enrollment),
      reviews: course.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: { id: r.user.id, name: r.user.name },
      })),
      sections: course.sections.map((s) => ({
        id: s.id,
        title: s.title,
        sortOrder: s.sortOrder,
        lessons: s.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          durationMin: l.durationMin,
          preview: l.preview,
          sortOrder: l.sortOrder,
        })),
      })),
    },
  });
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(500).optional(),
});

router.post("/:slug/reviews", authRequired, async (req: AuthedRequest, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    select: { id: true, slug: true },
  });
  if (!course) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  await prisma.review.upsert({
    where: { userId_courseId: { userId: req.userId!, courseId: course.id } },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
    create: {
      userId: req.userId!,
      courseId: course.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  const stats = await prisma.review.aggregate({
    where: { courseId: course.id },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.course.update({
    where: { id: course.id },
    data: {
      rating: Number((stats._avg.rating ?? 4.8).toFixed(1)),
    },
  });

  res.status(201).json({ ok: true, courseSlug: course.slug });
});

router.patch("/:slug/reviews/:reviewId/report", authRequired, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  const reviewId = pathParam(req.params.reviewId);
  if (!slug || !reviewId) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    select: { id: true },
  });
  if (!course) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  const review = await prisma.review.findFirst({
    where: { id: reviewId, courseId: course.id },
    select: { id: true },
  });
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }
  await prisma.review.update({
    where: { id: review.id },
    data: { reported: true },
  });
  res.json({ ok: true });
});

router.get("/:slug/lessons/:lessonId", optionalAuth, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  const lessonId = pathParam(req.params.lessonId);
  if (!slug || !lessonId) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, section: { course: { slug, published: true } } },
    include: { section: { include: { course: true } } },
  });
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }
  const enrolled = req.userId
    ? await prisma.enrollment.findFirst({
        where: { userId: req.userId, courseId: lesson.section.courseId },
      })
    : null;
  const canAccess = lesson.preview || Boolean(enrolled);
  if (!canAccess) {
    res.status(403).json({ error: "Enroll to watch this lesson" });
    return;
  }
  res.json({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      durationMin: lesson.durationMin,
      preview: lesson.preview,
      videoUrl:
        lesson.videoUrl ||
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      course: {
        slug: lesson.section.course.slug,
        title: lesson.section.course.title,
      },
      section: {
        id: lesson.section.id,
        title: lesson.section.title,
      },
    },
  });
});

export default router;
