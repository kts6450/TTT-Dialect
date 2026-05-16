import { useCallback, useEffect, useState } from "react";

import { api } from "../lib/api";
import type { Listing } from "../types";

const DEFAULT_MS = 4000;

/** 목록 주기 갱신 — 판매자 등록 후 소비자 화면에 곧바로 반영 */
export function useListingsPoll(intervalMs = DEFAULT_MS) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getListings();
      setListings(data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), intervalMs);
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load, intervalMs]);

  return { listings, loading, refetch: load };
}
