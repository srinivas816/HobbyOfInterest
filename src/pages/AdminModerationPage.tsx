import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import DataStateCard from "@/components/DataStateCard";
import { Button } from "@/components/ui/button";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  reported: boolean;
  hidden: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
  course: { slug: string; title: string };
};

type PayoutRequestRow = {
  id: string;
  amountDisplay: string;
  status: string;
  instructorNote: string | null;
  adminNote: string | null;
  createdAt: string;
  instructor: { id: string; name: string; email: string };
};

const AdminModerationPage = () => {
  const { token, ready, user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.email?.toLowerCase() === "admin@demo.com";
  const [payoutAdminNoteDraft, setPayoutAdminNoteDraft] = useState<Record<string, string>>({});

  const adminNoteFor = (row: PayoutRequestRow) =>
    payoutAdminNoteDraft[row.id] !== undefined ? payoutAdminNoteDraft[row.id]! : (row.adminNote ?? "");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-reviews"],
    enabled: Boolean(token && isAdmin),
    queryFn: async () => {
      const res = await apiFetch("/api/admin/reviews");
      return parseJson<{ reviews: ReviewRow[] }>(res);
    },
  });

  const payoutQuery = useQuery({
    queryKey: ["admin-payout-requests"],
    enabled: Boolean(token && isAdmin),
    queryFn: async () => {
      const res = await apiFetch("/api/admin/payout-requests");
      return parseJson<{ payoutRequests: PayoutRequestRow[] }>(res);
    },
  });

  const moderate = useMutation({
    mutationFn: async ({ id, hidden, reported }: { id: string; hidden?: boolean; reported?: boolean }) => {
      const res = await apiFetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ hidden, reported }),
      });
      await parseJson<{ review: { id: string } }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review updated");
    },
  });

  const patchPayout = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
    }: {
      id: string;
      status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
      adminNote?: string | null;
    }) => {
      const res = await apiFetch(`/api/admin/payout-requests/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNote: adminNote ?? undefined }),
      });
      await parseJson<{ payoutRequest: { id: string } }>(res);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      setPayoutAdminNoteDraft((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      toast.success("Payout updated");
    },
    onError: (e: Error) => toast.error(e.message || "Update failed"),
  });

  if (!ready) return <main className="container mx-auto py-20">Loading...</main>;
  if (!token) return <Navigate to="/login?next=/admin/moderation" replace />;
  if (!isAdmin) return <main className="container mx-auto py-20">Admin access only.</main>;

  return (
    <main className="container mx-auto py-16 pb-24">
      <h1 className="font-heading text-3xl">Admin Moderation</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Review reported/hidden reviews and process instructor payout requests (demo balances).
      </p>
      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading reviews...</p>}
      {isError && <p className="mt-8 text-sm text-destructive">Could not load moderation queue.</p>}
      <div className="mt-8 space-y-4">
        {data?.reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border p-4">
            <div className="flex justify-between gap-4">
              <div>
                <p className="font-medium">{review.course.title}</p>
                <p className="text-xs text-muted-foreground">
                  by {review.user.name} ({review.user.email}) · {review.rating}★
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                {review.reported ? "Reported" : "Not reported"} · {review.hidden ? "Hidden" : "Visible"}
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{review.comment || "(No comment)"}</p>
            <div className="mt-3 flex gap-2">
              <button
                className="rounded-full border px-3 py-1 text-xs"
                onClick={() => moderate.mutate({ id: review.id, hidden: !review.hidden })}
              >
                {review.hidden ? "Unhide" : "Hide"}
              </button>
              <button
                className="rounded-full border px-3 py-1 text-xs"
                onClick={() => moderate.mutate({ id: review.id, reported: false })}
              >
                Clear report
              </button>
            </div>
          </div>
        ))}
        {data && data.reviews.length === 0 && (
          <DataStateCard
            title="Moderation queue is clear"
            description="No reported or hidden reviews right now."
            ctaLabel="Go to courses"
            ctaTo="/courses"
          />
        )}
      </div>

      <h2 className="font-heading text-2xl mt-16 mb-2">Payout requests</h2>
      <p className="text-sm text-muted-foreground mb-6">Demo workflow: approve or mark paid / rejected. Optional admin note.</p>
      {payoutQuery.isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-accent" size={24} />
        </div>
      )}
      {payoutQuery.isError && <p className="text-sm text-destructive">Could not load payout queue.</p>}
      <div className="space-y-4">
        {payoutQuery.data?.payoutRequests.map((row) => (
          <div key={row.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">{row.amountDisplay}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {row.instructor.name} ({row.instructor.email})
                </p>
                <p className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</p>
              </div>
              <span className="text-xs font-medium rounded-full border px-2 py-1 h-fit">{row.status}</span>
            </div>
            {row.instructorNote ? (
              <p className="mt-2 text-sm text-muted-foreground">Instructor: {row.instructorNote}</p>
            ) : null}
            <label className="block mt-3 text-xs text-muted-foreground font-body">Admin note (optional, max 500)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-border/60 bg-background p-2.5 text-sm min-h-[72px] font-body"
              maxLength={500}
              value={adminNoteFor(row)}
              onChange={(e) => setPayoutAdminNoteDraft((m) => ({ ...m, [row.id]: e.target.value }))}
              placeholder="Reason for decision, reference ID, etc."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {(["APPROVED", "PAID", "REJECTED"] as const).map((st) => (
                <Button
                  key={st}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  disabled={patchPayout.isPending}
                  onClick={() =>
                    patchPayout.mutate({
                      id: row.id,
                      status: st,
                      adminNote: adminNoteFor(row).trim() || null,
                    })
                  }
                >
                  Mark {st.toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        ))}
        {payoutQuery.data && payoutQuery.data.payoutRequests.length === 0 && (
          <DataStateCard
            title="No payout requests"
            description="Instructors submit payout requests from Manage content (More menu) → Teaching tools → Payouts."
            ctaLabel="Open Manage content"
            ctaTo="/instructor/studio?tool=payout#studio-teaching-tools"
          />
        )}
      </div>
    </main>
  );
};

export default AdminModerationPage;
