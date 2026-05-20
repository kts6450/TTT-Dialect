import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ListingCategory } from "../lib/sellerSectors";
import type { AuthUser, UserRole } from "../types";

export type { AuthUser, UserRole };

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  /** persist 복원 후 호출 */
  isLoggedIn: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isLoggedIn: () => Boolean(get().token && get().user),
    }),
    { name: "local-link-auth-v2" }
  )
);

/** 컴포넌트·훅용 선택자 */
export function useAuthRole(): UserRole | null {
  return useAuth((s) => s.user?.role ?? null);
}

export function useAuthDisplayName(): string {
  return useAuth((s) => s.user?.display_name ?? "");
}

export function useAuthSellerSector(): ListingCategory | null {
  const s = useAuth((s) => s.user?.seller_sector);
  if (!s) return null;
  return s as ListingCategory;
}

export function useAuthSellerId(): string | null {
  return useAuth((s) => s.user?.seller_id ?? null);
}

export function roleMatches(current: UserRole | null, required: "consumer" | "seller"): boolean {
  if (!current) return false;
  if (current === "master") return true;
  return current === required;
}
