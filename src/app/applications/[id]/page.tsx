import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Hamster } from "@/components/mascot/Hamster";
import { StatusChip } from "@/components/StatusChip";
import { PendingButton } from "@/components/PendingButton";
import { getUser } from "@/lib/supabase/server";
import { DEFAULT_PROFILE, getMyProfile, josa } from "@/lib/social";
import { cheekLevel } from "@/lib/progress";
import { STAGES, daysLeft, stageIndex, stageLabel, type Application } from "@/lib/types";
import {
  deleteApplication,
  reanalyze,
  markFailed,
  passStage,
  reopen,
  saveMemo,
  setStageFromForm,
} from "@/app/actions";

export default async function ApplicationPage({ params, searchParams }: PageProps<"/applications/[id]">) {
  const { id } = await params;
  const { new: isNew, reerr, reok } = await searchParams;

  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const app = data as Application;

  const [{ count }, profile] = await Promise.all([
    supabase.from("applications").select("id", { count: "exact", head: true }),
    getMyProfile(supabase, user.id),
  ]);
  const hamster = profile?.hamster_name ?? DEFAULT_PROFILE.hamster_name;
  const total = count ?? 0;

  const current = stageIndex(app.stage);
  const failed = app.status === "failed";
  const done = app.stage === "offer";
  const d = daysLeft(app.deadline);

  const reaction = isNew
    ? { title: `${josa(hamster, "이가", "가")} 해바라기씨 하나 냠!`, body: total % 10 === 0 ? "볼이 꽉 차서 집에 저장했어요. 새 가구 확인해 봐요!" : `볼 속 씨앗 ${total % 10}개째예요.` }
    : failed
      ? { title: "괜찮아, 토닥토닥", body: "어떤 결과든 경험은 남으니까요. 다음 공고로 가봐요." }
      : done
        ? { title: "최종 합격 축하해요!", body: `${josa(hamster, "이가", "가")} 정장 입고 출근 준비 중이에요.` }
        : current >= stageIndex("doc_passed")
          ? { title: `${stageLabel(app.stage)}까지 왔어요!`, body: "다음 전형도 같이 준비해봐요." }
          : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 pb-12 pt-5">
      <div className="flex items-center gap-2">
        <Link href="/" aria-label="뒤로" className="flex size-11 items-center justify-center rounded-full bg-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-display text-lg">공고 상세</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <StatusChip app={app} />
        <h1 className="font-display text-[28px] leading-tight">{app.company}</h1>
        {app.position && <p className="text-[15px] text-muted">{app.position}</p>}
      </div>

      {reaction && (
        <div className="flex items-center gap-3 rounded-3xl bg-soft px-4 py-2">
          <Hamster
            cheek={isNew ? cheekLevel(total) : 1}
            mood={failed ? "normal" : "happy"}
            seed
            size={76}
          />
          <div className="flex flex-col">
            <span className="font-display text-base">{reaction.title}</span>
            <span className="text-[13px] text-muted">{reaction.body}</span>
          </div>
        </div>
      )}

      <section className="card flex flex-col gap-3.5 p-4">
        <h2 className="font-display text-base">전형 진행</h2>
        <ol className="flex items-start">
          {STAGES.map((s, i) => {
            const passed = i < current || (i === current && done);
            const here = i === current && !done;
            return (
              <li key={s.key} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full items-center">
                  <div className={`h-[3px] flex-1 ${i === 0 ? "invisible" : i <= current ? "bg-good" : "bg-line"}`} />
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                      here && failed
                        ? "bg-fail"
                        : passed
                          ? "bg-good"
                          : here
                            ? "border-[3px] border-primary bg-soft"
                            : "bg-shadow"
                    }`}
                  >
                    {passed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    )}
                  </div>
                  <div className={`h-[3px] flex-1 ${i === STAGES.length - 1 ? "invisible" : i < current ? "bg-good" : "bg-line"}`} />
                </div>
                <span className={`text-center text-[10px] leading-tight ${here ? "font-bold text-accent-ink" : "text-muted"}`}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>

        {failed ? (
          <form action={reopen.bind(null, app.id, app.stage)}>
            <PendingButton pendingText="되돌리는 중..." className="h-11 w-full rounded-2xl border-2 border-line font-display text-[15px] text-muted">
              불합격 취소 (다시 진행 중으로)
            </PendingButton>
          </form>
        ) : (
          !done && (
            <div className="flex gap-2">
              <form action={passStage.bind(null, app.id, app.stage)} className="flex-1">
                <PendingButton pendingText="기록 중..." className="h-11 w-full rounded-2xl bg-primary font-display text-[15px] text-on-primary">
                  {app.stage === "planned" ? "지원 완료!" : "다음 단계 통과"}
                </PendingButton>
              </form>
              <form action={markFailed.bind(null, app.id, app.stage)}>
                <PendingButton pendingText="기록 중" className="h-11 rounded-2xl border-2 border-line px-4 font-display text-[15px] text-muted">
                  불합격 기록
                </PendingButton>
              </form>
            </div>
          )
        )}

        <form action={setStageFromForm.bind(null, app.id)} className="flex items-center gap-2 text-sm">
          <label htmlFor="stage" className="shrink-0 text-muted">
            단계 직접 선택
          </label>
          <select id="stage" name="stage" defaultValue={app.stage} className="h-10 min-w-0 flex-1 rounded-xl border-2 border-line bg-surface px-2">
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <PendingButton pendingText="변경 중" className="h-10 rounded-xl bg-soft px-3">변경</PendingButton>
        </form>
      </section>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="font-display text-base">AI 공고 분석</h2>
        <div className="grid grid-cols-2 gap-2">
          <Field label="경력" value={app.experience} />
          <Field label="고용형태" value={app.employment_type} />
          <Field label="근무지" value={app.location} />
          <Field
            label="마감일"
            value={app.deadline ? `${app.deadline}${d !== null && d >= 0 ? ` (D-${d})` : ""}` : "상시/미기재"}
          />
        </div>
        {app.summary && <p className="text-[13px] leading-relaxed">{app.summary}</p>}
        <List title="주요 업무" items={app.duties ?? []} />
        <List title="자격요건" items={app.requirements} />
        {app.preferred.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[13px] font-bold">우대사항</h3>
            <div className="flex flex-wrap gap-1.5">
              {app.preferred.map((p) => (
                <span key={p} className="rounded-lg bg-info-bg px-2.5 py-1 text-xs text-info">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
        {app.process.length > 0 && (
          <p className="text-xs text-muted">전형 절차: {app.process.join(" → ")}</p>
        )}
        <form action={reanalyze.bind(null, app.id)}>
          <PendingButton
            pendingText="햄스터가 공고를 다시 읽는 중... (10~20초)"
            className="h-10 w-full rounded-xl border-2 border-line text-sm text-muted"
          >
            AI로 다시 분석하기
          </PendingButton>
        </form>
        {reerr && <p className="text-xs text-fail">다시 분석하지 못했어요. 잠시 후 다시 시도해 주세요.</p>}
        {reok && <p className="text-xs text-good">다시 분석했어요! 위 내용이 새로 바뀌었어요.</p>}
        {app.source_url && (
          <a href={app.source_url} target="_blank" rel="noreferrer" className="text-sm text-info underline underline-offset-2">
            원문 공고 보기
          </a>
        )}
      </section>

      <form action={saveMemo.bind(null, app.id)} className="card flex flex-col gap-2 p-4">
        <label htmlFor="memo" className="font-display text-base">
          메모
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={4}
          defaultValue={app.memo}
          placeholder="면접 일정, 느낀 점, 떨어진 이유 등을 적어두세요"
          className="rounded-xl border-2 border-line bg-bg p-3 text-[13px]"
        />
        <PendingButton pendingText="저장 중" className="h-10 self-end rounded-xl bg-soft px-4 text-sm">메모 저장</PendingButton>
      </form>

      <form action={deleteApplication.bind(null, app.id)} className="self-center">
        <PendingButton pendingText="삭제 중" className="min-h-11 px-2 text-xs text-muted underline underline-offset-2">이 공고 삭제</PendingButton>
      </form>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-bg px-3 py-2.5">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-sm font-bold">{value ?? "-"}</span>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-[13px] font-bold">{title}</h3>
      {items.length === 0 && <p className="text-xs text-muted">공고에서 찾지 못했어요. 아래 &apos;다시 분석하기&apos;를 눌러 보세요.</p>}
      <ul className="flex flex-col gap-1">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-[13px] leading-relaxed">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
