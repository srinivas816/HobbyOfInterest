const TOKEN_KEY = "hoi_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = import.meta.env.VITE_API_URL ?? "";
  const token = getToken();
  const headers = new Headers(init.headers);
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const req = { ...init, headers };
  const trimmedBase = base.replace(/\/+$/, "");
  const url = trimmedBase ? `${trimmedBase}${path.startsWith("/") ? path : `/${path}`}` : path;
  return fetch(url, req);
}

export async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data = {} as T & { error?: string | Record<string, unknown> };
  if (text) {
    try {
      data = JSON.parse(text) as T & { error?: string | Record<string, unknown> };
    } catch {
      if (!res.ok) throw new Error(res.statusText || "Request failed");
      throw new Error("Invalid JSON from server");
    }
  }
  if (!res.ok) {
    const err = data.error;
    const msg =
      typeof err === "string"
        ? err
        : err && typeof err === "object" && "formErrors" in err
          ? JSON.stringify(err)
          : res.statusText;
    throw new Error(msg || "Request failed");
  }
  return data as T;
}
