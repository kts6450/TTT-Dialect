import type { Listing, ListingGuide } from "../types";

function BulletList({ items, title }: { items: string[]; title: string }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="font-bold text-hades-text text-lg">{title}</h3>
      <ul className="space-y-2 text-slate-800">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-shop-teal font-bold shrink-0">•</span>
            <span className="leading-relaxed">{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 상품 정보 탭 — 루플형 체험 포인트·STEP */
export function ListingInfoSections({ listing }: { listing: Listing }) {
  const g = listing.guide;
  const steps = g?.steps ?? [];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-hades-line bg-slate-50/80 p-5">
        <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
          {listing.description || "상세 설명이 곧 추가됩니다."}
        </p>
      </div>

      {g?.highlights && g.highlights.length > 0 && (
        <section>
          <h3 className="font-bold text-hades-text text-xl mb-4">체험 포인트</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {g.highlights.map((h, i) => (
              <li
                key={i}
                className="rounded-xl border border-shop-teal/20 bg-shop-tealLight/40 px-4 py-3 text-slate-800 font-medium leading-snug"
              >
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}

      {steps.length > 0 && (
        <section>
          <h3 className="font-bold text-hades-text text-xl mb-4">체험 상세</h3>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li
                key={i}
                className="rounded-2xl border border-hades-line bg-white p-5 shadow-sm flex gap-4"
              >
                <span className="shrink-0 w-10 h-10 rounded-full bg-shop-teal text-white font-bold flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    {s.time ? (
                      <span className="text-sm font-bold text-shop-tealDark tabular-nums">
                        {s.time}
                      </span>
                    ) : null}
                    <h4 className="font-bold text-hades-text text-lg">{s.title}</h4>
                  </div>
                  <p className="mt-2 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/** 이용 안내 탭 — 환불·만남장소·주의 등 */
export function ListingUsageGuideSections({ guide }: { guide: ListingGuide | null | undefined }) {
  if (!guide) {
    return (
      <p className="text-hades-muted">이용 안내가 준비 중입니다. 판매자에게 문의해 주세요.</p>
    );
  }

  return (
    <div className="space-y-8">
      {guide.meeting_place ? (
        <section className="rounded-2xl border border-hades-line bg-white p-5">
          <h3 className="font-bold text-hades-text text-lg">만남 장소</h3>
          <p className="mt-2 text-slate-800 leading-relaxed">{guide.meeting_place}</p>
          {guide.address ? (
            <p className="mt-2 text-sm text-hades-muted">주소: {guide.address}</p>
          ) : null}
        </section>
      ) : null}

      <BulletList items={guide.included ?? []} title="포함 사항" />
      <BulletList items={guide.not_included ?? []} title="불포함 사항" />
      <BulletList items={guide.precautions ?? []} title="유의 사항" />

      {guide.refund_policy ? (
        <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
          <h3 className="font-bold text-hades-text text-lg">교환 · 반품 · 환불</h3>
          <p className="mt-2 text-slate-800 leading-relaxed whitespace-pre-wrap">
            {guide.refund_policy}
          </p>
        </section>
      ) : null}

      {guide.nearby && guide.nearby.length > 0 && (
        <section>
          <h3 className="font-bold text-hades-text text-xl mb-4">인근 관광지</h3>
          <ul className="space-y-4">
            {guide.nearby.map((spot, i) => (
              <li key={i} className="rounded-2xl border border-hades-line bg-white p-5">
                <h4 className="font-bold text-lg text-hades-text">{spot.name}</h4>
                <dl className="mt-2 grid gap-1 text-sm text-slate-700">
                  {spot.address ? (
                    <>
                      <dt className="inline font-semibold">주소 </dt>
                      <dd className="inline">{spot.address}</dd>
                    </>
                  ) : null}
                  {spot.hours ? (
                    <div>
                      <span className="font-semibold">이용시간 </span>
                      {spot.hours}
                    </div>
                  ) : null}
                  {spot.holiday ? (
                    <div>
                      <span className="font-semibold">휴일 </span>
                      {spot.holiday}
                    </div>
                  ) : null}
                  {spot.parking ? (
                    <div>
                      <span className="font-semibold">주차 </span>
                      {spot.parking}
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
