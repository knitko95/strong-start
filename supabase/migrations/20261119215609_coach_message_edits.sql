-- Members and coaches can edit their own typed message for 15 minutes after sending
-- (owner decision Nov 19, 2026). The edit replaces the text for both people and shows
-- 'Edited'; the original wording isn't kept. Plan-update messages can't be edited.
alter table public.coach_messages add column if not exists edited_at timestamptz;
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
  elsif p_action='edit' then
    -- The sender can fix their own typed message for 15 minutes; plan-update messages can't be edited.
    text_body:=trim(p_body->>'message');
    if text_body is null or length(text_body) not between 1 and 4000 then raise exception 'Invalid message' using errcode='22023';end if;
    update public.coach_messages set message=text_body,edited_at=now()
      where id=nullif(p_body->>'id','')::bigint and thread_id=any(tids) and sender_id=uid and kind='message'
        and created_at>now()-interval '15 minutes';
    if not found then raise exception 'This message can no longer be edited' using errcode='42501';end if;
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
      'read_at',x.read_at,'client_id',x.client_id,'resolved_at',x.resolved_at,'edited_at',x.edited_at) order by x.created_at,x.id),'[]') into rows
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
