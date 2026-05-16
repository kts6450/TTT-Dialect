import { clsx } from "clsx";

import { useConversation } from "../store/conversation";

export function ConversationView() {
  const { history, errorMsg } = useConversation();

  if (errorMsg) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-red-700 text-lg">⚠️ {errorMsg}</p>
      </div>
    );
  }

  if (history.length <= 1) {
    return (
      <div className="rounded-2xl border border-hades-line bg-slate-50/80 p-8 text-center text-hades-muted text-lg">
        위 마이크를 누르고 편하게 말씀해 보세요. 짧게 말해도 괜찮아요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
      {history.map((turn, idx) => (
        <div
          key={idx}
          className={clsx(
            "p-4 rounded-2xl text-lg leading-relaxed shadow-sm",
            turn.role === "user"
              ? "bg-white border border-hades-line ml-6 sm:ml-10 self-end"
              : "bg-gradient-to-br from-blue-50 to-white border border-blue-100 mr-6 sm:mr-10"
          )}
        >
          <div className="text-sm text-hades-muted mb-1">
            {turn.role === "user" ? "내 말" : "도우미"}
          </div>
          <div className="text-hades-text">{turn.content}</div>
        </div>
      ))}
    </div>
  );
}
