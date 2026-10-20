import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { HamsterRoom } from "@/components/mascot/HamsterRoom";
import { FURNITURE, progressInfo } from "@/lib/progress";
import { getUser } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/social";
import { ProfileForm } from "@/components/social/ProfileForm";
import { NotificationToggle } from "@/components/NotificationToggle";
import { signOut } from "@/app/actions";

export const metadata = { title: "햄스터 집 · 잡로그" };

export default async function HousePage() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const [{ count }, profile] = await Promise.all([
    supabase.from("applications").select("id", { count: "exact", head: true }),
    getMyProfile(supabase, user.id),
  ]);
  const p = progressInfo(count ?? 0);

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 pb-28 pt-6">
        <h1 className="font-display text-[26px]">햄스터 집</h1>

        <section className="relative flex flex-col items-center gap-2 rounded-[28px] bg-soft p-3 pb-5 text-center">
          {p.justStored && (
            <span className="absolute left-5 top-5 z-[1] rounded-full bg-[#FFD43B] px-3 py-1 font-display text-xs text-ink shadow">
              새 가구 도착!
            </span>
          )}
          <HamsterRoom count={p.count} className="w-full rounded-2xl" />
          <p className="font-display text-xl">
            {profile ? `${profile.hamster_name}의 집` : "햄스터 집"} · 해바라기씨 {p.count}개
          </p>
          <p className="text-sm text-muted">
            {p.next ? `${p.next.name}까지 ${p.remaining}개 남았어요` : "모든 가구를 모았어요!"}
          </p>
        </section>

        {profile && <ProfileForm nickname={profile.nickname} hamsterName={profile.hamster_name} />}

        <NotificationToggle hamsterName={profile?.hamster_name ?? "햄찌"} />

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-base">가구 모음</h2>
          {FURNITURE.map((f) => {
            const open = p.count >= f.at;
            return (
              <div key={f.at} className={`card flex items-center gap-3 px-4 py-3 ${open ? "" : "opacity-60"}`}>
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-2xl font-display text-sm ${
                    open ? "bg-good-bg text-good" : "bg-shadow text-muted"
                  }`}
                >
                  {f.at}
                </span>
                <span className="flex-1 text-[15px]">{open ? f.name : "???"}</span>
                <span className="text-xs text-muted">{open ? "획득" : `${f.at}개 달성 시`}</span>
              </div>
            );
          })}
        </section>

        <p className="text-center text-xs text-muted">
          가구 일러스트는 곧 추가될 예정이에요.
        </p>

        <form action={signOut} className="self-center">
          <button className="min-h-11 px-2 text-xs text-muted underline underline-offset-2">로그아웃</button>
        </form>
      </main>
      <BottomNav active="house" />
    </>
  );
}
