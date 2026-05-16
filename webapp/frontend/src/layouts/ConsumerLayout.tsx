import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { FontSizeToggle } from "../components/FontSizeToggle";
import { useCart } from "../store/cart";

const navBtn =
  "px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap";

function kindFromSearch(search: string): "all" | "product" | "lodging" {
  const k = new URLSearchParams(search).get("kind");
  if (k === "product" || k === "lodging") return k;
  return "all";
}

export function ConsumerLayout() {
  const n = useCart((s) => s.lines.reduce((a, l) => a + l.quantity, 0));
  const { search, pathname } = useLocation();
  const kind = pathname === "/" ? kindFromSearch(search) : "all";

  const catCls = (k: "all" | "product" | "lodging") =>
    kind === k
      ? `${navBtn} bg-shop-teal text-white shadow-md`
      : `${navBtn} text-slate-600 hover:bg-teal-50`;

  return (
    <div className="min-h-screen flex flex-col bg-shop-surface text-neutral-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 flex flex-wrap items-center justify-between gap-3 min-h-[3.5rem] py-2">
          <div className="flex items-center gap-4 lg:gap-8">
            <Link
              to="/"
              className="flex items-center shrink-0 hover:opacity-90 transition-opacity"
            >
              <img
                src="/logo-local-link.png"
                alt="로컬링크 Local Link"
                className="h-9 sm:h-10 w-auto max-w-[200px] object-contain object-left"
              />
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link to="/" className={catCls("all")}>
                추천
              </Link>
              <Link to="/?kind=product" className={catCls("product")}>
                특산·상품
              </Link>
              <Link to="/?kind=lodging" className={catCls("lodging")}>
                숙박
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link
              to="/seller"
              className="text-sm font-medium text-slate-500 hover:text-shop-teal px-2 hidden md:inline"
            >
              판매자 입장
            </Link>
            <NavLink
              to="/checkout"
              className={`${navBtn} inline-flex items-center gap-1 bg-slate-100 text-slate-800 hover:bg-teal-50 border border-slate-200`}
            >
              장바구니
              {n > 0 && (
                <span className="inline-flex min-w-[1.25rem] justify-center rounded-full bg-shop-teal text-white text-xs px-1.5 font-bold">
                  {n}
                </span>
              )}
            </NavLink>
            <FontSizeToggle variant="consumer" />
          </div>
        </div>
        <div className="sm:hidden border-t border-slate-100 px-4 py-2 flex gap-2 overflow-x-auto">
          <Link to="/" className={`${navBtn} shrink-0 ${kind === "all" ? "bg-shop-teal text-white" : "bg-slate-100 text-slate-700"}`}>
            추천
          </Link>
          <Link
            to="/?kind=product"
            className={`${navBtn} shrink-0 ${kind === "product" ? "bg-shop-teal text-white" : "bg-slate-100 text-slate-700"}`}
          >
            특산·상품
          </Link>
          <Link
            to="/?kind=lodging"
            className={`${navBtn} shrink-0 ${kind === "lodging" ? "bg-shop-teal text-white" : "bg-slate-100 text-slate-700"}`}
          >
            숙박
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-600">
        <p className="font-semibold text-slate-800">로컬링크 (Local Link)</p>
        <p className="mt-1">농어촌 특산품 직거래 마켓 · 데모 결제만 지원합니다</p>
        <p className="mt-2 text-xs text-slate-500">
          목록은 몇 초마다 자동으로 갱신됩니다. 판매자 화면에서 올리면 이곳에 곧바로
          반영됩니다.
        </p>
      </footer>
    </div>
  );
}
