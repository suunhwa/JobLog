"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { GIFTS, getMyProfile, type GiftKind } from "@/lib/social";
import { sendPushToUser } from "@/lib/push";

export type FormState = { ok?: string; error?: string } | null;

/** 닉네임 · 햄스터 이름 저장 */
export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const nickname = String(formData.get("nickname") ?? "").trim();
  const hamster = String(formData.get("hamster_name") ?? "").trim();
  if (nickname.length < 1 || nickname.length > 12) return { error: "닉네임은 1~12자로 정해 주세요." };
  if (hamster.length < 1 || hamster.length > 10) return { error: "햄스터 이름은 1~10자로 정해 주세요." };

  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const { error } = await supabase
    .from("profiles")
    .update({ nickname, hamster_name: hamster })
    .eq("id", user.id);
  if (error) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/", "layout");
  return { ok: "저장했어요!" };
}

/** 친구 코드로 이웃 추가 */
export async function addFriend(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "친구 코드를 넣어 주세요." };

  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("add_friend", { code });
  if (error) return { error: error.message.replace(/^.*?: /, "") || "추가하지 못했어요." };

  revalidatePath("/friends");
  return { ok: `${data} 님과 이웃이 됐어요!` };
}

/** 친구 집에 선물 · 방명록 남기기 */
export async function sendGift(friendId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const kind = String(formData.get("kind") ?? "") as GiftKind;
  const message = String(formData.get("message") ?? "").trim().slice(0, 60) || null;
  if (!(kind in GIFTS)) return { error: "선물을 골라 주세요." };

  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("gifts").insert({ to_id: friendId, kind, message });
  if (error) return { error: "보내지 못했어요. 이웃이 맞는지 확인해 주세요." };

  // 친구 휴대폰에 방문 알림 (알림 설정이 안 돼 있으면 조용히 건너뜀)
  try {
    const me = await getMyProfile(supabase, user.id);
    await sendPushToUser(friendId, {
      title: "이웃이 놀러 왔어요!",
      body: `${me?.nickname ?? "이웃"} 님이 ${GIFTS[kind].verb}${message ? ` · “${message}”` : ""}`,
      url: "/friends",
      tag: "visit",
    });
  } catch {
    // 알림 실패해도 선물은 저장됨
  }

  revalidatePath(`/friends/${friendId}`);
  return { ok: `${GIFTS[kind].label} 두고 왔어요!` };
}

export async function removeFriend(friendId: string) {
  const { supabase } = await getUser();
  await supabase.rpc("remove_friend", { other: friendId });
  revalidatePath("/friends");
  redirect("/friends");
}
