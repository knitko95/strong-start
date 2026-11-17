-- Organization authority is independent of the app-owner/feedback role.
create table private.coaching_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);
create table private.coaching_staff (
  user_id uuid primary key references public.coaches(user_id) on delete cascade,
  organization_id uuid not null references private.coaching_organizations(id),
  role text not null default 'coach' check(role in ('coach','lead')),
  is_admin boolean not null default false,
  reports_to uuid,
  unique(organization_id,user_id),
  foreign key(organization_id,reports_to) references private.coaching_staff(organization_id,user_id),
  check(reports_to is distinct from user_id)
);
create index coaching_staff_manager_idx on private.coaching_staff(organization_id,reports_to);
create table private.coaching_audit (
  id bigint generated always as identity primary key,
  organization_id uuid not null references private.coaching_organizations(id),
  actor_id uuid references public.profiles(id) on delete set null,
  target_id uuid references public.profiles(id) on delete set null,
  action text not null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);
create index coaching_audit_organization_idx on private.coaching_audit(organization_id,id desc);
alter table private.coaching_organizations enable row level security;
alter table private.coaching_staff enable row level security;
alter table private.coaching_audit enable row level security;
revoke all on private.coaching_organizations,private.coaching_staff,private.coaching_audit from public,anon,authenticated;
revoke all on sequence private.coaching_audit_id_seq from public,anon,authenticated;

-- Existing staff enter one organization without receiving new admin authority.
-- Account-specific admin provisioning is a separately authorized operation.
with org as (insert into private.coaching_organizations(name) values('Strong Start Coaching') returning id)
insert into private.coaching_staff(user_id,organization_id)
select c.user_id,org.id from public.coaches c cross join org;

create function private.coaching_admin() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from private.coaching_staff s join public.profiles p on p.id=s.user_id
    where s.user_id=auth.uid() and s.is_admin and p.disabled_at is null)
$$;
create function private.coaching_coach_allowed(p_coach uuid) returns boolean
language sql stable security definer set search_path='' as $$
  with recursive ancestry as (
    select s.user_id,s.organization_id,s.reports_to,array[s.user_id] path
      from private.coaching_staff s join public.profiles p on p.id=s.user_id
      where s.user_id=p_coach and p.disabled_at is null
    union all
    select s.user_id,s.organization_id,s.reports_to,a.path||s.user_id
      from ancestry a join private.coaching_staff s on s.user_id=a.reports_to and s.organization_id=a.organization_id
      join public.profiles p on p.id=s.user_id
      where s.role='lead' and p.disabled_at is null and not s.user_id=any(a.path)
  )
  select exists(select 1 from private.coaching_staff actor join public.profiles p on p.id=actor.user_id
    join private.coaching_staff target on target.organization_id=actor.organization_id and target.user_id=p_coach
    join public.profiles target_profile on target_profile.id=target.user_id
    where actor.user_id=auth.uid() and p.disabled_at is null and target_profile.disabled_at is null
      and (actor.is_admin or actor.user_id=p_coach or (actor.role='lead' and exists(select 1 from ancestry where user_id=actor.user_id))))
$$;
create or replace function private.coach_member_allowed(p_member uuid,p_include_disabled boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and p_member<>auth.uid()
    and exists(select 1 from public.profiles m where m.id=p_member and m.approved_at is not null
      and (m.disabled_at is null or (p_include_disabled and private.coaching_admin()))
      and private.coaching_coach_allowed(m.invited_by)
      and not exists(select 1 from public.coaches c where c.user_id=m.id))
$$;
create or replace function private.coach_pair_allowed(p_member uuid,p_coach uuid) returns boolean
language sql stable security definer set search_path='' as $$
  -- Historical threads follow the member's current primary-coach assignment.
  -- Transfers are restricted to the same organization; sender IDs stay intact.
  select exists(select 1 from public.profiles m
    join private.coaching_staff current_coach on current_coach.user_id=m.invited_by
    join private.coaching_staff thread_coach on thread_coach.user_id=p_coach and thread_coach.organization_id=current_coach.organization_id
    join public.profiles c on c.id=current_coach.user_id
    where m.id=p_member and m.approved_at is not null and m.disabled_at is null and c.disabled_at is null
      and not exists(select 1 from public.coaches staff where staff.user_id=m.id)
      and (auth.uid()=m.id or private.coaching_coach_allowed(m.invited_by)))
$$;
create function private.coaching_access(p_member uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  with recursive supervisors as (
    select s.user_id,s.organization_id,s.reports_to,array[s.user_id] path
      from public.profiles m join private.coaching_staff s on s.user_id=m.invited_by where m.id=p_member
    union all
    select s.user_id,s.organization_id,s.reports_to,t.path||s.user_id from supervisors t
      join private.coaching_staff s on s.user_id=t.reports_to and s.organization_id=t.organization_id
      where s.role='lead' and not s.user_id=any(t.path)
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',s.user_id,'name',coalesce(nullif(p.name,''),'Coach'),
    'role',case when s.user_id=m.invited_by then 'Primary coach' when s.is_admin then 'Organization admin' else 'Lead coach' end)
    order by (s.user_id=m.invited_by) desc,p.name,s.user_id),'[]'::jsonb)
  from public.profiles m join private.coaching_staff primary_coach on primary_coach.user_id=m.invited_by
    join private.coaching_staff s on s.organization_id=primary_coach.organization_id
    join public.profiles p on p.id=s.user_id
  where m.id=p_member and p.disabled_at is null
    and (auth.uid()=m.id or private.coach_member_allowed(m.id))
    and (s.is_admin or s.user_id in(select user_id from supervisors))
$$;
revoke all on function private.coaching_admin(),private.coaching_coach_allowed(uuid),private.coaching_access(uuid) from public,anon,authenticated;
grant execute on function private.coaching_admin(),private.coaching_coach_allowed(uuid) to authenticated;
-- coaching_access is called only inside guarded definer RPCs.

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
 order by p.name nulls last,p.id
$$;
-- Admins may inspect their organization's disabled members for reactivation.
alter policy "app_state: read own or coach" on public.app_state
  using(user_id=(select auth.uid()) or private.coach_member_allowed(user_id,true));
alter policy "logs: read own or coach" on public.workout_logs
  using(user_id=(select auth.uid()) or private.coach_member_allowed(user_id,true));
alter policy "plan_updates: read own or coach" on public.plan_updates
  using(user_id=(select auth.uid()) or private.coach_member_allowed(user_id,true));

create or replace function public.admin_set_disabled(p_user uuid,p_disabled boolean) returns void
language plpgsql volatile security definer set search_path='' as $$
declare org uuid;
begin
  select organization_id into org from private.coaching_staff where user_id=auth.uid();
  perform 1 from private.coaching_organizations where id=org for update;
  if not private.coaching_admin() or not private.coach_member_allowed(p_user,true) or public.is_staff(p_user) then
    raise exception 'Organization admin access to this member is required' using errcode='42501';
  end if;
  perform 1 from public.profiles where id=p_user for update;
  update public.profiles set disabled_at=case when p_disabled then now() else null end where id=p_user;
  insert into private.coaching_audit(organization_id,actor_id,target_id,action,after_value)
    values(org,auth.uid(),p_user,case when p_disabled then 'member_disabled' else 'member_enabled' end,jsonb_build_object('disabled',p_disabled));
end $$;
create or replace function public.admin_delete_account(p_user uuid) returns void
language plpgsql volatile security definer set search_path='' as $$
declare org uuid;
begin
  select organization_id into org from private.coaching_staff where user_id=auth.uid();
  perform 1 from private.coaching_organizations where id=org for update;
  if not private.coaching_admin() or not private.coach_member_allowed(p_user,true) or public.is_staff(p_user) then
    raise exception 'Organization admin access to this member is required' using errcode='42501';
  end if;
  perform 1 from public.profiles where id=p_user for update;
  insert into private.coaching_audit(organization_id,actor_id,action,after_value)
    values(org,auth.uid(),'member_deleted',jsonb_build_object('member_id',p_user));
  delete from public.feedback where user_id=p_user and kind<>'app';
  update public.feedback set workout=null where user_id=p_user and kind='app';
  delete from auth.users where id=p_user;
end $$;

create function public.coaching_organization(p_action text default 'summary',p_target uuid default null,p_data jsonb default '{}') returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare actor private.coaching_staff; target private.coaching_staff; org private.coaching_organizations;
  next_role text; next_admin boolean; next_manager uuid; before_value jsonb; after_value jsonb;
  member_coach uuid; next_coach uuid; target_user uuid; tree uuid[];
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  select s.* into actor from private.coaching_staff s join public.profiles p on p.id=s.user_id
    where s.user_id=auth.uid() and p.disabled_at is null;
  if not found then raise exception 'Organization staff access required' using errcode='42501'; end if;
  select * into org from private.coaching_organizations where id=actor.organization_id;
  if p_action='summary' then
    return jsonb_build_object('organization',jsonb_build_object('id',org.id,'name',org.name),
      'self',jsonb_build_object('id',actor.user_id,'role',actor.role,'is_admin',actor.is_admin,'reports_to',actor.reports_to),
      'coaches',(select coalesce(jsonb_agg(jsonb_build_object('id',s.user_id,'name',coalesce(nullif(p.name,''),'Coach'),'email',p.email,
        'role',s.role,'is_admin',s.is_admin,'reports_to',s.reports_to,
        'members',(select count(*) from public.profiles m where m.invited_by=s.user_id and m.approved_at is not null
          and not exists(select 1 from public.coaches c where c.user_id=m.id))) order by p.name,s.user_id),'[]')
        from private.coaching_staff s join public.profiles p on p.id=s.user_id
        where s.organization_id=org.id and private.coaching_coach_allowed(s.user_id)),
      'members',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'coach_id',p.invited_by)),'[]')
        from public.profiles p where private.coach_member_allowed(p.id,true)),
      'audit',case when actor.is_admin then (select coalesce(jsonb_agg(v order by v->>'created_at' desc),'[]') from
        (select jsonb_build_object('id',a.id::text,'action',a.action,'actor',coalesce(p.name,'Admin'),'target',coalesce(t.name,'Member'),
          'before',a.before_value,'after',a.after_value,'created_at',a.created_at) v from private.coaching_audit a
          left join public.profiles p on p.id=a.actor_id left join public.profiles t on t.id=a.target_id
          where a.organization_id=org.id order by a.id desc limit 30) q) else '[]'::jsonb end);
  end if;
  -- One organization lock serializes role/manager/transfer changes and final-admin checks.
  perform 1 from private.coaching_organizations where id=org.id for update;
  select * into actor from private.coaching_staff where user_id=auth.uid();
  if not coalesce(actor.is_admin,false) or not private.coaching_admin() then raise exception 'Only organization admins can change organization access' using errcode='42501'; end if;
  if p_action='add_coach' then
    if length(coalesce(p_data->>'email',''))>254 then raise exception 'Invalid email' using errcode='22023'; end if;
    select u.id into target_user from auth.users u join public.profiles p on p.id=u.id
      where lower(u.email)=lower(trim(p_data->>'email')) and u.email_confirmed_at is not null
        and (u.banned_until is null or u.banned_until<now()) and p.approved_at is not null and p.disabled_at is null
        and exists(select 1 from auth.identities i where i.user_id=u.id and i.provider='google');
    if target_user is null then raise exception 'An approved existing account with Google sign-in is required' using errcode='22023'; end if;
    if exists(select 1 from private.coaching_staff where user_id=target_user) then
      raise exception 'This account already belongs to a coaching organization' using errcode='22023';
    end if;
    if not exists(select 1 from public.profiles p join private.coaching_staff s on s.user_id=p.invited_by
      where p.id=target_user and s.organization_id=org.id) then
      raise exception 'The account must already be a member of your organization' using errcode='42501';
    end if;
    insert into public.coaches(user_id) values(target_user) on conflict do nothing;
    insert into private.coaching_staff(user_id,organization_id) values(target_user,org.id);
    insert into private.coaching_audit(organization_id,actor_id,target_id,action,after_value)
      values(org.id,auth.uid(),target_user,'coach_added',jsonb_build_object('role','coach','is_admin',false));
    return jsonb_build_object('ok',true);
  elsif p_action='update_coach' then
    select * into target from private.coaching_staff where user_id=p_target and organization_id=org.id;
    if not found then raise exception 'Coach unavailable' using errcode='42501'; end if;
    before_value:=jsonb_build_object('role',target.role,'is_admin',target.is_admin,'reports_to',target.reports_to);
    if p_data->'expected' is distinct from before_value then
      raise exception 'Organization changed. Refresh before saving.' using errcode='40001';
    end if;
    next_role:=p_data->>'role';next_admin:=(p_data->>'is_admin')::boolean;next_manager:=nullif(p_data->>'reports_to','')::uuid;
    if next_role is null or next_role not in ('coach','lead') or next_admin is null then
      raise exception 'Choose a coach role and admin access' using errcode='22023';
    end if;
    if p_target=auth.uid() and ((next_admin and not target.is_admin) or (next_role='lead' and target.role<>'lead')) then
      raise exception 'Another admin must promote your role' using errcode='42501';
    end if;
    if target.is_admin and not next_admin and (select count(*) from private.coaching_staff s join public.profiles p on p.id=s.user_id
      where s.organization_id=org.id and s.is_admin and p.disabled_at is null)<=1 then
      raise exception 'Keep at least one organization admin' using errcode='22023';
    end if;
    if next_role<>'lead' and exists(select 1 from private.coaching_staff where reports_to=p_target) then
      raise exception 'Reassign this lead coach''s reporting coaches before changing their role' using errcode='22023';
    end if;
    if next_manager is not null then
      if not exists(select 1 from private.coaching_staff s join public.profiles p on p.id=s.user_id
        where s.user_id=next_manager and s.organization_id=org.id and s.role='lead' and p.disabled_at is null) then
        raise exception 'Choose a lead coach in this organization' using errcode='22023';
      end if;
      with recursive ancestors as (
        select s.user_id,s.reports_to,array[s.user_id] path from private.coaching_staff s where s.user_id=next_manager
        union all select s.user_id,s.reports_to,a.path||s.user_id from ancestors a join private.coaching_staff s on s.user_id=a.reports_to
          where not s.user_id=any(a.path)
      ) select array_agg(user_id) into tree from ancestors;
      if p_target=any(tree) then raise exception 'Reporting lines cannot form a loop' using errcode='22023'; end if;
    end if;
    update private.coaching_staff set role=next_role,is_admin=next_admin,reports_to=next_manager where user_id=p_target;
    after_value:=jsonb_build_object('role',next_role,'is_admin',next_admin,'reports_to',next_manager);
    if before_value is distinct from after_value then
      insert into private.coaching_audit(organization_id,actor_id,target_id,action,before_value,after_value)
        values(org.id,auth.uid(),p_target,'coach_access_changed',before_value,after_value);
    end if;
    return jsonb_build_object('ok',true);
  elsif p_action='transfer_member' then
    perform 1 from public.profiles where id=p_target for update;
    if not private.coach_member_allowed(p_target,true) then raise exception 'Member unavailable' using errcode='42501'; end if;
    select invited_by into member_coach from public.profiles where id=p_target;
    if nullif(p_data->>'expected_coach','')::uuid is distinct from member_coach then
      raise exception 'Member assignment changed. Refresh before saving.' using errcode='40001';
    end if;
    next_coach:=nullif(p_data->>'coach_id','')::uuid;
    if not private.coaching_coach_allowed(next_coach) then raise exception 'Choose an active coach in this organization' using errcode='22023'; end if;
    if next_coach<>member_coach then
      update public.profiles set invited_by=next_coach where id=p_target;
      -- Unapplied changes from the old coaching team must not arrive after transfer.
      delete from public.plan_updates where user_id=p_target and applied_at is null;
      insert into private.coaching_audit(organization_id,actor_id,target_id,action,before_value,after_value)
        values(org.id,auth.uid(),p_target,'member_transferred',jsonb_build_object('coach_id',member_coach),jsonb_build_object('coach_id',next_coach));
    end if;
    return jsonb_build_object('ok',true);
  end if;
  raise exception 'Unknown organization action' using errcode='22023';
end $$;
revoke all on function public.coaching_organization(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.coaching_organization(text,uuid,jsonb) to authenticated;

-- Preserve the original invite flow, but require an active organization coach.
create or replace function public.create_invite(p_name text default null)
returns table(id uuid,code text,expires_at timestamptz)
language plpgsql volatile security definer set search_path='' as $$
declare c text; a text:='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i integer;
begin
  if not private.coaching_coach_allowed(auth.uid()) then raise exception 'Active organization coach required' using errcode='42501'; end if;
  if length(coalesce(p_name,''))>80 then raise exception 'Name is too long' using errcode='22023'; end if;
  loop
    c:='';for i in 1..10 loop c:=c||substr(a,1+floor(random()*length(a))::int,1);end loop;
    exit when not exists(select 1 from public.invites inv where inv.code=c);
  end loop;
  return query insert into public.invites(code,name,created_by) values(c,nullif(trim(p_name),''),auth.uid())
    returning invites.id,invites.code,invites.expires_at;
end $$;
create or replace function public.redeem_invite(p_code text) returns text
language plpgsql volatile security definer set search_path='' as $$
declare uid uuid:=auth.uid(); inv public.invites;
begin
  if uid is null then return 'invalid'; end if;
  if public.is_approved() then return 'already'; end if;
  select * into inv from public.invites where code=upper(trim(p_code)) for update;
  if not found then return 'invalid';end if;
  if inv.cancelled_at is not null then return 'cancelled';end if;
  if inv.used_by=uid then return 'already';end if;
  if inv.used_at is not null then return 'used';end if;
  if inv.expires_at<now() then return 'expired';end if;
  if not exists(select 1 from private.coaching_staff s join public.profiles p on p.id=s.user_id
    where s.user_id=inv.created_by and p.disabled_at is null) then return 'invalid';end if;
  update public.invites set used_by=uid,used_at=now() where id=inv.id;
  insert into public.profiles(id,email) select uid,u.email from auth.users u where u.id=uid on conflict(id) do nothing;
  update public.profiles set approved_at=now(),invited_by=inv.created_by,name=coalesce(name,inv.name) where id=uid;
  return 'ok';
end $$;

create or replace function private.coach_plan_message() returns trigger
language plpgsql security definer set search_path='' as $$
declare tid uuid; primary_coach uuid;
begin
  if length(trim(coalesce(new.update->>'note','')))=0 then return new;end if;
  if new.created_by is distinct from auth.uid() or not private.coach_member_allowed(new.user_id) then return new;end if;
  select invited_by into primary_coach from public.profiles where id=new.user_id;
  insert into public.coach_threads(member_id,coach_id) values(new.user_id,primary_coach) on conflict do nothing;
  select id into tid from public.coach_threads where member_id=new.user_id and coach_id=primary_coach;
  insert into public.coach_messages(thread_id,sender_id,message,kind,plan_update_id)
    values(tid,new.created_by,left(trim(new.update->>'note'),4000),'plan',new.id);
  return new;
end $$;

create or replace function public.coach_messaging(p_action text,p_member uuid default null,p_body jsonb default '{}') returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare uid uuid:=auth.uid(); mid uuid:=coalesce(p_member,auth.uid()); cid uuid; tid uuid; org uuid;
  rows jsonb; person jsonb; inbox jsonb; ids bigint[]; tids uuid[]; before_id bigint; through_id bigint;
  inserted_id bigint; text_body text; request_id uuid; older boolean; ctx jsonb; member_side boolean;
begin
  if uid is null or not public.is_approved() then raise exception 'Approved sign-in required' using errcode='42501';end if;
  if p_action='summary' then
    select jsonb_build_object('id',c.id,'name',coalesce(nullif(c.name,''),'Your coach'),'access',private.coaching_access(m.id),
      'unread',(select count(*) from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
        where t.member_id=uid and x.sender_id<>uid and x.read_at is null),
      'through',(select max(x.id)::text from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
        where t.member_id=uid and x.sender_id<>uid),
      'preview',(select x.message from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
        where t.member_id=uid and x.sender_id<>uid order by x.created_at desc,x.id desc limit 1)) into person
      from public.profiles m join public.profiles c on c.id=m.invited_by
      where m.id=uid and private.coach_pair_allowed(m.id,c.id);
    select coalesce(jsonb_agg(r order by r->>'last_at' desc),'[]') into inbox from (
      select jsonb_build_object('member_id',m.id,'name',coalesce(nullif(m.name,''),'Member'),'primary_coach',m.invited_by,
        'last_at',latest.created_at,'preview',latest.message,'mine',latest.sender_id=uid,
        'unread',(select count(*) from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
          where t.member_id=m.id and x.sender_id=m.id and x.read_at is null),
        'needs_reply',exists(select 1 from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
          where t.member_id=m.id and x.sender_id=m.id and x.resolved_at is null)) r
      from public.profiles m
      cross join lateral(select x.message,x.created_at,x.sender_id from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
        where t.member_id=m.id order by x.created_at desc,x.id desc limit 1) latest
      where private.coach_member_allowed(m.id)
    ) q;
    return jsonb_build_object('coach',person,'inbox',inbox);
  end if;
  select p.invited_by into cid from public.profiles p where p.id=mid;
  select organization_id into org from private.coaching_staff where user_id=cid;
  -- Same lock order as role/reporting/transfer/disable operations.
  perform 1 from private.coaching_organizations where id=org for share;
  perform 1 from public.profiles where id in(mid,cid) order by id for share;
  if not private.coach_pair_allowed(mid,cid) then raise exception 'This conversation is unavailable' using errcode='42501';end if;
  member_side:=uid=mid;
  insert into public.coach_threads(member_id,coach_id) values(mid,cid) on conflict do nothing;
  select id into tid from public.coach_threads where member_id=mid and coach_id=cid for update;
  select array_agg(id) into tids from public.coach_threads where member_id=mid;
  through_id:=nullif(p_body->>'through','')::bigint;
  if p_action='send' then
    text_body:=trim(p_body->>'message');request_id:=(p_body->>'client_id')::uuid;
    if text_body is null or length(text_body) not between 1 and 4000 or request_id is null
      or coalesce(p_body->>'tag','') not in ('','too_hard','too_easy','hurt','question') then
      raise exception 'Invalid message' using errcode='22023';end if;
    if member_side and jsonb_typeof(p_body->'workout')='object' then
      ctx:=jsonb_strip_nulls(jsonb_build_object('name',left(p_body#>>'{workout,name}',150),'status',left(p_body#>>'{workout,status}',40)));
    end if;
    if not exists(select 1 from public.coach_messages where thread_id=any(tids) and client_id=request_id) then
      insert into public.coach_messages(thread_id,sender_id,message,tag,workout,client_id)
        values(tid,uid,text_body,nullif(p_body->>'tag',''),ctx,request_id) returning id into inserted_id;
    end if;
    if inserted_id is not null and not member_side then
      update public.coach_messages set resolved_at=coalesce(resolved_at,now())
        where thread_id=any(tids) and sender_id=mid and resolved_at is null and id<=through_id;
    end if;
    return jsonb_build_object('ok',true);
  elsif p_action='done' then
    if member_side then raise exception 'Only the coaching team can mark done' using errcode='42501';end if;
    update public.coach_messages set resolved_at=coalesce(resolved_at,now())
      where thread_id=any(tids) and sender_id=mid and resolved_at is null and id<=through_id;
    return jsonb_build_object('ok',true);
  elsif p_action='dismiss' then
    if not member_side then raise exception 'Only the member can dismiss' using errcode='42501';end if;
    update public.coach_messages set read_at=now()
      where thread_id=any(tids) and sender_id<>mid and read_at is null and id<=through_id;
    return jsonb_build_object('ok',true);
  elsif p_action in ('read','peek') then
    before_id:=nullif(p_body->>'before','')::bigint;
    select array_agg(q.id) into ids from (select id from public.coach_messages where thread_id=any(tids)
      and (before_id is null or (created_at,id)<(select created_at,id from public.coach_messages where thread_id=any(tids) and id=before_id))
      order by created_at desc,id desc limit 50) q;
    if p_action='read' then
      update public.coach_messages set read_at=now() where thread_id=any(tids) and read_at is null
        and ((member_side and sender_id<>mid) or (not member_side and sender_id=mid))
        and ((before_id is null and (created_at,id)<=(select created_at,id from public.coach_messages where id=any(ids)
          order by created_at desc,id desc limit 1)) or id=any(ids));
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('id',x.id::text,'sender_id',x.sender_id,'sender_name',coalesce(nullif(p.name,''),'Coach'),
      'sender_role',case when x.sender_id=mid then 'Member' else 'Coaching team' end,
      'message',x.message,'tag',x.tag,'kind',x.kind,'workout',x.workout,'created_at',x.created_at,
      'read_at',x.read_at,'client_id',x.client_id,'resolved_at',x.resolved_at) order by x.created_at,x.id),'[]') into rows
      from public.coach_messages x left join public.profiles p on p.id=x.sender_id where x.id=any(ids);
    select exists(select 1 from public.coach_messages where thread_id=any(tids) and (created_at,id)<
      (select created_at,id from public.coach_messages where id=any(ids) order by created_at,id limit 1)) into older;
    select jsonb_build_object('member_name',coalesce(nullif(m.name,''),'Member'),'coach_name',coalesce(nullif(c.name,''),'Your coach')) into person
      from public.profiles m join public.profiles c on c.id=cid where m.id=mid;
    return person||jsonb_build_object('messages',rows,'has_more',older,'coach_id',cid,'member_id',mid,'access',private.coaching_access(mid),
      'through',(select max(id)::text from public.coach_messages where thread_id=any(tids)
        and ((member_side and sender_id<>mid) or (not member_side and sender_id=mid))),
      'needs_reply',exists(select 1 from public.coach_messages where thread_id=any(tids) and sender_id=mid and resolved_at is null));
  end if;
  raise exception 'Unknown messaging action' using errcode='22023';
end $$;
