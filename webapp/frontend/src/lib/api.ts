import type {
  Brand,
  Experience,
  Reservation,
  Slots,
  VoiceStatus,
  VoiceTurnResponse,
  Turn,
} from "../types";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  getStatus: () => getJson<VoiceStatus>("/api/voice/status"),
  getBrand: () => getJson<Brand>("/api/catalog/brand"),
  getExperiences: () => getJson<Experience[]>("/api/catalog/experiences"),
  searchExperiences: (q: string) =>
    getJson<Experience[]>(`/api/catalog/experiences?q=${encodeURIComponent(q)}`),

  /**
   * 음성 턴 — wav blob + history → 서버에서 ASR/LLM/TTS 처리
   */
  voiceTurn: async (
    audio: Blob,
    history: Turn[]
  ): Promise<VoiceTurnResponse> => {
    const fd = new FormData();
    fd.append("audio", audio, "speech.wav");
    fd.append("history", JSON.stringify(history));
    const res = await fetch("/api/voice/turn", { method: "POST", body: fd });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`voiceTurn ${res.status}: ${detail}`);
    }
    return res.json();
  },

  /**
   * 텍스트 폴백 — 음성이 안 될 때
   */
  textTurn: async (
    user_text: string,
    history: Turn[]
  ): Promise<VoiceTurnResponse> => {
    const res = await fetch("/api/voice/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_text, history }),
    });
    if (!res.ok) throw new Error(`textTurn ${res.status}`);
    return res.json();
  },

  createReservation: async (slots: Slots): Promise<Reservation> => {
    if (!slots.experience_id) throw new Error("experience_id required");
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slots),
    });
    if (!res.ok) throw new Error(`createReservation ${res.status}`);
    return res.json();
  },
};
