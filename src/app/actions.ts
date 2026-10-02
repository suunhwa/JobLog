"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { fetchPosting, parseJobPosting } from "@/lib/parse-job";
import { buildSteps, DEFAULT_PROCESS, resolveSteps, stageForStep } from "@/lib/steps";
import { detectChannel } from "@/lib/channel";

export type AddState = { error?: string } | null;

/** 링크(또는 붙여넣은 텍스트)로 공고를 분석해서 저장 */
export async function addApplication(_prev: AddState, formData: FormData): Promise<AddState> {
  const url = String(formData.get("url") ?? "").trim();
  const pasted = String(formData.get("text") ?? "").trim();

  if (!url && !pasted) return { error: "공고 링크나 내용을 넣어 주세요." };
  if (url && !/^https?:\/\//i.test(url)) return { error: "http(s):// 로 시작하는 링크를 넣어 주세요." };

  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  let id: string;
  try {
    const posting = pasted ? { text: pasted, images: [] } : await fetchPosting(url);
    const text = posting.text;
    const job = await parseJobPosting(text, url || undefined, posting.images);

    const { data, error } = await supabase
      .from("applications")
      .insert({
        ...job,
        source_url: url || null,
        channel: url ? detectChannel(url) : "기타",
        steps: buildSteps(job.process),
        step: 0,
        raw_text: text.slice(0, 20_000),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    id = data.id;

    await supabase.from("stage_events").insert({ application_id: id, stage: "planned", status: "active" });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "알 수 없는 오류가 났어요." };
  }

  revalidatePath("/");
  redirect(`/applications/${id}?new=1`);
}

async function logEvent(applicationId: string, stage: string, status: string) {
  const { supabase } = await getUser();
  await supabase.from("stage_events").insert({ application_id: applicationId, stage, status });
}

/** 공고의 현재 단계 정보 읽기 */
async function loadSteps(id: string) {
  const { supabase } = await getUser();
  const { data } = await supabase
    .from("applications")
    .select("stage, status, steps, step, process")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { ...resolveSteps(data as Parameters<typeof resolveSteps>[0]), status: data.status as string };
}

/** 단계 이동 (stage·status 도 같이 맞춤) */
async function moveTo(id: string, steps: string[], idx: number, extra: Record<string, unknown> = {}) {
  const i = Math.min(Math.max(idx, 0), steps.length - 1);
  const stage = stageForStep(steps, i);
  const status = i === steps.length - 1 ? "passed" : "active";
  const { supabase } = await getUser();
  await supabase.from("applications").update({ steps, step: i, stage, status, ...extra }).eq("id", id);
  await logEvent(id, steps[i], status);
  revalidatePath(`/applications/${id}`);
  revalidatePath("/");
}

/** 다음 단계 통과 */
export async function passStep(id: string) {
  const cur = await loadSteps(id);
  if (!cur) return;
  await moveTo(id, cur.steps, cur.step + 1);
}

/** 단계 직접 선택 */
export async function setStepFromForm(id: string, formData: FormData) {
  const cur = await loadSteps(id);
  if (!cur) return;
  await moveTo(id, cur.steps, Number(formData.get("step")));
}

/** 전형 단계 직접 수정 (쉼표나 줄바꿈으로 구분) */
export async function saveSteps(id: string, formData: FormData) {
  const cur = await loadSteps(id);
  if (!cur) return;
  const middle = String(formData.get("steps") ?? "")
    .split(/[,\n>→]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 8);
  const steps = ["지원 예정", ...(middle.length > 0 ? middle : DEFAULT_PROCESS), "최종 합격"];

  // 지금 있던 단계 이름이 새 목록에도 있으면 거기로, 아니면 비슷한 위치로
  const label = cur.steps[cur.step];
  let idx = steps.indexOf(label);
  if (idx < 0) idx = cur.step >= cur.steps.length - 1 ? steps.length - 1 : Math.min(cur.step, steps.length - 2);
  await moveTo(id, steps, idx, cur.status === "failed" ? { steps_custom: true, status: "failed" } : { steps_custom: true });
}

/** 현재 단계에서 불합격 처리 */
export async function markFailed(id: string) {
  const cur = await loadSteps(id);
  const { supabase } = await getUser();
  await supabase.from("applications").update({ status: "failed" }).eq("id", id);
  await logEvent(id, cur ? cur.steps[cur.step] : "?", "failed");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/");
}

export async function reopen(id: string) {
  const cur = await loadSteps(id);
  const { supabase } = await getUser();
  await supabase.from("applications").update({ status: "active" }).eq("id", id);
  await logEvent(id, cur ? cur.steps[cur.step] : "?", "active");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/");
}

export async function saveMemo(id: string, formData: FormData) {
  const memo = String(formData.get("memo") ?? "").slice(0, 2000);
  const { supabase } = await getUser();
  await supabase.from("applications").update({ memo }).eq("id", id);
  revalidatePath(`/applications/${id}`);
}

export async function deleteApplication(id: string) {
  const { supabase } = await getUser();
  await supabase.from("applications").delete().eq("id", id);
  revalidatePath("/");
  redirect("/");
}

export async function signOut() {
  const { supabase } = await getUser();
  await supabase.auth.signOut();
  redirect("/login");
}

/** 저장된 공고를 AI로 다시 분석 (진행 단계·메모는 그대로) */
export async function reanalyze(id: string) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const { data: app } = await supabase
    .from("applications")
    .select("source_url, raw_text, stage, steps, step, process, steps_custom")
    .eq("id", id)
    .maybeSingle();
  if (!app) redirect("/");

  let ok = true;
  try {
    let posting = { text: app.raw_text ?? "", images: [] as Awaited<ReturnType<typeof fetchPosting>>["images"] };
    if (app.source_url) {
      try {
        posting = await fetchPosting(app.source_url);
      } catch {
        // 링크를 못 읽으면 저장해둔 원문으로
      }
    }
    if (!posting.text && posting.images.length === 0) throw new Error("원문이 없어요");
    const job = await parseJobPosting(posting.text, app.source_url ?? undefined, posting.images);
    // 전형 단계: 직접 수정한 적 없으면 새로 읽은 절차로 다시 만들고, 진행 상황은 유지
    let stepFields = {};
    if (!app.steps_custom) {
      const steps = buildSteps(job.process);
      const label = resolveSteps(app as Parameters<typeof resolveSteps>[0]);
      const keep = steps.indexOf(label.steps[label.step]);
      const step = keep >= 0 ? keep : Math.min(label.step, steps.length - 1);
      stepFields = { steps, step, stage: stageForStep(steps, step) };
    }
    const { error } = await supabase
      .from("applications")
      .update({ ...job, ...stepFields, raw_text: posting.text.slice(0, 20_000) })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } catch {
    ok = false;
  }

  revalidatePath(`/applications/${id}`);
  redirect(ok ? `/applications/${id}?reok=1` : `/applications/${id}?reerr=1`);
}

/** 지원 경로 직접 바꾸기 */
export async function setChannel(id: string, channel: string) {
  const value = channel.trim().slice(0, 20);
  if (!value) return;
  const { supabase } = await getUser();
  await supabase.from("applications").update({ channel: value }).eq("id", id);
  revalidatePath(`/applications/${id}`);
}
