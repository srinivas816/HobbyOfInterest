import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WTab = "students" | "attendance" | "fees";

const TAB_IDS: { id: WTab; label: string }[] = [
  { id: "attendance", label: "Attendance" },
  { id: "fees", label: "Fees" },
  { id: "students", label: "Students" },
];

function isWTab(s: string): s is WTab {
  return s === "attendance" || s === "fees" || s === "students";
}

function formatFeeMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  if (!y || !m) return ym;
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: "long" });
}

type PrimaryKind = "activation" | "empty" | "attendance" | "fees" | "none";

const InstructorClassWorkspacePage = () => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam?.trim() ?? "";
  const { user, token, ready } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const explicitTabRaw = searchParams.get("tab");
  const panelAnnounce = searchParams.get("panel") === "announce";
  const autoTabSlugRef = useRef<string | null>(null);
  const addStudentAnchorRef = useRef<HTMLDivElement>(null);
  const attendanceHydratingRef = useRef(true);
  const showActivationBanner = searchParams.get("activated") === "1";

  const setTab = useCallback(
    (t: WTab) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", t);
          next.delete("panel");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openAnnouncePanel = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("panel", "announce");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const closeAnnouncePanel = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("panel");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const dismissActivationBanner = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("activated");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const [feeYearMonth, setFeeYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [bulkEnrollInput, setBulkEnrollInput] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, boolean>>({});
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announceEmailLearners, setAnnounceEmailLearners] = useState(false);

  const coursesQ = useQuery({
    queryKey: ["studio-courses"],
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
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/roster?feeMonth=${encodeURIComponent(feeYearMonth)}`,
      );
      return parseJson<{
        course: { title: string; slug: string; monthlyFeeDisplay: string; feeMonth: string };
        summary: {
          totalStudents: number;
          presentTodayCount: number;
          pendingFeesCount: number;
          todaysSessionId: string | null;
        };
        students: Array<{
          enrollmentId: string;
          learner: { id: string; name: string; email: string; phone: string | null };
          feeStatus: "PAID" | "PENDING";
          stats: {
            sessionsHeld: number;
            sessionsPresent: number;
            feeRecentPaidCount: number;
            feeRecentMonthCount: number;
          };
        }>;
      }>(res);
    },
  });

  const inviteQuery = useQuery({
    queryKey: ["studio-invite", slug],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/invite`);
      return parseJson<{ inviteCode: string }>(res);
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ["studio-sessions", slug],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions`);
      return parseJson<{
        sessions: Array<{
          id: string;
          heldAt: string;
          presentCount: number;
          totalMarked: number;
        }>;
      }>(res);
    },
  });

  const attendanceQuery = useQuery({
    queryKey: ["studio-attendance", slug, selectedSessionId],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug && selectedSessionId),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(selectedSessionId)}/attendance`,
      );
      return parseJson<{ students: Array<{ enrollmentId: string; name: string; present: boolean }> }>(res);
    },
  });

  const studioAnnouncementsQuery = useQuery({
    queryKey: ["studio-announcements", slug],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug && panelAnnounce),
    queryFn: async () => {
      const res = await apiFetch(`/api/course-engagement/${encodeURIComponent(slug)}/announcements`);
      return parseJson<{
        announcements: Array<{
          id: string;
          title: string | null;
          body: string;
          emailed: boolean;
          createdAt: string;
          author: { id: string; name: string };
        }>;
      }>(res);
    },
  });

  const sessionsToday = useMemo(() => {
    const list = sessionsQuery.data?.sessions ?? [];
    const today = new Date();
    return list.filter((s) => {
      const d = new Date(s.heldAt);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    });
  }, [sessionsQuery.data?.sessions]);

  const hasSessionToday = useMemo(() => {
    return sessionsToday.length > 0 || Boolean(rosterQuery.data?.summary.todaysSessionId);
  }, [sessionsToday, rosterQuery.data?.summary.todaysSessionId]);

  const smartDefaultTab = useMemo((): WTab => {
    if (!rosterQuery.data || !sessionsQuery.data) return "attendance";
    if (hasSessionToday) return "attendance";
    if (rosterQuery.data.summary.pendingFeesCount > 0) return "fees";
    return "students";
  }, [rosterQuery.data, sessionsQuery.data, hasSessionToday]);

  const tab: WTab = explicitTabRaw && isWTab(explicitTabRaw) ? explicitTabRaw : smartDefaultTab;

  useEffect(() => {
    if (explicitTabRaw === "announce") {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("tab");
          next.set("panel", "announce");
          return next;
        },
        { replace: true },
      );
    }
  }, [explicitTabRaw, setSearchParams]);

  useEffect(() => {
    autoTabSlugRef.current = null;
  }, [slug]);

  useEffect(() => {
    if (explicitTabRaw && isWTab(explicitTabRaw)) return;
    if (panelAnnounce) return;
    if (!slug || !rosterQuery.data || !sessionsQuery.data) return;
    if (autoTabSlugRef.current === slug) return;
    autoTabSlugRef.current = slug;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", smartDefaultTab);
        return next;
      },
      { replace: true },
    );
  }, [slug, explicitTabRaw, smartDefaultTab, rosterQuery.data, sessionsQuery.data, panelAnnounce, setSearchParams]);

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

  const invalidateRosterish = () => {
    queryClient.invalidateQueries({ queryKey: ["studio-roster", slug] });
    queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
    queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
    queryClient.invalidateQueries({ queryKey: ["studio-analytics"] });
  };

  const bulkEnrollMut = useMutation({
    mutationFn: async () => {
      const lines = bulkEnrollInput.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) throw new Error("Paste one email or phone per line");
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/roster/bulk-enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      return parseJson<{
        enrolled: string[];
        alreadyEnrolled: string[];
        notFound: string[];
        invalidFormat: string[];
        blocked: Array<{ line: string; message: string }>;
      }>(res);
    },
    onSuccess: (out) => {
      setBulkEnrollInput("");
      invalidateRosterish();
      const parts = [
        out.enrolled.length ? `${out.enrolled.length} added` : "",
        out.alreadyEnrolled.length ? `${out.alreadyEnrolled.length} already in class` : "",
        out.notFound.length ? `${out.notFound.length} no account` : "",
      ].filter(Boolean);
      toast.success(parts.length ? parts.join(" · ") : "No changes");
    },
    onError: (e: Error) => toast.error(e.message || "Bulk add failed"),
  });

  const saveFeeOne = useMutation({
    mutationFn: async ({ enrollmentId, status }: { enrollmentId: string; status: "PAID" | "PENDING" }) => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/fees/${encodeURIComponent(feeYearMonth)}`,
        { method: "PUT", body: JSON.stringify({ rows: [{ enrollmentId, status }] }) },
      );
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["studio-roster", slug, feeYearMonth] });
      queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
      toast.success(v.status === "PAID" ? "Marked paid" : "Updated", { duration: 2000 });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update fee"),
  });

  const saveAttendanceSilent = useMutation({
    mutationFn: async (payload: { sessionId: string; marks: Array<{ enrollmentId: string; present: boolean }> }) => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(payload.sessionId)}/attendance`,
        { method: "PUT", body: JSON.stringify({ marks: payload.marks }) },
      );
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["studio-attendance", slug, vars.sessionId] });
      queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
      invalidateRosterish();
    },
    onError: (e: Error) => toast.error(e.message || "Could not save attendance"),
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
      invalidateRosterish();
      setSelectedSessionId(out.session.id);
      toast.success("Today’s session started");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const markAllPresentThenSave = useMutation({
    mutationFn: async () => {
      let sid = selectedSessionId;
      if (!sid) {
        const roster = queryClient.getQueryData([
          "studio-roster",
          slug,
          feeYearMonth,
        ]) as { summary?: { todaysSessionId: string | null } } | undefined;
        const tid = roster?.summary?.todaysSessionId;
        if (tid) sid = tid;
      }
      if (!sid) {
        const sess = queryClient.getQueryData(["studio-sessions", slug]) as
          | { sessions: Array<{ id: string; heldAt: string }> }
          | undefined;
        const today = new Date();
        const found = sess?.sessions.find((s) => {
          const d = new Date(s.heldAt);
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        });
        if (found) sid = found.id;
      }
      if (!sid) {
        const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions`, {
          method: "POST",
          body: JSON.stringify({ heldAt: new Date().toISOString() }),
        });
        const out = await parseJson<{ session: { id: string } }>(res);
        sid = out.session.id;
        setSelectedSessionId(sid);
        await queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
        await queryClient.invalidateQueries({ queryKey: ["studio-roster", slug] });
      }
      const attRes = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(sid)}/attendance`,
      );
      const att = await parseJson<{ students: Array<{ enrollmentId: string; name: string; present: boolean }> }>(attRes);
      const marks = att.students.map((s) => ({ enrollmentId: s.enrollmentId, present: true }));
      const putRes = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(sid)}/attendance`,
        { method: "PUT", body: JSON.stringify({ marks }) },
      );
      await parseJson<{ ok: boolean }>(putRes);
      return { sessionId: sid, marks };
    },
    onSuccess: (out) => {
      setSelectedSessionId(out.sessionId);
      queryClient.invalidateQueries({ queryKey: ["studio-attendance", slug, out.sessionId] });
      queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
      invalidateRosterish();
      setAttendanceDraft(Object.fromEntries(out.marks.map((m) => [m.enrollmentId, m.present])));
      toast.success("Everyone marked present");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

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
      saveAttendanceSilent.mutate({ sessionId: selectedSessionId, marks });
    }, 500);
    return () => window.clearTimeout(t);
  }, [attendanceDraft, selectedSessionId, attendanceQuery.data, saveAttendanceSilent.mutate, saveAttendanceSilent.isPending]);

  const postAnnouncement = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/announcements`, {
        method: "POST",
        body: JSON.stringify({
          title: announceTitle.trim() || undefined,
          body: announceBody.trim(),
          emailLearners: announceEmailLearners,
        }),
      });
      return parseJson<{ email?: { attempted?: boolean; ok?: boolean; skipped?: string; error?: string } }>(res);
    },
    onSuccess: (out) => {
      setAnnounceTitle("");
      setAnnounceBody("");
      setAnnounceEmailLearners(false);
      queryClient.invalidateQueries({ queryKey: ["studio-announcements", slug] });
      queryClient.invalidateQueries({ queryKey: ["classroom-announcements", slug] });
      const em = out.email;
      if (em?.attempted && em.ok) toast.success("Posted and emailed");
      else if (em?.skipped) toast.success(`Posted. ${em.skipped}`);
      else toast.success("Posted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const postAnnouncementShareWhatsApp = async () => {
    if (announceBody.trim().length < 10) {
      toast.error("Write your message (10+ characters) first.");
      return;
    }
    const title = announceTitle.trim();
    const body = announceBody.trim();
    try {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/announcements`, {
        method: "POST",
        body: JSON.stringify({
          title: title || undefined,
          body,
          emailLearners: announceEmailLearners,
        }),
      });
      await parseJson(res);
      setAnnounceTitle("");
      setAnnounceBody("");
      setAnnounceEmailLearners(false);
      queryClient.invalidateQueries({ queryKey: ["studio-announcements", slug] });
      const waText = `${title ? `${title}\n\n` : ""}${body}\n\n— Hobby of Interest`;
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank", "noopener,noreferrer");
      toast.success("Posted — WhatsApp opened");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post");
    }
  };

  const applyPreset = (k: "update" | "cancel" | "fee") => {
    const t = rosterQuery.data?.course.title ?? courseTitle ?? "our class";
    const feeDisp = rosterQuery.data?.course.monthlyFeeDisplay ?? "Monthly fee";
    if (k === "update") {
      setAnnounceTitle("Class update");
      setAnnounceBody(`Quick update for ${t}:\n\n`);
    } else if (k === "cancel") {
      setAnnounceTitle("Class cancelled");
      setAnnounceBody(`Hi everyone — today's ${t} session is cancelled. I'll confirm the next date soon.\n`);
    } else {
      setAnnounceTitle("Fee reminder");
      setAnnounceBody(`Friendly reminder: ${feeDisp} for ${t} is due. Thank you!\n`);
    }
  };

  const totalStudents = rosterQuery.data?.summary.totalStudents ?? 0;
  const pendingFees = rosterQuery.data?.summary.pendingFeesCount ?? 0;
  const feeDisp = rosterQuery.data?.course.monthlyFeeDisplay ?? "";

  const primaryKind: PrimaryKind = useMemo(() => {
    if (showActivationBanner) return "activation";
    if (totalStudents === 0) return "empty";
    if (hasSessionToday) return "attendance";
    if (pendingFees > 0) return "fees";
    return "none";
  }, [showActivationBanner, totalStudents, hasSessionToday, pendingFees]);

  const inviteUrl =
    typeof window !== "undefined" && inviteQuery.data
      ? `${window.location.origin}/join/${inviteQuery.data.inviteCode}`
      : "";

  const remindAllHref =
    rosterQuery.data && pendingFees > 0
      ? `https://wa.me/?text=${encodeURIComponent(
          `Reminder: ${rosterQuery.data.course.monthlyFeeDisplay} for "${rosterQuery.data.course.title}" is still pending for ${rosterQuery.data.course.feeMonth}. Thank you!\n\n— ${user?.name ?? "Instructor"}`,
        )}`
      : "";

  const scrollToAddStudent = () => {
    addStudentAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
  if (!slug || coursesQ.isSuccess && !coursesQ.data?.courses.some((c) => c.slug === slug)) {
    return <Navigate to="/instructor/classes" replace />;
  }

  const subtitle =
    rosterQuery.data ?
      `${totalStudents} student${totalStudents === 1 ? "" : "s"}${feeDisp ? ` • ${feeDisp}` : ""}`
    : "Loading…";

  const announceView = panelAnnounce ? (
    <div className="space-y-4 pb-8">
      <Button type="button" variant="ghost" className="h-9 px-0 text-sm font-semibold -ml-1" onClick={closeAnnouncePanel}>
        ← Back to class
      </Button>
      <p className="font-heading text-lg text-foreground">Message your class</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => applyPreset("update")}>
          Update
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => applyPreset("cancel")}>
          Cancelled
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => applyPreset("fee")}>
          Fee reminder
        </Button>
      </div>
      <input
        className="w-full rounded-xl border bg-background p-2.5 text-sm"
        placeholder="Title (optional)"
        value={announceTitle}
        onChange={(e) => setAnnounceTitle(e.target.value)}
      />
      <textarea
        className="w-full rounded-xl border bg-background p-3 text-sm min-h-[100px]"
        placeholder="Message (10+ characters)"
        value={announceBody}
        onChange={(e) => setAnnounceBody(e.target.value)}
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={announceEmailLearners} onChange={(e) => setAnnounceEmailLearners(e.target.checked)} />
        Email learners
      </label>
      <Button
        type="button"
        className="rounded-full h-12 w-full"
        disabled={postAnnouncement.isPending || announceBody.trim().length < 10}
        onClick={() => postAnnouncement.mutate()}
      >
        Post to Classroom
      </Button>
      <Button
        type="button"
        className="rounded-full h-12 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        disabled={announceBody.trim().length < 10}
        onClick={() => void postAnnouncementShareWhatsApp()}
      >
        <MessageCircle className="mr-2 h-4 w-4 inline" />
        Post + WhatsApp
      </Button>
      <ul className="space-y-2 pt-2">
        {studioAnnouncementsQuery.data?.announcements.map((a) => (
          <li key={a.id} className="rounded-xl border p-3 text-sm">
            {a.title ? <p className="font-medium">{a.title}</p> : null}
            <p className="text-xs text-muted-foreground">
              {a.author.name} · {new Date(a.createdAt).toLocaleString()}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{a.body}</p>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md pt-2 pb-0">
        <div className="container mx-auto max-w-lg px-3">
          <div className="flex items-center gap-2 pb-2">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full" asChild aria-label="Back to classes">
              <Link to="/instructor/classes">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-lg leading-tight truncate">{courseTitle ?? rosterQuery.data?.course.title ?? "Class"}</h1>
              <p className="text-[11px] text-muted-foreground font-body truncate">{subtitle}</p>
            </div>
          </div>
          {!panelAnnounce ? (
            <div className="flex gap-1 pb-2 -mx-1 px-1">
              {TAB_IDS.map(({ id, label }) => {
                const showFeeDot = id === "fees" && pendingFees > 0;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={cn(
                      "relative flex-1 rounded-xl py-2.5 text-xs font-semibold font-body transition-all duration-150",
                      tab === id ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                    {showFeeDot ? (
                      <span
                        className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-background"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-4 flex-1">
        {panelAnnounce ? (
          announceView
        ) : (
          <>
            {primaryKind === "activation" ? (
              <div className="relative rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-card/90 px-4 py-4 pr-11 shadow-sm mb-4">
                <button
                  type="button"
                  onClick={dismissActivationBanner}
                  className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="font-heading text-lg text-foreground pr-2">Your class is ready 🎉</p>
                <p className="text-sm text-foreground font-body mt-2 font-medium">Add your first 3 students</p>
                <div className="flex flex-col gap-2 mt-4">
                  {inviteUrl ? (
                    <Button className="w-full rounded-xl h-11 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                      <a href={`https://wa.me/?text=${encodeURIComponent(`Join my class:\n${inviteUrl}`)}`} target="_blank" rel="noreferrer">
                        <MessageCircle className="inline mr-2 h-4 w-4" aria-hidden />
                        Share invite
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-xl h-11 text-sm font-semibold"
                    onClick={() => {
                      setTab("students");
                      queueMicrotask(scrollToAddStudent);
                    }}
                  >
                    Add student
                  </Button>
                </div>
              </div>
            ) : primaryKind === "empty" ? (
              <div className="rounded-2xl border border-border/80 bg-card px-4 py-4 mb-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground font-body">No students yet</p>
                <div className="flex flex-col gap-2 mt-3">
                  {inviteUrl ? (
                    <Button className="w-full rounded-xl h-11 text-sm font-semibold" asChild>
                      <a href={`https://wa.me/?text=${encodeURIComponent(`Join my class:\n${inviteUrl}`)}`} target="_blank" rel="noreferrer">
                        Share invite
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-xl h-11 text-sm font-semibold"
                    onClick={() => {
                      setTab("students");
                      queueMicrotask(scrollToAddStudent);
                    }}
                  >
                    Add student
                  </Button>
                </div>
              </div>
            ) : primaryKind === "attendance" ? (
              <div className="rounded-2xl border border-border/80 bg-card px-4 py-4 mb-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground font-body">Mark attendance for today</p>
                <Button
                  type="button"
                  className="w-full rounded-xl h-11 text-sm font-semibold mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={markAllPresentThenSave.isPending || totalStudents === 0}
                  onClick={() => markAllPresentThenSave.mutate()}
                >
                  {markAllPresentThenSave.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Mark all present"}
                </Button>
              </div>
            ) : primaryKind === "fees" ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/[0.08] dark:bg-amber-950/30 px-4 py-4 mb-4">
                <p className="text-sm font-semibold text-foreground font-body">
                  {pendingFees} student{pendingFees === 1 ? "" : "s"} pending fees
                </p>
                {remindAllHref ? (
                  <Button className="w-full rounded-xl h-11 text-sm font-semibold mt-3" variant="secondary" asChild>
                    <a href={remindAllHref} target="_blank" rel="noreferrer">
                      Remind
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}

            {tab === "attendance" && (
              <div className="space-y-4 pb-8">
                <p className="text-sm font-semibold text-foreground font-body">Mark attendance for today</p>
                {!hasSessionToday && totalStudents > 0 ? (
                  <Button
                    type="button"
                    className="w-full rounded-xl h-12 text-sm font-semibold"
                    disabled={createClassSessionNow.isPending}
                    onClick={() => createClassSessionNow.mutate()}
                  >
                    {createClassSessionNow.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Start today’s session"}
                  </Button>
                ) : null}
                {selectedSessionId && attendanceQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="animate-spin text-accent h-6 w-6" />
                  </div>
                ) : null}
                {selectedSessionId && attendanceQuery.data && attendanceQuery.data.students.length > 0 ? (
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl h-11 text-sm font-semibold border-2"
                      disabled={saveAttendanceSilent.isPending}
                      onClick={() => {
                        const next: Record<string, boolean> = {};
                        for (const st of attendanceQuery.data!.students) next[st.enrollmentId] = true;
                        setAttendanceDraft(next);
                      }}
                    >
                      Mark all present
                    </Button>
                    <ul className="space-y-2">
                      {attendanceQuery.data.students.map((s) => (
                        <li
                          key={s.enrollmentId}
                          className="flex items-center justify-between gap-3 rounded-2xl border bg-card/80 px-3 py-3"
                        >
                          <span className="text-sm font-semibold font-body min-w-0 truncate">{s.name}</span>
                          <div className="flex rounded-full border-2 border-border p-1 bg-muted/40 shrink-0">
                            <button
                              type="button"
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95 sm:px-4 sm:text-sm",
                                (attendanceDraft[s.enrollmentId] ?? false)
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                              onClick={() => setAttendanceDraft((p) => ({ ...p, [s.enrollmentId]: true }))}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95 sm:px-4 sm:text-sm",
                                !(attendanceDraft[s.enrollmentId] ?? false)
                                  ? "bg-foreground text-background shadow-sm"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                              onClick={() => setAttendanceDraft((p) => ({ ...p, [s.enrollmentId]: false }))}
                            >
                              Absent
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-muted-foreground text-center font-body">Saves automatically</p>
                  </div>
                ) : null}
                {hasSessionToday && totalStudents === 0 ? (
                  <p className="text-sm text-muted-foreground font-body">Add students to take attendance.</p>
                ) : null}
              </div>
            )}

            {tab === "fees" && rosterQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-accent h-8 w-8" />
              </div>
            ) : null}
            {tab === "fees" && rosterQuery.data ? (
              <div className="space-y-4 pb-8">
                <div>
                  <p className="font-heading text-base text-foreground">{formatFeeMonthLabel(feeYearMonth)} fees</p>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Paid: {rosterQuery.data.students.filter((s) => s.feeStatus === "PAID").length} · Pending:{" "}
                    {rosterQuery.data.summary.pendingFeesCount}
                  </p>
                </div>
                {rosterQuery.data.summary.pendingFeesCount > 0 && remindAllHref ? (
                  <Button className="rounded-xl h-11 w-full text-sm font-semibold" asChild>
                    <a href={remindAllHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4 inline" />
                      Remind all
                    </a>
                  </Button>
                ) : null}
                <details className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-semibold text-muted-foreground py-1 list-none font-body">
                    Different month
                  </summary>
                  <input
                    type="month"
                    className="rounded-lg border bg-background px-3 py-2 text-sm w-full max-w-[14rem] mt-2"
                    value={feeYearMonth}
                    onChange={(e) => setFeeYearMonth(e.target.value)}
                  />
                </details>
                <ul className="space-y-2">
                  {rosterQuery.data.students.map((row) => {
                    const first = row.learner.name.split(" ")[0] ?? row.learner.name;
                    const waOne = `https://wa.me/?text=${encodeURIComponent(
                      `Hi ${first} — reminder: ${rosterQuery.data!.course.monthlyFeeDisplay} for "${rosterQuery.data!.course.title}" (${feeYearMonth}) is pending. Thank you!`,
                    )}`;
                    return (
                      <li
                        key={row.enrollmentId}
                        className={cn(
                          "rounded-xl border px-3 py-3 flex flex-col gap-2",
                          row.feeStatus === "PENDING" && "border-amber-500/35 bg-amber-500/[0.06]",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <p className="font-semibold text-sm truncate">{row.learner.name}</p>
                          <span
                            className={cn(
                              "shrink-0 text-xs font-bold",
                              row.feeStatus === "PAID" ? "text-emerald-600" : "text-amber-800 dark:text-amber-200",
                            )}
                          >
                            {row.feeStatus === "PAID" ? "Paid" : "Pending"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {row.feeStatus === "PENDING" ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-lg h-9 text-xs flex-1 min-w-[6rem]"
                                disabled={saveFeeOne.isPending}
                                onClick={() => saveFeeOne.mutate({ enrollmentId: row.enrollmentId, status: "PAID" })}
                              >
                                Mark paid
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="rounded-lg h-9 text-xs flex-1 min-w-[6rem]" asChild>
                                <a href={waOne} target="_blank" rel="noreferrer">
                                  Remind
                                </a>
                              </Button>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground font-body">Paid for this month</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {tab === "students" && (
              <div className="space-y-4 pb-8">
                <div className="flex flex-col gap-2">
                  <Button className="w-full rounded-xl h-11 text-sm font-semibold" variant="secondary" asChild={Boolean(inviteUrl)} disabled={!inviteUrl}>
                    {inviteUrl ? (
                      <a href={`https://wa.me/?text=${encodeURIComponent(`Join my class:\n${inviteUrl}`)}`} target="_blank" rel="noreferrer">
                        Share invite
                      </a>
                    ) : (
                      <span>Share invite</span>
                    )}
                  </Button>
                </div>

                <div ref={addStudentAnchorRef} className="rounded-xl border border-border/60 bg-muted/15 p-3 space-y-2 scroll-mt-24">
                  <p className="text-xs font-semibold text-foreground font-body">Add student</p>
                  <textarea
                    className="w-full min-h-[64px] rounded-lg border bg-background p-3 text-sm"
                    placeholder="Email or phone, one per line"
                    value={bulkEnrollInput}
                    onChange={(e) => setBulkEnrollInput(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="w-full rounded-xl h-11 text-sm font-semibold"
                    disabled={bulkEnrollMut.isPending}
                    onClick={() => bulkEnrollMut.mutate()}
                  >
                    {bulkEnrollMut.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Add to class"}
                  </Button>
                </div>

                {rosterQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin h-6 w-6 text-accent" />
                  </div>
                ) : rosterQuery.data && rosterQuery.data.students.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6 font-body">Nobody enrolled yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {rosterQuery.data?.students.map((row) => (
                      <li
                        key={row.enrollmentId}
                        className={cn(
                          "rounded-xl border bg-card px-3 py-3 flex items-center justify-between gap-2",
                          row.feeStatus === "PENDING" && "border-amber-500/30",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{row.learner.name}</p>
                          <p className="text-xs text-muted-foreground font-body mt-0.5">{feeDisp || "—"}</p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-bold rounded-full px-2 py-1",
                            row.feeStatus === "PAID"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/15 text-amber-800 dark:text-amber-200",
                          )}
                        >
                          {row.feeStatus === "PAID" ? "Paid" : "Due"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="pt-2 border-t border-border/40 space-y-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-accent hover:underline w-full text-left"
                    onClick={openAnnouncePanel}
                  >
                    Message class
                  </button>
                  <Link
                    to="/instructor/more"
                    className="block text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                  >
                    More — curriculum, analytics, profile
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InstructorClassWorkspacePage;
