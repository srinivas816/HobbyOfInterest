import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { InstructorClassSubHeader } from "./InstructorClassSubHeader";
import {
  invalidateClassWorkspaceQueries,
  joinedAgoLabel,
  studioCoursesQueryOptions,
  workspaceQueryOptions,
} from "./classWorkspaceUtils";

const InstructorClassStudentsPage = () => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam?.trim() ?? "";
  const location = useLocation();
  const { user, token, ready } = useAuth();
  const queryClient = useQueryClient();
  const [bulkEnrollInput, setBulkEnrollInput] = useState("");

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
        course: { title: string };
        summary: { totalStudents: number };
        students: Array<{
          enrollmentId: string;
          enrolledAt: string;
          learner: { name: string; email: string; phone: string | null };
          stats: { sessionsHeld: number; sessionsPresent: number };
        }>;
      }>(res);
    },
  });

  const inviteQuery = useQuery({
    queryKey: ["studio-invite", slug],
    ...workspaceQueryOptions,
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/invite`);
      return parseJson<{ inviteCode: string }>(res);
    },
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
      invalidateClassWorkspaceQueries(queryClient, slug);
      const parts = [
        out.enrolled.length ? `${out.enrolled.length} added` : "",
        out.alreadyEnrolled.length ? `${out.alreadyEnrolled.length} already in class` : "",
        out.notFound.length ? `${out.notFound.length} no account` : "",
      ].filter(Boolean);
      toast.success(parts.length ? parts.join(" · ") : "No changes");
    },
    onError: (e: Error) => toast.error(e.message || "Bulk add failed"),
  });

  useEffect(() => {
    if (location.hash !== "#bulk-add") return;
    const t = window.setTimeout(() => {
      document.getElementById("bulk-add")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [location.hash]);

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
  const inviteUrl =
    typeof window !== "undefined" && inviteQuery.data
      ? `${window.location.origin}/join/${inviteQuery.data.inviteCode}`
      : "";

  const students = rosterQuery.data?.students ?? [];

  return (
    <div className="min-h-full flex flex-col pb-10">
      <InstructorClassSubHeader slug={slug} title="Students" subtitle={title} />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4 flex-1">
        <Button className="w-full rounded-xl h-11 text-sm font-semibold transition-transform active:scale-[0.98]" variant="secondary" asChild={Boolean(inviteUrl)} disabled={!inviteUrl}>
          {inviteUrl ? (
            <a href={`https://wa.me/?text=${encodeURIComponent(`Join my class:\n${inviteUrl}`)}`} target="_blank" rel="noreferrer">
              <MessageCircle className="inline mr-2 h-4 w-4" aria-hidden />
              Send invite on WhatsApp
            </a>
          ) : (
            <span>Send invite on WhatsApp</span>
          )}
        </Button>

        <textarea
          id="bulk-add"
          className="w-full min-h-[72px] rounded-xl border bg-background p-3 text-sm"
          placeholder="Email or phone · one per line"
          value={bulkEnrollInput}
          onChange={(e) => setBulkEnrollInput(e.target.value)}
        />
        <Button
          type="button"
          className="w-full rounded-xl h-11 text-sm font-semibold transition-transform active:scale-[0.98]"
          disabled={bulkEnrollMut.isPending}
          aria-busy={bulkEnrollMut.isPending}
          onClick={() => bulkEnrollMut.mutate()}
        >
          {bulkEnrollMut.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin h-4 w-4 shrink-0" aria-hidden />
              Adding students…
            </span>
          ) : (
            "Add students to class"
          )}
        </Button>

        {rosterQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-accent" />
          </div>
        ) : (
          <ul className="space-y-2">
            {students.map((row) => {
              const contact = row.learner.email?.trim() || row.learner.phone?.trim() || "—";
              return (
                <li key={row.enrollmentId} className="rounded-xl border bg-card px-3 py-3 space-y-1">
                  <p className="text-sm font-semibold">{row.learner.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{contact}</p>
                  <p className="text-xs text-muted-foreground font-body">{joinedAgoLabel(row.enrolledAt)}</p>
                </li>
              );
            })}
          </ul>
        )}

      </div>
    </div>
  );
};

export default InstructorClassStudentsPage;
