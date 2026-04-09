import type { QueryClient } from "@tanstack/react-query";

/** Shared cache policy for class workspace routes (mobile: fewer refetches). */
export const workspaceQueryOptions = {
  staleTime: 90_000,
  gcTime: 15 * 60_000,
} as const;

/** Course list changes rarely while teaching; keep warm across hub ↔ subpages. */
export const studioCoursesQueryOptions = {
  staleTime: 120_000,
  gcTime: 15 * 60_000,
} as const;

export function formatFeeMonthHeading(ym: string): string {
  const [y, m] = ym.split("-");
  if (!y || !m) return ym;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatSessionTimeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export type SessionRow = { id: string; heldAt: string; presentCount: number; totalMarked: number };

export function filterSessionsToday(sessions: SessionRow[] | undefined): SessionRow[] {
  const list = sessions ?? [];
  const today = new Date();
  return list.filter((s) => {
    const d = new Date(s.heldAt);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });
}

export function invalidateClassWorkspaceQueries(queryClient: QueryClient, slug: string) {
  queryClient.invalidateQueries({ queryKey: ["studio-roster", slug] });
  queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
  queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
  queryClient.invalidateQueries({ queryKey: ["studio-analytics"] });
}

export function classHubPath(slug: string): string {
  return `/instructor/class/${encodeURIComponent(slug)}`;
}

/** e.g. "Joined 2 days ago" */
export function joinedAgoLabel(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Recently";
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days <= 0) return "Joined today";
  if (days === 1) return "Joined yesterday";
  if (days < 14) return `Joined ${days} days ago`;
  if (days < 60) return `Joined ${Math.floor(days / 7)} weeks ago`;
  return `Joined ${Math.floor(days / 30)} months ago`;
}
