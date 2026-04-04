/**
 * Optional structured events for analytics pipelines.
 * Off in production unless `FUNNEL_LOG=1` (avoid noisy stdout).
 */
export function funnelLog(event: string, userId?: string | null, meta?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production" && process.env.FUNNEL_LOG !== "1") return;
  console.info(
    JSON.stringify({
      funnel: event,
      userId: userId ?? null,
      meta: meta ?? {},
      t: new Date().toISOString(),
    }),
  );
}
