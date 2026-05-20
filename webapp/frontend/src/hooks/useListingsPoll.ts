import { useCallback, useEffect, useState } from "react";

import { api } from "../lib/api";
import type { Listing } from "../types";

import { useListingsStreamVersion } from "./useListingsStreamVersion";

const FALLBACK_MS = 15000;

/** 목록 갱신: SSE 우선 + 탭 포커스 + 저주기 폴백 (동일 DB·서버 연동) */
export function useListingsPoll(intervalMs = FALLBACK_MS) {
  const streamTick = useListingsStreamVersion();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (outer?: AbortSignal) => {
    try {
      const data = await api.getListings(undefined, outer ? { signal: outer } : undefined);
      if (outer?.aborted) return;
      setListings(data);
    } catch {
      if (outer?.aborted) return;
      setListings([]);
    } finally {
      if (!outer?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load, streamTick]);

  useEffect(() => {
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
