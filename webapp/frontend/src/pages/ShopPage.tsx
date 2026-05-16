import { Link, useSearchParams } from "react-router-dom";

import { useListingsPoll } from "../hooks/useListingsPoll";
import { useCart } from "../store/cart";
import type { Listing } from "../types";

function kindFromParams(search: string): "all" | "product" | "lodging" {
  const k = new URLSearchParams(search).get("kind");
  if (k === "product" || k === "lodging") return k;
  return "all";
}

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = kindFromParams(`?${searchParams.toString()}`);
  const { listings, loading } = useListingsPoll();
  const add = useCart((s) => s.add);

  const setFilter = (key: "all" | "product" | "lodging") => {
    if (key === "all") setSearchParams({});
    else setSearchParams({ kind: key });
  };

  const filtered: Listing[] =
    filter === "all" ? listings : listings.filter((l) => l.kind === filter);

  const pillActive =
    "px-4 py-2 rounded-xl font-semibold text-sm bg-shop-teal text-white shadow-md";
  const pillIdle =
    "px-4 py-2 rounded-xl font-semibold text-sm bg-white border border-slate-200 text-slate-700 hover:border-shop-teal/50";

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-shop-tealLight/70 via-white to-shop-surface p-8 sm:p-10 shadow-lg shadow-teal-900/5">
        <div className="absolute -right-16 -top-12 h-48 w-48 rounded-full bg-shop-teal/15 blur-3xl" />
        <div className="absolute -bottom-10 left-1/4 h-36 w-36 rounded-full bg-brand-green/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold text-shop-tealDark tracking-wide mb-1">
            LOCAL LINK · 농어촌 특산·숙박 직거래
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            이웃이 올린
            <br />
            <span className="text-shop-tealDark">특산품과 숙소</span>를 만나 보세요
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            실제 마켓처럼 상세 페이지에서 안내·예약 형태를 확인하고 장바구니에 담을 수
            있습니다. 새 글은 잠시 후 자동으로 목록에 붙습니다.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900">지금 볼 수 있는 목록</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "전체"],
                ["product", "특산·상품"],
                ["lodging", "숙박"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={filter === key ? pillActive : pillIdle}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500 py-16 text-center text-lg">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 py-16 text-center text-lg">
            아직 목록이 없어요. 판매자 화면에서 올리면 여기에 곧 나타납니다.
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {filtered.map((item) => (
              <li key={item.id}>
                <article className="h-full rounded-2xl border border-slate-200 bg-shop-surface/40 overflow-hidden hover:border-shop-teal/40 hover:shadow-lg transition-all flex flex-col">
                  <Link
                    to={`/listing/${item.id}`}
                    className="block p-5 flex-1 no-underline text-inherit"
                  >
                    <div className="flex gap-4">
                      <span className="text-4xl shrink-0 w-14 h-14 flex items-center justify-center rounded-xl bg-white border border-slate-100">
                        {item.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-lg text-slate-900 line-clamp-2">
                            {item.title}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-shop-tealLight text-shop-tealDark border border-teal-100 shrink-0">
                            {item.kind === "product" ? "상품" : "숙박"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                        <p className="text-shop-tealDark font-bold text-xl mt-3">
                          {item.price.toLocaleString()}원
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.location}</p>
                      </div>
                    </div>
                  </Link>
                  <div className="px-5 pb-5 pt-0 flex flex-wrap gap-2">
                    <Link
                      to={`/listing/${item.id}`}
                      className="btn-shop-outline flex-1 min-w-[8rem] text-center no-underline py-2.5"
                    >
                      자세히 보기
                    </Link>
                    <button
                      type="button"
                      onClick={() => add(item.id, 1)}
                      className="btn-shop flex-1 min-w-[8rem] py-2.5"
                    >
                      장바구니에 담기
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        <Link
          to="/checkout"
          className="mt-8 block text-center btn-shop py-3 text-lg no-underline"
        >
          결제·장바구니로
        </Link>
      </section>
    </div>
  );
}
