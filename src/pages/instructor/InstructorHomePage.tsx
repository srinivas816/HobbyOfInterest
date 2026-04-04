import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardToday = {
  sessionsToday: number;
  pendingAttendanceCount: number;
  pendingFeesCount: number;
  feeMonth: string;
  totalStudentEnrollments?: number;
  scheduleToday?: Array<{
    sessionId: string;
    courseSlug: string;
    courseTitle: string;
    heldAt: string;
    label: string | null;
    studentCount: number;
  }>;
};

function greetingForHour(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const InstructorHomePage = () => {
  const { user, token } = useAuth();
  const hour = new Date().getHours();
  const greet = greetingForHour(hour);

  const dash = useQuery({
    queryKey: ["instructor-dashboard-today"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/dashboard-today");
      return parseJson<DashboardToday>(res);
    },
    staleTime: 30_000,
  });

  const coursesQ = useQuery({
    queryKey: ["studio-courses"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/courses");
      return parseJson<{ courses: Array<{ slug: string; title: string }> }>(res);
    },
  });

  const firstSlug = coursesQ.data?.courses[0]?.slug;
  const primaryClass = dash.data?.scheduleToday?.[0]?.courseSlug ?? firstSlug;
  const pendingAtt = dash.data?.pendingAttendanceCount ?? 0;
  const pendingFees = dash.data?.pendingFeesCount ?? 0;
  const hasUrgency = pendingAtt > 0 || pendingFees > 0;
  const courseCount = coursesQ.data?.courses.length ?? 0;
  const totalLearners = dash.data?.totalStudentEnrollments ?? 0;
  const hasClass = courseCount > 0;
  const hasStudents = totalLearners > 0;
  const showSetupRail = !hasClass || !hasStudents;

  return (
    <div className="container mx-auto max-w-lg px-4 pt-6 pb-4 animate-in fade-in duration-300">
      <p className="font-heading text-2xl text-foreground">
        {greet}
        {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
      </p>

      {dash.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
        </div>
      ) : dash.isError ? (
        <p className="text-sm text-muted-foreground mt-6 font-body">Couldn’t load today’s snapshot.</p>
      ) : (
        <>
          {showSetupRail ? (
            <section className="mt-5 rounded-2xl border border-border/80 bg-card px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground font-body">Get started</p>
              <ol className="mt-3 space-y-2 text-sm font-body">
                <li className="flex items-center gap-2">
                  <span className={cn("font-semibold", hasClass ? "text-emerald-600" : "text-foreground")}>
                    {hasClass ? "✓" : "1."} Create your first class
                  </span>
                  {!hasClass ? (
                    <Button size="sm" className="rounded-full h-8 text-xs ml-auto" asChild>
                      <Link to="/instructor/studio?setup=1#studio-create-class">Create</Link>
                    </Button>
                  ) : null}
                </li>
                <li className="flex items-center gap-2 flex-wrap">
                  <span className={cn("font-semibold", hasStudents ? "text-emerald-600" : "text-foreground")}>
                    {hasStudents ? "✓" : "2."} Add students
                  </span>
                  {hasClass && !hasStudents && firstSlug ? (
                    <Button size="sm" variant="secondary" className="rounded-full h-8 text-xs ml-auto" asChild>
                      <Link to={`/instructor/class/${encodeURIComponent(firstSlug)}?tab=students`}>Add</Link>
                    </Button>
                  ) : null}
                </li>
                <li className="text-muted-foreground text-xs pt-1">
                  {hasStudents ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">✓ 3. After class → mark attendance</span>
                  ) : (
                    <>3. After class → mark attendance</>
                  )}
                </li>
              </ol>
            </section>
          ) : null}

          {hasUrgency ? (
            <section
              className={cn(
                "mt-5 rounded-2xl border-2 p-4 shadow-sm",
                "border-destructive/35 bg-gradient-to-b from-destructive/10 to-card",
              )}
            >
              <h2 className="font-heading text-sm text-foreground">You need to</h2>
              <ul className="mt-2 space-y-1.5 text-sm font-body text-foreground">
                {pendingAtt > 0 ? (
                  <li>
                    <span className="font-semibold">Mark attendance</span> · {pendingAtt} open
                  </li>
                ) : null}
                {pendingFees > 0 ? (
                  <li>
                    <span className="font-semibold">Fees</span> · {pendingFees} pending
                  </li>
                ) : null}
              </ul>
              <div className="mt-3 flex flex-col gap-2">
                {primaryClass ? (
                  <>
                    {pendingAtt > 0 ? (
                      <Button className="rounded-full h-12 text-base w-full font-semibold" asChild>
                        <Link to={`/instructor/class/${encodeURIComponent(primaryClass)}?tab=attendance`}>Mark attendance</Link>
                      </Button>
                    ) : null}
                    {pendingFees > 0 ? (
                      <Button variant="secondary" className="rounded-full h-12 text-base w-full font-semibold" asChild>
                        <Link to={`/instructor/class/${encodeURIComponent(primaryClass)}?tab=fees`}>
                          <MessageCircle className="mr-2 h-5 w-5 inline" aria-hidden />
                          Remind students
                        </Link>
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <Button className="rounded-full h-12 text-base w-full" asChild>
                    <Link to="/instructor/classes">Open a class</Link>
                  </Button>
                )}
              </div>
            </section>
          ) : (
            <section className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-2.5">
              <p className="text-sm font-body text-foreground">
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">Caught up</span> · nothing urgent today
              </p>
            </section>
          )}

          <section className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Today</h2>
            <div className="mt-2 space-y-3">
              {(dash.data?.scheduleToday?.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card/60 p-4 text-center">
                  <p className="text-sm text-muted-foreground font-body">No sessions today.</p>
                  <Button className="mt-3 rounded-full w-full h-11 text-sm" variant="secondary" asChild>
                    <Link to="/instructor/classes">Classes</Link>
                  </Button>
                </div>
              ) : (
                dash.data!.scheduleToday!.map((s) => (
                  <Link
                    key={s.sessionId}
                    to={`/instructor/class/${encodeURIComponent(s.courseSlug)}?tab=attendance`}
                    className="block rounded-2xl border border-border/60 bg-card p-4 active:scale-[0.99] transition-all duration-150 hover:border-accent/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums text-accent">
                          {new Date(s.heldAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </p>
                        <p className="font-heading text-lg text-foreground mt-0.5 truncate">{s.courseTitle}</p>
                        <p className="text-sm text-muted-foreground font-body mt-1">
                          {s.studentCount} student{s.studentCount === 1 ? "" : "s"}
                          {s.label ? ` · ${s.label}` : null}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" aria-hidden />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default InstructorHomePage;
