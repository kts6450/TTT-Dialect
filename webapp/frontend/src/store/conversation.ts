import { create } from "zustand";

import type { Turn, VoiceSlots } from "../types";

export type Phase = "idle" | "recording" | "thinking" | "speaking" | "error";

export const WELCOME_SELLER =
  "어르신, 안녕하세요. 로컬링크 판매 도우미입니다. 파실 물건이면 상품, 민박이면 숙박이라고 말씀해 주시면 됩니다.";

const initialHistory = (): Turn[] => [{ role: "assistant", content: WELCOME_SELLER }];

interface ConversationState {
  history: Turn[];
  slots: VoiceSlots;
  phase: Phase;
  errorMsg: string | null;
  ttsEnabled: boolean;
  fontScale: number;
  micLevel: number;
  readyToConfirm: boolean;
  listingSubmitted: boolean;
  setVoiceMode: (_: "seller") => void;
  setPhase: (p: Phase) => void;
  setError: (m: string | null) => void;
  appendUser: (text: string) => void;
  appendAssistant: (text: string) => void;
  mergeSlots: (s: VoiceSlots) => void;
  setReadyToConfirm: (r: boolean) => void;
  setMicLevel: (v: number) => void;
  setListingSubmitted: (v: boolean) => void;
  reset: (mode?: "seller") => void;
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
  readyToConfirm: false,
  listingSubmitted: false,
  setVoiceMode: () =>
    set({
      history: initialHistory(),
      slots: {},
      readyToConfirm: false,
      errorMsg: null,
      listingSubmitted: false,
    }),
  setPhase: (phase) => set({ phase }),
  setError: (errorMsg) => set({ errorMsg, phase: errorMsg ? "error" : "idle" }),
  appendUser: (content) =>
    set((s) => ({ history: [...s.history, { role: "user", content }] })),
  appendAssistant: (content) =>
    set((s) => ({ history: [...s.history, { role: "assistant", content }] })),
  mergeSlots: (incoming) =>
    set((s) => ({ slots: { ...s.slots, ...incoming } as VoiceSlots })),
  setReadyToConfirm: (readyToConfirm) => set({ readyToConfirm }),
  setMicLevel: (micLevel) => set({ micLevel }),
  setListingSubmitted: (listingSubmitted) => set({ listingSubmitted }),
  reset: () =>
    set({
      history: initialHistory(),
      slots: {},
      phase: "idle",
      errorMsg: null,
      readyToConfirm: false,
      micLevel: 0,
      listingSubmitted: false,
    }),
  toggleTTS: () => set((s) => ({ ttsEnabled: !s.ttsEnabled })),
  setFontScale: (fontScale) => set({ fontScale }),
}));
