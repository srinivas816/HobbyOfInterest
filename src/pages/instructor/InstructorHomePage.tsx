import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import { Button } from "@/components/ui/button";

type DashboardToday = {
  pendingFeesCount: number;
  totalStudentEnrollments?: number;
  coursesBrief?: Array<{ slug: string; title: string }>;
  scheduleToday?: Array<{
    sessionId: string;
    courseSlug: string;
    courseTitle: string;
    heldAt: string;
    label: string | null;
    studentCount: number;
  }>;
  classInsights?: Array<{ courseSlug: string; totalStudents: number; pendingFeesCount: number }>;
};

type PrimaryCase = "class_today" | "fees" | "no_students" | "all_clear";

function greetingForHour(h: number): string {
  if (h < 12) return "Good morning 👋";
  if (h < 17) return "Good afternoon 👋";
  return "Good evening 👋";
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function resolvePrimaryCase(
  schedule: NonNullable<DashboardToday["scheduleToday"]>,
  pendingFeesCount: number,
  totalStudentEnrollments: number,
  courseCount: number,
): PrimaryCase {
  if (schedule.length > 0) return "class_today";
  if (pendingFeesCount > 0) return "fees";
  if (courseCount > 0 && totalStudentEnrollments === 0) return "no_students";
  return "all_clear";
}

const secondaryLinkClass =
  "block w-full text-center text-sm font-semibold text-accent pt-2.5 hover:underline active:opacity-70";

const InstructorHomePage = () => {
  const { user, token } = useAuth();
  const greet = greetingForHour(new Date().getHours());
  const firstName = user?.name?.split(" ")[0];

  const dash = useQuery({
    queryKey: ["instructor-dashboard-today"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/dashboard-today");
      return parseJson<DashboardToday>(res);
    },
    staleTime: 30_000,
  });

  const schedule = dash.data?.scheduleToday ?? [];
  const insights = dash.data?.classInsights ?? [];
  const coursesBrief = dash.data?.coursesBrief ?? [];
  const courseCount = coursesBrief.length;
  const firstCourseSlug = coursesBrief[0]?.slug;
  const pendingFeesCount = dash.data?.pendingFeesCount ?? 0;
  const totalStudentEnrollments = dash.data?.totalStudentEnrollments ?? 0;

  const primaryCase = dash.data
    ? resolvePrimaryCase(schedule, pendingFeesCount, totalStudentEnrollments, courseCount)
    : null;

  const firstSession = schedule[0];
  const feesSlug =
    insights.find((c) => c.pendingFeesCount > 0)?.courseSlug ?? firstCourseSlug ?? firstSession?.courseSlug;
  const inviteSlug = firstCourseSlug;

  const summaryLine = (() => {
    if (!dash.data || !primaryCase) return null;
    if (primaryCase === "class_today" && schedule.length > 1) {
      return `You have ${schedule.length} classes today`;
    }
    if (primaryCase === "all_clear" && schedule.length === 0) {
      return "No classes today";
    }
    return null;
  })();

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-4">
      <p className="font-heading text-xl text-foreground leading-tight">
        {greet}
        {firstName ? `, ${firstName}` : ""}
      </p>

      {dash.isLoading ? (
        <div className="flex items-center gap-2 mt-4 text-muted-foreground text-sm font-body">
          <Loader2 className="h-4 w-4 animate-spin shrink-0 text-accent" aria-hidden />
          Loading…
        </div>
      ) : dash.isError ? (
        <p className="text-sm text-muted-foreground mt-4 font-body">Couldn&apos;t load today.</p>
      ) : (
        <>
          {summaryLine ? (
            <p className="mt-2 text-sm text-muted-foreground font-body">{summaryLine}</p>
          ) : null}

          <section className="mt-4 rounded-2xl border border-border bg-card px-4 py-4" aria-live="polite">
            {primaryCase === "class_today" && firstSession ? (
              <>
                <h2 className="font-heading text-base font-semibold text-foreground">Mark attendance for today</h2>
                <p className="mt-1 text-sm text-muted-foreground font-body">
                  {firstSession.courseTitle} · {formatTime(firstSession.heldAt)}
                </p>
                <Button className="mt-3 w-full rounded-xl h-11 text-sm font-semibold" asChild>
                  <Link to={`/instructor/class/${encodeURIComponent(firstSession.courseSlug)}/attendance`}>
                    Mark attendance
                  </Link>
                </Button>
                <Link
                  to={`/instructor/class/${encodeURIComponent(firstSession.courseSlug)}`}
                  className={secondaryLinkClass}
                >
                  View class
                </Link>
              </>
            ) : null}

            {primaryCase === "fees" && feesSlug ? (
              <>
                <h2 className="font-heading text-base font-semibold text-foreground">
                  {pendingFeesCount} student{pendingFeesCount === 1 ? "" : "s"} haven&apos;t paid
                </h2>
                <Button className="mt-3 w-full rounded-xl h-11 text-sm font-semibold" asChild>
                  <Link to={`/instructor/class/${encodeURIComponent(feesSlug)}/fees#fee-remind`}>Remind now</Link>
                </Button>
                <Link to={`/instructor/class/${encodeURIComponent(feesSlug)}/fees`} className={secondaryLinkClass}>
                  Open fees
                </Link>
              </>
            ) : null}

            {primaryCase === "fees" && !feesSlug ? (
              <p className="text-sm text-muted-foreground font-body">
                <Link to="/instructor/classes" className="text-accent font-semibold hover:underline">
                  Open Classes
                </Link>{" "}
                and pick a class.
              </p>
            ) : null}

            {primaryCase === "no_students" && inviteSlug ? (
              <>
                <h2 className="font-heading text-base font-semibold text-foreground">Add your first students</h2>
                <Button className="mt-3 w-full rounded-xl h-11 text-sm font-semibold" asChild>
                  <Link to={`/instructor/class/${encodeURIComponent(inviteSlug)}/students`}>Share invite</Link>
                </Button>
                <Link
                  to={`/instructor/class/${encodeURIComponent(inviteSlug)}/students`}
                  className={secondaryLinkClass}
                >
                  Add manually
                </Link>
              </>
            ) : null}

            {primaryCase === "no_students" && !inviteSlug ? (
              <>
                <h2 className="font-heading text-base font-semibold text-foreground">Add your first students</h2>
                <Button className="mt-3 w-full rounded-xl h-11 text-sm font-semibold" asChild>
                  <Link to="/instructor/activate">Create new class</Link>
                </Button>
              </>
            ) : null}

            {primaryCase === "all_clear" ? (
              <>
                <h2 className="font-heading text-base font-semibold text-foreground">You&apos;re all set today</h2>
                <Link to="/instructor/classes" className={`${secondaryLinkClass} mt-3 pt-0`}>
                  View your classes
                </Link>
              </>
            ) : null}
          </section>

          {schedule.length > 1 ? (
            <ul className="mt-3 space-y-1 text-sm font-body" aria-label="Today's classes">
              {schedule.map((s) => (
                <li key={s.sessionId}>
                  <Link
                    to={`/instructor/class/${encodeURIComponent(s.courseSlug)}`}
                    className="block py-1 text-foreground hover:text-accent active:opacity-70"
                  >
                    <span className="font-medium">{s.courseTitle}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {formatTime(s.heldAt)} · {s.studentCount} student{s.studentCount === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <nav className="mt-4 text-xs text-muted-foreground font-body" aria-label="Quick actions">
            <Link to="/instructor/activate" className="text-accent font-semibold hover:underline">
              Create new class
            </Link>
            <span className="mx-2 text-border">·</span>
            <Link to="/instructor/classes" className="text-accent font-semibold hover:underline">
              View all classes
            </Link>
          </nav>
        </>
      )}
    </div>
  );
};

export default InstructorHomePage;
