import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  MEGA_MENU,
  TOP_NAV,
  parseShopFilters,
  shopSearchParams,
  type ShopFilters,
  type ShopTheme,
} from "../../lib/shopNavigation";

function IconMenu() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 11c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 0c-3.5 0-6 2.5-6 6 0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2 0-3.5-2.5-6-6-6z"
      />
    </svg>
  );
}

function IconBook() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.5v11M7 8.5h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2z"
      />
    </svg>
  );
}

export function ShopSubNav() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const filters = parseShopFilters(search);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nearMsg, setNearMsg] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [search]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (patch: Partial<ShopFilters>) => {
    navigate({ pathname: "/", search: shopSearchParams({ ...filters, ...patch, tab: patch.tab ?? filters.tab }) });
  };

  const pickTheme = (theme: ShopTheme) => {
    go({ theme, tab: null, kind: theme === "lodging" ? "lodging" : filters.kind });
  };

  const pickTab = (tab: ShopFilters["tab"]) => {
    const theme =
      tab === "lodging" ? "lodging" : tab === "experience" ? "experience" : filters.theme;
    const kind = tab === "lodging" ? "lodging" : filters.kind;
    go({ tab, theme, kind });
  };

  const nearMe = () => {
    if (!navigator.geolocation) {
      setNearMsg("이 브라우저에서는 위치 기능을 쓸 수 없습니다.");
      return;
    }
    setNearMsg("위치를 확인하는 중…");
    navigator.geolocation.getCurrentPosition(
      () => setNearMsg("가까운 지역 상품은 목록에서 지역명으로 찾아보세요. (시연)"),
      () => setNearMsg("위치 권한이 필요합니다. 설정에서 허용해 주세요.")
    );
  };

  const navLinkCls = (active: boolean) =>
    [
      "text-sm font-semibold whitespace-nowrap px-1 py-2 border-b-2 transition-colors",
      active
        ? "text-shop-tealDark border-shop-teal"
        : "text-slate-600 border-transparent hover:text-shop-tealDark",
    ].join(" ");

  return (
    <div ref={wrapRef} className="border-b border-hades-line bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-shop-tealDark font-bold text-sm sm:text-base hover:text-shop-teal"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <IconMenu />
            전체 메뉴
          </button>

          {menuOpen && (
            <div
              className="absolute left-0 top-full mt-1 z-50 min-w-[220px] rounded-xl border border-hades-line bg-white shadow-lg py-2"
              role="menu"
            >
              {MEGA_MENU.map((item) => (
                <button
                  key={item.theme}
                  type="button"
                  role="menuitem"
                  className={`w-full text-left px-4 py-2.5 hover:bg-shop-tealLight/60 transition-colors ${
                    filters.theme === item.theme ? "bg-shop-tealLight/80 font-bold text-shop-tealDark" : ""
                  }`}
                  onClick={() => pickTheme(item.theme)}
                >
                  <span className="block text-sm font-semibold text-hades-text">{item.label}</span>
                  <span className="block text-xs text-hades-muted mt-0.5">{item.hint}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="flex flex-1 items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide min-w-0">
          {TOP_NAV.map((item) => (
            <button
              key={item.tab}
              type="button"
              className={navLinkCls(filters.tab === item.tab)}
              onClick={() => pickTab(item.tab)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-hades-line px-3 py-1.5 text-xs sm:text-sm font-semibold text-hades-text hover:border-shop-teal hover:text-shop-tealDark transition-colors"
            onClick={() => void nearMe()}
          >
            <IconPin />
            내 주변
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-hades-line px-3 py-1.5 text-xs sm:text-sm font-semibold text-hades-text hover:border-shop-teal hover:text-shop-tealDark transition-colors"
            onClick={() => pickTab("story")}
          >
            <IconBook />
            스토리
          </button>
        </div>
      </div>

      {nearMsg && (
        <p className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 text-xs text-shop-tealDark font-medium">
          {nearMsg}
          <button type="button" className="ml-2 underline" onClick={() => setNearMsg(null)}>
            닫기
          </button>
        </p>
      )}
    </div>
  );
}
