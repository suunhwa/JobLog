"use client";

import { useFormStatus } from "react-dom";

/**
 * 서버 액션 폼 안에서 쓰는 버튼.
 * 누르면 바로 비활성화 + 문구가 바뀌어서 "눌렸는지/처리 중인지" 알 수 있음.
 */
export function PendingButton({
  children,
  pendingText,
  className = "",
}: {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-70 ${className}`}
    >
      {pending && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {pending ? pendingText : children}
    </button>
  );
}
