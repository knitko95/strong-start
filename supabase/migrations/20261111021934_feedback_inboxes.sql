-- Who owns the app (gets App feedback). Separate from coaches.
create table public.app_owners(
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_owners enable row level security;
revoke all on public.app_owners from anon, authenticated;

create or replace function public.is_app_owner() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.app_owners where user_id = (select auth.uid())) $$;
revoke execute on function public.is_app_owner() from anon;

-- Account-specific owner assignment omitted from this portable migration.
-- Provision staff separately after explicit owner approval.

-- Feedback: kind 'app' goes only to the app owner; kind 'coach' goes to coaches.
create table public.feedback(
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('app','coach')),
  tag text,
  message text not null check (char_length(btrim(message)) between 1 and 4000),
  screen text check (char_length(screen) <= 200),
  device text check (char_length(device) <= 300),
  workout jsonb check (workout is null or pg_column_size(workout) <= 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  done_at timestamptz,
  constraint feedback_tag_ok check (tag is null
    or (kind='app' and tag in ('bug','idea','confusing','exercise'))
    or (kind='coach' and tag in ('too_hard','too_easy','hurt','question')))
);
create index feedback_user_idx on public.feedback(user_id);
create index feedback_kind_created_idx on public.feedback(kind, created_at desc);
alter table public.feedback enable row level security;

revoke all on public.feedback from anon, authenticated;
grant select on public.feedback to authenticated;
grant insert (kind, tag, message, screen, device, workout) on public.feedback to authenticated;
grant update (read_at, done_at) on public.feedback to authenticated;

create policy "feedback: send own" on public.feedback for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "feedback: read own or inbox" on public.feedback for select to authenticated
  using (user_id = (select auth.uid())
    or (kind='coach' and (select public.is_coach()))
    or (kind='app' and (select public.is_app_owner())));
create policy "feedback: inbox marks read/done" on public.feedback for update to authenticated
  using ((kind='coach' and (select public.is_coach())) or (kind='app' and (select public.is_app_owner())))
  with check ((kind='coach' and (select public.is_coach())) or (kind='app' and (select public.is_app_owner())));

-- App owner can see the names of people who send app feedback
drop policy "profiles: read own or coach" on public.profiles;
create policy "profiles: read own or coach" on public.profiles for select
  using (id = (select auth.uid()) or (select public.is_coach()) or (select public.is_app_owner()));
