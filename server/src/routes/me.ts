import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import type { PlanTier } from "@prisma/client";
import { interestCategoryHints } from "../lib/onboardingCatalog.js";
import { formatInrFromPaise } from "../lib/inr.js";
import { pathParam } from "../lib/httpParams.js";
import { publicUser } from "./auth.js";

const router = Router();

const planSchema = z.object({
  planTier: z.enum(["EXPLORER", "CREATOR_PLUS", "INSTRUCTOR_PRO"]),
});

const profilePatchSchema = z.object({
  name: z.string().min(2).max(120),
});

router.patch("/profile", authRequired, async (req: AuthedRequest, res) => {
  const parsed = profilePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { name: parsed.data.name.trim() },
  });
  res.json({ user: publicUser(user) });
});

router.patch("/plan", authRequired, async (req: AuthedRequest, res) => {
  const parsed = planSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { planTier: parsed.data.planTier as PlanTier },
    select: { id: true, email: true, name: true, planTier: true, role: true },
  });
  res.json({ user });
});

router.get("/favorites", authRequired, async (req: AuthedRequest, res) => {
  const favs = await prisma.favorite.findMany({
    where: { userId: req.userId! },
    include: {
      course: { include: { instructor: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    favorites: favs.map((f) => ({
      courseSlug: f.course.slug,
      title: f.course.title,
      imageKey: f.course.imageKey,
      coverImageUrl: f.course.coverImageUrl,
      priceCents: f.course.priceCents,
      instructorName: f.course.instructor.name,
    })),
  });
});

router.post("/favorites/:slug", authRequired, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const course = await prisma.course.findFirst({ where: { slug, published: true } });
  if (!course) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  try {
    await prisma.favorite.create({
      data: { userId: req.userId!, courseId: course.id },
    });
  } catch {
    res.status(409).json({ error: "Already saved" });
    return;
  }
  res.status(201).json({ ok: true });
});

router.delete("/favorites/:slug", authRequired, async (req: AuthedRequest, res) => {
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

router.get("/for-you", authRequired, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { role: true, onboardingProfile: true, onboardingCompletedAt: true },
  });
  if (!user || user.role !== "LEARNER") {
    res.status(403).json({ error: "Learners only" });
    return;
  }

  type Profile = { learner?: { interests?: string[] }; skipped?: boolean } | null;
  const profile = user.onboardingProfile as Profile;
  const interestIds = profile?.skipped ? [] : (profile?.learner?.interests ?? []);
  const categories = interestCategoryHints(interestIds);

  const enrolled = await prisma.enrollment.findMany({
    where: { userId: req.userId! },
    select: { courseId: true },
  });
  const enrolledIds = new Set(enrolled.map((e) => e.courseId));

  const all = await prisma.course.findMany({
    where: { published: true },
    orderBy: [{ rating: "desc" }, { studentCount: "desc" }],
    include: { instructor: { select: { name: true } } },
  });

  let pool = all.filter((c) => !enrolledIds.has(c.id));
  if (categories.length > 0) {
    const matched = pool.filter((c) => categories.includes(c.category));
    if (matched.length) pool = matched;
  }

  const courses = pool.slice(0, 8).map((c) => ({
    slug: c.slug,
    title: c.title,
    category: c.category,
    imageKey: c.imageKey,
    coverImageUrl: c.coverImageUrl,
    rating: c.rating,
    durationLabel: c.durationLabel,
    priceDisplay: formatInrFromPaise(c.priceCents),
    instructorName: c.instructor.name,
  }));

  res.json({
    courses,
    meta: {
      interestIds,
      categories,
      personalized: categories.length > 0 && Boolean(user.onboardingCompletedAt) && !profile?.skipped,
    },
  });
});

export default router;
