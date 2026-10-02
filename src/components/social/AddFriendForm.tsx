"use client";

import { useActionState } from "react";
import { addFriend, type FormState } from "@/app/social-actions";

export function AddFriendForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addFriend, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="code" className="font-display text-base">
        이웃 추가
      </label>
      <div className="flex gap-2">
        <input
          id="code"
          name="code"
          placeholder="친구 코드 (예: HAM-7K2QX)"
          autoCapitalize="characters"
          className="h-12 min-w-0 flex-1 rounded-2xl border-2 border-line bg-surface px-3.5 text-sm uppercase"
        />
        <button disabled={pending} className="h-12 shrink-0 rounded-2xl bg-primary px-4 font-display text-base text-on-primary disabled:opacity-60">
          추가
        </button>
      </div>
      {state?.error && <p className="text-sm text-fail">{state.error}</p>}
      {state?.ok && <p className="text-sm text-good">{state.ok}</p>}
    </form>
  );
}
