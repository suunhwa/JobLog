/**
 * 햄스터 방. 모은 공고 수만큼 가구가 하나씩 생김.
 *  10 나무집·씨앗 항아리·물병 / 20 쳇바퀴 / 30 2층 다락·미끄럼틀 / 40 해먹
 *  50 가랜드·꽃화분 / 70 해바라기 / 100 왕관 깃발
 * 임시 SVG. 나중에 일러스트로 바꿀 때도 count 기준 단계는 그대로 쓰면 됨.
 */

const OUT = "#5A4030";
const FUR = "#E9B07A";
const CREAM = "#FBEEDC";
const PINK = "#F4A3A8";
const INK = "#3A2A1E";

type Pose = "stand" | "run" | "sleep";

function MiniHamster({ x, y, scale = 1, pose = "stand" }: { x: number; y: number; scale?: number; pose?: Pose }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={pose === "run" ? "jl-bob-fast" : "jl-breathe"}>
      <circle cx={-13} cy={-15} r={6} fill="none" stroke={OUT} strokeWidth={4} />
      <circle cx={13} cy={-15} r={6} fill="none" stroke={OUT} strokeWidth={4} />
      <ellipse cx={0} cy={0} rx={21} ry={18} fill="none" stroke={OUT} strokeWidth={4} />
      <circle cx={-13} cy={-15} r={6} fill={FUR} />
      <circle cx={13} cy={-15} r={6} fill={FUR} />
      <circle cx={-13} cy={-14.5} r={3} fill="#F2B9B0" />
      <circle cx={13} cy={-14.5} r={3} fill="#F2B9B0" />
      <ellipse cx={0} cy={0} rx={21} ry={18} fill={FUR} />
      <ellipse cx={0} cy={6} rx={14} ry={10} fill={CREAM} />
      {pose === "sleep" ? (
        <path d="M-10 -3 q3 3 6 0 M4 -3 q3 3 6 0" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      ) : (
        <g className="jl-blink">
          <circle cx={-7} cy={-3} r={2.4} fill={INK} />
          <circle cx={7} cy={-3} r={2.4} fill={INK} />
          <circle cx={-6.2} cy={-3.9} r={0.9} fill="#fff" />
          <circle cx={7.8} cy={-3.9} r={0.9} fill="#fff" />
        </g>
      )}
      <ellipse cx={0} cy={1.5} rx={1.8} ry={1.3} fill="#D9707F" />
      <ellipse cx={-12} cy={3} rx={3.5} ry={2} fill={PINK} />
      <ellipse cx={12} cy={3} rx={3.5} ry={2} fill={PINK} />
      </g>
    </g>
  );
}

export function HamsterRoom({ count, className }: { count: number; className?: string }) {
  const has = (n: number) => count >= n;
  const pose: Pose = has(40) ? "sleep" : has(20) ? "run" : "stand";

  return (
    <svg viewBox="0 0 260 190" className={className} role="img" aria-label={`햄스터 방 (공고 ${count}개)`}>
      <defs>
        <filter id="jl-room" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={11} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={2.5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <clipPath id="jl-room-clip">
          <rect x={0} y={0} width={260} height={190} rx={18} />
        </clipPath>
      </defs>

      <g clipPath="url(#jl-room-clip)">
        {/* 벽 · 바닥 */}
        <rect x={0} y={0} width={260} height={190} fill="#FFF3E4" />
        <path d="M0 40 H260" stroke="#F7E3C8" strokeWidth={2} strokeDasharray="2 10" />
        <rect x={0} y={142} width={260} height={48} fill="#F2D7AE" />

        <g filter="url(#jl-room)">
          <path
            d="M0 144 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0"
            fill="none"
            stroke="#D9B988"
            strokeWidth={3}
          />

          {/* 50: 파티 가랜드 */}
          {has(50) && (
            <>
              <g className="jl-garland">
              <path d="M0 10 Q130 34 260 10" fill="none" stroke={OUT} strokeWidth={2} />
              {[
                [30, 15, "#F4A3A8"],
                [70, 21, "#FFD43B"],
                [110, 24, "#8CC8EE"],
                [150, 24, "#A9D18E"],
                [190, 21, "#F4A3A8"],
                [230, 15, "#FFD43B"],
              ].map(([x, y, c]) => (
                <path key={`${x}`} d={`M${x} ${y} l8 0 l-4 12 Z`} fill={c as string} stroke={OUT} strokeWidth={1.5} strokeLinejoin="round" />
              ))}
              </g>
            </>
          )}

          {/* 30: 2층 다락 기둥 · 받침 */}
          {has(30) && (
            <>
              <path d="M16 60 L16 142 M92 60 L92 142" stroke={OUT} strokeWidth={6} strokeLinecap="round" />
              <path d="M16 60 L16 142 M92 60 L92 142" stroke="#D9A066" strokeWidth={3} strokeLinecap="round" />
              <rect x={8} y={52} width={94} height={10} rx={4} fill="#D9A066" stroke={OUT} strokeWidth={2.5} />
            </>
          )}

          {/* 10: 나무집 */}
          {has(10) &&
            (has(30) ? (
              <>
                <path d="M24 142 L24 108 L50 88 L76 108 L76 142 Z" fill="#E3B079" stroke={OUT} strokeWidth={3} strokeLinejoin="round" />
                <path d="M19 110 L50 84 L81 110" fill="none" stroke="#B0703A" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M42 142 L42 128 a8 8 0 0 1 16 0 L58 142 Z" fill={OUT} />
              </>
            ) : (
              <>
                <path d="M20 142 L20 100 L52 76 L84 100 L84 142 Z" fill="#E3B079" stroke={OUT} strokeWidth={3} strokeLinejoin="round" />
                <path d="M14 102 L52 72 L90 102" fill="none" stroke="#B0703A" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M42 142 L42 124 a10 10 0 0 1 20 0 L62 142 Z" fill={OUT} />
              </>
            ))}

          {/* 100: 깃발 */}
          {has(100) && (
            <g>
              <path d="M22 52 L22 24" stroke={OUT} strokeWidth={2.5} strokeLinecap="round" />
              <path className="jl-flag" d="M23 25 L42 31 L23 37 Z" fill="#FFD43B" stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
            </g>
          )}

          {/* 30: 미끄럼틀 */}
          {has(30) && (
            <>
              <path d="M98 58 Q128 66 140 140" fill="none" stroke={OUT} strokeWidth={15} strokeLinecap="round" />
              <path d="M98 58 Q128 66 140 140" fill="none" stroke="#8CC8EE" strokeWidth={10} strokeLinecap="round" />
            </>
          )}

          {/* 10: 씨앗 항아리 */}
          {has(10) && (
            <g transform={has(30) ? "translate(-15 -47) scale(0.7)" : undefined}>
              <rect x={100} y={106} width={34} height={36} rx={10} fill="#E3F2F9" stroke={OUT} strokeWidth={2.5} />
              <rect x={97} y={99} width={40} height={9} rx={4} fill={FUR} stroke={OUT} strokeWidth={2.5} />
              <ellipse cx={110} cy={132} rx={3} ry={5} fill="#6E5A48" />
              <ellipse cx={118} cy={128} rx={3} ry={5} fill="#6E5A48" transform="rotate(30 118 128)" />
              <ellipse cx={125} cy={133} rx={3} ry={5} fill="#6E5A48" />
            </g>
          )}

          {/* 20: 쳇바퀴 (해먹이 생기면 오른쪽 아래 작게) */}
          {has(20) && !has(40) && (
            <>
              <path d="M188 102 L170 148 M188 102 L206 148" stroke={OUT} strokeWidth={6} strokeLinecap="round" />
              <path d="M188 102 L170 148 M188 102 L206 148" stroke="#C9B49A" strokeWidth={3} strokeLinecap="round" />
              <g className="jl-spin">
                <circle cx={188} cy={96} r={38} fill="none" stroke={OUT} strokeWidth={11} />
                <circle cx={188} cy={96} r={38} fill="none" stroke="#F49A9A" strokeWidth={7} />
                <path d="M188 58 L188 134 M150 96 L226 96 M161 69 L215 123 M215 69 L161 123" stroke="#F7C2C2" strokeWidth={2} />
              </g>
            </>
          )}

          {/* 40 이상: 쳇바퀴는 해먹 아래에 작게 */}
          {has(40) && (
            <g transform="translate(200 120) scale(0.5) translate(-188 -96)">
              <path d="M188 102 L170 148 M188 102 L206 148" stroke={OUT} strokeWidth={8} strokeLinecap="round" />
              <path d="M188 102 L170 148 M188 102 L206 148" stroke="#C9B49A" strokeWidth={4} strokeLinecap="round" />
              <g className="jl-spin-slow">
                <circle cx={188} cy={96} r={38} fill="none" stroke={OUT} strokeWidth={13} />
                <circle cx={188} cy={96} r={38} fill="none" stroke="#F49A9A" strokeWidth={8} />
                <path d="M188 58 L188 134 M150 96 L226 96 M161 69 L215 123 M215 69 L161 123" stroke="#F7C2C2" strokeWidth={3} />
              </g>
            </g>
          )}

          {/* 40: 해먹 */}
          {has(40) && (
            <>
              <path d="M160 52 L160 142 M240 52 L240 142" stroke={OUT} strokeWidth={6} strokeLinecap="round" />
              <path d="M160 52 L160 142 M240 52 L240 142" stroke="#D9A066" strokeWidth={3} strokeLinecap="round" />
              {/* 해먹 천 + 자는 햄스터를 한 덩어리로 흔들기 */}
              <g className="jl-sway">
                <path d="M160 60 Q200 100 240 60 Z" fill="#F7C4CF" stroke={OUT} strokeWidth={2.5} strokeLinejoin="round" />
                <path d="M172 70 L228 70 M180 79 L220 79" stroke="#fff" strokeWidth={2} strokeDasharray="4 4" />
                <MiniHamster x={200} y={66} scale={0.72} pose="sleep" />
                {has(100) && (
                  <path d="M191 52 l3 -9 l6 5 l6 -5 l3 9 Z" fill="#FFD43B" stroke={OUT} strokeWidth={1.8} strokeLinejoin="round" />
                )}
              </g>
            </>
          )}

          {/* 10: 물병 */}
          {has(10) && (
            <>
              <rect x={243} y={40} width={12} height={48} rx={5} fill="#DDF0FA" stroke={OUT} strokeWidth={2.5} />
              <rect x={245} y={60} width={8} height={26} rx={4} fill="#8CC8EE" />
              <rect x={246} y={88} width={6} height={12} rx={2} fill="#C4CCD2" stroke={OUT} strokeWidth={2} />
            </>
          )}

          {/* 50: 꽃화분 */}
          {has(50) && (
            <g className="jl-wiggle">
              <path d="M150 136 L150 120" stroke="#6FA85C" strokeWidth={2.5} />
              {[[0, -6], [5.7, -1.9], [3.5, 4.9], [-3.5, 4.9], [-5.7, -1.9]].map(([dx, dy], i) => (
                <circle key={i} cx={150 + dx} cy={116 + dy} r={3.6} fill="#F7A8BC" stroke={OUT} strokeWidth={1.2} />
              ))}
              <circle cx={150} cy={116} r={3} fill="#FFD43B" stroke={OUT} strokeWidth={1.2} />
              <path d="M142 134 L158 134 L156 146 L144 146 Z" fill="#D9A066" stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
            </g>
          )}

          {/* 70: 해바라기 */}
          {has(70) && (
            <g className="jl-wiggle jl-wiggle2">
              <path d="M226 142 L226 108" stroke="#6FA85C" strokeWidth={3} />
              <path d="M226 124 q-8 -4 -10 2 q6 2 10 -2" fill="#8CC77A" stroke="#4E7A40" strokeWidth={1.5} />
              <circle cx={226} cy={104} r={9} fill="#FFD43B" stroke={OUT} strokeWidth={2} />
              <circle cx={226} cy={104} r={4} fill="#6E5A48" />
            </g>
          )}

          {/* 0~9: 아직 빈 방이면 작은 이불 */}
          {!has(10) && <ellipse cx={130} cy={150} rx={34} ry={7} fill="#F7C4CF" stroke={OUT} strokeWidth={2} />}

          {/* 햄스터 */}
          {pose === "sleep" ? (
            <>
              <path className="jl-z" d="M222 40 l6 0 l-6 7 l6 0" stroke={OUT} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path className="jl-z jl-z2" d="M232 30 l5 0 l-5 6 l5 0" stroke={OUT} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : pose === "run" ? (
            <MiniHamster x={188} y={118} scale={0.8} />
          ) : (
            <MiniHamster x={has(10) ? 176 : 130} y={128} scale={has(10) ? 1 : 1.15} />
          )}

        </g>
      </g>
    </svg>
  );
}
