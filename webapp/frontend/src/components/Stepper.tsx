import { clsx } from "clsx";

import { useConversation } from "../store/conversation";

const STEPS = [
  { key: "experience_id", label: "체험" },
  { key: "date", label: "날짜" },
  { key: "time", label: "시간" },
  { key: "headcount", label: "인원" },
  { key: "contact_name", label: "이름" },
  { key: "contact_phone", label: "연락처" },
] as const;

/**
 * 6단계 진행도 표시.
 * - 채워진 슬롯은 황금색 (완료)
 * - 다음에 채울 슬롯은 펄스 (현재 단계)
 * - 나머지는 회색
 */
export function Stepper() {
  const slots = useConversation((s) => s.slots);

  const filled = STEPS.map((step) => Boolean(slots[step.key as keyof typeof slots]));
  const currentIdx = filled.indexOf(false); // 첫 번째 미완료 = 현재

  return (
    <div className="flex items-center gap-1.5 px-2 py-1">
      {STEPS.map((step, idx) => {
        const isDone = filled[idx];
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={clsx(
                "h-2 w-full rounded-full transition-all",
                isDone && "bg-hades-gold",
                isCurrent && !isDone && "bg-hades-accent/60 animate-pulse",
                !isDone && !isCurrent && "bg-white/10"
              )}
            />
            <div
              className={clsx(
                "text-xs sm:text-sm transition-colors",
                isDone && "text-hades-gold font-semibold",
                isCurrent && !isDone && "text-hades-text font-semibold",
                !isDone && !isCurrent && "text-hades-muted/60"
              )}
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
