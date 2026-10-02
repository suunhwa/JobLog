"use client";

import { useActionState, useState } from "react";
import { sendGift, type FormState } from "@/app/social-actions";
import { GIFTS, type GiftKind } from "@/lib/social";

const STYLE: Record<GiftKind, string> = {
  seed: "border-[#F0D77A] bg-[#FFF8DC]",
  pat: "border-[#F5B3C0] bg-[#FFEEF1]",
  cheer: "border-[#F5C99B] bg-[#FFF1E3]",
};

function GiftIcon({ kind }: { kind: GiftKind }) {
  if (kind === "seed")
    return (
      <svg width="18" height="24" viewBox="0 0 12 16" aria-hidden="true">
        <ellipse cx="6" cy="8" rx="5" ry="7.5" fill="#5A4636" />
        <path d="M6 1.5v13" stroke="#EDE3D0" strokeWidth="1.2" />
      </svg>
    );
  if (kind === "pat")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#F49BB0" stroke="#A8385A" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      </svg>
    );
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFD43B" stroke="#7D6200" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z" />
    </svg>
  );
}

export function GiftForm({ friendId }: { friendId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendGift.bind(null, friendId), null);
  const [kind, setKind] = useState<GiftKind>("seed");

  return (
    <form action={action} className="flex flex-col gap-3">
      <span className="font-display text-base">선물 두고 오기</span>
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(GIFTS) as GiftKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`flex h-[74px] flex-col items-center justify-center gap-1 rounded-2xl border-2 text-xs transition ${STYLE[k]} ${
              kind === k ? "ring-2 ring-[#5A4030] ring-offset-2 ring-offset-bg" : "opacity-80"
            }`}
          >
            <GiftIcon kind={k} />
            {GIFTS[k].label}
          </button>
        ))}
      </div>
      <label htmlFor="message" className="sr-only">
        방명록 한 줄
      </label>
      <input
        id="message"
        name="message"
        maxLength={60}
        placeholder="방명록 한 줄 (선택)"
        className="h-11 rounded-xl border-2 border-line bg-surface px-3 text-sm"
      />
      <button disabled={pending} className="h-12 rounded-2xl bg-primary font-display text-base text-on-primary disabled:opacity-60">
        {pending ? "두고 오는 중..." : "두고 오기"}
      </button>
      {state?.error && <p className="text-sm text-fail">{state.error}</p>}
      {state?.ok && <p className="text-sm text-good">{state.ok}</p>}
    </form>
  );
}
