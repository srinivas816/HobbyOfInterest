/** Structured funnel logs — ship to your analytics provider from log drain. */
export function funnelLog(event: string, userId?: string | null, meta?: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      funnel: event,
      userId: userId ?? null,
      meta: meta ?? {},
      t: new Date().toISOString(),
    }),
  );
}
