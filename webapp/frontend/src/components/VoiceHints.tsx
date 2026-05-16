import { useConversation } from "../store/conversation";

/** 판매자 Zero UI 전용 예시 멘트 */
export function VoiceHints() {
  const slots = useConversation((s) => s.slots);

  const hints = pickSellerHints(slots);

  if (hints.length === 0) return null;

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
      <p className="text-sm text-slate-600 mb-2 font-medium">이렇게 말씀해 보세요</p>
      <div className="flex flex-wrap gap-2">
        {hints.map((h) => (
          <span
            key={h}
            className="bg-white border border-emerald-100 text-slate-800 rounded-full px-4 py-2 text-base shadow-sm"
          >
            「{h}」
          </span>
        ))}
      </div>
    </div>
  );
}

function pickSellerHints(slots: Record<string, unknown>): string[] {
  if (!slots.kind) {
    return ["상품 팔아요", "민박 방 빌려줘요"];
  }
  if (!slots.title) return ["올해 짠 메밀꿀", "바닷가 민박 방 둘"];
  if (slots.price == null) return ["이만 원이요", "삼만 오천 원"];
  if (!slots.location) return ["강원 강릉이요", "전북 김제"];
  if (!slots.description) return ["손님이 많이 찾는 건강 꿀이에요"];
  return ["네 그대로 올려주세요", "맞습니다"];
}
