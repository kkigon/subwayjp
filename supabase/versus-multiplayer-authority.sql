-- ============================================================
-- 대전 모드: 서버 권위형 방장/방 설정 마이그레이션
--
-- 적용 순서
--   1. versus-step1-rooms.sql 실행 후 이 파일 실행
--   2. 공개방/채팅은 이어서 versus-public-rooms-chat.sql 실행
--
-- 온라인 참가자 목록은 Supabase Realtime Presence가 담당한다.
-- 이 SQL은 영속 상태(방장, 설정, 방 상태)의 변경만 원자적 RPC로 제한한다.
-- 여러 번 실행해도 안전하도록 작성되어 있다.
-- ============================================================

begin;

-- 기존 uuid host_id와 현재 게스트/세션 text id의 타입 불일치를 제거한다.
alter table public.jp_rooms
  alter column host_id type text using host_id::text;

alter table public.jp_rooms add column if not exists play_mode text not null default 'timed';
alter table public.jp_rooms add column if not exists host_revision bigint not null default 0;
alter table public.jp_rooms add column if not exists host_changed_at timestamptz not null default now();
alter table public.jp_rooms add column if not exists updated_at timestamptz not null default now();

update public.jp_rooms
   set duration_sec = 60
 where duration_sec not in (60, 120, 300);
alter table public.jp_rooms alter column duration_sec set default 60;
alter table public.jp_rooms drop constraint if exists jp_rooms_duration_sec_check;
alter table public.jp_rooms add constraint jp_rooms_duration_sec_check
  check (duration_sec in (60, 120, 300));

update public.jp_rooms set play_mode = 'timed' where play_mode <> 'timed';
alter table public.jp_rooms drop constraint if exists jp_rooms_play_mode_check;
alter table public.jp_rooms add constraint jp_rooms_play_mode_check
  check (play_mode = 'timed');

create or replace function public.jp_room_create(
  p_code text,
  p_host text,
  p_host_name text,
  p_region text
)
returns public.jp_rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.jp_rooms;
begin
  if p_code !~ '^[A-Z2-9]{4,8}$' then
    raise exception 'invalid room code' using errcode = '22023';
  end if;
  if coalesce(length(p_host), 0) < 3 or length(p_host) > 128 then
    raise exception 'invalid player id' using errcode = '22023';
  end if;
  if coalesce(length(trim(p_host_name)), 0) < 1 or length(p_host_name) > 40 then
    raise exception 'invalid player name' using errcode = '22023';
  end if;
  if p_region <> 'tokyo' then
    raise exception 'invalid region' using errcode = '22023';
  end if;

  insert into public.jp_rooms (
    code, host_id, host_name, region, mode, duration_sec, status,
    play_mode, host_revision, host_changed_at, updated_at
  ) values (
    p_code, p_host, trim(p_host_name), 'tokyo', 'all', 60, 'waiting',
    'timed', 0, now(), now()
  )
  returning * into v_room;

  return v_room;
end;
$$;

create or replace function public.jp_room_update_settings(
  p_room text,
  p_host text,
  p_region text,
  p_mode text,
  p_custom_lines text,
  p_duration integer,
  p_play_mode text
)
returns public.jp_rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.jp_rooms;
  v_custom text[];
  v_normalized text;
begin
  if p_region <> 'tokyo'
     or p_mode not in ('all', 'custom')
     or p_play_mode <> 'timed'
     or p_duration not in (60, 120, 300) then
    raise exception 'invalid room settings' using errcode = '22023';
  end if;

  if p_mode = 'all' then
    if coalesce(p_custom_lines, '') <> '' then
      raise exception 'all mode cannot include custom lines' using errcode = '22023';
    end if;
    v_normalized := '';
  else
    v_custom := string_to_array(coalesce(p_custom_lines, ''), ',');
    if coalesce(array_length(v_custom, 1), 0) not between 1 and 13
       or not (v_custom <@ array['G','M','H','T','C','Y','Z','N','F','A','I','S','E']::text[])
       or (select count(distinct item) from unnest(v_custom) item) <> array_length(v_custom, 1) then
      raise exception 'invalid custom lines' using errcode = '22023';
    end if;
    v_normalized := array_to_string(v_custom, ',');
  end if;

  update public.jp_rooms
     set region = 'tokyo',
         mode = p_mode,
         custom_lines = v_normalized,
         duration_sec = p_duration,
         play_mode = 'timed',
         updated_at = now()
   where code = p_room
     and host_id = p_host
  returning * into v_room;

  if not found then
    raise exception 'only the current host can update settings' using errcode = '42501';
  end if;
  return v_room;
end;
$$;

create or replace function public.jp_room_set_status(
  p_room text,
  p_host text,
  p_status text
)
returns public.jp_rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.jp_rooms;
begin
  if p_status not in ('waiting', 'playing', 'ended') then
    raise exception 'invalid room status' using errcode = '22023';
  end if;

  update public.jp_rooms
     set status = p_status,
         updated_at = now()
   where code = p_room
     and host_id = p_host
  returning * into v_room;

  if not found then
    raise exception 'only the current host can change room status' using errcode = '42501';
  end if;
  return v_room;
end;
$$;

-- 수동 위임: DB의 현재 방장이 호출자가 알고 있는 방장과 같을 때만 성공한다.
create or replace function public.jp_room_transfer_host(
  p_room text,
  p_current_host text,
  p_new_host text,
  p_new_host_name text
)
returns public.jp_rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.jp_rooms;
begin
  if coalesce(length(p_new_host), 0) < 3 or length(p_new_host) > 128
     or coalesce(length(trim(p_new_host_name)), 0) < 1
     or length(p_new_host_name) > 40 then
    raise exception 'invalid new host' using errcode = '22023';
  end if;

  update public.jp_rooms
     set host_id = p_new_host,
         host_name = trim(p_new_host_name),
         host_revision = host_revision + 1,
         host_changed_at = now(),
         updated_at = now()
   where code = p_room
     and host_id = p_current_host
  returning * into v_room;

  if not found then
    raise exception 'host changed before transfer completed' using errcode = '40001';
  end if;
  return v_room;
end;
$$;

-- 비정상 종료 후 자동 승계: expected_host 비교가 CAS 역할을 해 동시 요청 중 하나만 이긴다.
-- 권한 오류 대신 null을 반환해 패자는 최신 room 행을 다시 읽도록 한다.
create or replace function public.jp_room_claim_host(
  p_room text,
  p_expected_host text,
  p_claimant text,
  p_claimant_name text
)
returns public.jp_rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.jp_rooms;
begin
  if coalesce(length(p_claimant), 0) < 3 or length(p_claimant) > 128
     or coalesce(length(trim(p_claimant_name)), 0) < 1
     or length(p_claimant_name) > 40 then
    raise exception 'invalid host claimant' using errcode = '22023';
  end if;

  update public.jp_rooms
     set host_id = p_claimant,
         host_name = trim(p_claimant_name),
         host_revision = host_revision + 1,
         host_changed_at = now(),
         updated_at = now()
   where code = p_room
     and host_id is not distinct from p_expected_host
  returning * into v_room;

  return v_room;
end;
$$;

create or replace function public.jp_room_delete(
  p_room text,
  p_host text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.jp_rooms
   where code = p_room
     and host_id = p_host;
  return found;
end;
$$;

-- 브라우저의 직접 INSERT/UPDATE/DELETE 경로를 닫고 위 RPC만 공개한다.
drop policy if exists "jp_rooms_insert_all" on public.jp_rooms;
drop policy if exists "jp_rooms_update_all" on public.jp_rooms;
drop policy if exists "jp_rooms_delete_all" on public.jp_rooms;

revoke insert, update, delete on public.jp_rooms from anon, authenticated;
grant select on public.jp_rooms to anon, authenticated;

revoke all on function public.jp_room_create(text, text, text, text) from public;
revoke all on function public.jp_room_update_settings(text, text, text, text, text, integer, text) from public;
revoke all on function public.jp_room_set_status(text, text, text) from public;
revoke all on function public.jp_room_transfer_host(text, text, text, text) from public;
revoke all on function public.jp_room_claim_host(text, text, text, text) from public;
revoke all on function public.jp_room_delete(text, text) from public;

grant execute on function public.jp_room_create(text, text, text, text) to anon, authenticated;
grant execute on function public.jp_room_update_settings(text, text, text, text, text, integer, text) to anon, authenticated;
grant execute on function public.jp_room_set_status(text, text, text) to anon, authenticated;
grant execute on function public.jp_room_transfer_host(text, text, text, text) to anon, authenticated;
grant execute on function public.jp_room_claim_host(text, text, text, text) to anon, authenticated;
grant execute on function public.jp_room_delete(text, text) to anon, authenticated;

-- jp_rooms/jp_game_states Postgres Changes 구독을 활성화한다. Presence는 publication이 필요 없다.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jp_rooms'
     ) then
    alter publication supabase_realtime add table public.jp_rooms;
  end if;

  if to_regclass('public.jp_game_states') is not null
     and exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jp_game_states'
     ) then
    alter publication supabase_realtime add table public.jp_game_states;
  end if;
end;
$$;

commit;
