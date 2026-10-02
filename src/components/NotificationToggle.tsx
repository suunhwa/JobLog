"use client";

import { useEffect, useState } from "react";
import { deleteSubscription, saveSubscription, sendTestPush } from "@/app/push-actions";

type State = "loading" | "unsupported" | "need-install" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function NotificationToggle({ hamsterName }: { hamsterName: string }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        // 아이폰은 홈 화면에 추가해야 알림 기능이 생김
        setState(isIOS() && !isStandalone() ? "need-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function turnOn() {
    setBusy(true);
    setMsg("");
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("서버 알림 설정이 아직 안 돼 있어요.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
      const res = await saveSubscription(JSON.parse(JSON.stringify(sub)));
      if (res.error) throw new Error(res.error);
      setState("on");
      setMsg("알림을 켰어요!");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "알림을 켜지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await deleteSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
      setMsg("알림을 껐어요.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    const res = await sendTestPush(hamsterName);
    setMsg(res.error ?? "테스트 알림을 보냈어요. 잠시 후 도착해요!");
    setBusy(false);
  }

  return (
    <section className="card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="font-display text-base">휴대폰 알림</h2>
          <p className="text-xs text-muted">마감 D-3 · D-1 · 당일 아침 9시, 이웃 방문 알림</p>
        </div>
        {state === "on" ? (
          <button onClick={turnOff} disabled={busy} className="h-10 shrink-0 rounded-xl border-2 border-line px-3 text-sm text-muted disabled:opacity-60">
            끄기
          </button>
        ) : state === "off" ? (
          <button onClick={turnOn} disabled={busy} className="h-10 shrink-0 rounded-xl bg-primary px-4 font-display text-sm text-on-primary disabled:opacity-60">
            {busy ? "켜는 중" : "알림 켜기"}
          </button>
        ) : null}
      </div>

      {state === "on" && (
        <button onClick={test} disabled={busy} className="self-start text-xs text-info underline underline-offset-2 disabled:opacity-60">
          테스트 알림 보내기
        </button>
      )}
      {state === "need-install" && (
        <p className="text-xs text-muted">
          아이폰은 사파리에서 <b>공유 → 홈 화면에 추가</b>한 다음, 홈 화면 앱에서 알림을 켤 수 있어요.
        </p>
      )}
      {state === "denied" && (
        <p className="text-xs text-muted">알림이 차단돼 있어요. 휴대폰 설정 → 알림에서 잡로그를 허용해 주세요.</p>
      )}
      {state === "unsupported" && <p className="text-xs text-muted">이 브라우저에서는 알림을 지원하지 않아요.</p>}
      {msg && <p className="text-xs text-good">{msg}</p>}
    </section>
  );
}
