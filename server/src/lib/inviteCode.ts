import { randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";

const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPH[bytes[i]! % ALPH.length]!;
  return out;
}

export async function assignInviteCodeIfMissing(prisma: PrismaClient, courseId: string): Promise<string> {
  const row = await prisma.course.findUnique({ where: { id: courseId }, select: { inviteCode: true } });
  if (row?.inviteCode) return row.inviteCode;
  for (let attempt = 0; attempt < 40; attempt++) {
    const code = generateInviteCode();
    try {
      await prisma.course.update({ where: { id: courseId }, data: { inviteCode: code } });
      return code;
    } catch {
      /* unique collision on inviteCode */
    }
  }
  throw new Error("Could not allocate invite code");
}
