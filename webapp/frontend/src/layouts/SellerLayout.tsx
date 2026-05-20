import { Link, NavLink, Outlet } from "react-router-dom";

import { RequireRole } from "../components/RequireRole";
import { FontSizeToggle } from "../components/FontSizeToggle";
import { categoryLabel } from "../lib/sellerSectors";
import {
  useAuth,
  useAuthDisplayName,
  useAuthRole,
  useAuthSellerSector,
} from "../store/auth";

const tab =
  "px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap";
const tabOn = `${tab} bg-shop-teal text-white shadow-sm`;
const tabOff = `${tab} text-hades-muted hover:bg-shop-tealLight hover:text-shop-tealDark`;

export function SellerLayout() {
  const displayName = useAuthDisplayName();
  const logout = useAuth((s) => s.logout);
  const sellerSector = useAuthSellerSector();
  const role = useAuthRole();

  return (
    <RequireRole role="seller">
      <div className="min-h-screen flex flex-col bg-brand-cream">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-brand-line">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/logo-local-link.png"
                alt="로컬링크"
                className="h-9 sm:h-10 w-auto object-contain shrink-0"
              />
              <span className="text-xs font-bold text-shop-tealDark bg-shop-tealLight px-2.5 py-1 rounded-full shrink-0">
                {role === "master" ? "운영자" : `셀러 · ${categoryLabel(sellerSector ?? "rural")}`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-hades-muted hidden sm:inline">{displayName}님</span>
              <Link
                to="/"
                className="font-semibold text-shop-tealDark hover:underline underline-offset-4"
              >
                쇼핑몰 보기
              </Link>
              <button
                type="button"
                className="text-hades-muted hover:text-hades-text"
                onClick={() => {
                  logout();
                  window.location.href = "/login?role=seller";
                }}
              >
                나가기
              </button>
              <FontSizeToggle variant="seller" />
            </div>
          </div>
          <nav className="max-w-5xl mx-auto px-4 sm:px-6 pb-3 flex gap-2 overflow-x-auto">
            <NavLink
              to="/seller/dashboard"
              className={({ isActive }) => (isActive ? tabOn : tabOff)}
            >
              대시보드
            </NavLink>
            <NavLink
              to="/seller/products"
              className={({ isActive }) => (isActive ? tabOn : tabOff)}
            >
              상품 등록
            </NavLink>
            <NavLink to="/seller/sns" className={({ isActive }) => (isActive ? tabOn : tabOff)}>
              SNS 홍보
            </NavLink>
            <NavLink
              to="/seller/orders"
              className={({ isActive }) => (isActive ? tabOn : tabOff)}
            >
              주문 · 알림
            </NavLink>
            {role === "master" ? (
              <NavLink
                to="/admin"
                className={({ isActive }) => (isActive ? tabOn : tabOff)}
              >
                어드민
              </NavLink>
            ) : null}
          </nav>
        </header>
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Outlet />
        </main>
        <footer className="border-t border-brand-line bg-white py-6 text-center text-sm text-hades-muted">
          등록한 상품은 소비자 쇼핑몰에 바로 반영됩니다
        </footer>
      </div>
    </RequireRole>
  );
}
