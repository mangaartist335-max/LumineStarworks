-- One row per BuildBrief generation request (new project or regenerate),
-- used to enforce a per-user daily generation limit.

create table if not exists public.generation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  kind text not null check (kind in ('create', 'regenerate')),
  created_at timestamptz not null default now()
);

create index if not exists generation_events_user_id_created_at_idx
  on public.generation_events (user_id, created_at desc);

alter table public.generation_events enable row level security;

-- Users can record and read their own events. There are deliberately no
-- update or delete policies, so a user can't erase events to reset their limit.
create policy "Users can view their own generation events"
  on public.generation_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generation events"
  on public.generation_events for insert
  with check (auth.uid() = user_id);
