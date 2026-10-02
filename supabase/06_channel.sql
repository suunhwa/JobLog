-- 잡로그 6단계: 공고에 "지원 경로" 칸 추가
-- Supabase > SQL Editor 에 붙여넣고 Run
alter table public.applications add column if not exists channel text;
