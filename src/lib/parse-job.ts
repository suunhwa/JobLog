import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/** AI가 공고에서 뽑아낼 항목 */
const optText = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v.trim() : null));
const textList = z
  .array(z.string())
  .nullish()
  .transform((v) => (v ?? []).map((s) => s.trim()).filter(Boolean));

export const ParsedJob = z.object({
  company: z.string().min(1),
  position: optText,
  experience: optText,
  employment_type: optText,
  location: optText,
  // 형식이 이상하면 버림
  deadline: optText.transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)),
  duties: textList,
  requirements: textList,
  preferred: textList,
  process: textList,
  summary: optText,
});
export type ParsedJob = z.infer<typeof ParsedJob>;

const MAX_CHARS = 30_000;
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 4_000_000;
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

export type PostingImage = { mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string };
export type Posting = { text: string; images: PostingImage[] };

/** HTML → 읽을 수 있는 텍스트 */
function htmlToText(html: string) {
  return html
    .replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>(?!\n)/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|dd|dt)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function metaContent(html: string, prop: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
  return html.match(re)?.[1] ?? "";
}

/** 본문 이미지 주소 (로고·아이콘 등은 제외) */
function imageUrls(html: string, base: string) {
  const urls: string[] = [];
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    const src = m[1];
    if (src.startsWith("data:")) continue;
    if (/logo|icon|btn|button|blank|spacer|banner|sprite|common|badge/i.test(src)) continue;
    try {
      urls.push(new URL(src, base).toString());
    } catch {
      // 무시
    }
  }
  return [...new Set(urls)].slice(0, MAX_IMAGES);
}

async function getHtml(url: string, referer?: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
      ...(referer ? { Referer: referer } : {}),
    },
    cache: "no-store",
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`공고 페이지를 불러오지 못했어요 (${res.status})`);
  return res.text();
}

async function downloadImage(url: string, referer: string): Promise<PostingImage | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Referer: referer }, cache: "no-store" });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 15_000 || buf.length > MAX_IMAGE_BYTES) return null; // 너무 작으면 아이콘
    return { mimeType: type as PostingImage["mimeType"], data: buf.toString("base64") };
  } catch {
    return null;
  }
}

/** 사이트별로 실제 공고 본문이 있는 주소를 추가로 알려줌 */
function detailUrls(url: string): string[] {
  const u = new URL(url);
  // 사람인: 본문이 iframe(view-detail) 안에 있음
  if (u.hostname.endsWith("saramin.co.kr")) {
    const rec = u.searchParams.get("rec_idx");
    if (rec) return [`https://www.saramin.co.kr/zf_user/jobs/relay/view-detail?rec_idx=${rec}&rec_seq=0`];
  }
  return [];
}

/** Jina Reader (JINA_API_KEY 가 있을 때만 사용) */
async function fetchViaJina(url: string) {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      Accept: "text/plain",
      "X-With-Generated-Alt": "true",
      Authorization: `Bearer ${process.env.JINA_API_KEY}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Jina ${res.status}`);
  return res.text();
}

/**
 * 공고 페이지를 가져와서 텍스트(+ 이미지 공고면 이미지)로 정리.
 * 1) 페이지를 직접 읽음 (사람인처럼 본문이 iframe 에 있으면 그것도 읽음)
 * 2) 글자가 거의 없으면 본문 이미지를 AI에게 같이 보냄
 * 3) JINA_API_KEY 가 있으면 Jina Reader 도 시도
 */
export async function fetchPosting(url: string): Promise<Posting> {
  const parts: string[] = [];
  const pages: { html: string; base: string }[] = [];
  let lastError: unknown = null;

  for (const target of [url, ...detailUrls(url)]) {
    try {
      const html = await getHtml(target, url);
      pages.push({ html, base: target });
      const title = metaContent(html, "og:title");
      const desc = metaContent(html, "og:description");
      if (title || desc) parts.push([title, desc].filter(Boolean).join("\n"));
      parts.push(htmlToText(html));
    } catch (e) {
      lastError = e;
    }
  }

  let text = parts.join("\n\n").trim();

  if (text.length < 300 && process.env.JINA_API_KEY) {
    try {
      text = (await fetchViaJina(url)).trim();
    } catch (e) {
      lastError = e;
    }
  }

  // 글자가 적으면 이미지 공고로 보고 이미지도 같이 보냄
  let images: PostingImage[] = [];
  if (text.length < 800 && pages.length > 0) {
    const detail = pages[pages.length - 1];
    const urls = imageUrls(detail.html, detail.base);
    images = (await Promise.all(urls.map((u) => downloadImage(u, url)))).filter(
      (x): x is PostingImage => x !== null,
    );
  }

  if (text.length < 50 && images.length === 0) {
    if (lastError instanceof Error && /\(\d{3}\)/.test(lastError.message)) throw lastError;
    throw new Error("공고 내용을 읽지 못했어요. '텍스트로 붙여넣기'로 넣어 주세요.");
  }

  return { text: text.slice(0, MAX_CHARS), images };
}

const TOOL_NAME = "save_job_posting";

const inputSchema = {
  type: "object",
  properties: {
    company: { type: "string", description: "회사명" },
    position: { type: ["string", "null"], description: "모집 직무/포지션명" },
    experience: { type: ["string", "null"], description: '경력 조건. 예: "신입", "경력 3년 이상", "신입·경력"' },
    employment_type: { type: ["string", "null"], description: '고용 형태. 예: "정규직", "계약직", "인턴"' },
    location: { type: ["string", "null"], description: '근무지. 시/구 단위로 짧게. 예: "서울 강남구"' },
    deadline: {
      type: ["string", "null"],
      description: "지원 마감일 YYYY-MM-DD. 상시채용/채용시 마감이면 null",
    },
    duties: { type: "array", items: { type: "string" }, description: "주요 업무 / 담당 업무. 한 줄씩 짧게" },
    requirements: { type: "array", items: { type: "string" }, description: "자격요건. 한 줄씩 짧게 요약" },
    preferred: { type: "array", items: { type: "string" }, description: "우대사항. 짧은 키워드형으로" },
    process: { type: "array", items: { type: "string" }, description: '전형 절차 순서. 예: ["서류", "코딩테스트", "1차 면접", "최종 면접"]' },
    summary: { type: ["string", "null"], description: "주요 업무 한두 문장 요약" },
  },
  required: [
    "company",
    "position",
    "experience",
    "employment_type",
    "location",
    "deadline",
    "duties",
    "requirements",
    "preferred",
    "process",
    "summary",
  ],
} as const;

function buildPrompt(text: string, url?: string, hasImages = false) {
  const today = new Date().toISOString().slice(0, 10);
  return `다음은 채용 공고 내용이야. 오늘 날짜는 ${today}.
공고에 실제로 적힌 내용만 정리하고, 없는 정보는 null 이나 빈 배열로 둬. 한국어로 짧게 정리해줘.
여러 포지션이 있으면 가장 대표적인 개발 직무 하나를 골라줘.
${hasImages ? "공고 본문이 이미지로 첨부돼 있어. 이미지 속 글자도 읽어서 정리해줘.\n" : ""}${url ? `원본 링크: ${url}\n` : ""}
<posting>
${text}
</posting>`;
}

function validate(raw: unknown): ParsedJob {
  const parsed = ParsedJob.safeParse(raw);
  if (!parsed.success) throw new Error("AI 분석 결과 형식이 올바르지 않아요. 다시 시도해 주세요.");
  return parsed.data;
}

/**
 * 공고 분석. GEMINI_API_KEY 가 있으면 Gemini(무료 등급), 없으면 Claude 를 씀.
 */
export async function parseJobPosting(text: string, url?: string, images: PostingImage[] = []): Promise<ParsedJob> {
  if (process.env.GEMINI_API_KEY) return parseWithGemini(text, url, images);
  if (process.env.ANTHROPIC_API_KEY) return parseWithClaude(text, url, images);
  throw new Error(".env.local 에 GEMINI_API_KEY (무료) 또는 ANTHROPIC_API_KEY 를 넣어 주세요.");
}

/** Google Gemini API (무료 등급 사용 가능) */
async function parseWithGemini(text: string, url?: string, images: PostingImage[] = []): Promise<ParsedJob> {
  const nullableString = { type: "STRING", nullable: true };
  const stringList = { type: "ARRAY", items: { type: "STRING" } };

  const callModel = (model: string) => fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: buildPrompt(text, url, images.length > 0) },
              ...images.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              company: { type: "STRING", description: "회사명" },
              position: { ...nullableString, description: "모집 직무/포지션명" },
              experience: { ...nullableString, description: '경력 조건. 예: "신입", "경력 3년 이상"' },
              employment_type: { ...nullableString, description: '고용 형태. 예: "정규직", "인턴"' },
              location: { ...nullableString, description: '근무지. 예: "서울 강남구"' },
              deadline: { ...nullableString, description: "지원 마감일 YYYY-MM-DD. 상시채용이면 null" },
              duties: { ...stringList, description: "주요 업무 / 담당 업무. 한 줄씩 짧게" },
              requirements: { ...stringList, description: "자격요건. 한 줄씩 짧게" },
              preferred: { ...stringList, description: "우대사항. 짧은 키워드형" },
              process: { ...stringList, description: "전형 절차 순서" },
              summary: { ...nullableString, description: "주요 업무 한두 문장 요약" },
            },
            required: ["company", "duties", "requirements", "preferred", "process"],
          },
        },
      }),
      cache: "no-store",
    },
  );

  // 무료 등급은 서버가 바쁘면 503, 한도 초과면 429 를 줌 → 잠깐 쉬었다 재시도하고, 안 되면 가벼운 모델로 넘어감
  const models = [process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest"];
  let res: Response | null = null;
  let quota = false;
  outer: for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await callModel(model);
      if (res.ok) break outer;
      if (res.status === 429) {
        quota = true;
        break; // 다음 모델로
      }
      if (res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }
      break outer; // 400 등은 재시도해도 같음
    }
  }

  if (!res || !res.ok) {
    if (quota && res?.status === 429) throw new Error("오늘 무료 AI 사용량을 다 썼어요. 내일 다시 시도해 주세요.");
    if (res && res.status >= 500) throw new Error("AI 서버가 지금 붐벼요. 잠시 후 다시 시도해 주세요.");
    throw new Error(`AI 분석 요청이 실패했어요 (${res?.status ?? "네트워크"})`);
  }

  const data = await res.json();
  const out: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) throw new Error("AI가 공고를 분석하지 못했어요.");
  try {
    return validate(JSON.parse(out));
  } catch {
    throw new Error("AI 분석 결과 형식이 올바르지 않아요. 다시 시도해 주세요.");
  }
}

/** Anthropic Claude API (유료) */
async function parseWithClaude(text: string, url?: string, images: PostingImage[] = []): Promise<ParsedJob> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
    max_tokens: 2000,
    tools: [
      {
        name: TOOL_NAME,
        description: "채용 공고에서 추출한 정보를 저장합니다.",
        input_schema: inputSchema as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          ...images.map((img) => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: img.mimeType, data: img.data },
          })),
          { type: "text" as const, text: buildPrompt(text, url, images.length > 0) },
        ],
      },
    ],
  });

  const block = message.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("AI가 공고를 분석하지 못했어요.");
  return validate(block.input);
}
