import { Link, Outlet } from "react-router-dom";

import { FontSizeToggle } from "../components/FontSizeToggle";

/**
 * 판매자 전용 — 로고 그린 톤 + Zero UI(음성) 중심. 소비자 쇼핑과 레이아웃 분리.
 */
export function SellerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/80 via-white to-slate-50">
      <header className="sticky top-0 z-40 border-b border-emerald-200/60 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo-local-link.png"
              alt="로컬링크 판매자"
              className="h-10 sm:h-11 w-auto max-w-[200px] object-contain"
            />
            <span className="hidden sm:inline text-sm font-bold text-brand-green border border-brand-green/30 rounded-full px-3 py-1 bg-emerald-50">
              판매자 스튜디오
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-sm sm:text-base font-semibold text-shop-teal hover:text-shop-tealDark underline-offset-4 hover:underline"
            >
              쇼핑몰 보기 →
            </Link>
            <FontSizeToggle variant="seller" />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-emerald-100 bg-white/80 py-4 text-center text-xs text-slate-600">
        로컬링크 판매자 · 말씀만으로도 상품·숙박을 올릴 수 있어요
      </footer>
    </div>
  );
}
