import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, MessageCircle, Users } from "lucide-react";
import { mvpInstructorFocus } from "@/lib/productFocus";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import { useState } from "react";

type InvitePreview = {
  slug: string;
  title: string;
  category: string;
  format: string;
  city: string | null;
  durationLabel: string;
  priceDisplay: string;
  instructorName: string;
  published: boolean;
};

const JoinClassPage = () => {
  const { code: rawCode } = useParams<{ code: string }>();
  const code = rawCode?.trim().toUpperCase() ?? "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, ready, requestOtp, verifyOtp } = useAuth();
  const mvp = mvpInstructorFocus();

  const [joinPhone, setJoinPhone] = useState("");
  const [joinOtp, setJoinOtp] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinOtpSent, setJoinOtpSent] = useState(false);
  const [joinDemoOtp, setJoinDemoOtp] = useState<string | null>(null);
  const [joinDemoHint, setJoinDemoHint] = useState<string | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);

  const previewQuery = useQuery({
    queryKey: ["invite-preview", code],
    enabled: code.length >= 4,
    queryFn: async () => {
      const res = await apiFetch(`/api/courses/by-invite/${encodeURIComponent(code)}`);
      return parseJson<InvitePreview>(res);
    },
  });

  const joinMut = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/enrollments/join-invite", {
        method: "POST",
        body: JSON.stringify({ inviteCode: code }),
      });
      return parseJson<{ courseSlug: string }>(res);
    },
    onSuccess: (data) => {
      toast.success("You're enrolled");
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      const preview = queryClient.getQueryData<InvitePreview>(["invite-preview", code]);
      const title = preview?.title ?? "your class";
      try {
        sessionStorage.setItem(`classroomWelcome:${data.courseSlug}`, JSON.stringify({ title }));
      } catch {
        /* ignore */
      }
      navigate(`/learn/${data.courseSlug}/classroom`, { replace: true });
    },
    onError: (e: Error) => toast.error(e.message || "Could not join"),
  });

  const sendJoinOtp = async () => {
    if (!joinPhone.trim()) return;
    setJoinBusy(true);
    try {
      const out = await requestOtp(joinPhone);
      setJoinOtpSent(true);
      setJoinDemoOtp(out.demoOtp ?? null);
      setJoinDemoHint(out.demoOtpHint ?? null);
      toast.success(out.demoOtp ? "Code ready — see below" : "Code sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setJoinBusy(false);
    }
  };

  const verifyAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinOtp.length !== 6) return;
    setJoinBusy(true);
    try {
      await verifyOtp(joinPhone, joinOtp, joinName.trim() || undefined, "LEARNER");
      toast.success("Signed in");
      joinMut.mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setJoinBusy(false);
    }
  };

  if (!code || code.length < 4) {
    return (
      <main className="container mx-auto py-20 max-w-lg text-center">
        <h1 className="font-heading text-2xl text-foreground">Invalid invite link</h1>
        <p className="font-body text-sm text-muted-foreground mt-2">Ask your instructor for a valid link.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/courses">Browse classes</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-16 md:py-24 max-w-lg px-4">
      {previewQuery.isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
        </div>
      )}
      {previewQuery.isError && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 text-center">
          <h1 className="font-heading text-xl text-foreground">Class not found</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">This invite code may have expired or been replaced.</p>
          <Button asChild variant="outline" className="mt-6 rounded-full">
            <Link to="/courses">Browse classes</Link>
          </Button>
        </div>
      )}
      {previewQuery.data && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 md:p-8 space-y-4">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
            <Users className="h-5 w-5 text-accent" aria-hidden />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-body">Invite · {code}</p>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground mt-1">{previewQuery.data.title}</h1>
            <p className="font-body text-sm text-muted-foreground mt-2">
              with {previewQuery.data.instructorName} · {previewQuery.data.durationLabel} · {previewQuery.data.priceDisplay}
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              {previewQuery.data.category}
              {previewQuery.data.format === "IN_PERSON" && previewQuery.data.city ? ` · ${previewQuery.data.city}` : null}
              {previewQuery.data.format === "ONLINE" ? " · Online" : null}
              {!previewQuery.data.published ? " · Draft listing (invite still works)" : null}
            </p>
          </div>

          {!ready ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : !token ? (
            <form onSubmit={verifyAndJoin} className="space-y-4 pt-2 border-t border-border/40">
              <p className="font-body text-sm font-medium text-foreground">Sign in with your phone to join</p>
              <div className="space-y-2">
                <Label htmlFor="jphone">Mobile number</Label>
                <Input
                  id="jphone"
                  type="tel"
                  inputMode="tel"
                  value={joinPhone}
                  onChange={(e) => {
                    setJoinPhone(e.target.value);
                    setJoinDemoOtp(null);
                    setJoinDemoHint(null);
                  }}
                  autoComplete="tel"
                />
              </div>
              {!joinOtpSent ? (
                <Button
                  type="button"
                  className="w-full rounded-full h-11"
                  disabled={joinBusy || !joinPhone.trim()}
                  onClick={() => void sendJoinOtp()}
                >
                  {joinBusy ? <Loader2 className="animate-spin h-5 w-5" /> : "Send OTP"}
                </Button>
              ) : (
                <>
                  {joinDemoOtp ? (
                    <div className="rounded-xl border border-accent/50 bg-accent/10 px-3 py-3 text-center">
                      <p className="text-[10px] uppercase text-muted-foreground font-body">Demo code</p>
                      <p className="font-mono text-2xl tracking-widest font-semibold">{joinDemoOtp}</p>
                      {joinDemoHint ? <p className="text-[10px] text-muted-foreground mt-1">{joinDemoHint}</p> : null}
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="jotp">6-digit code</Label>
                    <Input
                      id="jotp"
                      inputMode="numeric"
                      maxLength={6}
                      value={joinOtp}
                      onChange={(e) => setJoinOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      autoComplete="one-time-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jname">Your name (first time only)</Label>
                    <Input
                      id="jname"
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                      autoComplete="name"
                      placeholder="Your name"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-full h-11"
                    disabled={joinBusy || joinOtp.length !== 6 || joinMut.isPending}
                  >
                    {joinBusy || joinMut.isPending ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      "Verify & join class"
                    )}
                  </Button>
                </>
              )}
            </form>
          ) : (
            <div className="pt-2 space-y-3">
              <Button
                type="button"
                className="w-full rounded-full h-11"
                disabled={joinMut.isPending}
                onClick={() => joinMut.mutate()}
              >
                {joinMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Join this class"}
              </Button>
              {mvp && typeof window !== "undefined" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full h-11 border-emerald-600/35 bg-emerald-500/[0.08] text-emerald-900 hover:bg-emerald-500/15 dark:text-emerald-100"
                  asChild
                >
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `I'm joining "${previewQuery.data.title}" — link:\n${window.location.origin}/join/${code}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="inline mr-2 h-4 w-4" aria-hidden />
                    Share invite on WhatsApp
                  </a>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default JoinClassPage;
