import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
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
  onboardingCompletedAt?: Date | null;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    planTier: u.planTier,
    specialty: u.specialty,
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
  res.status(201).json({
    token,
    user: publicUser(user),
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
  res.json({ token, user: publicUser(user) });
});

router.get("/me", authRequired, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: publicUser(user) });
});

export default router;
