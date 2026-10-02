# 잡로그 (JobLog)

햄스터랑 같이 모으는 나의 취업 기록.
공고 링크를 붙여넣으면 AI가 회사명·자격요건·마감일 등을 정리해주고, 전형 결과를 기록할 수 있어요.
공고를 담을 때마다 햄스터 볼이 빵빵해지고, 10개마다 햄스터 집에 가구가 생겨요.

## 스택

- Next.js 16 (App Router) + Tailwind CSS 4
- Supabase (로그인, DB)
- Gemini API 무료 등급 또는 Claude API (공고 분석) + Jina Reader (공고 페이지 읽기)
- PWA (아이폰 사파리 → 공유 → 홈 화면에 추가)

## 처음 세팅

1. 패키지 설치
   ```bash
   npm install
   ```
2. Supabase 프로젝트 만들기 (https://supabase.com, 무료)
   - SQL Editor 에 `supabase/schema.sql` 내용을 붙여넣고 실행
   - 이어서 `supabase/02_friends.sql` 도 실행 (닉네임·햄스터 이름·이웃·선물)
   - Authentication > URL Configuration
     - Site URL: `http://localhost:3000` (배포 후엔 배포 주소)
     - Redirect URLs 에 `http://localhost:3000/auth/callback` 추가
   - (구글 로그인) 아래 "구글 로그인 설정" 참고
3. 환경변수
   ```bash
   cp .env.example .env.local
   ```
   `.env.local` 에 Supabase URL/키, Gemini API 키(무료, https://aistudio.google.com/apikey) 입력
4. 실행
   ```bash
   npm run dev
   ```
   http://localhost:3000 접속 → 이메일로 로그인 링크 받기

## 구글 로그인 설정

1. [Google Cloud Console](https://console.cloud.google.com) > 새 프로젝트 만들기
2. API 및 서비스 > OAuth 동의 화면: 외부(External), 앱 이름 "잡로그", 이메일 입력 후 저장
3. 사용자 인증 정보 > 사용자 인증 정보 만들기 > OAuth 클라이언트 ID
   - 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI: Supabase 대시보드 > Authentication > Sign In / Providers > Google 에 표시된
     Callback URL (`https://<프로젝트>.supabase.co/auth/v1/callback`)
4. 발급된 클라이언트 ID / 보안 비밀을 Supabase 의 Google 프로바이더에 붙여넣고 Enable
5. 앱 코드는 이미 연결돼 있음 (로그인 화면의 "Google로 계속하기")

## 폴더 구조

```
src/
  app/
    page.tsx                 홈 (햄스터, 공고 담기, 통계, 목록)
    applications/[id]/       공고 상세 (전형 진행, AI 분석, 메모)
    house/                   햄스터 집 (가구 모음)
    login/, auth/callback/   이메일 매직링크 로그인
    actions.ts               서버 액션 (공고 추가/단계 변경/메모 등)
  components/mascot/Hamster.tsx   임시 햄스터 SVG (나중에 일러스트로 교체)
  lib/
    parse-job.ts             공고 읽기 + AI 분석
    progress.ts              볼 빵빵 / 가구 해금 로직
    types.ts                 전형 단계 정의
  themes/                    동물 테마 목록
  proxy.ts                   로그인 체크 (Next 16 의 middleware)
supabase/schema.sql          DB 테이블 + 보안 정책
```

## 다음 할 일

- [ ] Vercel 배포 + 아이폰 홈 화면에 추가
- [ ] iOS 단축어로 공유 시트에서 바로 공고 담기 (`/?url=...`)
- [ ] 마감일 푸시 알림
- [ ] 햄스터 일러스트 교체 (볼 단계 4장 + 가구 단계별)
- [ ] 통계 화면 (단계별 통과율)
- [ ] 테마 추가 (다람쥐, 토끼, 비숑, 쿼카, 카피바라, 병아리)
