-- Lumine StarWorks Anime Industry Archive — core schema.
--
-- Normalized tables for franchises, productions, broadcast runs, episodes,
-- studios, people, credits, music, companies, related media, source
-- documents, field-level provenance, revisions and conflicts.
--
-- Every archive table is readable by anyone. Writes require the `editor` or
-- `admin` role in archive_profiles, enforced by Row Level Security. The app
-- writes through archive_apply_changes(), which applies a whole change set
-- in one transaction.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Editors
-- ---------------------------------------------------------------------------
create table if not exists public.archive_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'viewer' check (role in ('viewer', 'editor', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.archive_profiles enable row level security;

create or replace function public.archive_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.archive_profiles where id = auth.uid()), 'anonymous');
$$;

create or replace function public.is_archive_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.archive_role() in ('editor', 'admin');
$$;

create policy "Members can read their own profile; admins read all"
  on public.archive_profiles for select
  using (auth.uid() = id or public.archive_role() = 'admin');

create policy "Members can rename themselves without changing their role"
  on public.archive_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.archive_role());

create policy "Admins manage roles"
  on public.archive_profiles for update
  using (public.archive_role() = 'admin')
  with check (public.archive_role() = 'admin');

create or replace function public.handle_new_archive_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.archive_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_archive on auth.users;
create trigger on_auth_user_created_archive
  after insert on auth.users
  for each row execute procedure public.handle_new_archive_user();

-- ---------------------------------------------------------------------------
-- Shared check lists
-- ---------------------------------------------------------------------------
-- Provenance: confirmed | provisional | proposed | conflicting | superseded

-- ---------------------------------------------------------------------------
-- Source documents
-- ---------------------------------------------------------------------------
create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  kind text not null check (kind in ('brief', 'production_document', 'press_release', 'import', 'editorial')),
  description text,
  reference text,
  received_at date not null,
  provenance text not null default 'confirmed' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Core entities
-- ---------------------------------------------------------------------------
create table if not exists public.franchises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_native text,
  description text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_native text,
  founded_year integer check (founded_year between 1900 and 2100),
  location text,
  founders text[] not null default '{}',
  animation_style text,
  description text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_native text,
  aliases text[] not null default '{}',
  occupations text[] not null default '{}',
  bio text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_native text,
  kind text not null check (kind in ('production', 'broadcaster', 'licensor', 'distributor', 'streaming', 'music_label', 'other')),
  country text,
  description text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.productions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  franchise_id uuid references public.franchises (id) on delete set null,
  franchise_order integer,
  season_number integer,
  title text not null,
  title_native text,
  title_romaji text,
  alt_titles text[] not null default '{}',
  format text not null check (format in ('tv', 'tv_special', 'film', 'ova', 'ona', 'special', 'music_video')),
  synopsis text,
  genres text[] not null default '{}',
  themes text[] not null default '{}',
  source_material text check (source_material in ('original', 'manga', 'web_manga', 'light_novel', 'novel', 'visual_novel', 'game', 'music', 'other')),
  demographic text check (demographic in ('shounen', 'shoujo', 'seinen', 'josei', 'kids', 'general')),
  age_rating text check (age_rating in ('G', 'PG', 'PG-13', 'R-15+', 'R-17+')),
  premiere_year integer check (premiere_year between 1900 and 2100),
  premiere_season text check (premiere_season in ('winter', 'spring', 'summer', 'fall')),
  premiere_date date,
  finale_date date,
  episode_count integer check (episode_count >= 0),
  runtime_minutes integer check (runtime_minutes > 0),
  production_history text,
  reception text,
  score numeric(4, 2) check (score between 0 and 10),
  poster_url text,
  notes text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint productions_finale_after_premiere check (finale_date is null or premiere_date is null or finale_date >= premiere_date),
  constraint productions_season_needs_year check (premiere_season is null or premiere_year is not null)
);

create index if not exists productions_franchise_idx on public.productions (franchise_id);
create index if not exists productions_premiere_idx on public.productions (premiere_year, premiere_season);
create index if not exists productions_premiere_date_idx on public.productions (premiere_date);

-- ---------------------------------------------------------------------------
-- Production relationships
-- ---------------------------------------------------------------------------
create table if not exists public.production_studios (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions (id) on delete cascade,
  studio_id uuid not null references public.studios (id) on delete restrict,
  role text not null default 'animation' check (role in ('animation', 'co_animation', 'assistance')),
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (production_id, studio_id, role)
);
create index if not exists production_studios_studio_idx on public.production_studios (studio_id);

create table if not exists public.production_companies (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete restrict,
  role text not null check (role in ('production_committee', 'producer', 'licensor', 'distributor', 'streaming', 'music')),
  region text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (production_id, company_id, role)
);
create index if not exists production_companies_company_idx on public.production_companies (company_id);

-- Japanese television broadcasts, advance broadcasts, streaming premieres,
-- English dubs, theatrical and home-video releases are all separate runs.
create table if not exists public.broadcast_runs (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions (id) on delete cascade,
  kind text not null check (kind in ('tv', 'advance', 'streaming', 'special_broadcast', 'dub', 'theatrical', 'home_video')),
  label text,
  language text not null default 'ja',
  region text,
  network_id uuid references public.companies (id) on delete set null,
  start_date date,
  end_date date,
  weekday smallint check (weekday between 0 and 6),
  local_time text check (local_time ~ '^([01][0-9]|2[0-9]):[0-5][0-9]$'),
  time_zone text,
  cadence text not null default 'weekly' check (cadence in ('weekly', 'daily', 'single', 'irregular')),
  episode_count integer check (episode_count >= 0),
  skipped_dates date[] not null default '{}',
  is_primary boolean not null default false,
  notes text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broadcast_runs_end_after_start check (end_date is null or start_date is null or end_date >= start_date)
);
create index if not exists broadcast_runs_production_idx on public.broadcast_runs (production_id);
create index if not exists broadcast_runs_dates_idx on public.broadcast_runs (start_date, end_date);

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions (id) on delete cascade,
  number numeric(7, 2) not null check (number >= 0),
  title text,
  title_native text,
  synopsis text,
  runtime_minutes integer check (runtime_minutes > 0),
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (production_id, number)
);

-- One episode can air on many dates: Japanese broadcast, advance broadcast, dub, regional simulcasts.
create table if not exists public.episode_releases (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes (id) on delete cascade,
  broadcast_run_id uuid not null references public.broadcast_runs (id) on delete cascade,
  air_date date not null,
  air_time text check (air_time ~ '^([01][0-9]|2[0-9]):[0-5][0-9]$'),
  notes text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, broadcast_run_id)
);

create table if not exists public.production_credits (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete restrict,
  role text not null check (role in (
    'original_creator', 'director', 'assistant_director', 'series_composition', 'screenplay', 'storyboard',
    'character_design', 'chief_animation_director', 'animation_director', 'action_choreographer', 'mecha_design',
    'art_director', 'color_design', 'director_of_photography', 'cg_director', 'editing', 'sound_director', 'music',
    'producer', 'animation_producer', 'other'
  )),
  role_detail text,
  sort_order integer not null default 0,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (production_id, person_id, role)
);
create index if not exists production_credits_person_idx on public.production_credits (person_id);

create table if not exists public.voice_credits (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete restrict,
  character_name text not null,
  character_name_native text,
  language text check (language in ('ja', 'en')),
  credit_type text not null default 'voice' check (credit_type in ('voice', 'singing_voice', 'appearance')),
  billing text check (billing in ('main', 'supporting', 'guest')),
  notes text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists voice_credits_natural_key on public.voice_credits (production_id, person_id, character_name, coalesce(language, ''));
create index if not exists voice_credits_person_idx on public.voice_credits (person_id);

-- ---------------------------------------------------------------------------
-- Music
-- ---------------------------------------------------------------------------
create table if not exists public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_native text,
  kind text not null default 'song' check (kind in ('song', 'score', 'single', 'album', 'soundtrack')),
  release_date date,
  release_year integer check (release_year between 1900 and 2100),
  label_id uuid references public.companies (id) on delete set null,
  catalog_number text,
  notes text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.track_credits (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.music_tracks (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete restrict,
  role text not null check (role in ('performer', 'composer', 'lyricist', 'arranger')),
  credited_as text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track_id, person_id, role)
);
create index if not exists track_credits_person_idx on public.track_credits (person_id);

create table if not exists public.theme_songs (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions (id) on delete cascade,
  track_id uuid not null references public.music_tracks (id) on delete restrict,
  usage text not null check (usage in ('opening', 'ending', 'insert', 'soundtrack', 'image_song')),
  sequence integer,
  episodes text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (production_id, track_id, usage)
);

create table if not exists public.related_media (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions (id) on delete cascade,
  related_production_id uuid not null references public.productions (id) on delete cascade,
  relation text not null check (relation in ('sequel', 'prequel', 'side_story', 'special', 'film', 'ova', 'spin_off', 'compilation', 'alternative', 'parent_story')),
  notes text,
  provenance text not null default 'provisional' check (provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (production_id, related_production_id, relation),
  constraint related_media_not_self check (production_id <> related_production_id)
);

-- ---------------------------------------------------------------------------
-- Provenance, history and corrections
-- ---------------------------------------------------------------------------
create table if not exists public.fact_sources (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  field text,
  source_document_id uuid not null references public.source_documents (id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists fact_sources_entity_idx on public.fact_sources (entity_type, entity_id);

create table if not exists public.revisions (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('create', 'update', 'delete', 'restore', 'import', 'resolve')),
  summary text not null,
  before jsonb,
  after jsonb,
  changed_fields text[] not null default '{}',
  author text,
  source_document_id uuid references public.source_documents (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists revisions_entity_idx on public.revisions (entity_type, entity_id, created_at desc);
create index if not exists revisions_batch_idx on public.revisions (batch_id);

create table if not exists public.record_conflicts (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  field text not null,
  current_value jsonb,
  proposed_value jsonb,
  current_provenance text not null check (current_provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  proposed_provenance text not null check (proposed_provenance in ('confirmed', 'provisional', 'proposed', 'conflicting', 'superseded')),
  source_document_id uuid references public.source_documents (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'accepted', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);
create index if not exists record_conflicts_open_idx on public.record_conflicts (status, entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: everyone reads, editors write
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'source_documents', 'franchises', 'studios', 'people', 'companies', 'productions',
    'production_studios', 'production_companies', 'broadcast_runs', 'episodes', 'episode_releases',
    'production_credits', 'voice_credits', 'music_tracks', 'track_credits', 'theme_songs',
    'related_media', 'fact_sources', 'revisions', 'record_conflicts'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Archive is public" on public.%I', t);
    execute format('create policy "Archive is public" on public.%I for select using (true)', t);
    execute format('drop policy if exists "Editors can insert" on public.%I', t);
    execute format('create policy "Editors can insert" on public.%I for insert with check (public.is_archive_editor())', t);
    execute format('drop policy if exists "Editors can update" on public.%I', t);
    execute format('create policy "Editors can update" on public.%I for update using (public.is_archive_editor()) with check (public.is_archive_editor())', t);
    execute format('drop policy if exists "Editors can delete" on public.%I', t);
    execute format('create policy "Editors can delete" on public.%I for delete using (public.is_archive_editor())', t);
  end loop;
end;
$$;

-- Revisions are append-only history: nobody edits or deletes them through the API.
drop policy if exists "Editors can update" on public.revisions;
drop policy if exists "Editors can delete" on public.revisions;

-- ---------------------------------------------------------------------------
-- Atomic change sets
-- ---------------------------------------------------------------------------
-- changes = { "upserts": { "<table>": [rows…] }, "deletes": { "<table>": [ids…] } }
-- Runs as the calling user (security invoker), so the RLS policies above apply.
create or replace function public.archive_apply_changes(changes jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  table_order text[] := array[
    'source_documents', 'franchises', 'studios', 'people', 'companies', 'productions',
    'production_studios', 'production_companies', 'broadcast_runs', 'episodes', 'episode_releases',
    'production_credits', 'voice_credits', 'music_tracks', 'track_credits', 'theme_songs',
    'related_media', 'fact_sources', 'revisions', 'record_conflicts'
  ];
  t text;
  i integer;
  assignments text;
begin
  if not public.is_archive_editor() then
    raise exception 'Editor access is required to change the archive' using errcode = '42501';
  end if;

  -- Deletes run children-first.
  for i in reverse array_length(table_order, 1)..1 loop
    t := table_order[i];
    if t = 'revisions' then
      continue;
    end if;
    if changes -> 'deletes' ? t and jsonb_array_length(changes -> 'deletes' -> t) > 0 then
      execute format('delete from public.%I where id in (select value::uuid from jsonb_array_elements_text($1))', t)
        using changes -> 'deletes' -> t;
    end if;
  end loop;

  -- Upserts run parents-first.
  foreach t in array table_order loop
    if changes -> 'upserts' ? t and jsonb_array_length(changes -> 'upserts' -> t) > 0 then
      select string_agg(format('%I = excluded.%I', column_name, column_name), ', ')
        into assignments
        from information_schema.columns
        where table_schema = 'public' and table_name = t and column_name <> 'id';
      if t = 'revisions' then
        execute format('insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1) on conflict (id) do nothing', t, t)
          using changes -> 'upserts' -> t;
      else
        execute format('insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1) on conflict (id) do update set %s', t, t, assignments)
          using changes -> 'upserts' -> t;
      end if;
    end if;
  end loop;
end;
$$;

revoke execute on function public.archive_apply_changes(jsonb) from public, anon;
grant execute on function public.archive_apply_changes(jsonb) to authenticated;
