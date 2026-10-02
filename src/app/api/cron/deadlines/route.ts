import { NextResponse } from "next/server";
import { adminClient, pushReady, sendPushToUser } from "@/lib/push";
import { addDays, buildDeadlineReminders, todayKST, type DueApp } from "@/lib/reminders";

/**
 * 매일 아침(한국 9시 무렵) Vercel Cron 이 호출 → 마감 D-3 · D-1 · 당일 공고 알림.
 * vercel.json 의 crons 설정 참고. CRON_SECRET 으로 외부 호출 차단.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!pushReady()) return NextResponse.json({ skipped: "push env not set" });

  const admin = adminClient();
  const today = todayKST();

  // 아직 지원 안 한(지원 예정) 진행 중 공고 중 마감이 오늘~3일 후인 것
  const { data: apps, error } = await admin
    .from("applications")
    .select("id, user_id, company, deadline")
    .eq("status", "active")
    .eq("stage", "planned")
    .gte("deadline", today)
    .lte("deadline", addDays(today, 3));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const due = (apps ?? []) as DueApp[];
  const userIds = [...new Set(due.map((a) => a.user_id))];
  const names = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin.from("profiles").select("id, hamster_name").in("id", userIds);
    for (const p of profiles ?? []) names.set(p.id as string, p.hamster_name as string);
  }

  const reminders = buildDeadlineReminders(due, today, (id) => names.get(id) ?? "햄찌");
  let sent = 0;
  for (const r of reminders) sent += await sendPushToUser(r.userId, r.payload);

  return NextResponse.json({ today, users: reminders.length, sent });
}
