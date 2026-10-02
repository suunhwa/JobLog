/**
 * 햄스터 성장 로직
 * - 공고를 1개 담을 때마다 볼이 빵빵해짐 (10개 주기)
 * - 10개마다 집에 저장하면서 가구가 하나씩 생김
 */

export const FURNITURE = [
  { at: 10, name: "나무집 · 씨앗 항아리 · 물병" },
  { at: 20, name: "쳇바퀴" },
  { at: 30, name: "2층 다락 · 미끄럼틀" },
  { at: 40, name: "해먹" },
  { at: 50, name: "파티 가랜드 · 꽃화분" },
  { at: 70, name: "해바라기 정원" },
  { at: 100, name: "햄스터 궁전" },
] as const;

/** 0 = 방금 저장(볼 원래대로), 1 = 1~3개, 2 = 4~6개, 3 = 7~9개 */
export type CheekLevel = 0 | 1 | 2 | 3;

export function cheekLevel(count: number): CheekLevel {
  const inCycle = count % 10;
  if (inCycle === 0) return 0;
  if (inCycle <= 3) return 1;
  if (inCycle <= 6) return 2;
  return 3;
}

export function progressInfo(count: number) {
  const unlocked = FURNITURE.filter((f) => count >= f.at);
  const next = FURNITURE.find((f) => count < f.at) ?? null;
  return {
    count,
    cheek: cheekLevel(count),
    seedsInCheek: count % 10,
    justStored: count > 0 && count % 10 === 0,
    unlocked,
    next,
    remaining: next ? next.at - count : 0,
  };
}

export function cheekMessage(count: number) {
  if (count === 0) return "첫 공고를 담아볼까요?";
  const lv = cheekLevel(count);
  if (lv === 0) return "집에 저장 완료! 새 가구가 생겼어요";
  if (lv === 1) return "오물오물, 하나 넣었다!";
  if (lv === 2) return "볼이 슬슬 차오른다";
  return "우움.. 꽉 찼어..";
}
