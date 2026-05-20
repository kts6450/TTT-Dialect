import { useEffect, useState } from "react";

import { api } from "../lib/api";
import type { Listing } from "../types";

export function ListingLocalGuide({ listing }: { listing: Listing }) {
  const [loading, setLoading] = useState(true);
  const [tourism, setTourism] = useState<Record<string, unknown> | null>(null);
  const [weather, setWeather] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getListingLocalGuide(listing.id)
      .then((r) => {
        setTourism(r.tourism);
        setWeather(r.weather);
      })
      .catch(() => {
        setTourism(null);
        setWeather(null);
      })
      .finally(() => setLoading(false));
  }, [listing.id]);

  if (loading) {
    return <p className="text-slate-500 py-4">지역·시즌 정보를 불러오는 중…</p>;
  }

  const highlights = (tourism?.highlights as string[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-brand-line bg-shop-tealLight/40 p-5">
        <h3 className="font-bold text-shop-tealDark text-lg">이 지역 둘러보기</h3>
        <p className="text-sm text-hades-muted mt-1">{String(tourism?.location ?? listing.location)}</p>
        <ul className="mt-3 space-y-2 text-slate-800">
          {highlights.length > 0 ? (
            highlights.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-shop-teal font-bold">•</span>
                <span>{h}</span>
              </li>
            ))
          ) : (
            <li>지역 특색을 확인 중입니다.</li>
          )}
        </ul>
        {tourism?.seller_tip ? (
          <p className="mt-3 text-sm text-slate-600">{String(tourism.seller_tip)}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-brand-line bg-brand-cream p-5">
        <h3 className="font-bold text-hades-text text-lg">지금 이 시기에</h3>
        {weather ? (
          <>
            <p className="mt-2 text-slate-800 leading-relaxed">{String(weather.summary)}</p>
            <p className="mt-2 text-slate-700">{String(weather.regional_note)}</p>
            <p className="mt-3 text-xs text-slate-500">{String(weather.caution)}</p>
          </>
        ) : (
          <p className="mt-2 text-slate-600">시즌 정보를 준비 중입니다.</p>
        )}
      </section>
    </div>
  );
}
