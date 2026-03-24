import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import { adminRequired } from "../middleware/admin.js";
import { pathParam } from "../lib/httpParams.js";
import { formatInrFromPaise } from "../lib/inr.js";

const router = Router();

const moderateSchema = z.object({
  hidden: z.boolean().optional(),
  reported: z.boolean().optional(),
});

const payoutPatchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"]),
  adminNote: z.string().max(500).optional().nullable(),
});

router.get("/reviews", authRequired, adminRequired, async (_req: AuthedRequest, res) => {
  const reviews = await prisma.review.findMany({
    where: { OR: [{ reported: true }, { hidden: true }] },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { slug: true, title: true } },
    },
    take: 200,
  });
  res.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reported: r.reported,
      hidden: r.hidden,
      createdAt: r.createdAt,
      user: r.user,
      course: r.course,
    })),
  });
});

router.patch("/reviews/:id", authRequired, adminRequired, async (req: AuthedRequest, res) => {
  const parsed = moderateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const id = pathParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const review = await prisma.review.update({
    where: { id },
    data: {
      ...(typeof parsed.data.hidden === "boolean" ? { hidden: parsed.data.hidden } : {}),
      ...(typeof parsed.data.reported === "boolean" ? { reported: parsed.data.reported } : {}),
    },
  });
  res.json({ review });
});

router.get("/payout-requests", authRequired, adminRequired, async (_req: AuthedRequest, res) => {
  const rows = await prisma.payoutRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { instructor: { select: { id: true, name: true, email: true } } },
  });
  res.json({
    payoutRequests: rows.map((r) => ({
      id: r.id,
      amountDisplay: formatInrFromPaise(r.amountCents),
      amountPaise: r.amountCents,
      status: r.status,
      instructorNote: r.instructorNote,
      adminNote: r.adminNote,
      createdAt: r.createdAt.toISOString(),
      instructor: r.instructor,
    })),
  });
});

router.patch("/payout-requests/:id", authRequired, adminRequired, async (req: AuthedRequest, res) => {
  const parsed = payoutPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const id = pathParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const updated = await prisma.payoutRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(typeof parsed.data.adminNote !== "undefined" ? { adminNote: parsed.data.adminNote?.trim() || null } : {}),
    },
    include: { instructor: { select: { id: true, name: true, email: true } } },
  });
  res.json({
    payoutRequest: {
      id: updated.id,
      status: updated.status,
      adminNote: updated.adminNote,
      instructor: updated.instructor,
    },
  });
});

export default router;
