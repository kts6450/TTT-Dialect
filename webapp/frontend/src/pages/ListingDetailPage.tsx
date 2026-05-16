import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useListingDetailPoll } from "../hooks/useListingDetailPoll";
import { useCart } from "../store/cart";

type TabId = "info" | "guide" | "reviews";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** 간단 월 달력 — 숙박 예약 느낌용 UI */
function MonthCalendar({
  month,
  selected,
  onSelect,
}: {
  month: Date;
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const total = daysInMonth(y, m);
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  const isSameDay = (a: Date | null, day: number) =>
    a &&
    a.getFullYear() === y &&
    a.getMonth() === m &&
    a.getDate() === day;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-center font-bold text-slate-800 mb-2">
        {y}년 {m + 1}월
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) =>
          day == null ? (
            <span key={`e-${idx}`} className="h-9" />
          ) : (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(new Date(y, m, day))}
              className={[
                "h-9 rounded-lg text-sm font-semibold transition-colors",
                isSameDay(selected, day)
                  ? "bg-shop-teal text-white shadow"
                  : "text-slate-700 hover:bg-shop-tealLight",
              ].join(" ")}
            >
              {day}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export function ListingDetailPage() {
  const { id } = useParams();
  const { listing, loading } = useListingDetailPoll(id);
  const add = useCart((s) => s.add);
  const [tab, setTab] = useState<TabId>("info");
  const [qty, setQty] = useState(1);
  const [guests, setGuests] = useState(2);
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t;
  });

  const maxGuests = listing?.max_guests ?? 8;

  const tabCls = (t: TabId) =>
    [
      "flex-1 py-3 text-center font-semibold border-b-2 transition-colors text-sm sm:text-base",
      tab === t
        ? "border-shop-teal text-shop-tealDark"
        : "border-transparent text-slate-500 hover:text-slate-800",
    ].join(" ");

  const usageGuide = useMemo(() => {
    if (!listing) return "";
    if (listing.kind === "lodging") {
      return `체크인·체크아웃 시간은 판매자와 조율합니다. 인원은 최대 ${listing.max_guests ?? "—"}명 기준입니다. (데모: 실제 예약 확정은 연결되어 있지 않습니다.)`;
    }
    return "배송·픽업은 판매자와 직거래로 진행됩니다. 재고는 데모용이며, 결제 후에도 자동 차감되지 않을 수 있습니다.";
  }, [listing]);

  if (loading && !listing) {
    return (
      <p className="text-center text-slate-500 py-20 text-lg">불러오는 중…</p>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <p className="text-lg text-slate-600">상품을 찾을 수 없습니다.</p>
        <Link to="/" className="btn-shop inline-block no-underline">
          목록으로
        </Link>
      </div>
    );
  }

  const isLodging = listing.kind === "lodging";

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/" className="text-shop-teal hover:underline">
          홈
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-shop-tealLight/40 to-white aspect-[4/3] flex items-center justify-center text-[6rem] sm:text-[8rem] shadow-inner">
            {listing.emoji}
          </div>

          <div className="mt-2 flex border-b border-slate-200">
            <button type="button" className={tabCls("info")} onClick={() => setTab("info")}>
              상품 정보
            </button>
            <button type="button" className={tabCls("guide")} onClick={() => setTab("guide")}>
              이용 안내
            </button>
            <button type="button" className={tabCls("reviews")} onClick={() => setTab("reviews")}>
              후기 (0)
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {tab === "info" && (
              <>
                <p className="text-sm text-shop-tealDark font-semibold">
                  {listing.kind === "product" ? "특산·상품" : "숙박"} · {listing.location}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                  {listing.title}
                </h1>
                <p className="text-3xl font-bold text-shop-tealDark">
                  {listing.price.toLocaleString()}원
                  {isLodging && (
                    <span className="text-lg font-semibold text-slate-500"> / 1박 기준</span>
                  )}
                </p>
                <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
                  {listing.description || "상세 설명이 곧 추가됩니다."}
                </p>
              </>
            )}
            {tab === "guide" && (
              <p className="text-slate-700 text-lg leading-relaxed">{usageGuide}</p>
            )}
            {tab === "reviews" && (
              <p className="text-slate-500 text-lg">아직 등록된 후기가 없습니다.</p>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg space-y-5">
          <h2 className="text-lg font-bold text-slate-900 sr-only">예약·구매</h2>

          {isLodging ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="btn-shop-outline px-3 py-2 text-sm"
                  onClick={() =>
                    setMonthCursor(
                      new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)
                    )
                  }
                >
                  이전
                </button>
                <button
                  type="button"
                  className="btn-shop-outline px-3 py-2 text-sm"
                  onClick={() =>
                    setMonthCursor(
                      new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)
                    )
                  }
                >
                  다음
                </button>
              </div>
              <MonthCalendar
                month={monthCursor}
                selected={selectedDate}
                onSelect={setSelectedDate}
              />
              <p className="text-xs text-slate-500">
                날짜는 데모용 표시입니다. 실제 예약 확정은 장바구니·결제 플로우와 별도입니다.
              </p>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">인원 선택</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="w-11 h-11 rounded-xl border border-slate-200 font-bold text-lg hover:bg-slate-50"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-xl font-bold">{guests}명</span>
                  <button
                    type="button"
                    className="w-11 h-11 rounded-xl border border-slate-200 font-bold text-lg hover:bg-slate-50"
                    onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  유아·어린이 포함 인원으로 선택해 주세요. 최대 {maxGuests}명.
                </p>
              </div>

              <button
                type="button"
                className="btn-shop w-full text-lg py-4"
                onClick={() => add(listing.id, Math.max(1, guests))}
              >
                예약하기 (장바구니 담기)
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">수량</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="w-11 h-11 rounded-xl border border-slate-200 font-bold text-lg hover:bg-slate-50"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-xl font-bold">{qty}</span>
                  <button
                    type="button"
                    className="w-11 h-11 rounded-xl border border-slate-200 font-bold text-lg hover:bg-slate-50"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
                {listing.stock != null && (
                  <p className="text-xs text-slate-500 mt-2">(데모 재고 {listing.stock})</p>
                )}
              </div>
              <button
                type="button"
                className="btn-shop w-full text-lg py-4"
                onClick={() => add(listing.id, qty)}
              >
                장바구니에 담기
              </button>
            </>
          )}

          <Link
            to="/checkout"
            className="block text-center btn-shop-outline py-3 no-underline w-full"
          >
            장바구니 바로 가기
          </Link>
        </aside>
      </div>
    </div>
  );
}
