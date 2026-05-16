import { useCallback, useEffect, useState } from "react";

import { api } from "../lib/api";
import type { Listing } from "../types";

const DEFAULT_MS = 4000;

export function useListingDetailPoll(id: string | undefined, intervalMs = DEFAULT_MS) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setListing(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getListing(id);
      setListing(data);
    } catch {
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setListing(null);
      setLoading(false);
      return;
    }
    void load();
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
