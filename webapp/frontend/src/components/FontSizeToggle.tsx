import { useEffect } from "react";

import { useConversation } from "../store/conversation";

const SCALES = [1, 1.15, 1.3];
const LABELS = ["보통", "크게", "특대"];

export function FontSizeToggle({
  variant = "consumer",
}: {
  variant?: "consumer" | "seller";
}) {
  const fontScale = useConversation((s) => s.fontScale);
  const setFontScale = useConversation((s) => s.setFontScale);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
  }, [fontScale]);

  const activeCls =
    variant === "consumer"
      ? "bg-shop-teal text-white"
      : "bg-brand-green text-white";

  return (
    <div
      className={
        variant === "consumer"
          ? "flex items-center gap-1 border border-teal-200 rounded-xl p-1 bg-teal-50/50"
          : "flex items-center gap-1 border border-emerald-200 rounded-xl p-1 bg-emerald-50/60"
      }
    >
      <span className="text-sm text-slate-600 px-2">글씨</span>
      {SCALES.map((s, i) => (
        <button
          key={s}
          type="button"
          onClick={() => setFontScale(s)}
          className={
            fontScale === s
              ? `${activeCls} rounded-lg px-3 py-1 font-semibold text-sm`
              : "text-slate-600 hover:text-slate-900 rounded-lg px-3 py-1 text-sm"
          }
        >
          {LABELS[i]}
        </button>
      ))}
    </div>
  );
}
