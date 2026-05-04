import { create } from "zustand";
import type { Reservation, Slots, Turn } from "../types";

export type Phase = "idle" | "recording" | "thinking" | "speaking" | "error";

export const WELCOME_MESSAGE =
  "어서오세요. 저는 Hades예요. 어떤 체험을 찾고 계신지 편하게 말씀해 주세요.";

const initialHistory = (): Turn[] => [
  { role: "assistant", content: WELCOME_MESSAGE },
];

interface ConversationState {
  history: Turn[];
  slots: Slots;
  phase: Phase;
  errorMsg: string | null;
  ttsEnabled: boolean;
  fontScale: number; // 1.0 ~ 1.4
  micLevel: number; // 0~1, 녹음 중 음량
  reservation: Reservation | null;
  readyToConfirm: boolean;
  setPhase: (p: Phase) => void;
  setError: (m: string | null) => void;
  appendUser: (text: string) => void;
  appendAssistant: (text: string) => void;
  mergeSlots: (s: Slots) => void;
  setReadyToConfirm: (r: boolean) => void;
  setReservation: (r: Reservation | null) => void;
  setMicLevel: (v: number) => void;
  reset: () => void;
  toggleTTS: () => void;
  setFontScale: (s: number) => void;
}

export const useConversation = create<ConversationState>((set) => ({
  history: initialHistory(),
  slots: {},
  phase: "idle",
  errorMsg: null,
  ttsEnabled: true,
  fontScale: 1,
  micLevel: 0,
  reservation: null,
  readyToConfirm: false,
  setPhase: (phase) => set({ phase }),
  setError: (errorMsg) => set({ errorMsg, phase: errorMsg ? "error" : "idle" }),
  appendUser: (content) =>
    set((s) => ({ history: [...s.history, { role: "user", content }] })),
  appendAssistant: (content) =>
    set((s) => ({ history: [...s.history, { role: "assistant", content }] })),
  mergeSlots: (incoming) =>
    set((s) => ({ slots: { ...s.slots, ...incoming } })),
  setReadyToConfirm: (readyToConfirm) => set({ readyToConfirm }),
  setReservation: (reservation) => set({ reservation }),
  setMicLevel: (micLevel) => set({ micLevel }),
  reset: () =>
    set({
      history: initialHistory(),
      slots: {},
      phase: "idle",
      errorMsg: null,
      reservation: null,
      readyToConfirm: false,
      micLevel: 0,
    }),
  toggleTTS: () => set((s) => ({ ttsEnabled: !s.ttsEnabled })),
  setFontScale: (fontScale) => set({ fontScale }),
}));
