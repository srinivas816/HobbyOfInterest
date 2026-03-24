import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const LoginPage = () => {
  const [params] = useSearchParams();
  const next = params.get("next") || "/learn";
  const modeParam = params.get("mode");
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(modeParam === "register" ? "register" : "login");
  const [registerRole, setRegisterRole] = useState<"LEARNER" | "INSTRUCTOR">(
    params.get("role") === "instructor" ? "INSTRUCTOR" : "LEARNER",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMode(modeParam === "register" ? "register" : "login");
  }, [modeParam]);

  useEffect(() => {
    setRegisterRole(params.get("role") === "instructor" ? "INSTRUCTOR" : "LEARNER");
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u =
        mode === "login"
          ? await login(email, password)
          : await register(email, password, name || "Learner", registerRole);
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      const dest =
        mode === "register"
          ? registerRole === "INSTRUCTOR"
            ? "/instructor/studio"
            : next
          : next;
      if (!u.onboardingCompletedAt) {
        navigate(`/onboarding?next=${encodeURIComponent(dest)}`, { replace: true });
      } else {
        navigate(dest, { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container mx-auto py-20 md:py-28 max-w-md">
      <h1 className="font-heading text-3xl text-foreground">{mode === "login" ? "Log in" : "Create account"}</h1>
      <p className="font-body text-sm text-muted-foreground mt-2">
        Demo learner: <span className="text-foreground">learner@demo.com</span> / demo12345
      </p>

      <form onSubmit={submit} className="mt-10 space-y-5">
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

      <Link to="/courses" className="block text-center font-body text-sm text-muted-foreground hover:text-foreground mt-6">
        Browse classes without signing in
      </Link>
    </main>
  );
};

export default LoginPage;
