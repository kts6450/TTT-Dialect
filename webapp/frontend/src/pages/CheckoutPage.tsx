import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../lib/api";
import { useCart } from "../store/cart";
import type { Listing } from "../types";

export function CheckoutPage() {
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const [listings, setListings] = useState<Listing[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [paidId, setPaidId] = useState<string | null>(null);
  const [txn, setTxn] = useState<string | null>(null);

  useEffect(() => {
    api.getListings().then(setListings).catch(() => setListings([]));
  }, [paidId]);

  const byId = useMemo(() => Object.fromEntries(listings.map((l) => [l.id, l])), [listings]);

  const rows = useMemo(() => {
    return lines
      .map((ln) => {
        const l = byId[ln.listingId];
        if (!l) return null;
        return { line: ln, listing: l };
      })
      .filter(Boolean) as { line: { listingId: string; quantity: number }; listing: Listing }[];
  }, [lines, byId]);

  const total = rows.reduce((s, r) => s + r.listing.price * r.line.quantity, 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) return;
    setBusy(true);
    setPaidId(null);
    setTxn(null);
    try {
      const order = await api.createOrder({
        items: rows.map((r) => ({
          listing_id: r.line.listingId,
          quantity: r.line.quantity,
        })),
        buyer_name: name.trim(),
        buyer_phone: phone.trim(),
      });
      const paid = await api.mockPay(order.id);
      setPaidId(paid.id);
      setTxn(paid.payment?.transaction_id ?? null);
      clear();
    } finally {
      setBusy(false);
    }
  };

  if (paidId) {
    return (
      <div className="max-w-lg mx-auto rounded-3xl border border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-lg">
        <div className="text-5xl mb-4" aria-hidden>
          ✓
        </div>
        <h1 className="text-2xl font-bold text-emerald-900">모의 결제가 완료되었습니다</h1>
        <p className="mt-3 text-lg text-emerald-800">
          실제 돈은 나가지 않았습니다. 시연용 거래입니다.
        </p>
        <p className="mt-6 text-sm text-hades-muted">주문 번호</p>
        <p className="font-mono font-bold text-lg text-hades-text">{paidId}</p>
        {txn && (
          <>
            <p className="mt-2 text-sm text-hades-muted">거래 번호 (가짜)</p>
            <p className="font-mono font-semibold text-hades-text">{txn}</p>
          </>
        )}
        <Link to="/" className="btn-shop inline-block mt-8 text-lg px-8 py-3 no-underline">
          쇼핑으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-hades-text">장바구니 · 결제</h1>
        <p className="mt-2 text-hades-muted text-lg">
          아래 금액은 참고용입니다. 결제 버튼은 가짜입니다.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-hades-line bg-white p-12 text-center text-hades-muted text-lg">
          담긴 물건이 없어요.{" "}
          <Link to="/" className="text-shop-tealDark font-semibold underline">
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <>
          <ul className="rounded-3xl border border-hades-line bg-white divide-y divide-hades-line shadow-md overflow-hidden">
            {rows.map(({ line, listing }) => (
              <li key={line.listingId} className="p-5 flex flex-wrap gap-4 items-center">
                <span className="text-4xl">{listing.emoji}</span>
                <div className="flex-1 min-w-[200px]">
                  <p className="font-bold text-lg">{listing.title}</p>
                  <p className="text-sm text-hades-muted">
                    {listing.price.toLocaleString()}원 ×
                    <input
                      type="number"
                      min={1}
                      className="w-16 ml-1 rounded-lg border border-hades-line px-2 py-1 text-center"
                      value={line.quantity}
                      onChange={(e) =>
                        setQty(line.listingId, parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </p>
                </div>
                <div className="font-bold text-lg text-shop-tealDark">
                  {(listing.price * line.quantity).toLocaleString()}원
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 font-semibold"
                  onClick={() => remove(line.listingId)}
                >
                  빼기
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-3xl border border-hades-line bg-slate-50 p-6 flex justify-between items-center">
            <span className="text-lg font-semibold">합계</span>
            <span className="text-2xl font-bold text-hades-text">{total.toLocaleString()}원</span>
          </div>

          <form onSubmit={submit} className="rounded-3xl border border-hades-line bg-white p-6 sm:p-8 shadow-md space-y-4">
            <h2 className="text-xl font-bold text-hades-text">받는 분 정보</h2>
            <div>
              <label className="block text-sm font-semibold text-hades-muted mb-1">성함</label>
              <input
                className="w-full rounded-xl border border-hades-line px-4 py-3 text-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-hades-muted mb-1">연락처</label>
              <input
                className="w-full rounded-xl border border-hades-line px-4 py-3 text-lg"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                required
              />
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 space-y-2">
              <p className="font-semibold text-hades-text">테스트 카드 (가짜)</p>
              <p className="text-sm text-hades-muted">번호 · 유효기간 · CVC는 입력하지 않아도 됩니다.</p>
            </div>

            <button type="submit" className="btn-shop w-full text-xl py-4" disabled={busy}>
              {busy ? "처리 중…" : "모의 결제하기"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
