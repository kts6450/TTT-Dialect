import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

import { api } from "../lib/api";
import { startRecording } from "../lib/recorder";
import { useConversation, WELCOME_SELLER } from "../store/conversation";

/**
 * 판매자 Zero UI — 음성으로 상품·숙박 등록
 */
export function useVoiceSession() {
  const stopperRef = useRef<null | (() => Promise<Blob>)>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const welcomePlayedRef = useRef(false);

  useEffect(() => {
    welcomePlayedRef.current = false;
    useConversation.getState().setVoiceMode("seller");
  }, []);

  const {
    history,
    phase,
    ttsEnabled,
    appendUser,
    appendAssistant,
    mergeSlots,
    setPhase,
    setError,
    setMicLevel,
    setReadyToConfirm,
    reset,
    setListingSubmitted,
  } = useConversation();

  const playWelcomeIfNeeded = useCallback(() => {
    if (welcomePlayedRef.current || !ttsEnabled) return;
    welcomePlayedRef.current = true;
    const url = `/api/voice/tts?text=${encodeURIComponent(WELCOME_SELLER)}`;
    playTTS(url, audioRef);
  }, [ttsEnabled]);

  const begin = useCallback(async () => {
    setError(null);
    playWelcomeIfNeeded();
    try {
      const handle = await startRecording((rms) => setMicLevel(rms));
      stopperRef.current = handle.stop;
      setPhase("recording");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`마이크를 사용할 수 없어요: ${msg}`);
    }
  }, [setError, setPhase, setMicLevel, playWelcomeIfNeeded]);

  const finish = useCallback(async () => {
    if (!stopperRef.current) return;
    setPhase("thinking");
    setMicLevel(0);
    try {
      const blob = await stopperRef.current();
      stopperRef.current = null;

      const result = await api.voiceTurn(blob, history, "seller");

      if (result.user_text) appendUser(result.user_text);
      appendAssistant(result.reply);
      mergeSlots(result.slots);
      setReadyToConfirm(result.ready_to_confirm);

      const merged = useConversation.getState().slots;

      if (result.ready_to_confirm) {
        const kind = merged.kind === "lodging" ? "lodging" : "product";
        const title = String(merged.title || "").trim();
        const price = Number(merged.price);
        if (title && price >= 0 && (kind === "product" || kind === "lodging")) {
          try {
            await api.createListing({
              kind,
              title,
              description: String(merged.description || "").trim(),
              price: Math.round(price),
              location: String(merged.location || "").trim(),
              emoji: merged.emoji ? String(merged.emoji) : undefined,
              stock: kind === "product" ? (merged.stock != null ? Number(merged.stock) : 99) : null,
              max_guests:
                kind === "lodging"
                  ? merged.max_guests != null
                    ? Number(merged.max_guests)
                    : 4
                  : null,
            });
            reset("seller");
            welcomePlayedRef.current = false;
            setListingSubmitted(true);
          } catch {
            /* */
          }
        }
      }

      if (ttsEnabled && result.tts_url) {
        playTTS(result.tts_url, audioRef);
        setPhase("speaking");
      } else {
        setPhase("idle");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`처리 중 문제가 생겼어요: ${msg}`);
    }
  }, [
    history,
    appendUser,
    appendAssistant,
    mergeSlots,
    setPhase,
    setError,
    setMicLevel,
    setReadyToConfirm,
    setListingSubmitted,
    ttsEnabled,
    reset,
  ]);

  const toggle = useCallback(async () => {
    if (phase === "recording") {
      await finish();
    } else if (phase === "idle" || phase === "error") {
      await begin();
    }
  }, [phase, begin, finish]);

  return { toggle, phase };
}

function playTTS(url: string, ref: MutableRefObject<HTMLAudioElement | null>) {
  if (ref.current) {
    ref.current.pause();
  }
  const audio = new Audio(url);
  ref.current = audio;
  audio.addEventListener("ended", () => {
    useConversation.getState().setPhase("idle");
  });
  audio.addEventListener("error", () => {
    useConversation.getState().setPhase("idle");
  });
  audio.play().catch(() => {
    useConversation.getState().setPhase("idle");
  });
}
