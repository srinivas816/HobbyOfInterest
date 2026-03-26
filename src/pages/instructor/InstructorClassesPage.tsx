import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, Plus } from "lucide-react";
import { apiFetch, parseJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
type DashboardToday = {
  feeMonth: string;
  scheduleToday: Array<{
    courseSlug: string;
    heldAt: string;
  }>;
  classInsights: Array<{ courseSlug: string; totalStudents: number; pendingFeesCount: number }>;
};

function formatTodayTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const InstructorClassesPage = () => {
  const q = useQuery({
    queryKey: ["studio-courses"],
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/courses");
      return parseJson<{
        courses: Array<{ id: string; slug: string; title: string; published: boolean }>;
      }>(res);
    },
  });

  const dash = useQuery({
    queryKey: ["instructor-dashboard-today"],
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/dashboard-today");
      return parseJson<DashboardToday>(res);
    },
    staleTime: 30_000,
  });

  const insightBySlug = useMemo(() => {
    const m = new Map<string, { totalStudents: number; pendingFeesCount: number }>();
    for (const row of dash.data?.classInsights ?? []) {
      m.set(row.courseSlug, { totalStudents: row.totalStudents, pendingFeesCount: row.pendingFeesCount });
    }
    return m;
  }, [dash.data?.classInsights]);

  const todaySessionBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of dash.data?.scheduleToday ?? []) {
      if (!m.has(s.courseSlug)) m.set(s.courseSlug, s.heldAt);
    }
    return m;
  }, [dash.data?.scheduleToday]);

  const courses = q.data?.courses ?? [];

  return (
    <div className="container mx-auto max-w-lg px-4 pt-6 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Your classes</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Glance fees and today’s time before you open a class.</p>
        </div>
      </div>

      <Button className="mt-6 rounded-full h-12 w-full text-base gap-2" asChild>
        <Link to="/instructor/studio?setup=1#studio-create-class">
          <Plus className="h-5 w-5" aria-hidden />
          Create new class
        </Link>
      </Button>

      {q.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground font-body">No classes yet. Create one to get your invite link.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {courses.map((c) => {
            const ins = insightBySlug.get(c.slug);
            const total = ins?.totalStudents;
            const pendingFees = ins?.pendingFeesCount ?? 0;
            const heldAt = todaySessionBySlug.get(c.slug);
            const countLabel = typeof total === "number" ? `${total} student${total === 1 ? "" : "s"}` : "— students";
            return (
              <li key={c.id}>
                <Link
                  to={`/instructor/class/${encodeURIComponent(c.slug)}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 active:scale-[0.99] transition-transform"
                >
                  <div className="min-w-0">
                    <p className="font-heading text-base text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1 leading-relaxed">
                      <span>{countLabel}</span>
                      {pendingFees > 0 ? (
                        <>
                          <span className="text-amber-700 font-semibold"> · {pendingFees} pending fees</span>
                        </>
                      ) : null}
                      {heldAt ? (
                        <>
                          <span className="text-foreground font-medium"> · Today {formatTodayTime(heldAt)}</span>
                        </>
                      ) : null}
                      <span>
                        {" · "}
                        {c.published ? "Published" : "Draft"}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default InstructorClassesPage;
