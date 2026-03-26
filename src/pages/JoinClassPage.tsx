import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Loader2,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { mvpInstructorFocus } from "@/lib/productFocus";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const JOIN_NAME_KEY = "join_last_display_name";
const OTP_RESEND_SECONDS = 45;

type PreviewErrorKind = "invalid" | "gone" | "other";

function previewErrorFromUnknown(e: unknown): { kind: PreviewErrorKind; message: string } {
  const err = e as { previewKind?: PreviewErrorKind; message?: string };
  if (err?.previewKind === "invalid") return { kind: "invalid", message: err.message ?? "Invalid code" };
  if (err?.previewKind === "gone") return { kind: "gone", message: err.message ?? "Not found" };
  return { kind: "other", message: err instanceof Error ? err.message : "Something went wrong" };
}

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
  studentCount?: number;
  instructorCourseCount?: number;
  nextSessionLabel?: string | null;
  alreadyEnrolled?: boolean;
};

type JoinInviteErr = Error & { status?: number; courseSlug?: string; detail?: string };

async function postJoinInvite(inviteCode: string): Promise<{ courseSlug: string }> {
  const res = await apiFetch("/api/enrollments/join-invite", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }
  if (!res.ok) {
    const msg = typeof data.error === "string" ? data.error : "Could not join";
    const err = new Error(msg) as JoinInviteErr;
    err.status = res.status;
    if (typeof data.courseSlug === "string") err.courseSlug = data.courseSlug;
    if (typeof data.detail === "string") err.detail = data.detail;
    throw err;
  }
  return data as { courseSlug: string; ok?: boolean };
}

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
  const [joinFailure, setJoinFailure] = useState<JoinInviteErr | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ courseSlug: string; title: string } | null>(null);
  const [slowNetworkHint, setSlowNetworkHint] = useState(false);
  const [otpInlineError, setOtpInlineError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const otpStepRef = useRef<HTMLDivElement>(null);

  const previewQuery = useQuery({
    queryKey: ["invite-preview", code, token ?? ""],
    enabled: code.length >= 4,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await apiFetch(`/api/courses/by-invite/${encodeURIComponent(code)}`);
      const text = await res.text();
      if (res.status === 400) {
        const e = new Error("That invite link isn’t formatted correctly.") as Error & { previewKind: PreviewErrorKind };
        e.previewKind = "invalid";
        throw e;
      }
      if (res.status === 404) {
        const e = new Error("This invite isn’t valid anymore.") as Error & { previewKind: PreviewErrorKind };
        e.previewKind = "gone";
        throw e;
      }
      if (!res.ok) {
        const e = new Error("Could not load this invite.") as Error & { previewKind: PreviewErrorKind };
        e.previewKind = "other";
        throw e;
      }
      let data: InvitePreview;
      try {
        data = JSON.parse(text) as InvitePreview;
      } catch {
        const e = new Error("Invalid response") as Error & { previewKind: PreviewErrorKind };
        e.previewKind = "other";
        throw e;
      }
      return data;
    },
  });

  const p = previewQuery.data;

  const joinMut = useMutation({
    mutationFn: () => postJoinInvite(code),
    onSuccess: (data) => {
      setJoinFailure(null);
      void queryClient.invalidateQueries({ queryKey: ["invite-preview"] });
      void queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      const title = p?.title ?? "your class";
      try {
        sessionStorage.setItem(`classroomWelcome:${data.courseSlug}`, JSON.stringify({ title }));
      } catch {
        /* ignore */
      }
      setSuccessInfo({ courseSlug: data.courseSlug, title });
    },
    onError: (e: Error) => {
      const err = e as JoinInviteErr;
      setJoinFailure(err);
    },
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(JOIN_NAME_KEY);
      if (saved) setJoinName(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onPageShow = (ev: PageTransitionEvent) => {
      if (ev.persisted) void queryClient.invalidateQueries({ queryKey: ["invite-preview", code] });
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [code, queryClient]);

  const longWaitActive =
    joinMut.isPending || joinBusy || previewQuery.isFetching || (previewQuery.isLoading && code.length >= 4);
  useEffect(() => {
    if (!longWaitActive) {
      setSlowNetworkHint(false);
      return;
    }
    const t = window.setTimeout(() => setSlowNetworkHint(true), 2800);
    return () => window.clearTimeout(t);
  }, [longWaitActive]);

  useEffect(() => {
    if (!joinOtpSent || !otpStepRef.current) return;
    const t = window.setTimeout(() => {
      otpStepRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [joinOtpSent]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const sendJoinOtp = async (isResend = false) => {
    if (!joinPhone.trim() || joinBusy) return;
    if (isResend && resendIn > 0) return;
    setJoinBusy(true);
    setOtpInlineError(null);
    try {
      const out = await requestOtp(joinPhone);
      setJoinOtpSent(true);
      setJoinDemoOtp(out.demoOtp ?? null);
      setJoinDemoHint(out.demoOtpHint ?? null);
      setResendIn(OTP_RESEND_SECONDS);
      if (isResend) {
        setJoinOtp("");
        toast.success("New code sent");
      } else {
        toast.success(out.demoOtp ? "Code ready — see below" : "We sent a code to your phone");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setJoinBusy(false);
    }
  };

  const verifyAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinOtp.length !== 6 || joinBusy || joinMut.isPending) return;
    setJoinBusy(true);
    setJoinFailure(null);
    setOtpInlineError(null);
    try {
      await verifyOtp(joinPhone, joinOtp, joinName.trim() || undefined, "LEARNER");
      const trimmed = joinName.trim();
      if (trimmed) {
        try {
          localStorage.setItem(JOIN_NAME_KEY, trimmed);
        } catch {
          /* ignore */
        }
      }
      await joinMut.mutateAsync();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "That code didn’t work. Try again or request a new code.";
      setOtpInlineError(msg);
    } finally {
      setJoinBusy(false);
    }
  };

  const structuredJoinFailure =
    joinFailure &&
    (joinFailure.status === 401 || joinFailure.status === 403 || joinFailure.status === 409);

  const enterClassroom = (slug: string) => {
    navigate(`/learn/${slug}/classroom`, { replace: true });
  };

  if (!code || code.length < 4) {
    return (
      <main className="container mx-auto py-20 max-w-lg text-center px-4">
        <h1 className="font-heading text-2xl text-foreground">Invalid invite link</h1>
        <p className="font-body text-sm text-muted-foreground mt-2">Ask your instructor for a valid link.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/courses">Browse classes</Link>
        </Button>
      </main>
    );
  }

  if (successInfo) {
    return (
      <main className="container mx-auto py-12 md:py-20 max-w-lg px-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-card p-8 text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-8 w-8" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 uppercase tracking-wide">You&apos;re in</p>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground mt-2">{successInfo.title}</h1>
            <p className="text-sm text-muted-foreground font-body mt-2">Welcome — your spot is saved.</p>
          </div>
          <ul className="text-left rounded-2xl border border-border/60 bg-background/80 p-4 space-y-2 text-sm font-body">
            <li className="flex gap-2">
              <CalendarClock className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden />
              <span>Check today&apos;s session and schedule in the classroom.</span>
            </li>
            <li className="flex gap-2">
              <MessageCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden />
              <span>View announcements and updates from your instructor.</span>
            </li>
          </ul>
          <Button
            type="button"
            className="w-full rounded-full h-14 text-base font-bold shadow-md"
            onClick={() => enterClassroom(successInfo.courseSlug)}
          >
            Enter classroom
          </Button>
        </div>
      </main>
    );
  }

  const previewFail = previewQuery.isError ? previewErrorFromUnknown(previewQuery.error) : null;

  return (
    <main className="container mx-auto min-h-dvh py-10 md:py-16 max-w-lg px-4 pb-28 scroll-pt-24">
      {slowNetworkHint && longWaitActive ? (
        <p
          className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-950 dark:text-amber-100 font-body"
          role="status"
        >
          This is taking longer than usual — check your connection. You can keep waiting; it&apos;s still working.
        </p>
      ) : null}
      {previewQuery.isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
        </div>
      )}
      {previewQuery.isError && previewFail && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 text-center space-y-2">
          {previewFail.kind === "invalid" ? (
            <>
              <h1 className="font-heading text-xl text-foreground">Invalid invite link</h1>
              <p className="font-body text-sm text-muted-foreground">The code in the URL doesn&apos;t look right. Double-check the link your instructor sent.</p>
            </>
          ) : previewFail.kind === "gone" ? (
            <>
              <h1 className="font-heading text-xl text-foreground">Invite no longer active</h1>
              <p className="font-body text-sm text-muted-foreground">
                This link may have expired or been replaced with a new code. Ask your instructor for the latest invite.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-heading text-xl text-foreground">Couldn&apos;t load invite</h1>
              <p className="font-body text-sm text-muted-foreground">{previewFail.message}</p>
            </>
          )}
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link to="/courses">Browse classes</Link>
          </Button>
        </div>
      )}
      {p && (
        <div className="space-y-6">
          <div
            className={cn(
              "rounded-3xl border-2 border-border/70 bg-gradient-to-b from-accent/5 to-card p-6 md:p-8 space-y-5 shadow-sm",
              "animate-in fade-in slide-in-from-bottom-2 duration-300",
            )}
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-foreground/80">{code}</span>
              <span>Invite</span>
            </div>

            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-foreground leading-tight">
                Join {p.title}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground font-body">
                <GraduationCap className="h-4 w-4 text-accent shrink-0" aria-hidden />
                <span>
                  By <span className="font-semibold">{p.instructorName}</span>
                </span>
                {p.instructorCourseCount > 1 ? (
                  <span className="text-xs text-muted-foreground">· Teaching {p.instructorCourseCount} classes</span>
                ) : (
                  <span className="text-xs text-muted-foreground">· Trusted instructor</span>
                )}
              </p>
            </div>

            <div className="grid gap-2 rounded-2xl bg-muted/40 border border-border/50 p-4 text-sm font-body">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-accent shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="font-bold text-foreground">
                    {p.studentCount ?? 0} student{(p.studentCount ?? 0) === 1 ? "" : "s"} already learning
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">You won&apos;t be alone in this class.</p>
                </div>
              </div>
              {(p.nextSessionLabel || p.durationLabel) && (
                <div className="flex items-start gap-3 pt-1 border-t border-border/40">
                  <CalendarClock className="h-5 w-5 text-accent shrink-0 mt-0.5" aria-hidden />
                  <div>
                    {p.nextSessionLabel ? (
                      <>
                        <p className="font-semibold text-foreground">Next class</p>
                        <p className="text-muted-foreground">{p.nextSessionLabel}</p>
                      </>
                    ) : null}
                    {p.durationLabel ? (
                      <p className={cn("text-muted-foreground", p.nextSessionLabel && "text-xs mt-1")}>
                        {p.nextSessionLabel ? "Typical time · " : ""}
                        {p.durationLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
                <p className="font-semibold text-sm">Start learning today</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-body">
              {p.category}
              {p.format === "IN_PERSON" && p.city ? ` · ${p.city}` : null}
              {p.format === "ONLINE" ? " · Online" : null}
              {!p.published ? " · Listing draft (invite works)" : null}
              {" · "}
              {p.priceDisplay}
            </p>

            {p.alreadyEnrolled ? (
              <div className="rounded-2xl border-2 border-emerald-500/35 bg-emerald-500/10 p-5 space-y-3">
                <p className="font-heading text-lg text-foreground">You&apos;re already part of this class</p>
                <p className="text-sm text-muted-foreground font-body">Open the classroom to continue where you left off.</p>
                <Button
                  type="button"
                  className="w-full rounded-full h-12 text-base font-bold"
                  onClick={() => enterClassroom(p.slug)}
                >
                  Open classroom
                </Button>
              </div>
            ) : !ready ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : !token ? (
              <form onSubmit={verifyAndJoin} className="space-y-4 pt-2 border-t border-border/40">
                <div>
                  <p className="font-body text-base font-semibold text-foreground">Join this class in 30 seconds</p>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Enter your phone number to join instantly — we&apos;ll send a quick code. No passwords or long signup.
                  </p>
                </div>
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
                    placeholder="Your mobile number"
                  />
                </div>
                {!joinOtpSent ? (
                  <Button
                    type="button"
                    className="w-full rounded-full h-12 text-base font-bold"
                    disabled={joinBusy || !joinPhone.trim()}
                    onClick={() => void sendJoinOtp(false)}
                  >
                    {joinBusy ? (
                      <>
                        <Loader2 className="inline animate-spin h-5 w-5 mr-2" aria-hidden />
                        Sending…
                      </>
                    ) : (
                      "Send code"
                    )}
                  </Button>
                ) : (
                  <div ref={otpStepRef} className="space-y-4 scroll-mt-28">
                    <p className="text-sm text-muted-foreground font-body">We sent a code to your phone. Enter it below to join instantly.</p>
                    {joinDemoOtp ? (
                      <div className="rounded-xl border border-accent/50 bg-accent/10 px-3 py-3 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground font-body">Demo code</p>
                        <p className="font-mono text-2xl tracking-widest font-semibold">{joinDemoOtp}</p>
                        {joinDemoHint ? <p className="text-[10px] text-muted-foreground mt-1">{joinDemoHint}</p> : null}
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor="jotp">6-digit code</Label>
                      {otpInlineError ? (
                        <p className="text-sm text-destructive font-medium font-body" role="alert">
                          {otpInlineError}
                        </p>
                      ) : null}
                      <Input
                        id="jotp"
                        inputMode="numeric"
                        maxLength={6}
                        value={joinOtp}
                        onChange={(e) => {
                          setOtpInlineError(null);
                          setJoinOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        }}
                        autoComplete="one-time-code"
                        aria-invalid={otpInlineError ? true : undefined}
                        className={otpInlineError ? "border-destructive focus-visible:ring-destructive/40" : undefined}
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
                      className="w-full rounded-full h-12 text-base font-bold"
                      disabled={joinBusy || joinOtp.length !== 6 || joinMut.isPending}
                    >
                      {joinBusy || joinMut.isPending ? (
                        <>
                          <Loader2 className="inline animate-spin h-5 w-5 mr-2" aria-hidden />
                          Joining…
                        </>
                      ) : (
                        "Verify & join class"
                      )}
                    </Button>
                  </div>
                )}
              </form>
            ) : (
              <div className="pt-2 space-y-3 border-t border-border/40">
                <Button
                  type="button"
                  className="w-full rounded-full h-14 text-base font-bold shadow-md"
                  disabled={joinMut.isPending}
                  onClick={() => {
                    setJoinFailure(null);
                    joinMut.mutate();
                  }}
                >
                  {joinMut.isPending ? (
                    <>
                      <Loader2 className="inline animate-spin h-5 w-5 mr-2" aria-hidden />
                      Joining…
                    </>
                  ) : (
                    "Join this class in 30 seconds"
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground font-body">No password — you&apos;re already signed in.</p>
                {mvp && typeof window !== "undefined" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full h-11 border-emerald-600/35 bg-emerald-500/[0.08] text-emerald-900 hover:bg-emerald-500/15 dark:text-emerald-100"
                    asChild
                  >
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `I'm joining "${p.title}" — link:\n${window.location.origin}/join/${code}`,
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

          {joinFailure && joinFailure.status === 403 && (
            <div
              className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-5 space-y-3 animate-in fade-in duration-200"
              role="alert"
            >
              <p className="font-heading text-lg text-foreground">This class is full</p>
              <p className="text-sm text-muted-foreground font-body">
                Ask your instructor for a new invite, or try again after they make room.
              </p>
              {joinFailure.detail ? (
                <p className="text-xs text-muted-foreground font-body border-t border-amber-500/20 pt-2">{joinFailure.detail}</p>
              ) : null}
              {joinFailure.courseSlug ? (
                <Button type="button" variant="outline" className="rounded-full" asChild>
                  <Link to={`/courses/${encodeURIComponent(joinFailure.courseSlug)}`}>View class page</Link>
                </Button>
              ) : null}
            </div>
          )}

          {joinFailure && joinFailure.status === 409 && joinFailure.courseSlug && (
            <div
              className="rounded-2xl border-2 border-emerald-500/35 bg-emerald-500/10 p-5 space-y-3 animate-in fade-in duration-200"
              role="alert"
            >
              <p className="font-heading text-lg text-foreground">You&apos;re already in this class</p>
              <p className="text-sm text-muted-foreground font-body">Head to the classroom — nothing else to do here.</p>
              <Button type="button" className="w-full rounded-full h-12 font-bold" onClick={() => enterClassroom(joinFailure.courseSlug!)}>
                Go to classroom
              </Button>
            </div>
          )}

          {joinFailure && joinFailure.status === 401 && (
            <div
              className="rounded-2xl border-2 border-border p-5 space-y-3 animate-in fade-in duration-200"
              role="alert"
            >
              <p className="font-heading text-lg text-foreground">Session expired</p>
              <p className="text-sm text-muted-foreground font-body">Sign in again, then reopen this invite link.</p>
              <Button type="button" className="w-full rounded-full h-12 font-bold" asChild>
                <Link to={`/login?next=${encodeURIComponent(`/join/${code}`)}`}>Sign in</Link>
              </Button>
            </div>
          )}

          {joinFailure && !structuredJoinFailure ? (
            <div
              className="rounded-2xl border-2 border-border/80 bg-muted/30 p-5 space-y-3 animate-in fade-in duration-200"
              role="alert"
            >
              <p className="font-heading text-lg text-foreground">Something went wrong</p>
              <p className="text-sm text-muted-foreground font-body">
                {joinFailure.message || "We couldn’t finish joining this class."}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="w-full rounded-full h-12 font-bold"
                onClick={() => setJoinFailure(null)}
              >
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
};

export default JoinClassPage;
