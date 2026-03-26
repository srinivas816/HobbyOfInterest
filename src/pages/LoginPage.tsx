import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { mvpInstructorFocus } from "@/lib/productFocus";

const LoginPage = () => {
  const [params] = useSearchParams();
  const next = params.get("next") || "/learn";
  const modeParam = params.get("mode");
  const navigate = useNavigate();
  const { login, register, requestOtp, verifyOtp } = useAuth();
  const [authChannel, setAuthChannel] = useState<"email" | "phone">("email");
  const [mode, setMode] = useState<"login" | "register">(modeParam === "register" ? "register" : "login");
  const [registerRole, setRegisterRole] = useState<"LEARNER" | "INSTRUCTOR">(
    params.get("role") === "instructor" ? "INSTRUCTOR" : "LEARNER",
  );
  /** OTP: required before sending code; only used for new accounts server-side */
  const [otpIntent, setOtpIntent] = useState<"LEARNER" | "INSTRUCTOR" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpName, setOtpName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneDemoOtp, setPhoneDemoOtp] = useState<string | null>(null);
  const [phoneDemoHint, setPhoneDemoHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMode(modeParam === "register" ? "register" : "login");
  }, [modeParam]);

  useEffect(() => {
    setRegisterRole(params.get("role") === "instructor" ? "INSTRUCTOR" : "LEARNER");
  }, [params]);

  const goAfterAuth = (u: { onboardingCompletedAt: string | null; role: string }, opts: { isNewUser: boolean }) => {
    const mvp = mvpInstructorFocus();

    if (u.role === "INSTRUCTOR") {
      if (mvp && opts.isNewUser) {
        navigate("/instructor/activate", { replace: true });
        return;
      }
      const learnerDefault = next === "/learn" || next.startsWith("/learn?") || next.includes("/onboarding");
      navigate(learnerDefault ? "/instructor/studio" : next, { replace: true });
      return;
    }

    const dest = next;
    if (!u.onboardingCompletedAt) {
      navigate(`/onboarding?next=${encodeURIComponent(dest)}`, { replace: true });
      return;
    }
    navigate(dest, { replace: true });
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const out =
        mode === "login"
          ? await login(email, password)
          : await register(email, password, name || "Learner", registerRole);
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      goAfterAuth(out.user, { isNewUser: out.isNewUser });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async () => {
    if (!otpIntent) {
      toast.error("Choose Learn or Teach first");
      return;
    }
    setBusy(true);
    try {
      const out = await requestOtp(phone);
      setOtpSent(true);
      setPhoneDemoOtp(out.demoOtp ?? null);
      setPhoneDemoHint(out.demoOtpHint ?? null);
      toast.success(out.demoOtp ? "Code ready — see below" : "Code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpIntent) {
      toast.error("Choose Learn or Teach first");
      return;
    }
    setBusy(true);
    try {
      const out = await verifyOtp(phone, otpCode, otpName.trim() || undefined, otpIntent);
      toast.success("Signed in");
      goAfterAuth(out.user, { isNewUser: out.isNewUser });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      toast.error(msg);
      if (msg.includes("Name required")) {
        toast.message("Tip", { description: "Add your name below — required the first time you use this number." });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container mx-auto py-20 md:py-28 max-w-md px-4">
      <h1 className="font-heading text-3xl text-foreground">{mode === "login" ? "Log in" : "Create account"}</h1>
      <p className="font-body text-sm text-muted-foreground mt-2">
        Demo learner: <span className="text-foreground">learner@demo.com</span> / demo12345
      </p>

      <div className="mt-8 flex rounded-full border border-border/60 p-1 bg-muted/30">
        <button
          type="button"
          onClick={() => {
            setAuthChannel("email");
            setOtpSent(false);
            setPhoneDemoOtp(null);
            setPhoneDemoHint(null);
          }}
          className={cn(
            "flex-1 rounded-full py-2 text-xs font-medium font-body transition-colors",
            authChannel === "email" ? "bg-foreground text-background" : "text-muted-foreground",
          )}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthChannel("phone");
            setPhoneDemoOtp(null);
            setPhoneDemoHint(null);
            setOtpSent(false);
          }}
          className={cn(
            "flex-1 rounded-full py-2 text-xs font-medium font-body transition-colors",
            authChannel === "phone" ? "bg-foreground text-background" : "text-muted-foreground",
          )}
        >
          Phone OTP
        </button>
      </div>

      {authChannel === "phone" ? (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
          <p className="font-body text-sm font-medium text-foreground">What do you want to do?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOtpIntent("LEARNER")}
              className={cn(
                "rounded-xl border py-3 px-2 text-sm font-body transition-colors",
                otpIntent === "LEARNER" ? "border-foreground bg-foreground text-background" : "border-border/70 hover:border-accent/40",
              )}
            >
              Learn
            </button>
            <button
              type="button"
              onClick={() => setOtpIntent("INSTRUCTOR")}
              className={cn(
                "rounded-xl border py-3 px-2 text-sm font-body transition-colors",
                otpIntent === "INSTRUCTOR" ? "border-foreground bg-foreground text-background" : "border-border/70 hover:border-accent/40",
              )}
            >
              Teach
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            First time only sets your account type. Returning users keep their existing role.
          </p>
        </div>
      ) : null}

      {authChannel === "email" ? (
        <form onSubmit={submitEmail} className="mt-8 space-y-5">
          {mode === "register" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Account Type</Label>
                <select
                  id="role"
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value as "LEARNER" | "INSTRUCTOR")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="LEARNER">Learner</option>
                  <option value="INSTRUCTOR">Tutor / Instructor</option>
                </select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          <Button type="submit" className="w-full rounded-full h-11" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : mode === "login" ? "Continue" : "Sign up"}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitPhone} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="Any number, or even text like “demo”"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneDemoOtp(null);
                setPhoneDemoHint(null);
              }}
              autoComplete="tel"
            />
            <p className="text-[11px] text-muted-foreground font-body">
              For testing: almost any input works. 10 digits are treated as India (+91).
            </p>
          </div>
          {!otpSent ? (
            <Button
              type="button"
              className="w-full rounded-full h-11"
              disabled={busy || !phone.trim() || !otpIntent}
              onClick={() => sendOtp()}
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : "Send OTP"}
            </Button>
          ) : (
            <>
              {phoneDemoOtp ? (
                <div
                  className="rounded-2xl border-2 border-accent/60 bg-accent/10 px-4 py-5 text-center space-y-2"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide">
                    Your code (shown here — no SMS)
                  </p>
                  <p className="font-mono text-4xl sm:text-5xl tracking-[0.25em] text-foreground font-semibold tabular-nums">
                    {phoneDemoOtp}
                  </p>
                  {phoneDemoHint ? <p className="text-[11px] text-muted-foreground font-body leading-snug px-1">{phoneDemoHint}</p> : null}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="otp">6-digit code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="\d{6}"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otpName">Your name (first time only)</Label>
                <Input
                  id="otpName"
                  value={otpName}
                  onChange={(e) => setOtpName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  autoComplete="name"
                />
              </div>
              <Button type="submit" className="w-full rounded-full h-11" disabled={busy || otpCode.length !== 6}>
                {busy ? <Loader2 className="animate-spin" size={18} /> : "Verify & continue"}
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-accent font-body underline"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode("");
                  setPhoneDemoOtp(null);
                  setPhoneDemoHint(null);
                }}
              >
                Use a different number
              </button>
            </>
          )}
        </form>
      )}

      {authChannel === "email" && (
        <p className="font-body text-sm text-center text-muted-foreground mt-8">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button type="button" className="text-accent underline" onClick={() => setMode("register")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="text-accent underline" onClick={() => setMode("login")}>
                Log in
              </button>
            </>
          )}
        </p>
      )}

      <Link to="/courses" className="block text-center font-body text-sm text-muted-foreground hover:text-foreground mt-6">
        Browse classes without signing in
      </Link>
    </main>
  );
};

export default LoginPage;
