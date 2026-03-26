import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { formatInrFromPaise } from "../lib/inr.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import { pathParam } from "../lib/httpParams.js";
import { broadcastToLearners } from "../lib/smtpBroadcast.js";
import { assignInviteCodeIfMissing } from "../lib/inviteCode.js";
import {
  assertInstructorCanAddLearner,
  getInstructorSubscriptionSummary,
} from "../lib/instructorEnrollmentCap.js";
import { razorpayConfigured } from "../lib/razorpay.js";
import { trialBypassAllowed } from "../lib/checkoutTrial.js";
import { funnelLog } from "../lib/funnel.js";

const router = Router();

function ymRegex(ym: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(ym);
}

function lastNCalendarMonths(n: number): string[] {
  const out: string[] = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

type ParsedEnrollLine =
  | { kind: "email"; value: string }
  | { kind: "phone"; tries: string[] }
  | { kind: "invalid"; raw: string };

function parseEnrollmentLine(raw: string): ParsedEnrollLine | null {
  const line = raw.trim();
  if (!line) return null;
  const emailCheck = z.string().email().safeParse(line);
  if (emailCheck.success) return { kind: "email", value: emailCheck.data.trim().toLowerCase() };
  const digits = line.replace(/\D/g, "");
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    const tries = new Set<string>();
    tries.add(`+91${last10}`);
    if (line.replace(/\s/g, "").startsWith("+")) tries.add(line.replace(/\s/g, ""));
    return { kind: "phone", tries: [...tries] };
  }
  return { kind: "invalid", raw: line };
}

async function findUserForEnrollLine(parsed: ParsedEnrollLine): Promise<{ id: string } | null> {
  if (parsed.kind === "invalid") return null;
  if (parsed.kind === "email") {
    return prisma.user.findFirst({
      where: { email: { equals: parsed.value, mode: "insensitive" } },
      select: { id: true },
    });
  }
  for (const phone of parsed.tries) {
    const u = await prisma.user.findFirst({ where: { phone }, select: { id: true } });
    if (u) return u;
  }
  return null;
}

const sectionSchema = z.object({
  courseSlug: z.string().min(1),
  title: z.string().min(3).max(120),
});

const lessonSchema = z.object({
  sectionId: z.string().min(1),
  title: z.string().min(3).max(120),
  durationMin: z.number().int().min(1).max(300),
  preview: z.boolean().optional(),
  videoUrl: z.string().url().max(2048).optional(),
});

const lessonPatchSchema = z.object({
  videoUrl: z.union([z.string().url().max(2048), z.null()]).optional(),
  title: z.string().min(3).max(120).optional(),
  durationMin: z.number().int().min(1).max(300).optional(),
  preview: z.boolean().optional(),
});

const sectionTitleSchema = z.object({
  title: z.string().min(3).max(120),
});

const moveSchema = z.object({
  direction: z.enum(["up", "down"]),
});

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  specialty: z.string().min(2).max(160),
});

const courseCreateSchema = z.object({
  title: z.string().min(4).max(160),
  category: z.string().min(2).max(120),
  format: z.enum(["ONLINE", "IN_PERSON"]),
  city: z.string().max(120).nullable().optional(),
  durationLabel: z.string().min(2).max(80),
  priceInr: z.number().int().min(99).max(999999),
  description: z.string().min(20).max(5000),
  outcomes: z.string().min(10).max(4000),
  imageKey: z.string().min(2).max(120).optional(),
  coverImageUrl: z.string().url().max(2048).optional(),
  published: z.boolean().optional(),
});

/** Fast activation: minimal fields; server fills description/outcomes. */
const courseActivationSchema = z.object({
  title: z.string().min(3).max(160),
  category: z.string().min(2).max(120),
  format: z.enum(["ONLINE", "IN_PERSON"]),
  city: z.string().max(120).optional().nullable(),
  durationLabel: z.string().min(2).max(80),
  /** Monthly or per-term fee in INR (whole rupees); 0 = free */
  priceInr: z.number().int().min(0).max(999999),
});

const announcementCreateSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().min(10).max(8000),
  emailLearners: z.boolean().optional(),
});

const assignmentCreateSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(8000),
  dueAt: z.string().max(40).optional().nullable(),
});

const taxProfileSchema = z.object({
  legalName: z.string().max(120).optional().nullable(),
  panLast4: z.string().max(10).optional().nullable(),
  gstin: z.string().max(20).optional().nullable(),
});

const payoutRequestSchema = z.object({
  amountInr: z.number().int().min(1).max(10_000_000),
  note: z.string().max(500).optional(),
});

const courseUpdateSchema = z.object({
  title: z.string().min(4).max(160).optional(),
  category: z.string().min(2).max(120).optional(),
  format: z.enum(["ONLINE", "IN_PERSON"]).optional(),
  city: z.string().max(120).nullable().optional(),
  durationLabel: z.string().min(2).max(80).optional(),
  priceInr: z.number().int().min(99).max(999999).optional(),
  description: z.string().min(20).max(5000).optional(),
  outcomes: z.string().min(10).max(4000).optional(),
  imageKey: z.string().min(2).max(120).optional(),
  coverImageUrl: z.union([z.string().url().max(2048), z.null()]).optional(),
  published: z.boolean().optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function assertInstructor(req: AuthedRequest) {
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { role: true },
  });
  return me?.role === "INSTRUCTOR";
}

router.get("/analytics", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }

  const courses = await prisma.course.findMany({
    where: { instructorId: req.userId! },
    select: {
      id: true,
      slug: true,
      title: true,
      published: true,
      _count: { select: { enrollments: true } },
      sections: {
        select: {
          lessons: { select: { id: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const coursesOut = await Promise.all(
    courses.map(async (c) => {
      const lessonIds = c.sections.flatMap((s) => s.lessons.map((l) => l.id));
      const totalLessons = lessonIds.length;
      const enrolled = await prisma.enrollment.findMany({
        where: { courseId: c.id },
        select: { userId: true },
      });

      let avgCompletionPercent = 0;
      if (totalLessons > 0 && enrolled.length > 0) {
        let sum = 0;
        for (const { userId } of enrolled) {
          const done = await prisma.lessonProgress.count({
            where: { userId, lessonId: { in: lessonIds } },
          });
          sum += (done / totalLessons) * 100;
        }
        avgCompletionPercent = Math.round(sum / enrolled.length);
      }

      return {
        slug: c.slug,
        title: c.title,
        published: c.published,
        enrollmentCount: c._count.enrollments,
        totalLessons,
        avgCompletionPercent,
      };
    }),
  );

  const totalEnrollments = coursesOut.reduce((acc, row) => acc + row.enrollmentCount, 0);

  res.json({
    courses: coursesOut,
    totals: { enrollments: totalEnrollments, classes: coursesOut.length },
  });
});

router.get("/profile", authRequired, async (req: AuthedRequest, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, name: true, role: true, specialty: true, instructorStudents: true, instructorClasses: true },
  });
  if (!me) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (me.role !== "INSTRUCTOR") {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  res.json({ profile: me });
});

router.get("/subscription-summary", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const summary = await getInstructorSubscriptionSummary(req.userId!);
  if (!summary) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const checkoutLive = razorpayConfigured();
  res.json({
    ...summary,
    monthlyPriceInr: 299,
    monthlyPriceDisplay: "₹299/month",
    checkoutLive,
    trialBypassAllowed: trialBypassAllowed(),
    upgradeNote: checkoutLive
      ? "Pay with Razorpay in Account → Plan & upgrade. Your Pro tier activates after signature verification on the server."
      : "Live checkout needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the API. For pilots without Razorpay, use CHECKOUT_DEV_BYPASS=1 (non-production only) or set plan in the database.",
  });
});

/** Today’s sessions + incomplete attendance (for instructor home / retention). */
router.get("/dashboard-today", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const ym = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, "0")}`;

  const myCourses = await prisma.course.findMany({
    where: { instructorId: req.userId! },
    select: { id: true },
  });
  const courseIds = myCourses.map((c) => c.id);
  if (courseIds.length === 0) {
    res.json({
      sessionsToday: 0,
      pendingAttendanceCount: 0,
      totalStudentEnrollments: 0,
      pendingFeesCount: 0,
      feeMonth: ym,
      alerts: [] as Array<{ id: string; kind: string; message: string; severity: "info" | "warning" }>,
      scheduleToday: [] as Array<{
        sessionId: string;
        courseSlug: string;
        courseTitle: string;
        heldAt: string;
        label: string | null;
        studentCount: number;
      }>,
      classInsights: [] as Array<{ courseSlug: string; totalStudents: number; pendingFeesCount: number }>,
    });
    return;
  }

  const sessionsToday = await prisma.classSession.findMany({
    where: {
      courseId: { in: courseIds },
      heldAt: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { heldAt: "asc" },
    include: {
      course: { select: { slug: true, title: true } },
      attendance: { select: { enrollmentId: true } },
    },
  });

  let pendingAttendanceCount = 0;
  for (const session of sessionsToday) {
    const enrollCount = await prisma.enrollment.count({ where: { courseId: session.courseId } });
    const marked = new Set(session.attendance.map((a) => a.enrollmentId));
    pendingAttendanceCount += Math.max(0, enrollCount - marked.size);
  }

  const totalStudentEnrollments = await prisma.enrollment.count({
    where: { course: { instructorId: req.userId! } },
  });

  const sessionCourseIds = [...new Set(sessionsToday.map((s) => s.courseId))];
  const enrollCounts =
    sessionCourseIds.length === 0
      ? []
      : await prisma.enrollment.groupBy({
          by: ["courseId"],
          where: { courseId: { in: sessionCourseIds } },
          _count: { _all: true },
        });
  const countByCourse = new Map(enrollCounts.map((r) => [r.courseId, r._count._all]));

  const scheduleToday = sessionsToday.map((s) => ({
    sessionId: s.id,
    courseSlug: s.course.slug,
    courseTitle: s.course.title,
    heldAt: s.heldAt.toISOString(),
    label: s.label,
    studentCount: countByCourse.get(s.courseId) ?? 0,
  }));

  const allEnrollmentsThisMonth = await prisma.enrollment.findMany({
    where: { course: { instructorId: req.userId! } },
    select: {
      id: true,
      course: { select: { slug: true } },
      feePeriods: {
        where: { yearMonth: ym },
        select: { status: true },
        take: 1,
      },
    },
  });
  const pendingFeesCount = allEnrollmentsThisMonth.filter(
    (e) => (e.feePeriods[0]?.status ?? "PENDING") === "PENDING",
  ).length;

  const insightBySlug = new Map<string, { totalStudents: number; pendingFeesCount: number }>();
  for (const e of allEnrollmentsThisMonth) {
    const slug = e.course.slug;
    const cur = insightBySlug.get(slug) ?? { totalStudents: 0, pendingFeesCount: 0 };
    cur.totalStudents += 1;
    if ((e.feePeriods[0]?.status ?? "PENDING") === "PENDING") cur.pendingFeesCount += 1;
    insightBySlug.set(slug, cur);
  }
  const classInsights = [...insightBySlug.entries()].map(([courseSlug, v]) => ({
    courseSlug,
    totalStudents: v.totalStudents,
    pendingFeesCount: v.pendingFeesCount,
  }));

  const alerts: Array<{ id: string; kind: string; message: string; severity: "info" | "warning" }> = [];
  if (pendingFeesCount > 0) {
    alerts.push({
      id: "fees-pending",
      kind: "fees",
      severity: "warning",
      message: `${pendingFeesCount} student${pendingFeesCount === 1 ? "" : "s"} still have fees pending for ${ym}. Open roster to mark paid or send a WhatsApp reminder.`,
    });
  }
  if (pendingAttendanceCount > 0) {
    alerts.push({
      id: "attendance-pending",
      kind: "attendance",
      severity: "warning",
      message: `${pendingAttendanceCount} attendance slot${pendingAttendanceCount === 1 ? "" : "s"} still open for today — tap Present/Absent so your records stay accurate.`,
    });
  }

  res.json({
    sessionsToday: sessionsToday.length,
    pendingAttendanceCount,
    totalStudentEnrollments,
    pendingFeesCount,
    feeMonth: ym,
    alerts,
    scheduleToday,
    classInsights,
  });
});

router.patch("/profile", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      name: parsed.data.name,
      specialty: parsed.data.specialty,
    },
    select: { id: true, name: true, specialty: true },
  });
  res.json({ profile: updated });
});

router.get("/courses", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const courses = await prisma.course.findMany({
    where: { instructorId: req.userId! },
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  res.json({
    courses: courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      category: c.category,
      format: c.format,
      city: c.city,
      durationLabel: c.durationLabel,
      priceCents: c.priceCents,
      priceDisplay: formatInrFromPaise(c.priceCents),
      outcomes: c.outcomes,
      imageKey: c.imageKey,
      coverImageUrl: c.coverImageUrl,
      published: c.published,
      sections: c.sections.map((s) => ({
        id: s.id,
        title: s.title,
        sortOrder: s.sortOrder,
        lessons: s.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          durationMin: l.durationMin,
          videoUrl: l.videoUrl,
          preview: l.preview,
          sortOrder: l.sortOrder,
        })),
      })),
    })),
  });
});

router.post("/courses", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const parsed = courseCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const base = slugify(parsed.data.title);
  let slug = base || "untitled-class";
  let n = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }

  const created = await prisma.course.create({
    data: {
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      format: parsed.data.format,
      locationLabel: parsed.data.format === "ONLINE" ? "Online" : "In-person",
      city: parsed.data.format === "ONLINE" ? null : (parsed.data.city ?? "Mumbai"),
      durationLabel: parsed.data.durationLabel,
      priceCents: parsed.data.priceInr * 100,
      outcomes: parsed.data.outcomes,
      imageKey: parsed.data.imageKey ?? "hero-pottery",
      coverImageUrl: parsed.data.coverImageUrl ?? null,
      rating: 4.8,
      studentCount: 0,
      badge: "New",
      plannerTag: null,
      published: parsed.data.published ?? false,
      instructorId: req.userId!,
    },
    select: { id: true, slug: true },
  });

  await prisma.user.update({
    where: { id: req.userId! },
    data: { instructorClasses: { increment: 1 } },
  });

  const inviteCode = await assignInviteCodeIfMissing(prisma, created.id);
  funnelLog("class_created", req.userId!, { slug: created.slug, path: "full" });
  res.status(201).json({ course: { ...created, inviteCode } });
});

router.post("/courses/activation", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const parsed = courseActivationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (parsed.data.format === "IN_PERSON" && !(parsed.data.city?.trim())) {
    res.status(400).json({ error: "City is required for in-person classes" });
    return;
  }
  const title = parsed.data.title.trim();
  const whereLine =
    parsed.data.format === "ONLINE"
      ? "Online sessions — link and schedule are shared after students join."
      : `In-person in ${parsed.data.city!.trim()}.`;
  const description = `${title}. Schedule: ${parsed.data.durationLabel}. ${whereLine} Students use this app for classroom updates, materials, and messages. You can edit the full listing anytime in Studio.`;
  const outcomes = `Attend scheduled sessions; practice between classes; ask your instructor questions in the classroom.`;
  const priceRupees = Math.max(parsed.data.priceInr, 0);
  const priceCents = priceRupees * 100;

  const base = slugify(title);
  let slug = base || "untitled-class";
  let n = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }

  const created = await prisma.course.create({
    data: {
      slug,
      title,
      description,
      category: parsed.data.category.trim(),
      format: parsed.data.format,
      locationLabel: parsed.data.format === "ONLINE" ? "Online" : "In-person",
      city: parsed.data.format === "ONLINE" ? null : parsed.data.city!.trim(),
      durationLabel: parsed.data.durationLabel.trim(),
      priceCents,
      outcomes,
      imageKey: "hero-pottery",
      coverImageUrl: null,
      rating: 4.8,
      studentCount: 0,
      badge: "New",
      plannerTag: null,
      published: false,
      instructorId: req.userId!,
    },
    select: { id: true, slug: true },
  });

  await prisma.user.update({
    where: { id: req.userId! },
    data: { instructorClasses: { increment: 1 } },
  });

  const inviteCode = await assignInviteCodeIfMissing(prisma, created.id);
  funnelLog("class_created", req.userId!, { slug: created.slug, path: "activation" });
  res.status(201).json({ course: { ...created, inviteCode } });
});

router.patch("/courses/:slug", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const parsed = courseUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const courseSlug = pathParam(req.params.slug);
  if (!courseSlug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const owned = await prisma.course.findFirst({
    where: { slug: courseSlug, instructorId: req.userId! },
    select: { id: true },
  });
  if (!owned) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  const updated = await prisma.course.update({
    where: { id: owned.id },
    data: {
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(parsed.data.description ? { description: parsed.data.description } : {}),
      ...(parsed.data.category ? { category: parsed.data.category } : {}),
      ...(parsed.data.durationLabel ? { durationLabel: parsed.data.durationLabel } : {}),
      ...(typeof parsed.data.priceInr === "number" ? { priceCents: parsed.data.priceInr * 100 } : {}),
      ...(parsed.data.outcomes ? { outcomes: parsed.data.outcomes } : {}),
      ...(parsed.data.imageKey ? { imageKey: parsed.data.imageKey } : {}),
      ...(typeof parsed.data.coverImageUrl !== "undefined" ? { coverImageUrl: parsed.data.coverImageUrl } : {}),
      ...(typeof parsed.data.published === "boolean" ? { published: parsed.data.published } : {}),
      ...(parsed.data.format
        ? {
            format: parsed.data.format,
            locationLabel: parsed.data.format === "ONLINE" ? "Online" : "In-person",
            city: parsed.data.format === "ONLINE" ? null : (parsed.data.city ?? "Mumbai"),
          }
        : {}),
      ...(typeof parsed.data.city !== "undefined" ? { city: parsed.data.city } : {}),
    },
    select: { id: true, slug: true, published: true },
  });
  res.json({ course: updated });
});

router.get("/courses/:slug/roster", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const now = new Date();
  const defaultYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const qYm = typeof req.query.feeMonth === "string" ? req.query.feeMonth : "";
  const feeMonth = ymRegex(qYm) ? qYm : defaultYm;

  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true, title: true, slug: true, priceCents: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  const rows = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  const enrollmentIds = rows.map((e) => e.id);
  const feeRows =
    enrollmentIds.length === 0
      ? []
      : await prisma.enrollmentFeePeriod.findMany({
          where: { yearMonth: feeMonth, enrollmentId: { in: enrollmentIds } },
        });
  const feeMap = new Map(feeRows.map((f) => [f.enrollmentId, f.status]));

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const sessionsTodayCourse = await prisma.classSession.findMany({
    where: { courseId: course.id, heldAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { heldAt: "desc" },
    include: { attendance: { select: { present: true } } },
  });
  const latestToday = sessionsTodayCourse[0];
  const presentTodayCount = latestToday ? latestToday.attendance.filter((a) => a.present).length : 0;

  const sessionsHeld = await prisma.classSession.count({ where: { courseId: course.id } });
  const presentAgg =
    enrollmentIds.length === 0
      ? []
      : await prisma.attendanceRecord.groupBy({
          by: ["enrollmentId"],
          where: { present: true, session: { courseId: course.id } },
          _count: { _all: true },
        });
  const presentByEnr = new Map(presentAgg.map((r) => [r.enrollmentId, r._count._all]));

  const recent3 = lastNCalendarMonths(3);
  const feeForRecent =
    enrollmentIds.length === 0
      ? []
      : await prisma.enrollmentFeePeriod.findMany({
          where: { enrollmentId: { in: enrollmentIds }, yearMonth: { in: recent3 } },
          select: { enrollmentId: true, yearMonth: true, status: true },
        });
  /** Paid months in last 3 calendar months (missing row = not paid). */
  function feePaidRecentCount(enrollmentId: string): number {
    let n = 0;
    for (const ym of recent3) {
      const row = feeForRecent.find((x) => x.enrollmentId === enrollmentId && x.yearMonth === ym);
      if (row?.status === "PAID") n++;
    }
    return n;
  }

  let pendingFeesCount = 0;
  const students = rows.map((e) => {
    const st = feeMap.get(e.id) ?? "PENDING";
    if (st === "PENDING") pendingFeesCount += 1;
    return {
      enrollmentId: e.id,
      enrolledAt: e.createdAt.toISOString(),
      learner: { id: e.user.id, name: e.user.name, email: e.user.email, phone: e.user.phone },
      feeStatus: st as "PENDING" | "PAID",
      stats: {
        sessionsHeld,
        sessionsPresent: presentByEnr.get(e.id) ?? 0,
        feeRecentPaidCount: feePaidRecentCount(e.id),
        feeRecentMonthCount: recent3.length,
      },
    };
  });

  res.json({
    course: {
      title: course.title,
      slug: course.slug,
      monthlyFeeDisplay: formatInrFromPaise(course.priceCents),
      feeMonth,
    },
    summary: {
      totalStudents: rows.length,
      presentTodayCount,
      pendingFeesCount,
      todaysSessionId: latestToday?.id ?? null,
    },
    students,
  });
});

const bulkEnrollLinesSchema = z.object({
  /** Raw lines; server splits on newlines inside each string too */
  lines: z.array(z.string().max(220)).max(80),
});

router.post("/courses/:slug/roster/bulk-enroll", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const parsed = bulkEnrollLinesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true, instructorId: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }

  const flatLines = parsed.data.lines
    .flatMap((l) => l.split(/[\r\n]+/))
    .map((s) => s.trim())
    .filter(Boolean);
  const uniqueLines = [...new Set(flatLines)].slice(0, 60);

  const enrolled: string[] = [];
  const alreadyEnrolled: string[] = [];
  const notFound: string[] = [];
  const invalidFormat: string[] = [];
  const blocked: { line: string; message: string }[] = [];
  const skippedDuplicate: string[] = [];
  const seenUserIds = new Set<string>();

  for (const line of uniqueLines) {
    const p = parseEnrollmentLine(line);
    if (!p || p.kind === "invalid") {
      invalidFormat.push(line);
      continue;
    }
    const user = await findUserForEnrollLine(p);
    if (!user) {
      notFound.push(line);
      continue;
    }
    if (user.id === req.userId!) {
      invalidFormat.push(line);
      continue;
    }
    if (seenUserIds.has(user.id)) {
      skippedDuplicate.push(line);
      continue;
    }
    seenUserIds.add(user.id);

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    });
    if (existing) {
      alreadyEnrolled.push(line);
      continue;
    }

    const gate = await assertInstructorCanAddLearner(course.instructorId, user.id);
    if (!gate.ok) {
      blocked.push({ line, message: gate.message });
      continue;
    }

    try {
      await prisma.enrollment.create({
        data: { userId: user.id, courseId: course.id },
      });
      await prisma.course.update({
        where: { id: course.id },
        data: { studentCount: { increment: 1 } },
      });
      enrolled.push(line);
    } catch {
      blocked.push({ line, message: "Could not create enrollment (try again)" });
    }
  }

  funnelLog("bulk_enroll_attempt", req.userId!, {
    courseSlug: slug,
    enrolled: enrolled.length,
    notFound: notFound.length,
    blocked: blocked.length,
  });

  res.json({
    ok: true,
    enrolled,
    alreadyEnrolled,
    notFound,
    invalidFormat,
    blocked,
    skippedDuplicate,
  });
});

const sessionCreateSchema = z.object({
  heldAt: z.string().min(1),
  label: z.string().max(120).optional().nullable(),
});

const attendancePutSchema = z.object({
  marks: z.array(
    z.object({
      enrollmentId: z.string().min(1),
      present: z.boolean(),
    }),
  ),
});

const feesPutSchema = z.object({
  rows: z.array(
    z.object({
      enrollmentId: z.string().min(1),
      status: z.enum(["PENDING", "PAID"]),
    }),
  ),
});

router.get("/courses/:slug/invite", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  const inviteCode = await assignInviteCodeIfMissing(prisma, course.id);
  funnelLog("invite_link_opened", req.userId!, { courseSlug: slug });
  res.json({ inviteCode });
});

router.post("/courses/:slug/invite/regenerate", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  await prisma.course.update({ where: { id: course.id }, data: { inviteCode: null } });
  const inviteCode = await assignInviteCodeIfMissing(prisma, course.id);
  funnelLog("invite_regenerated", req.userId!, { courseSlug: slug });
  res.json({ inviteCode });
});

router.get("/courses/:slug/sessions", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  const sessions = await prisma.classSession.findMany({
    where: { courseId: course.id },
    orderBy: { heldAt: "desc" },
    include: {
      attendance: { select: { present: true } },
    },
  });
  res.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      heldAt: s.heldAt.toISOString(),
      label: s.label,
      presentCount: s.attendance.filter((a) => a.present).length,
      totalMarked: s.attendance.length,
    })),
  });
});

router.post("/courses/:slug/sessions", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const parsed = sessionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  const heldAt = new Date(parsed.data.heldAt);
  if (Number.isNaN(heldAt.getTime())) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }
  const session = await prisma.classSession.create({
    data: {
      courseId: course.id,
      heldAt,
      label: parsed.data.label?.trim() || null,
    },
  });
  res.status(201).json({
    session: { id: session.id, heldAt: session.heldAt.toISOString(), label: session.label },
  });
});

router.get("/courses/:slug/sessions/:sessionId/attendance", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  const sessionId = pathParam(req.params.sessionId);
  if (!slug || !sessionId) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  const session = await prisma.classSession.findFirst({
    where: { id: sessionId, course: { slug, instructorId: req.userId! } },
    select: { id: true },
  });
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const enrollments = await prisma.enrollment.findMany({
    where: { course: { slug, instructorId: req.userId! } },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true } } },
  });
  const records = await prisma.attendanceRecord.findMany({
    where: { sessionId },
  });
  const byEnr = new Map(records.map((r) => [r.enrollmentId, r.present]));
  res.json({
    students: enrollments.map((e) => ({
      enrollmentId: e.id,
      name: e.user.name,
      present: byEnr.get(e.id) ?? false,
    })),
  });
});

router.put("/courses/:slug/sessions/:sessionId/attendance", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  const sessionId = pathParam(req.params.sessionId);
  if (!slug || !sessionId) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  const parsed = attendancePutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const session = await prisma.classSession.findFirst({
    where: { id: sessionId, course: { slug, instructorId: req.userId! } },
    select: { id: true },
  });
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const validIds = new Set(
    (
      await prisma.enrollment.findMany({
        where: { course: { slug, instructorId: req.userId! } },
        select: { id: true },
      })
    ).map((e) => e.id),
  );
  for (const m of parsed.data.marks) {
    if (!validIds.has(m.enrollmentId)) {
      res.status(400).json({ error: "Unknown enrollment" });
      return;
    }
  }
  await prisma.$transaction(
    parsed.data.marks.map((m) =>
      prisma.attendanceRecord.upsert({
        where: {
          sessionId_enrollmentId: { sessionId, enrollmentId: m.enrollmentId },
        },
        create: { sessionId, enrollmentId: m.enrollmentId, present: m.present },
        update: { present: m.present },
      }),
    ),
  );
  res.json({ ok: true });
});

router.get("/courses/:slug/fees/:yearMonth", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  const yearMonth = pathParam(req.params.yearMonth);
  if (!slug || !yearMonth || !ymRegex(yearMonth)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true } } },
  });
  const fees = await prisma.enrollmentFeePeriod.findMany({
    where: { yearMonth, enrollmentId: { in: enrollments.map((e) => e.id) } },
  });
  const feeMap = new Map(fees.map((f) => [f.enrollmentId, f.status]));
  res.json({
    yearMonth,
    rows: enrollments.map((e) => ({
      enrollmentId: e.id,
      learnerName: e.user.name,
      status: feeMap.get(e.id) ?? "PENDING",
    })),
  });
});

router.put("/courses/:slug/fees/:yearMonth", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  const yearMonth = pathParam(req.params.yearMonth);
  if (!slug || !yearMonth || !ymRegex(yearMonth)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  const parsed = feesPutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  const validIds = new Set(
    (
      await prisma.enrollment.findMany({
        where: { courseId: course.id },
        select: { id: true },
      })
    ).map((e) => e.id),
  );
  for (const row of parsed.data.rows) {
    if (!validIds.has(row.enrollmentId)) {
      res.status(400).json({ error: "Unknown enrollment" });
      return;
    }
  }
  await prisma.$transaction(
    parsed.data.rows.map((row) =>
      prisma.enrollmentFeePeriod.upsert({
        where: {
          enrollmentId_yearMonth: { enrollmentId: row.enrollmentId, yearMonth },
        },
        create: {
          enrollmentId: row.enrollmentId,
          yearMonth,
          status: row.status,
        },
        update: { status: row.status },
      }),
    ),
  );
  res.json({ ok: true });
});

router.post("/sections", authRequired, async (req: AuthedRequest, res) => {
  const parsed = sectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug: parsed.data.courseSlug, instructorId: req.userId! },
    select: { id: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  const max = await prisma.courseSection.aggregate({
    where: { courseId: course.id },
    _max: { sortOrder: true },
  });
  const section = await prisma.courseSection.create({
    data: {
      courseId: course.id,
      title: parsed.data.title,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  res.status(201).json({ section });
});

router.post("/lessons", authRequired, async (req: AuthedRequest, res) => {
  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const section = await prisma.courseSection.findFirst({
    where: {
      id: parsed.data.sectionId,
      course: { instructorId: req.userId! },
    },
    select: { id: true },
  });
  if (!section) {
    res.status(404).json({ error: "Section not found for this instructor" });
    return;
  }
  const max = await prisma.lesson.aggregate({
    where: { sectionId: section.id },
    _max: { sortOrder: true },
  });
  const lesson = await prisma.lesson.create({
    data: {
      sectionId: section.id,
      title: parsed.data.title,
      durationMin: parsed.data.durationMin,
      preview: Boolean(parsed.data.preview),
      videoUrl: parsed.data.videoUrl ?? null,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  res.status(201).json({ lesson });
});

router.patch("/lessons/:lessonId", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const parsed = lessonPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const lessonIdParam = pathParam(req.params.lessonId);
  if (!lessonIdParam) {
    res.status(400).json({ error: "Invalid lesson id" });
    return;
  }
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonIdParam,
      section: { course: { instructorId: req.userId! } },
    },
    select: { id: true },
  });
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }
  const updated = await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      ...(typeof parsed.data.videoUrl !== "undefined" ? { videoUrl: parsed.data.videoUrl } : {}),
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(typeof parsed.data.durationMin === "number" ? { durationMin: parsed.data.durationMin } : {}),
      ...(typeof parsed.data.preview === "boolean" ? { preview: parsed.data.preview } : {}),
    },
    select: { id: true, videoUrl: true, title: true, durationMin: true, preview: true },
  });
  res.json({ lesson: updated });
});

router.patch("/sections/:sectionId", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const sectionId = pathParam(req.params.sectionId);
  if (!sectionId) {
    res.status(400).json({ error: "Invalid section id" });
    return;
  }
  const parsed = sectionTitleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const section = await prisma.courseSection.findFirst({
    where: { id: sectionId, course: { instructorId: req.userId! } },
    select: { id: true },
  });
  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return;
  }
  await prisma.courseSection.update({
    where: { id: section.id },
    data: { title: parsed.data.title.trim() },
  });
  res.json({ ok: true });
});

router.post("/sections/:sectionId/move", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const sectionId = pathParam(req.params.sectionId);
  if (!sectionId) {
    res.status(400).json({ error: "Invalid section id" });
    return;
  }
  const parsed = moveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const section = await prisma.courseSection.findFirst({
    where: { id: sectionId, course: { instructorId: req.userId! } },
    select: { id: true, courseId: true },
  });
  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return;
  }
  const siblings = await prisma.courseSection.findMany({
    where: { courseId: section.courseId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });
  const idx = siblings.findIndex((s) => s.id === section.id);
  const swapIdx = parsed.data.direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) {
    res.status(400).json({ error: "Cannot move further in this direction" });
    return;
  }
  const a = siblings[idx]!;
  const b = siblings[swapIdx]!;
  await prisma.$transaction([
    prisma.courseSection.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.courseSection.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  res.json({ ok: true });
});

router.delete("/sections/:sectionId", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const sectionId = pathParam(req.params.sectionId);
  if (!sectionId) {
    res.status(400).json({ error: "Invalid section id" });
    return;
  }
  const section = await prisma.courseSection.findFirst({
    where: { id: sectionId, course: { instructorId: req.userId! } },
    select: { id: true },
  });
  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return;
  }
  await prisma.courseSection.delete({ where: { id: section.id } });
  res.json({ ok: true });
});

router.post("/lessons/:lessonId/move", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const lessonId = pathParam(req.params.lessonId);
  if (!lessonId) {
    res.status(400).json({ error: "Invalid lesson id" });
    return;
  }
  const parsed = moveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, section: { course: { instructorId: req.userId! } } },
    select: { id: true, sectionId: true },
  });
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }
  const siblings = await prisma.lesson.findMany({
    where: { sectionId: lesson.sectionId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });
  const idx = siblings.findIndex((l) => l.id === lesson.id);
  const swapIdx = parsed.data.direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) {
    res.status(400).json({ error: "Cannot move further in this direction" });
    return;
  }
  const a = siblings[idx]!;
  const b = siblings[swapIdx]!;
  await prisma.$transaction([
    prisma.lesson.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.lesson.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  res.json({ ok: true });
});

router.delete("/lessons/:lessonId", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const lessonId = pathParam(req.params.lessonId);
  if (!lessonId) {
    res.status(400).json({ error: "Invalid lesson id" });
    return;
  }
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, section: { course: { instructorId: req.userId! } } },
    select: { id: true },
  });
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }
  await prisma.lesson.delete({ where: { id: lesson.id } });
  res.json({ ok: true });
});

/** Demo accrual: ₹500 (50_000 paise) per enrollment — not real revenue. */
const DEMO_EARNING_PAISE_PER_ENROLLMENT = 50_000;

router.post("/courses/:slug/announcements", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const parsed = announcementCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true, title: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  const ann = await prisma.courseAnnouncement.create({
    data: {
      courseId: course.id,
      authorId: req.userId!,
      title: parsed.data.title?.trim() || null,
      body: parsed.data.body.trim(),
      emailed: false,
    },
  });
  let emailMeta: { attempted: boolean; ok?: boolean; skipped?: string; error?: string } = { attempted: false };
  if (parsed.data.emailLearners) {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: course.id },
      include: { user: { select: { email: true } } },
    });
    const bcc = [...new Set(enrollments.map((e) => e.user.email.toLowerCase()))];
    const subjectLine = parsed.data.title?.trim()
      ? `${parsed.data.title.trim()} — ${course.title}`
      : `Update from your instructor — ${course.title}`;
    const bodyText = `${parsed.data.title ? `${parsed.data.title.trim()}\n\n` : ""}${parsed.data.body.trim()}`;
    const sent = await broadcastToLearners({ bcc, subject: subjectLine, text: bodyText });
    emailMeta = { attempted: true, ok: sent.ok, skipped: sent.skipped, error: sent.error };
    if (sent.ok) {
      await prisma.courseAnnouncement.update({ where: { id: ann.id }, data: { emailed: true } });
    }
  }
  res.status(201).json({
    announcement: {
      id: ann.id,
      title: ann.title,
      body: ann.body,
      emailed: emailMeta.ok ? true : ann.emailed,
      createdAt: ann.createdAt.toISOString(),
    },
    email: emailMeta,
  });
});

router.get("/courses/:slug/assignments", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  const rows = await prisma.courseAssignment.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });
  res.json({
    assignments: rows.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueAt: a.dueAt?.toISOString() ?? null,
      submissionCount: a._count.submissions,
      createdAt: a.createdAt.toISOString(),
    })),
  });
});

router.post("/courses/:slug/assignments", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const parsed = assignmentCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug, instructorId: req.userId! },
    select: { id: true },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found for this instructor" });
    return;
  }
  let dueAt: Date | null = null;
  if (parsed.data.dueAt && parsed.data.dueAt.trim()) {
    const d = new Date(parsed.data.dueAt);
    if (Number.isNaN(d.getTime())) {
      res.status(400).json({ error: "Invalid dueAt date" });
      return;
    }
    dueAt = d;
  }
  const created = await prisma.courseAssignment.create({
    data: {
      courseId: course.id,
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      dueAt,
    },
  });
  res.status(201).json({
    assignment: {
      id: created.id,
      title: created.title,
      description: created.description,
      dueAt: created.dueAt?.toISOString() ?? null,
    },
  });
});

router.delete("/assignments/:assignmentId", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const assignmentId = pathParam(req.params.assignmentId);
  if (!assignmentId) {
    res.status(400).json({ error: "Invalid assignment id" });
    return;
  }
  const row = await prisma.courseAssignment.findFirst({
    where: { id: assignmentId, course: { instructorId: req.userId! } },
    select: { id: true },
  });
  if (!row) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }
  await prisma.courseAssignment.delete({ where: { id: row.id } });
  res.json({ ok: true });
});

router.get("/assignments/:assignmentId/submissions", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const assignmentId = pathParam(req.params.assignmentId);
  if (!assignmentId) {
    res.status(400).json({ error: "Invalid assignment id" });
    return;
  }
  const assignment = await prisma.courseAssignment.findFirst({
    where: { id: assignmentId, course: { instructorId: req.userId! } },
    include: {
      course: { select: { slug: true, title: true } },
      submissions: {
        orderBy: { updatedAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }
  res.json({
    assignment: {
      id: assignment.id,
      title: assignment.title,
      course: assignment.course,
    },
    submissions: assignment.submissions.map((s) => ({
      user: s.user,
      content: s.content,
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
});

router.get("/payouts/summary", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const uid = req.userId!;
  const enrollmentCount = await prisma.enrollment.count({
    where: { course: { instructorId: uid } },
  });
  const accruedPaise = enrollmentCount * DEMO_EARNING_PAISE_PER_ENROLLMENT;
  const paidAgg = await prisma.payoutRequest.aggregate({
    where: { instructorId: uid, status: "PAID" },
    _sum: { amountCents: true },
  });
  const paidOutPaise = paidAgg._sum.amountCents ?? 0;
  const pendingAgg = await prisma.payoutRequest.aggregate({
    where: { instructorId: uid, status: { in: ["PENDING", "APPROVED"] } },
    _sum: { amountCents: true },
  });
  const heldPaise = pendingAgg._sum.amountCents ?? 0;
  const availablePaise = Math.max(0, accruedPaise - paidOutPaise - heldPaise);
  const tax = await prisma.instructorTaxProfile.findUnique({ where: { userId: uid } });
  const requests = await prisma.payoutRequest.findMany({
    where: { instructorId: uid },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json({
    demoNote:
      "No Razorpay or in-app payments — this tab is a manual ledger only. Demo “accrued” uses ₹500 per enrollment for the UI. You submit a request; an admin marks it PAID after you’re settled offline (UPI/bank). Not legal, tax, or accounting advice.",
    enrollmentCount,
    accruedDisplay: formatInrFromPaise(accruedPaise),
    paidOutDisplay: formatInrFromPaise(paidOutPaise),
    pendingHoldDisplay: formatInrFromPaise(heldPaise),
    availablePaise,
    availableDisplay: formatInrFromPaise(availablePaise),
    taxProfile: tax
      ? { legalName: tax.legalName, panLast4: tax.panLast4, gstin: tax.gstin }
      : null,
    requests: requests.map((r) => ({
      id: r.id,
      amountDisplay: formatInrFromPaise(r.amountCents),
      amountPaise: r.amountCents,
      status: r.status,
      instructorNote: r.instructorNote,
      adminNote: r.adminNote,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.patch("/payouts/tax-profile", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const parsed = taxProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const row = await prisma.instructorTaxProfile.upsert({
    where: { userId: req.userId! },
    create: {
      userId: req.userId!,
      legalName: parsed.data.legalName?.trim() || null,
      panLast4: parsed.data.panLast4?.trim() || null,
      gstin: parsed.data.gstin?.trim() || null,
    },
    update: {
      legalName: parsed.data.legalName === undefined ? undefined : parsed.data.legalName?.trim() || null,
      panLast4: parsed.data.panLast4 === undefined ? undefined : parsed.data.panLast4?.trim() || null,
      gstin: parsed.data.gstin === undefined ? undefined : parsed.data.gstin?.trim() || null,
    },
  });
  res.json({
    taxProfile: { legalName: row.legalName, panLast4: row.panLast4, gstin: row.gstin },
  });
});

router.post("/payouts/request", authRequired, async (req: AuthedRequest, res) => {
  if (!(await assertInstructor(req))) {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  const parsed = payoutRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const uid = req.userId!;
  const enrollmentCount = await prisma.enrollment.count({
    where: { course: { instructorId: uid } },
  });
  const accruedPaise = enrollmentCount * DEMO_EARNING_PAISE_PER_ENROLLMENT;
  const paidAgg = await prisma.payoutRequest.aggregate({
    where: { instructorId: uid, status: "PAID" },
    _sum: { amountCents: true },
  });
  const paidOutPaise = paidAgg._sum.amountCents ?? 0;
  const pendingAgg = await prisma.payoutRequest.aggregate({
    where: { instructorId: uid, status: { in: ["PENDING", "APPROVED"] } },
    _sum: { amountCents: true },
  });
  const heldPaise = pendingAgg._sum.amountCents ?? 0;
  const availablePaise = Math.max(0, accruedPaise - paidOutPaise - heldPaise);
  const requestPaise = parsed.data.amountInr * 100;
  if (requestPaise > availablePaise) {
    res.status(400).json({ error: "Amount exceeds available demo balance" });
    return;
  }
  if (requestPaise < 100) {
    res.status(400).json({ error: "Minimum request ₹1 (100 paise)" });
    return;
  }
  const created = await prisma.payoutRequest.create({
    data: {
      instructorId: uid,
      amountCents: requestPaise,
      instructorNote: parsed.data.note?.trim() || null,
    },
  });
  res.status(201).json({
    request: {
      id: created.id,
      amountDisplay: formatInrFromPaise(created.amountCents),
      status: created.status,
      createdAt: created.createdAt.toISOString(),
    },
  });
});

export default router;
