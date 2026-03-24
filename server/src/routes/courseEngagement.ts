import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import { pathParam } from "../lib/httpParams.js";

const router = Router();

async function engagementAccess(slug: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: { slug },
    select: { id: true, title: true, instructorId: true, published: true },
  });
  if (!course) return null;
  if (!course.published && course.instructorId !== userId) return null;
  const isInstructor = course.instructorId === userId;
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId: course.id },
    select: { id: true },
  });
  if (!isInstructor && !enrollment) return null;
  return { course, isInstructor, enrolled: Boolean(enrollment) };
}

router.get("/:slug/announcements", authRequired, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const ctx = await engagementAccess(slug, req.userId!);
  if (!ctx) {
    res.status(404).json({ error: "Class not found or access denied" });
    return;
  }
  const rows = await prisma.courseAnnouncement.findMany({
    where: { courseId: ctx.course.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: { select: { id: true, name: true } } },
  });
  res.json({
    announcements: rows.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      emailed: a.emailed,
      createdAt: a.createdAt.toISOString(),
      author: a.author,
    })),
  });
});

router.get("/:slug/questions", authRequired, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const ctx = await engagementAccess(slug, req.userId!);
  if (!ctx) {
    res.status(404).json({ error: "Class not found or access denied" });
    return;
  }
  const rows = await prisma.courseQuestion.findMany({
    where: { courseId: ctx.course.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true } },
      answeredBy: { select: { id: true, name: true } },
    },
  });
  res.json({
    questions: rows.map((q) => ({
      id: q.id,
      body: q.body,
      createdAt: q.createdAt.toISOString(),
      author: q.user,
      answer: q.answer,
      answeredAt: q.answeredAt?.toISOString() ?? null,
      answeredBy: q.answeredBy ? { id: q.answeredBy.id, name: q.answeredBy.name } : null,
    })),
    isInstructor: ctx.isInstructor,
  });
});

const askSchema = z.object({
  body: z.string().trim().min(10).max(4000),
});

router.post("/:slug/questions", authRequired, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const ctx = await engagementAccess(slug, req.userId!);
  if (!ctx || !ctx.enrolled) {
    res.status(403).json({ error: "Enroll in this class to ask a question" });
    return;
  }
  const q = await prisma.courseQuestion.create({
    data: {
      courseId: ctx.course.id,
      userId: req.userId!,
      body: parsed.data.body,
    },
    include: { user: { select: { id: true, name: true } } },
  });
  res.status(201).json({
    question: {
      id: q.id,
      body: q.body,
      createdAt: q.createdAt.toISOString(),
      author: q.user,
      answer: null,
      answeredAt: null,
      answeredBy: null,
    },
  });
});

const answerSchema = z.object({
  answer: z.string().trim().min(3).max(8000),
});

router.patch("/:slug/questions/:questionId", authRequired, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  const questionId = pathParam(req.params.questionId);
  if (!slug || !questionId) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const ctx = await engagementAccess(slug, req.userId!);
  if (!ctx || !ctx.isInstructor) {
    res.status(403).json({ error: "Instructor only" });
    return;
  }
  const existing = await prisma.courseQuestion.findFirst({
    where: { id: questionId, courseId: ctx.course.id },
  });
  if (!existing) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  const updated = await prisma.courseQuestion.update({
    where: { id: existing.id },
    data: {
      answer: parsed.data.answer,
      answeredAt: new Date(),
      answeredByUserId: req.userId!,
    },
    include: {
      user: { select: { id: true, name: true } },
      answeredBy: { select: { id: true, name: true } },
    },
  });
  res.json({
    question: {
      id: updated.id,
      body: updated.body,
      createdAt: updated.createdAt.toISOString(),
      author: updated.user,
      answer: updated.answer,
      answeredAt: updated.answeredAt?.toISOString() ?? null,
      answeredBy: updated.answeredBy ? { id: updated.answeredBy.id, name: updated.answeredBy.name } : null,
    },
  });
});

router.get("/:slug/assignments", authRequired, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  if (!slug) {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const ctx = await engagementAccess(slug, req.userId!);
  if (!ctx) {
    res.status(404).json({ error: "Class not found or access denied" });
    return;
  }
  const rows = await prisma.courseAssignment.findMany({
    where: { courseId: ctx.course.id },
    orderBy: { createdAt: "desc" },
    include: {
      submissions: {
        where: { userId: req.userId! },
        take: 1,
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  res.json({
    assignments: rows.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueAt: a.dueAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      mySubmission: a.submissions[0]
        ? { content: a.submissions[0].content, updatedAt: a.submissions[0].updatedAt.toISOString() }
        : null,
    })),
    isInstructor: ctx.isInstructor,
  });
});

const submitSchema = z.object({
  content: z.string().trim().min(20).max(12000),
});

router.post("/:slug/assignments/:assignmentId/submit", authRequired, async (req: AuthedRequest, res) => {
  const slug = pathParam(req.params.slug);
  const assignmentId = pathParam(req.params.assignmentId);
  if (!slug || !assignmentId) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const ctx = await engagementAccess(slug, req.userId!);
  if (!ctx || !ctx.enrolled) {
    res.status(403).json({ error: "Enroll to submit assignments" });
    return;
  }
  const assignment = await prisma.courseAssignment.findFirst({
    where: { id: assignmentId, courseId: ctx.course.id },
  });
  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }
  const sub = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_userId: { assignmentId, userId: req.userId! } },
    create: {
      assignmentId,
      userId: req.userId!,
      content: parsed.data.content,
    },
    update: { content: parsed.data.content },
  });
  res.json({
    submission: {
      content: sub.content,
      updatedAt: sub.updatedAt.toISOString(),
    },
  });
});

export default router;
