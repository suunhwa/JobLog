/** 지원 경로 (채용 사이트) */
export const CHANNELS = [
  "사람인",
  "잡코리아",
  "원티드",
  "점핏",
  "프로그래머스",
  "로켓펀치",
  "인크루트",
  "캐치",
  "링크드인",
  "회사 홈페이지",
  "지인 추천",
  "기타",
] as const;

const HOSTS: [RegExp, string][] = [
  [/jobkorea\.co\.kr$/, "잡코리아"],
  [/wanted\.co\.kr$/, "원티드"],
  [/jumpit\.(saramin\.)?co\.kr$/, "점핏"],
  [/saramin\.co\.kr$/, "사람인"],
  [/programmers\.co\.kr$/, "프로그래머스"],
  [/rocketpunch\.com$/, "로켓펀치"],
  [/incruit\.com$/, "인크루트"],
  [/catch\.co\.kr$/, "캐치"],
  [/linkedin\.com$/, "링크드인"],
];

/** 공고 링크 주소로 지원 경로 추측. 모르는 사이트는 회사 홈페이지로 */
export function detectChannel(url: string | null | undefined): string {
  if (!url) return "기타";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const [re, name] of HOSTS) if (re.test(host)) return name;
    return "회사 홈페이지";
  } catch {
    return "기타";
  }
}
