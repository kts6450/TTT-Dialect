import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { ShopSubNav } from "../components/shop/ShopSubNav";
import { FontSizeToggle } from "../components/FontSizeToggle";
import {
  useAuth,
  useAuthDisplayName,
  useAuthRole,
} from "../store/auth";
import { useCart } from "../store/cart";

export function ConsumerLayout() {
  const n = useCart((s) => s.lines.reduce((a, l) => a + l.quantity, 0));
  const role = useAuthRole();
  const displayName = useAuthDisplayName();
  const logout = useAuth((s) => s.logout);
  const { pathname } = useLocation();
  const isShopHome = pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream text-hades-text">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-hades-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 py-3">
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="/logo-local-link.png"
              alt="로컬링크"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            <span className="hidden sm:inline text-sm text-hades-muted">
              {displayName}님
              {role === "master" ? " · 운영" : ""}
            </span>
            {role === "seller" || role === "master" ? (
              <Link
                to="/seller/products"
                className="hidden lg:inline text-sm font-semibold text-hades-muted hover:text-shop-tealDark px-2"
              >
                셀러오피스
              </Link>
            ) : null}
            {role === "master" ? (
              <Link
                to="/admin"
                className="hidden lg:inline text-sm font-semibold text-rose-700 hover:text-rose-900 px-2"
              >
                어드민
              </Link>
            ) : null}
            <NavLink
              to="/checkout"
              className="inline-flex items-center gap-2 rounded-xl bg-shop-teal text-white font-bold text-sm px-4 py-2.5 hover:bg-shop-tealHover transition-colors"
            >
              장바구니
              {n > 0 && (
                <span className="min-w-[1.25rem] h-5 flex items-center justify-center rounded-full bg-white/20 text-xs px-1.5">
                  {n}
                </span>
              )}
            </NavLink>
            <button
              type="button"
              className="text-sm text-hades-muted hover:text-hades-text px-1"
              onClick={() => {
                logout();
                window.location.href = "/login?role=consumer";
              }}
            >
              나가기
            </button>
            <FontSizeToggle variant="consumer" />
          </div>
        </div>
        {isShopHome && <ShopSubNav />}
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-hades-line bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-hades-muted space-y-1">
          <p className="font-semibold text-hades-text">로컬링크 · 농어촌 직거래</p>
          <p>회원 전용 · 시연용 결제</p>
        </div>
      </footer>
    </div>
  );
}
