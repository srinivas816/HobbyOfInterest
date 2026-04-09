import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  classHubPath,
  filterSessionsToday,
  invalidateClassWorkspaceQueries,
  studioCoursesQueryOptions,
  workspaceQueryOptions,
  type SessionRow,
} from "./classWorkspaceUtils";

type TodayPriority = "attendance" | "fees" | "empty" | "clear";

const InstructorClassHubPage = () => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam?.trim() ?? "";
  const { user, token, ready } = useAuth();
  const queryClient = useQueryClient();

  const feeYearMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const coursesQ = useQuery({
    queryKey: ["studio-courses"],
    ...studioCoursesQueryOptions,
    enabled: Boolean(token && user?.role === "INSTRUCTOR"),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/courses");
      return parseJson<{ courses: Array<{ slug: string; title: string }> }>(res);
    },
  });

  const courseTitle = useMemo(
    () => coursesQ.data?.courses.find((c) => c.slug === slug)?.title,
    [coursesQ.data?.courses, slug],
  );

  const rosterQuery = useQuery({
    queryKey: ["studio-roster", slug, feeYearMonth],
    ...workspaceQueryOptions,
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/roster?feeMonth=${encodeURIComponent(feeYearMonth)}`,
      );
      return parseJson<{
        course: {
          title: string;
          slug: string;
          monthlyFeeDisplay: string;
          feeMonth: string;
          priceCents?: number;
        };
        summary: {
          totalStudents: number;
          pendingFeesCount: number;
          todaysSessionId: string | null;
        };
        students: Array<{
          enrollmentId: string;
          learner: { name: string };
          feeStatus: "PAID" | "PENDING";
        }>;
      }>(res);
    },
  });

  const totalStudents = rosterQuery.data?.summary.totalStudents ?? 0;
  const pendingFees = rosterQuery.data?.summary.pendingFeesCount ?? 0;
  const feeDisp = rosterQuery.data?.course.monthlyFeeDisplay ?? "";
  const rosterLoaded = rosterQuery.isSuccess;
  const needInvite = rosterLoaded && totalStudents === 0;
  const needSessions = rosterLoaded && totalStudents > 0;

  const inviteQuery = useQuery({
    queryKey: ["studio-invite", slug],
    ...workspaceQueryOptions,
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug && needInvite),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/invite`);
      return parseJson<{ inviteCode: string }>(res);
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ["studio-sessions", slug],
    ...workspaceQueryOptions,
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug && needSessions),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions`);
      return parseJson<{ sessions: SessionRow[] }>(res);
    },
  });

  const sessionsToday = useMemo(
    () => filterSessionsToday(sessionsQuery.data?.sessions),
    [sessionsQuery.data?.sessions],
  );

  const sessionToday = useMemo(() => {
    const tid = rosterQuery.data?.summary.todaysSessionId;
    const list = sessionsQuery.data?.sessions ?? [];
    if (tid) {
      const found = list.find((s) => s.id === tid);
      if (found) return found;
    }
    return sessionsToday[0] ?? null;
  }, [rosterQuery.data?.summary.todaysSessionId, sessionsQuery.data?.sessions, sessionsToday]);

  const sessionExistsToday = Boolean(sessionToday);

  const todayPriority: TodayPriority = useMemo(() => {
    if (totalStudents > 0 && sessionExistsToday) return "attendance";
    if (totalStudents > 0 && pendingFees > 0) return "fees";
    if (totalStudents === 0) return "empty";
    return "clear";
  }, [totalStudents, sessionExistsToday, pendingFees]);

  const inviteUrl =
    typeof window !== "undefined" && inviteQuery.data
      ? `${window.location.origin}/join/${inviteQuery.data.inviteCode}`
      : "";

  const remindAllHref =
    rosterQuery.data && pendingFees > 0
      ? `https://wa.me/?text=${encodeURIComponent(
          `Reminder: ${rosterQuery.data.course.monthlyFeeDisplay || "Monthly fee"} for "${rosterQuery.data.course.title}" is still pending for ${rosterQuery.data.course.feeMonth}. Thank you!\n\n— ${user?.name ?? "Instructor"}`,
        )}`
      : "";

  const markAllPresentMut = useMutation({
    mutationFn: async (sessionId: string) => {
      const attRes = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(sessionId)}/attendance`,
      );
      const att = await parseJson<{ students: Array<{ enrollmentId: string; name: string; present: boolean }> }>(attRes);
      const marks = att.students.map((s) => ({ enrollmentId: s.enrollmentId, present: true }));
      const putRes = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(sessionId)}/attendance`,
        { method: "PUT", body: JSON.stringify({ marks }) },
      );
      await parseJson<{ ok: boolean }>(putRes);
      return { sessionId };
    },
    onSuccess: (out) => {
      queryClient.invalidateQueries({ queryKey: ["studio-attendance", slug, out.sessionId] });
      queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
      invalidateClassWorkspaceQueries(queryClient, slug);
      toast.success("Marked everyone present");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  if (!ready) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
      </div>
    );
  }
  if (!token || user?.role !== "INSTRUCTOR") {
    return <Navigate to="/login?next=/instructor/classes" replace />;
  }
  if (!slug || (coursesQ.isSuccess && !coursesQ.data?.courses.some((c) => c.slug === slug))) {
    return <Navigate to="/instructor/classes" replace />;
  }

  const title = courseTitle ?? rosterQuery.data?.course.title ?? "Class";
  const subtitle =
    rosterQuery.data && !rosterQuery.isLoading
      ? `${totalStudents} student${totalStudents === 1 ? "" : "s"}${feeDisp ? ` · ${feeDisp}` : ""}`
      : null;

  const hub = classHubPath(slug);

  return (
    <div className="min-h-full flex flex-col pb-8">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md pt-2 pb-3 px-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 rounded-full transition-transform active:scale-95" asChild aria-label="Back to classes">
            <Link to="/instructor/classes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-lg leading-tight truncate">{title}</h1>
            {subtitle !== null && subtitle !== "" ? (
              <p className="text-[11px] text-muted-foreground font-body truncate">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4 flex-1">
        <section className="rounded-2xl border border-border bg-card px-4 py-5" aria-live="polite">
          {rosterQuery.status === "pending" ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
            </div>
          ) : rosterQuery.status === "error" ? (
            <p className="text-sm text-center text-muted-foreground font-body py-6">
              <Link to="/instructor/classes" className="font-semibold text-accent hover:underline transition-colors duration-150 active:opacity-70">
                Return to classes
              </Link>
            </p>
          ) : todayPriority === "empty" ? (
            <div className="flex flex-col gap-3">
              {inviteUrl ? (
                <Button className="w-full rounded-xl h-12 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-[0.98]" asChild>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Join my class:\n${inviteUrl}`)}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="inline mr-2 h-4 w-4" aria-hidden />
                    Send invite on WhatsApp
                  </a>
                </Button>
              ) : (
                <Button className="w-full rounded-xl h-12 text-sm font-semibold transition-transform active:scale-[0.98]" disabled>
                  Send invite on WhatsApp
                </Button>
              )}
              <Button variant="ghost" className="w-full h-10 text-sm font-semibold text-accent transition-transform active:scale-[0.98]" asChild>
                <Link to={`${hub}/students`}>Add students manually</Link>
              </Button>
            </div>
          ) : todayPriority === "attendance" ? (
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                className="w-full rounded-xl h-12 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-[0.98]"
                disabled={markAllPresentMut.isPending || totalStudents === 0 || !sessionToday}
                aria-busy={markAllPresentMut.isPending}
                onClick={() => sessionToday && markAllPresentMut.mutate(sessionToday.id)}
              >
                {markAllPresentMut.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
                    Saving…
                  </span>
                ) : (
                  "Mark everyone present"
                )}
              </Button>
              <Button variant="ghost" className="w-full h-10 text-sm font-semibold text-accent transition-transform active:scale-[0.98]" asChild>
                <Link to={`${hub}/attendance`}>Adjust attendance</Link>
              </Button>
            </div>
          ) : todayPriority === "fees" ? (
            <div className="flex flex-col gap-3">
              <p className="text-center text-sm font-medium text-foreground font-body">
                {pendingFees} unpaid
              </p>
              {pendingFees > 0 ? (
                <Button
                  className="w-full rounded-xl h-12 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-[0.98]"
                  asChild={Boolean(remindAllHref)}
                  disabled={!remindAllHref}
                >
                  {remindAllHref ? (
                    <a href={remindAllHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="inline mr-2 h-4 w-4" aria-hidden />
                      Send fee reminders on WhatsApp
                    </a>
                  ) : (
                    <span>Send fee reminders on WhatsApp</span>
                  )}
                </Button>
              ) : null}
              <Button variant="ghost" className="w-full h-10 text-sm font-semibold text-accent transition-transform active:scale-[0.98]" asChild>
                <Link to={`${hub}/fees`}>Open fee list</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button className="w-full rounded-xl h-12 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-[0.98]" asChild>
                <Link to={`${hub}/attendance`}>Take attendance</Link>
              </Button>
              <Button variant="ghost" className="w-full h-10 text-sm font-semibold text-accent transition-transform active:scale-[0.98]" asChild>
                <Link to={`${hub}/students`}>View students</Link>
              </Button>
            </div>
          )}
        </section>

        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm font-semibold font-body" aria-label="Sections">
          <Link to={`${hub}/students`} className="text-accent hover:underline transition-colors duration-150 active:opacity-70">
            View students
          </Link>
          <Link to={`${hub}/fees`} className="text-accent hover:underline transition-colors duration-150 active:opacity-70">
            Manage fees
          </Link>
          <Link to={`${hub}/attendance`} className="text-accent hover:underline transition-colors duration-150 active:opacity-70">
            Take attendance
          </Link>
        </nav>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs font-semibold font-body text-muted-foreground pt-1">
          <Link to={`${hub}/announce`} className="hover:text-foreground hover:underline transition-colors duration-150 active:opacity-70">
            Message class
          </Link>
          <Link to="/instructor/more" className="hover:text-foreground hover:underline transition-colors duration-150 active:opacity-70">
            Open more
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InstructorClassHubPage;
