import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";

const router = Router();

const createOrderSchema = z.object({
  courseSlug: z.string().min(1),
});

router.post("/create-order", authRequired, async (req: AuthedRequest, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const course = await prisma.course.findFirst({
    where: { slug: parsed.data.courseSlug, published: true },
    select: { id: true, slug: true, title: true, priceCents: true },
  });
  if (!course) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  res.json({
    order: {
      provider: "razorpay",
      status: "draft",
      orderId: `order_${randomUUID().replace(/-/g, "").slice(0, 14)}`,
      currency: "INR",
      amountPaise: course.priceCents,
      courseSlug: course.slug,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    },
    note: "Payment is scaffolded. Add Razorpay server-side signature verification before production use.",
  });
});

export default router;
