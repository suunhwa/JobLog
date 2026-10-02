"use client";

import { useActionState, useState } from "react";
import { addApplication, type AddState } from "./actions";

export function AddForm() {
  const [state, action, pending] = useActionState<AddState, FormData>(addApplication, null);
  const [mode, setMode] = useState<"url" | "text">("url");

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={mode} className="font-display text-base">
          새 공고 담기
        </label>
        <button
          type="button"
          onClick={() => setMode(mode === "url" ? "text" : "url")}
          className="min-h-11 px-1 text-xs text-info underline underline-offset-2"
        >
          {mode === "url" ? "링크가 안 되면 텍스트로 붙여넣기" : "링크로 넣기"}
        </button>
      </div>

      {mode === "url" ? (
        <div className="flex gap-2">
          <input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            placeholder="공고 링크를 붙여넣어 주세요"
            className="h-12 min-w-0 flex-1 rounded-2xl border-2 border-line bg-surface px-3.5 text-sm"
          />
          <button
            disabled={pending}
            className="h-12 shrink-0 rounded-2xl bg-primary px-4 font-display text-base text-on-primary disabled:opacity-60"
          >
            {pending ? "분석 중" : "분석"}
          </button>
        </div>
      ) : (
        <>
          <textarea
            id="text"
            name="text"
            rows={6}
            placeholder="공고 내용을 통째로 복사해서 붙여넣어 주세요"
            className="rounded-2xl border-2 border-line bg-surface p-3.5 text-sm"
          />
          <button
            disabled={pending}
            className="h-12 rounded-2xl bg-primary font-display text-base text-on-primary disabled:opacity-60"
          >
            {pending ? "분석 중..." : "분석해서 담기"}
          </button>
        </>
      )}

      {pending && <p className="text-xs text-muted">햄스터가 공고를 읽고 있어요. 10초 정도 걸려요.</p>}
      {state?.error && <p className="text-sm text-fail">{state.error}</p>}
    </form>
  );
}
