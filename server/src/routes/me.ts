import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { shouldExposeDemoOtp } from "../lib/demoOtp.js";
import { normalizePhone } from "../lib/phone.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import type { PlanTier } from "@prisma/client";
import { interestCategoryHints } from "../lib/onboardingCatalog.js";
import { formatInrFromPaise } from "../lib/inr.js";
import { pathParam } from "../lib/httpParams.js";
import { publicUser } from "./auth.js";

const router = Router();

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const planSchema = z.object({
  planTier: z.enum(["EXPLORER", "CREATOR_PLUS", "INSTRUCTOR_PRO"]),
});

const profilePatchSchema = z.object({
  name: z.string().min(2).max(120),
});

const phoneLinkRequestSchema = z.object({
  phone: z.string().min(8).max(24),
});

const phoneLinkVerifySchema = z.object({
  phone: z.string().min(8).max(24),
  code: z.string().regex(/^\d{6}$/),
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

/** Send OTP to link a phone number to the current account (Settings). */
router.post("/phone/request-link", authRequired, async (req: AuthedRequest, res) => {
  const parsed = phoneLinkRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const normalized = normalizePhone(parsed.data.phone);
  if (!normalized) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { phone: true },
  });
  if (me?.phone === normalized) {
    res.status(400).json({ error: "This number is already linked to your account" });
    return;
  }
  const taken = await prisma.user.findFirst({
    where: { phone: normalized, id: { not: req.userId! } },
    select: { id: true },
  });
  if (taken) {
    res.status(409).json({ error: "This number is already used on another account" });
    return;
  }

  await prisma.otpChallenge.deleteMany({ where: { phone: normalized } });
  await prisma.otpChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const codeHash = await bcrypt.hash(code, 9);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.otpChallenge.create({
    data: {
      phone: normalized,
      codeHash,
      expiresAt,
      linkUserId: req.userId!,
    },
  });
  if (shouldExposeDemoOtp()) {
    console.info(`[otp-link] user=${req.userId} ${normalized} → ${code}`);
  }
  const expose = shouldExposeDemoOtp();
  res.json({
    ok: true,
    ...(expose
      ? {
          demoOtp: code,
          demoOtpHint: "No SMS — enter this code below (same demo rules as login OTP).",
        }
      : {}),
  });
});

/** Confirm OTP and save phone on the current account. */
router.post("/phone/verify-link", authRequired, async (req: AuthedRequest, res) => {
  const parsed = phoneLinkVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const normalized = normalizePhone(parsed.data.phone);
  if (!normalized) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }
  const challenge = await prisma.otpChallenge.findFirst({
    where: { phone: normalized, linkUserId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge || challenge.expiresAt < new Date()) {
    res.status(400).json({ error: "Code expired. Request a new one." });
    return;
  }
  if (challenge.attempts >= 8) {
    res.status(429).json({ error: "Too many attempts" });
    return;
  }
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: { increment: 1 } },
  });
  const valid = await bcrypt.compare(parsed.data.code, challenge.codeHash);
  if (!valid) {
    res.status(400).json({ error: "Invalid code" });
    return;
  }

  const taken = await prisma.user.findFirst({
    where: { phone: normalized, id: { not: req.userId! } },
    select: { id: true },
  });
  if (taken) {
    res.status(409).json({ error: "This number was linked to another account in the meantime" });
    return;
  }

  await prisma.otpChallenge.deleteMany({ where: { phone: normalized } });
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { phone: normalized },
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

/** Attendance + monthly fee snapshot for enrolled learners (MVP local-class tools). */
router.get("/enrolled/:slug/tracking", authRequired, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const enr = await prisma.enrollment.findFirst({
    where: { userId: req.userId!, course: { slug } },
    select: { id: true, courseId: true, course: { select: { slug: true, title: true } } },
  });
  if (!enr) {
    res.status(404).json({ error: "Not enrolled in this class" });
    return;
  }

  const sessions = await prisma.classSession.findMany({
    where: { courseId: enr.courseId },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);
  const attendedSessions = await prisma.attendanceRecord.count({
    where: {
      enrollmentId: enr.id,
      present: true,
      sessionId: { in: sessionIds },
    },
  });
  const ym = currentYearMonth();
  const fee = await prisma.enrollmentFeePeriod.findUnique({
    where: { enrollmentId_yearMonth: { enrollmentId: enr.id, yearMonth: ym } },
  });

  const total = sessionIds.length;
  const attendancePercent = total > 0 ? Math.round((attendedSessions / total) * 100) : 0;

  res.json({
    courseSlug: enr.course.slug,
    courseTitle: enr.course.title,
    attendancePercent,
    sessionsTracked: total,
    sessionsAttended: attendedSessions,
    feeThisMonth: {
      yearMonth: ym,
      status: fee?.status ?? "PENDING",
    },
  });
});

export default router;
