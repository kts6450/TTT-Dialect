import { useEffect, useState } from "react";

import { OrderStatusBadge } from "../../components/OrderStatusBadge";
import { PageHeader } from "../../components/ui/PageHeader";
import { api } from "../../lib/api";
import type { FulfillmentStatus, Order } from "../../types";

const NEXT_STEPS: Partial<Record<FulfillmentStatus, FulfillmentStatus[]>> = {
  pending: ["preparing", "cancelled"],
  preparing: ["shipping", "cancelled"],
  shipping: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const STEP_LABEL: Record<FulfillmentStatus, string> = {
  pending: "결제 대기",
  preparing: "준비 시작",
  shipping: "배송·이용 시작",
  completed: "완료 처리",
  cancelled: "취소",
};

export function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [agent, setAgent] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, unknown>>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getSellerOrders(), api.getAgentSuggestions()])
      .then(([o, a]) => {
        setOrders(o);
        setAgent(a.suggestions);
      })
      .catch(() => {
        setOrders([]);
        setAgent([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const makeAlimtalk = async (order: Order) => {
    const title = order.items[0]?.title ?? "주문 상품";
    setBusyId(order.id);
    try {
      const r = await api.sellerAlimtalk({
        kind: "product",
        title,
        buyer_name: order.buyer_name,
        order_id: order.id,
        description: "",
        price: order.total,
        location: "",
      });
      setDrafts((d) => ({ ...d, [order.id]: r }));
    } finally {
      setBusyId(null);
    }
  };

  const advance = async (order: Order, next: FulfillmentStatus) => {
    const updated = await api.setOrderStatus(order.id, next);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
  };

  const copyDraft = async (orderId: string, buyer: string, seller: string) => {
    const text = `[구매자]\n${buyer}\n\n[판매자]\n${seller}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(orderId);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      <PageHeader badge="공급자" title="주문 · 알림">
        결제된 주문을 단계별로 진행하세요. 알림 문구는 <strong>복사</strong>해 문자·카톡에
        붙여 넣습니다.
      </PageHeader>

      {agent.length > 0 && (
        <section className="card p-5 border-shop-teal/20 bg-shop-tealLight/40">
          <h2 className="font-bold text-shop-tealDark">운영 제안</h2>
          <ul className="mt-3 space-y-2 text-slate-800 list-disc pl-5">
            {agent.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-900">내 상품이 포함된 주문</h2>
        </div>
        {loading ? (
          <p className="p-8 text-center text-slate-500">불러오는 중…</p>
        ) : orders.length === 0 ? (
          <p className="p-8 text-center text-slate-500">아직 주문이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.map((o) => {
              const d = drafts[o.id];
              const next = NEXT_STEPS[o.fulfillment_status] ?? [];
              return (
                <li key={o.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm text-slate-500">{o.id}</p>
                        <OrderStatusBadge status={o.fulfillment_status} />
                      </div>
                      <p className="font-semibold text-lg mt-1">
                        {o.buyer_name} · {o.buyer_phone}
                      </p>
                      <p className="text-sm text-slate-600">
                        {o.items.map((i) => `${i.title} ×${i.quantity}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-800">{o.total.toLocaleString()}원</p>
                      <p className="text-xs text-slate-500">{o.payment_status}</p>
                    </div>
                  </div>

                  {next.length > 0 && o.payment_status === "paid" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {next.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={
                            n === "cancelled"
                              ? "btn-ghost text-sm py-2 px-3 text-rose-700 border-rose-200"
                              : "btn-primary text-sm py-2 px-3"
                          }
                          onClick={() => void advance(o, n)}
                        >
                          {STEP_LABEL[n]}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn-ghost text-sm py-2 border-slate-200"
                    disabled={busyId === o.id}
                    onClick={() => void makeAlimtalk(o)}
                  >
                    {busyId === o.id ? "만드는 중…" : "알림 문구 만들기"}
                  </button>
                  {d && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                      <pre className="text-sm whitespace-pre-wrap">
                        {`[구매자]\n${d.buyer_message}\n\n[판매자]\n${d.seller_reminder}`}
                      </pre>
                      <button
                        type="button"
                        className="text-sm font-semibold text-emerald-800 underline"
                        onClick={() =>
                          void copyDraft(
                            o.id,
                            String(d.buyer_message),
                            String(d.seller_reminder)
                          )
                        }
                      >
                        {copiedId === o.id ? "복사됨 ✓" : "구매자·판매자 문구 복사"}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
