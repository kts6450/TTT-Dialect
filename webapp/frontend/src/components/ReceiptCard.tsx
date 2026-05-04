import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { useConversation } from "../store/conversation";
import type { Experience } from "../types";

/**
 * 예약 확정 후 큰 영수증 카드 — 시연 클로징.
 */
export function ReceiptCard() {
  const reservation = useConversation((s) => s.reservation);
  const reset = useConversation((s) => s.reset);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    api.getExperiences().then(setExperiences).catch(() => {});
  }, []);

  if (!reservation) return null;

  const exp = experiences.find((e) => e.id === reservation.experience_id);
  const total = exp ? exp.price * (reservation.headcount ?? 1) : null;

  return (
    <div className="card p-8 border-hades-ok/40 bg-hades-ok/5 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 text-9xl opacity-10 select-none">
        🎉
      </div>

      <div className="text-hades-ok text-lg font-semibold mb-2">
        예약이 완료되었습니다
      </div>
      <div className="text-3xl font-bold mb-1">
        {exp?.emoji} {exp?.name ?? reservation.experience_id}
      </div>
      <div className="text-hades-muted mb-6">{exp?.location}</div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="예약 번호" value={reservation.code} accent />
        <Row
          label="결제 금액"
          value={total ? `${total.toLocaleString()}원` : "-"}
          accent
        />
        <Row
          label="일정"
          value={`${reservation.date ?? ""} ${reservation.time ?? ""}`}
        />
        <Row label="인원" value={`${reservation.headcount}명`} />
        <Row label="이름" value={reservation.contact_name} />
        <Row label="연락처" value={reservation.contact_phone} />
      </div>

      <div className="text-base text-hades-muted mb-4 leading-relaxed">
        예약 정보를 적어두시거나 사진으로 남겨두세요.<br />
        문의는 연락처로 안내해 드리겠습니다.
      </div>

      <button onClick={reset} className="btn-primary w-full text-xl py-4">
        새로 시작하기
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-sm text-hades-muted">{label}</div>
      <div
        className={
          accent
            ? "text-2xl font-bold text-hades-gold mt-1"
            : "text-lg font-semibold mt-1"
        }
      >
        {value}
      </div>
    </div>
  );
}
