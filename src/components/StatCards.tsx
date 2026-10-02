/**
 * 홈 화면 통계 3칸 (지원 / 서류 합격 / 면접)
 * STYLE 을 "warm" ↔ "cream" 으로 바꾸면 색 조합이 바뀜.
 *  - warm : 햄스터 웜톤 (살구 · 버터 · 로즈)
 *  - cream: 하얀 카드 + 동그란 아이콘에만 색
 */
const STYLE: "warm" | "cream" = "warm";

type Kind = "applied" | "doc" | "interview";

const PALETTE = {
  warm: {
    applied: { card: "#FFF1E3", border: "#F5C99B", dot: "#FFDDB8", icon: "#A3561C", num: "#A3561C" },
    doc: { card: "#FFF8DC", border: "#F0D77A", dot: "#FCEBA6", icon: "#7D6200", num: "#7D6200" },
    interview: { card: "#FFEEF1", border: "#F5B3C0", dot: "#FFD6DE", icon: "#A8385A", num: "#A8385A" },
  },
  cream: {
    applied: { card: "#FFFFFF", border: "#F3E6D6", dot: "#F6B37A", icon: "#FFFFFF", num: "#2E2A1F" },
    doc: { card: "#FFFFFF", border: "#F3E6D6", dot: "#8FCB86", icon: "#FFFFFF", num: "#2E2A1F" },
    interview: { card: "#FFFFFF", border: "#F3E6D6", dot: "#F49BB0", icon: "#FFFFFF", num: "#2E2A1F" },
  },
} as const;

function Icon({ kind, color }: { kind: Kind; color: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2.1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "applied")
    return (
      <svg {...common}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    );
  if (kind === "doc")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v3" />
    </svg>
  );
}

function StatCard({ kind, value, label }: { kind: Kind; value: number; label: string }) {
  const c = PALETTE[STYLE][kind];
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-[20px] border-2 px-1.5 py-3"
      style={{ background: c.card, borderColor: c.border }}
    >
      <div className="flex size-[34px] items-center justify-center rounded-full" style={{ background: c.dot }}>
        <Icon kind={kind} color={c.icon} />
      </div>
      <span className="font-display text-2xl leading-none" style={{ color: c.num }}>
        {value}
      </span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

export function StatCards({ applied, doc, interview }: { applied: number; doc: number; interview: number }) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <StatCard kind="applied" value={applied} label="지원" />
      <StatCard kind="doc" value={doc} label="서류 합격" />
      <StatCard kind="interview" value={interview} label="면접" />
    </section>
  );
}
