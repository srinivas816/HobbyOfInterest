import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LearnerQuickOnboarding from "@/pages/LearnerQuickOnboarding";

/**
 * Instructors use /instructor/activate (fast class + invite). Learners: quick interests or skip.
 */
const OnboardingPage = () => {
  const [params] = useSearchParams();
  const next = params.get("next") || "/learn";
  const navigate = useNavigate();
  const { user, token, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      navigate(`/login?next=${encodeURIComponent(`/onboarding?next=${encodeURIComponent(next)}`)}`, { replace: true });
    }
  }, [ready, token, navigate, next]);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === "INSTRUCTOR") {
      navigate("/instructor/studio?setup=1", { replace: true });
      return;
    }
    if (user.onboardingCompletedAt) {
      navigate(next, { replace: true });
    }
  }, [ready, user, navigate, next]);

  if (!ready || !token || !user) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }

  if (user.role === "INSTRUCTOR" || user.onboardingCompletedAt) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }

  return <LearnerQuickOnboarding next={next} />;
};

export default OnboardingPage;
