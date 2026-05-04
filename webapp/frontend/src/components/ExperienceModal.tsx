import { useConversation } from "../store/conversation";
import type { Experience } from "../types";

interface Props {
  exp: Experience | null;
  onClose: () => void;
}

export function ExperienceModal({ exp, onClose }: Props) {
  const mergeSlots = useConversation((s) => s.mergeSlots);

  if (!exp) return null;

  const pick = () => {
    mergeSlots({ experience_id: exp.id });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card p-8 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-3">{exp.emoji}</div>
        <h2 className="text-3xl font-bold mb-1">{exp.name}</h2>
        <div className="text-hades-muted mb-5">
          {exp.region} · {exp.category}
        </div>

        <p className="text-lg leading-relaxed mb-6 text-hades-text/90">
          {exp.description}
        </p>

        <div className="grid grid-cols-2 gap-4 text-base mb-6">
          <Info label="장소" value={exp.location} />
          <Info label="시간" value={`${exp.duration_min}분`} />
          <Info
            label="가격"
            value={
              <span className="text-hades-gold font-bold text-lg">
                {exp.price.toLocaleString()}원
              </span>
            }
          />
          <Info label="정원" value={`${exp.capacity}명`} />
          <Info
            label="가능 요일"
            value={exp.schedule.join(" · ")}
            wide
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={pick} className="btn-primary flex-1 text-lg py-3">
            이걸로 예약 시작
          </button>
          <button onClick={onClose} className="btn-ghost flex-1 text-lg py-3">
            닫기
          </button>
        </div>
        <div className="text-sm text-hades-muted text-center mt-3">
          또는 마이크 누르고 "{exp.name} 예약할게요"라고 말씀하셔도 됩니다
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-sm text-hades-muted">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
