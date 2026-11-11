-- Private conversations use the existing invite assignment, never a typed email.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create table public.coach_threads (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  unique(member_id,coach_id)
);
create index coach_threads_coach_idx on public.coach_threads(coach_id);
create table public.coach_messages (
  id bigint generated always as identity primary key,
  thread_id uuid not null references public.coach_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check(length(trim(message)) between 1 and 4000),
  tag text check(tag in ('too_hard','too_easy','hurt','question')),
  kind text not null default 'message' check(kind in ('message','plan')),
  workout jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  resolved_at timestamptz,
  client_id uuid,
  legacy_feedback_id bigint unique references public.feedback(id) on delete set null,
  plan_update_id bigint unique references public.plan_updates(id) on delete set null,
  unique(thread_id,client_id)
);
create index coach_messages_thread_id_idx on public.coach_messages(thread_id,id desc);
create index coach_messages_sender_idx on public.coach_messages(sender_id);
create index profiles_invited_by_idx on public.profiles(invited_by);
alter table public.coach_threads enable row level security;
alter table public.coach_messages enable row level security;

create function private.coach_pair_allowed(p_member uuid,p_coach uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() in (p_member,p_coach)
    and exists(select 1 from public.profiles m join public.profiles c on c.id=m.invited_by
      join public.coaches role on role.user_id=c.id
      where m.id=p_member and c.id=p_coach and m.approved_at is not null
        and m.disabled_at is null and c.disabled_at is null)
$$;
revoke all on function private.coach_pair_allowed(uuid,uuid) from public,anon,authenticated;
grant execute on function private.coach_pair_allowed(uuid,uuid) to authenticated;
revoke all on public.coach_threads,public.coach_messages from anon,authenticated;
revoke all on sequence public.coach_messages_id_seq from public,anon,authenticated;
grant select on public.coach_threads,public.coach_messages to authenticated;
create policy "thread participants read" on public.coach_threads for select to authenticated
using(private.coach_pair_allowed(member_id,coach_id));
create policy "message participants read" on public.coach_messages for select to authenticated
using(exists(select 1 from public.coach_threads t where t.id=thread_id));

-- Existing shared-inbox messages retain their read/done states, but now belong
-- only to the inviting coach. Unassigned legacy rows stay in feedback, untouched.
insert into public.coach_threads(member_id,coach_id)
select distinct p.id,p.invited_by from public.profiles p join public.coaches c on c.user_id=p.invited_by
where exists(select 1 from public.feedback f where f.user_id=p.id and f.kind='coach')
   or exists(select 1 from public.plan_updates u where u.user_id=p.id and u.created_by=p.invited_by and length(trim(coalesce(u.update->>'note','')))>0);
insert into public.coach_messages(thread_id,sender_id,message,tag,workout,created_at,read_at,resolved_at,legacy_feedback_id)
select t.id,f.user_id,f.message,case when f.tag in ('too_hard','too_easy','hurt','question') then f.tag end,
 f.workout,f.created_at,f.read_at,f.done_at,f.id
from public.feedback f join public.coach_threads t on t.member_id=f.user_id
where f.kind='coach';
insert into public.coach_messages(thread_id,sender_id,message,kind,created_at,read_at,plan_update_id)
select t.id,u.created_by,left(trim(u.update->>'note'),4000),'plan',u.created_at,now(),u.id
from public.plan_updates u join public.coach_threads t on t.member_id=u.user_id and t.coach_id=u.created_by
where length(trim(coalesce(u.update->>'note','')))>0;

create function private.coach_plan_message() returns trigger
language plpgsql security definer set search_path='' as $$
declare tid uuid;
begin
  if length(trim(coalesce(new.update->>'note','')))=0 then return new; end if;
  if not exists(select 1 from public.profiles m join public.coaches c on c.user_id=m.invited_by
     where m.id=new.user_id and m.invited_by=new.created_by) then return new; end if;
  insert into public.coach_threads(member_id,coach_id) values(new.user_id,new.created_by)
    on conflict(member_id,coach_id) do nothing;
  select id into tid from public.coach_threads where member_id=new.user_id and coach_id=new.created_by;
  insert into public.coach_messages(thread_id,sender_id,message,kind,plan_update_id)
    values(tid,new.created_by,left(trim(new.update->>'note'),4000),'plan',new.id);
  return new;
end $$;
revoke all on function private.coach_plan_message() from public,anon,authenticated;
create trigger coach_plan_message after insert on public.plan_updates
for each row execute function private.coach_plan_message();

-- The old API can no longer deliver new coaching messages to a shared inbox.
-- Keep app feedback and its owner workflow unchanged.
drop policy "feedback: send own" on public.feedback;
create policy "feedback: send own" on public.feedback for insert to authenticated
with check(user_id=(select auth.uid()) and kind='app');
drop policy "feedback: read own or inbox" on public.feedback;
create policy "feedback: read own or inbox" on public.feedback for select to authenticated
using(user_id=(select auth.uid()) or (kind='app' and (select public.is_app_owner()))
 or (kind='coach' and exists(select 1 from public.profiles p where p.id=user_id and p.invited_by=(select auth.uid())) and (select public.is_coach())));
drop policy "feedback: inbox marks read/done" on public.feedback;
create policy "feedback: inbox marks read/done" on public.feedback for update to authenticated
using(kind='app' and (select public.is_app_owner()))
with check(kind='app' and (select public.is_app_owner()));

-- All writes are narrow operations: callers cannot forge sender, timestamps,
-- read/done state, coach assignment, plan notes, or an arbitrary recipient.
create function public.coach_messaging(p_action text,p_member uuid default null,p_body jsonb default '{}') returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare uid uuid:=auth.uid(); mid uuid:=coalesce(p_member,auth.uid()); cid uuid; tid uuid;
  result jsonb; rows jsonb; person jsonb; inbox jsonb; ids bigint[]; before_id bigint; through_id bigint;
  inserted_id bigint; text_body text; request_id uuid; older boolean; ctx jsonb;
begin
  if uid is null or not public.is_approved() then raise exception 'Approved sign-in required' using errcode='42501'; end if;
  if p_action='summary' then
    select jsonb_build_object('id',c.id,'name',coalesce(nullif(c.name,''),'Your coach'),
      'unread',(select count(*) from public.coach_threads t join public.coach_messages x on x.thread_id=t.id
        where t.member_id=uid and t.coach_id=c.id and x.sender_id=c.id and x.read_at is null),
      'through',(select max(x.id)::text from public.coach_threads t join public.coach_messages x on x.thread_id=t.id
        where t.member_id=uid and t.coach_id=c.id and x.sender_id=c.id),
      'preview',(select x.message from public.coach_threads t join public.coach_messages x on x.thread_id=t.id
        where t.member_id=uid and t.coach_id=c.id and x.sender_id=c.id order by x.id desc limit 1)) into person
    from public.profiles m join public.profiles c on c.id=m.invited_by
    where m.id=uid and private.coach_pair_allowed(m.id,c.id);
    select coalesce(jsonb_agg(r order by r->>'last_at' desc),'[]') into inbox from (
      select jsonb_build_object('member_id',m.id,'name',coalesce(nullif(m.name,''),'Member'),
        'last_at',latest.created_at,'preview',latest.message,'mine',latest.sender_id=uid,
        'unread',(select count(*) from public.coach_messages x where x.thread_id=t.id and x.sender_id=m.id and x.read_at is null),
        'needs_reply',exists(select 1 from public.coach_messages x where x.thread_id=t.id and x.sender_id=m.id and x.resolved_at is null)) r
      from public.coach_threads t join public.profiles m on m.id=t.member_id
      cross join lateral(select x.message,x.created_at,x.sender_id from public.coach_messages x where x.thread_id=t.id order by x.id desc limit 1) latest
      where t.coach_id=uid and private.coach_pair_allowed(t.member_id,t.coach_id)
    ) q;
    return jsonb_build_object('coach',person,'inbox',inbox);
  end if;
  select p.invited_by into cid from public.profiles p where p.id=mid;
  if not private.coach_pair_allowed(mid,cid) then raise exception 'This conversation is unavailable' using errcode='42501'; end if;
  -- Serialize against reassignment/disable/deletion and concurrent sends.
  perform 1 from public.profiles where id in (mid,cid) order by id for share;
  if not private.coach_pair_allowed(mid,cid) then raise exception 'This conversation is unavailable' using errcode='42501'; end if;
  insert into public.coach_threads(member_id,coach_id) values(mid,cid) on conflict(member_id,coach_id) do nothing;
  select id into tid from public.coach_threads where member_id=mid and coach_id=cid for update;
  through_id:=nullif(p_body->>'through','')::bigint;
  if p_action='send' then
    text_body:=trim(p_body->>'message'); request_id:=(p_body->>'client_id')::uuid;
    if text_body is null or length(text_body) not between 1 and 4000 or request_id is null
      or coalesce(p_body->>'tag','') not in ('','too_hard','too_easy','hurt','question') then
      raise exception 'Invalid message' using errcode='22023'; end if;
    if mid=uid and jsonb_typeof(p_body->'workout')='object' then
      ctx:=jsonb_strip_nulls(jsonb_build_object('name',left(p_body#>>'{workout,name}',150),'status',left(p_body#>>'{workout,status}',40)));
    end if;
    insert into public.coach_messages(thread_id,sender_id,message,tag,workout,client_id)
      values(tid,uid,text_body,nullif(p_body->>'tag',''),ctx,request_id)
      on conflict(thread_id,client_id) do nothing returning id into inserted_id;
    if inserted_id is not null and uid=cid then
      update public.coach_messages set resolved_at=coalesce(resolved_at,now())
        where thread_id=tid and sender_id=mid and id<=through_id;
    end if;
    return jsonb_build_object('ok',true);
  elsif p_action='done' then
    if uid<>cid then raise exception 'Only the assigned coach can mark done' using errcode='42501'; end if;
    update public.coach_messages set resolved_at=coalesce(resolved_at,now()) where thread_id=tid and sender_id=mid and id<=through_id;
    return jsonb_build_object('ok',true);
  elsif p_action='dismiss' then
    if uid<>mid then raise exception 'Only the member can dismiss' using errcode='42501'; end if;
    update public.coach_messages set read_at=coalesce(read_at,now()) where thread_id=tid and sender_id=cid and id<=through_id;
    return jsonb_build_object('ok',true);
  elsif p_action='read' then
    before_id:=nullif(p_body->>'before','')::bigint;
    select array_agg(q.id) into ids from (select id from public.coach_messages where thread_id=tid
      and (before_id is null or id<before_id) order by id desc limit 50) q;
    update public.coach_messages set read_at=coalesce(read_at,now()) where id=any(ids) and sender_id<>uid;
    select coalesce(jsonb_agg(jsonb_build_object('id',x.id::text,'sender_id',x.sender_id,'message',x.message,'tag',x.tag,
      'kind',x.kind,'workout',x.workout,'created_at',x.created_at,'resolved_at',x.resolved_at) order by x.id),'[]') into rows
      from public.coach_messages x where x.id=any(ids);
    select exists(select 1 from public.coach_messages where thread_id=tid and id<(select min(i) from unnest(ids)i)) into older;
    select jsonb_build_object('member_name',coalesce(nullif(m.name,''),'Member'),'coach_name',coalesce(nullif(c.name,''),'Your coach')) into person
      from public.profiles m join public.profiles c on c.id=cid where m.id=mid;
    return person||jsonb_build_object('messages',rows,'has_more',older,'coach_id',cid,'member_id',mid);
  else raise exception 'Unknown messaging action' using errcode='22023'; end if;
end $$;
revoke all on function public.coach_messaging(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.coach_messaging(text,uuid,jsonb) to authenticated;
