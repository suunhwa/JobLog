-- 잡로그 5단계: 공고에 "급여" 칸 추가
-- Supabase > SQL Editor 에 붙여넣고 Run
alter table public.applications add column if not exists salary text;
