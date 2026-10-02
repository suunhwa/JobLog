import type { StageKey } from "@/lib/types";

/**
 * 공고마다 다른 전형 절차를 단계로 만들기.
 *  steps[0] = "지원 예정", steps[마지막] = "최종 합격", 가운데 = 공고의 전형 절차 (AI가 읽은 것 / 사용자가 수정한 것)
 *  step = 지금 진행 중인 단계 번호
 * 통계·이웃·알림은 기존 stage 값을 쓰므로, 단계가 바뀔 때 stage 도 같이 맞춰줌.
 */

export const DEFAULT_PROCESS = ["서류 전형", "1차 면접", "최종 면접"];

/** "서류전형", "1차면접" 같은 표현을 보기 좋게 다듬고, 시작/끝 단계는 빼기 */
export function cleanProcess(process: string[] | null | undefined): string[] {
  const out: string[] = [];
  for (const raw of process ?? []) {
    const label = raw
      .replace(/^\s*\d+\s*[.)]\s*/, "") // "1. 서류" → "서류"
      .replace(/\s+/g, " ")
      .replace(/(\d차)\s*(면접)/, "$1 $2")
      .replace(/서류\s*전형/, "서류 전형")
      .trim();
    if (!label) continue;
    if (/^(지원|접수|지원서\s*접수|입사\s*지원)$/.test(label)) continue;
    if (/(최종\s*)?합격(자\s*발표)?$|^입사$|입사\s*$|처우\s*협의|채용\s*검진|건강\s*검진/.test(label)) continue;
    if (!out.includes(label)) out.push(label);
  }
  return out.slice(0, 8);
}

export function buildSteps(process: string[] | null | undefined): string[] {
  const middle = cleanProcess(process);
  return ["지원 예정", ...(middle.length > 0 ? middle : DEFAULT_PROCESS), "최종 합격"];
}

/** 진행 중인 단계 이름 → 기존 stage 값 (통계용) */
export function stageForStep(steps: string[], idx: number): StageKey {
  if (idx <= 0) return "planned";
  if (idx >= steps.length - 1) return "offer";
  const label = steps[idx];
  if (/면접|인터뷰|interview/i.test(label)) {
    return /최종|임원|2차|3차|대표|컬처|culture/i.test(label) ? "interview2" : "interview1";
  }
  if (/코딩|과제|테스트|인적성|시험|실기|포트폴리오\s*심사/i.test(label)) return "test";
  if (/서류/.test(label)) return "applied";
  // 알 수 없는 단계: 첫 단계면 지원 완료, 그 뒤면 서류는 통과한 걸로
  return idx === 1 ? "applied" : "doc_passed";
}

/** 예전 데이터(stage 만 있는 공고)를 단계 번호로 바꾸기 */
export function stepFromStage(steps: string[], stage: StageKey): number {
  if (stage === "planned") return 0;
  if (stage === "offer") return steps.length - 1;
  // 그 stage 에 해당하는 첫 단계를 찾음
  for (let i = 1; i < steps.length - 1; i++) {
    if (stageForStep(steps, i) === stage) return i;
  }
  // 정확히 없으면 비슷한 위치 (서류 통과 = 서류 다음 단계)
  if (stage === "doc_passed") return Math.min(2, steps.length - 2);
  return 1;
}

/** 공고 하나의 단계 정보 (DB에 steps 가 없으면 만들어서) */
export function resolveSteps(app: { steps?: string[] | null; step?: number | null; process?: string[] | null; stage: StageKey }) {
  const steps = app.steps && app.steps.length >= 2 ? app.steps : buildSteps(app.process);
  const step =
    app.steps && app.steps.length >= 2 && typeof app.step === "number"
      ? Math.min(Math.max(app.step, 0), steps.length - 1)
      : stepFromStage(steps, app.stage);
  return { steps, step };
}
