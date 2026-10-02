/**
 * 동물 테마 목록.
 * 새 테마 추가 순서:
 *  1) globals.css 에 [data-theme="이름"] 색상 블록 추가
 *  2) 여기 THEMES 에 등록
 *  3) public/mascot/<이름>/ 에 단계별 일러스트 추가 (또는 SVG 컴포넌트)
 */
export const THEMES = {
  hamster: {
    name: "햄스터",
    item: "해바라기씨",
    storage: "햄스터 집",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;
export const DEFAULT_THEME: ThemeKey = "hamster";
