-- 잡로그 7단계: 공고마다 다른 전형 단계 (AI가 읽은 절차 / 직접 수정)
-- Supabase > SQL Editor 에 붙여넣고 Run
alter table public.applications add column if not exists steps text[];
alter table public.applications add column if not exists step int not null default 0;
alter table public.applications add column if not exists steps_custom boolean not null default false;
