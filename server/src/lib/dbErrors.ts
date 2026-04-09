/** Prisma / DB errors where retrying later or fixing `DATABASE_URL` may help. */
export function isDbUnavailableError(err: unknown): boolean {
  if (err === null || typeof err !== "object") return false;
  const e = err as { code?: string; name?: string; message?: string };
  if (e.name === "PrismaClientInitializationError") return true;
  if (e.code === "P1001" || e.code === "P1000" || e.code === "P1017") return true;
  const msg = typeof e.message === "string" ? e.message : "";
  if (/Can't reach database server/i.test(msg)) return true;
  if (/server has closed the connection/i.test(msg)) return true;
  return false;
}
