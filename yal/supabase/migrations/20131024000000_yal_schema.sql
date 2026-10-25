-- YourAnimeList (YAL) schema: 2012–2013 archive catalogue, forums and
-- member data.
--
-- Conventions
-- * Event timestamps (`aired_at`, `posted_at`, `joined_at`, ...) are the
--   in-world moment something happened. `recorded_at` is the real time a
--   row was written. Historical views filter on the event time only.
-- * `visible_from` is when a record first existed on YAL; null means
--   undocumented back-catalogue (always visible).
-- * Archived aggregate counts live in snapshot tables and are never mixed
--   with counts of individual posts.
-- * `provenance` separates documented facts, recovered archive records,
--   reconstructed sample content, derived values and member content.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.provenance as enum ('documented', 'archived', 'reconstructed', 'derived', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.list_status as enum ('Watching', 'Completed', 'On-Hold', 'Dropped', 'Plan to Watch');
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- Catalogue
-- ===========================================================================

create table if not exists public.franchises (
  slug text primary key,
  name text not null unique
);

create table if not exists public.seasons (
  year int not null check (year between 1960 and 2100),
  season text not null check (season in ('winter', 'spring', 'summer', 'fall')),
  starts_at timestamptz not null,
  primary key (year, season)
);

create table if not exists public.companies (
  id int primary key,
  slug text not null unique,
  name text not null unique,
  kinds text[] not null default '{}',
  about text,
  founded_note text,
  visible_from timestamptz,
  sources text[] not null default '{}'
);

create table if not exists public.people (
  id int primary key,
  slug text not null unique,
  name text not null,
  native_name text,
  occupations text[] not null default '{}',
  about text,
  visible_from timestamptz,
  sources text[] not null default '{}'
);

create table if not exists public.anime (
  id int primary key,
  slug text not null unique,
  title text not null,
  title_japanese text,
  title_romaji text,
  synonyms text[] not null default '{}',
  type text not null check (type in ('TV', 'OVA', 'Movie', 'Special', 'ONA', 'Unknown')),
  episodes_planned int check (episodes_planned is null or episodes_planned > 0),
  aired_from timestamptz,
  aired_to timestamptz,
  release_year int,
  release_note text,
  weekly_from timestamptz,
  premiered_season text check (premiered_season is null or premiered_season in ('winter', 'spring', 'summer', 'fall')),
  premiered_year int,
  broadcast text,
  source text,
  duration text,
  rating text,
  synopsis text,
  synopsis_source text,
  cover_url text,
  franchise_slug text references public.franchises (slug),
  visible_from timestamptz,
  provenance public.provenance not null default 'documented',
  sources text[] not null default '{}',
  archive_notes text[] not null default '{}',
  check (aired_to is null or aired_from is null or aired_to >= aired_from)
);
create index if not exists anime_visible_from_idx on public.anime (visible_from);
create index if not exists anime_premiered_idx on public.anime (premiered_year, premiered_season);

create table if not exists public.genres (
  name text primary key,
  kind text not null check (kind in ('genre', 'theme'))
);

create table if not exists public.anime_genres (
  anime_id int not null references public.anime (id) on delete cascade,
  genre text not null references public.genres (name),
  primary key (anime_id, genre)
);

create table if not exists public.anime_background (
  anime_id int not null references public.anime (id) on delete cascade,
  position int not null,
  body text not null,
  visible_from timestamptz,
  primary key (anime_id, position)
);

-- Release schedule: TV premieres, advance broadcasts, simulcasts, dubs.
create table if not exists public.anime_broadcasts (
  anime_id int not null references public.anime (id) on delete cascade,
  position int not null,
  label text not null,
  at timestamptz,
  note text,
  visible_from timestamptz,
  primary key (anime_id, position)
);

create table if not exists public.anime_companies (
  anime_id int not null references public.anime (id) on delete cascade,
  company_id int not null references public.companies (id),
  role text not null check (role in ('studio', 'producer', 'licensor')),
  visible_from timestamptz,
  primary key (anime_id, company_id, role)
);
create index if not exists anime_companies_company_idx on public.anime_companies (company_id);

create table if not exists public.episodes (
  anime_id int not null references public.anime (id) on delete cascade,
  number int not null check (number >= 0),
  title text,
  aired_at timestamptz,
  note text,
  primary key (anime_id, number)
);
create index if not exists episodes_aired_idx on public.episodes (aired_at);

create table if not exists public.characters (
  id int primary key,
  slug text not null unique,
  name text not null,
  native_name text,
  role text not null,
  visible_from timestamptz,
  sources text[] not null default '{}'
);

-- Biography facts carry the broadcast that revealed them.
create table if not exists public.character_facts (
  character_id int not null references public.characters (id) on delete cascade,
  position int not null,
  body text not null,
  revealed_at timestamptz,
  primary key (character_id, position)
);

create table if not exists public.character_relationships (
  character_id int not null references public.characters (id) on delete cascade,
  other_id int not null references public.characters (id) on delete cascade,
  label text not null,
  revealed_at timestamptz,
  primary key (character_id, other_id)
);

create table if not exists public.anime_characters (
  anime_id int not null references public.anime (id) on delete cascade,
  character_id int not null references public.characters (id) on delete cascade,
  role text not null check (role in ('Main', 'Supporting')),
  visible_from timestamptz,
  primary key (anime_id, character_id)
);

-- One person may hold many credits; one anime has many credits.
create table if not exists public.staff_credits (
  id bigint generated always as identity primary key,
  anime_id int not null references public.anime (id) on delete cascade,
  person_id int not null references public.people (id),
  role text not null,
  note text,
  visible_from timestamptz,
  unique (anime_id, person_id, role)
);
create index if not exists staff_credits_person_idx on public.staff_credits (person_id);

create table if not exists public.voice_credits (
  anime_id int not null references public.anime (id) on delete cascade,
  character_id int not null references public.characters (id) on delete cascade,
  person_id int not null references public.people (id),
  language text not null check (language in ('Japanese', 'English')),
  visible_from timestamptz,
  primary key (anime_id, character_id, person_id, language)
);
create index if not exists voice_credits_person_idx on public.voice_credits (person_id);

create table if not exists public.theme_songs (
  id bigint generated always as identity primary key,
  anime_id int not null references public.anime (id) on delete cascade,
  kind text not null check (kind in ('Opening', 'Ending', 'Insert')),
  title text not null,
  artist text not null,
  note text,
  visible_from timestamptz,
  unique (anime_id, kind, title)
);

create table if not exists public.manga (
  id int primary key,
  slug text not null,
  title text not null,
  title_japanese text,
  type text not null,
  status text,
  volumes int,
  chapters int,
  published text,
  serialization text,
  synopsis text,
  visible_from timestamptz,
  provenance public.provenance not null default 'documented',
  sources text[] not null default '{}'
);

create table if not exists public.manga_authors (
  manga_id int not null references public.manga (id) on delete cascade,
  person_id int not null references public.people (id),
  role text not null,
  primary key (manga_id, person_id, role)
);

create table if not exists public.related_entries (
  id bigint generated always as identity primary key,
  source_type text not null check (source_type in ('anime', 'manga')),
  source_id int not null,
  target_type text not null check (target_type in ('anime', 'manga')),
  target_id int not null,
  kind text not null,
  note text,
  visible_from timestamptz,
  unique (source_type, source_id, target_type, target_id, kind)
);

create table if not exists public.media (
  id bigint generated always as identity primary key,
  anime_id int references public.anime (id) on delete cascade,
  kind text not null check (kind in ('cover', 'key_visual', 'logo', 'video')),
  url text not null,
  caption text,
  visible_from timestamptz,
  unique (anime_id, kind, url)
);

-- Archived statistics (e.g. a score captured on a given date).
create table if not exists public.historical_stat_snapshots (
  id bigint generated always as identity primary key,
  subject_type text not null check (subject_type in ('anime', 'thread', 'site')),
  subject_id text not null,
  metric text not null,
  value numeric not null,
  captured_at timestamptz not null,
  source text,
  unique (subject_type, subject_id, metric, captured_at)
);
create index if not exists hss_subject_idx on public.historical_stat_snapshots (subject_type, subject_id, captured_at);

create table if not exists public.news_posts (
  id int primary key,
  slug text not null,
  title text not null,
  published_at timestamptz not null,
  author text not null,
  body text not null,
  provenance public.provenance not null,
  source text
);
create index if not exists news_published_idx on public.news_posts (published_at desc);

create table if not exists public.historical_events (
  id text primary key,
  at timestamptz not null,
  label text not null,
  subject_type text,
  subject_id int,
  provenance public.provenance not null,
  source text
);
create index if not exists historical_events_at_idx on public.historical_events (at);

-- ===========================================================================
-- Members
-- ===========================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_-]{3,20}$'),
  avatar text not null default 'av-default',
  about text not null default '' check (char_length(about) <= 2000),
  location text not null default '' check (char_length(location) <= 60),
  time_zone text not null default 'JST',
  favorites jsonb not null default '{"anime":[],"manga":[],"characters":[],"people":[]}'::jsonb,
  joined_at timestamptz not null,
  recorded_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

-- Members known only from the recovered archive (no auth account).
create table if not exists public.archive_members (
  name text primary key,
  avatar text not null,
  rank text not null,
  joined_at timestamptz,
  joined_label text,
  moderator boolean not null default false,
  provenance public.provenance not null default 'archived'
);
create unique index if not exists archive_members_lower_idx on public.archive_members (lower(name));

create table if not exists public.anime_list_entries (
  user_id uuid not null references public.profiles (id) on delete cascade,
  anime_id int not null references public.anime (id),
  status public.list_status not null,
  episodes_watched int not null default 0 check (episodes_watched >= 0),
  score int check (score is null or score between 1 and 10),
  start_date date,
  finish_date date,
  notes text not null default '' check (char_length(notes) <= 1000),
  updated_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  primary key (user_id, anime_id),
  check (finish_date is null or start_date is null or finish_date >= start_date)
);
create index if not exists list_entries_anime_idx on public.anime_list_entries (anime_id);

create table if not exists public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_name text not null,
  since timestamptz not null,
  primary key (user_id, friend_name)
);

-- ===========================================================================
-- Forums
-- ===========================================================================

create table if not exists public.forum_boards (
  slug text primary key,
  name text not null,
  description text not null,
  group_name text not null,
  position int not null
);

create table if not exists public.forum_threads (
  id text primary key,
  board text not null references public.forum_boards (slug),
  title text not null check (char_length(title) between 4 and 160),
  author_name text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null,
  created_tz text not null default 'JST',
  anime_id int references public.anime (id),
  episode int,
  pinned boolean not null default false,
  locked boolean not null default false,
  parent_thread_id text references public.forum_threads (id),
  posts_recovered boolean not null default true,
  provenance public.provenance not null,
  recorded_at timestamptz not null default now()
);
create index if not exists forum_threads_board_idx on public.forum_threads (board, created_at desc);
create index if not exists forum_threads_anime_idx on public.forum_threads (anime_id);

-- Archived aggregate counts for a thread, captured at a moment.
create table if not exists public.forum_thread_snapshots (
  thread_id text primary key references public.forum_threads (id) on delete cascade,
  captured_at timestamptz not null,
  replies int not null,
  views int not null,
  last_reply_at timestamptz not null,
  last_reply_by text not null,
  status text not null,
  sidebar jsonb not null default '{}'::jsonb
);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null references public.forum_threads (id) on delete cascade,
  number int not null check (number > 0),
  author_name text not null,
  author_id uuid references public.profiles (id) on delete set null,
  avatar text,
  author_rank text,
  author_post_count int,
  author_online boolean,
  body text not null check (char_length(body) between 1 and 20000),
  posted_at timestamptz not null,
  posted_tz text not null default 'JST',
  edited_at timestamptz,
  edit_reason text,
  announcement boolean not null default false,
  provenance public.provenance not null,
  recorded_at timestamptz not null default now(),
  unique (thread_id, number)
);
create index if not exists forum_posts_thread_idx on public.forum_posts (thread_id, number);
create index if not exists forum_posts_posted_idx on public.forum_posts (posted_at);
create index if not exists forum_posts_author_idx on public.forum_posts (author_id);

create table if not exists public.thread_follows (
  user_id uuid not null references public.profiles (id) on delete cascade,
  thread_id text not null references public.forum_threads (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, thread_id)
);

create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  thread_id text not null references public.forum_threads (id) on delete cascade,
  post_key text not null,
  reason text not null check (char_length(reason) between 5 and 1000),
  reported_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (reporter_id, post_key)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  anime_id int not null references public.anime (id),
  author_id uuid references public.profiles (id) on delete cascade,
  author_name text not null,
  posted_at timestamptz not null,
  episodes_seen int not null check (episodes_seen > 0),
  overall int not null check (overall between 1 and 10),
  story int not null check (story between 1 and 10),
  animation int not null check (animation between 1 and 10),
  sound int not null check (sound between 1 and 10),
  character int not null check (character between 1 and 10),
  enjoyment int not null check (enjoyment between 1 and 10),
  body text not null check (char_length(body) between 200 and 10000),
  helpful int,
  provenance public.provenance not null,
  -- Stable key for seeded (reconstructed) rows so the seed can be re-run.
  seed_key text unique,
  recorded_at timestamptz not null default now()
);
create unique index if not exists reviews_one_per_member_idx on public.reviews (author_id, anime_id) where author_id is not null;
create index if not exists reviews_anime_idx on public.reviews (anime_id, posted_at desc);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  from_id int not null references public.anime (id),
  to_id int not null references public.anime (id),
  author_id uuid references public.profiles (id) on delete cascade,
  author_name text not null,
  reason text not null check (char_length(reason) between 40 and 1500),
  posted_at timestamptz not null,
  provenance public.provenance not null,
  seed_key text unique,
  recorded_at timestamptz not null default now(),
  check (from_id <> to_id)
);
create unique index if not exists recommendations_unique_idx on public.recommendations (author_id, from_id, to_id) where author_id is not null;

-- ===========================================================================
-- Account creation trigger
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := new.raw_user_meta_data ->> 'username';
begin
  if v_username is null or v_username !~ '^[A-Za-z0-9_-]{3,20}$' then
    raise exception 'invalid username';
  end if;
  if exists (select 1 from public.archive_members where lower(name) = lower(v_username)) then
    raise exception 'username taken';
  end if;
  insert into public.profiles (id, username, avatar, joined_at)
  values (
    new.id,
    v_username,
    coalesce(new.raw_user_meta_data ->> 'avatar', 'av-default'),
    coalesce((new.raw_user_meta_data ->> 'joined_at')::timestamptz, '2013-10-24 03:00:00+00')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- Forum functions: numbering and rate limits happen in the database
-- ===========================================================================

create or replace function public.create_forum_post(p_thread_id text, p_body text, p_posted_at timestamptz, p_number_floor int default 0)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_thread public.forum_threads;
  v_number int;
  v_id uuid;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into v_profile from public.profiles where id = v_uid;
  if not found then raise exception 'profile missing'; end if;
  select * into v_thread from public.forum_threads where id = p_thread_id;
  if not found then raise exception 'thread not found'; end if;
  if v_thread.locked then raise exception 'thread locked'; end if;
  if p_posted_at < v_thread.created_at or p_posted_at < v_profile.joined_at then
    raise exception 'post predates thread or account';
  end if;
  if char_length(trim(p_body)) < 2 or char_length(p_body) > 10000 then raise exception 'invalid body'; end if;
  if exists (
    select 1 from public.forum_posts
    where author_id = v_uid and recorded_at > now() - interval '10 seconds'
  ) then
    raise exception 'Please wait a few seconds before posting again.';
  end if;
  perform pg_advisory_xact_lock(hashtext('forum_thread:' || p_thread_id));
  select greatest(coalesce(max(number), 0), coalesce(p_number_floor, 0)) + 1 into v_number
    from public.forum_posts where thread_id = p_thread_id;
  insert into public.forum_posts (thread_id, number, author_name, author_id, avatar, body, posted_at, posted_tz, provenance)
  values (p_thread_id, v_number, v_profile.username, v_uid, v_profile.avatar, p_body, p_posted_at, v_profile.time_zone, 'member')
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.create_forum_thread(p_board text, p_title text, p_anime_id int, p_created_at timestamptz, p_body text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_id text := 'm-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into v_profile from public.profiles where id = v_uid;
  if not found then raise exception 'profile missing'; end if;
  if p_board = 'episode' or not exists (select 1 from public.forum_boards where slug = p_board) then
    raise exception 'invalid board';
  end if;
  if p_created_at < v_profile.joined_at then raise exception 'thread predates account'; end if;
  if exists (
    select 1 from public.forum_threads
    where created_by = v_uid and recorded_at > now() - interval '30 seconds'
  ) then
    raise exception 'Please wait a little before starting another topic.';
  end if;
  insert into public.forum_threads (id, board, title, author_name, created_by, created_at, created_tz, anime_id, provenance)
  values (v_id, p_board, p_title, v_profile.username, v_uid, p_created_at, v_profile.time_zone, p_anime_id, 'member');
  insert into public.forum_posts (thread_id, number, author_name, author_id, avatar, body, posted_at, posted_tz, provenance)
  values (v_id, 1, v_profile.username, v_uid, v_profile.avatar, p_body, p_created_at, v_profile.time_zone, 'member');
  return v_id;
end;
$$;

revoke all on function public.create_forum_post(text, text, timestamptz, int) from public;
revoke all on function public.create_forum_thread(text, text, int, timestamptz, text) from public;
grant execute on function public.create_forum_post(text, text, timestamptz, int) to authenticated;
grant execute on function public.create_forum_thread(text, text, int, timestamptz, text) to authenticated;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

do $$
declare t text;
begin
  -- Catalogue and archive tables: readable by everyone, written only by the
  -- service role (seed scripts / future admin tools).
  foreach t in array array[
    'franchises', 'seasons', 'companies', 'people', 'anime', 'genres', 'anime_genres', 'anime_background',
    'anime_broadcasts', 'anime_companies', 'episodes', 'characters', 'character_facts', 'character_relationships',
    'anime_characters', 'staff_credits', 'voice_credits', 'theme_songs', 'manga', 'manga_authors',
    'related_entries', 'media', 'historical_stat_snapshots', 'news_posts', 'historical_events',
    'archive_members', 'forum_boards', 'forum_thread_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public read" on public.%I', t);
    execute format('create policy "Public read" on public.%I for select using (true)', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public" on public.profiles for select using (true);
drop policy if exists "Members update their own profile" on public.profiles;
create policy "Members update their own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
-- joined_at and username are fixed after sign-up.
revoke update on public.profiles from authenticated;
grant update (avatar, about, location, time_zone, favorites) on public.profiles to authenticated;

alter table public.anime_list_entries enable row level security;
drop policy if exists "Lists are public" on public.anime_list_entries;
create policy "Lists are public" on public.anime_list_entries for select using (true);
drop policy if exists "Members manage their own list" on public.anime_list_entries;
create policy "Members manage their own list" on public.anime_list_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.friendships enable row level security;
drop policy if exists "Friend lists are public" on public.friendships;
create policy "Friend lists are public" on public.friendships for select using (true);
drop policy if exists "Members manage their own friends" on public.friendships;
create policy "Members manage their own friends" on public.friendships for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.forum_threads enable row level security;
drop policy if exists "Threads are public" on public.forum_threads;
create policy "Threads are public" on public.forum_threads for select using (true);
-- Inserts go through create_forum_thread().

alter table public.forum_posts enable row level security;
drop policy if exists "Posts are public" on public.forum_posts;
create policy "Posts are public" on public.forum_posts for select using (true);
-- Inserts go through create_forum_post().

alter table public.thread_follows enable row level security;
drop policy if exists "Members see their own follows" on public.thread_follows;
create policy "Members see their own follows" on public.thread_follows for select using (auth.uid() = user_id);
drop policy if exists "Members manage their own follows" on public.thread_follows;
create policy "Members manage their own follows" on public.thread_follows for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.post_reports enable row level security;
drop policy if exists "Members see their own reports" on public.post_reports;
create policy "Members see their own reports" on public.post_reports for select using (auth.uid() = reporter_id);
drop policy if exists "Members file reports" on public.post_reports;
create policy "Members file reports" on public.post_reports for insert with check (auth.uid() = reporter_id);

alter table public.reviews enable row level security;
drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews for select using (true);
drop policy if exists "Members write their own reviews" on public.reviews;
create policy "Members write their own reviews" on public.reviews for insert
  with check (auth.uid() = author_id and provenance = 'member');

alter table public.recommendations enable row level security;
drop policy if exists "Recommendations are public" on public.recommendations;
create policy "Recommendations are public" on public.recommendations for select using (true);
drop policy if exists "Members write their own recommendations" on public.recommendations;
create policy "Members write their own recommendations" on public.recommendations for insert
  with check (auth.uid() = author_id and provenance = 'member');
