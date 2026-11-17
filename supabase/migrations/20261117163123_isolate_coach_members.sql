-- Invite ownership is the coaching boundary. Owner membership does not bypass it.
-- Definer lookup avoids recursive profiles RLS; the caller is always auth.uid().
create function private.coach_member_allowed(p_member uuid, p_include_disabled boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and p_member <> auth.uid()
    and exists(select 1 from public.coaches r join public.profiles c on c.id=r.user_id
      join public.profiles m on m.invited_by=c.id
      where c.id=auth.uid() and c.disabled_at is null and m.id=p_member
        and m.approved_at is not null
        and (m.disabled_at is null or (p_include_disabled and public.is_app_owner()))
        and not exists(select 1 from public.coaches other where other.user_id=m.id))
$$;
revoke all on function private.coach_member_allowed(uuid,boolean) from public,anon,authenticated;
grant execute on function private.coach_member_allowed(uuid,boolean) to authenticated;

alter policy "profiles: read own or coach" on public.profiles
  using(id=(select auth.uid()) or private.coach_member_allowed(id,true));
alter policy "app_state: read own or coach" on public.app_state
  using(user_id=(select auth.uid()) or private.coach_member_allowed(user_id));
alter policy "logs: read own or coach" on public.workout_logs
  using(user_id=(select auth.uid()) or private.coach_member_allowed(user_id));
alter policy "plan_updates: read own or coach" on public.plan_updates
  using(user_id=(select auth.uid()) or private.coach_member_allowed(user_id));
alter policy "plan_updates: coach sends" on public.plan_updates
  with check(created_by=(select auth.uid()) and private.coach_member_allowed(user_id));
alter policy "feedback: read own or inbox" on public.feedback
  using(user_id=(select auth.uid()) or (kind='app' and (select public.is_app_owner()))
    or (kind='coach' and private.coach_member_allowed(user_id)));

create or replace function public.coach_people()
 returns table(id uuid,name text,email text,joined timestamptz,last_seen timestamptz,last_workout timestamptz,
 workouts_7d integer,workouts_28d integer,workouts_total integer,pending_update boolean,disabled_at timestamptz,staff boolean)
 language sql stable security invoker set search_path='' as $$
 select p.id,p.name,p.email,p.created_at,p.last_seen,
   (select max(w.date) from public.workout_logs w where w.user_id=p.id),
   (select count(*)::int from public.workout_logs w where w.user_id=p.id and w.date>now()-interval '7 days'),
   (select count(*)::int from public.workout_logs w where w.user_id=p.id and w.date>now()-interval '28 days'),
   (select count(*)::int from public.workout_logs w where w.user_id=p.id),
   exists(select 1 from public.plan_updates u where u.user_id=p.id and u.applied_at is null),
   p.disabled_at,public.is_staff(p.id)
 from public.profiles p where private.coach_member_allowed(p.id,true)
 order by p.name nulls last
$$;

-- Promotion to coach also ends access to their former member conversation.
create or replace function private.coach_pair_allowed(p_member uuid,p_coach uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() in (p_member,p_coach) and p_member<>p_coach
    and exists(select 1 from public.profiles m join public.profiles c on c.id=m.invited_by
      join public.coaches role on role.user_id=c.id
      where m.id=p_member and c.id=p_coach and m.approved_at is not null
        and m.disabled_at is null and c.disabled_at is null
        and not exists(select 1 from public.coaches other where other.user_id=m.id))
$$;

-- Account management follows the same owned-member list, including reactivation.
create or replace function public.admin_set_disabled(p_user uuid,p_disabled boolean) returns void
language plpgsql volatile security definer set search_path='' as $$
begin
  if not public.is_app_owner() or not private.coach_member_allowed(p_user,true) then
    raise exception 'Only the assigned coach with admin access can manage this member' using errcode='42501';
  end if;
  if public.is_staff(p_user) then raise exception 'Staff accounts cannot be disabled' using errcode='42501'; end if;
  update public.profiles set disabled_at=case when p_disabled then now() else null end where id=p_user;
end $$;
create or replace function public.admin_delete_account(p_user uuid) returns void
language plpgsql volatile security definer set search_path='' as $$
begin
  if not public.is_app_owner() or not private.coach_member_allowed(p_user,true) then
    raise exception 'Only the assigned coach with admin access can manage this member' using errcode='42501';
  end if;
  if public.is_staff(p_user) then raise exception 'Staff accounts cannot be deleted' using errcode='42501'; end if;
  delete from public.feedback where user_id=p_user and kind<>'app';
  update public.feedback set workout=null where user_id=p_user and kind='app';
  delete from auth.users where id=p_user;
end $$;
