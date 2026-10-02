import Link from "next/link";
import { redirect } from "next/navigation";
import { Hamster } from "@/components/mascot/Hamster";
import { BottomNav } from "@/components/BottomNav";
import { StatusChip } from "@/components/StatusChip";
import { StatCards } from "@/components/StatCards";
import { getUser } from "@/lib/supabase/server";
import { DEFAULT_PROFILE, getMyProfile, josa } from "@/lib/social";
import { cheekMessage, progressInfo } from "@/lib/progress";
import { daysLeft, stageIndex, type Application } from "@/lib/types";
import { AddForm } from "./AddForm";

export default async function Home() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const [{ data }, profile, { data: unseen }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, company, position, experience, deadline, stage, status, created_at")
      .order("created_at", { ascending: false }),
    getMyProfile(supabase, user.id),
    supabase
      .from("gifts")
      .select("id, sender:profiles!gifts_from_id_fkey(nickname)")
      .eq("to_id", user.id)
      .eq("seen", false)
      .limit(20),
  ]);
  const visitors = [
    ...new Set(((unseen ?? []) as unknown as { sender: { nickname: string } | null }[]).map((g) => g.sender?.nickname ?? "이웃")),
  ];
  const apps = (data ?? []) as Pick<
    Application,
    "id" | "company" | "position" | "experience" | "deadline" | "stage" | "status" | "created_at"
  >[];

  const progress = progressInfo(apps.length);
  const applied = apps.filter((a) => a.stage !== "planned").length;
  const docPassed = apps.filter((a) => stageIndex(a.stage) >= stageIndex("doc_passed")).length;
  const interviews = apps.filter((a) => stageIndex(a.stage) >= stageIndex("interview1")).length;

  const soon = apps
    .filter((a) => a.status === "active" && a.stage === "planned")
    .map((a) => ({ ...a, d: daysLeft(a.deadline) }))
    .filter((a): a is typeof a & { d: number } => a.d !== null && a.d >= 0 && a.d <= 7)
    .sort((a, b) => a.d - b.d);

  const name = profile?.nickname ?? user.email?.split("@")[0] ?? DEFAULT_PROFILE.nickname;
  const hamster = profile?.hamster_name ?? DEFAULT_PROFILE.hamster_name;

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 pb-28 pt-6">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-[26px]">잡로그</h1>
        </header>

        <section className="flex items-center gap-2 rounded-[28px] bg-soft py-3 pl-5 pr-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="font-display text-xl leading-snug">
              {name}님,
              <br />
              {progress.count === 0
                ? `${josa(hamster, "이랑", "랑")} 첫 공고 담아봐요!`
                : `${josa(hamster, "이가", "가")} 공고 ${progress.count}개 모았어요!`}
            </p>
            <p className="text-[13px] text-muted">{cheekMessage(progress.count)}</p>
            {progress.next && (
              <div className="mt-1 flex flex-col gap-1">
                <div className="h-2.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(progress.seedsInCheek / 10) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted">
                  {progress.next.name}까지 {progress.remaining}개
                </p>
              </div>
            )}
          </div>
          <Hamster cheek={progress.cheek} mood={progress.justStored ? "happy" : "normal"} seed size={92} />
        </section>

        {visitors.length > 0 && (
          <Link href="/friends" className="flex items-center gap-3 rounded-2xl border-2 border-[#F0D77A] bg-[#FFF8DC] px-4 py-3 active:opacity-70">
            <Hamster cheek={1} mood="happy" size={40} />
            <span className="flex-1 text-sm">
              <b>{visitors.slice(0, 2).join(", ")}</b>
              {visitors.length > 2 ? ` 외 ${visitors.length - 2}명이` : " 님이"} 놀러 왔다 갔어요!
            </span>
          </Link>
        )}

        <AddForm hamsterName={hamster} />

        <StatCards applied={applied} doc={docPassed} interview={interviews} />

        {soon.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-base">마감 임박</h2>
            {soon.map((a) => (
              <Link key={a.id} href={`/applications/${a.id}`} className="card flex items-center gap-3 px-3.5 py-3">
                <span
                  className={`rounded-lg px-2 py-1 font-display text-sm ${
                    a.d <= 1 ? "bg-fail-bg text-fail" : "bg-warn-bg text-warn"
                  }`}
                >
                  {a.d === 0 ? "D-DAY" : `D-${a.d}`}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-bold">{a.company}</span>
                  <span className="truncate text-xs text-muted">{a.position}</span>
                </div>
              </Link>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-base">내가 모은 공고</h2>
          {apps.length === 0 ? (
            <p className="card px-4 py-6 text-center text-sm text-muted">
              아직 담은 공고가 없어요. 위에 링크를 붙여넣어 보세요!
            </p>
          ) : (
            apps.map((a) => (
              <Link key={a.id} href={`/applications/${a.id}`} className="card flex items-center gap-3 px-3.5 py-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-info-bg font-display text-lg text-info">
                  {a.company.slice(0, 1)}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-bold">{a.company}</span>
                  <span className="truncate text-xs text-muted">
                    {[a.position, a.experience].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <StatusChip app={a} />
              </Link>
            ))
          )}
        </section>
      </main>
      <BottomNav active="home" />
    </>
  );
}
