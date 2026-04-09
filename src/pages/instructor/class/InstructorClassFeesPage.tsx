import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { InstructorClassSubHeader } from "./InstructorClassSubHeader";
import {
  formatFeeMonthHeading,
  studioCoursesQueryOptions,
  workspaceQueryOptions,
} from "./classWorkspaceUtils";
import { formatInrFromPaise } from "@/lib/inr";

type FeesRosterData = {
  course: {
    title: string;
    monthlyFeeDisplay: string;
    feeMonth: string;
    priceCents?: number;
  };
  summary: { pendingFeesCount: number };
  students: Array<{
    enrollmentId: string;
    learner: { name: string };
    feeStatus: "PAID" | "PENDING";
  }>;
};

function defaultYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const InstructorClassFeesPage = () => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam?.trim() ?? "";
  const location = useLocation();
  const { user, token, ready } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const monthFromUrl = searchParams.get("month");
  const initialMonth =
    monthFromUrl && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthFromUrl) ? monthFromUrl : defaultYearMonth();
  const [feeYearMonth, setFeeYearMonth] = useState(initialMonth);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const coursesQ = useQuery({
    queryKey: ["studio-courses"],
    ...studioCoursesQueryOptions,
    enabled: Boolean(token && user?.role === "INSTRUCTOR"),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/courses");
      return parseJson<{ courses: Array<{ slug: string; title: string }> }>(res);
    },
  });

  const rosterQuery = useQuery({
    queryKey: ["studio-roster", slug, feeYearMonth],
    ...workspaceQueryOptions,
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/roster?feeMonth=${encodeURIComponent(feeYearMonth)}`,
      );
      return parseJson<FeesRosterData>(res);
    },
  });

  const saveFeeOne = useMutation({
    mutationFn: async ({ enrollmentId, status }: { enrollmentId: string; status: "PAID" | "PENDING" }) => {
      const ym = rosterQuery.data?.course.feeMonth ?? feeYearMonth;
      const res = await apiFetch(
        `/api/instructor-studio/courses/${encodeURIComponent(slug)}/fees/${encodeURIComponent(ym)}`,
        { method: "PUT", body: JSON.stringify({ rows: [{ enrollmentId, status }] }) },
      );
      await parseJson<{ ok: boolean }>(res);
    },
    onMutate: async ({ enrollmentId, status }) => {
      const key = ["studio-roster", slug, feeYearMonth] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FeesRosterData>(key);
      if (!previous) return { previous: undefined as FeesRosterData | undefined };
      queryClient.setQueryData<FeesRosterData>(key, (old) => {
        if (!old) return old;
        const students = old.students.map((s) =>
          s.enrollmentId === enrollmentId ? { ...s, feeStatus: status } : s,
        );
        const pendingFeesCount = students.filter((s) => s.feeStatus === "PENDING").length;
        return { ...old, students, summary: { ...old.summary, pendingFeesCount } };
      });
      return { previous };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(["studio-roster", slug, feeYearMonth], ctx.previous);
      }
      toast.error(e instanceof Error ? e.message : "Could not update fee");
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-today"] });
      toast.success(v.status === "PAID" ? "Payment recorded" : "Marked as pending", { duration: 2000 });
    },
  });

  const applyMonth = (ym: string) => {
    setFeeYearMonth(ym);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("month", ym);
      return next;
    }, { replace: true });
    setMonthPickerOpen(false);
  };

  useEffect(() => {
    if (location.hash !== "#fee-remind") return;
    const t = window.setTimeout(() => {
      document.getElementById("fee-remind")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [location.hash, rosterQuery.isSuccess, rosterQuery.data?.summary.pendingFeesCount]);

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

  const pendingFees = rosterQuery.data?.summary.pendingFeesCount ?? 0;
  const priceCents = rosterQuery.data?.course.priceCents ?? 0;
  const students = rosterQuery.data?.students ?? [];
  const paidCount = students.filter((s) => s.feeStatus === "PAID").length;
  const collectedPaise = paidCount * priceCents;
  const pendingPaise = pendingFees * priceCents;
  const remindAllHref =
    rosterQuery.data && pendingFees > 0
      ? `https://wa.me/?text=${encodeURIComponent(
          `Reminder: ${rosterQuery.data.course.monthlyFeeDisplay || "Monthly fee"} for "${rosterQuery.data.course.title}" is still pending for ${rosterQuery.data.course.feeMonth}. Thank you!\n\n— ${user?.name ?? "Instructor"}`,
        )}`
      : "";

  const monthFeesTitle = `${formatFeeMonthHeading(feeYearMonth)} fees`;

  return (
    <div className="min-h-full flex flex-col pb-10">
      <InstructorClassSubHeader slug={slug} title={monthFeesTitle} />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4 flex-1">
        {rosterQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-accent h-8 w-8" />
          </div>
        ) : rosterQuery.data ? (
          <>
            <p className="text-sm font-body">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{formatInrFromPaise(collectedPaise)} paid</span>
              <span className="text-muted-foreground"> · </span>
              <span className="text-amber-800 dark:text-amber-200 font-medium">{formatInrFromPaise(pendingPaise)} due</span>
            </p>
            {pendingFees > 0 ? (
              <div id="fee-remind">
                <Button className="rounded-xl h-11 w-full text-sm font-semibold transition-transform active:scale-[0.98]" asChild={Boolean(remindAllHref)} disabled={!remindAllHref}>
                  {remindAllHref ? (
                    <a href={remindAllHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4 inline" />
                      Send all reminders on WhatsApp
                    </a>
                  ) : (
                    <span>Send all reminders on WhatsApp</span>
                  )}
                </Button>
              </div>
            ) : null}
            <ul className="space-y-2">
              {rosterQuery.data.students.map((row) => {
                const first = row.learner.name.split(" ")[0] ?? row.learner.name;
                const waOne = `https://wa.me/?text=${encodeURIComponent(
                  `Hi ${first} — reminder: ${rosterQuery.data!.course.monthlyFeeDisplay} for "${rosterQuery.data!.course.title}" (${feeYearMonth}) is pending. Thank you!`,
                )}`;
                return (
                  <li
                    key={row.enrollmentId}
                    className={`rounded-xl border px-3 py-3 flex flex-col gap-2 ${
                      row.feeStatus === "PENDING" ? "border-amber-500/35 bg-amber-500/[0.06]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <p className="font-semibold text-sm truncate">{row.learner.name}</p>
                      <span
                        className={`shrink-0 text-xs font-bold ${
                          row.feeStatus === "PAID" ? "text-emerald-600" : "text-amber-800 dark:text-amber-200"
                        }`}
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
                            className="rounded-lg h-9 text-xs flex-1 min-w-[6rem] transition-transform active:scale-[0.98]"
                            disabled={saveFeeOne.isPending}
                            aria-busy={saveFeeOne.isPending && saveFeeOne.variables?.enrollmentId === row.enrollmentId}
                            onClick={() => saveFeeOne.mutate({ enrollmentId: row.enrollmentId, status: "PAID" })}
                          >
                            {saveFeeOne.isPending && saveFeeOne.variables?.enrollmentId === row.enrollmentId ? (
                              <span className="inline-flex items-center justify-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
                                Saving…
                              </span>
                            ) : (
                              "Record payment"
                            )}
                          </Button>
                          <Button type="button" size="sm" variant="outline" className="rounded-lg h-9 text-xs flex-1 min-w-[6rem] transition-transform active:scale-[0.98]" asChild>
                            <a href={waOne} target="_blank" rel="noreferrer">
                              Send WhatsApp reminder
                            </a>
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div>
              <button
                type="button"
                onClick={() => setMonthPickerOpen((o) => !o)}
                className="text-xs font-semibold text-accent hover:underline font-body transition-opacity duration-150 active:opacity-70"
              >
                Change month
              </button>
              {monthPickerOpen ? (
                <input
                  type="month"
                  className="mt-2 rounded-lg border bg-background px-2 py-1.5 text-sm w-full max-w-[11rem]"
                  value={feeYearMonth}
                  onChange={(e) => applyMonth(e.target.value)}
                />
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default InstructorClassFeesPage;
