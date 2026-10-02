"use server";

import { getUser } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

type SubJSON = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

/** 이 기기의 알림 구독 저장 */
export async function saveSubscription(sub: SubJSON) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "로그인이 필요해요." };
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { error: "알림 정보가 올바르지 않아요." };

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      { onConflict: "endpoint" },
    );
  if (error) return { error: "알림을 켜지 못했어요. (supabase/04_push.sql 실행 여부 확인)" };
  return { ok: true };
}

export async function deleteSubscription(endpoint: string) {
  const { supabase, user } = await getUser();
  if (!user) return;
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

/** 알림이 잘 오는지 테스트 */
export async function sendTestPush(hamsterName: string) {
  const { user } = await getUser();
  if (!user) return { error: "로그인이 필요해요." };
  const n = await sendPushToUser(user.id, {
    title: "잡로그",
    body: `${hamsterName}: 알림이 잘 와요! 마감이 다가오면 알려줄게요`,
    url: "/house",
    tag: "test",
  });
  return n > 0 ? { ok: true } : { error: "보낼 기기를 찾지 못했어요. 서버 알림 설정(환경변수)을 확인해 주세요." };
}
