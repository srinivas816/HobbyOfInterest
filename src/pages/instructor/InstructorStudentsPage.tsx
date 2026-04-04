import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, Plus, Users } from "lucide-react";
import { apiFetch, parseJson } from "@/lib/api";
import { Button } from "@/components/ui/button";

type DashboardToday = {
  classInsights: Array<{ courseSlug: string; totalStudents: number; pendingFeesCount: number }>;
};

/** One tap per class → roster tab in that class workspace. */
const InstructorStudentsPage = () => {
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

  const courses = q.data?.courses ?? [];

  return (
    <div className="container mx-auto max-w-lg px-4 pt-6 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Pick a class — roster, fees, and invites are there.</p>
        </div>
        <div className="rounded-xl bg-accent/10 p-2.5 shrink-0" aria-hidden>
          <Users className="h-6 w-6 text-accent" />
        </div>
      </div>

      <Button className="mt-6 rounded-full h-12 w-full text-base gap-2" variant="outline" asChild>
        <Link to="/instructor/studio?setup=1#studio-create-class">
          <Plus className="h-5 w-5" aria-hidden />
          New class
        </Link>
      </Button>

      {q.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground font-body">No classes yet. Create one, then come back here.</p>
          <Button className="rounded-full h-12 w-full text-base font-semibold" asChild>
            <Link to="/instructor/classes">Go to classes</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {courses.map((c) => {
            const ins = insightBySlug.get(c.slug);
            const n = ins?.totalStudents ?? 0;
            const pending = ins?.pendingFeesCount ?? 0;
            const sub =
              n === 0
                ? "No students yet — open to invite"
                : pending > 0
                  ? `${n} enrolled · ${pending} fee${pending === 1 ? "" : "s"} pending`
                  : `${n} enrolled`;

            return (
              <li key={c.id}>
                <Link
                  to={`/instructor/class/${c.slug}?tab=students`}
                  className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 active:scale-[0.99] transition-transform"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground font-body truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{sub}</p>
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

export default InstructorStudentsPage;
