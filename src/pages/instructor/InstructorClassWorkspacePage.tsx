import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, Loader2, MessageCircle, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WTab = "students" | "attendance" | "fees" | "announce";

/** Daily-first order: attendance → fees → students → announce */
const TAB_IDS: { id: WTab; label: string }[] = [
  { id: "attendance", label: "Attendance" },
  { id: "fees", label: "Fees" },
  { id: "students", label: "Students" },
  { id: "announce", label: "Announce" },
];

function isWTab(s: string): s is WTab {
  return s === "attendance" || s === "fees" || s === "students" || s === "announce";
}

function formatFeeMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  if (!y || !m) return ym;
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

const InstructorClassWorkspacePage = () => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam?.trim() ?? "";
  const { user, token, ready } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const explicitTabRaw = searchParams.get("tab");
  const autoTabSlugRef = useRef<string | null>(null);

  const setTab = useCallback(
    (t: WTab) => {
      setSearchParams({ tab: t }, { replace: true });
    },
    [setSearchParams],
  );

  const [feeYearMonth, setFeeYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rosterSearch, setRosterSearch] = useState("");
  const [bulkEnrollInput, setBulkEnrollInput] = useState("");
  const [bulkNamesInput, setBulkNamesInput] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, boolean>>({});
  const [newSessionHeldAt, setNewSessionHeldAt] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
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
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug),
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

  const smartDefaultTab = useMemo((): WTab => {
    if (!rosterQuery.data || !sessionsQuery.data) return "attendance";
    const hasToday = sessionsToday.length > 0 || Boolean(rosterQuery.data.summary.todaysSessionId);
    if (hasToday) return "attendance";
    if (rosterQuery.data.summary.pendingFeesCount > 0) return "fees";
    return "students";
  }, [rosterQuery.data, sessionsQuery.data, sessionsToday]);

  const tab: WTab = explicitTabRaw && isWTab(explicitTabRaw) ? explicitTabRaw : smartDefaultTab;

  useEffect(() => {
    autoTabSlugRef.current = null;
  }, [slug]);

  useEffect(() => {
    if (explicitTabRaw && isWTab(explicitTabRaw)) return;
    if (!slug || !rosterQuery.data || !sessionsQuery.data) return;
    if (autoTabSlugRef.current === slug) return;
    autoTabSlugRef.current = slug;
    setSearchParams({ tab: smartDefaultTab }, { replace: true });
  }, [slug, explicitTabRaw, smartDefaultTab, rosterQuery.data, sessionsQuery.data, setSearchParams]);

  useEffect(() => {
    const sessions = sessionsQuery.data?.sessions ?? [];
    const tid = rosterQuery.data?.summary?.todaysSessionId;
    const firstToday = sessionsToday[0]?.id;
    setSelectedSessionId((prev) => {
      if (prev) return prev;
      if (tid && sessions.some((s) => s.id === tid)) return tid;
      if (firstToday && sessions.some((s) => s.id === firstToday)) return firstToday;
      return prev;
    });
  }, [rosterQuery.data?.summary?.todaysSessionId, sessionsQuery.data?.sessions, sessionsToday]);

  useEffect(() => {
    setSelectedSessionId("");
  }, [slug]);

  useEffect(() => {
    if (!attendanceQuery.data) {
      setAttendanceDraft({});
      return;
    }
    const o: Record<string, boolean> = {};
    for (const s of attendanceQuery.data.students) o[s.enrollmentId] = s.present;
    setAttendanceDraft(o);
  }, [attendanceQuery.data]);

  const filteredStudents = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    const list = rosterQuery.data?.students ?? [];
    if (!q) return list;
    return list.filter(
      (s) =>
        s.learner.name.toLowerCase().includes(q) ||
        s.learner.email.toLowerCase().includes(q) ||
        (s.learner.phone?.toLowerCase().includes(q) ?? false),
    );
  }, [rosterQuery.data?.students, rosterSearch]);

  const invalidateRosterish = () => {
    queryClient.invalidateQueries({ queryKey: ["studio-roster", slug] });
    queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
    queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
    queryClient.invalidateQueries({ queryKey: ["studio-analytics"] });
  };

  const regenerateInvite = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/invite/regenerate`, {
        method: "POST",
      });
      return parseJson<{ inviteCode: string }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-invite", slug] });
      toast.success("Invite code rotated");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

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
      toast.success(v.status === "PAID" ? "Marked paid" : "Marked pending", { duration: 2200 });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update fee"),
  });

  const createClassSession = useMutation({
    mutationFn: async () => {
      const heldAt = new Date(newSessionHeldAt);
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions`, {
        method: "POST",
        body: JSON.stringify({ heldAt: heldAt.toISOString() }),
      });
      return parseJson<{ session: { id: string } }>(res);
    },
    onSuccess: (out) => {
      queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
      invalidateRosterish();
      setSelectedSessionId(out.session.id);
      toast.success("Session added");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
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
      toast.success("Session logged — mark attendance");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const saveAttendanceMvp = useMutation({
    mutationFn: async () => {
      const marks = Object.entries(attendanceDraft).map(([enrollmentId, present]) => ({ enrollmentId, present }));
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(selectedSessionId)}/attendance`,
        { method: "PUT", body: JSON.stringify({ marks }) },
      );
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-attendance", slug, selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ["studio-sessions", slug] });
      invalidateRosterish();
      toast.success("Attendance saved");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

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

  const feeDisp = rosterQuery.data?.course.monthlyFeeDisplay ?? "";
  const inviteUrl =
    typeof window !== "undefined" && inviteQuery.data
      ? `${window.location.origin}/join/${inviteQuery.data.inviteCode}`
      : "";

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
              <p className="text-[11px] text-muted-foreground font-body truncate">
                {rosterQuery.data ? (
                  <>
                    {rosterQuery.data.summary.totalStudents} students
                    {feeDisp ? ` · ${feeDisp}` : ""}
                  </>
                ) : (
                  "Loading…"
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {TAB_IDS.map(({ id, label }) => {
              const pendingFees = rosterQuery.data?.summary.pendingFeesCount ?? 0;
              const showFeeDot = id === "fees" && pendingFees > 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "relative shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold font-body transition-all duration-150",
                    tab === id ? "bg-foreground text-background scale-[1.02]" : "bg-muted/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                  {showFeeDot ? (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-4 flex-1">
        {tab === "students" && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground font-body">What to do next</p>
            {inviteUrl ? (
              <Button className="rounded-full h-12 w-full text-base" asChild>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Join my class:\n${inviteUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-2 h-5 w-5 inline" aria-hidden />
                  Share invite on WhatsApp
                </a>
              </Button>
            ) : (
              <Button className="rounded-full h-12 w-full text-base" disabled>
                <MessageCircle className="mr-2 h-5 w-5 inline" aria-hidden />
                Share invite on WhatsApp
              </Button>
            )}

            <div className="rounded-2xl border border-border/60 bg-card/70 p-4 space-y-3">
              <p className="text-xs font-semibold text-foreground">Invite link</p>
              {inviteQuery.isLoading ? <Loader2 className="animate-spin h-5 w-5 text-accent" /> : null}
              {inviteQuery.data ? (
                <>
                  <code className="block text-xs font-mono bg-muted/50 rounded-lg px-3 py-2 break-all">{inviteUrl}</code>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        void navigator.clipboard.writeText(inviteUrl);
                        toast.success("Copied");
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={regenerateInvite.isPending}
                      onClick={() => regenerateInvite.mutate()}
                    >
                      New code
                    </Button>
                  </div>
                </>
              ) : null}
            </div>

            <div className="rounded-2xl border border-dashed border-accent/40 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <UserPlus className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Bulk add</p>
                  <p className="text-[11px] text-muted-foreground font-body mt-1">One email or phone per line (account must exist).</p>
                </div>
              </div>
              <textarea
                className="w-full min-h-[80px] rounded-xl border bg-background p-3 text-sm"
                placeholder="email or phone per line"
                value={bulkEnrollInput}
                onChange={(e) => setBulkEnrollInput(e.target.value)}
              />
              <Button type="button" className="rounded-full" disabled={bulkEnrollMut.isPending} onClick={() => bulkEnrollMut.mutate()}>
                {bulkEnrollMut.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Add to class"}
              </Button>
              <div className="border-t pt-3 space-y-2">
                <p className="text-[11px] font-semibold">Names only → WhatsApp</p>
                <textarea
                  className="w-full min-h-[64px] rounded-xl border bg-background p-3 text-sm"
                  placeholder="One name per line"
                  value={bulkNamesInput}
                  onChange={(e) => setBulkNamesInput(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full"
                  disabled={!inviteQuery.data}
                  onClick={() => {
                    const names = bulkNamesInput.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
                    if (!inviteQuery.data || names.length === 0) {
                      toast.error("Add names and wait for invite link.");
                      return;
                    }
                    const title = rosterQuery.data?.course.title ?? "my class";
                    const body = `Join "${title}":\n${inviteUrl}\n\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
                  }}
                >
                  Open WhatsApp
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                className="w-full rounded-xl border bg-background pl-9 pr-3 py-2.5 text-sm"
                placeholder="Search students"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
              />
            </div>

            {rosterQuery.isLoading ? <Loader2 className="animate-spin text-accent" /> : null}
            <ul className="space-y-3">
              {filteredStudents.map((row) => {
                const first = row.learner.name.split(" ")[0] ?? row.learner.name;
                const title = rosterQuery.data?.course.title ?? "class";
                const feeLine = rosterQuery.data?.course.monthlyFeeDisplay ?? "Monthly fee";
                const waFee = `https://wa.me/?text=${encodeURIComponent(
                  `Hi ${first} — friendly reminder: ${feeLine} for "${title}" (${feeYearMonth}) is still pending. Thank you!`,
                )}`;
                const waQuick = `https://wa.me/?text=${encodeURIComponent(`Hi ${first} — quick note about ${title}.`)}`;
                return (
                  <li
                    key={row.enrollmentId}
                    className={cn(
                      "rounded-2xl border bg-card px-3 py-3 flex flex-col gap-3 transition-shadow",
                      row.feeStatus === "PENDING" && "border-amber-500/40 shadow-[0_0_0_1px_rgba(245,158,11,0.12)]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground font-body">{row.learner.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{row.learner.email}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-[11px] font-bold rounded-full px-2.5 py-1",
                          row.feeStatus === "PAID" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/20 text-amber-900",
                        )}
                      >
                        {row.feeStatus === "PAID" ? "Paid" : "Pending"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {row.feeStatus === "PENDING" ? (
                        <Button type="button" size="sm" className="rounded-full h-10 text-sm bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                          <a href={waFee} target="_blank" rel="noreferrer">
                            <MessageCircle className="mr-1.5 h-4 w-4 inline" />
                            Remind
                          </a>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="rounded-full h-10 text-sm"
                          onClick={() => {
                            setTab("attendance");
                            toast.message("Mark attendance", { description: "Pick today’s session, then tap Present or Absent." });
                          }}
                        >
                          Mark roll
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="outline" className="rounded-full h-10 text-sm" asChild>
                        <a href={waQuick} target="_blank" rel="noreferrer">
                          Message
                        </a>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={row.feeStatus === "PAID" ? "default" : "outline"}
                        className="rounded-full h-10 text-xs"
                        disabled={saveFeeOne.isPending}
                        onClick={() => row.feeStatus !== "PAID" && saveFeeOne.mutate({ enrollmentId: row.enrollmentId, status: "PAID" })}
                      >
                        Paid
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={row.feeStatus === "PENDING" ? "secondary" : "outline"}
                        className="rounded-full h-10 text-xs"
                        disabled={saveFeeOne.isPending}
                        onClick={() => row.feeStatus !== "PENDING" && saveFeeOne.mutate({ enrollmentId: row.enrollmentId, status: "PENDING" })}
                      >
                        Pending
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === "attendance" && (
          <div className="space-y-4 pb-4">
            <div>
              <h2 className="font-heading text-lg text-foreground">Mark attendance for today</h2>
              <p className="text-xs text-muted-foreground font-body mt-1">Tap big buttons — finish in seconds.</p>
            </div>

            {rosterQuery.data && rosterQuery.data.summary.pendingFeesCount > 0 ? (
              <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <p className="text-sm font-semibold text-foreground">
                  {rosterQuery.data.summary.pendingFeesCount} fee{rosterQuery.data.summary.pendingFeesCount === 1 ? "" : "s"} pending
                </p>
                <p className="text-xs text-muted-foreground font-body">Collect or remind in Fees when you’re done here.</p>
                <Button type="button" variant="outline" size="sm" className="rounded-full h-10 w-fit" onClick={() => setTab("fees")}>
                  Go to Fees
                </Button>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="rounded-full h-12 text-sm font-semibold"
                disabled={createClassSessionNow.isPending}
                onClick={() => createClassSessionNow.mutate()}
              >
                <CalendarClock className="mr-2 h-5 w-5 inline" />
                Class happening now
              </Button>
              {sessionsToday[0] ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full h-12 text-sm font-semibold"
                  onClick={() => setSelectedSessionId(sessionsToday[0]!.id)}
                >
                  Use today&apos;s session
                </Button>
              ) : null}
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Add session</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
                value={newSessionHeldAt}
                onChange={(e) => setNewSessionHeldAt(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                disabled={createClassSession.isPending}
                onClick={() => createClassSession.mutate()}
              >
                Add session
              </Button>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Session</label>
              <select
                className="mt-1.5 w-full rounded-xl border bg-background px-3 py-3 text-sm font-medium"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
              >
                <option value="">Select session</option>
                {(sessionsQuery.data?.sessions ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.heldAt).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            {selectedSessionId && attendanceQuery.isLoading ? <Loader2 className="animate-spin text-accent h-6 w-6" /> : null}
            {selectedSessionId && attendanceQuery.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    className="rounded-2xl h-14 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-[0.99] transition-transform"
                    onClick={() => {
                      const next: Record<string, boolean> = {};
                      for (const st of attendanceQuery.data!.students) next[st.enrollmentId] = true;
                      setAttendanceDraft(next);
                      toast.message("Everyone marked present", { description: "Tap Save attendance to record." });
                    }}
                  >
                    Mark all present
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl h-12 text-sm font-semibold border-2 active:scale-[0.99] transition-transform"
                    onClick={() => {
                      const next: Record<string, boolean> = {};
                      for (const st of attendanceQuery.data!.students) next[st.enrollmentId] = false;
                      setAttendanceDraft(next);
                    }}
                  >
                    Mark all absent
                  </Button>
                </div>
                <ul className="space-y-3">
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
                            "rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95",
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
                            "rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95",
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
                <div className="sticky bottom-20 z-30 -mx-1 px-1 pt-2 pb-1 bg-gradient-to-t from-background via-background to-transparent">
                  <Button
                    type="button"
                    className="rounded-2xl h-14 w-full text-base font-bold shadow-lg active:scale-[0.99] transition-transform"
                    disabled={saveAttendanceMvp.isPending || attendanceQuery.data.students.length === 0}
                    onClick={() => saveAttendanceMvp.mutate()}
                  >
                    {saveAttendanceMvp.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Save attendance"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {tab === "fees" && rosterQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-accent h-8 w-8" />
          </div>
        ) : null}
        {tab === "fees" && rosterQuery.data && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3 shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{formatFeeMonthLabel(feeYearMonth)} fees</p>
                  <p className="font-heading text-xl mt-1">Money this month</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-muted/50 py-3 px-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Total</p>
                  <p className="text-lg font-bold tabular-nums">{rosterQuery.data.students.length}</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 py-3 px-2">
                  <p className="text-[10px] font-semibold text-emerald-800 uppercase">Paid</p>
                  <p className="text-lg font-bold tabular-nums text-emerald-700">
                    {rosterQuery.data.students.filter((s) => s.feeStatus === "PAID").length}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-500/15 py-3 px-2">
                  <p className="text-[10px] font-semibold text-amber-900 uppercase">Pending</p>
                  <p className="text-lg font-bold tabular-nums text-amber-900">{rosterQuery.data.summary.pendingFeesCount}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-body">{rosterQuery.data.course.monthlyFeeDisplay} per student · month {feeYearMonth}</p>
              {rosterQuery.data.summary.pendingFeesCount > 0 ? (
                <Button className="rounded-full h-12 w-full text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Reminder: ${rosterQuery.data.course.monthlyFeeDisplay} for "${rosterQuery.data.course.title}" is still pending for ${rosterQuery.data.course.feeMonth}. Thank you!\n\n— ${user?.name ?? "Instructor"}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-2 h-5 w-5 inline" />
                    Remind all
                  </a>
                </Button>
              ) : (
                <p className="text-sm font-medium text-emerald-700 text-center py-2">All caught up for this month.</p>
              )}
            </div>
            <label className="text-xs text-muted-foreground block">Change fee month</label>
            <input
              type="month"
              className="rounded-xl border bg-background px-3 py-2.5 text-sm w-full max-w-[14rem]"
              value={feeYearMonth}
              onChange={(e) => setFeeYearMonth(e.target.value)}
            />
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
                      "rounded-xl border px-3 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                      row.feeStatus === "PENDING" && "border-amber-500/35 bg-amber-500/[0.06]",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{row.learner.name}</p>
                      <p className={cn("text-xs font-bold", row.feeStatus === "PAID" ? "text-emerald-600" : "text-amber-800")}>
                        {row.feeStatus === "PAID" ? "Paid" : "Pending"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {row.feeStatus === "PENDING" ? (
                        <Button type="button" size="sm" variant="secondary" className="rounded-full h-9 text-xs" asChild>
                          <a href={waOne} target="_blank" rel="noreferrer">
                            Remind
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant={row.feeStatus === "PAID" ? "default" : "outline"}
                        className="rounded-full h-9 text-xs"
                        disabled={saveFeeOne.isPending}
                        onClick={() => row.feeStatus !== "PAID" && saveFeeOne.mutate({ enrollmentId: row.enrollmentId, status: "PAID" })}
                      >
                        Paid
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full h-9 text-xs"
                        disabled={saveFeeOne.isPending}
                        onClick={() => row.feeStatus !== "PENDING" && saveFeeOne.mutate({ enrollmentId: row.enrollmentId, status: "PENDING" })}
                      >
                        Pending
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === "announce" && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground font-body">Message your class</p>
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
              Email learners (SMTP)
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
            <ul className="space-y-2 pt-4">
              {studioAnnouncementsQuery.data?.announcements.map((a) => (
                <li key={a.id} className="rounded-xl border p-3 text-sm">
                  {a.title ? <p className="font-medium">{a.title}</p> : null}
                  <p className="text-xs text-muted-foreground">{a.author.name} · {new Date(a.createdAt).toLocaleString()}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{a.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorClassWorkspacePage;
