"use client";

import { useTransition } from "react";
import { setChannel } from "@/app/actions";
import { CHANNELS } from "@/lib/channel";

/** 상세 화면의 "지원 경로" 칸. 바꾸면 바로 저장 */
export function ChannelSelect({ id, value }: { id: string; value: string }) {
  const [pending, start] = useTransition();
  const options = (CHANNELS as readonly string[]).includes(value) ? CHANNELS : [value, ...CHANNELS];

  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-bg px-3 py-2.5">
      <label htmlFor="channel" className="text-[11px] text-muted">
        지원 경로{pending ? " · 저장 중" : ""}
      </label>
      <select
        id="channel"
        defaultValue={value}
        disabled={pending}
        onChange={(e) => {
          const v = e.target.value;
          start(() => setChannel(id, v));
        }}
        className="-ml-1 bg-transparent text-sm font-bold"
      >
        {options.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
