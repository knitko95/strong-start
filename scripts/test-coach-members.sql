-- Development only. Every account, role, invite and mutation rolls back.
begin;
insert into auth.users(id,email)
select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'coach-boundary-'||n||'@example.invalid'
from generate_series(901,908)n;
update public.profiles set approved_at=now(),name='Synthetic boundary member'
where id between '00000000-0000-4000-8000-000000000901' and '00000000-0000-4000-8000-000000000908';
insert into public.coaches(user_id) values
('00000000-0000-4000-8000-000000000901'),('00000000-0000-4000-8000-000000000902'),('00000000-0000-4000-8000-000000000908');
insert into public.app_owners(user_id) values
('00000000-0000-4000-8000-000000000901'),('00000000-0000-4000-8000-000000000902');
update public.profiles set invited_by='00000000-0000-4000-8000-000000000901' where id in
('00000000-0000-4000-8000-000000000903','00000000-0000-4000-8000-000000000907','00000000-0000-4000-8000-000000000908');
update public.profiles set invited_by='00000000-0000-4000-8000-000000000902' where id='00000000-0000-4000-8000-000000000904';
update public.profiles set approved_at=null where id='00000000-0000-4000-8000-000000000906';
update public.profiles set disabled_at=now() where id='00000000-0000-4000-8000-000000000907';
insert into public.app_state(user_id,state)
select id,'{"settings":{"name":"Synthetic"},"block":{"plan":{}}}'::jsonb from public.profiles
where id between '00000000-0000-4000-8000-000000000901' and '00000000-0000-4000-8000-000000000908';
insert into public.workout_logs(user_id,id,date,data)
select id,'boundary-test',now(),'{"id":"boundary-test"}'::jsonb from public.profiles
where id between '00000000-0000-4000-8000-000000000901' and '00000000-0000-4000-8000-000000000908';
insert into public.plan_updates(user_id,created_by,update) values
('00000000-0000-4000-8000-000000000903','00000000-0000-4000-8000-000000000901','{"plan":{}}'),
('00000000-0000-4000-8000-000000000904','00000000-0000-4000-8000-000000000902','{"plan":{}}'),
('00000000-0000-4000-8000-000000000908','00000000-0000-4000-8000-000000000901','{"plan":{}}');
insert into public.coach_threads(member_id,coach_id) values
('00000000-0000-4000-8000-000000000908','00000000-0000-4000-8000-000000000901');
insert into public.coach_messages(thread_id,sender_id,message)
select id,member_id,'Synthetic former-member message' from public.coach_threads where member_id='00000000-0000-4000-8000-000000000908';
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000901';
do $$ declare ids uuid[]; begin
  select array_agg(id order by id) into ids from public.coach_people()
    where id between '00000000-0000-4000-8000-000000000901' and '00000000-0000-4000-8000-000000000908';
  assert ids=array['00000000-0000-4000-8000-000000000903'::uuid,'00000000-0000-4000-8000-000000000907'::uuid],'Owner coach list crossed assignment or included staff';
  assert (select count(*) from public.profiles where id between '00000000-0000-4000-8000-000000000901' and '00000000-0000-4000-8000-000000000908')=3,'Profile read escaped owner/member boundary';
  assert (select count(*) from public.app_state where user_id between '00000000-0000-4000-8000-000000000901' and '00000000-0000-4000-8000-000000000908')=2,'State read escaped boundary';
  assert (select count(*) from public.workout_logs where user_id between '00000000-0000-4000-8000-000000000901' and '00000000-0000-4000-8000-000000000908')=2,'Log read escaped boundary';
  assert (select count(*) from public.plan_updates where user_id between '00000000-0000-4000-8000-000000000901' and '00000000-0000-4000-8000-000000000908')=1,'Plan read escaped boundary';
  assert not exists(select 1 from public.coach_messages where message='Synthetic former-member message'),'Promoted coach conversation leaked';
  assert not private.coach_pair_allowed('00000000-0000-4000-8000-000000000908',auth.uid()),'Promoted coach still a member';
  begin insert into public.plan_updates(user_id,update) values('00000000-0000-4000-8000-000000000904','{"plan":{}}');raise exception 'Cross-coach plan write allowed';exception when insufficient_privilege then null;end;
  begin insert into public.plan_updates(user_id,update) values('00000000-0000-4000-8000-000000000908','{"plan":{}}');raise exception 'Coach target write allowed';exception when insufficient_privilege then null;end;
  begin insert into public.plan_updates(user_id,update) values('00000000-0000-4000-8000-000000000905','{"plan":{}}');raise exception 'Unassigned write allowed';exception when insufficient_privilege then null;end;
  begin update public.profiles set invited_by=auth.uid() where id='00000000-0000-4000-8000-000000000904';raise exception 'Assignment editable';exception when insufficient_privilege then null;end;
  begin perform public.admin_set_disabled('00000000-0000-4000-8000-000000000904',true);raise exception 'Other admin disabled member';exception when insufficient_privilege then null;end;
  begin perform public.admin_delete_account('00000000-0000-4000-8000-000000000904');raise exception 'Other admin deleted member';exception when insufficient_privilege then null;end;
  begin perform public.coach_messaging('peek','00000000-0000-4000-8000-000000000908');raise exception 'Coach conversation RPC allowed';exception when insufficient_privilege then null;end;
  insert into public.plan_updates(user_id,update) values('00000000-0000-4000-8000-000000000903','{"plan":{},"note":"Assigned member plan"}');
  perform public.admin_set_disabled('00000000-0000-4000-8000-000000000907',false);
  assert private.coach_member_allowed('00000000-0000-4000-8000-000000000907'),'Assigned admin cannot reactivate';
  perform public.admin_set_disabled('00000000-0000-4000-8000-000000000907',true);
  perform set_config('test.boundary_invite',(select code from public.create_invite('Synthetic new member')),true);
end $$;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000902';
do $$ begin
  assert (select array_agg(id) from public.coach_people() where id between '00000000-0000-4000-8000-000000000901' and '00000000-0000-4000-8000-000000000908')=array['00000000-0000-4000-8000-000000000904'::uuid],'Second coach list leaked';
  assert not exists(select 1 from public.app_state where user_id='00000000-0000-4000-8000-000000000903'),'Second coach state leaked';
end $$;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000903';
do $$ begin
  assert exists(select 1 from public.app_state where user_id=auth.uid()),'Member lost own state';
  assert exists(select 1 from public.workout_logs where user_id=auth.uid()),'Member lost own history';
  assert not exists(select 1 from public.coach_people()),'Member got coach list';
  assert public.coach_messaging('peek')#>>'{coach_id}'='00000000-0000-4000-8000-000000000901','Assigned messaging broken';
end $$;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000906';
do $$ begin assert public.redeem_invite(current_setting('test.boundary_invite'))='ok','Invite redemption failed';end $$;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000901';
do $$ begin
  assert exists(select 1 from public.coach_people() where id='00000000-0000-4000-8000-000000000906'),'Invited member missing from inviting coach';
end $$;
reset role;
-- Removing admin membership must not grant additional reads or disabled members.
delete from public.app_owners where user_id='00000000-0000-4000-8000-000000000901';
set local role authenticated;
do $$ begin
  assert not exists(select 1 from public.coach_people() where id='00000000-0000-4000-8000-000000000907'),'Ordinary coach saw disabled member';
  begin perform public.admin_set_disabled('00000000-0000-4000-8000-000000000903',true);raise exception 'Non-admin managed member';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- Reassignment removes old-coach access immediately.
update public.profiles set invited_by='00000000-0000-4000-8000-000000000902' where id='00000000-0000-4000-8000-000000000903';
set local role authenticated;
do $$ begin
  assert not exists(select 1 from public.app_state where user_id='00000000-0000-4000-8000-000000000903'),'Reassignment retained state access';
  assert not exists(select 1 from public.coach_people() where id='00000000-0000-4000-8000-000000000903'),'Reassignment retained roster';
end $$;
set local role anon;
do $$ begin
  begin perform private.coach_member_allowed('00000000-0000-4000-8000-000000000903');raise exception 'Anonymous helper allowed';exception when insufficient_privilege then null;end;
  begin perform public.coach_people();raise exception 'Anonymous roster allowed';exception when insufficient_privilege then null;end;
end $$;
rollback;
select 'coach member isolation passed; fixtures rolled back' as result;
