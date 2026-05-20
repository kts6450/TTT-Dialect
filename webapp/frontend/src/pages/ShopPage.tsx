import { Link, useSearchParams } from "react-router-dom";

import { HeroCarousel } from "../components/shop/HeroCarousel";
import { useListingsPoll } from "../hooks/useListingsPoll";
import {
  listingCoverPhoto,
  listingDemoRating,
  listingDemoViewCount,
  listingReviewCount,
} from "../lib/listingDisplay";
import {
  filterShopListings,
  parseShopFilters,
  sectionTitle,
  shopSearchParams,
} from "../lib/shopNavigation";
import { categoryLabel } from "../lib/sellerSectors";
import { useCart } from "../store/cart";
import type { Listing } from "../types";

const STORY_CARDS = [
  {
    title: "농촌 체험, 이렇게 즐겨요",
    body: "수확부터 요리까지, 아이와 어르신 모두 함께하는 하루 코스를 소개합니다.",
  },
  {
    title: "어촌 갯벌의 아침",
    body: "간조 때마다 달라지는 갯벌. 지역 어민이 알려주는 생태 이야기.",
  },
  {
    title: "숙소에서 보내는 쉼",
    body: "민박·캠핑·펜션 — 지역 호스트와 직접 조율하는 숙박 안내.",
  },
];

function ListingCard({ item, onAdd }: { item: Listing; onAdd: (id: string) => void }) {
  const photo = listingCoverPhoto(item);
  const views = listingDemoViewCount(item.id);
  const rating = listingDemoRating(item.id);
  const reviews = listingReviewCount(item.id);

  return (
    <article className="card overflow-hidden h-full flex flex-col p-0 hover:shadow-card-hover transition-shadow duration-300">
      <Link
        to={`/listing/${item.id}`}
        className="block no-underline text-inherit flex-1 flex flex-col"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-hades-line">
          <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
                        <span className="absolute top-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-hades-text shadow-sm">
                          {categoryLabel(item.category)}
                        </span>
          <span className="absolute bottom-3 right-3 rounded-lg bg-black/50 backdrop-blur-sm px-2 py-1 text-xs font-semibold text-white tabular-nums">
            ★ {rating} ({reviews})
          </span>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <p className="text-xs font-semibold text-shop-tealDark">{item.location}</p>
          <h3 className="mt-1 font-bold text-lg text-hades-text line-clamp-2 leading-snug">
            {item.title}
          </h3>
          <p className="mt-2 text-sm text-hades-muted line-clamp-2 flex-1">{item.description}</p>
          <p className="mt-3 pt-3 border-t border-hades-line text-xl font-bold text-shop-tealDark tabular-nums">
            {item.price.toLocaleString()}원
            {item.kind === "lodging" && (
              <span className="text-sm font-semibold text-hades-muted"> / 1박</span>
            )}
          </p>
          <p className="text-xs text-hades-muted mt-1 tabular-nums">조회 {views.toLocaleString()}</p>
        </div>
      </Link>
      <div className="px-4 pb-4 flex gap-2">
        <Link
          to={`/listing/${item.id}`}
          className="flex-1 text-center no-underline rounded-xl btn-shop-outline text-sm !py-2.5"
        >
          자세히
        </Link>
        <button
          type="button"
          onClick={() => onAdd(item.id)}
          className="flex-1 rounded-xl btn-shop text-sm !py-2.5"
        >
          담기
        </button>
      </div>
    </article>
  );
}

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseShopFilters(`?${searchParams.toString()}`);
  const { listings, loading } = useListingsPoll();
  const add = useCart((s) => s.add);

  const filtered = filterShopListings(listings, filters);
  const title = sectionTitle(filters);
  const showStory = filters.tab === "story";
  const showCoupon = filters.tab === "coupon";

  const setQuick = (patch: Partial<typeof filters>) => {
    const qs = shopSearchParams({ ...filters, ...patch });
    setSearchParams(qs ? new URLSearchParams(qs.slice(1)) : {});
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <HeroCarousel listings={listings} />

      {showCoupon && (
        <section className="rounded-2xl border-2 border-dashed border-shop-teal/40 bg-shop-tealLight/50 p-6 sm:p-8 text-center">
          <p className="text-sm font-bold text-shop-tealDark uppercase tracking-wide">쿠폰 · 혜택</p>
          <h2 className="mt-2 text-xl font-bold text-hades-text">첫 구매 시연 10% 할인 (데모)</h2>
          <p className="mt-2 text-hades-muted text-sm max-w-md mx-auto">
            실제 할인은 연동되지 않습니다. 결제 단계에서 참고용으로만 표시됩니다.
          </p>
        </section>
      )}

      {showStory && (
        <section className="grid gap-4 sm:grid-cols-3">
          {STORY_CARDS.map((s) => (
            <div key={s.title} className="card p-5">
              <h3 className="font-bold text-hades-text">{s.title}</h3>
              <p className="mt-2 text-sm text-hades-muted leading-relaxed">{s.body}</p>
            </div>
          ))}
        </section>
      )}

      <section>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-hades-text">{title}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuick({ kind: "all", theme: "all", tab: null })}
                className={filters.kind === "all" && filters.theme === "all" && !filters.tab ? "chip-active" : "chip"}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setQuick({ kind: "product", theme: "rural", tab: null })}
                className={filters.theme === "rural" ? "chip-active" : "chip"}
              >
                특산·상품
              </button>
              <button
                type="button"
                onClick={() => setQuick({ kind: "lodging", theme: "lodging", tab: null })}
                className={filters.kind === "lodging" ? "chip-active" : "chip"}
              >
                숙박
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-hades-line bg-white p-3 sm:p-4">
            <input
              type="search"
              placeholder="상품명·지역·설명 검색"
              className="input-field sm:flex-1"
              defaultValue={filters.query ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                window.clearTimeout((window as any).__shopQTimer);
                (window as any).__shopQTimer = window.setTimeout(() => setQuick({ query: v }), 200);
              }}
            />
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <input
                type="number"
                placeholder="최저가"
                className="input-field !py-2 !text-sm w-28 tabular-nums"
                defaultValue={filters.minPrice ?? ""}
                onBlur={(e) =>
                  setQuick({ minPrice: e.target.value ? Number(e.target.value) : undefined })
                }
              />
              <span className="text-hades-muted">~</span>
              <input
                type="number"
                placeholder="최고가"
                className="input-field !py-2 !text-sm w-28 tabular-nums"
                defaultValue={filters.maxPrice ?? ""}
                onBlur={(e) =>
                  setQuick({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
                }
              />
              <select
                className="input-field !py-2 !text-sm"
                value={filters.sort ?? "newest"}
                onChange={(e) => setQuick({ sort: e.target.value as any })}
              >
                <option value="newest">최신순</option>
                <option value="price-asc">낮은 가격순</option>
                <option value="price-desc">높은 가격순</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-hades-muted">
            <span className="h-10 w-10 rounded-full border-2 border-shop-teal border-t-transparent animate-spin" />
            <p>불러오는 중…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-hades-muted">
            <p className="text-lg">이 조건에 맞는 상품이 없습니다.</p>
            <button
              type="button"
              className="mt-4 btn-shop-outline text-sm"
              onClick={() => setQuick({ kind: "all", theme: "all", tab: null })}
            >
              전체 보기
            </button>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <li key={item.id}>
                <ListingCard item={item} onAdd={(id) => add(id, 1)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
