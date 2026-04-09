import { useEffect, useLayoutEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isValidIndianMobileDigits, normalizePhoneFieldInput } from "@/lib/phoneDigits";
import { mvpInstructorFocus } from "@/lib/productFocus";

type InstructorProCreateOrderRes = {
  order: {
    orderMode?: "live" | "stub";
    orderId: string;
    amountPaise: number;
    keyId: string;
    currency: string;
    plan: string;
  };
  note?: string;
};

function loadRazorpayScript(): Promise<void> {
  const w = window as unknown as { Razorpay?: unknown };
  if (w.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay Checkout"));
    document.body.appendChild(s);
  });
}

const SettingsPage = () => {
  const { user, token, ready, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const mvp = mvpInstructorFocus();
  const [proBusy, setProBusy] = useState(false);

  const subQuery = useQuery({
    queryKey: ["instructor-subscription-summary"],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && mvp),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/subscription-summary");
      return parseJson<{
        planTier: string;
        trialActive: boolean;
        trialEndsAt: string | null;
        distinctLearnerCount: number;
        freeLearnerCap: number;
        capReached: boolean;
        paid: boolean;
        monthlyPriceDisplay: string;
        upgradeNote: string;
        checkoutLive?: boolean;
        trialBypassAllowed?: boolean;
      }>(res);
    },
  });
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkPhone, setLinkPhone] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkDemoOtp, setLinkDemoOtp] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  useLayoutEffect(() => {
    if (!ready || !token || !user) return;
    const id = location.hash.replace(/^#/, "");
    if (id !== "instructor-plan") return;
    if (!mvp || user.role !== "INSTRUCTOR" || !subQuery.data) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("instructor-plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [ready, token, user, mvp, location.pathname, location.hash, subQuery.data]);

  if (!ready) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login?next=/settings" replace />;
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Name should be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/api/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed }),
      });
      await parseJson<{ user: { name: string } }>(res);
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container mx-auto py-16 md:py-24 max-w-lg">
      {mvp && user.role === "INSTRUCTOR" ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link to="/instructor/home">Teaching home</Link>
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" asChild>
            <Link to="/instructor/classes">Classes</Link>
          </Button>
        </div>
      ) : null}
      <h1 className="font-heading text-3xl text-foreground">Account</h1>
      <p className="font-body text-sm text-muted-foreground mt-2">
        Update how you appear on reviews and in the app. Email can’t be changed here yet.
      </p>

      {mvp && user.role === "INSTRUCTOR" && subQuery.data ? (
        <section id="instructor-plan" className="mt-10 scroll-mt-24 rounded-2xl border border-accent/35 bg-accent/5 p-5 md:p-6">
          <h2 className="font-heading text-lg text-foreground">Plan & upgrade</h2>
          <p className="font-body text-sm text-muted-foreground mt-2 leading-relaxed">
            {subQuery.data.paid
              ? `Current plan: ${subQuery.data.planTier.replace(/_/g, " ")}.`
              : subQuery.data.trialActive
                ? `Trial active — unlimited students for now. Then free tier allows up to ${subQuery.data.freeLearnerCap} students, or upgrade to ${subQuery.data.monthlyPriceDisplay}.`
                : `Free tier: up to ${subQuery.data.freeLearnerCap} students (${subQuery.data.distinctLearnerCount} on your roster). Upgrade: ${subQuery.data.monthlyPriceDisplay}.`}
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-body">{subQuery.data.upgradeNote}</p>
          {!subQuery.data.paid ? (
            <div className="mt-4 flex flex-col gap-2">
              {subQuery.data.checkoutLive ? (
                <Button
                  type="button"
                  className="rounded-full w-full sm:w-auto"
                  disabled={proBusy}
                  onClick={async () => {
                    setProBusy(true);
                    try {
                      const r1 = await apiFetch("/api/checkout/instructor-pro/create-order", { method: "POST", body: "{}" });
                      const data = await parseJson<InstructorProCreateOrderRes>(r1);
                      const { order } = data;
                      if (order.orderMode !== "live") {
                        toast.error(
                          "Payments are not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
                        );
                        return;
                      }
                      await loadRazorpayScript();
                      type RzResp = {
                        razorpay_payment_id: string;
                        razorpay_order_id: string;
                        razorpay_signature: string;
                      };
                      const Rzp = (
                        window as unknown as {
                          Razorpay: new (opts: Record<string, unknown>) => { on: (ev: string, fn: () => void) => void; open: () => void };
                        }
                      ).Razorpay;
                      const inst = new Rzp({
                        key: order.keyId,
                        amount: order.amountPaise,
                        currency: order.currency,
                        name: "Skillshare Hub",
                        description: "Instructor Pro (monthly)",
                        order_id: order.orderId,
                        prefill: {
                          name: user?.name ?? "",
                          email: user?.email ?? "",
                        },
                        handler: async (response: RzResp) => {
                          try {
                            const r2 = await apiFetch("/api/checkout/instructor-pro/confirm", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpaySignature: response.razorpay_signature,
                              }),
                            });
                            await parseJson(r2);
                            await refreshUser();
                            await queryClient.invalidateQueries({ queryKey: ["instructor-subscription-summary"] });
                            toast.success("Pro plan activated — payment verified");
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Could not verify payment");
                          }
                        },
                      });
                      inst.on("payment.failed", () => {
                        toast.error("Payment failed or was cancelled");
                      });
                      inst.open();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Checkout failed");
                    } finally {
                      setProBusy(false);
                    }
                  }}
                >
                  {proBusy ? <Loader2 className="animate-spin" size={18} /> : `Pay ${subQuery.data.monthlyPriceDisplay} with Razorpay`}
                </Button>
              ) : null}
              {subQuery.data.trialBypassAllowed ? (
                <>
                  <Button
                    type="button"
                    variant={subQuery.data.checkoutLive ? "outline" : "default"}
                    className="rounded-full w-full sm:w-auto"
                    disabled={proBusy || trialBusy}
                    onClick={async () => {
                      try {
                        const r = await apiFetch("/api/checkout/instructor-pro/upgrade-requested", {
                          method: "POST",
                          body: "{}",
                        });
                        await parseJson(r);
                        setTrialStep(1);
                        setTrialOpen(true);
                      } catch (e) {
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Trial activation is not available. Set CHECKOUT_DEV_BYPASS=1 on the API (non-production only).",
                        );
                      }
                    }}
                  >
                    Activate Pro (trial)
                  </Button>
                  <p className="text-[11px] text-muted-foreground font-body leading-relaxed">
                    No real charge — for internal testing or a short pilot. You’ll confirm whether {subQuery.data.monthlyPriceDisplay} would be
                    worth it; we log that for follow-up. Production should use Razorpay above when keys are set.
                  </p>
                </>
              ) : null}
              {!subQuery.data.checkoutLive && !subQuery.data.trialBypassAllowed ? (
                <p className="text-sm text-muted-foreground font-body">
                  Card checkout is not configured and trial activation is off. Add Razorpay keys on the API, or enable{" "}
                  <code className="text-xs">CHECKOUT_DEV_BYPASS=1</code> on a non-production server for pilot access.
                </p>
              ) : null}
              <Dialog
                open={trialOpen}
                onOpenChange={(open) => {
                  setTrialOpen(open);
                  if (!open) setTrialStep(1);
                }}
              >
                <DialogContent className="sm:max-w-md">
                  {trialStep === 1 ? (
                    <>
                      <DialogHeader>
                        <DialogTitle className="font-heading">Try Instructor Pro</DialogTitle>
                        <DialogDescription className="text-left font-body text-muted-foreground pt-1">
                          If this saved you time on roster, fees, and class comms — would you pay {subQuery.data.monthlyPriceDisplay} for it?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button
                          type="button"
                          className="w-full rounded-full"
                          disabled={trialBusy}
                          onClick={() => setTrialStep(2)}
                        >
                          Yes, I’d pay
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full rounded-full"
                          disabled={trialBusy}
                          onClick={async () => {
                            setTrialBusy(true);
                            try {
                              const r2 = await apiFetch("/api/checkout/instructor-pro/confirm", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ devBypass: true, trialIntent: "not_now" }),
                              });
                              await parseJson(r2);
                              setTrialOpen(false);
                              toast.message("Thanks — we’ll keep Pro off. Your feedback helps us price this fairly.");
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Could not save your choice");
                            } finally {
                              setTrialBusy(false);
                            }
                          }}
                        >
                          {trialBusy ? <Loader2 className="animate-spin" size={18} /> : "Not now"}
                        </Button>
                      </DialogFooter>
                    </>
                  ) : (
                    <>
                      <DialogHeader>
                        <DialogTitle className="font-heading">Activate Pro for now</DialogTitle>
                        <DialogDescription className="text-left font-body text-muted-foreground pt-1">
                          Card billing {subQuery.data.checkoutLive ? "can be used from the Pay button above" : "isn’t enabled on this server yet"}
                          . We’ll turn on Pro for you now so you can use every feature — no charge during this pilot. When you’re ready, we may
                          ask you to complete a real payment.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button
                          type="button"
                          className="w-full rounded-full"
                          disabled={trialBusy}
                          onClick={async () => {
                            setTrialBusy(true);
                            try {
                              const r2 = await apiFetch("/api/checkout/instructor-pro/confirm", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ devBypass: true, trialIntent: "would_pay" }),
                              });
                              await parseJson(r2);
                              await refreshUser();
                              await queryClient.invalidateQueries({ queryKey: ["instructor-subscription-summary"] });
                              setTrialOpen(false);
                              toast.success("Pro activated for your trial — thanks for the honest yes on pricing.");
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Could not activate trial");
                            } finally {
                              setTrialBusy(false);
                            }
                          }}
                        >
                          {trialBusy ? <Loader2 className="animate-spin" size={18} /> : "Activate trial Pro"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full rounded-full"
                          disabled={trialBusy}
                          onClick={() => setTrialStep(1)}
                        >
                          Back
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          ) : null}
          <Link
            to="/instructor/more"
            className="inline-flex mt-4 text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            Advanced tools &amp; Manage content
          </Link>
        </section>
      ) : null}

      <section className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-5 md:p-6">
        <h2 className="font-heading text-lg text-foreground flex items-center gap-2">
          <Smartphone size={18} className="text-accent shrink-0" aria-hidden />
          Mobile number
        </h2>
        <p className="font-body text-sm text-muted-foreground mt-2 leading-relaxed">
          Link your phone to sign in with OTP. We’ll send a 6-digit code to this number.
        </p>
        {user.phone ? (
          <p className="mt-4 text-sm font-body">
            Linked: <span className="font-medium text-foreground">{user.phone}</span>
          </p>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground font-body">No phone linked yet.</p>
        )}
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="linkPhone">Phone</Label>
            <Input
              id="linkPhone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile"
              value={linkPhone}
              onChange={(e) => setLinkPhone(normalizePhoneFieldInput(e.target.value))}
              autoComplete="tel"
              disabled={Boolean(user.phone)}
            />
          </div>
          {!user.phone && !linkSent ? (
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled={linkBusy || !isValidIndianMobileDigits(linkPhone)}
              onClick={async () => {
                setLinkBusy(true);
                try {
                  const res = await apiFetch("/api/me/phone/request-link", {
                    method: "POST",
                    body: JSON.stringify({ phone: linkPhone }),
                  });
                  const data = await parseJson<{ ok: boolean; demoOtp?: string }>(res);
                  setLinkSent(true);
                  setLinkDemoOtp(data.demoOtp ?? null);
                  toast.success(data.demoOtp ? "Code ready — check below" : "Check your phone for the code");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not send code");
                } finally {
                  setLinkBusy(false);
                }
              }}
            >
              {linkBusy ? <Loader2 className="animate-spin" size={18} /> : "Send verification code"}
            </Button>
          ) : null}
          {!user.phone && linkSent ? (
            <>
              {linkDemoOtp ? (
                <div className="rounded-xl border border-accent/50 bg-accent/10 px-3 py-3 text-center" role="status">
                  <p className="text-[10px] uppercase text-muted-foreground font-body">Verification code</p>
                  <p className="font-mono text-2xl tracking-widest font-semibold tabular-nums">{linkDemoOtp}</p>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="linkCode">6-digit code</Label>
                <Input
                  id="linkCode"
                  inputMode="numeric"
                  maxLength={6}
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                />
              </div>
              <Button
                type="button"
                className="rounded-full"
                disabled={linkBusy || linkCode.length !== 6}
                onClick={async () => {
                  setLinkBusy(true);
                  try {
                    const res = await apiFetch("/api/me/phone/verify-link", {
                      method: "POST",
                      body: JSON.stringify({ phone: linkPhone, code: linkCode }),
                    });
                    await parseJson<{ user: { phone: string | null } }>(res);
                    await refreshUser();
                    setLinkSent(false);
                    setLinkCode("");
                    setLinkPhone("");
                    toast.success("Phone linked");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not verify");
                  } finally {
                    setLinkBusy(false);
                  }
                }}
              >
                {linkBusy ? <Loader2 className="animate-spin" size={18} /> : "Verify & link"}
              </Button>
              <button
                type="button"
                className="block text-xs text-accent underline font-body"
                onClick={() => {
                  setLinkSent(false);
                  setLinkCode("");
                  setLinkDemoOtp(null);
                }}
              >
                Use a different number
              </button>
            </>
          ) : null}
        </div>
      </section>

      <form onSubmit={saveProfile} className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user.email} disabled className="bg-muted/40" />
          <p className="text-xs text-muted-foreground font-body">
            Email verification and change flow are not enabled in this demo build.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <Button type="submit" disabled={saving || name.trim() === user.name}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : "Save changes"}
        </Button>
      </form>

      <section className="mt-14 pt-10 border-t border-border/60">
        <h2 className="font-heading text-xl text-foreground">Password & security</h2>
        <p className="font-body text-sm text-muted-foreground mt-3 leading-relaxed">
          Password reset by email isn’t wired up yet. If you’re locked out on a self-hosted instance, an admin can reset your hash in the
          database, or create a new account for testing.
        </p>
      </section>

      <section className="mt-10">
        <Button type="button" variant="outline" className="rounded-full" onClick={() => { logout(); navigate("/"); }}>
          Log out
        </Button>
        <p className="mt-6 font-body text-sm">
          <Link to="/learn" className="text-accent underline">
            My learning
          </Link>
          {user.role === "INSTRUCTOR" ? (
            <>
              {" · "}
              <Link to="/instructor/home" className="text-accent underline">
                Teaching home
              </Link>
              {" · "}
              <Link to="/instructor/more" className="text-accent underline">
                Manage content
              </Link>
            </>
          ) : null}
        </p>
      </section>
    </main>
  );
};

export default SettingsPage;
