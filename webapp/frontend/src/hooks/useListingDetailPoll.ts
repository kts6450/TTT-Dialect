import { useCallback, useEffect, useState } from "react";

import { api } from "../lib/api";
import type { Listing } from "../types";

import { useListingsStreamVersion } from "./useListingsStreamVersion";

const FALLBACK_MS = 15000;

export function useListingDetailPoll(id: string | undefined, intervalMs = FALLBACK_MS) {
  const streamTick = useListingsStreamVersion();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (outer?: AbortSignal) => {
    if (!id) {
      setListing(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getListing(id, outer ? { signal: outer } : undefined);
      if (outer?.aborted) return;
      setListing(data);
    } catch {
      if (outer?.aborted) return;
      setListing(null);
    } finally {
      if (!outer?.aborted) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setListing(null);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [id, load, streamTick]);

  useEffect(() => {
    if (!id) return;
    const t = setInterval(() => void load(), intervalMs);
    const onVis = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [id, load, intervalMs]);

  return { listing, loading, refetch: load };
}
