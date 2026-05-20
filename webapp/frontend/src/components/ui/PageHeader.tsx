import type { ReactNode } from "react";

export function PageHeader({
  title,
  children,
  badge,
}: {
  title: string;
  children?: ReactNode;
  badge?: string;
}) {
  return (
    <header className="mb-8">
      {badge ? (
        <span className="inline-block mb-2 text-xs font-bold uppercase tracking-wider text-shop-tealDark bg-shop-tealLight px-3 py-1 rounded-full">
          {badge}
        </span>
      ) : null}
      <h1 className="page-title">{title}</h1>
      {children ? <p className="page-lead">{children}</p> : null}
    </header>
  );
}
