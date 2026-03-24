import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, parseJson, setToken, getToken } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  planTier: string;
  specialty: string | null;
  onboardingCompletedAt: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name: string, role?: "LEARNER" | "INSTRUCTOR") => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(!getToken());

  useEffect(() => {
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (!res.ok) throw new Error("session");
        const data = await parseJson<{ user: AuthUser }>(res);
        if (!cancelled)
          setUser({
            ...data.user,
            onboardingCompletedAt: data.user.onboardingCompletedAt ?? null,
          });
      } catch {
        if (!cancelled) {
          setToken(null);
          setTok(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJson<{ token: string; user: AuthUser }>(res);
    setToken(data.token);
    setTok(data.token);
    const u = { ...data.user, onboardingCompletedAt: data.user.onboardingCompletedAt ?? null };
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: "LEARNER" | "INSTRUCTOR" = "LEARNER") => {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role }),
    });
    const data = await parseJson<{ token: string; user: AuthUser }>(res);
    setToken(data.token);
    setTok(data.token);
    const u = { ...data.user, onboardingCompletedAt: data.user.onboardingCompletedAt ?? null };
    setUser(u);
    return u;
  }, []);

  const refreshUser = useCallback(async () => {
    const tok = getToken();
    if (!tok) return;
    const res = await apiFetch("/api/auth/me");
    const data = await parseJson<{ user: AuthUser }>(res);
    setUser({ ...data.user, onboardingCompletedAt: data.user.onboardingCompletedAt ?? null });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTok(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, register, refreshUser, logout }),
    [user, token, ready, login, register, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
