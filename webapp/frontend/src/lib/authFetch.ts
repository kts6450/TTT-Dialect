import { useAuth } from "../store/auth";

export function getAuthToken(): string | null {
  return useAuth.getState().token;
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAuthToken();
  const h: Record<string, string> = {
    ...(extra as Record<string, string> | undefined),
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}
