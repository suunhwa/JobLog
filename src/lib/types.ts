export const STAGES = [
  { key: "planned", label: "지원 예정" },
  { key: "applied", label: "서류 제출" },
  { key: "doc_passed", label: "서류 합격" },
  { key: "test", label: "코테/과제" },
  { key: "interview1", label: "1차 면접" },
  { key: "interview2", label: "최종 면접" },
  { key: "offer", label: "최종 합격" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];
export type Status = "active" | "passed" | "failed";

export function stageLabel(key: string) {
  return STAGES.find((s) => s.key === key)?.label ?? key;
}

export function stageIndex(key: string) {
  return STAGES.findIndex((s) => s.key === key);
}

export type Application = {
  id: string;
  source_url: string | null;
  company: string;
  position: string | null;
  experience: string | null;
  employment_type: string | null;
  location: string | null;
  salary: string | null;
  channel: string | null;
  steps: string[] | null;
  step: number | null;
  steps_custom: boolean | null;
  deadline: string | null;
  duties: string[] | null;
  requirements: string[];
  preferred: string[];
  process: string[];
  summary: string | null;
  raw_text?: string | null;
  stage: StageKey;
  status: Status;
  memo: string;
  created_at: string;
};

/** 목록/칩에 보여줄 상태 문구 */
export function statusText(app: Pick<Application, "stage" | "status">) {
  if (app.status === "failed") return `${stageLabel(app.stage)} 불합격`;
  if (app.stage === "offer") return "최종 합격";
  return stageLabel(app.stage);
}

export function statusTone(app: Pick<Application, "stage" | "status">) {
  if (app.status === "failed") return "fail" as const;
  if (app.stage === "offer") return "win" as const;
  if (stageIndex(app.stage) >= stageIndex("doc_passed")) return "good" as const;
  return "neutral" as const;
}

/** 마감일까지 남은 일수 (오늘 = 0). 마감일 없으면 null */
export function daysLeft(deadline: string | null, today = new Date()) {
  if (!deadline) return null;
  const d = new Date(deadline + "T00:00:00");
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
}
