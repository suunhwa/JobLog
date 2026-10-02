import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  nickname: string;
  hamster_name: string;
  friend_code: string;
};

export type NeighborStats = {
  id: string;
  nickname: string;
  hamster_name: string;
  total: number;
  doc_passed: number;
  interviews: number;
  this_week: number;
};

export const GIFTS = {
  seed: { label: "해바라기씨", verb: "해바라기씨를 줬어요" },
  pat: { label: "토닥토닥", verb: "토닥토닥 해줬어요" },
  cheer: { label: "화이팅", verb: "화이팅을 보냈어요" },
} as const;
export type GiftKind = keyof typeof GIFTS;

export const DEFAULT_PROFILE = { nickname: "취준생", hamster_name: "햄찌" };

/** 내 프로필. 02_friends.sql 을 아직 안 돌렸으면 null */
export async function getMyProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, hamster_name, friend_code")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

/** 받침 여부에 따라 이/가, 은/는 같은 조사 붙이기 */
export function josa(word: string, withBatchim: string, without: string) {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return word + without;
  return word + ((last - 0xac00) % 28 !== 0 ? withBatchim : without);
}
