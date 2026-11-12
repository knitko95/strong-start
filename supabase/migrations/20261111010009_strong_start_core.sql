-- Coaches: managed only from the Supabase dashboard / SQL (no API access)
create table public.coaches (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.coaches enable row level security;

create or replace function public.is_coach()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.coaches where user_id = (select auth.uid())) $$;
revoke execute on function public.is_coach() from public, anon;
grant execute on function public.is_coach() to authenticated;

-- One profile per person
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);
alter table public.profiles enable row level security;
create policy "profiles: read own or coach" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_coach()));
create policy "profiles: insert own" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, nullif(new.raw_user_meta_data->>'name',''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- The whole app state (setup, plan, working weights, settings) per person
create table public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at bigint not null default 0,   -- the app's own clock (ms)
  saved_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
create policy "app_state: read own or coach" on public.app_state for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_coach()));
create policy "app_state: insert own" on public.app_state for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "app_state: update own" on public.app_state for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- One row per finished workout
create table public.workout_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  date timestamptz not null,
  data jsonb not null,
  primary key (user_id, id)
);
create index workout_logs_user_date on public.workout_logs (user_id, date desc);
alter table public.workout_logs enable row level security;
create policy "logs: read own or coach" on public.workout_logs for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_coach()));
create policy "logs: insert own" on public.workout_logs for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "logs: update own" on public.workout_logs for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "logs: delete own" on public.workout_logs for delete to authenticated
  using (user_id = (select auth.uid()));

-- Plan changes a coach sends; the person's app applies them on next open
create table public.plan_updates (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  update jsonb not null,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);
create index plan_updates_pending on public.plan_updates (user_id) where applied_at is null;
create index plan_updates_created_by on public.plan_updates (created_by);
alter table public.plan_updates enable row level security;
create policy "plan_updates: read own or coach" on public.plan_updates for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_coach()));
create policy "plan_updates: coach sends" on public.plan_updates for insert to authenticated
  with check ((select public.is_coach()) and created_by = (select auth.uid()));
create policy "plan_updates: person marks applied" on public.plan_updates for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Coach's people list with progress at a glance (runs with the caller's permissions)
create or replace function public.coach_people()
returns table (id uuid, name text, email text, joined timestamptz, last_seen timestamptz,
               last_workout timestamptz, workouts_7d int, workouts_28d int, workouts_total int, pending_update boolean)
language sql stable security invoker set search_path = ''
as $$
  select p.id, p.name, p.email, p.created_at, p.last_seen,
    (select max(w.date) from public.workout_logs w where w.user_id = p.id),
    (select count(*)::int from public.workout_logs w where w.user_id = p.id and w.date > now() - interval '7 days'),
    (select count(*)::int from public.workout_logs w where w.user_id = p.id and w.date > now() - interval '28 days'),
    (select count(*)::int from public.workout_logs w where w.user_id = p.id),
    exists(select 1 from public.plan_updates u where u.user_id = p.id and u.applied_at is null)
  from public.profiles p
  where (select public.is_coach())
  order by p.name nulls last
$$;
revoke execute on function public.coach_people() from public, anon;
grant execute on function public.coach_people() to authenticated;
