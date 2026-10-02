import { statusTone, type Application } from "@/lib/types";
import { resolveSteps } from "@/lib/steps";

const TONE = {
  neutral: "bg-warn-bg text-warn",
  good: "bg-good-bg text-good",
  win: "bg-info-bg text-info",
  fail: "bg-fail-bg text-fail",
} as const;

type ChipApp = Pick<Application, "stage" | "status"> & Partial<Pick<Application, "steps" | "step" | "process">>;

/** 공고의 지금 단계 이름 (예: "1차 면접", "코딩테스트 불합격") */
export function stepText(app: ChipApp) {
  const { steps, step } = resolveSteps(app);
  const label = steps[step];
  if (app.status === "failed") return `${label} 불합격`;
  return label;
}

export function StatusChip({ app }: { app: ChipApp }) {
  return (
    <span className={`shrink-0 rounded-xl px-2 py-1 text-xs ${TONE[statusTone(app)]}`}>
      {stepText(app)}
    </span>
  );
}
