-- DEVELOPMENT ONLY. All synthetic identities/data are rolled back.
begin;
create temporary table sync_test_metrics (metric text,value numeric);
grant insert,select on sync_test_metrics to authenticated;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000201','incremental-a@example.invalid'),
 ('00000000-0000-4000-8000-000000000202','incremental-b@example.invalid'),
 ('00000000-0000-4000-8000-000000000203','incremental-unapproved@example.invalid');
update public.profiles set approved_at=now() where id in
 ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000201',true);
do $$
declare
 s jsonb:='{"v":6,"settings":{"name":"Synthetic","units":"lb"},"block":{"plan":{}},"draft":null}';
 r jsonb;rev bigint:=0;page jsonb;cursor text:=null;seen integer:=0;batch jsonb;
 untouched tid;changed_tid tid;start_time timestamptz;read_ms numeric;save_ms numeric;bytes integer;
begin
 -- Ten years at five workouts per week, six exercises and four sets each.
 for b in 0..10 loop
  select coalesce(jsonb_agg(jsonb_build_object('id','synthetic-'||lpad(i::text,5,'0'),
   'date',to_char('2016-11-15'::date+i*interval '1.4 days','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
   'name','Synthetic workout','units','lb','block',1+i/30,'week',1,'status','complete',
   'entries',(select jsonb_agg(jsonb_build_object('ex','synthetic-exercise-'||e,'sets',
     (select jsonb_agg(jsonb_build_object('w',100+e,'r',10+k*0,'done',true)) from generate_series(1,4) k))) from generate_series(1,6) e))), '[]')
   into batch from generate_series(b*250+1,least((b+1)*250,2600)) i;
  r:=public.commit_account_changes(rev,s,batch,'[]',false);assert r->>'ok'='true';rev:=(r->>'revision')::bigint;
 end loop;
 assert (select count(*) from public.workout_logs)=2600,'history import lost rows';
 -- Cursor bootstrap must see every row, with a bounded response per page.
 loop
  page:=public.read_account_changes(null,cursor,case when cursor is null then null else rev end);
  assert jsonb_array_length(page->'changes')<=250,'unbounded bootstrap';
  seen:=seen+jsonb_array_length(page->'changes');cursor:=page->>'next';exit when cursor is null;
 end loop;
 assert seen=2600,'paged bootstrap lost rows';
 select ctid into untouched from public.workout_logs where id='synthetic-00001';
 select ctid into changed_tid from public.workout_logs where id='synthetic-02600';
 start_time:=clock_timestamp();page:=public.read_account_changes(rev,null,null);read_ms:=extract(epoch from clock_timestamp()-start_time)*1000;
 assert jsonb_array_length(page->'changes')=0,'unchanged history downloaded';bytes:=octet_length(page::text);
 start_time:=clock_timestamp();s:=jsonb_set(s,'{settings,name}','"Synthetic edit"');
 r:=public.commit_account_changes(rev,s,'[]','[]',true);save_ms:=extract(epoch from clock_timestamp()-start_time)*1000;
 rev:=(r->>'revision')::bigint;
 assert (select ctid from public.workout_logs where id='synthetic-00001')=untouched,'state save rewrote history';
 assert (select ctid from public.workout_logs where id='synthetic-02600')=changed_tid,'state save rewrote last workout';
 assert jsonb_array_length(public.read_account_changes(rev-1,null,null)->'changes')=0,'state edit downloaded workouts';
 select jsonb_build_array(data||'{"name":"Edited workout"}') into batch from public.workout_logs where id='synthetic-02600';
 r:=public.commit_account_changes(rev,s,batch,'[]',false);
 page:=public.read_account_changes(rev,null,null);rev:=(r->>'revision')::bigint;
 assert jsonb_array_length(page->'changes')=1,'single edit returned old history';
 assert (page#>>'{changes,0,id}')='synthetic-02600','wrong changed workout';
 assert (select ctid from public.workout_logs where id='synthetic-00001')=untouched,'single edit rewrote unrelated row';
 assert (select ctid from public.workout_logs where id='synthetic-02600')<>changed_tid,'edit not written';
 r:=public.commit_account_changes(rev-1,s,'[]','["synthetic-00001"]',false);assert r->>'ok'='false','stale delete allowed';
 assert (public.read_account_changes(null,'synthetic-00250',rev-1)->>'restart')='true','inconsistent page not rejected';
 r:=public.commit_account_changes(rev,s,'[]','["synthetic-00001"]',false);
 assert (public.read_account_changes(rev,null,null)#>>'{changes,0,deleted}')='true','missing deletion';rev:=(r->>'revision')::bigint;
 begin
  perform public.commit_account_changes(rev,s,'[{"id":"synthetic-00001","date":"2026-11-15"}]','[]',false);
  raise exception 'Deleted ID revived';exception when invalid_parameter_value then null;
 end;
 begin
  perform public.commit_account_changes(rev,s,'[{"id":"bad-date","date":"not-a-date"}]','["synthetic-00002"]',false);
  raise exception 'Invalid date accepted';exception when invalid_datetime_format then null;
 end;
 assert exists(select 1 from public.workout_logs where id='synthetic-00002'),'failed transaction deleted workout';
 -- Legacy clients still work, but their unchanged rows are not rewritten and
 -- the new protocol sees their edited rows at the correct next revision.
 select jsonb_agg(case when id='synthetic-00002' then data||'{"name":"Legacy edit"}' else data end) into batch from public.workout_logs;
 r:=public.commit_account_snapshot(rev,s,batch,false);
 page:=public.read_account_changes(rev,null,null);rev:=(r#>>'{snapshot,revision}')::bigint;
 assert jsonb_array_length(page->'changes')=1,'legacy edit re-tagged unchanged history';
 assert (page#>>'{changes,0,id}')='synthetic-00002';
 insert into sync_test_metrics values ('history_workouts',2600),('unchanged_pull_bytes',bytes),('unchanged_pull_ms',read_ms),('state_only_save_ms',save_ms);
 raise notice 'PASS 2600 workouts / ten years; unchanged pull % bytes / % ms; state-only save % ms; single-row writes, pagination, rollback and legacy compatibility',bytes,read_ms,save_ms;
end $$;
-- Coach application/rollback/deferral uses the same transaction as delta saves.
reset role;
insert into public.plan_updates(user_id,created_by,update) values
 ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202','{"plan":{"upper":[]},"note":"Synthetic coach"}');
set local role authenticated;
do $$
declare r jsonb;s jsonb;rev bigint;
begin
 select state,revision into s,rev from public.app_state;
 s:=jsonb_set(s,'{draft}','{"paused":true}');r:=public.commit_account_changes(rev,s,'[]','[]',true);rev:=(r->>'revision')::bigint;
 assert r->>'applied'='0','paused draft consumed coach update';
 s:=jsonb_set(s,'{draft}','null');
 begin
  perform public.commit_account_changes(rev,s,'[{"id":"bad","date":"invalid-date"}]','[]',true);
  raise exception 'Invalid date accepted';exception when invalid_datetime_format then null;
 end;
 assert exists(select 1 from public.plan_updates where applied_at is null),'failed delta consumed coach update';
 r:=public.commit_account_changes(rev,s,'[]','[]',true);assert r->>'applied'='1';
 rev:=(r->>'revision')::bigint;s:=r->'state';
 r:=public.commit_account_changes(rev,s,'[]','[]',true);assert r->>'applied'='0' and (r->>'revision')::bigint=rev,'retry duplicated coach update';
 begin update public.workout_logs set data='{}';raise exception 'Direct write allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000202',true);
do $$ begin
 assert jsonb_array_length(public.read_account_changes(null,null,null)->'changes')=0,'cross-account history leak';
 assert public.read_account_changes(null,null,null)->'state'='null','cross-account state leak';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000203',true);
do $$ begin
 assert public.read_account_changes(null,null,null) is null,'unapproved read';
 begin perform public.commit_account_changes(0,'{"settings":{}}','[]','[]',false);raise exception 'Unapproved write';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.profiles set disabled_at=now() where id='00000000-0000-4000-8000-000000000201';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000201',true);
do $$ begin
 assert public.read_account_changes(null,null,null) is null,'disabled read';
 begin perform public.commit_account_changes(0,'{"settings":{}}','[]','[]',false);raise exception 'Disabled write';exception when insufficient_privilege then null;end;
end $$;
set local role anon;
do $$ begin
 begin perform public.read_account_changes(null,null,null);raise exception 'Anonymous read';exception when insufficient_privilege then null;end;
 begin perform public.commit_account_changes(0,'{"settings":{}}','[]','[]',false);raise exception 'Anonymous write';exception when insufficient_privilege then null;end;
end $$;
reset role;
select jsonb_build_object('metrics',(select jsonb_object_agg(metric,value) from sync_test_metrics),'result','PASS incremental sync, ten-year history, paged bootstrap, unchanged-row preservation, CAS, tombstones, rollback, coach deferral/retry, legacy compatibility and role boundaries') as verification;
rollback;
