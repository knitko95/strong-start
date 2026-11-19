-- Coach edits to a member's workouts travel with plan updates: exercise order, the exact
-- moves (removed, added, supersets) and suggested weights (the member keeps control of
-- working weights). Coaches also get private notes about each member and a record of what
-- they last saw, for the 'since you last looked' summary. Owner decisions Nov 18-19, 2026.
create table private.coach_member_notes (
  member_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  notes text not null default '' check(length(notes)<=20000),
  seen jsonb,
  seen_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(member_id,coach_id)
);
alter table private.coach_member_notes enable row level security;
revoke all on private.coach_member_notes from public,anon,authenticated;

create or replace function public.coach_private(p_action text,p_member uuid,p_body jsonb default '{}') returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare uid uuid:=auth.uid(); r record;
begin
  -- Only someone allowed to coach this member, and only their own notes.
  if uid is null or not public.is_approved() or not private.coach_member_allowed(p_member) then
    raise exception 'Coach access to this member is required' using errcode='42501';
  end if;
  if p_action='get' then
    select notes,seen,seen_at into r from private.coach_member_notes where member_id=p_member and coach_id=uid;
    return jsonb_build_object('notes',coalesce(r.notes,''),'seen',r.seen,'seen_at',r.seen_at);
  elsif p_action='notes' then
    if jsonb_typeof(p_body->'notes') is distinct from 'string' or length(p_body->>'notes')>20000 then raise exception 'Invalid notes' using errcode='22023'; end if;
    insert into private.coach_member_notes(member_id,coach_id,notes) values(p_member,uid,p_body->>'notes')
      on conflict(member_id,coach_id) do update set notes=excluded.notes,updated_at=now();
    return jsonb_build_object('ok',true);
  elsif p_action='seen' then
    if jsonb_typeof(p_body->'seen') is distinct from 'object' or pg_column_size(p_body->'seen')>200000 then raise exception 'Invalid snapshot' using errcode='22023'; end if;
    insert into private.coach_member_notes(member_id,coach_id,seen,seen_at) values(p_member,uid,p_body->'seen',now())
      on conflict(member_id,coach_id) do update set seen=excluded.seen,seen_at=now(),updated_at=now();
    return jsonb_build_object('ok',true);
  end if;
  raise exception 'Unknown action' using errcode='22023';
end $$;
revoke all on function public.coach_private(text,uuid,jsonb) from public,anon;
grant execute on function public.coach_private(text,uuid,jsonb) to authenticated;

create or replace function public.commit_account_changes(
  p_revision bigint,p_state jsonb,p_upserts jsonb,p_deletes jsonb,p_apply_coach boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid:=auth.uid();current_revision bigint;current_state jsonb;next_state jsonb:=p_state;
  upd record;applied integer:=0;changed boolean;affected integer;log_changes integer:=0;sc jsonb;
begin
  if uid is null then raise exception 'Sign in to save' using errcode='42501'; end if;
  perform 1 from public.profiles where id=uid for update;
  if not found or not public.is_approved() then raise exception 'Approved account required' using errcode='42501'; end if;
  select revision,state into current_revision,current_state from public.app_state where user_id=uid;
  current_revision:=coalesce(current_revision,0);
  if p_revision is distinct from current_revision then return jsonb_build_object('ok',false); end if;
  if jsonb_typeof(p_state) is distinct from 'object' or jsonb_typeof(p_state->'settings') is distinct from 'object'
    or jsonb_typeof(p_upserts) is distinct from 'array' or jsonb_typeof(p_deletes) is distinct from 'array' then
    raise exception 'Invalid account changes' using errcode='22023';
  end if;
  if jsonb_array_length(p_upserts)>250 or jsonb_array_length(p_deletes)>250 then
    raise exception 'Change batch too large' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(p_upserts) l where jsonb_typeof(l)<>'object'
      or coalesce(l->>'id','')='' or length(l->>'id')>200 or coalesce(l->>'date','')='')
    or (select count(*) from jsonb_array_elements(p_upserts))<>(select count(distinct l->>'id') from jsonb_array_elements(p_upserts) l)
    or exists(select 1 from jsonb_array_elements(p_deletes) d where jsonb_typeof(d)<>'string' or length(d#>>'{}') not between 1 and 200)
    or (select count(*) from jsonb_array_elements(p_deletes))<>(select count(distinct d) from jsonb_array_elements(p_deletes) d)
    or exists(select 1 from jsonb_array_elements(p_upserts) l where p_deletes ? (l->>'id')) then
    raise exception 'Invalid workout changes' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(p_upserts) l join public.workout_log_deletions d on d.user_id=uid and d.id=l->>'id') then
    raise exception 'Deleted workout IDs cannot be reused' using errcode='22023';
  end if;
  -- Apply and acknowledge inside this same transaction, only after the member's
  -- own pending changes are saved and no active or paused draft exists.
  if p_apply_coach and jsonb_typeof(next_state->'block')='object'
      and coalesce(next_state->'draft','null'::jsonb)='null'::jsonb then
    for upd in select id,update from public.plan_updates
        where user_id=uid and applied_at is null order by id for update loop
      if jsonb_typeof(upd.update->'plan') is distinct from 'object' then
        raise exception 'Invalid coach plan update' using errcode='22023';
      end if;
      next_state := jsonb_set(next_state,'{block,plan}',coalesce(next_state#>'{block,plan}','{}') || (upd.update->'plan'));
      if jsonb_typeof(upd.update->'orig')='object' then
        next_state := jsonb_set(next_state,'{block,orig}',upd.update->'orig');
      end if;
      next_state := jsonb_set(next_state,'{adj}',coalesce(nullif(upd.update->'adj','null'),'{}'));
      next_state := jsonb_set(next_state,'{coach}',jsonb_build_object('note',coalesce(upd.update->>'note','')));
      if upd.update->>'level' in ('start','back','regular','up') then
        next_state := jsonb_set(next_state,'{settings,level}',upd.update->'level');
      end if;
      -- Coach-edited schedule, split and workout length (Nov 19 2026). Each value is checked; bad values are skipped.
      sc := upd.update->'sched';
      if jsonb_typeof(sc)='object' then
        if coalesce(sc->>'split','') ~ '^[a-z0-9]{2,16}$' then
          next_state := jsonb_set(next_state,'{settings,split}',sc->'split');
        end if;
        if jsonb_typeof(sc->'days')='array' and jsonb_array_length(sc->'days') between 2 and 5
            and not exists(select 1 from jsonb_array_elements(sc->'days') d where jsonb_typeof(d)<>'number' or (d#>>'{}') not in ('0','1','2','3','4','5','6'))
            and (select count(distinct d) from jsonb_array_elements(sc->'days') d)=jsonb_array_length(sc->'days') then
          next_state := jsonb_set(next_state,'{settings,days}',sc->'days');
        end if;
        if jsonb_typeof(sc->'flex')='boolean' then
          next_state := jsonb_set(next_state,'{settings,flex}',sc->'flex');
        end if;
        if sc->>'nDays' in ('2','3','4','5') then
          next_state := jsonb_set(next_state,'{settings,nDays}',to_jsonb((sc->>'nDays')::int));
        end if;
        if sc->>'mins' in ('30','45','60','75') then
          next_state := jsonb_set(next_state,'{settings,mins}',to_jsonb((sc->>'mins')::int));
        end if;
        if jsonb_typeof(sc->'order')='object' and pg_column_size(sc->'order')<=4000 then
          next_state := jsonb_set(next_state,'{settings,order}',sc->'order');
        end if;
      end if;
      -- Coach-renamed workouts: up to 20 names of 1-40 characters, keyed by workout ID.
      if jsonb_typeof(upd.update->'names')='object'
          and (select count(*) from jsonb_each(upd.update->'names'))<=20
          and not exists(select 1 from jsonb_each(upd.update->'names') e
            where e.key !~ '^[A-Za-z0-9_]{1,20}$' or jsonb_typeof(e.value)<>'string' or char_length(e.value#>>'{}') not between 1 and 40) then
        next_state := jsonb_set(next_state,'{names}',upd.update->'names');
      end if;
      -- Coach-edited workouts (Nov 19 2026): exercise order, the exact moves (removed, added, supersets)
      -- and suggested weights. The app reads these defensively; sizes are capped here.
      if jsonb_typeof(upd.update->'order')='object' and pg_column_size(upd.update->'order')<=8000 then
        next_state := jsonb_set(next_state,'{order}',upd.update->'order');
      end if;
      if jsonb_typeof(upd.update->'custom')='object' and pg_column_size(upd.update->'custom')<=16000 then
        next_state := jsonb_set(next_state,'{custom}',upd.update->'custom');
      end if;
      if jsonb_typeof(upd.update->'sugg')='object' and pg_column_size(upd.update->'sugg')<=8000
          and not exists(select 1 from jsonb_each(upd.update->'sugg') e where jsonb_typeof(e.value)<>'object'
            or jsonb_typeof(e.value->'w')<>'number' or case when jsonb_typeof(e.value->'w')='number' then (e.value->>'w')::numeric not between 0 and 2000 else true end) then
        next_state := jsonb_set(next_state,'{sugg}',upd.update->'sugg');
      end if;
      update public.plan_updates set applied_at=now() where id=upd.id and user_id=uid;
      applied := applied+1;
    end loop;
  end if;

  insert into public.workout_log_deletions(user_id,id)
    select uid,value from jsonb_array_elements_text(p_deletes) on conflict do nothing;
  get diagnostics affected=row_count;log_changes:=log_changes+affected;
  delete from public.workout_logs where user_id=uid and id in (select value from jsonb_array_elements_text(p_deletes));
  get diagnostics affected=row_count;log_changes:=log_changes+affected;
  insert into public.workout_logs(user_id,id,date,data)
    select uid,l->>'id',(l->>'date')::timestamptz,l from jsonb_array_elements(p_upserts) l
    on conflict(user_id,id) do update set date=excluded.date,data=excluded.data
      where workout_logs.data is distinct from excluded.data or workout_logs.date is distinct from excluded.date;
  get diagnostics affected=row_count;log_changes:=log_changes+affected;
  changed:=next_state is distinct from current_state or log_changes>0 or applied>0;
  if changed then
    insert into public.app_state(user_id,state,updated_at,saved_at,revision)
      values(uid,next_state,coalesce((next_state->>'updatedAt')::bigint,0),now(),current_revision+1)
      on conflict(user_id) do update set state=excluded.state,updated_at=excluded.updated_at,saved_at=excluded.saved_at,revision=excluded.revision;
    update public.profiles set name=nullif(next_state#>>'{settings,name}','') where id=uid
      and name is distinct from nullif(next_state#>>'{settings,name}','');
    current_revision:=current_revision+1;
  end if;
  return jsonb_build_object('ok',true,'revision',current_revision::text,'state',next_state,'applied',applied);
end $$;
revoke all on function public.commit_account_changes(bigint,jsonb,jsonb,jsonb,boolean) from public,anon;
grant execute on function public.commit_account_changes(bigint,jsonb,jsonb,jsonb,boolean) to authenticated;
-- Members can stop being coached ('Remove my coach') and coach themselves; their plan, weights,
-- history and messages stay. The former coach loses access to the app but keeps the conversation
-- ('Former client'), and either person can still message. The member can rejoin. Organization
-- admins keep access to coachless members. Either person can delete a conversation from their
-- own app only. Owner decisions Nov 19, 2026.
alter table public.profiles add column if not exists coach_removed_at timestamptz;
grant select(coach_removed_at) on public.profiles to authenticated;
create table if not exists private.coach_thread_hidden (
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  through_id bigint not null default 0,
  hidden_at timestamptz not null default now(),
  primary key(user_id,member_id)
);
alter table private.coach_thread_hidden enable row level security;
revoke all on private.coach_thread_hidden from public,anon,authenticated;

create or replace function private.coach_member_allowed(p_member uuid,p_include_disabled boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and p_member<>auth.uid()
    and exists(select 1 from public.profiles m where m.id=p_member and m.approved_at is not null
      and (m.disabled_at is null or (p_include_disabled and private.coaching_admin()))
      and (m.coach_removed_at is null or private.coaching_admin())
      and private.coaching_coach_allowed(m.invited_by)
      and not exists(select 1 from public.coaches c where c.user_id=m.id))
$$;

create or replace function public.member_coaching(p_action text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare uid uuid:=auth.uid(); org uuid; coach uuid;
begin
  if uid is null or not public.is_approved() or public.is_staff(uid) then raise exception 'Member account required' using errcode='42501'; end if;
  select invited_by into coach from public.profiles where id=uid for update;
  select organization_id into org from private.coaching_staff where user_id=coach;
  if coach is null or org is null then raise exception 'No coach to change' using errcode='22023'; end if;
  if p_action='remove' then
    update public.profiles set coach_removed_at=coalesce(coach_removed_at,now()) where id=uid;
    -- Coach changes not yet applied are dropped, not applied later.
    update public.plan_updates set applied_at=now() where user_id=uid and applied_at is null;
    insert into private.coaching_audit(organization_id,actor_id,target_id,action) values(org,uid,coach,'member_removed_coach');
  elsif p_action='rejoin' then
    update public.profiles set coach_removed_at=null where id=uid;
    insert into private.coaching_audit(organization_id,actor_id,target_id,action) values(org,uid,coach,'member_rejoined_coach');
  else raise exception 'Unknown action' using errcode='22023'; end if;
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.member_coaching(text) from public,anon;
grant execute on function public.member_coaching(text) to authenticated;

-- Organization admins: members who are coaching themselves (shown under 'Without a coach').
create or replace function public.admin_coachless() returns table(id uuid,removed_at timestamptz)
language sql stable security definer set search_path='' as $$
  select p.id,p.coach_removed_at from public.profiles p
  where private.coaching_admin() and p.coach_removed_at is not null and private.coach_member_allowed(p.id,true)
$$;
revoke all on function public.admin_coachless() from public,anon;
grant execute on function public.admin_coachless() to authenticated;

create or replace function public.coach_messaging(p_action text,p_member uuid default null,p_body jsonb default '{}') returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare uid uuid:=auth.uid(); mid uuid:=coalesce(p_member,auth.uid()); cid uuid; tid uuid; org uuid;
  rows jsonb; person jsonb; inbox jsonb; ids bigint[]; tids uuid[]; before_id bigint; through_id bigint;
  inserted_id bigint; text_body text; request_id uuid; older boolean; ctx jsonb; member_side boolean; hid bigint:=0;
begin
  if uid is null or not public.is_approved() then raise exception 'Approved sign-in required' using errcode='42501';end if;
  if p_action='summary' then
    select coalesce((select h.through_id from private.coach_thread_hidden h where h.user_id=uid and h.member_id=uid),0) into hid;
    select jsonb_build_object('id',c.id,'name',coalesce(nullif(c.name,''),'Your coach'),'access',private.coaching_access(m.id),
      'removed_at',m.coach_removed_at,'hidden',not exists(select 1 from public.coach_messages x join public.coach_threads t on t.id=x.thread_id where t.member_id=uid and x.id>hid) and hid>0,
      'unread',(select count(*) from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
        where t.member_id=uid and x.sender_id<>uid and x.read_at is null and x.id>hid),
      'through',(select max(x.id)::text from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
        where t.member_id=uid and x.sender_id<>uid),
      'preview',(select x.message from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
        where t.member_id=uid and x.sender_id<>uid and x.id>hid order by x.created_at desc,x.id desc limit 1)) into person
      from public.profiles m join public.profiles c on c.id=m.invited_by
      where m.id=uid and private.coach_pair_allowed(m.id,c.id);
    select coalesce(jsonb_agg(r order by r->>'last_at' desc),'[]') into inbox from (
      select jsonb_build_object('member_id',m.id,'name',coalesce(nullif(m.name,''),'Member'),'primary_coach',m.invited_by,
        'last_at',latest.created_at,'preview',latest.message,'mine',latest.sender_id=uid,'former',m.coach_removed_at is not null,
        'unread',(select count(*) from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
          where t.member_id=m.id and x.sender_id=m.id and x.read_at is null and x.id>coalesce(h.through_id,0)),
        'needs_reply',exists(select 1 from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
          where t.member_id=m.id and x.sender_id=m.id and x.resolved_at is null)) r
      from public.profiles m
      left join private.coach_thread_hidden h on h.user_id=uid and h.member_id=m.id
      cross join lateral(select x.id,x.message,x.created_at,x.sender_id from public.coach_messages x join public.coach_threads t on t.id=x.thread_id
        where t.member_id=m.id and x.id>coalesce(h.through_id,0) order by x.created_at desc,x.id desc limit 1) latest
      where private.coach_member_allowed(m.id)
        -- A former client stays in the former coach's Messages (owner decision Nov 19 2026).
        or (m.invited_by=uid and m.coach_removed_at is not null and m.disabled_at is null and private.coach_pair_allowed(m.id,uid))
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
  select coalesce((select h.through_id from private.coach_thread_hidden h where h.user_id=uid and h.member_id=mid),0) into hid;
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
  elsif p_action='hide' then
    -- Deleting a conversation hides it only for this person; the other person keeps their copy.
    insert into private.coach_thread_hidden(user_id,member_id,through_id)
      values(uid,mid,coalesce((select max(id) from public.coach_messages where thread_id=any(tids)),0))
      on conflict(user_id,member_id) do update set through_id=excluded.through_id,hidden_at=now();
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
    select array_agg(q.id) into ids from (select id from public.coach_messages where thread_id=any(tids) and id>hid
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
    select exists(select 1 from public.coach_messages where thread_id=any(tids) and id>hid and (created_at,id)<
      (select created_at,id from public.coach_messages where id=any(ids) order by created_at,id limit 1)) into older;
    select jsonb_build_object('member_name',coalesce(nullif(m.name,''),'Member'),'coach_name',coalesce(nullif(c.name,''),'Your coach')) into person
      from public.profiles m join public.profiles c on c.id=cid where m.id=mid;
    return person||jsonb_build_object('messages',rows,'has_more',older,'coach_id',cid,'member_id',mid,'access',private.coaching_access(mid),
      'removed_at',(select coach_removed_at from public.profiles where id=mid),
      'through',(select max(id)::text from public.coach_messages where thread_id=any(tids)
        and ((member_side and sender_id<>mid) or (not member_side and sender_id=mid))),
      'needs_reply',exists(select 1 from public.coach_messages where thread_id=any(tids) and sender_id=mid and resolved_at is null));
  end if;
  raise exception 'Unknown messaging action' using errcode='22023';
end $$;
