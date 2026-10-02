-- 잡로그 2단계: 닉네임 · 햄스터 이름 · 친구(이웃) · 선물/방명록
-- Supabase > SQL Editor 에 붙여넣고 Run (schema.sql 을 먼저 실행한 상태에서)

-- ─────────────────────────────────────────────
-- 프로필
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default '취준생',
  hamster_name text not null default '햄찌',
  friend_code text not null unique,
  created_at timestamptz not null default now(),
  constraint nickname_len check (char_length(nickname) between 1 and 12),
  constraint hamster_name_len check (char_length(hamster_name) between 1 and 10)
);

-- 겹치지 않는 친구 코드 (예: HAM-7K2QX)
create or replace function public.new_friend_code()
returns text language plpgsql set search_path = public as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := 'HAM-';
    for i in 1..5 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where friend_code = code);
  end loop;
  return code;
end;
$$;

-- 가입하면 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname, friend_code)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), '취준생'), 12),
    public.new_friend_code()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이미 가입한 사람들도 프로필 만들기
insert into public.profiles (id, nickname, friend_code)
select u.id,
       left(coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1), '취준생'), 12),
       public.new_friend_code()
from auth.users u
on conflict (id) do nothing;

-- ─────────────────────────────────────────────
-- 친구(이웃) 관계: 양방향으로 두 줄 저장
-- ─────────────────────────────────────────────
create table if not exists public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint not_self check (user_id <> friend_id)
);

-- ─────────────────────────────────────────────
-- 선물 · 방명록
-- ─────────────────────────────────────────────
create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('seed', 'pat', 'cheer')),
  message text check (message is null or char_length(message) <= 60),
  seen boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists gifts_to_idx on public.gifts (to_id, created_at desc);

-- ─────────────────────────────────────────────
-- 보안 정책 (RLS)
-- ─────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.gifts enable row level security;

create or replace function public.is_friend(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from friendships where user_id = auth.uid() and friend_id = other);
$$;

drop policy if exists "read own or friend profile" on public.profiles;
create policy "read own or friend profile" on public.profiles
  for select using (id = auth.uid() or public.is_friend(id));

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "read own friendships" on public.friendships;
create policy "read own friendships" on public.friendships
  for select using (user_id = auth.uid());

drop policy if exists "read my gifts" on public.gifts;
create policy "read my gifts" on public.gifts
  for select using (to_id = auth.uid() or from_id = auth.uid());

drop policy if exists "send gift to friend" on public.gifts;
create policy "send gift to friend" on public.gifts
  for insert with check (from_id = auth.uid() and public.is_friend(to_id));

drop policy if exists "mark received gifts seen" on public.gifts;
create policy "mark received gifts seen" on public.gifts
  for update using (to_id = auth.uid()) with check (to_id = auth.uid());

-- 친구 코드나 프로필의 다른 칸은 고칠 수 없게 (닉네임·햄스터 이름만)
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (nickname, hamster_name) on public.profiles to authenticated;
grant select on public.friendships to authenticated;
grant select, insert on public.gifts to authenticated;
grant update (seen) on public.gifts to authenticated;
revoke all on public.profiles, public.friendships, public.gifts from anon;

-- ─────────────────────────────────────────────
-- 함수 (앱에서 rpc 로 호출)
-- ─────────────────────────────────────────────

-- 친구 코드로 이웃 추가 (서로 추가됨). 친구 닉네임을 돌려줌
create or replace function public.add_friend(code text)
returns text language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  other public.profiles;
begin
  if me is null then raise exception '로그인이 필요해요'; end if;
  select * into other from profiles where friend_code = upper(trim(code));
  if other.id is null then raise exception '친구 코드를 찾을 수 없어요'; end if;
  if other.id = me then raise exception '내 코드예요!'; end if;
  insert into friendships (user_id, friend_id) values (me, other.id), (other.id, me)
  on conflict do nothing;
  return other.nickname;
end;
$$;

-- 이웃 끊기
create or replace function public.remove_friend(other uuid)
returns void language sql security definer set search_path = public as $$
  delete from friendships
  where (user_id = auth.uid() and friend_id = other) or (user_id = other and friend_id = auth.uid());
$$;

-- 내 이웃들의 숫자 요약 (회사명·메모는 절대 안 나감)
create or replace function public.neighbor_stats(only_id uuid default null)
returns table (
  id uuid,
  nickname text,
  hamster_name text,
  total int,
  doc_passed int,
  interviews int,
  this_week int
) language sql stable security definer set search_path = public as $$
  select p.id, p.nickname, p.hamster_name,
    count(a.id)::int,
    count(a.id) filter (where a.stage in ('doc_passed', 'test', 'interview1', 'interview2', 'offer'))::int,
    count(a.id) filter (where a.stage in ('interview1', 'interview2', 'offer'))::int,
    count(a.id) filter (where a.created_at >= date_trunc('week', now()))::int
  from friendships f
  join profiles p on p.id = f.friend_id
  left join applications a on a.user_id = p.id
  where f.user_id = auth.uid()
    and (only_id is null or p.id = only_id)
  group by p.id, p.nickname, p.hamster_name
  order by p.nickname;
$$;

revoke execute on function public.add_friend(text) from anon, public;
revoke execute on function public.remove_friend(uuid) from anon, public;
revoke execute on function public.neighbor_stats(uuid) from anon, public;
revoke execute on function public.is_friend(uuid) from anon, public;
grant execute on function public.add_friend(text) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.neighbor_stats(uuid) to authenticated;
grant execute on function public.is_friend(uuid) to authenticated;
