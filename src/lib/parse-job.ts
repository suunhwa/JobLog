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
  requirements: textList,
  preferred: textList,
  process: textList,
  summary: optText,
});
export type ParsedJob = z.infer<typeof ParsedJob>;

const MAX_CHARS = 30_000;

/**
 * 공고 페이지를 읽기 좋은 텍스트로 가져옴.
 * Jina Reader 가 JS 렌더링 페이지도 처리하고, 이미지 공고는 대체 텍스트를 생성해줌.
 */
export async function fetchPostingText(url: string): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "text/plain",
    "X-With-Generated-Alt": "true",
  };
  if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;

  const res = await fetch(`https://r.jina.ai/${url}`, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`공고 페이지를 불러오지 못했어요 (${res.status})`);
  const text = await res.text();
  if (text.trim().length < 50) throw new Error("공고 내용이 너무 짧아요. 텍스트로 붙여넣어 주세요.");
  return text.slice(0, MAX_CHARS);
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
    "requirements",
    "preferred",
    "process",
    "summary",
  ],
} as const;

export async function parseJobPosting(text: string, url?: string): Promise<ParsedJob> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 가 .env.local 에 없어요.");

  const client = new Anthropic({ apiKey });
  const today = new Date().toISOString().slice(0, 10);

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
        content: `다음은 채용 공고 내용이야. 오늘 날짜는 ${today}.
공고에 실제로 적힌 내용만 정리하고, 없는 정보는 null 이나 빈 배열로 둬. 한국어로 짧게 정리해줘.
여러 포지션이 있으면 가장 대표적인 개발 직무 하나를 골라줘.
${url ? `원본 링크: ${url}\n` : ""}
<posting>
${text}
</posting>`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("AI가 공고를 분석하지 못했어요.");

  const parsed = ParsedJob.safeParse(block.input);
  if (!parsed.success) throw new Error("AI 분석 결과 형식이 올바르지 않아요. 다시 시도해 주세요.");
  return parsed.data;
}
