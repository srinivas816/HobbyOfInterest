import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Phone-signup users have intentChosen false until /choose-role or join-invite completes.
 * Keeps them from skipping the Learn vs Teach step (handles refresh mid-flow).
 */
export function AuthIntentGate({ children }: { children: React.ReactNode }) {
  const { user, token, ready } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready || !token || !user) return;
    if (user.intentChosen !== false) return;
    const p = loc.pathname;
    if (p === "/login" || p === "/choose-role" || p.startsWith("/join/")) return;
    navigate("/choose-role", { replace: true });
  }, [ready, token, user, loc.pathname, navigate]);

  return <>{children}</>;
}
