import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { formatInrFromPaise } from "../lib/inr.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import { pathParam } from "../lib/httpParams.js";

const router = Router();

const schema = z.object({
  courseSlug: z.string().min(1),
});

router.get("/", authRequired, async (req: AuthedRequest, res) => {
  const rows = await prisma.favorite.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    include: { course: { include: { instructor: { select: { id: true, name: true } } } } },
  });
  res.json({
    favorites: rows.map((f) => ({
      id: f.id,
      addedAt: f.createdAt,
      course: {
        id: f.course.id,
        slug: f.course.slug,
        title: f.course.title,
        category: f.course.category,
        format: f.course.format,
        locationLabel: f.course.locationLabel,
        city: f.course.city,
        durationLabel: f.course.durationLabel,
        imageKey: f.course.imageKey,
        coverImageUrl: f.course.coverImageUrl,
        priceCents: f.course.priceCents,
        priceDisplay: formatInrFromPaise(f.course.priceCents),
        rating: f.course.rating,
        studentCount: f.course.studentCount,
        badge: f.course.badge,
        instructor: f.course.instructor,
      },
    })),
  });
});

router.post("/", authRequired, async (req: AuthedRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug: parsed.data.courseSlug, published: true },
  });
  if (!course) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  await prisma.favorite.upsert({
    where: { userId_courseId: { userId: req.userId!, courseId: course.id } },
    update: {},
    create: { userId: req.userId!, courseId: course.id },
  });
  res.status(201).json({ ok: true, courseSlug: course.slug });
});

router.delete("/:slug", authRequired, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const course = await prisma.course.findFirst({ where: { slug } });
  if (!course) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  await prisma.favorite.deleteMany({
    where: { userId: req.userId!, courseId: course.id },
  });
  res.json({ ok: true });
});

export default router;
