-- Publish only the message table. Existing participant RLS and SELECT grants remain unchanged.
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='coach_messages') then
  alter publication supabase_realtime add table public.coach_messages;
 end if;
end $$;

create or replace function public.coach_messaging(p_action text,p_member uuid default null,p_body jsonb default '{}') returns jsonb
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
        where t.member_id=uid and t.coach_id=c.id and x.sender_id=c.id order by x.created_at desc,x.id desc limit 1)) into person
    from public.profiles m join public.profiles c on c.id=m.invited_by
    where m.id=uid and private.coach_pair_allowed(m.id,c.id);
    select coalesce(jsonb_agg(r order by r->>'last_at' desc),'[]') into inbox from (
      select jsonb_build_object('member_id',m.id,'name',coalesce(nullif(m.name,''),'Member'),
        'last_at',latest.created_at,'preview',latest.message,'mine',latest.sender_id=uid,
        'unread',(select count(*) from public.coach_messages x where x.thread_id=t.id and x.sender_id=m.id and x.read_at is null),
        'needs_reply',exists(select 1 from public.coach_messages x where x.thread_id=t.id and x.sender_id=m.id and x.resolved_at is null)) r
      from public.coach_threads t join public.profiles m on m.id=t.member_id
      cross join lateral(select x.message,x.created_at,x.sender_id from public.coach_messages x where x.thread_id=t.id order by x.created_at desc,x.id desc limit 1) latest
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
        where thread_id=tid and sender_id=mid and resolved_at is null and id<=through_id;
    end if;
    return jsonb_build_object('ok',true);
  elsif p_action='done' then
    if uid<>cid then raise exception 'Only the assigned coach can mark done' using errcode='42501'; end if;
    update public.coach_messages set resolved_at=coalesce(resolved_at,now()) where thread_id=tid and sender_id=mid and resolved_at is null and id<=through_id;
    return jsonb_build_object('ok',true);
  elsif p_action='dismiss' then
    if uid<>mid then raise exception 'Only the member can dismiss' using errcode='42501'; end if;
    update public.coach_messages set read_at=now() where thread_id=tid and sender_id=cid and read_at is null and id<=through_id;
    return jsonb_build_object('ok',true);
  elsif p_action in ('read','peek') then
    before_id:=nullif(p_body->>'before','')::bigint;
    select array_agg(q.id) into ids from (select id from public.coach_messages where thread_id=tid
      and (before_id is null or (created_at,id)<(select created_at,id from public.coach_messages where thread_id=tid and id=before_id)) order by created_at desc,id desc limit 50) q;
    if p_action='read' then
    update public.coach_messages set read_at=now() where thread_id=tid and sender_id<>uid and read_at is null and (
      (before_id is null and (created_at,id)<=(select created_at,id from public.coach_messages where id=any(ids) order by created_at desc,id desc limit 1))
      or id=any(ids));
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('id',x.id::text,'sender_id',x.sender_id,'message',x.message,'tag',x.tag,
      'kind',x.kind,'workout',x.workout,'created_at',x.created_at,'read_at',x.read_at,'client_id',x.client_id,'resolved_at',x.resolved_at) order by x.created_at,x.id),'[]') into rows
      from public.coach_messages x where x.id=any(ids);
    select exists(select 1 from public.coach_messages where thread_id=tid and (created_at,id)<(select created_at,id from public.coach_messages where id=any(ids) order by created_at,id limit 1)) into older;
    select jsonb_build_object('member_name',coalesce(nullif(m.name,''),'Member'),'coach_name',coalesce(nullif(c.name,''),'Your coach')) into person
      from public.profiles m join public.profiles c on c.id=cid where m.id=mid;
    return person||jsonb_build_object('messages',rows,'has_more',older,'coach_id',cid,'member_id',mid,
      'through',(select max(id)::text from public.coach_messages where thread_id=tid and sender_id<>uid),
      'needs_reply',exists(select 1 from public.coach_messages where thread_id=tid and sender_id=mid and resolved_at is null));
  else raise exception 'Unknown messaging action' using errcode='22023'; end if;
end $$;
revoke all on function public.coach_messaging(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.coach_messaging(text,uuid,jsonb) to authenticated;
