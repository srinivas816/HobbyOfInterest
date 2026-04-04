import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, parseJson, setToken, getToken } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  planTier: string;
  specialty: string | null;
  phone: string | null;
  onboardingCompletedAt: string | null;
  /** false until user completes Learn vs Teach (phone signup) or join-invite */
  intentChosen: boolean;
};

export type AuthOutcome = { user: AuthUser; isNewUser: boolean };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthOutcome>;
  register: (email: string, password: string, name: string, role?: "LEARNER" | "INSTRUCTOR") => Promise<AuthOutcome>;
  requestOtp: (phone: string) => Promise<{ ok: boolean; demoOtp?: string }>;
  verifyOtp: (
    phone: string,
    code: string,
    name?: string,
    role?: "LEARNER" | "INSTRUCTOR",
  ) => Promise<AuthOutcome>;
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
            phone: data.user.phone ?? null,
            onboardingCompletedAt: data.user.onboardingCompletedAt ?? null,
            intentChosen: data.user.intentChosen !== false,
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
    const data = await parseJson<{ token: string; user: AuthUser; meta?: { isNewUser?: boolean } }>(res);
    setToken(data.token);
    setTok(data.token);
    const u = {
      ...data.user,
      phone: data.user.phone ?? null,
      onboardingCompletedAt: data.user.onboardingCompletedAt ?? null,
      intentChosen: data.user.intentChosen !== false,
    };
    setUser(u);
    return { user: u, isNewUser: data.meta?.isNewUser ?? false };
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: "LEARNER" | "INSTRUCTOR" = "LEARNER") => {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role }),
    });
    const data = await parseJson<{ token: string; user: AuthUser; meta?: { isNewUser?: boolean } }>(res);
    setToken(data.token);
    setTok(data.token);
    const u = {
      ...data.user,
      phone: data.user.phone ?? null,
      onboardingCompletedAt: data.user.onboardingCompletedAt ?? null,
      intentChosen: data.user.intentChosen !== false,
    };
    setUser(u);
    return { user: u, isNewUser: data.meta?.isNewUser ?? true };
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    const res = await apiFetch("/api/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    return parseJson<{ ok: boolean; demoOtp?: string }>(res);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string, name?: string, role?: "LEARNER" | "INSTRUCTOR") => {
    const res = await apiFetch("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({
        phone,
        code,
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(role ? { role } : {}),
      }),
    });
    const data = await parseJson<{ token: string; user: AuthUser; meta?: { isNewUser?: boolean } }>(res);
    setToken(data.token);
    setTok(data.token);
    const u = {
      ...data.user,
      phone: data.user.phone ?? null,
      onboardingCompletedAt: data.user.onboardingCompletedAt ?? null,
      intentChosen: data.user.intentChosen !== false,
    };
    setUser(u);
    return { user: u, isNewUser: data.meta?.isNewUser ?? false };
  }, []);

  const refreshUser = useCallback(async () => {
    const tok = getToken();
    if (!tok) return;
    const res = await apiFetch("/api/auth/me");
    const data = await parseJson<{ user: AuthUser }>(res);
    setUser({
      ...data.user,
      phone: data.user.phone ?? null,
      onboardingCompletedAt: data.user.onboardingCompletedAt ?? null,
      intentChosen: data.user.intentChosen !== false,
    });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTok(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, register, requestOtp, verifyOtp, refreshUser, logout }),
    [user, token, ready, login, register, requestOtp, verifyOtp, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
