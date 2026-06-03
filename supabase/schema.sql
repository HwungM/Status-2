-- Clout v2 Supabase Schema
-- Run this when activating multiplayer in v2

create table world_sessions (
  id uuid primary key default gen_random_uuid(),
  scenario_id text,
  mode text not null default 'singleplayer',
  invite_code text unique,
  host_user_id uuid references auth.users,
  world_state jsonb not null,
  story_arc jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table player_slots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references world_sessions on delete cascade,
  user_id uuid references auth.users,
  character_id text not null,
  display_name text not null,
  game_state jsonb not null,
  is_online boolean default false,
  last_seen_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references world_sessions on delete cascade,
  author_character_id text not null,
  author_user_id uuid,
  content text not null,
  likes int default 0,
  reposts int default 0,
  is_player_post boolean default false,
  resolved_event_id uuid,
  created_at timestamptz default now()
);

create table replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts on delete cascade,
  author_character_id text not null,
  content text not null,
  likes int default 0,
  created_at timestamptz default now()
);

-- Enable in v2:
-- alter publication supabase_realtime add table posts;
-- alter publication supabase_realtime add table player_slots;
-- alter publication supabase_realtime add table world_sessions;
