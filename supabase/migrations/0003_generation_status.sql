-- Track background BuildBrief generation on the project itself, so the UI
-- can show when it is still running, when it finished, and why it failed,
-- without anyone having to read server logs.

alter table public.projects
  add column if not exists generation_status text
    check (generation_status in ('generating', 'done', 'failed')),
  add column if not exists generation_error text,
  add column if not exists generation_started_at timestamptz;

update public.projects
  set generation_status = 'done'
  where generated_brief is not null and generation_status is null;
