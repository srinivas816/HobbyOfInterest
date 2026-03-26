import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

function capEnforced(): boolean {
  const v = process.env.INSTRUCTOR_ENFORCE_CAP;
  return v === "1" || v === "true";
}

function trialDays(): number {
  const n = Number(process.env.INSTRUCTOR_FREE_TRIAL_DAYS ?? 7);
  return Number.isFinite(n) && n > 0 ? n : 7;
}

function freeLearnerCap(): number {
  const n = Number(process.env.INSTRUCTOR_FREE_LEARNER_CAP ?? 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

export function isWithinTrial(createdAt: Date): boolean {
  const ms = trialDays() * 24 * 60 * 60 * 1000;
  return Date.now() - createdAt.getTime() < ms;
}

/**
 * Blocks **new** learners (first enrollment with this instructor) when free tier cap is hit.
 * Same learner joining a second class from the same instructor is always allowed.
 */
export async function assertInstructorCanAddLearner(
  instructorId: string,
  learnerUserId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!capEnforced()) return { ok: true };

  const instructor = await prisma.user.findUnique({
    where: { id: instructorId },
    select: { role: true, planTier: true, createdAt: true },
  });
  if (!instructor || instructor.role !== "INSTRUCTOR") return { ok: true };

  if (instructor.planTier !== "EXPLORER") return { ok: true };
  if (isWithinTrial(instructor.createdAt)) return { ok: true };

  const already = await prisma.enrollment.findFirst({
    where: { userId: learnerUserId, course: { instructorId } },
  });
  if (already) return { ok: true };

  const grouped = await prisma.enrollment.groupBy({
    by: ["userId"],
    where: { course: { instructorId } },
  });
  const cap = freeLearnerCap();
  if (grouped.length >= cap) {
    return {
      ok: false,
      message: `This class can’t accept new students right now — the instructor’s free plan is full (${cap} students). Ask them to upgrade or remove old enrollments.`,
    };
  }
  return { ok: true };
}

/**
 * Same rules as {@link assertInstructorCanAddLearner}, but uses a transaction client so it runs
 * after `SELECT … FOR UPDATE` on the instructor row (see join-invite enrollment flow).
 */
export async function assertInstructorCanAddLearnerTx(
  tx: Prisma.TransactionClient,
  instructorId: string,
  learnerUserId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!capEnforced()) return { ok: true };

  const instructor = await tx.user.findUnique({
    where: { id: instructorId },
    select: { role: true, planTier: true, createdAt: true },
  });
  if (!instructor || instructor.role !== "INSTRUCTOR") return { ok: true };

  if (instructor.planTier !== "EXPLORER") return { ok: true };
  if (isWithinTrial(instructor.createdAt)) return { ok: true };

  const already = await tx.enrollment.findFirst({
    where: { userId: learnerUserId, course: { instructorId } },
  });
  if (already) return { ok: true };

  const grouped = await tx.enrollment.groupBy({
    by: ["userId"],
    where: { course: { instructorId } },
  });
  const cap = freeLearnerCap();
  if (grouped.length >= cap) {
    return {
      ok: false,
      message: `This class can’t accept new students right now — the instructor’s free plan is full (${cap} students). Ask them to upgrade or remove old enrollments.`,
    };
  }
  return { ok: true };
}

export async function getInstructorSubscriptionSummary(instructorId: string) {
  const instructor = await prisma.user.findUnique({
    where: { id: instructorId },
    select: { planTier: true, createdAt: true },
  });
  if (!instructor) return null;

  const grouped = await prisma.enrollment.groupBy({
    by: ["userId"],
    where: { course: { instructorId } },
  });
  const distinctLearnerCount = grouped.length;
  const cap = freeLearnerCap();
  const trial = isWithinTrial(instructor.createdAt);
  const trialEndsAt = new Date(instructor.createdAt.getTime() + trialDays() * 24 * 60 * 60 * 1000);
  const paid = instructor.planTier !== "EXPLORER";

  return {
    planTier: instructor.planTier,
    trialActive: trial && !paid,
    trialEndsAt: trial && !paid ? trialEndsAt.toISOString() : null,
    trialDays: trialDays(),
    distinctLearnerCount,
    freeLearnerCap: cap,
    capEnforced: capEnforced(),
    capReached: !paid && !trial && distinctLearnerCount >= cap,
    paid,
  };
}
