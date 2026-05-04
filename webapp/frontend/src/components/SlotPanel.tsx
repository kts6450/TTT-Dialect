import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { useConversation } from "../store/conversation";
import type { Experience } from "../types";

/**
 * 채워진 슬롯을 카드로 시각화 — 사용자가 진행 상황을 한눈에.
 * 노인 인지 부담 줄이는 핵심 시각 요소.
 */
export function SlotPanel() {
  const slots = useConversation((s) => s.slots);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    api.getExperiences().then(setExperiences).catch(() => {});
  }, []);

  const expName = experiences.find((e) => e.id === slots.experience_id)?.name;

  const fields: { label: string; value: string | undefined }[] = [
    { label: "체험", value: expName },
    { label: "날짜", value: slots.date },
    { label: "시간", value: slots.time },
    { label: "인원", value: slots.headcount ? `${slots.headcount}명` : undefined },
    { label: "이름", value: slots.contact_name },
    { label: "연락처", value: slots.contact_phone },
  ];

  const filled = fields.filter((f) => f.value).length;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">예약 정보</h3>
        <div className="text-base text-hades-muted">
          {filled} / {fields.length} 완료
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div
            key={f.label}
            className={
              f.value
                ? "bg-hades-gold/10 border border-hades-gold/40 rounded-xl p-3"
                : "bg-hades-surface/50 border border-white/5 rounded-xl p-3"
            }
          >
            <div className="text-sm text-hades-muted">{f.label}</div>
            <div className="text-lg font-semibold mt-1">
              {f.value ?? <span className="text-hades-muted/60">—</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
