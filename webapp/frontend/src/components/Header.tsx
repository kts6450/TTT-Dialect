import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { useConversation } from "../store/conversation";
import type { Brand, VoiceStatus } from "../types";
import { FontSizeToggle } from "./FontSizeToggle";

export function Header() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  const ttsEnabled = useConversation((s) => s.ttsEnabled);
  const toggleTTS = useConversation((s) => s.toggleTTS);
  const reset = useConversation((s) => s.reset);

  useEffect(() => {
    api.getBrand().then(setBrand).catch(() => {});
    api.getStatus().then(setStatus).catch(() => {});
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-8 py-5 border-b border-white/5">
      <div>
        <div className="text-3xl font-bold tracking-wide text-hades-gold">
          {brand?.name ?? "Hades"}
        </div>
        <div className="text-sm text-hades-muted mt-1">
          {brand?.tagline ?? "어르신을 위한 음성 체험 예약"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {status && (
          <div className="text-sm text-hades-muted hidden md:block">
            ASR: <span className="text-hades-text">{status.asr_backend}</span>
            {" · "}
            LLM:{" "}
            <span
              className={
                status.llm_configured ? "text-hades-ok" : "text-hades-danger"
              }
            >
              {status.llm_configured ? "연결됨" : "키 없음"}
            </span>
          </div>
        )}
        <FontSizeToggle />
        <button onClick={toggleTTS} className="btn-ghost">
          🔊 음성 답변 {ttsEnabled ? "켜짐" : "꺼짐"}
        </button>
        <button onClick={reset} className="btn-ghost">
          ↩️ 처음부터
        </button>
      </div>
    </header>
  );
}
