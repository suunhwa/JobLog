import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HamsterRoom } from "@/components/mascot/HamsterRoom";
import { GiftForm } from "@/components/social/GiftForm";
import { progressInfo } from "@/lib/progress";
import { GIFTS, josa, type GiftKind, type NeighborStats } from "@/lib/social";
import { getUser } from "@/lib/supabase/server";
import { removeFriend } from "@/app/social-actions";

type Note = {
  id: string;
  from_id: string;
  kind: GiftKind;
  message: string | null;
  created_at: string;
  sender: { nickname: string } | null;
};

export default async function FriendHousePage({ params }: PageProps<"/friends/[id]">) {
  const { id } = await params;
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.rpc("neighbor_stats", { only_id: id });
  const friend = ((data ?? []) as NeighborStats[])[0];
  if (!friend) notFound();

  // 우리 둘 사이에 오간 선물 · 방명록
  const { data: notes } = await supabase
    .from("gifts")
    .select("id, from_id, kind, message, created_at, sender:profiles!gifts_from_id_fkey(nickname)")
    .or(`and(from_id.eq.${user.id},to_id.eq.${id}),and(from_id.eq.${id},to_id.eq.${user.id})`)
    .order("created_at", { ascending: false })
    .limit(8);
  const guestbook = (notes ?? []) as unknown as Note[];

  const p = progressInfo(friend.total);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 pb-12 pt-5">
      <div className="flex items-center gap-2">
        <Link href="/friends" aria-label="뒤로" className="flex size-11 items-center justify-center rounded-full bg-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-display text-lg">{friend.nickname}네 햄스터 집</span>
      </div>

      <section className="flex flex-col items-center gap-2 rounded-[28px] bg-soft p-3 pb-5 text-center">
        <HamsterRoom count={friend.total} className="w-full rounded-2xl" />
        <p className="font-display text-xl">{josa(friend.hamster_name, "이가", "가")} 반겨줘요!</p>
        <p className="text-sm text-muted">
          해바라기씨 {friend.total}개 · 가구 {p.unlocked.length}개
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="card py-3">
          <p className="font-display text-xl text-accent-ink">{friend.this_week}</p>
          <p className="text-[11px] text-muted">이번 주 지원</p>
        </div>
        <div className="card py-3">
          <p className="font-display text-xl text-good">{friend.doc_passed}</p>
          <p className="text-[11px] text-muted">서류 합격</p>
        </div>
        <div className="card py-3">
          <p className="font-display text-xl text-info">{friend.interviews}</p>
          <p className="text-[11px] text-muted">면접</p>
        </div>
      </section>

      {p.unlocked.length > 0 && (
        <p className="text-center text-xs text-muted">집에 있는 가구: {p.unlocked.map((f) => f.name).join(", ")}</p>
      )}

      <section className="card p-4">
        <GiftForm friendId={friend.id} />
      </section>

      {guestbook.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-base">방명록</h2>
          <div className="card flex flex-col gap-2 p-4">
            {guestbook.map((g) => (
              <p key={g.id} className="text-[13px] leading-relaxed">
                <b>{g.from_id === user.id ? "나" : g.sender?.nickname ?? friend.nickname}</b> · {GIFTS[g.kind]?.label}
                {g.message && <span className="text-muted"> “{g.message}”</span>}
              </p>
            ))}
          </div>
        </section>
      )}

      <form action={removeFriend.bind(null, friend.id)} className="self-center">
        <button className="min-h-11 px-2 text-xs text-muted underline underline-offset-2">이웃 끊기</button>
      </form>
    </main>
  );
}
