-- Revision-checked, atomic member saves. Deploy the matching frontend after this
-- migration: older clients retain local data but their direct writes are denied.
alter table public.app_state add column revision bigint not null default 0;

create table public.workout_log_deletions (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  deleted_at timestamptz not null default now(),
  primary key (user_id,id)
);
alter table public.workout_log_deletions enable row level security;
revoke all on public.workout_log_deletions from public, anon, authenticated;
grant select on public.workout_log_deletions to authenticated;
create policy "deletions: read own" on public.workout_log_deletions
  for select to authenticated using (user_id=(select auth.uid()) and (select public.is_approved()));

-- One statement provides a consistent snapshot of state, logs, and deletions.
create function public.read_account_snapshot()
returns jsonb language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'revision',coalesce((select revision::text from public.app_state where user_id=auth.uid()),'0'),
    'state',(select state from public.app_state where user_id=auth.uid()),
    'logs',coalesce((select jsonb_agg(data order by date desc,id) from public.workout_logs where user_id=auth.uid()),'[]'::jsonb),
    'deleted',coalesce((select jsonb_agg(id order by id) from public.workout_log_deletions where user_id=auth.uid()),'[]'::jsonb)
  ) where auth.uid() is not null and public.is_approved()
$$;
revoke all on function public.read_account_snapshot() from public, anon;
grant execute on function public.read_account_snapshot() to authenticated;

create function public.commit_account_snapshot(
  p_revision bigint, p_state jsonb, p_logs jsonb, p_apply_coach boolean default false
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid(); current_revision bigint; next_state jsonb := p_state;
  item jsonb; upd record; applied integer := 0; changed boolean; current_state jsonb;
begin
  if uid is null then raise exception 'Sign in to save' using errcode='42501'; end if;
  -- Serialize every save, including the first one; also serialize against disable/delete.
  perform 1 from public.profiles where id=uid for update;
  if not found or not public.is_approved() then
    raise exception 'Approved account required' using errcode='42501';
  end if;
  select revision,state into current_revision,current_state from public.app_state where user_id=uid;
  current_revision := coalesce(current_revision,0);
  if p_revision is distinct from current_revision then
    return jsonb_build_object('ok',false,'snapshot',public.read_account_snapshot());
  end if;
  if jsonb_typeof(p_state) is distinct from 'object' or jsonb_typeof(p_state->'settings') is distinct from 'object'
     or jsonb_typeof(p_logs) is distinct from 'array' then
    raise exception 'Invalid account snapshot' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(p_logs) l where jsonb_typeof(l) <> 'object'
      or coalesce(l->>'id','')='' or length(l->>'id')>200 or coalesce(l->>'date','')='')
     or (select count(*) from jsonb_array_elements(p_logs)) <>
        (select count(distinct l->>'id') from jsonb_array_elements(p_logs) l) then
    raise exception 'Invalid workout records' using errcode='22023';
  end if;
  -- A deleted ID cannot be revived by an old tab, even after conflict resolution.
  if exists(select 1 from jsonb_array_elements(p_logs) l join public.workout_log_deletions d
       on d.user_id=uid and d.id=l->>'id') then
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
  -- Compare only this member's logs, including IDs also used by other members.
  changed := next_state is distinct from current_state or
    (select coalesce(jsonb_object_agg(id,data),'{}') from public.workout_logs where user_id=uid)
    is distinct from (select coalesce(jsonb_object_agg(l->>'id',l),'{}') from jsonb_array_elements(p_logs) l);
  if changed or applied>0 then
    insert into public.workout_log_deletions(user_id,id)
      select uid,w.id from public.workout_logs w where w.user_id=uid
      and not exists(select 1 from jsonb_array_elements(p_logs) l where l->>'id'=w.id)
      on conflict do nothing;
    delete from public.workout_logs w where w.user_id=uid
      and not exists(select 1 from jsonb_array_elements(p_logs) l where l->>'id'=w.id);
    for item in select value from jsonb_array_elements(p_logs) loop
      insert into public.workout_logs(user_id,id,date,data)
      values(uid,item->>'id',(item->>'date')::timestamptz,item)
      on conflict(user_id,id) do update set date=excluded.date,data=excluded.data;
    end loop;
    insert into public.app_state(user_id,state,updated_at,saved_at,revision)
      values(uid,next_state,coalesce((next_state->>'updatedAt')::bigint,0),now(),current_revision+1)
      on conflict(user_id) do update set state=excluded.state,updated_at=excluded.updated_at,
        saved_at=excluded.saved_at,revision=excluded.revision;
    update public.profiles set name=nullif(next_state#>>'{settings,name}','') where id=uid;
  end if;
  return jsonb_build_object('ok',true,'applied',applied,'snapshot',public.read_account_snapshot());
end
$$;
revoke all on function public.commit_account_snapshot(bigint,jsonb,jsonb,boolean) from public, anon;
grant execute on function public.commit_account_snapshot(bigint,jsonb,jsonb,boolean) to authenticated;

-- No old client can bypass revisions or acknowledge an unsaved coach plan.
revoke insert,update,delete,truncate,references,trigger on public.app_state,public.workout_logs from anon,authenticated;
revoke update,delete,truncate,references,trigger on public.plan_updates from anon,authenticated;
-- Explicit column grants must be revoked as well as table grants.
revoke insert(user_id,state,updated_at,saved_at,revision),update(user_id,state,updated_at,saved_at,revision) on public.app_state from anon,authenticated;
revoke insert(user_id,id,date,data),update(user_id,id,date,data) on public.workout_logs from anon,authenticated;
revoke update(id,user_id,created_by,update,created_at,applied_at) on public.plan_updates from anon,authenticated;
-- Coaches can send payloads, but cannot pre-acknowledge them through INSERT.
revoke insert on public.plan_updates from anon,authenticated;
revoke insert(id,user_id,created_by,update,created_at,applied_at) on public.plan_updates from anon,authenticated;
grant insert(user_id,created_by,update) on public.plan_updates to authenticated;
