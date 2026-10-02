import { statusText, statusTone, type Application } from "@/lib/types";

const TONE = {
  neutral: "bg-warn-bg text-warn",
  good: "bg-good-bg text-good",
  win: "bg-info-bg text-info",
  fail: "bg-fail-bg text-fail",
} as const;

export function StatusChip({ app }: { app: Pick<Application, "stage" | "status"> }) {
  return (
    <span className={`shrink-0 rounded-xl px-2 py-1 text-xs ${TONE[statusTone(app)]}`}>
      {statusText(app)}
    </span>
  );
}
