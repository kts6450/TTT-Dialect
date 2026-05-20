import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartLine } from "../types";

interface CartState {
  lines: CartLine[];
  add: (
    listingId: string,
    qty?: number,
    opts?: { stay_start?: string | null; stay_end?: string | null }
  ) => void;
  setQty: (listingId: string, qty: number) => void;
  remove: (listingId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (listingId, qty = 1, opts) => {
        const lines = [...get().lines];
        const stay_start = opts?.stay_start ?? null;
        const stay_end = opts?.stay_end ?? null;
        const i = lines.findIndex(
          (l) =>
            l.listingId === listingId &&
            (l.stay_start ?? null) === stay_start &&
            (l.stay_end ?? null) === stay_end
        );
        if (i >= 0) {
          lines[i] = { ...lines[i], quantity: lines[i].quantity + qty };
        } else {
          lines.push({ listingId, quantity: qty, stay_start, stay_end });
        }
        set({ lines });
      },
      setQty: (listingId, qty) => {
        const lines = get()
          .lines.map((l) =>
            l.listingId === listingId ? { ...l, quantity: Math.max(1, qty) } : l
          )
          .filter((l) => l.quantity > 0);
        set({ lines });
      },
      remove: (listingId) =>
        set({ lines: get().lines.filter((l) => l.listingId !== listingId) }),
      clear: () => set({ lines: [] }),
    }),
    { name: "local-link-cart-v2" }
  )
);
