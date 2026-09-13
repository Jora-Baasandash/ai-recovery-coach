const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type User = {
  id: string;
  email: string;
};

export type CheckInStats = {
  totalCheckIns: number;
  checkInStreak: number;
  last7AverageUrge: number | null;
  last7ActedOnUrge: number;
  last7DidNotAct: number;
};

export type Insight = {
  id: string;
  sourceCheckInId: string;
  promptVersion: string;
  model: string;
  output: {
    pattern: string;
    suggestedAction: string;
    encouragement: string;
  };
  disclaimer: string;
  createdAt: string;
};

export type CheckIn = {
  id: string;
  occurredOn: string;
  urgeIntensity: number;
  actedOnUrge: boolean;
  trigger: string | null;
  note: string | null;
  createdAt: string;
};

type ApiError = {
  error?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: init?.body
      ? {
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        }
      : init?.headers,
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  return data;
}

export function getMe() {
  return request<{ user: User }>("/auth/me");
}

export function register(email: string, password: string) {
  return request<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export function listCheckIns() {
  return request<{ checkIns: CheckIn[] }>("/check-ins");
}

export function getCheckInStats() {
  return request<CheckInStats>("/check-ins/stats");
}

export function getLatestInsight() {
  return request<Insight>("/insights/latest");
}

export function generateInsight(checkInId: string) {
  return request<Insight>(`/check-ins/${checkInId}/insight`, {
    method: "POST",
  });
}

export function createCheckIn(input: {
  occurredOn: string;
  urgeIntensity: number;
  actedOnUrge: boolean;
  trigger?: string;
  note?: string;
}) {
  return request<CheckIn>("/check-ins", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
