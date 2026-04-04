import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import type { AuthUser } from "@/context/AuthContext";

/**
 * Shown after first phone OTP signup: pick Learn vs Teach, then PATCH /api/me { role }.
 */
const ChooseRolePage = () => {
  const { user, token, ready, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"LEARNER" | "INSTRUCTOR" | null>(null);

  if (!ready) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.intentChosen !== false) {
    if (user.role === "INSTRUCTOR") {
      return <Navigate to="/instructor/home" replace />;
    }
    return <Navigate to="/learn" replace />;
  }

  const choose = async (role: "LEARNER" | "INSTRUCTOR") => {
    setBusy(role);
    try {
      const res = await apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      const data = await parseJson<{ user: AuthUser }>(res);
      await refreshUser();
      toast.success(role === "INSTRUCTOR" ? "Let’s set up your class" : "Welcome!");
      if (role === "INSTRUCTOR") {
        navigate("/instructor/activate", { replace: true });
      } else {
        const done = Boolean(data.user.onboardingCompletedAt);
        if (!done) {
          navigate(`/onboarding?next=${encodeURIComponent("/learn")}`, { replace: true });
        } else {
          navigate("/learn", { replace: true });
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your choice");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="container mx-auto px-4 min-h-[70vh] flex flex-col justify-center max-w-md pt-12 pb-16 md:pt-16 md:pb-24">
      <h1 className="font-heading text-3xl md:text-4xl text-foreground text-center leading-tight tracking-tight">
        What do you want to do?
      </h1>
      <div className="mt-14 md:mt-16 flex flex-col gap-4">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void choose("INSTRUCTOR")}
          className="w-full rounded-2xl border-2 border-foreground/90 bg-foreground text-background py-5 px-6 font-heading text-lg font-semibold tracking-tight shadow-sm hover:opacity-95 transition-opacity disabled:opacity-60 min-h-[3.75rem]"
        >
          {busy === "INSTRUCTOR" ? (
            <Loader2 className="animate-spin mx-auto" size={24} />
          ) : (
            "Teach a class"
          )}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void choose("LEARNER")}
          className="w-full rounded-2xl border-2 border-border bg-card py-5 px-6 font-heading text-lg font-semibold tracking-tight text-foreground hover:bg-muted/40 transition-colors disabled:opacity-60 min-h-[3.75rem]"
        >
          {busy === "LEARNER" ? (
            <Loader2 className="animate-spin mx-auto text-accent" size={24} />
          ) : (
            "Learn something"
          )}
        </button>
      </div>
    </main>
  );
};

export default ChooseRolePage;
