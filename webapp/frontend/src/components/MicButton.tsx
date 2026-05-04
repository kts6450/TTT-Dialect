import { clsx } from "clsx";

import { useVoiceSession } from "../hooks/useVoiceSession";
import { useConversation } from "../store/conversation";

export function MicButton() {
  const { toggle, phase } = useVoiceSession();
  const micLevel = useConversation((s) => s.micLevel);

  const label = {
    idle: "마이크를 눌러 말씀하세요",
    recording: "다시 눌러 끝내기",
    thinking: "듣고 있어요…",
    speaking: "Hades가 답변 중이에요",
    error: "다시 시도",
  }[phase];

  const disabled = phase === "thinking" || phase === "speaking";

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <div className="relative w-44 h-44 flex items-center justify-center">
        {phase === "idle" && (
          <span className="absolute inset-0 rounded-full bg-hades-gold/30 blur-2xl animate-idle_glow" />
        )}
        {phase === "recording" && (
          <>
            <span className="absolute inset-0 rounded-full bg-hades-danger/30 animate-pulse_ring" />
            <span
              className="absolute inset-0 rounded-full bg-hades-danger/20 animate-pulse_ring"
              style={{ animationDelay: "0.5s" }}
            />
          </>
        )}

        <button
          onClick={toggle}
          disabled={disabled}
          className={clsx(
            "relative w-44 h-44 rounded-full flex items-center justify-center",
            "text-7xl shadow-2xl transition-all duration-300",
            phase === "recording" &&
              "bg-hades-danger text-white scale-105 ring-4 ring-hades-danger/30",
            phase === "thinking" &&
              "bg-hades-surface text-hades-muted cursor-not-allowed",
            phase === "speaking" &&
              "bg-hades-gold/40 text-hades-text cursor-not-allowed ring-4 ring-hades-gold/30",
            (phase === "idle" || phase === "error") &&
              "bg-hades-gold text-hades-bg hover:scale-105 hover:bg-hades-accent"
          )}
          style={
            phase === "recording"
              ? { transform: `scale(${1.05 + micLevel * 0.15})` }
              : undefined
          }
          aria-label={label}
        >
          {phase === "thinking" ? (
            <span className="animate-pulse">⋯</span>
          ) : phase === "speaking" ? (
            "🔊"
          ) : (
            "🎙️"
          )}
        </button>
      </div>

      {/* recording 중 음량 막대 / speaking 중 음파 */}
      <div className="h-8 flex items-center gap-1.5 min-h-8">
        {phase === "recording" &&
          Array.from({ length: 9 }).map((_, i) => {
            // 가운데가 가장 높고 양쪽이 낮은 분포로 시각적 균형
            const distFromCenter = Math.abs(i - 4) / 4;
            const factor = (1 - distFromCenter * 0.6) * (0.2 + micLevel * 1.6);
            const h = Math.max(0.15, Math.min(1, factor));
            return (
              <span
                key={i}
                className="w-2 bg-hades-danger rounded-full transition-all duration-75"
                style={{
                  height: `${h * 2}rem`,
                }}
              />
            );
          })}
        {phase === "speaking" &&
          Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 bg-hades-gold rounded-full animate-wave"
              style={{
                height: "1.5rem",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
      </div>

      <div className="text-2xl text-hades-muted text-center">{label}</div>
    </div>
  );
}
