"use client";

import { useActionState } from "react";
import { updateProfile, type FormState } from "@/app/social-actions";

export function ProfileForm({ nickname, hamsterName }: { nickname: string; hamsterName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, null);

  return (
    <form action={action} className="card flex flex-col gap-3 p-4">
      <h2 className="font-display text-base">이름 정하기</h2>
      <div className="flex flex-col gap-1">
        <label htmlFor="nickname" className="text-xs text-muted">
          내 닉네임 (이웃에게 보여요)
        </label>
        <input
          id="nickname"
          name="nickname"
          defaultValue={nickname}
          maxLength={12}
          required
          className="h-11 rounded-xl border-2 border-line bg-bg px-3 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="hamster_name" className="text-xs text-muted">
          햄스터 이름
        </label>
        <input
          id="hamster_name"
          name="hamster_name"
          defaultValue={hamsterName}
          maxLength={10}
          required
          className="h-11 rounded-xl border-2 border-line bg-bg px-3 text-sm"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm ${state?.error ? "text-fail" : "text-good"}`}>{state?.error ?? state?.ok}</span>
        <button disabled={pending} className="h-10 rounded-xl bg-primary px-4 font-display text-sm text-on-primary disabled:opacity-60">
          {pending ? "저장 중" : "저장"}
        </button>
      </div>
    </form>
  );
}
