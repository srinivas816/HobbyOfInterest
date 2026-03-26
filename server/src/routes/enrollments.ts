import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { formatInrFromPaise } from "../lib/inr.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import { pathParam } from "../lib/httpParams.js";
import { assertInstructorCanAddLearnerTx } from "../lib/instructorEnrollmentCap.js";
import { funnelLog } from "../lib/funnel.js";

const router = Router();

const enrollSchema = z.object({
  courseSlug: z.string().min(1),
});

const joinInviteSchema = z.object({
  inviteCode: z.string().min(4).max(20),
});

router.post("/join-invite", authRequired, async (req: AuthedRequest, res) => {
  const parsed = joinInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const code = parsed.data.inviteCode.trim().toUpperCase();
  const course = await prisma.course.findFirst({
    where: { inviteCode: code },
  });
  if (!course) {
    funnelLog("join_failed", req.userId, { reason: "invalid_invite" });
    res.status(404).json({ error: "Invalid invite code" });
    return;
  }

  funnelLog("join_attempt", req.userId, { courseSlug: course.slug });

  let outcome: { type: "idempotent" | "forbidden" | "created"; courseSlug: string; detail?: string };
  try {
    outcome = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT id FROM "User" WHERE id = ${course.instructorId} FOR UPDATE`,
      );

      const alreadyIn = await tx.enrollment.findFirst({
        where: { userId: req.userId!, courseId: course.id },
      });
      if (alreadyIn) {
        return { type: "idempotent" as const, courseSlug: course.slug };
      }

      const gate = await assertInstructorCanAddLearnerTx(tx, course.instructorId, req.userId!);
      if (!gate.ok) {
        return { type: "forbidden" as const, courseSlug: course.slug, detail: gate.message };
      }

      await tx.enrollment.create({
        data: {
          userId: req.userId!,
          courseId: course.id,
        },
      });
      await tx.course.update({
        where: { id: course.id },
        data: { studentCount: { increment: 1 } },
      });
      return { type: "created" as const, courseSlug: course.slug };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      funnelLog("join_failed", req.userId, { reason: "race_duplicate", courseSlug: course.slug });
      res.status(409).json({
        error: "You're already in this class.",
        courseSlug: course.slug,
      });
      return;
    }
    funnelLog("join_failed", req.userId, { reason: "transaction_error", courseSlug: course.slug });
    console.error("join-invite transaction:", e);
    res.status(500).json({ error: "Could not complete join. Try again.", courseSlug: course.slug });
    return;
  }

  if (outcome.type === "idempotent") {
    funnelLog("join_success", req.userId, { courseSlug: outcome.courseSlug, idempotent: true });
    res.status(200).json({ ok: true, courseSlug: outcome.courseSlug });
    return;
  }
  if (outcome.type === "forbidden") {
    funnelLog("join_failed", req.userId, { reason: "cap_or_plan", courseSlug: outcome.courseSlug });
    res.status(403).json({
      error: "This class is full.",
      detail: outcome.detail,
      courseSlug: outcome.courseSlug,
    });
    return;
  }

  const rosterSize = await prisma.enrollment.count({ where: { courseId: course.id } });
  funnelLog(rosterSize <= 1 ? "first_student_joined" : "student_joined", course.instructorId, {
    courseSlug: course.slug,
    learnerId: req.userId,
    rosterSize,
  });
  funnelLog("join_success", req.userId, { courseSlug: outcome.courseSlug, rosterSize });

  res.status(201).json({ ok: true, courseSlug: outcome.courseSlug });
});

router.post("/", authRequired, async (req: AuthedRequest, res) => {
  const parsed = enrollSchema.safeParse(req.body);
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

  let pubOutcome: { type: "dup" | "forbid" | "ok"; slug: string; msg?: string };
  try {
    pubOutcome = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT id FROM "User" WHERE id = ${course.instructorId} FOR UPDATE`,
      );

      const alreadyIn = await tx.enrollment.findFirst({
        where: { userId: req.userId!, courseId: course.id },
      });
      if (alreadyIn) return { type: "dup" as const, slug: course.slug };

      const gate = await assertInstructorCanAddLearnerTx(tx, course.instructorId, req.userId!);
      if (!gate.ok) return { type: "forbid" as const, slug: course.slug, msg: gate.message };

      await tx.enrollment.create({
        data: {
          userId: req.userId!,
          courseId: course.id,
        },
      });
      await tx.course.update({
        where: { id: course.id },
        data: { studentCount: { increment: 1 } },
      });
      return { type: "ok" as const, slug: course.slug };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      res.status(409).json({ error: "Already enrolled in this class", courseSlug: course.slug });
      return;
    }
    console.error("POST /enrollments transaction:", e);
    res.status(500).json({ error: "Could not enroll. Try again.", courseSlug: course.slug });
    return;
  }

  if (pubOutcome.type === "dup") {
    res.status(409).json({ error: "Already enrolled in this class", courseSlug: pubOutcome.slug });
    return;
  }
  if (pubOutcome.type === "forbid") {
    res.status(403).json({
      error: "This class is full.",
      detail: pubOutcome.msg,
      courseSlug: pubOutcome.slug,
    });
    return;
  }

  res.status(201).json({ ok: true, courseSlug: pubOutcome.slug });
});

router.get("/", authRequired, async (req: AuthedRequest, res) => {
  const rows = await prisma.enrollment.findMany({
    where: { userId: req.userId! },
    include: {
      course: {
        include: {
          instructor: { select: { name: true } },
          sections: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const courseIds = rows.map((r) => r.course.id);
  const progressRows =
    courseIds.length === 0
      ? []
      : await prisma.lessonProgress.findMany({
          where: {
            userId: req.userId!,
            lesson: { section: { courseId: { in: courseIds } } },
          },
          select: { lessonId: true, lesson: { select: { section: { select: { courseId: true } } } } },
        });

  const completedByCourse = new Map<string, Set<string>>();
  for (const p of progressRows) {
    const cid = p.lesson.section.courseId;
    if (!completedByCourse.has(cid)) completedByCourse.set(cid, new Set());
    completedByCourse.get(cid)!.add(p.lessonId);
  }

  res.json({
    enrollments: rows.map((e) => {
      const cid = e.course.id;
      const flatLessons: { id: string; title: string }[] = [];
      for (const sec of e.course.sections) {
        for (const l of sec.lessons) flatLessons.push({ id: l.id, title: l.title });
      }
      const completed = completedByCourse.get(cid) ?? new Set<string>();
      const completedLessons = flatLessons.filter((l) => completed.has(l.id)).length;
      const totalLessons = flatLessons.length;
      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const next = flatLessons.find((l) => !completed.has(l.id));
      return {
        id: e.id,
        enrolledAt: e.createdAt,
        course: {
          slug: e.course.slug,
          title: e.course.title,
          imageKey: e.course.imageKey,
          coverImageUrl: e.course.coverImageUrl,
          durationLabel: e.course.durationLabel,
          priceCents: e.course.priceCents,
          priceDisplay: formatInrFromPaise(e.course.priceCents),
          instructorName: e.course.instructor.name,
          totalLessons,
          completedLessons,
          progressPercent,
          nextLesson: next ? { id: next.id, title: next.title } : null,
        },
      };
    }),
  });
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
  const deleted = await prisma.enrollment.deleteMany({
    where: { userId: req.userId!, courseId: course.id },
  });
  if (deleted.count === 0) {
    res.status(404).json({ error: "Not enrolled" });
    return;
  }
  await prisma.course.update({
    where: { id: course.id },
    data: { studentCount: { decrement: 1 } },
  });
  res.json({ ok: true });
});

export default router;
