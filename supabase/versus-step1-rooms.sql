-- Fresh database: multiplayer room table for the Tokyo edition.
create table if not exists public.rooms (
  code text primary key check (code ~ '^[A-Z2-9]{4,8}$'),
  host_id text not null,
  host_name text not null check (char_length(host_name) between 1 and 40),
  region text not null default 'tokyo' check (region = 'tokyo'),
  mode text not null default 'all' check (mode in ('all', 'custom')),
  custom_lines text not null default '' check (
    (mode = 'all' and custom_lines = '') or
    (mode = 'custom' and custom_lines ~ '^(G|M|H|T|C|Y|Z|N|F|A|I|S|E)(,(G|M|H|T|C|Y|Z|N|F|A|I|S|E))*$')
  ),
  duration_sec integer not null default 60 check (duration_sec in (60, 120, 300)),
  play_mode text not null default 'timed' check (play_mode = 'timed'),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'ended')),
  room_title text not null default '東京メトロ対戦ルーム' check (char_length(room_title) between 2 and 30),
  is_public boolean not null default true,
  member_count integer not null default 1 check (member_count between 1 and 32),
  host_revision bigint not null default 0,
  host_changed_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 이미 초기 스키마를 적용한 개발 DB도 커스텀 모드를 받을 수 있게 제약을 갱신한다.
alter table public.rooms drop constraint if exists rooms_mode_check;
alter table public.rooms add constraint rooms_mode_check check (mode in ('all', 'custom'));
alter table public.rooms drop constraint if exists rooms_custom_lines_check;
alter table public.rooms add constraint rooms_custom_lines_check check (
  (mode = 'all' and custom_lines = '') or
  (mode = 'custom' and custom_lines ~ '^(G|M|H|T|C|Y|Z|N|F|A|I|S|E)(,(G|M|H|T|C|Y|Z|N|F|A|I|S|E))*$')
);

create index if not exists rooms_created_idx on public.rooms (created_at);
create index if not exists rooms_public_lobby_idx on public.rooms (last_active_at desc)
  where is_public and status = 'waiting';

alter table public.rooms enable row level security;
drop policy if exists rooms_select_public on public.rooms;
create policy rooms_select_public on public.rooms for select using (is_public = true);
