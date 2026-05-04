import { clsx } from "clsx";

import { useConversation } from "../store/conversation";

export function ConversationView() {
  const { history, errorMsg } = useConversation();

  if (errorMsg) {
    return (
      <div className="card p-6 border-hades-danger/40">
        <div className="text-hades-danger text-xl">⚠️ {errorMsg}</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="card p-8 text-center text-hades-muted text-xl">
        마이크를 눌러 어떤 체험을 원하시는지 말씀해 주세요.
        <div className="mt-4 text-base text-hades-muted/80">
          예) "도자기 빚는 거 해보고 싶어요" / "다음 주 토요일에 두 명이 갈 수 있는 거 있나요?"
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {history.map((turn, idx) => (
        <div
          key={idx}
          className={clsx(
            "p-5 rounded-2xl text-xl leading-relaxed",
            turn.role === "user"
              ? "bg-hades-surface ml-12 self-end"
              : "bg-hades-gold/10 border border-hades-gold/30 mr-12"
          )}
        >
          <div className="text-sm text-hades-muted mb-1">
            {turn.role === "user" ? "내가 한 말" : "Hades"}
          </div>
          <div>{turn.content}</div>
        </div>
      ))}
    </div>
  );
}
