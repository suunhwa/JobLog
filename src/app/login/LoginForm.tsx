"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, null);

  if (state?.ok) {
    return (
      <p className="rounded-2xl bg-soft px-5 py-4 text-center text-sm">
        메일함을 확인해 주세요! 로그인 링크를 보냈어요.
      </p>
    );
  }

  return (
    <form action={action} className="flex w-full flex-col gap-3">
      <label htmlFor="email" className="font-display text-base">
        이메일
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="h-12 rounded-2xl border-2 border-line bg-white px-4 text-sm"
      />
      <button
        disabled={pending}
        className="h-12 rounded-2xl bg-primary font-display text-base text-on-primary disabled:opacity-60"
      >
        {pending ? "보내는 중..." : "로그인 링크 받기"}
      </button>
      {state?.error && <p className="text-sm text-fail">{state.error}</p>}
    </form>
  );
}
