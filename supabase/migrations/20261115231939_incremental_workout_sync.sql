-- Additive protocol: legacy snapshot clients remain compatible. Every changed
-- workout/tombstone is tagged with the account revision that commits it.
alter table public.workout_logs add column sync_revision bigint not null default 0;
alter table public.workout_log_deletions add column sync_revision bigint not null default 0;
create index workout_logs_sync on public.workout_logs(user_id,sync_revision,id);
create index workout_deletions_sync on public.workout_log_deletions(user_id,sync_revision,id);

create function private.tag_workout_revision() returns trigger
language plpgsql set search_path='' as $$
begin
  -- Legacy full-snapshot upserts must not rewrite unchanged historical records.
  if tg_table_name='workout_logs' and tg_op='UPDATE' then
    if new.data is not distinct from old.data and new.date is not distinct from old.date then return null; end if;
  end if;
  new.sync_revision:=coalesce((select revision from public.app_state where user_id=new.user_id),0)+1;
  return new;
end $$;
revoke all on function private.tag_workout_revision() from public,anon,authenticated;
create trigger workout_sync_revision before insert or update on public.workout_logs
  for each row execute function private.tag_workout_revision();
create trigger deletion_sync_revision before insert on public.workout_log_deletions
  for each row execute function private.tag_workout_revision();

-- Each page is a single consistent SQL snapshot. The expected revision detects
-- writes between pages; clients discard incomplete downloads and retry.
create function public.read_account_changes(p_since bigint default null,p_after text default null,p_expected bigint default null)
returns jsonb language sql stable security invoker set search_path='' as $$
  with account as (
    select coalesce((select revision from public.app_state where user_id=(select auth.uid())),0) revision,
      (select state from public.app_state where user_id=(select auth.uid())) state
    where (select auth.uid()) is not null and (select public.is_approved())
  ), changes as (
    select id,data,false deleted from public.workout_logs where user_id=(select auth.uid())
      and (p_since is null or sync_revision>p_since) and (p_after is null or id>p_after)
    union all
    select id,null::jsonb,true from public.workout_log_deletions where user_id=(select auth.uid())
      and (p_since is null or sync_revision>p_since) and (p_after is null or id>p_after)
  ), bounded as (select * from changes order by id limit 251), page as (select * from bounded order by id limit 250)
  select case when p_expected is not null and p_expected<>a.revision then jsonb_build_object('restart',true)
    else jsonb_build_object('revision',a.revision::text,'state',a.state,
      'changes',coalesce((select jsonb_agg(to_jsonb(p) order by id) from page p),'[]'::jsonb),
      'next',case when (select count(*) from bounded)>250 then (select max(id) from page) else null end) end
  from account a
$$;
revoke all on function public.read_account_changes(bigint,text,bigint) from public,anon;
grant execute on function public.read_account_changes(bigint,text,bigint) to authenticated;

create function public.commit_account_changes(
  p_revision bigint,p_state jsonb,p_upserts jsonb,p_deletes jsonb,p_apply_coach boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid:=auth.uid();current_revision bigint;current_state jsonb;next_state jsonb:=p_state;
  upd record;applied integer:=0;changed boolean;affected integer;log_changes integer:=0;
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
