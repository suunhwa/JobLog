"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { fetchPosting, parseJobPosting } from "@/lib/parse-job";
import { STAGES, type StageKey } from "@/lib/types";

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
      .insert({ ...job, source_url: url || null, raw_text: text.slice(0, 20_000) })
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

export async function setStage(id: string, stage: StageKey) {
  if (!STAGES.some((s) => s.key === stage)) return;
  const { supabase } = await getUser();
  const status = stage === "offer" ? "passed" : "active";
  await supabase.from("applications").update({ stage, status }).eq("id", id);
  await logEvent(id, stage, status);
  revalidatePath(`/applications/${id}`);
  revalidatePath("/");
}

export async function setStageFromForm(id: string, formData: FormData) {
  await setStage(id, String(formData.get("stage")) as StageKey);
}

/** 현재 단계에서 다음 단계로 */
export async function passStage(id: string, current: StageKey) {
  const idx = STAGES.findIndex((s) => s.key === current);
  const next = STAGES[Math.min(idx + 1, STAGES.length - 1)].key;
  await setStage(id, next);
}

/** 현재 단계에서 불합격 처리 */
export async function markFailed(id: string, current: StageKey) {
  const { supabase } = await getUser();
  await supabase.from("applications").update({ status: "failed" }).eq("id", id);
  await logEvent(id, current, "failed");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/");
}

export async function reopen(id: string, current: StageKey) {
  const { supabase } = await getUser();
  await supabase.from("applications").update({ status: "active" }).eq("id", id);
  await logEvent(id, current, "active");
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
    .select("source_url, raw_text")
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
    const { error } = await supabase
      .from("applications")
      .update({ ...job, raw_text: posting.text.slice(0, 20_000) })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } catch {
    ok = false;
  }

  revalidatePath(`/applications/${id}`);
  redirect(ok ? `/applications/${id}?reok=1` : `/applications/${id}?reerr=1`);
}
