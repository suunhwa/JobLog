import type { PushPayload } from "@/lib/push";

export type DueApp = { id: string; user_id: string; company: string; deadline: string };

/** 한국 시간 기준 오늘 날짜 (YYYY-MM-DD) */
export function todayKST(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dday(deadline: string, today: string) {
  return Math.round((Date.parse(deadline + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86_400_000);
}

const NOTIFY_DAYS = new Set([3, 1, 0]);

/**
 * 사용자별로 오늘 보낼 마감 알림 1개씩 만들기.
 * 하루에 여러 공고가 걸리면 한 알림으로 묶음.
 */
export function buildDeadlineReminders(apps: DueApp[], today: string, hamsterOf: (userId: string) => string) {
  const byUser = new Map<string, { app: DueApp; d: number }[]>();
  for (const app of apps) {
    const d = dday(app.deadline, today);
    if (!NOTIFY_DAYS.has(d)) continue;
    const list = byUser.get(app.user_id) ?? [];
    list.push({ app, d });
    byUser.set(app.user_id, list);
  }

  const result: { userId: string; payload: PushPayload }[] = [];
  for (const [userId, list] of byUser) {
    list.sort((a, b) => a.d - b.d);
    const ham = hamsterOf(userId);
    const first = list[0];
    const label = (d: number) => (d === 0 ? "오늘 마감" : d === 1 ? "내일 마감" : `마감 ${d}일 전`);

    let body: string;
    if (list.length === 1) {
      body =
        first.d === 0
          ? `${first.app.company} 오늘 마감이에요! 놓치지 마세요`
          : first.d === 1
            ? `${first.app.company} 내일 마감이에요. 오늘 지원해볼까요?`
            : `${first.app.company} 마감 ${first.d}일 남았어요!`;
    } else {
      body = `${first.app.company}(${label(first.d)}) 외 ${list.length - 1}개 공고 마감이 다가와요`;
    }

    result.push({
      userId,
      payload: {
        title: `${ham}의 마감 알림`,
        body,
        url: list.length === 1 ? `/applications/${first.app.id}` : "/",
        tag: `deadline-${today}`,
      },
    });
  }
  return result;
}
