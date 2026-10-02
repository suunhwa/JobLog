import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Hamster } from "@/components/mascot/Hamster";
import { AddFriendForm } from "@/components/social/AddFriendForm";
import { InviteBox } from "@/components/social/InviteBox";
import { cheekLevel, progressInfo } from "@/lib/progress";
import { GIFTS, getMyProfile, type GiftKind, type NeighborStats } from "@/lib/social";
import { getUser } from "@/lib/supabase/server";

export const metadata = { title: "이웃 · 잡로그" };

type ReceivedGift = {
  id: string;
  kind: GiftKind;
  message: string | null;
  created_at: string;
  sender: { nickname: string } | null;
};

export default async function FriendsPage({ searchParams }: PageProps<"/friends">) {
  const { added } = await searchParams;
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const profile = await getMyProfile(supabase, user.id);
  if (!profile) {
    return (
      <>
        <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 pb-28 pt-6">
          <h1 className="font-display text-[26px]">햄스터 이웃</h1>
          <p className="card p-4 text-sm text-muted">
            이웃 기능 준비 중이에요. (Supabase 에서 supabase/02_friends.sql 을 실행해 주세요)
          </p>
        </main>
        <BottomNav active="friends" />
      </>
    );
  }

  const [{ data: neighbors }, { data: gifts }] = await Promise.all([
    supabase.rpc("neighbor_stats"),
    supabase
      .from("gifts")
      .select("id, kind, message, created_at, sender:profiles!gifts_from_id_fkey(nickname)")
      .eq("to_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const list = (neighbors ?? []) as NeighborStats[];
  const received = (gifts ?? []) as unknown as ReceivedGift[];

  // 이웃 화면을 열었으면 받은 선물은 확인한 걸로 처리
  await supabase.from("gifts").update({ seen: true }).eq("to_id", user.id).eq("seen", false);

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 pb-28 pt-6">
        <h1 className="font-display text-[26px]">햄스터 이웃</h1>

        {typeof added === "string" && (
          <p className="rounded-2xl bg-good-bg px-4 py-3 text-sm text-good">{added} 님과 이웃이 됐어요!</p>
        )}

        <InviteBox code={profile.friend_code} />
        <AddFriendForm />

        {received.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-base">우리 집에 놀러 온 이웃</h2>
            <div className="card flex flex-col gap-2 p-4">
              {received.map((g) => (
                <p key={g.id} className="text-[13px] leading-relaxed">
                  <b>{g.sender?.nickname ?? "이웃"}</b> 님이 {GIFTS[g.kind]?.verb ?? "다녀갔어요"}
                  {g.message && <span className="text-muted"> · “{g.message}”</span>}
                </p>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-base">이웃 {list.length}명</h2>
          {list.length === 0 ? (
            <p className="card px-4 py-6 text-center text-sm text-muted">
              아직 이웃이 없어요. 친구 코드를 보내서 초대해 보세요!
            </p>
          ) : (
            list.map((n) => (
              <Link key={n.id} href={`/friends/${n.id}`} className="card flex items-center gap-3 px-3.5 py-3 active:opacity-70">
                <Hamster cheek={cheekLevel(n.total)} size={44} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-bold">{n.nickname}</span>
                  <span className="truncate text-xs text-muted">
                    {n.hamster_name} · 가구 {progressInfo(n.total).unlocked.length}개 · 이번 주 {n.this_week}개
                  </span>
                </div>
                <span className="shrink-0 rounded-xl bg-warn-bg px-2 py-1 text-xs text-warn">놀러가기</span>
              </Link>
            ))
          )}
        </section>
      </main>
      <BottomNav active="friends" />
    </>
  );
}
