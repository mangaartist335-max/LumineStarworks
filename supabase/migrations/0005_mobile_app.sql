-- Native mobile app support. Non-destructive: only adds columns and a
-- function; existing tables, rows and policies are unchanged.

-- Project workspace: archive instead of delete, and per-task checklist state.
alter table public.projects
  add column if not exists archived_at timestamptz,
  add column if not exists task_progress jsonb not null default '{}'::jsonb;

-- Where to send "your blueprint / app is ready" push notifications.
alter table public.profiles
  add column if not exists expo_push_token text;

-- Lets a signed-in user permanently delete their own account (projects,
-- profile and generation history go with it through the existing
-- "on delete cascade" foreign keys). Runs with elevated rights, but only
-- ever touches auth.uid(), so no service-role key is needed in any client.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
