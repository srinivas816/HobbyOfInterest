import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  GraduationCap,
  IndianRupee,
  LayoutDashboard,
  Link2,
  Megaphone,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const ROSTER = "/instructor/studio?tool=roster#studio-teaching-tools";
const ANNOUNCE = "/instructor/studio?tool=announce#studio-teaching-tools";
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
  const price = sub.data?.monthlyPriceDisplay ?? "₹299/month";
  const nearFreeCap =
    sub.data &&
    !sub.data.paid &&
    !sub.data.trialActive &&
    !sub.data.capReached &&
    sub.data.distinctLearnerCount >= sub.data.freeLearnerCap - 2;

  return (
    <section className="border-b border-border/40 bg-gradient-to-b from-accent/14 via-card/50 to-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Money loop — top */}
        <div
          className={cn(
            "rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 shadow-sm",
            sub.data && !sub.data.paid && sub.data.capReached
              ? "border-destructive/50 bg-destructive/10"
              : "border-accent/40 bg-card/90 backdrop-blur-sm",
          )}
        >
          {sub.isPending ? (
            <div className="h-16 rounded-xl bg-muted/50 animate-pulse" aria-hidden />
          ) : sub.isError ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-accent">Your plan</p>
                <p className="font-heading text-base sm:text-lg text-foreground mt-1">Free plan: up to 10 students</p>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  Upgrade to Pro {price} for more roster room. Open account settings to review options.
                </p>
              </div>
              <Button className="rounded-full shrink-0" asChild>
                <Link to={PLAN_UPGRADE}>Upgrade</Link>
              </Button>
            </div>
          ) : sub.data?.paid ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="font-body text-sm text-foreground">
                <span className="font-semibold">Paid plan active</span> —{" "}
                {sub.data.planTier.replace(/_/g, " ")}. Keep inviting; limits follow your tier.
              </p>
              <Button variant="outline" size="sm" className="rounded-full shrink-0" asChild>
                <Link to={PLAN_UPGRADE}>Plan details</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">Monetization</p>
                <p className="font-heading text-lg sm:text-xl text-foreground leading-snug">
                  {!sub.data.trialActive && sub.data.capReached
                    ? `Free limit reached (${cap} students)`
                    : `Free plan: up to ${cap} students`}
                  {sub.data.trialActive ? (
                    <span className="font-body text-sm font-normal text-muted-foreground block mt-1">
                      Trial: unlimited for ~{sub.data.trialDays} days from signup, then this cap applies.
                    </span>
                  ) : null}
                </p>
                <p className="font-body text-sm text-muted-foreground">
                  {!sub.data.trialActive && sub.data.capReached ? (
                    <>
                      <span className="text-foreground font-semibold">Free limit reached.</span> Upgrade to Pro{" "}
                      <span className="text-foreground font-medium">{price}</span> to add more students — required to grow past {cap}.
                    </>
                  ) : (
                    <>
                      Upgrade to Pro <span className="text-foreground font-medium">{price}</span> before you hit the wall.
                    </>
                  )}
                </p>
                {nearFreeCap ? (
                  <p className="mt-2 rounded-xl border border-amber-500/45 bg-amber-500/10 px-3 py-2 text-sm font-body text-foreground">
                    You’ve added{" "}
                    <span className="font-semibold">
                      {sub.data.distinctLearnerCount}/{sub.data.freeLearnerCap}
                    </span>{" "}
                    students — upgrade to continue growing your class.
                  </p>
                ) : null}
                <p className="font-body text-xs text-muted-foreground mt-1">{sub.data.upgradeNote}</p>
                {!sub.data.capEnforced ? (
                  <p className="font-body text-[11px] text-muted-foreground mt-1">
                    Server cap enforcement is off — still show learners a professional upgrade path.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <Button className="rounded-full h-11 px-6" asChild>
                  <Link to={PLAN_UPGRADE}>
                    {!sub.data.trialActive && sub.data.capReached ? "Upgrade ₹299" : "Upgrade"}
                  </Link>
                </Button>
                <p className="font-body text-xs text-center sm:text-left text-muted-foreground sm:max-w-[10rem]">
                  {sub.data.distinctLearnerCount}/{cap} students on roster
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Daily habit — before discovery */}
        <div>
          <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
            <div>
              <h2 className="font-heading text-lg sm:text-xl text-foreground">Today</h2>
              <p className="font-body text-xs text-muted-foreground mt-0.5 max-w-xl">
                {dash.isPending ? (
                  "Loading today’s snapshot…"
                ) : dash.isError ? (
                  "Mark attendance and post a quick update — students check Classroom daily."
                ) : dash.data ? (
                  <>
                    <span className="text-foreground font-medium">
                      {dash.data.sessionsToday} {dash.data.sessionsToday === 1 ? "session" : "sessions"} today
                    </span>
                    {" · "}
                    <span className="text-foreground font-medium">
                      {dash.data.pendingAttendanceCount}{" "}
                      {dash.data.pendingAttendanceCount === 1 ? "student" : "students"} need attendance marked
                    </span>
                    {" · "}
                    <span className="text-foreground font-medium">
                      {dash.data.pendingFeesCount} fee{dash.data.pendingFeesCount === 1 ? "" : "s"} pending (
                      {dash.data.feeMonth})
                    </span>
                    .
                  </>
                ) : (
                  "Mark attendance and post a quick update — students check Classroom daily."
                )}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 font-body text-[11px] font-medium text-foreground">
              <LayoutDashboard size={14} className="text-accent" aria-hidden />
              Instructor
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Button className="rounded-full h-10 sm:h-9" size="sm" asChild>
              <Link to={ROSTER}>
                <CalendarClock className="mr-1.5 h-4 w-4" aria-hidden />
                Mark attendance
              </Link>
            </Button>
            <Button variant="secondary" className="rounded-full h-10 sm:h-9" size="sm" asChild>
              <Link to={ANNOUNCE}>
                <Megaphone className="mr-1.5 h-4 w-4" aria-hidden />
                Post update
              </Link>
            </Button>
          </div>
          {dash.data && (dash.data.scheduleToday?.length ?? 0) > 0 ? (
            <div className="mb-3 rounded-2xl border border-accent/30 bg-accent/8 p-3 sm:p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent font-body">Today&apos;s schedule</p>
              <ul className="space-y-2">
                {(dash.data.scheduleToday ?? []).map((s) => (
                  <li
                    key={s.sessionId}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm font-body border-b border-border/30 last:border-0 pb-2 last:pb-0"
                  >
                    <span className="text-foreground">
                      <span className="font-semibold tabular-nums">
                        {new Date(s.heldAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span className="text-muted-foreground"> · </span>
                      {s.courseTitle}
                      {s.label ? (
                        <span className="text-muted-foreground text-xs"> ({s.label})</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{s.studentCount} students</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {dash.data && (dash.data.pendingFeesCount ?? 0) > 0 ? (
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3">
              <p className="text-sm font-body text-foreground">
                <span className="font-semibold">{dash.data.pendingFeesCount}</span> student
                {(dash.data.pendingFeesCount ?? 0) === 1 ? "" : "s"} with pending fees ({dash.data.feeMonth ?? "this month"})
              </p>
              <Button size="sm" className="rounded-full shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                <Link to={ROSTER}>
                  <Link2 className="mr-1.5 h-4 w-4 inline" aria-hidden />
                  Open roster &amp; remind
                </Link>
              </Button>
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to={ROSTER}
              className="group rounded-2xl border-2 border-accent/35 bg-accent/10 px-4 py-4 sm:py-5 hover:bg-accent/15 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-background/80 p-2 shadow-sm">
                  <CalendarClock className="text-accent" size={22} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-base text-foreground group-hover:text-accent transition-colors">
                    Mark today&apos;s attendance
                  </p>
                  <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
                    Open sessions, tick who showed up, sync invite links.
                  </p>
                </div>
                <ArrowRight
                  className="text-muted-foreground group-hover:text-accent shrink-0 mt-1 transition-colors"
                  size={18}
                  aria-hidden
                />
              </div>
            </Link>
            <Link
              to={ANNOUNCE}
              className="group rounded-2xl border border-border/70 bg-background/80 px-4 py-4 sm:py-5 hover:border-accent/40 hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-muted/50 p-2">
                  <Megaphone className="text-accent" size={22} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-base text-foreground group-hover:text-accent transition-colors">Post an update</p>
                  <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
                    Short announcement → visible in learner Classroom.
                  </p>
                </div>
                <ArrowRight
                  className="text-muted-foreground group-hover:text-accent shrink-0 mt-1 transition-colors"
                  size={18}
                  aria-hidden
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Studio shortcuts */}
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Studio</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <QuickAction to="/instructor/studio" icon={LayoutDashboard} label="Dashboard" sub="Studio home" />
            <QuickAction to={ROSTER} icon={Users} label="Students" sub="Roster & invites" />
            <QuickAction to={ROSTER} icon={IndianRupee} label="Payments" sub="Monthly fees" />
            <QuickAction to="/instructor/studio#studio-create-class" icon={Sparkles} label="Classes" sub="Create & edit" />
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  sub,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  sub: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-background/90 p-3 sm:p-4 hover:border-accent/40 hover:bg-accent/5 transition-colors min-h-[5.25rem]"
    >
      <Icon className="text-accent shrink-0" size={20} aria-hidden />
      <span className="font-body text-xs sm:text-sm font-semibold text-foreground leading-tight">{label}</span>
      <span className="font-body text-[10px] sm:text-[11px] text-muted-foreground leading-snug">{sub}</span>
    </Link>
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
