import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { formatInrFromPaise } from "../lib/inr.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import { pathParam } from "../lib/httpParams.js";

const router = Router();

const enrollSchema = z.object({
  courseSlug: z.string().min(1),
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
  try {
    await prisma.enrollment.create({
      data: {
        userId: req.userId!,
        courseId: course.id,
      },
    });
  } catch {
    res.status(409).json({ error: "Already enrolled in this class" });
    return;
  }

  await prisma.course.update({
    where: { id: course.id },
    data: { studentCount: { increment: 1 } },
  });

  res.status(201).json({ ok: true, courseSlug: course.slug });
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
