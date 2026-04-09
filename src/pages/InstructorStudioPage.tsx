import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Info,
  Link2,
  Loader2,
  Megaphone,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { courseCoverSrc } from "@/lib/courseImages";
import { Button } from "@/components/ui/button";
import { mvpInstructorFocus } from "@/lib/productFocus";

const IMAGE_KEYS = [
  "hero-pottery",
  "hero-painting",
  "hero-floristry",
  "category-baking",
  "category-woodworking",
  "category-watercolor",
  "category-sewing",
  "category-music",
] as const;

type StudioLesson = {
  id: string;
  title: string;
  durationMin: number;
  preview: boolean;
  videoUrl: string | null;
  sortOrder: number;
};

type StudioSection = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: StudioLesson[];
};

type StudioCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  format: "ONLINE" | "IN_PERSON";
  city: string | null;
  durationLabel: string;
  priceCents: number;
  priceDisplay: string;
  outcomes: string | null;
  imageKey: string;
  coverImageUrl: string | null;
  published: boolean;
  sections: StudioSection[];
};

type EditDraft = {
  title: string;
  category: string;
  format: "ONLINE" | "IN_PERSON";
  city: string;
  durationLabel: string;
  priceInr: number;
  description: string;
  outcomes: string;
  imageKey: string;
};

async function uploadMediaFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch("/api/uploads", { method: "POST", body: fd });
  const data = await parseJson<{ url: string }>(res);
  return data.url;
}

const InstructorStudioPage = () => {
  const { user, ready, token } = useAuth();
  const queryClient = useQueryClient();
  const [profileName, setProfileName] = useState("");
  const [profileSpecialty, setProfileSpecialty] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("Art & Craft");
  const [courseFormat, setCourseFormat] = useState<"ONLINE" | "IN_PERSON">("ONLINE");
  const [courseCity, setCourseCity] = useState("Mumbai");
  const [courseDuration, setCourseDuration] = useState("4 weeks");
  const [coursePrice, setCoursePrice] = useState(2499);
  const [courseImageKey, setCourseImageKey] = useState("hero-pottery");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseOutcomes, setCourseOutcomes] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonMin, setNewLessonMin] = useState(10);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [editingSlug, setEditingSlug] = useState("");
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [rosterCourseSlug, setRosterCourseSlug] = useState("");
  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>({});
  const [lessonFields, setLessonFields] = useState<
    Record<string, { title: string; durationMin: number; preview: boolean }>
  >({});
  const [courseCoverUrl, setCourseCoverUrl] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [lessonVideoDraft, setLessonVideoDraft] = useState<Record<string, string>>({});
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [toolTab, setToolTab] = useState<"roster" | "announce" | "discussion" | "assign" | "payout">("roster");
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announceEmailLearners, setAnnounceEmailLearners] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDescription, setAssignDescription] = useState("");
  const [assignDueAt, setAssignDueAt] = useState("");
  const [viewSubmissionsAssignmentId, setViewSubmissionsAssignmentId] = useState("");
  const [payoutAmountInr, setPayoutAmountInr] = useState(1);
  const [payoutNote, setPayoutNote] = useState("");
  const [taxLegalName, setTaxLegalName] = useState("");
  const [taxPanLast4, setTaxPanLast4] = useState("");
  const [taxGstin, setTaxGstin] = useState("");
  const [studioAnswerDraft, setStudioAnswerDraft] = useState<Record<string, string>>({});
  const taxHydratedRef = useRef(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [feeYearMonth, setFeeYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [newSessionHeldAt, setNewSessionHeldAt] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, boolean>>({});
  const [rosterSearch, setRosterSearch] = useState("");
  const [bulkEnrollInput, setBulkEnrollInput] = useState("");
  const [bulkNamesInput, setBulkNamesInput] = useState("");
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const mvpFocus = mvpInstructorFocus();

  useEffect(() => {
    const tool = searchParams.get("tool");
    if (tool === "roster" || tool === "announce" || tool === "discussion" || tool === "assign" || tool === "payout") {
      setToolTab(tool);
    }
  }, [searchParams]);

  useEffect(() => {
    if (location.pathname !== "/instructor/studio" || !location.hash) return;
    const id = location.hash.replace(/^#/, "");
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (searchParams.get("setup") !== "1") return;
    const t = window.setTimeout(() => {
      document.getElementById("studio-create-class")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  useEffect(() => {
    if (mvpFocus && toolTab === "assign") setToolTab("roster");
  }, [mvpFocus, toolTab]);

  const profileQuery = useQuery({
    queryKey: ["instructor-profile"],
    enabled: Boolean(token && user?.role === "INSTRUCTOR"),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/profile");
      return parseJson<{ profile: { name: string; specialty: string | null } }>(res);
    },
  });

  const onboardingQuery = useQuery({
    queryKey: ["onboarding-me"],
    enabled: Boolean(token && user?.role === "INSTRUCTOR"),
    queryFn: async () => {
      const res = await apiFetch("/api/onboarding/me");
      return parseJson<{
        profile: {
          instructor?: {
            courseDraft?: {
              title: string;
              category: string;
              format: "ONLINE" | "IN_PERSON";
              durationLabel: string;
              priceInr?: number;
              description: string;
              outcomes: string;
              imageKey?: string;
            };
          };
        } | null;
      }>(res);
    },
  });

  const draftPrefillDone = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["studio-courses"],
    enabled: Boolean(token && user?.role === "INSTRUCTOR"),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/courses");
      return parseJson<{ courses: StudioCourse[] }>(res);
    },
  });

  const analyticsQuery = useQuery({
    queryKey: ["studio-analytics"],
    enabled: Boolean(token && user?.role === "INSTRUCTOR"),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/analytics");
      return parseJson<{
        courses: Array<{
          slug: string;
          title: string;
          published: boolean;
          enrollmentCount: number;
          totalLessons: number;
          avgCompletionPercent: number;
        }>;
        totals?: { enrollments: number; classes: number };
      }>(res);
    },
  });

  const growthEnrollmentCount = useMemo(() => {
    const rows = analyticsQuery.data?.courses;
    if (rows?.length) return rows.reduce((n, c) => n + c.enrollmentCount, 0);
    return analyticsQuery.data?.totals?.enrollments ?? 0;
  }, [analyticsQuery.data]);

  const rosterQuery = useQuery({
    queryKey: ["studio-roster", rosterCourseSlug, feeYearMonth],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && rosterCourseSlug && feeYearMonth),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/roster?feeMonth=${encodeURIComponent(feeYearMonth)}`,
      );
      return parseJson<{
        course: {
          title: string;
          slug: string;
          monthlyFeeDisplay: string;
          feeMonth: string;
        };
        summary: {
          totalStudents: number;
          presentTodayCount: number;
          pendingFeesCount: number;
          todaysSessionId: string | null;
        };
        students: Array<{
          enrollmentId: string;
          enrolledAt: string;
          feeStatus: "PAID" | "PENDING";
          learner: { id: string; name: string; email: string; phone: string | null };
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

  const studioAnnouncementsQuery = useQuery({
    queryKey: ["studio-announcements", rosterCourseSlug],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && rosterCourseSlug),
    queryFn: async () => {
      const res = await apiFetch(`/api/course-engagement/${encodeURIComponent(rosterCourseSlug)}/announcements`);
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

  const studioAssignmentsQuery = useQuery({
    queryKey: ["studio-assignments", rosterCourseSlug],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && rosterCourseSlug),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/assignments`);
      return parseJson<{
        assignments: Array<{
          id: string;
          title: string;
          description: string;
          dueAt: string | null;
          submissionCount: number;
          createdAt: string;
        }>;
      }>(res);
    },
  });

  const toolQuestionsQuery = useQuery({
    queryKey: ["studio-tool-questions", rosterCourseSlug],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && rosterCourseSlug),
    queryFn: async () => {
      const res = await apiFetch(`/api/course-engagement/${encodeURIComponent(rosterCourseSlug)}/questions`);
      return parseJson<{
        questions: Array<{
          id: string;
          body: string;
          createdAt: string;
          author: { id: string; name: string };
          answer: string | null;
          answeredAt: string | null;
          answeredBy: { id: string; name: string } | null;
        }>;
        isInstructor: boolean;
      }>(res);
    },
  });

  const payoutSummaryQuery = useQuery({
    queryKey: ["studio-payout-summary"],
    enabled: Boolean(token && user?.role === "INSTRUCTOR"),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/payouts/summary");
      return parseJson<{
        demoNote: string;
        enrollmentCount: number;
        accruedDisplay: string;
        paidOutDisplay: string;
        pendingHoldDisplay: string;
        availablePaise: number;
        availableDisplay: string;
        taxProfile: { legalName: string | null; panLast4: string | null; gstin: string | null } | null;
        requests: Array<{
          id: string;
          amountDisplay: string;
          status: string;
          instructorNote: string | null;
          adminNote: string | null;
          createdAt: string;
        }>;
      }>(res);
    },
  });

  const subsQuery = useQuery({
    queryKey: ["studio-assignment-subs", viewSubmissionsAssignmentId],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && viewSubmissionsAssignmentId),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/instructor-studio/assignments/${encodeURIComponent(viewSubmissionsAssignmentId)}/submissions`,
      );
      return parseJson<{
        assignment: { id: string; title: string; course: { slug: string; title: string } };
        submissions: Array<{ user: { name: string; email: string }; content: string; updatedAt: string }>;
      }>(res);
    },
  });

  const inviteQuery = useQuery({
    queryKey: ["studio-invite", rosterCourseSlug],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && rosterCourseSlug),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/invite`);
      return parseJson<{ inviteCode: string }>(res);
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ["studio-sessions", rosterCourseSlug],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && rosterCourseSlug),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/sessions`);
      return parseJson<{
        sessions: Array<{
          id: string;
          heldAt: string;
          label: string | null;
          presentCount: number;
          totalMarked: number;
        }>;
      }>(res);
    },
  });

  const subSummaryQuery = useQuery({
    queryKey: ["instructor-subscription-summary"],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && mvpFocus),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/subscription-summary");
      return parseJson<{
        planTier: string;
        trialActive: boolean;
        trialEndsAt: string | null;
        trialDays: number;
        distinctLearnerCount: number;
        freeLearnerCap: number;
        capEnforced: boolean;
        capReached: boolean;
        paid: boolean;
        monthlyPriceDisplay: string;
        upgradeNote: string;
        checkoutLive?: boolean;
      }>(res);
    },
  });

  const instructorDashQuery = useQuery({
    queryKey: ["instructor-dashboard-today"],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && mvpFocus),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/dashboard-today");
      return parseJson<{
        sessionsToday: number;
        pendingAttendanceCount: number;
        pendingFeesCount: number;
        feeMonth: string;
        alerts?: Array<{ id: string; kind: string; message: string; severity: "info" | "warning" }>;
      }>(res);
    },
    staleTime: 45_000,
  });

  const alertsStorageKey = `hi-dismiss-alerts-${new Date().toISOString().slice(0, 10)}`;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(alertsStorageKey);
      if (raw) setDismissedAlertIds(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, [alertsStorageKey]);

  const visibleInstructorAlerts = useMemo(() => {
    return (instructorDashQuery.data?.alerts ?? []).filter((a) => !dismissedAlertIds.includes(a.id));
  }, [instructorDashQuery.data?.alerts, dismissedAlertIds]);

  const dismissInstructorAlert = (id: string) => {
    setDismissedAlertIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        sessionStorage.setItem(alertsStorageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

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

  useEffect(() => {
    const tid = rosterQuery.data?.summary?.todaysSessionId;
    const sessions = sessionsQuery.data?.sessions ?? [];
    if (!tid || !sessions.some((s) => s.id === tid)) return;
    setSelectedSessionId((prev) => prev || tid);
  }, [rosterQuery.data?.summary?.todaysSessionId, sessionsQuery.data?.sessions]);

  const attendanceQuery = useQuery({
    queryKey: ["studio-attendance", rosterCourseSlug, selectedSessionId],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && rosterCourseSlug && selectedSessionId),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/sessions/${encodeURIComponent(selectedSessionId)}/attendance`,
      );
      return parseJson<{ students: Array<{ enrollmentId: string; name: string; present: boolean }> }>(res);
    },
  });

  useEffect(() => {
    setViewSubmissionsAssignmentId("");
  }, [rosterCourseSlug]);

  useEffect(() => {
    setSelectedSessionId("");
  }, [rosterCourseSlug]);

  useEffect(() => {
    if (!attendanceQuery.data) {
      setAttendanceDraft({});
      return;
    }
    const o: Record<string, boolean> = {};
    for (const s of attendanceQuery.data.students) o[s.enrollmentId] = s.present;
    setAttendanceDraft(o);
  }, [attendanceQuery.data]);

  useEffect(() => {
    if (taxHydratedRef.current || !payoutSummaryQuery.data) return;
    taxHydratedRef.current = true;
    const tp = payoutSummaryQuery.data.taxProfile;
    setTaxLegalName(tp?.legalName ?? "");
    setTaxPanLast4(tp?.panLast4 ?? "");
    setTaxGstin(tp?.gstin ?? "");
  }, [payoutSummaryQuery.data]);

  const courses = data?.courses ?? [];
  const filteredRosterStudents = useMemo(() => {
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
  const sectionOptions = useMemo(
    () => courses.find((c) => c.slug === selectedCourseSlug)?.sections ?? [],
    [courses, selectedCourseSlug],
  );

  const applyAnnouncePreset = (k: "update" | "cancel" | "fee") => {
    const t =
      rosterQuery.data?.course.title ??
      courses.find((c) => c.slug === rosterCourseSlug)?.title ??
      "our class";
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

  useEffect(() => {
    const st: Record<string, string> = {};
    const lf: Record<string, { title: string; durationMin: number; preview: boolean }> = {};
    for (const c of courses) {
      for (const s of c.sections) {
        st[s.id] = s.title;
        for (const l of s.lessons) {
          lf[l.id] = { title: l.title, durationMin: l.durationMin, preview: l.preview };
        }
      }
    }
    setSectionTitles(st);
    setLessonFields(lf);
  }, [courses]);

  useEffect(() => {
    if (!editingSlug) {
      setEditDraft(null);
      return;
    }
    const c = courses.find((x) => x.slug === editingSlug);
    if (!c) return;
    setEditDraft({
      title: c.title,
      category: c.category,
      format: c.format,
      city: c.city ?? "",
      durationLabel: c.durationLabel,
      priceInr: Math.max(99, Math.round(c.priceCents / 100)),
      description: c.description,
      outcomes: c.outcomes ?? "",
      imageKey: c.imageKey,
    });
  }, [editingSlug, courses]);

  const classFromUrl = searchParams.get("class");
  const focusInvite = searchParams.get("focusInvite") === "1";

  useEffect(() => {
    if (courses.length === 0) {
      setRosterCourseSlug("");
      return;
    }
    if (classFromUrl && courses.some((c) => c.slug === classFromUrl)) {
      setRosterCourseSlug(classFromUrl);
      return;
    }
    if (!rosterCourseSlug || !courses.some((c) => c.slug === rosterCourseSlug)) {
      setRosterCourseSlug(courses[0]!.slug);
    }
  }, [courses, rosterCourseSlug, classFromUrl]);

  const invalidateStudio = () => {
    queryClient.invalidateQueries({ queryKey: ["studio-courses"] });
    queryClient.invalidateQueries({ queryKey: ["studio-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["studio-roster"] });
    queryClient.invalidateQueries({ queryKey: ["studio-assignments"] });
    queryClient.invalidateQueries({ queryKey: ["studio-payout-summary"] });
    queryClient.invalidateQueries({ queryKey: ["classroom-assignments"] });
    queryClient.invalidateQueries({ queryKey: ["classroom-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["instructor-subscription-summary"] });
  };

  const addSection = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/instructor-studio/sections", {
        method: "POST",
        body: JSON.stringify({ courseSlug: selectedCourseSlug, title: newSectionTitle }),
      });
      await parseJson<{ section: { id: string } }>(res);
    },
    onSuccess: () => {
      setNewSectionTitle("");
      invalidateStudio();
      toast.success("Section added");
    },
  });

  const addLesson = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/instructor-studio/lessons", {
        method: "POST",
        body: JSON.stringify({ sectionId: selectedSectionId, title: newLessonTitle, durationMin: Number(newLessonMin) }),
      });
      await parseJson<{ lesson: { id: string } }>(res);
    },
    onSuccess: () => {
      setNewLessonTitle("");
      invalidateStudio();
      toast.success("Lesson added");
    },
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/instructor-studio/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: profileName, specialty: profileSpecialty }),
      });
      await parseJson<{ profile: { id: string } }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-profile"] });
      toast.success("Profile updated");
    },
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/instructor-studio/courses", {
        method: "POST",
        body: JSON.stringify({
          title: courseTitle,
          category: courseCategory,
          format: courseFormat,
          city: courseFormat === "ONLINE" ? null : courseCity,
          durationLabel: courseDuration,
          priceInr: Number(coursePrice),
          description: courseDescription,
          outcomes: courseOutcomes,
          imageKey: courseImageKey,
          coverImageUrl: courseCoverUrl || undefined,
          published: false,
        }),
      });
      await parseJson<{ course: { id: string; slug: string } }>(res);
    },
    onSuccess: () => {
      setCourseTitle("");
      setCourseDescription("");
      setCourseOutcomes("");
      setCourseCoverUrl("");
      invalidateStudio();
      toast.success("Course created");
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ slug, payload }: { slug: string; payload: Record<string, unknown> }) => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await parseJson<{ course: { id: string } }>(res);
    },
    onSuccess: () => {
      invalidateStudio();
      toast.success("Class updated");
    },
  });

  const patchLessonVideo = useMutation({
    mutationFn: async ({ lessonId, videoUrl }: { lessonId: string; videoUrl: string | null }) => {
      const res = await apiFetch(`/api/instructor-studio/lessons/${lessonId}`, {
        method: "PATCH",
        body: JSON.stringify({ videoUrl }),
      });
      await parseJson<{ lesson: { id: string } }>(res);
    },
    onSuccess: () => {
      invalidateStudio();
      toast.success("Lesson video updated");
    },
    onError: (e: Error) => toast.error(e.message || "Could not update lesson"),
  });

  const patchLessonMeta = useMutation({
    mutationFn: async ({
      lessonId,
      title,
      durationMin,
      preview,
    }: {
      lessonId: string;
      title: string;
      durationMin: number;
      preview: boolean;
    }) => {
      const res = await apiFetch(`/api/instructor-studio/lessons/${lessonId}`, {
        method: "PATCH",
        body: JSON.stringify({ title, durationMin, preview }),
      });
      await parseJson<{ lesson: { id: string } }>(res);
    },
    onSuccess: () => {
      invalidateStudio();
      toast.success("Lesson saved");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save lesson"),
  });

  const patchSectionTitle = useMutation({
    mutationFn: async ({ sectionId, title }: { sectionId: string; title: string }) => {
      const res = await apiFetch(`/api/instructor-studio/sections/${sectionId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      invalidateStudio();
      toast.success("Section title saved");
    },
  });

  const moveSection = useMutation({
    mutationFn: async ({ sectionId, direction }: { sectionId: string; direction: "up" | "down" }) => {
      const res = await apiFetch(`/api/instructor-studio/sections/${sectionId}/move`, {
        method: "POST",
        body: JSON.stringify({ direction }),
      });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => invalidateStudio(),
    onError: (e: Error) => toast.error(e.message || "Could not reorder"),
  });

  const moveLesson = useMutation({
    mutationFn: async ({ lessonId, direction }: { lessonId: string; direction: "up" | "down" }) => {
      const res = await apiFetch(`/api/instructor-studio/lessons/${lessonId}/move`, {
        method: "POST",
        body: JSON.stringify({ direction }),
      });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => invalidateStudio(),
    onError: (e: Error) => toast.error(e.message || "Could not reorder"),
  });

  const deleteSection = useMutation({
    mutationFn: async (sectionId: string) => {
      const res = await apiFetch(`/api/instructor-studio/sections/${sectionId}`, { method: "DELETE" });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      invalidateStudio();
      toast.success("Section removed");
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete"),
  });

  const deleteLesson = useMutation({
    mutationFn: async (lessonId: string) => {
      const res = await apiFetch(`/api/instructor-studio/lessons/${lessonId}`, { method: "DELETE" });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      invalidateStudio();
      toast.success("Lesson removed");
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete"),
  });

  const postAnnouncement = useMutation({
    mutationFn: async () => {
      if (!rosterCourseSlug) throw new Error("Pick a class first");
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/announcements`, {
        method: "POST",
        body: JSON.stringify({
          title: announceTitle.trim() || undefined,
          body: announceBody.trim(),
          emailLearners: announceEmailLearners,
        }),
      });
      return parseJson<{
        email?: { attempted?: boolean; ok?: boolean; skipped?: string; error?: string };
      }>(res);
    },
    onSuccess: (out) => {
      setAnnounceTitle("");
      setAnnounceBody("");
      setAnnounceEmailLearners(false);
      queryClient.invalidateQueries({ queryKey: ["studio-announcements", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["classroom-announcements", rosterCourseSlug] });
      const em = out.email;
      if (em?.attempted && em.ok) toast.success("Announcement posted and emailed");
      else if (em?.skipped) toast.success(`Posted. ${em.skipped}`);
      else if (em?.error) {
        toast.success("Announcement posted");
        toast.error(em.error);
      } else toast.success("Announcement posted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to post"),
  });

  const postAnnouncementShareWhatsApp = async () => {
    if (!rosterCourseSlug || announceBody.trim().length < 10) {
      toast.error("Write your message (10+ characters) first.");
      return;
    }
    const title = announceTitle.trim();
    const body = announceBody.trim();
    try {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/announcements`, {
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
      queryClient.invalidateQueries({ queryKey: ["studio-announcements", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["classroom-announcements", rosterCourseSlug] });
      const waText = `${title ? `${title}\n\n` : ""}${body}\n\n— Shared from Hobby of Interest (students also see this in Classroom).`;
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank", "noopener,noreferrer");
      toast.success("Posted in app — WhatsApp opened to share with your batch");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post");
    }
  };

  const createStudioAssignment = useMutation({
    mutationFn: async () => {
      if (!rosterCourseSlug) throw new Error("Pick a class first");
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/assignments`, {
        method: "POST",
        body: JSON.stringify({
          title: assignTitle.trim(),
          description: assignDescription.trim(),
          dueAt: assignDueAt.trim() || null,
        }),
      });
      await parseJson<{ assignment: { id: string } }>(res);
    },
    onSuccess: () => {
      setAssignTitle("");
      setAssignDescription("");
      setAssignDueAt("");
      queryClient.invalidateQueries({ queryKey: ["studio-assignments", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["classroom-assignments", rosterCourseSlug] });
      toast.success("Assignment created");
    },
    onError: (e: Error) => toast.error(e.message || "Could not create assignment"),
  });

  const deleteStudioAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await apiFetch(`/api/instructor-studio/assignments/${encodeURIComponent(assignmentId)}`, {
        method: "DELETE",
      });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      setViewSubmissionsAssignmentId("");
      queryClient.invalidateQueries({ queryKey: ["studio-assignments", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["classroom-assignments", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["studio-assignment-subs"] });
      toast.success("Assignment removed");
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete"),
  });

  const answerStudioQuestion = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      if (!rosterCourseSlug) throw new Error("Pick a class first");
      const res = await apiFetch(
        `/api/course-engagement/${encodeURIComponent(rosterCourseSlug)}/questions/${encodeURIComponent(questionId)}`,
        { method: "PATCH", body: JSON.stringify({ answer }) },
      );
      await parseJson<{ question: { id: string } }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-tool-questions", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["classroom-questions", rosterCourseSlug] });
      toast.success("Reply saved");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save reply"),
  });

  const saveTaxProfile = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/instructor-studio/payouts/tax-profile", {
        method: "PATCH",
        body: JSON.stringify({
          legalName: taxLegalName.trim() || null,
          panLast4: taxPanLast4.trim() || null,
          gstin: taxGstin.trim() || null,
        }),
      });
      return parseJson<{ taxProfile: { legalName: string | null; panLast4: string | null; gstin: string | null } }>(res);
    },
    onSuccess: (data) => {
      const tp = data.taxProfile;
      setTaxLegalName(tp.legalName ?? "");
      setTaxPanLast4(tp.panLast4 ?? "");
      setTaxGstin(tp.gstin ?? "");
      queryClient.invalidateQueries({ queryKey: ["studio-payout-summary"] });
      toast.success("Tax profile saved");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  const requestPayout = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/instructor-studio/payouts/request", {
        method: "POST",
        body: JSON.stringify({
          amountInr: Math.round(Number(payoutAmountInr)),
          note: payoutNote.trim() || undefined,
        }),
      });
      await parseJson<{ request: { id: string } }>(res);
    },
    onSuccess: () => {
      setPayoutNote("");
      queryClient.invalidateQueries({ queryKey: ["studio-payout-summary"] });
      toast.success("Payout request submitted");
    },
    onError: (e: Error) => toast.error(e.message || "Request failed"),
  });

  const regenerateInvite = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/invite/regenerate`, {
        method: "POST",
      });
      return parseJson<{ inviteCode: string }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-invite", rosterCourseSlug] });
      toast.success("Invite code rotated");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const createClassSession = useMutation({
    mutationFn: async () => {
      const heldAt = new Date(newSessionHeldAt);
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/sessions`, {
        method: "POST",
        body: JSON.stringify({ heldAt: heldAt.toISOString() }),
      });
      return parseJson<{ session: { id: string } }>(res);
    },
    onSuccess: (out) => {
      queryClient.invalidateQueries({ queryKey: ["studio-sessions", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["studio-roster", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
      setSelectedSessionId(out.session.id);
      toast.success("Session added — tap Present/Absent below");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const createClassSessionNow = useMutation({
    mutationFn: async () => {
      if (!rosterCourseSlug) throw new Error("Pick a class first");
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/sessions`, {
        method: "POST",
        body: JSON.stringify({ heldAt: new Date().toISOString() }),
      });
      return parseJson<{ session: { id: string } }>(res);
    },
    onSuccess: (out) => {
      queryClient.invalidateQueries({ queryKey: ["studio-sessions", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["studio-roster", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
      setSelectedSessionId(out.session.id);
      toast.success("Logged class now — mark attendance");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const saveAttendanceMvp = useMutation({
    mutationFn: async () => {
      const marks = Object.entries(attendanceDraft).map(([enrollmentId, present]) => ({ enrollmentId, present }));
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/sessions/${encodeURIComponent(selectedSessionId)}/attendance`,
        { method: "PUT", body: JSON.stringify({ marks }) },
      );
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-attendance", rosterCourseSlug, selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ["studio-sessions", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["studio-roster", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
      toast.success("Attendance saved");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const bulkEnrollMut = useMutation({
    mutationFn: async () => {
      if (!rosterCourseSlug) throw new Error("Pick a class first");
      const lines = bulkEnrollInput.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) throw new Error("Paste one email or phone number per line");
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/roster/bulk-enroll`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines }),
        },
      );
      return parseJson<{
        enrolled: string[];
        alreadyEnrolled: string[];
        notFound: string[];
        invalidFormat: string[];
        blocked: Array<{ line: string; message: string }>;
        skippedDuplicate: string[];
      }>(res);
    },
    onSuccess: (out) => {
      setBulkEnrollInput("");
      queryClient.invalidateQueries({ queryKey: ["studio-roster", rosterCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
      queryClient.invalidateQueries({ queryKey: ["studio-analytics"] });
      const parts = [
        out.enrolled.length ? `${out.enrolled.length} added` : "",
        out.alreadyEnrolled.length ? `${out.alreadyEnrolled.length} already in class` : "",
        out.notFound.length ? `${out.notFound.length} no matching account` : "",
        out.invalidFormat.length ? `${out.invalidFormat.length} invalid lines` : "",
        out.blocked.length ? `${out.blocked.length} blocked (plan/cap)` : "",
      ].filter(Boolean);
      toast.success(parts.length ? parts.join(" · ") : "No changes");
    },
    onError: (e: Error) => toast.error(e.message || "Bulk add failed"),
  });

  const saveFeeOne = useMutation({
    mutationFn: async ({ enrollmentId, status }: { enrollmentId: string; status: "PAID" | "PENDING" }) => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(rosterCourseSlug)}/fees/${encodeURIComponent(feeYearMonth)}`,
        { method: "PUT", body: JSON.stringify({ rows: [{ enrollmentId, status }] }) },
      );
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-roster", rosterCourseSlug, feeYearMonth] });
      queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update fee"),
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    if (!profileName) setProfileName(profileQuery.data.profile.name ?? "");
    if (!profileSpecialty) setProfileSpecialty(profileQuery.data.profile.specialty ?? "");
  }, [profileQuery.data, profileName, profileSpecialty]);

  useEffect(() => {
    if (draftPrefillDone.current) return;
    const draft = onboardingQuery.data?.profile?.instructor?.courseDraft;
    if (!draft) return;
    draftPrefillDone.current = true;
    setCourseTitle(draft.title);
    setCourseCategory(draft.category);
    setCourseFormat(draft.format);
    if (draft.format === "IN_PERSON") setCourseCity((prev) => prev || "Mumbai");
    setCourseDuration(draft.durationLabel);
    if (typeof draft.priceInr === "number") setCoursePrice(draft.priceInr);
    setCourseDescription(draft.description);
    setCourseOutcomes(draft.outcomes);
    if (draft.imageKey) setCourseImageKey(draft.imageKey);
  }, [onboardingQuery.data]);

  const saveFullClass = () => {
    if (!editingSlug || !editDraft) return;
    const d = editDraft;
    if (d.title.trim().length < 4 || d.description.trim().length < 20 || d.outcomes.trim().length < 10) {
      toast.error("Check title, description (20+ chars), and outcomes (10+ chars).");
      return;
    }
    updateCourse.mutate({
      slug: editingSlug,
      payload: {
        title: d.title.trim(),
        category: d.category.trim(),
        format: d.format,
        city: d.format === "ONLINE" ? null : d.city.trim() || "Mumbai",
        durationLabel: d.durationLabel.trim(),
        priceInr: d.priceInr,
        description: d.description.trim(),
        outcomes: d.outcomes.trim(),
        imageKey: d.imageKey,
      },
    });
  };

  const scrollToCreateClass = () => {
    document.getElementById("studio-create-class")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!ready) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
      </main>
    );
  }
  if (!token) return <Navigate to="/login?next=/instructor/home" replace />;
  if (user?.role !== "INSTRUCTOR") return <main className="container mx-auto py-20">Instructor access only.</main>;

  const isAdmin = user.email?.toLowerCase() === "admin@demo.com";

  return (
    <main className="container mx-auto py-16 pb-24">
      {mvpFocus ? (
        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/25 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/instructor/home"
            className="text-sm font-medium text-accent hover:underline font-body"
          >
            ← Teaching app (Home)
          </Link>
          <p className="text-xs text-muted-foreground font-body sm:text-right">Listings &amp; lessons here — daily teaching uses the app tabs.</p>
        </div>
      ) : null}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">{mvpFocus ? "Your classes & students" : "Manage content"}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl font-body leading-relaxed">
            {mvpFocus ? (
              <>Create classes, publish lessons, and manage invites. For attendance and fees, use <span className="text-foreground/90">Home</span> and <span className="text-foreground/90">Classes</span> in the teaching app.</>
            ) : (
              <>
                Secondary workspace for listings, curriculum, and media — open when you need to publish or restructure. Day-to-day roster, invites,
                and class work live under <span className="text-foreground/90">Teaching home</span> and each class. Teaching tools here cover announcements, Q&amp;A, assignments, and demo payouts; learners use Classroom from their enrollments.
              </>
            )}
          </p>
        </div>
        {isAdmin ? (
          <Link
            to="/admin/moderation"
            className="inline-flex items-center gap-2 shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-body hover:bg-muted/50 transition-colors"
          >
            <Shield size={16} className="text-accent" />
            Moderation (admin)
          </Link>
        ) : null}
      </div>

      {mvpFocus && visibleInstructorAlerts.length > 0 ? (
        <div className="mt-5 space-y-2" role="status" aria-live="polite">
          {visibleInstructorAlerts.map((a) => (
            <div
              key={a.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-500/45 bg-amber-500/[0.12] px-4 py-3"
            >
              <p className="text-sm font-body text-foreground flex-1 min-w-0">{a.message}</p>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button variant="outline" size="sm" className="rounded-full" asChild>
                  <Link to="/instructor/classes">Open roster</Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground"
                  onClick={() => dismissInstructorAlert(a.id)}
                >
                  Dismiss today
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {mvpFocus && (data?.courses?.length ?? 0) > 0 ? (
        <div
          className={`mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border px-4 py-4 sm:px-5 ${
            !analyticsQuery.isPending && growthEnrollmentCount === 0
              ? "border-2 border-accent/50 bg-gradient-to-r from-accent/18 to-card/80"
              : "border-accent/35 bg-gradient-to-r from-accent/12 to-card/80"
          }`}
        >
          <div className="min-w-0">
            <p className="font-heading text-base text-foreground">
              {!analyticsQuery.isPending && growthEnrollmentCount === 0
                ? "0 students yet — invite your first student to begin"
                : "Invite more students to grow your class"}
            </p>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {analyticsQuery.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden />
                  Loading student count…
                </span>
              ) : growthEnrollmentCount === 0 ? (
                <>Your class is live; activation starts when someone joins via your invite link.</>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{growthEnrollmentCount}</span>{" "}
                  {growthEnrollmentCount === 1 ? "student has" : "students have"} joined across your classes. Share your link on WhatsApp anytime.
                </>
              )}
            </p>
          </div>
          <Button variant="secondary" className="rounded-full shrink-0" asChild>
            <Link to="/instructor/classes">Open invite</Link>
          </Button>
        </div>
      ) : null}

      {mvpFocus && subSummaryQuery.data ? (
        <div
          className={`mt-6 rounded-2xl border p-5 md:p-6 ${
            subSummaryQuery.data.capReached ? "border-destructive/40 bg-destructive/5" : "border-accent/35 bg-accent/5"
          }`}
        >
          <p className="font-heading text-lg text-foreground">
            {subSummaryQuery.data.paid
              ? "Your plan"
              : subSummaryQuery.data.trialActive
                ? `Free trial — unlimited students for ${subSummaryQuery.data.trialDays} days`
                : subSummaryQuery.data.capReached
                  ? `Free limit reached (${subSummaryQuery.data.freeLearnerCap} students)`
                  : "Free tier"}
          </p>
          <p className="text-sm text-muted-foreground mt-2 font-body leading-relaxed">
            {subSummaryQuery.data.paid ? (
              <>
                You’re on <span className="text-foreground font-medium">{subSummaryQuery.data.planTier.replace(/_/g, " ")}</span> — no
                student cap from this check.
              </>
            ) : subSummaryQuery.data.trialActive ? (
              <>
                After your trial ends, stay on free for up to{" "}
                <span className="text-foreground font-medium">{subSummaryQuery.data.freeLearnerCap}</span> unique students, or upgrade to{" "}
                <span className="text-foreground font-medium">{subSummaryQuery.data.monthlyPriceDisplay}</span> for higher limits
                {subSummaryQuery.data.checkoutLive ? " (Razorpay in Settings)." : " (see note below when checkout is not live)."}
              </>
            ) : subSummaryQuery.data.capReached ? (
              <>
                <span className="text-foreground font-semibold">Free limit reached — you can&apos;t add more students without upgrading.</span>{" "}
                Upgrade to Pro ({subSummaryQuery.data.monthlyPriceDisplay}) to keep growing.
              </>
            ) : (
              <>
                Up to <span className="text-foreground font-medium">{subSummaryQuery.data.freeLearnerCap}</span> unique students across all your
                classes. Upgrade: <span className="text-foreground font-medium">{subSummaryQuery.data.monthlyPriceDisplay}</span>.
              </>
            )}
          </p>
          {!subSummaryQuery.data.paid &&
          !subSummaryQuery.data.trialActive &&
          !subSummaryQuery.data.capReached &&
          subSummaryQuery.data.distinctLearnerCount >= subSummaryQuery.data.freeLearnerCap - 2 ? (
            <p className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-body text-foreground">
              You’ve added{" "}
              <span className="font-semibold">
                {subSummaryQuery.data.distinctLearnerCount}/{subSummaryQuery.data.freeLearnerCap}
              </span>{" "}
              students — upgrade to continue growing your class.
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground mt-2 font-body">{subSummaryQuery.data.upgradeNote}</p>
          <p className="text-sm mt-4 font-body">
            <span className="font-semibold text-foreground">{subSummaryQuery.data.distinctLearnerCount}</span> students on your roster
            (distinct learners)
            {!subSummaryQuery.data.capEnforced ? (
              <span className="text-muted-foreground">
                {" "}
                · cap enforcement is off on the server (set <code className="text-[11px]">INSTRUCTOR_ENFORCE_CAP=1</code>)
              </span>
            ) : null}
          </p>
          {!subSummaryQuery.data.paid ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="rounded-full" asChild>
                <Link to="/settings#instructor-plan">
                  {subSummaryQuery.data.capReached && !subSummaryQuery.data.trialActive ? "Upgrade ₹299" : "Upgrade"}
                </Link>
              </Button>
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/settings#instructor-plan">Plan &amp; billing details</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {mvpFocus && focusInvite && rosterCourseSlug ? (
        <div className="mt-6 rounded-2xl border-2 border-accent/50 bg-gradient-to-br from-accent/15 to-background p-6 md:p-8 space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent font-body">Next step</p>
            <h2 className="font-heading text-2xl text-foreground mt-1">Invite your students now</h2>
            <p className="text-sm text-muted-foreground mt-2 font-body">
              Send the link on WhatsApp or copy it — learners open it, sign in, and join in one flow.
            </p>
          </div>
          {inviteQuery.isLoading ? (
            <Loader2 className="animate-spin text-accent" size={28} />
          ) : inviteQuery.data ? (
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Button
                className="rounded-full h-12 px-8 text-base w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                asChild
              >
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Join my class on Hobby of Interest:\n${typeof window !== "undefined" ? `${window.location.origin}/join/${inviteQuery.data.inviteCode}` : inviteQuery.data.inviteCode}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="inline mr-2 h-5 w-5" aria-hidden />
                  WhatsApp invite
                </a>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full h-12 px-8 text-base w-full sm:w-auto"
                onClick={() => {
                  const url =
                    typeof window !== "undefined"
                      ? `${window.location.origin}/join/${inviteQuery.data!.inviteCode}`
                      : inviteQuery.data!.inviteCode;
                  void navigator.clipboard.writeText(url);
                  toast.success("Invite link copied");
                }}
              >
                <Link2 className="inline mr-2 h-4 w-4" aria-hidden />
                Copy invite link
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {mvpFocus && rosterCourseSlug ? (
        <div className="mt-4 rounded-2xl border border-border/60 bg-card/50 p-4 md:p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-3 min-w-0">
            <div className="shrink-0 rounded-xl bg-accent/15 p-2 h-fit">
              <CalendarClock className="text-accent" size={20} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground font-body">Today</p>
              <p className="text-xs text-muted-foreground mt-1 font-body leading-relaxed">
                {sessionsToday.length > 0
                  ? `${sessionsToday.length} session(s) dated today for the class selected below — open Attendance & invite to mark who was present.`
                  : "Add a session for today (Teaching tools), mark attendance, or post a quick announcement so parents see activity."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setToolTab("roster");
                document.getElementById("studio-teaching-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Attendance & invite
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setToolTab("announce");
                document.getElementById("studio-teaching-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Post update
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading && <Loader2 size={26} className="animate-spin text-accent mt-8" />}

      {!isLoading && (
        <div className={mvpFocus ? "flex flex-col" : undefined}>
          <div className={`mt-8 rounded-2xl border border-border/60 bg-card/50 p-6${mvpFocus ? " order-3" : ""}`}>
            <h2 className="font-heading text-xl">Tutor profile</h2>
            {user && !user.onboardingCompletedAt ? (
              <p className="mt-2 text-xs text-muted-foreground font-body leading-relaxed">
                Optional: these fields power your public tutor page — fill in when you want, then save. Everything else works without it.
              </p>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <input className="rounded-xl border p-2.5" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Display name" />
              <input className="rounded-xl border p-2.5" value={profileSpecialty} onChange={(e) => setProfileSpecialty(e.target.value)} placeholder="Specialty (e.g. Pottery & Ceramics)" />
            </div>
            <button
              type="button"
              className="mt-4 rounded-full bg-foreground text-background px-5 py-2 text-sm"
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending || !profileName.trim() || !profileSpecialty.trim()}
            >
              Save profile
            </button>
          </div>

          <div id="studio-analytics" className={`mt-6 scroll-mt-28 rounded-2xl border border-border/60 bg-card/50 p-6${mvpFocus ? " order-4" : ""}`}>
            <div className="flex items-start gap-2">
              <Info size={18} className="text-accent shrink-0 mt-0.5" />
              <div>
                <h2 className="font-heading text-xl">Class analytics</h2>
                <p className="text-xs text-muted-foreground mt-1 font-body leading-relaxed">
                  Snapshot per class: enrollments and average lesson completion among enrolled learners. Funnels, cohorts, revenue, and exports
                  are not implemented — treat this as a teaching health check, not a full BI dashboard.
                </p>
              </div>
            </div>
            {analyticsQuery.isLoading && <Loader2 size={22} className="animate-spin text-accent mt-6" />}
            {analyticsQuery.data && analyticsQuery.data.courses.length === 0 && (
              <p className="text-sm text-muted-foreground mt-4 font-body">No classes yet — create your first draft below.</p>
            )}
            {analyticsQuery.data && analyticsQuery.data.totals && analyticsQuery.data.courses.length > 0 && (
              <p className="text-sm font-body text-foreground mt-4">
                Across your {analyticsQuery.data.totals.classes} class{analyticsQuery.data.totals.classes === 1 ? "" : "es"}:{" "}
                <span className="font-medium">{analyticsQuery.data.totals.enrollments}</span> total enrollments.
              </p>
            )}
            {analyticsQuery.data && analyticsQuery.data.courses.length > 0 && (
              <ul className="mt-4 space-y-3">
                {analyticsQuery.data.courses.map((row) => (
                  <li
                    key={row.slug}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-heading text-sm text-foreground truncate">{row.title}</p>
                      <p className="text-[11px] text-muted-foreground font-body">
                        {row.published ? "Published" : "Draft"} · {row.totalLessons} lessons
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-foreground font-body">{row.enrollmentCount} enrolled</p>
                      <p className="text-[11px] text-muted-foreground font-body">Avg completion {row.avgCompletionPercent}%</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div id="studio-teaching-tools" className={`mt-6 scroll-mt-28 rounded-2xl border border-border/60 bg-card/50 p-6${mvpFocus ? " order-2" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} className="text-accent" />
              <h2 className="font-heading text-xl">Teaching tools</h2>
            </div>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              {mvpFocus ? (
                <>
                  Roster, <span className="text-foreground font-medium">invite link</span> &amp; WhatsApp, attendance, monthly fees, announcements,
                  and Q&amp;A. Learners open <span className="text-foreground font-medium">Classroom</span> from My classes.
                </>
              ) : (
                <>
                  Roster, announcements (optional email when SMTP is set), Q&amp;A replies, assignments with submissions, and demo payouts. Learners
                  use <span className="text-foreground font-medium">Classroom</span> from My learning for the same threads.
                </>
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-muted-foreground font-body">Class</label>
                <select
                  className="rounded-xl border p-2.5 min-w-[12rem] text-sm"
                  value={rosterCourseSlug}
                  onChange={(e) => setRosterCourseSlug(e.target.value)}
                >
                  {courses.length === 0 ? <option value="">No classes yet</option> : null}
                  {courses.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              {rosterCourseSlug ? (
                <>
                  <Button variant="outline" size="sm" className="rounded-full" asChild>
                    <Link to={`/courses/${rosterCourseSlug}`}>View public class page</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full" asChild>
                    <Link to={`/learn/${rosterCourseSlug}/classroom`}>Open classroom</Link>
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" className="rounded-full" disabled>
                  View public class page
                </Button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {(
                [
                  ["roster", "Roster", Users],
                  ["announce", "Announce", Megaphone],
                  ["discussion", "Q&A", MessageCircle],
                  ...(mvpFocus ? [] : ([["assign", "Assignments", ClipboardList]] as const)),
                  ["payout", "Payouts", Wallet],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setToolTab(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium font-body transition-colors ${
                    toolTab === id
                      ? "bg-foreground text-background"
                      : "border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} className={toolTab === id ? "opacity-90" : "text-accent"} />
                  {label}
                </button>
              ))}
            </div>

            {toolTab === "roster" && (
              <>
                {rosterQuery.isLoading && rosterCourseSlug ? (
                  <Loader2 size={20} className="animate-spin text-accent mt-4" />
                ) : null}
                {rosterQuery.data && rosterCourseSlug ? (
                  <>
                    <div className="mt-4 space-y-4">
                      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap gap-3 sm:gap-6 text-sm font-body">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Students</p>
                            <p className="font-heading text-xl text-foreground">{rosterQuery.data.summary.totalStudents}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Present today</p>
                            <p className="font-heading text-xl text-foreground">{rosterQuery.data.summary.presentTodayCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pending fees</p>
                            <p className="font-heading text-xl text-foreground text-amber-700 dark:text-amber-400">
                              {rosterQuery.data.summary.pendingFeesCount}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 min-w-[10rem]">
                            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Fee month</label>
                            <input
                              type="month"
                              className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                              value={feeYearMonth}
                              onChange={(e) => setFeeYearMonth(e.target.value)}
                            />
                            <span className="text-[10px] text-muted-foreground">New month → all start as pending until you mark paid.</span>
                          </div>
                        </div>
                        {rosterQuery.data.summary.pendingFeesCount > 0 ? (
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-3">
                            <p className="text-sm font-body text-foreground">
                              <span className="font-semibold">{rosterQuery.data.summary.pendingFeesCount}</span> student
                              {rosterQuery.data.summary.pendingFeesCount === 1 ? "" : "s"} pending{" "}
                              <span className="text-muted-foreground">({rosterQuery.data.course.monthlyFeeDisplay})</span>
                            </p>
                            <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" asChild>
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(
                                  `Reminder: ${rosterQuery.data.course.monthlyFeeDisplay} for "${rosterQuery.data.course.title}" is still pending for ${rosterQuery.data.course.feeMonth}. Please pay when you can. Thank you!\n\n— ${user?.name ?? "Your instructor"}`,
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle className="mr-1.5 h-4 w-4 inline" aria-hidden />
                                Send reminder (WhatsApp)
                              </a>
                            </Button>
                          </div>
                        ) : null}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                          <input
                            type="search"
                            className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm"
                            placeholder="Search student by name, email, or phone"
                            value={rosterSearch}
                            onChange={(e) => setRosterSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-dashed border-accent/45 bg-accent/[0.07] p-4 sm:p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <UserPlus className="h-5 w-5 text-accent shrink-0 mt-0.5" aria-hidden />
                          <div className="min-w-0">
                            <p className="font-heading text-sm text-foreground">Bulk add</p>
                            <p className="text-[11px] text-muted-foreground font-body mt-1 leading-relaxed">
                              <span className="text-foreground font-medium">Emails or phones:</span> one per line — learner must already have an
                              account with that email or linked phone. <span className="text-foreground font-medium">Names only:</span> use WhatsApp
                              to send your invite link + checklist (they join when ready).
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-semibold text-foreground">Paste emails / phones</label>
                          <textarea
                            className="w-full min-h-[88px] rounded-xl border border-input bg-background p-3 text-sm font-body"
                            placeholder={"student@gmail.com\n9876543210"}
                            value={bulkEnrollInput}
                            onChange={(e) => setBulkEnrollInput(e.target.value)}
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full"
                            disabled={!rosterCourseSlug || bulkEnrollMut.isPending}
                            onClick={() => bulkEnrollMut.mutate()}
                          >
                            {bulkEnrollMut.isPending ? (
                              <Loader2 className="animate-spin h-4 w-4" aria-hidden />
                            ) : (
                              "Add to this class"
                            )}
                          </Button>
                        </div>
                        <div className="border-t border-border/40 pt-4 space-y-2">
                          <label className="text-[11px] font-semibold text-foreground">Paste names (WhatsApp)</label>
                          <textarea
                            className="w-full min-h-[72px] rounded-xl border border-input bg-background p-3 text-sm font-body"
                            placeholder={"Rahul\nAnanya\nKiran"}
                            value={bulkNamesInput}
                            onChange={(e) => setBulkNamesInput(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                            disabled={!inviteQuery.data}
                            onClick={() => {
                              const names = bulkNamesInput.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
                              if (!inviteQuery.data || names.length === 0) {
                                toast.error("Enter names and wait for the invite link to load.");
                                return;
                              }
                              const joinUrl =
                                typeof window !== "undefined"
                                  ? `${window.location.origin}/join/${inviteQuery.data.inviteCode}`
                                  : "";
                              const title = rosterQuery.data?.course.title ?? "my class";
                              const body = `Join "${title}" on Hobby of Interest:\n${joinUrl}\n\nIf your name is below, please sign up and join with the same name:\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
                            }}
                          >
                            <MessageCircle className="mr-1.5 h-4 w-4 inline" aria-hidden />
                            WhatsApp: invite + name list
                          </Button>
                        </div>
                      </div>

                      {filteredRosterStudents.length === 0 ? (
                        <p className="text-sm text-muted-foreground font-body px-1">
                          {rosterQuery.data.students.length === 0
                            ? "No enrollments yet — share your invite link below."
                            : "No students match your search."}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {filteredRosterStudents.map((row) => (
                            <li
                              key={row.enrollmentId}
                              className="rounded-xl border border-border/50 bg-background/80 px-3 py-3 sm:px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-foreground font-body">{row.learner.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{row.learner.email}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  <span className="font-medium text-foreground">{rosterQuery.data.course.monthlyFeeDisplay}</span>
                                  {row.feeStatus === "PAID" ? (
                                    <span className="ml-2 text-emerald-600 dark:text-emerald-400">Paid</span>
                                  ) : (
                                    <span className="ml-2 text-amber-700 dark:text-amber-400">Pending</span>
                                  )}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-1 font-body leading-snug">
                                  {row.stats.sessionsHeld === 0
                                    ? "No sessions logged yet — add a session below to track attendance."
                                    : `Present ${row.stats.sessionsPresent}/${row.stats.sessionsHeld} logged sessions · Fees paid ${row.stats.feeRecentPaidCount}/${row.stats.feeRecentMonthCount} of last ${row.stats.feeRecentMonthCount} months`}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={row.feeStatus === "PAID" ? "default" : "outline"}
                                  className="rounded-full h-8 text-xs"
                                  disabled={saveFeeOne.isPending}
                                  onClick={() => {
                                    if (row.feeStatus === "PAID") return;
                                    saveFeeOne.mutate({ enrollmentId: row.enrollmentId, status: "PAID" });
                                  }}
                                >
                                  Paid
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={row.feeStatus === "PENDING" ? "secondary" : "outline"}
                                  className="rounded-full h-8 text-xs"
                                  disabled={saveFeeOne.isPending}
                                  onClick={() => {
                                    if (row.feeStatus === "PENDING") return;
                                    saveFeeOne.mutate({ enrollmentId: row.enrollmentId, status: "PENDING" });
                                  }}
                                >
                                  Pending
                                </Button>
                                <Button variant="ghost" size="sm" className="rounded-full h-8 px-2 text-xs" asChild>
                                  <a
                                    href={`https://wa.me/?text=${encodeURIComponent(
                                      `Hi ${row.learner.name.split(" ")[0] ?? ""}, quick note re ${rosterQuery.data.course.title}: ${rosterQuery.data.course.monthlyFeeDisplay} for ${rosterQuery.data.course.feeMonth} — let me know if you have questions. Thanks!`,
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <MessageCircle className="h-4 w-4" aria-hidden />
                                  </a>
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide font-body flex items-center gap-2">
                          <Link2 size={14} className="text-accent" aria-hidden />
                          Invite link
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 font-body leading-relaxed">
                          Learners open the link, sign in, and join. Works while the class is still a draft.
                        </p>
                        {inviteQuery.isLoading ? <Loader2 className="animate-spin mt-3 text-accent" size={18} /> : null}
                        {inviteQuery.data ? (
                          <div className="mt-3 flex flex-col gap-2">
                            <code className="text-xs sm:text-sm font-mono bg-background/80 border border-border/50 rounded-lg px-3 py-2 break-all">
                              {typeof window !== "undefined"
                                ? `${window.location.origin}/join/${inviteQuery.data.inviteCode}`
                                : inviteQuery.data.inviteCode}
                            </code>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => {
                                  const url =
                                    typeof window !== "undefined"
                                      ? `${window.location.origin}/join/${inviteQuery.data!.inviteCode}`
                                      : inviteQuery.data!.inviteCode;
                                  void navigator.clipboard.writeText(url);
                                  toast.success("Link copied");
                                }}
                              >
                                Copy link
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                disabled={regenerateInvite.isPending}
                                onClick={() => regenerateInvite.mutate()}
                              >
                                {regenerateInvite.isPending ? (
                                  <Loader2 className="animate-spin" size={14} />
                                ) : (
                                  <>
                                    <RefreshCw size={14} className="mr-1 inline" aria-hidden /> New code
                                  </>
                                )}
                              </Button>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="rounded-full border-emerald-600/35 bg-emerald-500/[0.08] text-emerald-900 hover:bg-emerald-500/15 dark:text-emerald-100"
                              >
                                <a
                                  href={`https://wa.me/?text=${encodeURIComponent(
                                    `Join my class on Hobby of Interest:\n${
                                      typeof window !== "undefined"
                                        ? `${window.location.origin}/join/${inviteQuery.data.inviteCode}`
                                        : inviteQuery.data.inviteCode
                                    }`,
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  WhatsApp
                                </a>
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="border-t border-border/40 pt-5 space-y-3">
                        <p className="text-xs font-semibold text-foreground font-body">Sessions &amp; attendance</p>
                        <p className="text-[11px] text-muted-foreground font-body">
                          Tap Present or Absent, then save — or mark everyone present in one go.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="rounded-full"
                            disabled={createClassSessionNow.isPending || !rosterCourseSlug}
                            onClick={() => createClassSessionNow.mutate()}
                          >
                            {createClassSessionNow.isPending ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <>
                                <CalendarClock className="mr-1.5 h-4 w-4 inline" aria-hidden />
                                Class happening now
                              </>
                            )}
                          </Button>
                          {sessionsToday[0] ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => setSelectedSessionId(sessionsToday[0]!.id)}
                            >
                              Use today&apos;s session
                            </Button>
                          ) : null}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                          <label className="flex flex-col gap-1 text-[11px] text-muted-foreground font-body flex-1 min-w-0">
                            <span>Or add session at a specific time</span>
                            <input
                              type="datetime-local"
                              className="rounded-xl border border-input bg-background px-2 py-2 text-sm"
                              value={newSessionHeldAt}
                              onChange={(e) => setNewSessionHeldAt(e.target.value)}
                            />
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full shrink-0"
                            disabled={createClassSession.isPending}
                            onClick={() => createClassSession.mutate()}
                          >
                            {createClassSession.isPending ? <Loader2 className="animate-spin" size={16} /> : "Add session"}
                          </Button>
                        </div>
                        {sessionsQuery.isLoading ? <Loader2 className="animate-spin text-accent" size={18} /> : null}
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] text-muted-foreground font-body">Mark attendance for</label>
                          <select
                            className="rounded-xl border border-input bg-background px-2 py-2 text-sm max-w-md"
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                          >
                            <option value="">Select a session</option>
                            {(sessionsQuery.data?.sessions ?? []).map((s) => (
                              <option key={s.id} value={s.id}>
                                {new Date(s.heldAt).toLocaleString()} · present {s.presentCount}/{Math.max(s.totalMarked, 1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedSessionId && attendanceQuery.isLoading ? (
                          <Loader2 className="animate-spin text-accent" size={18} />
                        ) : null}
                        {selectedSessionId && attendanceQuery.data ? (
                          <div className="rounded-xl border border-border/50 p-3 space-y-3">
                            {attendanceQuery.data.students.length === 0 ? (
                              <p className="text-xs text-muted-foreground font-body">No students enrolled yet.</p>
                            ) : (
                              <>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full h-8 text-xs"
                                    onClick={() => {
                                      const next: Record<string, boolean> = {};
                                      for (const st of attendanceQuery.data!.students) next[st.enrollmentId] = true;
                                      setAttendanceDraft(next);
                                    }}
                                  >
                                    All present
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full h-8 text-xs"
                                    onClick={() => {
                                      const next: Record<string, boolean> = {};
                                      for (const st of attendanceQuery.data!.students) next[st.enrollmentId] = false;
                                      setAttendanceDraft(next);
                                    }}
                                  >
                                    All absent
                                  </Button>
                                </div>
                                <ul className="space-y-2">
                                  {attendanceQuery.data.students.map((s) => (
                                    <li
                                      key={s.enrollmentId}
                                      className="flex flex-wrap items-center justify-between gap-2 text-sm font-body"
                                    >
                                      <span className="text-foreground min-w-0">{s.name}</span>
                                      <div className="flex rounded-full border border-border/60 p-0.5 bg-muted/30 shrink-0">
                                        <button
                                          type="button"
                                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                            (attendanceDraft[s.enrollmentId] ?? false)
                                              ? "bg-emerald-600 text-white"
                                              : "text-muted-foreground hover:text-foreground"
                                          }`}
                                          onClick={() =>
                                            setAttendanceDraft((prev) => ({ ...prev, [s.enrollmentId]: true }))
                                          }
                                        >
                                          Present
                                        </button>
                                        <button
                                          type="button"
                                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                            !(attendanceDraft[s.enrollmentId] ?? false)
                                              ? "bg-foreground text-background"
                                              : "text-muted-foreground hover:text-foreground"
                                          }`}
                                          onClick={() =>
                                            setAttendanceDraft((prev) => ({ ...prev, [s.enrollmentId]: false }))
                                          }
                                        >
                                          Absent
                                        </button>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              className="rounded-full"
                              disabled={saveAttendanceMvp.isPending || attendanceQuery.data.students.length === 0}
                              onClick={() => saveAttendanceMvp.mutate()}
                            >
                              {saveAttendanceMvp.isPending ? <Loader2 className="animate-spin" size={16} /> : "Save attendance"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : !rosterCourseSlug ? (
                  <p className="mt-4 text-sm text-muted-foreground font-body">Create a class to see the roster.</p>
                ) : null}
              </>
            )}

            {toolTab === "announce" && rosterCourseSlug && (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border/50 p-4 space-y-3">
                  <p className="text-xs font-medium text-foreground">New announcement</p>
                  <p className="text-[11px] text-muted-foreground font-body">Quick templates — then post in-app and optionally blast WhatsApp.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full h-8 text-xs"
                      onClick={() => applyAnnouncePreset("update")}
                    >
                      Text update
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full h-8 text-xs"
                      onClick={() => applyAnnouncePreset("cancel")}
                    >
                      Class cancelled
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full h-8 text-xs"
                      onClick={() => applyAnnouncePreset("fee")}
                    >
                      Fee reminder
                    </Button>
                  </div>
                  <input
                    className="w-full rounded-xl border p-2.5 text-sm"
                    placeholder="Title (optional)"
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full rounded-xl border p-3 text-sm min-h-[100px] font-body"
                    placeholder="Message (10+ characters)"
                    value={announceBody}
                    onChange={(e) => setAnnounceBody(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground font-body cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announceEmailLearners}
                      onChange={(e) => setAnnounceEmailLearners(e.target.checked)}
                      className="rounded border-border"
                    />
                    Email enrolled learners (requires SMTP in server .env)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      disabled={postAnnouncement.isPending || announceBody.trim().length < 10}
                      onClick={() => postAnnouncement.mutate()}
                    >
                      Post in Classroom only
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={announceBody.trim().length < 10}
                      onClick={() => void postAnnouncementShareWhatsApp()}
                    >
                      <MessageCircle className="mr-1.5 h-4 w-4 inline" aria-hidden />
                      Post + share on WhatsApp
                    </Button>
                  </div>
                </div>
                {studioAnnouncementsQuery.isLoading ? <Loader2 size={20} className="animate-spin text-accent" /> : null}
                <ul className="space-y-3">
                  {studioAnnouncementsQuery.data?.announcements.map((a) => (
                    <li key={a.id} className="rounded-xl border border-border/40 p-3 text-sm">
                      {a.title ? <p className="font-medium text-foreground">{a.title}</p> : null}
                      <p className="text-xs text-muted-foreground mt-0.5 font-body">
                        {a.author.name} · {new Date(a.createdAt).toLocaleString()}
                        {a.emailed ? " · Emailed" : ""}
                      </p>
                      <p className="mt-2 text-sm font-body whitespace-pre-wrap text-foreground">{a.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {toolTab === "discussion" && rosterCourseSlug && (
              <div className="mt-4 space-y-4">
                {toolQuestionsQuery.isLoading ? <Loader2 size={20} className="animate-spin text-accent" /> : null}
                {toolQuestionsQuery.data?.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body">No questions yet.</p>
                ) : null}
                {toolQuestionsQuery.data?.questions.map((q) => (
                  <div key={q.id} className="rounded-xl border border-border/50 p-4">
                    <p className="text-xs text-muted-foreground font-body">
                      {q.author.name} · {new Date(q.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm font-body whitespace-pre-wrap text-foreground">{q.body}</p>
                    {q.answer ? (
                      <div className="mt-3 rounded-lg bg-accent/10 border border-accent/20 p-3 text-sm font-body text-foreground">{q.answer}</div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <textarea
                          className="w-full rounded-xl border border-border/60 bg-background p-3 text-sm min-h-[80px] font-body"
                          placeholder="Write your reply…"
                          value={studioAnswerDraft[q.id] ?? ""}
                          onChange={(e) => setStudioAnswerDraft((m) => ({ ...m, [q.id]: e.target.value }))}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full"
                          disabled={
                            answerStudioQuestion.isPending || (studioAnswerDraft[q.id] ?? "").trim().length < 3
                          }
                          onClick={() => {
                            const t = (studioAnswerDraft[q.id] ?? "").trim();
                            answerStudioQuestion.mutate(
                              { questionId: q.id, answer: t },
                              {
                                onSuccess: () =>
                                  setStudioAnswerDraft((m) => {
                                    const next = { ...m };
                                    delete next[q.id];
                                    return next;
                                  }),
                              },
                            );
                          }}
                        >
                          Post reply
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {toolTab === "assign" && rosterCourseSlug && (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border/50 p-4 space-y-3">
                  <p className="text-xs font-medium text-foreground">New assignment</p>
                  <input
                    className="w-full rounded-xl border p-2.5 text-sm"
                    placeholder="Title (3+ characters)"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full rounded-xl border p-3 text-sm min-h-[90px] font-body"
                    placeholder="Instructions (10+ characters)"
                    value={assignDescription}
                    onChange={(e) => setAssignDescription(e.target.value)}
                  />
                  <input
                    className="w-full rounded-xl border p-2.5 text-sm"
                    type="datetime-local"
                    value={assignDueAt}
                    onChange={(e) => setAssignDueAt(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground font-body">Due date optional — leave empty for no deadline.</p>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full"
                    disabled={
                      createStudioAssignment.isPending ||
                      assignTitle.trim().length < 3 ||
                      assignDescription.trim().length < 10
                    }
                    onClick={() => createStudioAssignment.mutate()}
                  >
                    Create assignment
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">Your assignments</p>
                    {studioAssignmentsQuery.isLoading ? (
                      <Loader2 size={20} className="animate-spin text-accent" />
                    ) : (
                      <ul className="space-y-2">
                        {studioAssignmentsQuery.data?.assignments.map((a) => (
                          <li
                            key={a.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 p-2.5 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{a.title}</p>
                              <p className="text-[11px] text-muted-foreground font-body">{a.submissionCount} submission(s)</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                type="button"
                                variant={viewSubmissionsAssignmentId === a.id ? "default" : "outline"}
                                size="sm"
                                className="rounded-full h-8 text-xs"
                                onClick={() => setViewSubmissionsAssignmentId(a.id)}
                              >
                                Submissions
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-full h-8 px-2 text-destructive hover:text-destructive"
                                aria-label="Delete assignment"
                                onClick={() => {
                                  if (window.confirm("Delete this assignment and all submissions?")) {
                                    deleteStudioAssignment.mutate(a.id);
                                  }
                                }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-xl border border-border/50 p-3 min-h-[140px]">
                    <p className="text-xs font-medium text-foreground mb-2">Submissions</p>
                    {!viewSubmissionsAssignmentId ? (
                      <p className="text-xs text-muted-foreground font-body">Select an assignment.</p>
                    ) : subsQuery.isLoading ? (
                      <Loader2 size={20} className="animate-spin text-accent" />
                    ) : (
                      <ul className="space-y-3 max-h-[340px] overflow-y-auto">
                        {(subsQuery.data?.submissions.length ?? 0) === 0 ? (
                          <li className="text-xs text-muted-foreground font-body">No submissions yet.</li>
                        ) : null}
                        {subsQuery.data?.submissions.map((s, idx) => (
                          <li key={`${s.user.email}-${idx}`} className="text-xs border-b border-border/30 pb-3 last:border-0">
                            <p className="font-medium text-foreground">
                              {s.user.name}{" "}
                              <span className="text-muted-foreground font-normal">({s.user.email})</span>
                            </p>
                            <p className="text-muted-foreground mt-1 whitespace-pre-wrap font-body">{s.content}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 font-body">
                              {new Date(s.updatedAt).toLocaleString()}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {toolTab === "payout" && (
              <div className="mt-4 space-y-4">
                {payoutSummaryQuery.isLoading ? <Loader2 size={22} className="animate-spin text-accent" /> : null}
                {payoutSummaryQuery.data ? (
                  <>
                    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                      <p className="text-xs font-semibold text-foreground font-body">Manual payouts — no Razorpay</p>
                      <p className="text-[11px] text-muted-foreground font-body mt-1 leading-relaxed">
                        Money does not move inside this app. Use this tab to record what you’re owed and what an admin has marked paid after
                        UPI/bank transfer offline.
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-body leading-relaxed">{payoutSummaryQuery.data.demoNote}</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border/50 p-3 text-sm">
                        <p className="text-[11px] text-muted-foreground font-body">Accrued (demo)</p>
                        <p className="text-lg font-medium text-foreground font-body">{payoutSummaryQuery.data.accruedDisplay}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-body">
                          {payoutSummaryQuery.data.enrollmentCount} enrollments × demo rate
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/50 p-3 text-sm">
                        <p className="text-[11px] text-muted-foreground font-body">Available to request</p>
                        <p className="text-lg font-medium text-accent font-body">{payoutSummaryQuery.data.availableDisplay}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-body">
                          Paid out {payoutSummaryQuery.data.paidOutDisplay} · On hold {payoutSummaryQuery.data.pendingHoldDisplay}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/50 p-4 space-y-2">
                      <p className="text-xs font-medium text-foreground">Tax profile (demo)</p>
                      <input
                        className="w-full rounded-xl border p-2.5 text-sm"
                        placeholder="Legal name"
                        value={taxLegalName}
                        onChange={(e) => setTaxLegalName(e.target.value)}
                      />
                      <input
                        className="w-full rounded-xl border p-2.5 text-sm"
                        placeholder="PAN reference / last digits"
                        value={taxPanLast4}
                        onChange={(e) => setTaxPanLast4(e.target.value)}
                      />
                      <input
                        className="w-full rounded-xl border p-2.5 text-sm"
                        placeholder="GSTIN (optional)"
                        value={taxGstin}
                        onChange={(e) => setTaxGstin(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        disabled={saveTaxProfile.isPending}
                        onClick={() => saveTaxProfile.mutate()}
                      >
                        Save tax profile
                      </Button>
                    </div>
                    <div className="rounded-xl border border-border/50 p-4 space-y-2">
                      <p className="text-xs font-medium text-foreground">Record payout request (manual)</p>
                      <p className="text-xs text-muted-foreground font-body">
                        Max whole rupees: {Math.max(0, Math.floor(payoutSummaryQuery.data.availablePaise / 100))}
                      </p>
                      <input
                        className="w-full max-w-[12rem] rounded-xl border p-2.5 text-sm"
                        type="number"
                        min={1}
                        max={Math.max(1, Math.floor(payoutSummaryQuery.data.availablePaise / 100))}
                        value={payoutAmountInr}
                        onChange={(e) => setPayoutAmountInr(Number(e.target.value))}
                      />
                      <input
                        className="w-full rounded-xl border p-2.5 text-sm"
                        placeholder="Note to admin (optional)"
                        value={payoutNote}
                        onChange={(e) => setPayoutNote(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        disabled={
                          requestPayout.isPending ||
                          payoutAmountInr < 1 ||
                          Math.round(payoutAmountInr) * 100 > payoutSummaryQuery.data.availablePaise
                        }
                        onClick={() => requestPayout.mutate()}
                      >
                        Submit request (ledger only)
                      </Button>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground mb-2">Recent requests</p>
                      <ul className="space-y-2 text-xs font-body">
                        {payoutSummaryQuery.data.requests.map((r) => (
                          <li
                            key={r.id}
                            className="flex flex-wrap justify-between gap-2 border-b border-border/30 py-2 text-muted-foreground"
                          >
                            <span className="text-foreground font-medium">{r.amountDisplay}</span>
                            <span>{r.status}</span>
                            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                          </li>
                        ))}
                      </ul>
                      {payoutSummaryQuery.data.requests.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-body">No requests yet.</p>
                      ) : null}
                    </div>
                  </>
                ) : payoutSummaryQuery.isError ? (
                  <p className="text-sm text-destructive font-body">Could not load payout summary.</p>
                ) : null}
              </div>
            )}

            {toolTab !== "payout" && toolTab !== "roster" && !rosterCourseSlug ? (
              <p className="mt-4 text-sm text-muted-foreground font-body">Create a class to use this tab.</p>
            ) : null}
          </div>

          <div id="studio-create-class" className={`scroll-mt-28 rounded-2xl border border-border/60 bg-card/50 p-6${mvpFocus ? " order-1 mt-8" : " mt-6"}`}>
            <h2 className="font-heading text-xl">Create new class</h2>
            <p className="text-xs text-muted-foreground mt-1 font-body">Starts as a draft until you publish from the class card below.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <input className="rounded-xl border p-2.5" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="Class title" />
              <input className="rounded-xl border p-2.5" value={courseCategory} onChange={(e) => setCourseCategory(e.target.value)} placeholder="Category" />
              <select className="rounded-xl border p-2.5" value={courseFormat} onChange={(e) => setCourseFormat(e.target.value as "ONLINE" | "IN_PERSON")}>
                <option value="ONLINE">Online</option>
                <option value="IN_PERSON">In-person</option>
              </select>
              <input className="rounded-xl border p-2.5" value={courseCity} onChange={(e) => setCourseCity(e.target.value)} placeholder="City (for in-person)" />
              <input className="rounded-xl border p-2.5" value={courseDuration} onChange={(e) => setCourseDuration(e.target.value)} placeholder="Duration label" />
              <input className="rounded-xl border p-2.5" type="number" value={coursePrice} onChange={(e) => setCoursePrice(Number(e.target.value))} placeholder="Price (INR)" />
              <select className="rounded-xl border p-2.5" value={courseImageKey} onChange={(e) => setCourseImageKey(e.target.value)}>
                {IMAGE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <label className="md:col-span-2 flex flex-col gap-2 text-xs text-muted-foreground">
                <span>Custom cover (Cloudinary — set API keys in server .env)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm text-foreground file:mr-2 file:rounded-lg file:border file:bg-background file:px-2 file:py-1"
                  disabled={coverUploading}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    setCoverUploading(true);
                    try {
                      const url = await uploadMediaFile(f);
                      setCourseCoverUrl(url);
                      toast.success("Cover uploaded — it will attach when you create the class.");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Upload failed");
                    } finally {
                      setCoverUploading(false);
                    }
                  }}
                />
                {courseCoverUrl ? <img src={courseCoverUrl} alt="" className="mt-1 h-24 w-40 rounded-lg object-cover border" /> : null}
              </label>
            </div>
            <textarea className="w-full rounded-xl border p-2.5 mt-3" rows={3} value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} placeholder="Description" />
            <textarea className="w-full rounded-xl border p-2.5 mt-3" rows={3} value={courseOutcomes} onChange={(e) => setCourseOutcomes(e.target.value)} placeholder="Outcomes (one per line)" />
            <button
              type="button"
              className="mt-4 rounded-full bg-foreground text-background px-5 py-2 text-sm"
              onClick={() => createCourse.mutate()}
              disabled={createCourse.isPending || coverUploading || !courseTitle.trim() || !courseDescription.trim() || !courseOutcomes.trim()}
            >
              Create draft class
            </button>
          </div>

          <div
            id="studio-classes"
            className={`scroll-mt-28 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mt-8${mvpFocus ? " order-5 rounded-2xl border border-dashed border-border/50 p-4 bg-muted/10" : ""}`}
          >
            {mvpFocus ? (
              <p className="md:col-span-2 text-xs text-muted-foreground font-body leading-relaxed -mt-2 mb-2">
                Optional for launch: sections, lesson titles, and video URLs. You can run live classes with invite + attendance only.
              </p>
            ) : null}
            <select className="rounded-xl border p-2.5" value={selectedCourseSlug} onChange={(e) => setSelectedCourseSlug(e.target.value)}>
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border p-2.5"
                placeholder="New section title"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
              />
              <button
                type="button"
                className="rounded-xl border px-3 text-sm"
                onClick={() => addSection.mutate()}
                disabled={!selectedCourseSlug || !newSectionTitle.trim() || addSection.isPending}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className={"grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 max-w-3xl" + (mvpFocus ? " order-5" : "")}>
            <select className="rounded-xl border p-2.5" value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)}>
              <option value="">Select section</option>
              {sectionOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <input className="rounded-xl border p-2.5" placeholder="Lesson title" value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} />
            <div className="flex gap-2">
              <input className="w-24 rounded-xl border p-2.5" type="number" value={newLessonMin} onChange={(e) => setNewLessonMin(Number(e.target.value))} />
              <button
                type="button"
                className="rounded-xl border px-3 text-sm"
                onClick={() => addLesson.mutate()}
                disabled={!selectedSectionId || !newLessonTitle.trim() || addLesson.isPending}
              >
                Add lesson
              </button>
            </div>
          </div>

          <div className={"mt-10 space-y-4" + (mvpFocus ? " order-5" : "")}>
            {courses.map((course) => (
              <div key={course.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-heading text-lg">{course.title}</h2>
                  <button
                    type="button"
                    className="text-xs underline text-muted-foreground"
                    onClick={() => setEditingSlug((prev) => (prev === course.slug ? "" : course.slug))}
                  >
                    {editingSlug === course.slug ? "Close editor" : "Edit class details"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {course.priceDisplay} · {course.durationLabel} · {course.published ? "Published" : "Draft"}
                </p>
                {editingSlug === course.slug && editDraft && (
                  <div className="mt-4 rounded-xl border p-4 bg-background/60 space-y-4">
                    <div className="flex gap-3 items-start flex-wrap">
                      <img src={courseCoverSrc(course.imageKey, course.coverImageUrl)} alt="" className="h-24 w-36 rounded-lg object-cover border shrink-0" />
                      <div className="flex flex-col gap-2 text-xs min-w-0">
                        <label className="text-muted-foreground">
                          Replace cover
                          <input
                            type="file"
                            accept="image/*"
                            className="block mt-1 text-foreground file:mr-2 file:rounded-lg file:border file:bg-background file:px-2 file:py-1"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (!f) return;
                              try {
                                const url = await uploadMediaFile(f);
                                updateCourse.mutate({ slug: course.slug, payload: { coverImageUrl: url } });
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Upload failed");
                              }
                            }}
                          />
                        </label>
                        {course.coverImageUrl ? (
                          <button
                            type="button"
                            className="text-left underline text-muted-foreground"
                            onClick={() => updateCourse.mutate({ slug: course.slug, payload: { coverImageUrl: null } })}
                          >
                            Remove custom cover
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        className="rounded-xl border p-2 text-sm"
                        value={editDraft.title}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                        placeholder="Title"
                      />
                      <input
                        className="rounded-xl border p-2 text-sm"
                        value={editDraft.category}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, category: e.target.value } : d))}
                        placeholder="Category"
                      />
                      <select
                        className="rounded-xl border p-2 text-sm"
                        value={editDraft.format}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, format: e.target.value as "ONLINE" | "IN_PERSON" } : d))}
                      >
                        <option value="ONLINE">Online</option>
                        <option value="IN_PERSON">In-person</option>
                      </select>
                      <input
                        className="rounded-xl border p-2 text-sm"
                        value={editDraft.city}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, city: e.target.value } : d))}
                        placeholder="City (in-person)"
                        disabled={editDraft.format === "ONLINE"}
                      />
                      <input
                        className="rounded-xl border p-2 text-sm"
                        value={editDraft.durationLabel}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, durationLabel: e.target.value } : d))}
                        placeholder="Duration label"
                      />
                      <input
                        className="rounded-xl border p-2 text-sm"
                        type="number"
                        value={editDraft.priceInr}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, priceInr: Number(e.target.value) } : d))}
                        placeholder="Price INR"
                      />
                      <select
                        className="rounded-xl border p-2 text-sm md:col-span-2"
                        value={editDraft.imageKey}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, imageKey: e.target.value } : d))}
                      >
                        {IMAGE_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      className="w-full rounded-xl border p-2 text-sm"
                      rows={4}
                      value={editDraft.description}
                      onChange={(e) => setEditDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                      placeholder="Description (20+ characters)"
                    />
                    <textarea
                      className="w-full rounded-xl border p-2 text-sm"
                      rows={3}
                      value={editDraft.outcomes}
                      onChange={(e) => setEditDraft((d) => (d ? { ...d, outcomes: e.target.value } : d))}
                      placeholder="Outcomes, one per line"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" className="rounded-full" onClick={saveFullClass} disabled={updateCourse.isPending}>
                        Save all class fields
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => updateCourse.mutate({ slug: course.slug, payload: { published: !course.published } })}
                      >
                        {course.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full" asChild>
                        <Link to={`/courses/${course.slug}`}>Preview listing</Link>
                      </Button>
                    </div>
                  </div>
                )}
                <div className="mt-3 space-y-4">
                  {course.sections.map((section) => (
                    <div key={section.id} className="rounded-xl border p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="flex-1 min-w-[10rem] rounded-lg border bg-background px-2 py-1.5 text-sm"
                          value={sectionTitles[section.id] ?? section.title}
                          onChange={(e) => setSectionTitles((m) => ({ ...m, [section.id]: e.target.value }))}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs"
                          onClick={() => patchSectionTitle.mutate({ sectionId: section.id, title: (sectionTitles[section.id] ?? section.title).trim() })}
                        >
                          Save title
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            aria-label="Move section up"
                            onClick={() => moveSection.mutate({ sectionId: section.id, direction: "up" })}
                          >
                            <ChevronUp size={16} />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            aria-label="Move section down"
                            onClick={() => moveSection.mutate({ sectionId: section.id, direction: "down" })}
                          >
                            <ChevronDown size={16} />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-destructive"
                            aria-label="Delete section"
                            onClick={() => {
                              if (window.confirm("Delete this section and all its lessons?")) deleteSection.mutate(section.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                      <ul className="space-y-3 pl-0">
                        {section.lessons.map((lesson) => {
                          const lf = lessonFields[lesson.id] ?? {
                            title: lesson.title,
                            durationMin: lesson.durationMin,
                            preview: lesson.preview,
                          };
                          return (
                            <li key={lesson.id} className="rounded-lg border border-border/50 p-3 bg-background/40 space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-[1fr_5rem_auto] gap-2 items-center">
                                <input
                                  className="rounded-lg border px-2 py-1 text-xs"
                                  value={lf.title}
                                  onChange={(e) =>
                                    setLessonFields((m) => ({
                                      ...m,
                                      [lesson.id]: { ...lf, title: e.target.value },
                                    }))
                                  }
                                />
                                <input
                                  className="rounded-lg border px-2 py-1 text-xs"
                                  type="number"
                                  value={lf.durationMin}
                                  onChange={(e) =>
                                    setLessonFields((m) => ({
                                      ...m,
                                      [lesson.id]: { ...lf, durationMin: Number(e.target.value) },
                                    }))
                                  }
                                />
                                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={lf.preview}
                                    onChange={(e) =>
                                      setLessonFields((m) => ({
                                        ...m,
                                        [lesson.id]: { ...lf, preview: e.target.checked },
                                      }))
                                    }
                                  />
                                  Preview
                                </label>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 text-[11px]"
                                  onClick={() =>
                                    patchLessonMeta.mutate({
                                      lessonId: lesson.id,
                                      title: lf.title.trim(),
                                      durationMin: lf.durationMin,
                                      preview: lf.preview,
                                    })
                                  }
                                >
                                  Save lesson
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => moveLesson.mutate({ lessonId: lesson.id, direction: "up" })}
                                >
                                  <ChevronUp size={14} />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => moveLesson.mutate({ lessonId: lesson.id, direction: "down" })}
                                >
                                  <ChevronDown size={14} />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => {
                                    if (window.confirm("Delete this lesson?")) deleteLesson.mutate(lesson.id);
                                  }}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  className="flex-1 min-w-[12rem] rounded-lg border bg-background px-2 py-1 text-[11px] text-foreground"
                                  placeholder="Video URL (https://…)"
                                  value={lessonVideoDraft[lesson.id] ?? lesson.videoUrl ?? ""}
                                  onChange={(e) => setLessonVideoDraft((d) => ({ ...d, [lesson.id]: e.target.value }))}
                                />
                                <button
                                  type="button"
                                  className="rounded-lg border px-2 py-1 text-[11px]"
                                  disabled={patchLessonVideo.isPending}
                                  onClick={() => {
                                    const raw = (lessonVideoDraft[lesson.id] ?? lesson.videoUrl ?? "").trim();
                                    patchLessonVideo.mutate({ lessonId: lesson.id, videoUrl: raw.length ? raw : null });
                                  }}
                                >
                                  Save URL
                                </button>
                                <label className="text-[11px] cursor-pointer rounded-lg border px-2 py-1">
                                  {uploadingLessonId === lesson.id ? "…" : "Upload"}
                                  <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    disabled={uploadingLessonId === lesson.id}
                                    onChange={async (e) => {
                                      const f = e.target.files?.[0];
                                      e.target.value = "";
                                      if (!f) return;
                                      setUploadingLessonId(lesson.id);
                                      try {
                                        const url = await uploadMediaFile(f);
                                        setLessonVideoDraft((d) => ({ ...d, [lesson.id]: url }));
                                        await patchLessonVideo.mutateAsync({ lessonId: lesson.id, videoUrl: url });
                                      } catch (err) {
                                        toast.error(err instanceof Error ? err.message : "Upload failed");
                                      } finally {
                                        setUploadingLessonId(null);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <div className="rounded-2xl border border-border/60 bg-card/50 p-10 text-center max-w-lg mx-auto">
                <p className="font-heading text-xl text-foreground">No classes yet</p>
                <p className="font-body text-muted-foreground mt-2 leading-relaxed">
                  Create your first draft class to unlock curriculum tools, roster, and analytics. You don’t need to browse the public catalog
                  as a tutor — start from your own syllabus.
                </p>
                <button
                  type="button"
                  onClick={scrollToCreateClass}
                  className="inline-flex mt-6 font-body text-sm bg-foreground text-background px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
                >
                  Create your first class
                </button>
                <p className="mt-4 text-xs text-muted-foreground font-body">
                  Want inspiration?{" "}
                  <Link to="/courses" className="text-accent underline">
                    Browse the catalog
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default InstructorStudioPage;
