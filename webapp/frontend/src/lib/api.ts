import type {
  Brand,
  Listing,
  Order,
  Turn,
  VoiceMode,
  VoiceStatus,
  VoiceTurnResponse,
} from "../types";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  getStatus: () => getJson<VoiceStatus>("/api/voice/status"),
  getBrand: () => getJson<Brand>("/api/marketplace/brand"),
  getListings: (kind?: "product" | "lodging") =>
    getJson<Listing[]>(
      kind ? `/api/marketplace/listings?kind=${kind}` : "/api/marketplace/listings"
    ),
  getListing: (id: string) => getJson<Listing>(`/api/marketplace/listings/${id}`),

  createListing: async (body: {
    kind: "product" | "lodging";
    title: string;
    description: string;
    price: number;
    location: string;
    emoji?: string | null;
    stock?: number | null;
    max_guests?: number | null;
  }): Promise<Listing> => {
    const res = await fetch("/api/marketplace/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, seller_id: "seller-local" }),
    });
    if (!res.ok) throw new Error(`createListing ${res.status}`);
    return res.json();
  },

  deleteListing: async (id: string) => {
    const res = await fetch(`/api/marketplace/listings/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`deleteListing ${res.status}`);
    return res.json() as Promise<{ ok: boolean }>;
  },

  createOrder: async (body: {
    items: { listing_id: string; quantity: number }[];
    buyer_name: string;
    buyer_phone: string;
  }): Promise<Order> => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`createOrder ${res.status}`);
    return res.json();
  },

  mockPay: async (orderId: string): Promise<Order> => {
    const res = await fetch(`/api/orders/${orderId}/mock-pay`, { method: "POST" });
    if (!res.ok) throw new Error(`mockPay ${res.status}`);
    return res.json();
  },

  voiceTurn: async (
    audio: Blob,
    history: Turn[],
    mode: VoiceMode
  ): Promise<VoiceTurnResponse> => {
    const fd = new FormData();
    fd.append("audio", audio, "speech.wav");
    fd.append("history", JSON.stringify(history));
    fd.append("mode", mode);
    const res = await fetch("/api/voice/turn", { method: "POST", body: fd });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`voiceTurn ${res.status}: ${detail}`);
    }
    return res.json();
  },

  textTurn: async (
    user_text: string,
    history: Turn[],
    mode: VoiceMode
  ): Promise<VoiceTurnResponse> => {
    const res = await fetch("/api/voice/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_text, history, mode }),
    });
    if (!res.ok) throw new Error(`textTurn ${res.status}`);
    return res.json();
  },
};
