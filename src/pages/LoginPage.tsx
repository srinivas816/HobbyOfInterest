import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { isValidIndianMobileDigits, normalizePhoneFieldInput } from "@/lib/phoneDigits";

const NAME_REQUIRED_MSG = "Name required for new accounts";
const RESEND_SECONDS = 45;

function goAfterAuth(
  navigate: ReturnType<typeof useNavigate>,
  u: { intentChosen?: boolean; role: string },
  nextParam: string | null,
) {
  if (u.intentChosen === false) {
    navigate("/choose-role", { replace: true });
    return;
  }
  const next = nextParam?.trim();
  if (next && next.startsWith("/")) {
    navigate(next, { replace: true });
    return;
  }
  if (u.role === "INSTRUCTOR") {
    navigate("/instructor/home", { replace: true });
  } else {
    navigate("/learn", { replace: true });
  }
}

type Step = "phone" | "otp" | "name";

/**
 * Single phone → OTP flow. New numbers add a short name step before account is created.
 */
const LoginPage = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const nextParam = params.get("next");

  const { requestOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpName, setOtpName] = useState("");
  const [phoneDemoOtp, setPhoneDemoOtp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (!params.get("mode")) return;
    const next = new URLSearchParams(params);
    next.delete("mode");
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const sendOtp = async () => {
    if (!isValidIndianMobileDigits(phone)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setBusy(true);
    try {
      const out = await requestOtp(phone);
      setStep("otp");
      setOtpCode("");
      setOtpName("");
      setPhoneDemoOtp(out.demoOtp ?? null);
      setResendIn(RESEND_SECONDS);
      if (out.demoOtp) toast.success("Code ready below");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    if (!isValidIndianMobileDigits(phone) || busy || resendIn > 0) return;
    setBusy(true);
    try {
      const out = await requestOtp(phone);
      setOtpCode("");
      setPhoneDemoOtp(out.demoOtp ?? null);
      setResendIn(RESEND_SECONDS);
      toast.success(out.demoOtp ? "New code below" : "Code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setBusy(false);
    }
  };

  const completeVerify = async (name?: string) => {
    setBusy(true);
    try {
      const out = await verifyOtp(phone, otpCode, name?.trim() || undefined);
      toast.success("You're in");
      goAfterAuth(navigate, out.user, nextParam);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      if (msg.includes(NAME_REQUIRED_MSG)) {
        setStep("name");
        return;
      }
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6 || busy) return;
    void completeVerify();
  };

  const onSubmitName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = otpName.trim();
    if (trimmed.length < 2) {
      toast.error("Add your name to continue");
      return;
    }
    void completeVerify(trimmed);
  };

  const backToPhone = () => {
    setStep("phone");
    setOtpCode("");
    setOtpName("");
    setPhoneDemoOtp(null);
    setResendIn(0);
  };

  return (
    <main className="min-h-dvh flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center w-full max-w-[min(100%,22rem)] mx-auto px-5 py-10">
        {step === "phone" ? (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              void sendOtp();
            }}
          >
            <div className="space-y-2 text-center">
              <h1 className="font-heading text-2xl sm:text-[1.75rem] text-foreground tracking-tight">Continue with your phone</h1>
            </div>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter your mobile number"
              value={phone}
              onChange={(e) => {
                setPhone(normalizePhoneFieldInput(e.target.value));
                setPhoneDemoOtp(null);
              }}
              autoComplete="tel"
              autoFocus
              className="h-14 text-lg rounded-2xl border-border/80 bg-card px-4"
            />
            <Button
              type="submit"
              className="w-full h-14 text-base rounded-2xl font-semibold"
              disabled={busy || !isValidIndianMobileDigits(phone)}
            >
              {busy ? <Loader2 className="animate-spin" size={22} /> : "Continue"}
            </Button>
            <p className="text-center text-sm text-muted-foreground font-body">We&apos;ll send a code to verify</p>
          </form>
        ) : null}

        {step === "otp" ? (
          <form className="space-y-6" onSubmit={onVerifyOtp}>
            <div className="space-y-1 text-center">
              <h1 className="font-heading text-2xl sm:text-[1.75rem] text-foreground tracking-tight">Enter code</h1>
              <p className="text-sm text-muted-foreground font-body">
                Sent to <span className="text-foreground font-medium tabular-nums">•••••{phone.slice(-4)}</span>
              </p>
            </div>
            {phoneDemoOtp ? (
              <div
                className="rounded-2xl border border-accent/50 bg-accent/10 px-4 py-4 text-center"
                role="status"
                aria-live="polite"
              >
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Your code</p>
                <p className="font-mono text-3xl sm:text-4xl tracking-[0.2em] text-foreground font-semibold tabular-nums mt-1">
                  {phoneDemoOtp}
                </p>
              </div>
            ) : null}
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoComplete="one-time-code"
              autoFocus
              className="h-14 text-lg text-center tracking-[0.35em] font-mono rounded-2xl border-border/80 bg-card px-4"
            />
            <Button type="submit" className="w-full h-14 text-base rounded-2xl font-semibold" disabled={busy || otpCode.length !== 6}>
              {busy ? <Loader2 className="animate-spin" size={22} /> : "Verify"}
            </Button>
            <div className="flex flex-col items-center gap-3 pt-1">
              <button
                type="button"
                className="text-sm text-accent font-body font-medium disabled:opacity-40 disabled:pointer-events-none"
                disabled={busy || resendIn > 0}
                onClick={() => void resendOtp()}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Didn’t get a code? Resend"}
              </button>
              <button type="button" className="text-sm text-muted-foreground font-body underline-offset-4 hover:underline" onClick={backToPhone}>
                Use a different number
              </button>
            </div>
          </form>
        ) : null}

        {step === "name" ? (
          <form className="space-y-6" onSubmit={onSubmitName}>
            <div className="space-y-1 text-center">
              <h1 className="font-heading text-2xl sm:text-[1.75rem] text-foreground tracking-tight">What&apos;s your name?</h1>
            </div>
            <Input
              placeholder="Your name"
              value={otpName}
              onChange={(e) => setOtpName(e.target.value)}
              autoComplete="name"
              autoFocus
              minLength={2}
              className="h-14 text-lg rounded-2xl border-border/80 bg-card px-4"
            />
            <Button type="submit" className="w-full h-14 text-base rounded-2xl font-semibold" disabled={busy || otpName.trim().length < 2}>
              {busy ? <Loader2 className="animate-spin" size={22} /> : "Continue"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm text-muted-foreground font-body underline-offset-4 hover:underline"
              onClick={backToPhone}
            >
              Use a different number
            </button>
          </form>
        ) : null}

        {step === "phone" ? (
          <Link
            to="/courses"
            className="block text-center text-sm text-muted-foreground hover:text-foreground font-body mt-10 transition-colors"
          >
            Continue without login
          </Link>
        ) : null}
      </div>
    </main>
  );
};

export default LoginPage;
