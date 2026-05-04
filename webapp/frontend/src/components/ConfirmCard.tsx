import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { useConversation } from "../store/conversation";
import type { Experience } from "../types";

/**
 * 모든 슬롯이 채워지면 노출되는 큰 확인 카드.
 * - 음성으로 "네" 답하면 자동 예약 (useVoiceSession 처리)
 * - 큰 확인 버튼으로도 즉시 예약 가능 (자동 처리 실패 시 폴백)
 */
export function ConfirmCard() {
  const slots = useConversation((s) => s.slots);
  const reservation = useConversation((s) => s.reservation);
  const setReservation = useConversation((s) => s.setReservation);
  const reset = useConversation((s) => s.reset);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getExperiences().then(setExperiences).catch(() => {});
  }, []);

  const allFilled =
    slots.experience_id &&
    slots.date &&
    slots.time &&
    slots.headcount &&
    slots.contact_name &&
    slots.contact_phone;

  if (!allFilled || reservation) return null;

  const exp = experiences.find((e) => e.id === slots.experience_id);

  const submit = async () => {
    setSubmitting(true);
    try {
      const created = await api.createReservation(slots);
      setReservation(created);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6 border-hades-gold/40 bg-hades-gold/5">
      <div className="text-hades-gold text-base font-semibold mb-3">
        ✓ 예약 정보 확인
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5 text-lg">
        <Row label="체험" value={exp?.name ?? slots.experience_id} />
        <Row label="날짜" value={slots.date} />
        <Row label="시간" value={slots.time} />
        <Row label="인원" value={`${slots.headcount}명`} />
        <Row label="이름" value={slots.contact_name} />
        <Row label="연락처" value={slots.contact_phone} />
        {exp && (
          <Row
            label="결제 금액"
            value={
              <span className="text-hades-gold font-bold">
                {(exp.price * (slots.headcount ?? 1)).toLocaleString()}원
              </span>
            }
          />
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary flex-1 text-xl py-4"
        >
          {submitting ? "예약 중…" : "✅ 예약 확정"}
        </button>
        <button onClick={reset} className="btn-ghost flex-1 text-xl py-4">
          처음부터 다시
        </button>
      </div>
      <div className="mt-3 text-sm text-hades-muted text-center">
        '네' 또는 '맞아요' 라고 말씀하셔도 예약됩니다.
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm text-hades-muted">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
