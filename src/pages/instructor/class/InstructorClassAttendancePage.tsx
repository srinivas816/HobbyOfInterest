import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InstructorClassSubHeader } from "./InstructorClassSubHeader";
import {
  filterSessionsToday,
  formatSessionTimeLabel,
  invalidateClassWorkspaceQueries,
  studioCoursesQueryOptions,
  workspaceQueryOptions,
  type SessionRow,
} from "./classWorkspaceUtils";

type AttendanceStudent = { enrollmentId: string; name: string; present: boolean };

const AttendanceStudentRow = memo(function AttendanceStudentRow({
  name,
  enrollmentId,
  present,
  onSetPresent,
}: {
  name: string;
  enrollmentId: string;
  present: boolean;
  onSetPresent: (id: string, next: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border bg-card/80 px-3 py-2.5">
      <span className="text-sm font-semibold font-body min-w-0 truncate">{name}</span>
      <div className="flex rounded-full border-2 border-border p-1 bg-muted/40 shrink-0">
        <button
          type="button"
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 sm:px-4 sm:text-sm",
            present ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onSetPresent(enrollmentId, true)}
        >
          Present
        </button>
        <button
          type="button"
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 sm:px-4 sm:text-sm",
            !present ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onSetPresent(enrollmentId, false)}
        >
          Absent
        </button>
      </div>
    </li>
  );
});

const InstructorClassAttendancePage = () => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam?.trim() ?? "";
  const { user, token, ready } = useAuth();
  const queryClient = useQueryClient();
  const attendanceHydratingRef = useRef(true);
  const savedClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<"idle" | "saving" | "saved">("idle");

  const feeYearMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, boolean>>({});

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
        course: { title: string };
        summary: { todaysSessionId: string | null };
      }>(res);
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ["studio-sessions", slug],
    ...workspaceQueryOptions,
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug),
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

  useEffect(() => {
    const sessions = sessionsQuery.data?.sessions ?? [];
    const tid = rosterQuery.data?.summary?.todaysSessionId;
    const firstToday = sessionsToday[0]?.id;
    setSelectedSessionId((prev) => {
      const sessionOk = (id: string) => sessions.length === 0 || sessions.some((s) => s.id === id);
      if (tid && sessionOk(tid)) return tid;
      if (firstToday && sessionOk(firstToday)) return firstToday;
      if (prev && sessionOk(prev)) return prev;
      return "";
    });
  }, [slug, rosterQuery.data?.summary?.todaysSessionId, sessionsQuery.data?.sessions, sessionsToday]);

  const attendanceQuery = useQuery({
    queryKey: ["studio-attendance", slug, selectedSessionId],
    ...workspaceQueryOptions,
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug && selectedSessionId),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(selectedSessionId)}/attendance`,
      );
      return parseJson<{ students: Array<{ enrollmentId: string; name: string; present: boolean }> }>(res);
    },
  });

  useEffect(() => {
    attendanceHydratingRef.current = true;
    if (!attendanceQuery.data) {
      setAttendanceDraft({});
      return;
    }
    const o: Record<string, boolean> = {};
    for (const s of attendanceQuery.data.students) o[s.enrollmentId] = s.present;
    setAttendanceDraft(o);
    queueMicrotask(() => {
      attendanceHydratingRef.current = false;
    });
  }, [attendanceQuery.data]);

  const saveAttendanceSilent = useMutation({
    mutationFn: async (payload: { sessionId: string; marks: Array<{ enrollmentId: string; present: boolean }> }) => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(payload.sessionId)}/attendance`,
        { method: "PUT", body: JSON.stringify({ marks: payload.marks }) },
      );
      await parseJson<{ ok: boolean }>(res);
    },
    onMutate: () => {
      setSaveFeedback("saving");
    },
    onSuccess: (_d, vars) => {
      const byId = new Map(vars.marks.map((m) => [m.enrollmentId, m.present]));
      queryClient.setQueryData<{ students: AttendanceStudent[] }>(
        ["studio-attendance", slug, vars.sessionId],
        (old) => {
          if (!old?.students) return old;
          return {
            students: old.students.map((s) => ({
              ...s,
              present: byId.has(s.enrollmentId) ? (byId.get(s.enrollmentId) as boolean) : s.present,
            })),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
      queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
      queryClient.invalidateQueries({ queryKey: ["studio-analytics"] });
      setSaveFeedback("saved");
      if (savedClearTimerRef.current) window.clearTimeout(savedClearTimerRef.current);
      savedClearTimerRef.current = window.setTimeout(() => {
        setSaveFeedback("idle");
        savedClearTimerRef.current = null;
      }, 2200);
    },
    onError: (e: Error) => {
      setSaveFeedback("idle");
      toast.error(e.message || "Could not save attendance");
    },
  });

  const createClassSessionNow = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions`, {
        method: "POST",
        body: JSON.stringify({ heldAt: new Date().toISOString() }),
      });
      return parseJson<{ session: { id: string } }>(res);
    },
    onSuccess: (out) => {
      queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
      invalidateClassWorkspaceQueries(queryClient, slug);
      setSelectedSessionId(out.session.id);
      toast.success("Session started — take attendance below");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const markAllPresentOnce = useCallback(() => {
    if (!attendanceQuery.data?.students.length) return;
    const next: Record<string, boolean> = {};
    for (const st of attendanceQuery.data.students) next[st.enrollmentId] = true;
    setAttendanceDraft(next);
  }, [attendanceQuery.data?.students]);

  const setStudentPresent = useCallback((enrollmentId: string, next: boolean) => {
    setAttendanceDraft((p) => (p[enrollmentId] === next ? p : { ...p, [enrollmentId]: next }));
  }, []);

  const saveMutate = saveAttendanceSilent.mutate;

  useEffect(() => {
    if (!selectedSessionId || !attendanceQuery.data?.students.length) return;
    if (attendanceHydratingRef.current) return;
    if (saveAttendanceSilent.isPending) return;
    const marks = Object.entries(attendanceDraft).map(([enrollmentId, present]) => ({ enrollmentId, present }));
    const server = attendanceQuery.data.students.map((s) => ({
      enrollmentId: s.enrollmentId,
      present: s.present,
    }));
    if (marks.length !== server.length) return;
    const same = server.every((s) => attendanceDraft[s.enrollmentId] === s.present);
    if (same) return;
    const t = window.setTimeout(() => {
      saveMutate({ sessionId: selectedSessionId, marks });
    }, 500);
    return () => window.clearTimeout(t);
  }, [attendanceDraft, selectedSessionId, attendanceQuery.data, saveAttendanceSilent.isPending, saveMutate]);

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

  return (
    <div className="min-h-full flex flex-col pb-10">
      <InstructorClassSubHeader slug={slug} title="Attendance" subtitle={title} />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4 flex-1">
        {sessionToday ? (
          <p className="text-xs text-muted-foreground font-body tabular-nums">
            {formatSessionTimeLabel(sessionToday.heldAt)}
          </p>
        ) : null}

        {!sessionToday ? (
          <Button
            type="button"
            className="w-full rounded-xl h-12 text-sm font-semibold transition-transform active:scale-[0.98]"
            disabled={createClassSessionNow.isPending}
            aria-busy={createClassSessionNow.isPending}
            onClick={() => createClassSessionNow.mutate()}
          >
            {createClassSessionNow.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5 shrink-0" aria-hidden />
                Starting…
              </span>
            ) : (
              "Start today's session"
            )}
          </Button>
        ) : null}

        {selectedSessionId && attendanceQuery.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-accent h-6 w-6" />
          </div>
        ) : null}

        {selectedSessionId && attendanceQuery.data ? (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl h-11 text-sm font-semibold transition-transform active:scale-[0.98]"
              disabled={
                saveAttendanceSilent.isPending || !attendanceQuery.data.students.length
              }
              aria-busy={saveAttendanceSilent.isPending}
              onClick={markAllPresentOnce}
            >
              {saveAttendanceSilent.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                  Saving…
                </span>
              ) : (
                "Mark everyone present"
              )}
            </Button>
            <ul className="space-y-2">
              {attendanceQuery.data.students.map((s) => (
                <AttendanceStudentRow
                  key={s.enrollmentId}
                  name={s.name}
                  enrollmentId={s.enrollmentId}
                  present={attendanceDraft[s.enrollmentId] ?? false}
                  onSetPresent={setStudentPresent}
                />
              ))}
            </ul>
            <p
              className="text-xs text-center font-body min-h-[1.25rem] transition-colors"
              aria-live="polite"
            >
              {saveFeedback === "saving" ? (
                <span className="text-amber-700 dark:text-amber-300 font-medium">Saving attendance…</span>
              ) : saveFeedback === "saved" ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Attendance saved</span>
              ) : null}
            </p>
          </div>
        ) : null}

      </div>
    </div>
  );
};

export default InstructorClassAttendancePage;
