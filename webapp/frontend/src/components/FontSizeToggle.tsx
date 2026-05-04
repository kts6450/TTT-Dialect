import { useEffect } from "react";

import { useConversation } from "../store/conversation";

const SCALES = [1, 1.15, 1.3];
const LABELS = ["보통", "크게", "특대"];

export function FontSizeToggle() {
  const fontScale = useConversation((s) => s.fontScale);
  const setFontScale = useConversation((s) => s.setFontScale);

  // 루트 폰트 크기에 직접 적용 — 모든 rem 단위가 자동 스케일
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
  }, [fontScale]);

  return (
    <div className="flex items-center gap-1 border border-white/10 rounded-xl p-1">
      <span className="text-sm text-hades-muted px-2">글씨</span>
      {SCALES.map((s, i) => (
        <button
          key={s}
          onClick={() => setFontScale(s)}
          className={
            fontScale === s
              ? "bg-hades-gold text-hades-bg rounded-lg px-3 py-1 font-semibold text-sm"
              : "text-hades-muted hover:text-hades-text rounded-lg px-3 py-1 text-sm"
          }
        >
          {LABELS[i]}
        </button>
      ))}
    </div>
  );
}
