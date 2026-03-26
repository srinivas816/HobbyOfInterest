import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, ChevronRight, Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardToday = {
  sessionsToday: number;
  pendingAttendanceCount: number;
  pendingFeesCount: number;
  feeMonth: string;
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

  return (
    <div className="container mx-auto max-w-lg px-4 pt-6 pb-4 animate-in fade-in duration-300">
      <p className="font-heading text-2xl text-foreground">
        {greet}
        {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
      </p>
      <p className="text-sm text-muted-foreground font-body mt-1">Your day at a glance.</p>

      {dash.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
        </div>
      ) : dash.isError ? (
        <p className="text-sm text-muted-foreground mt-6 font-body">Couldn’t load today’s snapshot.</p>
      ) : (
        <>
          {/* You need to — urgency first */}
          {hasUrgency ? (
            <section
              className={cn(
                "mt-6 rounded-2xl border-2 p-4 sm:p-5 shadow-sm",
                "border-destructive/40 bg-gradient-to-b from-destructive/10 to-card",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-destructive/15 p-2 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base text-foreground">You need to</h2>
                  <ul className="mt-2 space-y-2 text-sm font-body text-foreground">
                    {pendingAtt > 0 ? (
                      <li className="flex gap-2">
                        <span className="text-destructive font-bold shrink-0">·</span>
                        <span>
                          <span className="font-semibold">Mark attendance</span> — {pendingAtt} slot{pendingAtt === 1 ? "" : "s"} still open for
                          today.
                        </span>
                      </li>
                    ) : null}
                    {pendingFees > 0 ? (
                      <li className="flex gap-2">
                        <span className="text-destructive font-bold shrink-0">·</span>
                        <span>
                          <span className="font-semibold">Collect fees</span> — {pendingFees} student{pendingFees === 1 ? "" : "s"} pending (
                          {dash.data?.feeMonth}).
                        </span>
                      </li>
                    ) : null}
                  </ul>
                  <div className="mt-4 flex flex-col gap-2">
                    {primaryClass ? (
                      <>
                        {pendingAtt > 0 ? (
                          <Button className="rounded-full h-12 text-base w-full font-semibold shadow-sm" asChild>
                            <Link to={`/instructor/class/${encodeURIComponent(primaryClass)}?tab=attendance`}>Mark attendance</Link>
                          </Button>
                        ) : null}
                        {pendingFees > 0 ? (
                          <Button
                            variant="secondary"
                            className="rounded-full h-12 text-base w-full font-semibold border-emerald-600/30 bg-emerald-600/10 text-emerald-950 hover:bg-emerald-600/20 dark:text-emerald-50"
                            asChild
                          >
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
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-6 rounded-2xl border border-emerald-500/35 bg-emerald-500/8 px-4 py-3">
              <p className="text-sm font-body text-foreground">
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">You’re caught up</span> for today — no open attendance
                slots or fee alerts on your dashboard.
              </p>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Today</h2>
            <p className="text-[11px] text-muted-foreground font-body mt-1">Sessions on your calendar</p>
            <div className="mt-3 space-y-3">
              {(dash.data?.scheduleToday?.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card/60 p-5 text-center">
                  <p className="text-sm text-muted-foreground font-body">No sessions scheduled for today.</p>
                  <Button className="mt-4 rounded-full w-full h-12 text-base" variant="secondary" asChild>
                    <Link to="/instructor/classes">View your classes</Link>
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

          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Quick actions</h2>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {primaryClass ? (
                <>
                  <Button variant="outline" className="rounded-full h-12 text-base justify-start px-5" asChild>
                    <Link to={`/instructor/class/${encodeURIComponent(primaryClass)}?tab=attendance`}>
                      <CalendarClock className="mr-3 h-5 w-5 text-accent shrink-0" aria-hidden />
                      Attendance for this class
                    </Link>
                  </Button>
                  <Button variant="outline" className="rounded-full h-12 text-base justify-start px-5" asChild>
                    <Link to={`/instructor/class/${encodeURIComponent(primaryClass)}?tab=fees`}>
                      <MessageCircle className="mr-3 h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
                      Fees &amp; WhatsApp
                    </Link>
                  </Button>
                </>
              ) : (
                <Button className="rounded-full h-12 text-base" asChild>
                  <Link to="/instructor/classes">Create or open a class</Link>
                </Button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default InstructorHomePage;
