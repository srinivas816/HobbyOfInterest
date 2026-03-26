import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import { funnelLog } from "../lib/funnel.js";
import { razorpayConfigured, razorpayCreateOrder, verifyRazorpayPaymentSignature } from "../lib/razorpay.js";
import { trialBypassAllowed } from "../lib/checkoutTrial.js";

const router = Router();

/** ₹299/month in paise */
const INSTRUCTOR_PRO_PAIS = 29_900;

const createOrderSchema = z.object({
  courseSlug: z.string().min(1),
});

const confirmInstructorProSchema = z
  .object({
    razorpayPaymentId: z.string().max(120).optional(),
    razorpayOrderId: z.string().max(120).optional(),
    razorpaySignature: z.string().max(500).optional(),
    /** Dev / staging only: CHECKOUT_DEV_BYPASS=1 + non-production. Requires trialIntent. */
    devBypass: z.boolean().optional(),
    /** Required when devBypass is true: captures pricing intent before trial Pro. */
    trialIntent: z.enum(["would_pay", "not_now"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.devBypass === true && !data.trialIntent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "trialIntent is required for trial activation (would_pay or not_now).",
        path: ["trialIntent"],
      });
    }
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

router.post("/instructor-pro/create-order", authRequired, async (req: AuthedRequest, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { role: true, planTier: true },
  });
  if (!me || me.role !== "INSTRUCTOR") {
    res.status(403).json({ error: "Instructors only" });
    return;
  }
  if (me.planTier !== "EXPLORER") {
    res.status(400).json({ error: "Already on a paid instructor plan" });
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "rzp_test_placeholder";

  if (razorpayConfigured()) {
    try {
      const receipt = `ip${req.userId!.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}${Date.now().toString(36)}`.slice(0, 40);
      const created = await razorpayCreateOrder(INSTRUCTOR_PRO_PAIS, receipt, {
        userId: req.userId!,
        plan: "INSTRUCTOR_PRO",
      });
      res.json({
        order: {
          provider: "razorpay",
          orderMode: "live" as const,
          orderId: created.id,
          currency: created.currency,
          amountPaise: created.amount,
          keyId: process.env.RAZORPAY_KEY_ID!.trim(),
          plan: "INSTRUCTOR_PRO",
        },
        note: "Complete payment in Checkout, then POST /confirm with payment_id, order_id, and signature.",
      });
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Razorpay order failed";
      res.status(502).json({ error: msg });
      return;
    }
  }

  res.json({
    order: {
      provider: "razorpay",
      orderMode: "stub" as const,
      status: "draft",
      orderId: `inspro_${randomUUID().replace(/-/g, "").slice(0, 14)}`,
      currency: "INR",
      amountPaise: INSTRUCTOR_PRO_PAIS,
      keyId,
      plan: "INSTRUCTOR_PRO",
    },
    note:
      "Razorpay keys not set — this order id is local-only. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET for real payments. Dev: CHECKOUT_DEV_BYPASS=1 + confirm devBypass for demos.",
  });
});

/** Funnel: instructor opened trial upgrade flow — does not grant Pro. */
router.post("/instructor-pro/upgrade-requested", authRequired, async (req: AuthedRequest, res) => {
  if (!trialBypassAllowed()) {
    res.status(403).json({ error: "Trial activation is not enabled on this server." });
    return;
  }
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { role: true, planTier: true },
  });
  if (!me || me.role !== "INSTRUCTOR") {
    res.status(403).json({ error: "Instructors only" });
    return;
  }
  if (me.planTier !== "EXPLORER") {
    res.json({ ok: true, skipped: true });
    return;
  }
  funnelLog("instructor_pro_upgrade_requested", req.userId!, {});
  res.json({ ok: true });
});

router.post("/instructor-pro/confirm", authRequired, async (req: AuthedRequest, res) => {
  const parsed = confirmInstructorProSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { role: true, planTier: true },
  });
  if (!me || me.role !== "INSTRUCTOR") {
    res.status(403).json({ error: "Instructors only" });
    return;
  }
  if (me.planTier !== "EXPLORER") {
    res.json({ ok: true, planTier: me.planTier, already: true });
    return;
  }

  const devOk = trialBypassAllowed() && parsed.data.devBypass === true;

  if (devOk) {
    const intent = parsed.data.trialIntent!;
    funnelLog("instructor_pro_trial_intent", req.userId!, { wouldPay: intent === "would_pay" });
    if (intent === "not_now") {
      res.json({ ok: true, upgraded: false });
      return;
    }
    const updated = await prisma.user.update({
      where: { id: req.userId! },
      data: { planTier: "INSTRUCTOR_PRO" },
      select: { id: true, planTier: true },
    });
    funnelLog("instructor_pro_upgraded", req.userId!, { devBypass: true, trialActivation: true });
    res.json({ ok: true, planTier: updated.planTier, upgraded: true });
    return;
  }

  const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = parsed.data;
  if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    res.status(400).json({
      error:
        "Missing payment proof. Complete Razorpay Checkout and send razorpayPaymentId, razorpayOrderId, and razorpaySignature.",
    });
    return;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    res.status(503).json({
      error: "Razorpay is not configured on the server (RAZORPAY_KEY_SECRET).",
    });
    return;
  }

  const valid = verifyRazorpayPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, secret);
  if (!valid) {
    res.status(400).json({ error: "Invalid payment signature. Do not grant Pro without a verified payment." });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: { planTier: "INSTRUCTOR_PRO" },
    select: { id: true, planTier: true },
  });
  funnelLog("instructor_pro_upgraded", req.userId!, {
    razorpayOrderId,
    paymentIdSuffix: razorpayPaymentId.slice(-6),
  });
  res.json({ ok: true, planTier: updated.planTier });
});

export default router;
