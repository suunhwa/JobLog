import Link from "next/link";

type Tab = "home" | "house";

export function BottomNav({ active }: { active: Tab }) {
  const item = (tab: Tab) =>
    `flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] transition active:scale-90 active:opacity-60 ${
      active === tab ? "font-bold text-ink" : "text-muted"
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-soft bg-surface pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
      <div className="mx-auto grid max-w-md grid-cols-2">
        <Link href="/" className={item("home")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={active === "home" ? "var(--primary)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
          </svg>
          홈
        </Link>
        <Link href="/house" className={item("house")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={active === "house" ? "var(--primary)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 21V10l8-6 8 6v11" />
            <circle cx="12" cy="15" r="3" />
          </svg>
          햄스터 집
        </Link>
      </div>
    </nav>
  );
}
