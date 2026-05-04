import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

import { api } from "../lib/api";
import { useConversation } from "../store/conversation";
import type { Experience } from "../types";
import { ExperienceModal } from "./ExperienceModal";

export function CatalogPanel() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Experience | null>(null);

  const slotExpId = useConversation((s) => s.slots.experience_id);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    api
      .getExperiences()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // 음성으로 슬롯 잡힌 카드는 자동 스크롤 + 강조
  useEffect(() => {
    if (slotExpId && refs.current[slotExpId]) {
      refs.current[slotExpId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [slotExpId]);

  if (loading) {
    return (
      <div className="card p-6 text-hades-muted">체험 목록을 불러오는 중…</div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">예약 가능한 체험</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-2">
        {items.map((e) => {
          const isActive = e.id === slotExpId;
          return (
            <button
              key={e.id}
              ref={(el) => {
                refs.current[e.id] = el;
              }}
              onClick={() => setSelected(e)}
              className={clsx(
                "text-left rounded-xl p-4 transition-all",
                isActive
                  ? "border-2 border-hades-gold bg-hades-gold/10 shadow-lg shadow-hades-gold/10"
                  : "border border-white/5 hover:border-hades-gold/40 hover:bg-white/5"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{e.emoji}</div>
                <div className="flex-1">
                  <div className="font-bold text-lg flex items-center gap-2">
                    {e.name}
                    {isActive && (
                      <span className="text-xs bg-hades-gold text-hades-bg rounded-full px-2 py-0.5">
                        선택됨
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-hades-muted">
                    {e.region} · {e.category} · {e.duration_min}분
                  </div>
                  <div className="mt-1 text-base text-hades-gold font-semibold">
                    {e.price.toLocaleString()}원
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <ExperienceModal exp={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
