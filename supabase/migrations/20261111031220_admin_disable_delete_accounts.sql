alter table public.profiles add column if not exists disabled_at timestamptz;
alter table public.feedback alter column user_id drop not null;
alter table public.feedback drop constraint if exists feedback_user_id_fkey;
alter table public.feedback add constraint feedback_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;
create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path to '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and approved_at is not null and disabled_at is null)
      or exists(select 1 from public.coaches where user_id = (select auth.uid()))
$$;
create or replace function public.account_status() returns text
language sql stable security definer set search_path to '' as $$
  select case
    when exists(select 1 from public.coaches where user_id = (select auth.uid())) then 'ok'
    when exists(select 1 from public.profiles where id = (select auth.uid()) and disabled_at is not null) then 'disabled'
    when exists(select 1 from public.profiles where id = (select auth.uid()) and approved_at is not null) then 'ok'
    else 'none' end
$$;
create or replace function public.admin_set_disabled(p_user uuid, p_disabled boolean) returns void
language plpgsql volatile security definer set search_path to '' as $$
begin
  if not (select public.is_app_owner()) then raise exception 'Only the app owner can do this' using errcode = '42501'; end if;
  if p_user = (select auth.uid()) or exists(select 1 from public.coaches where user_id = p_user) or exists(select 1 from public.app_owners where user_id = p_user)
    then raise exception 'Coach and owner accounts can''t be disabled' using errcode = '42501'; end if;
  update public.profiles set disabled_at = case when p_disabled then now() else null end where id = p_user;
  if not found then raise exception 'No such account'; end if;
end $$;
create or replace function public.admin_delete_account(p_user uuid) returns void
language plpgsql volatile security definer set search_path to '' as $$
begin
  if not (select public.is_app_owner()) then raise exception 'Only the app owner can do this' using errcode = '42501'; end if;
  if p_user = (select auth.uid()) or exists(select 1 from public.coaches where user_id = p_user) or exists(select 1 from public.app_owners where user_id = p_user)
    then raise exception 'Coach and owner accounts can''t be deleted' using errcode = '42501'; end if;
  if not exists(select 1 from auth.users where id = p_user) then raise exception 'No such account'; end if;
  delete from public.feedback where user_id = p_user and kind <> 'app';
  update public.feedback set workout = null where user_id = p_user and kind = 'app';
  delete from auth.users where id = p_user;
end $$;
revoke execute on function public.account_status(), public.admin_set_disabled(uuid, boolean), public.admin_delete_account(uuid) from public, anon;
grant execute on function public.account_status(), public.admin_set_disabled(uuid, boolean), public.admin_delete_account(uuid) to authenticated;
create or replace function public.is_staff(p_user uuid) returns boolean
language sql stable security definer set search_path to '' as $$
  select exists(select 1 from public.coaches where user_id = p_user) or exists(select 1 from public.app_owners where user_id = p_user)
$$;
revoke execute on function public.is_staff(uuid) from public, anon;
grant execute on function public.is_staff(uuid) to authenticated;
drop function if exists public.coach_people();
create function public.coach_people()
 returns table(id uuid, name text, email text, joined timestamptz, last_seen timestamptz, last_workout timestamptz, workouts_7d integer, workouts_28d integer, workouts_total integer, pending_update boolean, disabled_at timestamptz, staff boolean)
 language sql stable set search_path to '' as $$
  select p.id, p.name, p.email, p.created_at, p.last_seen,
    (select max(w.date) from public.workout_logs w where w.user_id = p.id),
    (select count(*)::int from public.workout_logs w where w.user_id = p.id and w.date > now() - interval '7 days'),
    (select count(*)::int from public.workout_logs w where w.user_id = p.id and w.date > now() - interval '28 days'),
    (select count(*)::int from public.workout_logs w where w.user_id = p.id),
    exists(select 1 from public.plan_updates u where u.user_id = p.id and u.applied_at is null),
    p.disabled_at,
    public.is_staff(p.id)
  from public.profiles p
  where (select public.is_coach()) and p.approved_at is not null and (p.disabled_at is null or (select public.is_app_owner()))
  order by p.name nulls last
$$;
revoke execute on function public.coach_people() from public, anon;
grant execute on function public.coach_people() to authenticated;
