import type { Feed, ScanResponse, ScanStatus, User } from "./types";

/** Empty string = same origin (Vite dev proxy). Production: VITE_API_BASE=https://api.example.com */
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      const j = JSON.parse(body) as { detail?: string };
      message = j.detail ?? body;
    } catch {
      /* plain text */
    }
    throw new Error(message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Always same-origin in dev so OAuth session cookie matches GitHub callback. */
export function loginUrl(): string {
  if (API_BASE) return `${API_BASE.replace(/\/$/, "")}/auth/github/login`;
  return `${window.location.origin}/auth/github/login`;
}

export async function fetchMe(): Promise<User | null> {
  try {
    return await request<User>("/auth/me");
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await request("/auth/logout", { method: "POST" });
}

export async function fetchFeed(): Promise<Feed> {
  return request<Feed>("/api/feed");
}

export async function fetchScanStatus(): Promise<ScanStatus> {
  return request<ScanStatus>("/api/scan/status");
}

export async function triggerScan(force = false): Promise<ScanResponse> {
  const q = force ? "?force=true" : "";
  return request<ScanResponse>(`/api/scan${q}`, { method: "POST" });
}
