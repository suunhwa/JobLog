-- 잡로그 3단계: 공고에 "주요 업무" 칸 추가
-- Supabase > SQL Editor 에 붙여넣고 Run
alter table public.applications add column if not exists duties text[] not null default '{}';
