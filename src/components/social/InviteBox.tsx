"use client";

import { useState } from "react";

export function InviteBox({ code }: { code: string }) {
  const [msg, setMsg] = useState("");

  async function share() {
    const url = `${window.location.origin}/invite/${code}`;
    const text = `잡로그에서 햄스터 이웃 하자! 친구 코드: ${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "잡로그 이웃 초대", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMsg("초대 링크를 복사했어요!");
    } catch {
      // 공유 창을 닫은 경우
    }
  }

  return (
    <div className="card flex flex-col gap-2 p-4">
      <span className="text-xs text-muted">내 친구 코드</span>
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-2xl tracking-wide">{code}</span>
        <button onClick={share} className="h-10 shrink-0 rounded-xl bg-soft px-3 text-sm active:opacity-60">
          친구 초대하기
        </button>
      </div>
      {msg && <span className="text-xs text-good">{msg}</span>}
    </div>
  );
}
