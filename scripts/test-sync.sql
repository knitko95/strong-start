-- Run only in the isolated development database. Synthetic fixtures roll back.
begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000101','sync-a@example.invalid'),
 ('00000000-0000-4000-8000-000000000102','sync-b@example.invalid'),
 ('00000000-0000-4000-8000-000000000103','sync-blocked@example.invalid');
update public.profiles set approved_at=now() where id in
 ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102');
-- Delivery fixture, not a grant of coach access to any account.
insert into public.plan_updates(user_id,created_by,update) values
 ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102',
  '{"plan":{"upper":[{"id":"synthetic-new"}]},"note":"Synthetic coach update","level":"up","adj":{"test":{"sets":2}}}');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000101',true);
do $$
declare s jsonb := '{"v":6,"settings":{"name":"Synthetic","units":"lb","level":"start"},"block":{"plan":{}},"draft":{"paused":true}}';
 r jsonb; revision bigint; saved jsonb; denied boolean;
begin
  r:=public.commit_account_snapshot(0,s,'[{"id":"test-log","date":"2026-11-11T12:00:00Z","entries":[]}]',true);
  assert r->>'ok'='true' and r->>'applied'='0','paused draft must defer coach update';
  assert r#>>'{snapshot,revision}'='1','first save revision';
  r:=public.commit_account_snapshot(0,s||'{"settings":{"name":"Stale"}}','[]',false);
  assert r->>'ok'='false' and r#>>'{snapshot,state,settings,name}'='Synthetic','stale save must not overwrite';
  assert jsonb_array_length(r#>'{snapshot,logs}')=1,'stale delete must not remove log';
  -- Clear the draft, then deliberately fail after coach updates are applied in
  -- memory: invalid log date must roll back the acknowledgement and all writes.
  s:=jsonb_set(s,'{draft}','null');
  begin
    perform public.commit_account_snapshot(1,s,'[{"id":"test-log","date":"invalid-date"}]',true);
    raise exception 'Expected invalid date failure';
  exception when invalid_datetime_format then null;
  end;
  assert exists(select 1 from public.plan_updates where applied_at is null),'failed save consumed coach update';
  assert (public.read_account_snapshot()->>'revision')='1','failed save advanced revision';
  r:=public.commit_account_snapshot(1,s,'[{"id":"test-log","date":"2026-11-11T12:00:00Z","entries":[]}]',true);
  assert r->>'applied'='1' and r#>>'{snapshot,state,settings,level}'='up','coach update not committed';
  assert r#>>'{snapshot,state,coach,note}'='Synthetic coach update','coach note missing';
  assert not exists(select 1 from public.plan_updates where applied_at is null),'ack missing';
  saved:=r#>'{snapshot,state}'; revision:=(r#>>'{snapshot,revision}')::bigint;
  r:=public.commit_account_snapshot(revision,saved,'[{"id":"test-log","date":"2026-11-11T12:00:00Z","entries":[]}]',true);
  assert r->>'applied'='0' and (r#>>'{snapshot,revision}')::bigint=revision,'retry duplicated update';
  r:=public.commit_account_snapshot(revision,saved,'[]',false);
  assert (r#>'{snapshot,deleted}') ? 'test-log','deletion not remembered';
  revision:=(r#>>'{snapshot,revision}')::bigint;
  begin
    perform public.commit_account_snapshot(revision,saved,'[{"id":"test-log","date":"2026-11-11T12:00:00Z"}]',false);
    raise exception 'Expected tombstone failure';
  exception when invalid_parameter_value then null;
  end;
  assert jsonb_array_length(public.read_account_snapshot()->'logs')=0,'deleted workout revived';
  -- Old clients and direct requests must not bypass CAS or pre-acknowledge updates.
  denied:=false;
  begin update public.app_state set state='{}'; exception when insufficient_privilege then denied:=true; end;
  assert denied,'direct state update allowed';
  denied:=false;
  begin insert into public.workout_logs(user_id,id,date,data) values(auth.uid(),'bypass',now(),'{}'); exception when insufficient_privilege then denied:=true; end;
  assert denied,'direct log insert allowed';
  denied:=false;
  begin update public.plan_updates set applied_at=now(); exception when insufficient_privilege then denied:=true; end;
  assert denied,'direct acknowledgement allowed';
  denied:=false;
  begin insert into public.plan_updates(user_id,update,applied_at) values(auth.uid(),'{}',now()); exception when insufficient_privilege then denied:=true; end;
  assert denied,'pre-acknowledged insert allowed';
  denied:=false;
  begin insert into public.plan_updates(user_id,update) values(auth.uid(),'{}'); exception when insufficient_privilege then denied:=true; end;
  assert denied,'non-coach could send a plan';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000102',true);
do $$ begin
  assert (public.read_account_snapshot()->>'revision')='0','cross-account revision leak';
  assert (public.read_account_snapshot()->'state')='null','cross-account state leak';
  assert not exists(select 1 from public.workout_log_deletions),'cross-account deletion leak';
  assert not exists(select 1 from public.app_state),'cross-account table leak';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000103',true);
do $$ begin
  assert public.read_account_snapshot() is null,'unapproved account could read snapshot';
  begin
    perform public.commit_account_snapshot(0,'{"settings":{}}','[]',false);
    raise exception 'Unapproved write allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.profiles set disabled_at=now() where id='00000000-0000-4000-8000-000000000101';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000101',true);
do $$ begin
  assert public.read_account_snapshot() is null,'disabled account could read';
  begin
    perform public.commit_account_snapshot(3,'{"settings":{}}','[]',false);
    raise exception 'Disabled write allowed';
  exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
  begin perform public.read_account_snapshot(); raise exception 'Anonymous read allowed';
  exception when insufficient_privilege then null; end;
  begin perform public.commit_account_snapshot(0,'{"settings":{}}','[]',false); raise exception 'Anonymous write allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: revisions, stale writers, atomic coach apply/rollback, retry, tombstones, direct-write denial, account isolation, approval, disabled and anonymous boundaries' as result;
rollback;
