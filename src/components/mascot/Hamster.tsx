import type { CheekLevel } from "@/lib/progress";

/**
 * 임시 햄스터 마스코트 (손그림 느낌 SVG).
 * 나중에 일러스트 PNG 로 교체할 때는 이 컴포넌트 안에서 <img src={`/mascot/hamster/cheek-${cheek}.png`} /> 로 바꾸면 됨.
 */
type Props = {
  cheek?: CheekLevel;
  mood?: "normal" | "happy";
  size?: number;
  className?: string;
};

const OUT = "#5A4030";
const FUR = "#E9B07A";
const CREAM = "#FBEEDC";
const EAR = "#F2B9B0";
const INK = "#3A2A1E";
const BLUSH = "#F4A3A8";

const CHEEKS: Record<CheekLevel, { r: number; dx: number; dy: number; outline: boolean }> = {
  0: { r: 11, dx: 29, dy: 78, outline: false },
  1: { r: 11, dx: 29, dy: 78, outline: false },
  2: { r: 17, dx: 36, dy: 80, outline: true },
  3: { r: 22, dx: 42, dy: 82, outline: true },
};

export function Hamster({ cheek = 1, mood = "normal", size = 120, className }: Props) {
  const c = CHEEKS[cheek];
  const left = 60 - c.dx;
  const right = 60 + c.dx;
  const full = cheek === 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-10 0 140 120"
      className={className}
      role="img"
      aria-label="햄스터"
    >
      <defs>
        <filter id="jl-hand" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={11} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={3} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#jl-hand)">
        {mood === "happy" && (
          <>
            <path d="M4 20 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 Z" fill="#FFD43B" stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
            <path d="M112 14 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z" fill="#FFD43B" stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
          </>
        )}

        {/* 외곽선 */}
        <circle cx={26} cy={32} r={12} fill="none" stroke={OUT} strokeWidth={5} />
        <circle cx={94} cy={32} r={12} fill="none" stroke={OUT} strokeWidth={5} />
        <ellipse cx={60} cy={70} rx={47} ry={42} fill="none" stroke={OUT} strokeWidth={5} />
        {c.outline && (
          <>
            <circle cx={left} cy={c.dy} r={c.r} fill="none" stroke={OUT} strokeWidth={5} />
            <circle cx={right} cy={c.dy} r={c.r} fill="none" stroke={OUT} strokeWidth={5} />
          </>
        )}

        {/* 채우기 */}
        <circle cx={26} cy={32} r={12} fill={FUR} />
        <circle cx={94} cy={32} r={12} fill={FUR} />
        <circle cx={26} cy={33} r={6.5} fill={EAR} />
        <circle cx={94} cy={33} r={6.5} fill={EAR} />
        <ellipse cx={60} cy={70} rx={47} ry={42} fill={FUR} />
        <ellipse cx={60} cy={86} rx={full ? 30 : 33} ry={full ? 22 : 24} fill={CREAM} />
        <circle cx={left} cy={c.dy} r={c.r} fill={CREAM} />
        <circle cx={right} cy={c.dy} r={c.r} fill={CREAM} />

        {/* 얼굴 */}
        {mood === "happy" ? (
          <>
            <path d="M38 62 q7 -9 14 0" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d="M68 62 q7 -9 14 0" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx={full ? 46 : 45} cy={full ? 58 : 61} rx={4.5} ry={5.5} fill={INK} />
            <ellipse cx={full ? 74 : 75} cy={full ? 58 : 61} rx={4.5} ry={5.5} fill={INK} />
            <circle cx={full ? 47.4 : 46.4} cy={full ? 56.2 : 59.2} r={1.6} fill="#fff" />
            <circle cx={full ? 75.4 : 76.4} cy={full ? 56.2 : 59.2} r={1.6} fill="#fff" />
          </>
        )}
        <ellipse cx={60} cy={full ? 67 : 69} rx={3.4} ry={2.5} fill="#D9707F" />
        {mood === "happy" ? (
          <path d="M53 74 q7 9 14 0 Z" fill="#E57A8E" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        ) : full ? (
          <ellipse cx={60} cy={74} rx={3} ry={2.4} fill={INK} />
        ) : (
          <path d="M54 74 q3 4 6 0 q3 4 6 0" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
        )}
        <ellipse cx={left + 2} cy={c.dy + 2} rx={7} ry={4} fill={BLUSH} opacity={0.75} />
        <ellipse cx={right - 2} cy={c.dy + 2} rx={7} ry={4} fill={BLUSH} opacity={0.75} />
      </g>
    </svg>
  );
}
