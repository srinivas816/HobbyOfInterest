import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CalendarClock, GraduationCap, Megaphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import { Button } from "@/components/ui/button";

type EnrollmentRow = {
  id: string;
  course: {
    slug: string;
    title: string;
    progressPercent: number;
    nextLesson: { id: string; title: string } | null;
  };
};

type SubscriptionSummary = {
  paid: boolean;
  trialActive: boolean;
  trialDays: number;
  planTier: string;
  distinctLearnerCount: number;
  freeLearnerCap: number;
  capReached: boolean;
  monthlyPriceDisplay: string;
  upgradeNote: string;
  capEnforced: boolean;
  checkoutLive?: boolean;
};

const PLAN_UPGRADE = "/settings#instructor-plan";

/**
 * Logged-in home: money + daily retention before any marketplace scroll (see DiscoverHomePage).
 */
const DiscoverLoggedInHome = () => {
  const { user, token, ready } = useAuth();
  if (!ready || !token || !user) return null;

  if (user.role === "INSTRUCTOR") {
    return <InstructorLoggedInPanel />;
  }

  return <LearnerLoggedInPanel />;
};

type DashboardToday = {
  sessionsToday: number;
  pendingAttendanceCount: number;
  totalStudentEnrollments: number;
  pendingFeesCount?: number;
  feeMonth?: string;
  scheduleToday?: Array<{
    sessionId: string;
    courseSlug: string;
    courseTitle: string;
    heldAt: string;
    label: string | null;
    studentCount: number;
  }>;
};

function InstructorLoggedInPanel() {
  const { token } = useAuth();
  const sub = useQuery({
    queryKey: ["instructor-subscription-summary"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/subscription-summary");
      return parseJson<SubscriptionSummary>(res);
    },
  });

  const dash = useQuery({
    queryKey: ["instructor-dashboard-today"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/dashboard-today");
      return parseJson<DashboardToday>(res);
    },
  });

  const cap = sub.data?.freeLearnerCap ?? 10;
  const nearFreeCap =
    sub.data &&
    !sub.data.paid &&
    !sub.data.trialActive &&
    !sub.data.capReached &&
    sub.data.distinctLearnerCount >= sub.data.freeLearnerCap - 2;

  const firstSlug = dash.data?.scheduleToday?.[0]?.courseSlug;
  const ROSTER = firstSlug
    ? `/instructor/class/${encodeURIComponent(firstSlug)}/attendance`
    : "/instructor/classes";
  const ANNOUNCE = firstSlug
    ? `/instructor/class/${encodeURIComponent(firstSlug)}/announce`
    : "/instructor/classes";

  const feesHref = firstSlug
    ? `/instructor/class/${encodeURIComponent(firstSlug)}/fees`
    : "/instructor/classes";

  return (
    <section className="border-b border-border/40 bg-gradient-to-b from-accent/10 to-background">
      <div className="container mx-auto px-4 py-4 space-y-4">
        {sub.isPending ? <div className="h-10 rounded-lg bg-muted/50 animate-pulse" aria-hidden /> : null}
        {!sub.isPending && sub.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-3 py-2">
            <p className="text-sm text-muted-foreground font-body">Plan</p>
            <Button size="sm" className="rounded-full" asChild>
              <Link to={PLAN_UPGRADE}>Open</Link>
            </Button>
          </div>
        ) : null}
        {sub.data && !sub.data.paid && sub.data.capReached ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2">
            <p className="text-sm font-medium text-foreground font-body">Student limit reached</p>
            <Button size="sm" className="rounded-full shrink-0" asChild>
              <Link to={PLAN_UPGRADE}>Upgrade</Link>
            </Button>
          </div>
        ) : null}
        {nearFreeCap && sub.data ? (
          <p className="text-xs text-amber-900 dark:text-amber-100 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 font-body">
            Near limit ({sub.data.distinctLearnerCount}/{cap}).{" "}
            <Link to={PLAN_UPGRADE} className="font-semibold underline">
              Plan
            </Link>
          </p>
        ) : null}
        {sub.data?.paid ? (
          <p className="text-xs text-muted-foreground font-body">
            Paid plan ·{" "}
            <Link to={PLAN_UPGRADE} className="underline font-medium text-foreground">
              Details
            </Link>
          </p>
        ) : null}

        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-base text-foreground">Today</h2>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Instructor</span>
          </div>

          {dash.data && (dash.data.scheduleToday?.length ?? 0) > 0 ? (
            <ul className="mt-2 space-y-2 rounded-xl border border-border/50 bg-card/80 p-3">
              {(dash.data.scheduleToday ?? []).map((s) => (
                <li key={s.sessionId} className="flex justify-between gap-2 text-sm font-body">
                  <span className="text-foreground">
                    <span className="font-semibold tabular-nums">
                      {new Date(s.heldAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </span>
                    <span className="text-muted-foreground"> · </span>
                    {s.courseTitle}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{s.studentCount}</span>
                </li>
              ))}
            </ul>
          ) : !dash.isPending ? (
            <p className="mt-2 text-sm text-muted-foreground font-body">No sessions today.</p>
          ) : null}

          {dash.data && (dash.data.pendingFeesCount ?? 0) > 0 ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
              <p className="text-sm font-body text-foreground">
                <span className="font-semibold">{dash.data.pendingFeesCount}</span> fee{(dash.data.pendingFeesCount ?? 0) === 1 ? "" : "s"} pending
              </p>
              <Button size="sm" variant="secondary" className="rounded-full h-8 text-xs" asChild>
                <Link to={feesHref}>Fees</Link>
              </Button>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button className="rounded-full h-9 text-sm" size="sm" asChild>
              <Link to={ROSTER}>
                <CalendarClock className="mr-1.5 h-4 w-4" aria-hidden />
                Attendance
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full h-9 text-sm" size="sm" asChild>
              <Link to={ANNOUNCE}>
                <Megaphone className="mr-1.5 h-4 w-4" aria-hidden />
                Announce
              </Link>
            </Button>
            <Button variant="secondary" className="rounded-full h-9 text-sm" size="sm" asChild>
              <Link to="/instructor/home">Teaching home</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LearnerLoggedInPanel() {
  const { token, user } = useAuth();
  const enrollmentsQ = useQuery({
    queryKey: ["enrollments"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/api/enrollments");
      return parseJson<{ enrollments: EnrollmentRow[] }>(res);
    },
  });

  const list = enrollmentsQ.data?.enrollments ?? [];
  const first = list[0];

  return (
    <section className="border-b border-border/40 bg-gradient-to-b from-primary/10 via-card/40 to-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-sm text-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-xs font-medium">
              <GraduationCap size={14} className="text-primary" aria-hidden />
              Hi, {user?.name?.split(" ")[0] ?? "there"}
            </span>
          </p>
          <Button variant="outline" size="sm" className="rounded-full shrink-0" asChild>
            <Link to="/learn">
              My classes
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        {first ? (
          <>
            <Link
              to={`/learn/${first.course.slug}/classroom`}
              className="flex items-start gap-3 rounded-2xl border-2 border-accent/35 bg-accent/10 px-4 py-4 sm:py-5 hover:border-accent/50 transition-colors"
            >
              <div className="rounded-xl bg-background/80 p-2 shadow-sm shrink-0">
                <Megaphone className="text-accent" size={22} aria-hidden />
              </div>
              <div className="min-w-0 text-left flex-1">
                <p className="font-body text-[11px] uppercase tracking-wider text-accent font-semibold">Announcements &amp; updates</p>
                <p className="font-heading text-base text-foreground mt-1">Check what your tutor posted</p>
                <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
                  Open Classroom for today&apos;s note, fee reminders, and Q&amp;A — that&apos;s why you come back daily.
                </p>
              </div>
              <ArrowRight className="text-muted-foreground shrink-0 mt-1" size={18} aria-hidden />
            </Link>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-6">
              <p className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Today&apos;s class</p>
              <p className="font-heading text-lg sm:text-xl text-foreground mt-1 line-clamp-2">{first.course.title}</p>
              <p className="font-body text-xs text-muted-foreground mt-2 leading-relaxed">
                Progress {first.course.progressPercent}% — view lessons or jump straight to Classroom.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="rounded-full" size="sm" asChild>
                  <Link to={`/learn/${first.course.slug}`}>View class &amp; lessons</Link>
                </Button>
                <Button variant="secondary" className="rounded-full" size="sm" asChild>
                  <Link to={`/learn/${first.course.slug}/classroom`}>Open classroom</Link>
                </Button>
                {first.course.nextLesson ? (
                  <Button variant="outline" className="rounded-full" size="sm" asChild>
                    <Link to={`/learn/${first.course.slug}/lesson/${first.course.nextLesson.id}`}>Continue lesson</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
            <p className="font-body text-sm text-muted-foreground">You&apos;re not enrolled in a class yet.</p>
            <p className="font-body text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
              Open the invite link or code your tutor sent (WhatsApp, SMS). Or discover a public class below.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
              <Button className="rounded-full" asChild>
                <Link to="/courses">Browse classes</Link>
              </Button>
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/learn">Open My classes</Link>
              </Button>
            </div>
          </div>
        )}

        {list.length > 1 ? (
          <div>
            <p className="font-body text-xs font-medium text-muted-foreground mb-2">Other classes</p>
            <div
              className="flex gap-2 overflow-x-auto pb-2 touch-pan-x overscroll-x-contain [scrollbar-width:thin]"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {list.slice(1, 8).map((e) => (
                <Link
                  key={e.id}
                  to={`/learn/${e.course.slug}/classroom`}
                  className="shrink-0 rounded-xl border border-border/50 bg-background px-3 py-2 min-w-[140px] hover:border-accent/40 transition-colors"
                >
                  <p className="font-body text-xs font-medium text-foreground line-clamp-2">{e.course.title}</p>
                  <p className="font-body text-[10px] text-muted-foreground mt-1">{e.course.progressPercent}% done</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="pt-2 border-t border-border/40">
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Discover more</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" className="rounded-full" asChild>
              <Link to="/courses">
                <BookOpen className="mr-1.5 h-4 w-4" aria-hidden />
                Explore classes
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" asChild>
              <Link to="/settings">Profile & interests</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DiscoverLoggedInHome;
