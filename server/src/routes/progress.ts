import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import { pathParam } from "../lib/httpParams.js";

const router = Router();

const completeSchema = z.object({
  lessonId: z.string().min(1),
});

router.get("/:courseSlug", authRequired, async (req: AuthedRequest, res) => {
  const courseSlug = pathParam(req.params.courseSlug);
  if (!courseSlug) {
    res.status(400).json({ error: "Invalid course slug" });
    return;
  }
  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, published: true },
    select: {
      id: true,
      sections: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          sortOrder: true,
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true, durationMin: true, preview: true, sortOrder: true },
          },
        },
      },
    },
  });
  if (!course) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  const completed = await prisma.lessonProgress.findMany({
    where: {
      userId: req.userId!,
      lesson: { section: { courseId: course.id } },
    },
    select: { lessonId: true, completedAt: true },
  });

  const completedSet = new Set(completed.map((r) => r.lessonId));
  const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const completedLessons = completedSet.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  res.json({
    progress: {
      totalLessons,
      completedLessons,
      progressPercent,
      completedLessonIds: [...completedSet],
      sections: course.sections,
    },
  });
});

router.post("/complete", authRequired, async (req: AuthedRequest, res) => {
  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: parsed.data.lessonId },
    select: { id: true, section: { select: { courseId: true } } },
  });
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const enrolled = await prisma.enrollment.findFirst({
    where: { userId: req.userId!, courseId: lesson.section.courseId },
  });
  if (!enrolled) {
    res.status(403).json({ error: "Enroll in this class to track progress" });
    return;
  }

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: req.userId!, lessonId: lesson.id } },
    update: { completedAt: new Date() },
    create: { userId: req.userId!, lessonId: lesson.id },
  });

  res.json({ ok: true, lessonId: lesson.id });
});

export default router;
