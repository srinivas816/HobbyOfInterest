import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many subscription attempts. Try again later." },
});

const schema = z.object({
  email: z.string().email(),
});

router.post("/", subscribeLimiter, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  try {
    await prisma.newsletterSubscriber.create({ data: { email } });
  } catch {
    /* duplicate email — still success for UX */
  }
  res.status(201).json({ ok: true });
});

export default router;
