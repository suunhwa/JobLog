"use client";

import { useFormStatus } from "react-dom";

/** 아이콘만 있는 "다시 분석" 버튼. 누르면 아이콘이 돌고 옆에 "분석 중" 표시 */
export function RefreshButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <span className="flex items-center gap-1.5">
      {pending && <span className="text-xs text-muted">다시 읽는 중...</span>}
      <button
        disabled={pending}
        aria-label={label}
        title={label}
        className="flex size-9 items-center justify-center rounded-full bg-soft text-muted transition active:scale-90 disabled:opacity-70"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={pending ? "animate-spin" : ""}
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
      </button>
    </span>
  );
}
