import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { listingCoverPhoto } from "../../lib/listingDisplay";
import type { Listing } from "../../types";

const FALLBACK_SLIDES = [
  {
    id: "demo-1",
    title: "친환경 인증 연천 딸기수확 체험",
    subtitle: "아이와 함께하는 농촌 체험",
    image:
      "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?auto=format&fit=crop&w=1600&q=80",
    to: "/?theme=experience",
  },
  {
    id: "demo-2",
    title: "노을 지는 서해 캠핑",
    subtitle: "숙소·캠핑 특별 기획",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=80",
    to: "/?kind=lodging",
  },
  {
    id: "demo-3",
    title: "어촌 갯벌 체험 · 싱싱한 해산물",
    subtitle: "바다와 함께하는 하루",
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80",
    to: "/?theme=fishing",
  },
] as const;

type Slide =
  | { id: string; title: string; subtitle: string; image: string; to: string; listingId?: never }
  | {
      id: string;
      title: string;
      subtitle: string;
      image: string;
      to: string;
      listingId: string;
    };

export function HeroCarousel({ listings }: { listings: Listing[] }) {
  const slides: Slide[] = useMemo(() => {
    if (listings.length === 0) {
      return FALLBACK_SLIDES.map((s) => ({ ...s }));
    }
    return listings.slice(0, 5).map((l) => ({
      id: l.id,
      listingId: l.id,
      title: l.title,
      subtitle: `${l.location} · ${l.price.toLocaleString()}원`,
      image: listingCoverPhoto(l),
      to: `/listing/${l.id}`,
    }));
  }, [listings]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

  return (
    <section className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-card-hover isolate">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s) => (
          <div key={s.id} className="min-w-full relative aspect-[16/9] sm:aspect-[21/9]">
            <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 max-w-xl">
              <p className="text-white/85 text-sm font-medium mb-2">{s.subtitle}</p>
              <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight drop-shadow-md">
                {s.title}
              </h2>
              <Link
                to={s.to}
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white text-shop-tealDark font-bold text-sm sm:text-base px-5 py-2.5 no-underline hover:bg-shop-tealLight transition-colors"
              >
                바로 예약하기
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`${i + 1}번 슬라이드`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
