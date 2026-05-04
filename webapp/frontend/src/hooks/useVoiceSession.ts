import { useCallback, useRef } from "react";

import { api } from "../lib/api";
import { startRecording } from "../lib/recorder";
import { useConversation, WELCOME_MESSAGE } from "../store/conversation";

/**
 * 마이크 토글 → 백엔드 turn → TTS 자동 재생.
 *
 * 추가 동작:
 * - recording 중 음량(RMS)을 store.micLevel로 흘려보냄
 * - ready_to_confirm 응답 받으면 자동으로 예약 생성 후 store.reservation 갱신
 * - 첫 클릭 시 환영 음성 unlock (자동재생 정책 우회)
 */
export function useVoiceSession() {
  const stopperRef = useRef<null | (() => Promise<Blob>)>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const welcomePlayedRef = useRef(false);

  const {
    history,
    slots,
    phase,
    ttsEnabled,
    reservation,
    appendUser,
    appendAssistant,
    mergeSlots,
    setPhase,
    setError,
    setMicLevel,
    setReadyToConfirm,
    setReservation,
  } = useConversation();

  const playWelcomeIfNeeded = useCallback(() => {
    if (welcomePlayedRef.current || !ttsEnabled) return;
    welcomePlayedRef.current = true;
    const url = `/api/voice/tts?text=${encodeURIComponent(WELCOME_MESSAGE)}`;
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

      const result = await api.voiceTurn(blob, history);

      if (result.user_text) appendUser(result.user_text);
      appendAssistant(result.reply);
      mergeSlots(result.slots);
      setReadyToConfirm(result.ready_to_confirm);

      // ready_to_confirm 떨어지면 자동 예약 — 슬롯 다 채워졌고 사용자가 "네" 한 시점
      if (result.ready_to_confirm && !reservation) {
        try {
          const merged = { ...slots, ...result.slots };
          const created = await api.createReservation(merged);
          setReservation(created);
        } catch {
          /* 예약 실패는 화면에서 따로 처리하지 않음 — Claude 답변에 자연스럽게 반영됨 */
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
    slots,
    appendUser,
    appendAssistant,
    mergeSlots,
    setPhase,
    setError,
    setMicLevel,
    setReadyToConfirm,
    setReservation,
    ttsEnabled,
    reservation,
  ]);

  const toggle = useCallback(async () => {
    if (phase === "recording") {
      await finish();
    } else if (phase === "idle" || phase === "error") {
      await begin();
    }
  }, [phase, begin, finish]);

  return {
    toggle,
    phase,
  };
}

function playTTS(
  url: string,
  ref: React.MutableRefObject<HTMLAudioElement | null>
) {
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
