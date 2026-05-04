import { useConversation } from "../store/conversation";

/**
 * 사용자가 무엇을 말해야 할지 막막하지 않게, 현재 진행 상황에 맞춘
 * 짧은 예시 발화를 보여준다.
 */
export function HelpHints() {
  const slots = useConversation((s) => s.slots);

  const hints = pickHints(slots);

  return (
    <div className="card p-4 border-hades-gold/20">
      <div className="text-sm text-hades-muted mb-2">이렇게 말씀해 보세요</div>
      <div className="flex flex-wrap gap-2">
        {hints.map((h) => (
          <span
            key={h}
            className="bg-hades-gold/10 border border-hades-gold/30 text-hades-text rounded-full px-4 py-2 text-base"
          >
            "{h}"
          </span>
        ))}
      </div>
    </div>
  );
}

function pickHints(slots: Record<string, unknown>): string[] {
  if (!slots.experience_id) {
    return [
      "도자기 빚는 거 해보고 싶어요",
      "김치 담그기 있어요?",
      "한강에서 사진 찍는 거",
    ];
  }
  if (!slots.date) {
    return ["다음 주 토요일", "이번 주 일요일", "5월 10일"];
  }
  if (!slots.time) {
    return ["오후 2시", "오전 10시", "저녁 6시"];
  }
  if (!slots.headcount) {
    return ["두 명이요", "혼자 가요", "세 명"];
  }
  if (!slots.contact_name) {
    return ["김영자라고 합니다", "박철수예요"];
  }
  if (!slots.contact_phone) {
    return ["010 1234 5678"];
  }
  return ["네 맞아요", "예 그렇게 해주세요"];
}
