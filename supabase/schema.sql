-- 잡로그 DB 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  -- 공고 원문
  source_url text,
  raw_text text,

  -- AI 분석 결과
  company text not null,
  position text,
  experience text,        -- 예: "신입", "경력 3년 이상"
  employment_type text,   -- 예: "정규직"
  location text,
  salary text,             -- 급여 조건
  deadline date,
  duties text[] not null default '{}',     -- 주요 업무 / 담당 업무
  requirements text[] not null default '{}',
  preferred text[] not null default '{}',
  process text[] not null default '{}',   -- 공고에 적힌 전형 절차
  summary text,

  -- 진행 상황
  stage text not null default 'planned'
    check (stage in ('planned', 'applied', 'doc_passed', 'test', 'interview1', 'interview2', 'offer')),
  status text not null default 'active'
    check (status in ('active', 'passed', 'failed')),
  memo text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_idx on public.applications (user_id, created_at desc);

-- 단계 변경 기록 (어디서 떨어졌는지 통계용)
create table if not exists public.stage_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stage text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists stage_events_app_idx on public.stage_events (application_id, created_at);

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_touch on public.applications;
create trigger applications_touch
  before update on public.applications
  for each row execute function public.touch_updated_at();

-- RLS: 본인 데이터만 접근
alter table public.applications enable row level security;
alter table public.stage_events enable row level security;

drop policy if exists "own applications" on public.applications;
create policy "own applications" on public.applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own stage events" on public.stage_events;
create policy "own stage events" on public.stage_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Data API 권한: 로그인한 사용자(authenticated)만 접근
-- ("Automatically expose new tables" 를 꺼도 동작하도록 명시적으로 부여)
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, update, delete on public.stage_events to authenticated;
revoke all on public.applications from anon;
revoke all on public.stage_events from anon;
