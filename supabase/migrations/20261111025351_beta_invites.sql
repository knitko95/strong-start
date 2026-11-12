alter table public.profiles add column if not exists approved_at timestamptz;
alter table public.profiles add column if not exists invited_by uuid references auth.users(id) on delete set null;
update public.profiles set approved_at = coalesce(approved_at, created_at, now());
revoke insert, update on public.profiles from authenticated, anon;
grant insert (id, email, name, last_seen) on public.profiles to authenticated;
grant update (name, email, last_seen) on public.profiles to authenticated;
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text check (name is null or char_length(name) <= 80),
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  cancelled_at timestamptz
);
create index if not exists invites_created_by_idx on public.invites(created_by);
create index if not exists invites_used_by_idx on public.invites(used_by);
alter table public.invites enable row level security;
revoke all on public.invites from anon, authenticated;
grant select on public.invites to authenticated;
grant update (cancelled_at) on public.invites to authenticated;
create policy "invites: coach reads own" on public.invites for select to authenticated
  using (created_by = (select auth.uid()) and (select public.is_coach()));
create policy "invites: coach cancels own" on public.invites for update to authenticated
  using (created_by = (select auth.uid()) and (select public.is_coach()) and used_at is null)
  with check (created_by = (select auth.uid()) and (select public.is_coach()));
create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path to '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and approved_at is not null)
      or exists(select 1 from public.coaches where user_id = (select auth.uid()))
$$;
create or replace function public.create_invite(p_name text default null) returns table(id uuid, code text, expires_at timestamptz)
language plpgsql volatile security definer set search_path to '' as $$
declare c text; a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  if not (select public.is_coach()) then raise exception 'Only coaches can send invites' using errcode = '42501'; end if;
  loop
    c := '';
    for i in 1..10 loop c := c || substr(a, 1 + floor(random()*32)::int, 1); end loop;
    exit when not exists(select 1 from public.invites x where x.code = c);
  end loop;
  return query insert into public.invites(code, name, created_by)
    values (c, nullif(trim(p_name),''), (select auth.uid()))
    returning invites.id, invites.code, invites.expires_at;
end $$;
create or replace function public.redeem_invite(p_code text) returns text
language plpgsql volatile security definer set search_path to '' as $$
declare uid uuid := (select auth.uid()); inv public.invites;
begin
  if uid is null then return 'invalid'; end if;
  if (select public.is_approved()) then return 'already'; end if;
  select * into inv from public.invites where code = upper(trim(p_code)) for update;
  if not found then return 'invalid'; end if;
  if inv.cancelled_at is not null then return 'cancelled'; end if;
  if inv.used_by = uid then return 'already'; end if;
  if inv.used_at is not null then return 'used'; end if;
  if inv.expires_at < now() then return 'expired'; end if;
  update public.invites set used_by = uid, used_at = now() where id = inv.id;
  insert into public.profiles(id, email) select uid, u.email from auth.users u where u.id = uid on conflict (id) do nothing;
  update public.profiles set approved_at = now(), invited_by = inv.created_by,
    name = coalesce(name, inv.name) where id = uid;
  return 'ok';
end $$;
revoke execute on function public.create_invite(text), public.redeem_invite(text), public.is_approved() from public, anon;
grant execute on function public.create_invite(text), public.redeem_invite(text), public.is_approved() to authenticated;
create policy "beta: invited only" on public.app_state as restrictive for all to authenticated
  using ((select public.is_approved())) with check ((select public.is_approved()));
create policy "beta: invited only" on public.workout_logs as restrictive for all to authenticated
  using ((select public.is_approved())) with check ((select public.is_approved()));
create policy "beta: invited only" on public.feedback as restrictive for all to authenticated
  using ((select public.is_approved())) with check ((select public.is_approved()));
create policy "beta: invited only" on public.plan_updates as restrictive for all to authenticated
  using ((select public.is_approved())) with check ((select public.is_approved()));
create or replace function public.coach_people()
 returns table(id uuid, name text, email text, joined timestamptz, last_seen timestamptz, last_workout timestamptz, workouts_7d integer, workouts_28d integer, workouts_total integer, pending_update boolean)
 language sql stable set search_path to '' as $$
  select p.id, p.name, p.email, p.created_at, p.last_seen,
    (select max(w.date) from public.workout_logs w where w.user_id = p.id),
    (select count(*)::int from public.workout_logs w where w.user_id = p.id and w.date > now() - interval '7 days'),
    (select count(*)::int from public.workout_logs w where w.user_id = p.id and w.date > now() - interval '28 days'),
    (select count(*)::int from public.workout_logs w where w.user_id = p.id),
    exists(select 1 from public.plan_updates u where u.user_id = p.id and u.applied_at is null)
  from public.profiles p
  where (select public.is_coach()) and p.approved_at is not null
  order by p.name nulls last
$$;
