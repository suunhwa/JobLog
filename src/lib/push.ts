import "server-only";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { supabaseUrl } from "@/lib/supabase/env";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** 알림 설정이 다 돼 있는지 (안 돼 있으면 조용히 건너뜀) */
export function pushReady() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.SUPABASE_SECRET_KEY,
  );
}

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

/**
 * 관리자 권한 클라이언트 (서버에서만!). 다른 사람에게 알림을 보낼 때 그 사람의 구독 정보를 읽어야 해서 필요.
 * SUPABASE_SECRET_KEY 는 절대 NEXT_PUBLIC_ 을 붙이지 말 것.
 */
export function adminClient() {
  return createClient(supabaseUrl(), process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

/** 한 사용자의 모든 기기로 알림 보내기. 보낸 기기 수를 돌려줌 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!pushReady()) return 0;
  configure();
  const admin = adminClient();
  const { data } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  const subs = (data ?? []) as Sub[];

  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 12 },
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // 앱을 지웠거나 알림을 끈 기기 → 정리
        if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
      }
    }),
  );
  return sent;
}
