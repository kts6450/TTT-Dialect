import { useEffect, useState } from "react";

type Listener = () => void;

const listeners = new Set<Listener>();
let es: EventSource | null = null;

function openEventSource() {
  es = new EventSource("/api/marketplace/listings/events");
  es.onmessage = (ev) => {
    try {
      const d = JSON.parse(ev.data) as { type?: string };
      if (d.type === "listings") {
        listeners.forEach((fn) => fn());
      }
    } catch {
      /* */
    }
  };
  es.onerror = () => {
    es?.close();
    es = null;
    if (listeners.size === 0) return;
    window.setTimeout(() => {
      if (!es && listeners.size > 0) {
        openEventSource();
      }
    }, 2000);
  };
}

function subscribe(cb: Listener) {
  listeners.add(cb);
  if (!es) {
    openEventSource();
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && es) {
      es.close();
      es = null;
    }
  };
}

/** 목록 변경 SSE — 구독자끼리 연결 1개만 공유 */
export function useListingsStreamVersion() {
  const [tick, setTick] = useState(0);

  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  return tick;
}
