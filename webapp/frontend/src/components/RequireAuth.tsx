import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../store/auth";

/** 로그인한 회원만 하위 라우트 접근 */
export function RequireAuth() {
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const location = useLocation();

  if (!token || !user) {
    const roleHint =
      location.pathname.startsWith("/seller") ? "seller" : "consumer";
    return (
      <Navigate
        to={`/login?role=${roleHint}`}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
