import type { CheekLevel } from "@/lib/progress";

/**
 * 임시 햄스터 마스코트 (손그림 느낌 SVG).
 * 나중에 일러스트 PNG 로 교체할 때는 이 컴포넌트 안에서 <img src={`/mascot/hamster/cheek-${cheek}.png`} /> 로 바꾸면 됨.
 */
type Props = {
  cheek?: CheekLevel;
  mood?: "normal" | "happy";
  /** 앞발로 해바라기씨를 쥐고 있는 모습 */
  seed?: boolean;
  size?: number;
  className?: string;
};

const OUT = "#5A4030";
const FUR = "#E9B07A";
const CREAM = "#FBEEDC";
const EAR = "#F2B9B0";
const INK = "#3A2A1E";
const BLUSH = "#F4A3A8";
const PAW = "#F6D2B4";

// 볼 단계별: 중심에서 떨어진 거리, 반지름, 높이, 외곽선 여부
const CHEEKS: Record<CheekLevel, { r: number; dx: number; cy: number; outline: boolean }> = {
  0: { r: 11, dx: 27, cy: 80, outline: false },
  1: { r: 11, dx: 27, cy: 80, outline: false },
  2: { r: 16, dx: 33, cy: 81, outline: true },
  3: { r: 21, dx: 39, cy: 82, outline: true },
};

export function Hamster({ cheek = 1, mood = "normal", seed = false, size = 96, className }: Props) {
  const c = CHEEKS[cheek];
  const left = 60 - c.dx;
  const right = 60 + c.dx;
  const full = cheek === 3;
  const eyeY = full ? 61 : 64;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-12 0 144 124"
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
            <path d="M2 20 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 Z" fill="#FFD43B" stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
            <path d="M114 14 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z" fill="#FFD43B" stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
          </>
        )}

        {/* 외곽선 */}
        <circle cx={30} cy={34} r={11} fill="none" stroke={OUT} strokeWidth={5} />
        <circle cx={90} cy={34} r={11} fill="none" stroke={OUT} strokeWidth={5} />
        <ellipse cx={60} cy={72} rx={44} ry={40} fill="none" stroke={OUT} strokeWidth={5} />
        {c.outline && (
          <>
            <circle cx={left} cy={c.cy} r={c.r} fill="none" stroke={OUT} strokeWidth={5} />
            <circle cx={right} cy={c.cy} r={c.r} fill="none" stroke={OUT} strokeWidth={5} />
          </>
        )}

        {/* 채우기 */}
        <circle cx={30} cy={34} r={11} fill={FUR} />
        <circle cx={90} cy={34} r={11} fill={FUR} />
        <circle cx={30} cy={35} r={6} fill={EAR} />
        <circle cx={90} cy={35} r={6} fill={EAR} />
        <ellipse cx={60} cy={72} rx={44} ry={40} fill={FUR} />
        <ellipse cx={60} cy={90} rx={30} ry={22} fill={CREAM} />
        <circle cx={left} cy={c.cy} r={c.r} fill={CREAM} />
        <circle cx={right} cy={c.cy} r={c.r} fill={CREAM} />

        {/* 얼굴 */}
        {mood === "happy" ? (
          <>
            <path d={`M40 ${eyeY + 1} q7 -9 14 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d={`M66 ${eyeY + 1} q7 -9 14 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx={47} cy={eyeY} rx={5} ry={6} fill={INK} />
            <ellipse cx={73} cy={eyeY} rx={5} ry={6} fill={INK} />
            <circle cx={48.8} cy={eyeY - 2.2} r={2} fill="#fff" />
            <circle cx={74.8} cy={eyeY - 2.2} r={2} fill="#fff" />
          </>
        )}
        <ellipse cx={60} cy={full ? 69 : 72} rx={3} ry={2.2} fill="#D9707F" />
        {mood === "happy" ? (
          <path d="M54 76 q6 8 12 0 Z" fill="#E57A8E" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        ) : full ? (
          <ellipse cx={60} cy={75} rx={2.8} ry={2.2} fill={INK} />
        ) : (
          <path d="M55 76 q2.5 3 5 0 q2.5 3 5 0" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
        )}
        <ellipse cx={left + 2} cy={c.cy} rx={6.5} ry={4} fill={BLUSH} opacity={0.8} />
        <ellipse cx={right - 2} cy={c.cy} rx={6.5} ry={4} fill={BLUSH} opacity={0.8} />

        {seed && (
          <>
            <ellipse cx={60} cy={98} rx={6} ry={9} fill="#6E5A48" stroke={INK} strokeWidth={1.5} />
            <path d="M60 90 L60 106" stroke="#EDE3D0" strokeWidth={1.4} strokeLinecap="round" />
            <circle cx={52} cy={98} r={5} fill={PAW} stroke={OUT} strokeWidth={2} />
            <circle cx={68} cy={98} r={5} fill={PAW} stroke={OUT} strokeWidth={2} />
          </>
        )}
        <ellipse cx={44} cy={113} rx={8} ry={4.5} fill={PAW} stroke={OUT} strokeWidth={2} />
        <ellipse cx={76} cy={113} rx={8} ry={4.5} fill={PAW} stroke={OUT} strokeWidth={2} />
      </g>
    </svg>
  );
}
