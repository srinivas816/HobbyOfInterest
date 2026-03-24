import type { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "./auth.js";

const DEFAULT_ADMIN_EMAILS = ["admin@demo.com"];

export async function adminRequired(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const me = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { email: true },
  });
  if (!me) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const allowed = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(me.email.toLowerCase())) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
