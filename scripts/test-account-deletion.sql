-- Development only. All synthetic users, roles, messages and sessions roll back.
begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000201','delete-a@example.invalid'),
 ('00000000-0000-4000-8000-000000000202','delete-b@example.invalid'),
 ('00000000-0000-4000-8000-000000000203','delete-staff@example.invalid');
insert into auth.sessions(id,user_id,created_at,updated_at) values
 ('00000000-0000-4000-8000-000000000211','00000000-0000-4000-8000-000000000201',now(),now()),
 ('00000000-0000-4000-8000-000000000212','00000000-0000-4000-8000-000000000202',now()-interval '1 hour',now()),
 ('00000000-0000-4000-8000-000000000213','00000000-0000-4000-8000-000000000203',now(),now());
update public.profiles set approved_at=now() where id in
 ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202');
-- A transaction-only role fixture, never a role assignment to a real account.
insert into public.coaches(user_id) values ('00000000-0000-4000-8000-000000000203');
insert into public.app_state(user_id,state) values
 ('00000000-0000-4000-8000-000000000201','{"settings":{"name":"Synthetic delete"}}'),
 ('00000000-0000-4000-8000-000000000202','{"settings":{"name":"Synthetic keep"}}');
insert into public.workout_logs(user_id,id,date,data) values
 ('00000000-0000-4000-8000-000000000201','delete-test',now(),'{}');
insert into public.workout_log_deletions(user_id,id) values
 ('00000000-0000-4000-8000-000000000201','old-delete-test');
insert into public.plan_updates(user_id,created_by,update) values
 ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202','{}');
insert into public.feedback(user_id,kind,message,screen,device,workout) values
 ('00000000-0000-4000-8000-000000000201','app','Synthetic retained deletion feedback','synthetic screen','synthetic device','{"test":true}'),
 ('00000000-0000-4000-8000-000000000201','coach','Synthetic removed coach feedback',null,null,null),
 ('00000000-0000-4000-8000-000000000202','app','Synthetic unrelated feedback',null,null,null);
set local role anon;
do $$ begin
  begin perform public.delete_my_account('DELETE'); raise exception 'Anonymous deletion allowed';
  exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000201',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000201","session_id":"00000000-0000-4000-8000-000000000211"}',true);
do $$ begin
  begin perform public.delete_my_account('yes'); raise exception 'Missing confirmation allowed';
  exception when invalid_parameter_value then null; end;
  begin perform public.admin_delete_account('00000000-0000-4000-8000-000000000202'); raise exception 'Targeted deletion allowed';
  exception when insufficient_privilege then null; end;
end $$;
-- A valid token with another account's session must not pass the freshness check.
select set_config('request.jwt.claims','{"session_id":"00000000-0000-4000-8000-000000000213"}',true);
do $$ begin
  begin perform public.delete_my_account('DELETE'); raise exception 'Wrong-session deletion allowed' using errcode='XX000';
  exception when sqlstate 'P0001' then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000202',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-4000-8000-000000000212"}',true);
do $$ begin
  begin perform public.delete_my_account('DELETE'); raise exception 'Old-session deletion allowed' using errcode='XX000';
  exception when sqlstate 'P0001' then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000203',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-4000-8000-000000000213"}',true);
do $$ begin
  begin perform public.delete_my_account('DELETE'); raise exception 'Staff deletion allowed';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000201',true);
select set_config('request.jwt.claims','{"session_id":"00000000-0000-4000-8000-000000000211"}',true);
select public.delete_my_account('DELETE');
-- A still-unexpired token cannot read, save, send feedback, or recreate a profile.
do $$ begin
  assert public.read_account_snapshot() is null,'Deleted account can read snapshot';
  assert public.account_status()='none','Deleted account still approved';
  begin perform public.commit_account_snapshot(0,'{"settings":{}}','[]',false); raise exception 'Deleted account can sync';
  exception when insufficient_privilege then null; end;
  begin insert into public.feedback(kind,message) values('app','Stale token'); raise exception 'Deleted account can send feedback';
  exception when insufficient_privilege then null; end;
  begin insert into public.profiles(id,email) values(auth.uid(),'stale@example.invalid'); raise exception 'Deleted account can recreate profile';
  exception when foreign_key_violation then null; end;
end $$;
reset role;
do $$ begin
  assert not exists(select 1 from auth.users where id='00000000-0000-4000-8000-000000000201'),'Auth user retained';
  assert not exists(select 1 from auth.sessions where user_id='00000000-0000-4000-8000-000000000201'),'Session retained';
  assert not exists(select 1 from public.profiles where id='00000000-0000-4000-8000-000000000201'),'Profile retained';
  assert not exists(select 1 from public.app_state where user_id='00000000-0000-4000-8000-000000000201'),'State retained';
  assert not exists(select 1 from public.workout_logs where user_id='00000000-0000-4000-8000-000000000201'),'Logs retained';
  assert not exists(select 1 from public.workout_log_deletions where user_id='00000000-0000-4000-8000-000000000201'),'Tombstones retained';
  assert not exists(select 1 from public.plan_updates where user_id='00000000-0000-4000-8000-000000000201'),'Updates retained';
  assert not exists(select 1 from public.feedback where message='Synthetic removed coach feedback'),'Coach feedback retained';
  assert exists(select 1 from public.feedback where message='Synthetic retained deletion feedback' and user_id is null and workout is null and screen='synthetic screen' and device='synthetic device'),'App feedback retention wrong';
  assert exists(select 1 from public.app_state where user_id='00000000-0000-4000-8000-000000000202'),'Unrelated account changed';
  assert exists(select 1 from public.feedback where message='Synthetic unrelated feedback' and user_id='00000000-0000-4000-8000-000000000202'),'Unrelated feedback changed';
end $$;
select 'PASS account deletion, retention, freshness, staff, isolation and stale-token checks' as result;
rollback;
