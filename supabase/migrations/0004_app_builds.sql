-- "Build App": BuildBrief can turn a blueprint into a playable, single-file
-- web app. The result and its progress live on the project, just like the
-- brief itself.

alter table public.projects
  add column if not exists app_html text,
  add column if not exists app_status text
    check (app_status in ('building', 'done', 'failed')),
  add column if not exists app_error text,
  add column if not exists app_started_at timestamptz;

-- App builds get their own daily allowance, tracked alongside brief generations.
alter table public.generation_events
  drop constraint if exists generation_events_kind_check;
alter table public.generation_events
  add constraint generation_events_kind_check
    check (kind in ('create', 'regenerate', 'build'));
