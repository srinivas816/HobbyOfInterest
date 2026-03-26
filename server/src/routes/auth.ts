import { randomBytes } from "crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { funnelLog } from "../lib/funnel.js";
import { shouldExposeDemoOtp } from "../lib/demoOtp.js";
import { normalizePhone } from "../lib/phone.js";
import { signToken, authRequired, type AuthedRequest } from "../middleware/auth.js";
import type { PlanTier, Role } from "@prisma/client";

const router = Router();

export function publicUser(u: {
  id: string;
  email: string;
  name: string;
  role: Role;
  planTier: PlanTier;
  specialty: string | null;
  phone?: string | null;
  onboardingCompletedAt?: Date | null;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    planTier: u.planTier,
    specialty: u.specialty,
    phone: u.phone ?? null,
    onboardingCompletedAt: u.onboardingCompletedAt ? u.onboardingCompletedAt.toISOString() : null,
  };
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
  role: z.enum(["LEARNER", "INSTRUCTOR"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password, name, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: (role as Role | undefined) ?? "LEARNER",
      planTier: "EXPLORER",
      onboardingCompletedAt: null,
      ...(role === "INSTRUCTOR"
        ? {
            specialty: "New instructor",
            instructorStudents: 0,
            instructorClasses: 0,
          }
        : {}),
    },
  });
  const token = signToken(user.id);
  funnelLog("signup_email", user.id, { role: user.role });
  res.status(201).json({
    token,
    user: publicUser(user),
    meta: { isNewUser: true },
  });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = signToken(user.id);
  res.json({ token, user: publicUser(user), meta: { isNewUser: false } });
});

router.get("/me", authRequired, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: publicUser(user) });
});

const otpRequestSchema = z.object({
  phone: z.string().min(1).max(48),
});

const otpVerifySchema = z.object({
  phone: z.string().min(1).max(48),
  code: z.string().regex(/^\d{6}$/),
  name: z.string().min(2).max(120).optional(),
  /** Applied only when creating a new account; ignored for existing users. */
  role: z.enum(["LEARNER", "INSTRUCTOR"]).optional(),
});

/** Request SMS OTP. When SMS is not configured (or demo mode), `demoOtp` is returned for on-screen entry. */
router.post("/otp/request", async (req, res) => {
  const parsed = otpRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const normalized = normalizePhone(parsed.data.phone);
  if (!normalized) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }
  await prisma.otpChallenge.deleteMany({ where: { phone: normalized } });
  await prisma.otpChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const codeHash = await bcrypt.hash(code, 9);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.otpChallenge.create({
    data: { phone: normalized, codeHash, expiresAt },
  });
  if (shouldExposeDemoOtp()) {
    console.info(`[otp] ${normalized} → ${code} (demo OTP on screen)`);
  }
  const expose = shouldExposeDemoOtp();
  res.json({
    ok: true,
    ...(expose
      ? {
          demoOtp: code,
          demoOtpHint: "No SMS — type this code below. Turn off with DEMO_OTP_ON_SCREEN=0 or set SMS_API_KEY for real delivery.",
        }
      : {}),
  });
});

/** Verify OTP. Creates a learner account if the phone is new (provide `name`). */
router.post("/otp/verify", async (req, res) => {
  const parsed = otpVerifySchema.safeParse(req.body);
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
    where: { phone: normalized, linkUserId: null },
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
  await prisma.otpChallenge.deleteMany({ where: { phone: normalized } });

  let user = await prisma.user.findFirst({ where: { phone: normalized } });
  let isNewUser = false;
  if (!user) {
    const name = parsed.data.name?.trim();
    if (!name) {
      res.status(400).json({ error: "Name required for new accounts" });
      return;
    }
    const rnd = randomBytes(14).toString("hex");
    const email = `p_${rnd}@phone.hoi`;
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
    const newRole = (parsed.data.role ?? "LEARNER") as Role;
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        phone: normalized,
        name,
        role: newRole,
        planTier: "EXPLORER",
        onboardingCompletedAt: null,
        ...(newRole === "INSTRUCTOR"
          ? {
              specialty: "New instructor",
              instructorStudents: 0,
              instructorClasses: 0,
            }
          : {}),
      },
    });
    funnelLog("signup_otp", user.id, { role: newRole });
  }

  const token = signToken(user.id);
  res.json({ token, user: publicUser(user), meta: { isNewUser } });
});

export default router;
