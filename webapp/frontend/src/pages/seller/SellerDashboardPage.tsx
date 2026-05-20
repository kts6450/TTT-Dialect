import { useEffect, useState } from "react";

import { PageHeader } from "../../components/ui/PageHeader";
import { api } from "../../lib/api";

type Stats = Awaited<ReturnType<typeof api.getSellerDashboard>>;

export function SellerDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSellerDashboard()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기 실패"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-12 text-center text-hades-muted">불러오는 중…</p>;
  }
  if (error || !stats) {
    return (
      <p className="rounded-xl bg-red-50 border border-red-100 text-red-800 px-4 py-3">
        {error ?? "데이터 없음"}
      </p>
    );
  }

  const maxRevenue = Math.max(1, ...stats.revenue_by_day.map((d) => d.revenue));

  return (
    <div className="space-y-8">
      <PageHeader badge="공급자" title="대시보드">
        지난 7일 매출과 인기 상품·재고를 한눈에 봅니다.
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-hades-muted">총 매출 (결제 완료)</p>
          <p className="mt-2 text-3xl font-bold text-shop-tealDark tabular-nums">
            {stats.revenue_total.toLocaleString()}
            <span className="text-base font-semibold">원</span>
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-hades-muted">판매 수량</p>
          <p className="mt-2 text-3xl font-bold text-hades-text tabular-nums">
            {stats.units_total.toLocaleString()}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-hades-muted">주문</p>
          <p className="mt-2 text-3xl font-bold text-hades-text tabular-nums">
            {stats.order_count.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-hades-muted">결제 완료 {stats.paid_count}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-hades-muted">등록 상품</p>
          <p className="mt-2 text-3xl font-bold text-hades-text tabular-nums">
            {stats.listing_count.toLocaleString()}
          </p>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-hades-text mb-4">지난 7일 매출</h2>
        <div className="flex items-end justify-between gap-2 h-40">
          {stats.revenue_by_day.map((d) => {
            const h = Math.max(4, Math.round((d.revenue / maxRevenue) * 140));
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-shop-teal to-shop-tealHover"
                  style={{ height: `${h}px` }}
                  title={`${d.revenue.toLocaleString()}원`}
                />
                <span className="text-[10px] text-hades-muted tabular-nums">
                  {d.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold text-hades-text mb-4">인기 상품 TOP 5</h2>
          {stats.top_items.length === 0 ? (
            <p className="text-sm text-hades-muted">아직 결제 완료 주문이 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {stats.top_items.map((t, i) => (
                <li key={t.listing_id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-shop-tealLight text-shop-tealDark font-bold text-sm flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-semibold truncate">{t.title}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-shop-tealDark tabular-nums">
                      {t.revenue.toLocaleString()}원
                    </p>
                    <p className="text-xs text-hades-muted tabular-nums">{t.units}개</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-hades-text mb-4">재고 알림 (5개 이하)</h2>
          {stats.low_stock.length === 0 ? (
            <p className="text-sm text-hades-muted">재고가 모두 충분합니다.</p>
          ) : (
            <ul className="space-y-3">
              {stats.low_stock.map((s) => (
                <li
                  key={s.listing_id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2"
                >
                  <span className="font-semibold truncate">{s.title}</span>
                  <span className="text-sm font-bold text-amber-800 tabular-nums">
                    {s.stock ?? 0}개
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
