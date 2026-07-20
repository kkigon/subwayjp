-- Authoritative multiplayer game clock and scores.
create table if not exists public.jp_game_states (
  room_code text primary key references public.jp_rooms(code) on delete cascade,
  phase text not null default 'lobby' check (phase in ('lobby','countdown','playing','reveal','ended')),
  rev bigint not null default 0,
  q_order text[] not null default '{}',
  question_index integer not null default -1,
  region text not null default 'tokyo' check (region = 'tokyo'),
  line_ids text[] not null default '{}',
  duration_sec integer not null default 60 check (duration_sec in (60,120,300)),
  play_at timestamptz,
  q_ends_at timestamptz,
  game_ends_at timestamptz,
  reveal_until timestamptz,
  winner_id text,
  winner_name text,
  scores jsonb not null default '{}',
  names jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.jp_game_states enable row level security;
drop policy if exists jp_game_states_read_all on public.jp_game_states;
revoke all on public.jp_game_states from anon, authenticated;

create or replace function public.jp_vs_start(
  p_room text, p_host text, p_region text, p_line_ids text[], p_order text[],
  p_duration integer, p_names jsonb
)
returns public.jp_game_states language plpgsql security definer set search_path = '' as $$
declare
  v_state public.jp_game_states;
  v_play_at timestamptz := clock_timestamp() + interval '3 seconds';
  v_allowed constant text[] := array['G','M','H','T','C','Y','Z','N','F','A','I','S','E']::text[];
begin
  if p_region <> 'tokyo' or p_duration not in (60,120,300)
     or coalesce(array_length(p_line_ids, 1), 0) not between 1 and 13
     or not (p_line_ids <@ v_allowed)
     or (select count(distinct item) from unnest(p_line_ids) item) <> array_length(p_line_ids, 1)
     or coalesce(array_length(p_order, 1), 0) < 1 then
    raise exception 'invalid game settings' using errcode = '22023';
  end if;
  if not exists (select 1 from public.jp_rooms where code = p_room and host_id = p_host and status <> 'ended') then
    raise exception 'only the current host can start' using errcode = '42501';
  end if;
  insert into public.jp_game_states (
    room_code, phase, rev, q_order, question_index, region, line_ids, duration_sec,
    play_at, q_ends_at, game_ends_at, reveal_until, winner_id, winner_name, scores, names, updated_at
  ) values (
    p_room, 'countdown', 1, p_order, 0, 'tokyo', p_line_ids, p_duration,
    v_play_at, v_play_at + interval '10 seconds', v_play_at + make_interval(secs => p_duration),
    null, null, null, '{}'::jsonb, coalesce(p_names, '{}'::jsonb), clock_timestamp()
  ) on conflict (room_code) do update set
    phase = 'countdown', rev = public.jp_game_states.rev + 1, q_order = excluded.q_order,
    question_index = 0, region = 'tokyo', line_ids = excluded.line_ids,
    duration_sec = excluded.duration_sec, play_at = excluded.play_at,
    q_ends_at = excluded.q_ends_at, game_ends_at = excluded.game_ends_at,
    reveal_until = null, winner_id = null, winner_name = null,
    scores = '{}'::jsonb, names = excluded.names, updated_at = clock_timestamp()
  returning * into v_state;
  return v_state;
end;
$$;

create or replace function public.jp_vs_sync(p_room text)
returns public.jp_game_states language sql stable security definer set search_path = '' as $$
  select state.* from public.jp_game_states state where state.room_code = upper(trim(p_room)) limit 1;
$$;

create or replace function public.jp_vs_join(
  p_room text, p_player_id text, p_name text, p_theme text
)
returns public.jp_game_states language plpgsql security definer set search_path = '' as $$
declare v_state public.jp_game_states;
begin
  if char_length(coalesce(p_player_id,'')) not between 3 and 128
     or char_length(trim(coalesce(p_name,''))) not between 1 and 40 then
    raise exception 'invalid player' using errcode = '22023';
  end if;
  update public.jp_game_states set
    names = jsonb_set(coalesce(names, '{}'::jsonb), array[p_player_id],
      jsonb_build_object('name', trim(p_name), 'themeLine', nullif(p_theme,'')), true),
    rev = rev + 1, updated_at = clock_timestamp()
  where room_code = upper(trim(p_room)) returning * into v_state;
  return v_state;
end;
$$;

create or replace function public.jp_vs_claim(
  p_room text, p_index integer, p_player_id text, p_player_name text
)
returns public.jp_game_states language plpgsql security definer set search_path = '' as $$
declare v_state public.jp_game_states; v_score integer;
begin
  select * into v_state from public.jp_game_states where room_code = upper(trim(p_room)) for update;
  if not found then return null; end if;
  if v_state.phase <> 'playing' or v_state.question_index <> p_index
     or clock_timestamp() >= v_state.q_ends_at or clock_timestamp() >= v_state.game_ends_at then
    return v_state;
  end if;
  v_score := coalesce((v_state.scores ->> p_player_id)::integer, 0) + 1;
  update public.jp_game_states set
    phase = 'reveal', winner_id = p_player_id, winner_name = left(trim(p_player_name), 40),
    scores = jsonb_set(coalesce(scores, '{}'::jsonb), array[p_player_id], to_jsonb(v_score), true),
    names = jsonb_set(coalesce(names, '{}'::jsonb), array[p_player_id],
      coalesce(names -> p_player_id, jsonb_build_object('name', left(trim(p_player_name),40), 'themeLine', null)), true),
    reveal_until = least(game_ends_at, clock_timestamp() + interval '500 milliseconds'),
    rev = rev + 1, updated_at = clock_timestamp()
  where room_code = v_state.room_code returning * into v_state;
  return v_state;
end;
$$;

create or replace function public.jp_vs_tick(p_room text)
returns public.jp_game_states language plpgsql security definer set search_path = '' as $$
declare v_state public.jp_game_states; v_now timestamptz := clock_timestamp(); v_next integer;
begin
  select * into v_state from public.jp_game_states where room_code = upper(trim(p_room)) for update;
  if not found then return null; end if;
  if v_state.phase in ('ended','lobby') then return v_state; end if;
  if v_state.game_ends_at is not null and v_now >= v_state.game_ends_at then
    update public.jp_game_states set phase='ended', rev=rev+1, updated_at=v_now
      where room_code=v_state.room_code returning * into v_state;
    return v_state;
  end if;
  if v_state.phase = 'countdown' and v_now >= v_state.play_at then
    update public.jp_game_states set phase='playing', q_ends_at=least(game_ends_at,v_now+interval '10 seconds'),
      rev=rev+1, updated_at=v_now where room_code=v_state.room_code returning * into v_state;
  elsif v_state.phase = 'playing' and v_now >= v_state.q_ends_at then
    update public.jp_game_states set phase='reveal', winner_id=null, winner_name=null,
      reveal_until=least(game_ends_at,v_now+interval '500 milliseconds'), rev=rev+1, updated_at=v_now
      where room_code=v_state.room_code returning * into v_state;
  elsif v_state.phase = 'reveal' and v_now >= v_state.reveal_until then
    v_next := v_state.question_index + 1;
    if v_next >= coalesce(array_length(v_state.q_order,1),0) then
      update public.jp_game_states set phase='ended', rev=rev+1, updated_at=v_now
        where room_code=v_state.room_code returning * into v_state;
    else
      update public.jp_game_states set phase='playing', question_index=v_next, winner_id=null, winner_name=null,
        reveal_until=null, q_ends_at=least(game_ends_at,v_now+interval '10 seconds'), rev=rev+1, updated_at=v_now
        where room_code=v_state.room_code returning * into v_state;
    end if;
  end if;
  return v_state;
end;
$$;

create or replace function public.jp_vs_end(p_room text)
returns public.jp_game_states language plpgsql security definer set search_path = '' as $$
declare v_state public.jp_game_states;
begin
  select * into v_state from public.jp_game_states where room_code=upper(trim(p_room)) for update;
  if not found or v_state.phase in ('ended','lobby') then return v_state; end if;
  -- The browser may request completion, but only the database clock may end a match.
  if v_state.game_ends_at is null or clock_timestamp() < v_state.game_ends_at then return v_state; end if;
  update public.jp_game_states set phase='ended', rev=rev+1, updated_at=clock_timestamp()
    where room_code=v_state.room_code returning * into v_state;
  return v_state;
end;
$$;

create or replace function public.jp_vs_lobby(p_room text, p_host text)
returns public.jp_game_states language plpgsql security definer set search_path = '' as $$
declare v_state public.jp_game_states;
begin
  if not exists (select 1 from public.jp_rooms where code=upper(trim(p_room)) and host_id=p_host) then
    raise exception 'only the current host can return to lobby' using errcode='42501';
  end if;
  update public.jp_game_states set phase='lobby', rev=rev+1, q_order='{}', question_index=-1,
    play_at=null, q_ends_at=null, game_ends_at=null, reveal_until=null, winner_id=null, winner_name=null,
    scores='{}', updated_at=clock_timestamp() where room_code=upper(trim(p_room)) returning * into v_state;
  return v_state;
end;
$$;

revoke all on function public.jp_vs_start(text,text,text,text[],text[],integer,jsonb) from public;
revoke all on function public.jp_vs_sync(text) from public;
revoke all on function public.jp_vs_join(text,text,text,text) from public;
revoke all on function public.jp_vs_claim(text,integer,text,text) from public;
revoke all on function public.jp_vs_tick(text) from public;
revoke all on function public.jp_vs_end(text) from public;
revoke all on function public.jp_vs_lobby(text,text) from public;
grant execute on function public.jp_vs_start(text,text,text,text[],text[],integer,jsonb) to anon, authenticated;
grant execute on function public.jp_vs_sync(text) to anon, authenticated;
grant execute on function public.jp_vs_join(text,text,text,text) to anon, authenticated;
grant execute on function public.jp_vs_claim(text,integer,text,text) to anon, authenticated;
grant execute on function public.jp_vs_tick(text) to anon, authenticated;
grant execute on function public.jp_vs_end(text) to anon, authenticated;
grant execute on function public.jp_vs_lobby(text,text) to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jp_game_states'
     ) then
    alter publication supabase_realtime add table public.jp_game_states;
  end if;
end;
$$;

notify pgrst, 'reload schema';
