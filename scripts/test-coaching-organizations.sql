-- Development only. Synthetic identities, staff roles, organizations and changes roll back.
begin;
insert into auth.users(id,email,email_confirmed_at)
select ('00000000-0000-4000-9000-'||lpad(n::text,12,'0'))::uuid,'org-test-'||n||'@example.invalid',now() from generate_series(1001,1016)n;
insert into auth.identities(provider_id,user_id,identity_data,provider)
select id::text,id,jsonb_build_object('sub',id::text,'email',email),'google' from auth.users
where id between '00000000-0000-4000-9000-000000001001' and '00000000-0000-4000-9000-000000001012';
update public.profiles set approved_at=now(),name='Synthetic '||right(id::text,4)
where id between '00000000-0000-4000-9000-000000001001' and '00000000-0000-4000-9000-000000001016';
update public.profiles set approved_at=null where id='00000000-0000-4000-9000-000000001015';
insert into private.coaching_organizations(id,name) values
('00000000-0000-4000-9000-000000001101','Synthetic organization A'),('00000000-0000-4000-9000-000000001102','Synthetic organization B');
insert into public.coaches(user_id) select id from public.profiles where id between '00000000-0000-4000-9000-000000001001' and '00000000-0000-4000-9000-000000001006' or id='00000000-0000-4000-9000-000000001010';
insert into private.coaching_staff(user_id,organization_id,role,is_admin)
select id,'00000000-0000-4000-9000-000000001101',case when right(id::text,4) in ('1003','1006') then 'lead' else 'coach' end,
right(id::text,4) in ('1001','1002') from public.profiles where id between '00000000-0000-4000-9000-000000001001' and '00000000-0000-4000-9000-000000001006';
insert into private.coaching_staff(user_id,organization_id,is_admin) values('00000000-0000-4000-9000-000000001010','00000000-0000-4000-9000-000000001102',true);
update private.coaching_staff set reports_to='00000000-0000-4000-9000-000000001003' where user_id in ('00000000-0000-4000-9000-000000001004','00000000-0000-4000-9000-000000001006');
update public.profiles set invited_by='00000000-0000-4000-9000-000000001004' where id in ('00000000-0000-4000-9000-000000001007','00000000-0000-4000-9000-000000001012','00000000-0000-4000-9000-000000001013');
update public.profiles set invited_by='00000000-0000-4000-9000-000000001005' where id='00000000-0000-4000-9000-000000001008';
update public.profiles set invited_by='00000000-0000-4000-9000-000000001006' where id='00000000-0000-4000-9000-000000001009';
update public.profiles set invited_by='00000000-0000-4000-9000-000000001010' where id='00000000-0000-4000-9000-000000001011';
insert into public.app_owners(user_id) values('00000000-0000-4000-9000-000000001016');
insert into public.app_state(user_id,state) select id,'{"settings":{"name":"Synthetic"},"block":{"plan":{}}}'::jsonb from public.profiles
where id between '00000000-0000-4000-9000-000000001001' and '00000000-0000-4000-9000-000000001016';
insert into public.workout_logs(user_id,id,date,data) select id,'org-test',now(),'{"id":"org-test"}'::jsonb from public.profiles
where id between '00000000-0000-4000-9000-000000001001' and '00000000-0000-4000-9000-000000001016';
insert into public.plan_updates(user_id,created_by,update) values
('00000000-0000-4000-9000-000000001012','00000000-0000-4000-9000-000000001004','{"plan":{}}');
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-4000-9000-000000001004';
do $$ begin
 assert private.coach_member_allowed('00000000-0000-4000-9000-000000001007'),'Coach lost own member';
 assert not private.coach_member_allowed('00000000-0000-4000-9000-000000001008'),'Coach saw other coach member';
 assert not exists(select 1 from public.app_state where user_id in ('00000000-0000-4000-9000-000000001003','00000000-0000-4000-9000-000000001008')),'Coach state boundary failed';
 assert jsonb_array_length(public.coaching_organization()->'coaches')=1,'Coach directory escaped scope';
 begin perform public.coaching_organization('update_coach',auth.uid(),'{"role":"lead","is_admin":true}');raise exception 'Self promotion allowed';exception when insufficient_privilege then null;end;
 begin select * from private.coaching_staff;raise exception 'Direct staff table exposed';exception when insufficient_privilege then null;end;
 insert into public.plan_updates(user_id,update) values('00000000-0000-4000-9000-000000001007','{"plan":{},"note":"Synthetic primary coach note"}');
 perform public.coach_messaging('send','00000000-0000-4000-9000-000000001007','{"client_id":"00000000-0000-4000-9000-000000001201","message":"Synthetic original coach message"}');
end $$;
set local request.jwt.claim.sub='00000000-0000-4000-9000-000000001003';
do $$ begin
 assert jsonb_array_length(public.coaching_organization()->'coaches')=3,'Lead reporting chain incorrect';
 assert private.coach_member_allowed('00000000-0000-4000-9000-000000001007') and private.coach_member_allowed('00000000-0000-4000-9000-000000001009'),'Lead lost team members';
 assert not private.coach_member_allowed('00000000-0000-4000-9000-000000001008'),'Lead saw outside team';
 assert not exists(select 1 from public.workout_logs where user_id='00000000-0000-4000-9000-000000001004'),'Lead saw coach personal workout';
 perform public.coach_messaging('send','00000000-0000-4000-9000-000000001007','{"client_id":"00000000-0000-4000-9000-000000001202","message":"Synthetic supervisor message"}');
 insert into public.plan_updates(user_id,update) values('00000000-0000-4000-9000-000000001009','{"plan":{},"note":"Synthetic supervisor plan note"}');
end $$;
set local request.jwt.claim.sub='00000000-0000-4000-9000-000000001007';
do $$ declare r jsonb; begin
 r:=public.coach_messaging('read');assert jsonb_array_length(r->'messages')=3,'Member missing team conversation';
 assert jsonb_array_length(r->'access')=4,'Member does not see primary, lead and two admins';
 assert r#>>'{messages,2,sender_name}'='Synthetic 1003','Supervisor sender name missing';
 assert exists(select 1 from public.app_state where user_id=auth.uid()),'Member self state lost';
 begin perform public.coaching_organization();raise exception 'Member got staff RPC';exception when insufficient_privilege then null;end;
end $$;
set local request.jwt.claim.sub='00000000-0000-4000-9000-000000001001';
do $$ declare expected jsonb; r jsonb; begin
 assert private.coach_member_allowed('00000000-0000-4000-9000-000000001008'),'Admin missing org member';
 assert not private.coach_member_allowed('00000000-0000-4000-9000-000000001011'),'Cross-organization member leaked';
 assert not exists(select 1 from public.app_state where user_id='00000000-0000-4000-9000-000000001003'),'Admin saw staff personal training';
 r:=public.coaching_organization();assert jsonb_array_length(r->'coaches')=6,'Admin directory missing staff';
 begin perform public.coaching_organization('update_coach','00000000-0000-4000-9000-000000001010','{}');raise exception 'Cross org coach update allowed';exception when insufficient_privilege then null;end;
 expected:='{"role":"coach","is_admin":true,"reports_to":null}';
 begin perform public.coaching_organization('update_coach',auth.uid(),jsonb_build_object('expected',expected,'role','lead','is_admin',true));raise exception 'Admin self promotion allowed';exception when insufficient_privilege then null;end;
 expected:='{"role":"lead","is_admin":false,"reports_to":null}';
 begin perform public.coaching_organization('update_coach','00000000-0000-4000-9000-000000001003',jsonb_build_object('expected',expected,'role','lead','is_admin',false,'reports_to','00000000-0000-4000-9000-000000001006'));raise exception 'Cycle allowed';exception when invalid_parameter_value then null;end;
 begin perform public.coaching_organization('update_coach','00000000-0000-4000-9000-000000001003',jsonb_build_object('expected',expected,'role','coach','is_admin',false));raise exception 'Lead demoted with reporting coaches';exception when invalid_parameter_value then null;end;
 begin perform public.coaching_organization('add_coach',null,'{"email":"org-test-1013@example.invalid"}');raise exception 'Non-Google staff allowed';exception when invalid_parameter_value then null;end;
 perform public.coaching_organization('add_coach',null,'{"email":"org-test-1012@example.invalid"}');
 assert not private.coach_member_allowed('00000000-0000-4000-9000-000000001012'),'Promoted coach still exposed as member';
 perform public.coaching_organization('transfer_member','00000000-0000-4000-9000-000000001007','{"coach_id":"00000000-0000-4000-9000-000000001005","expected_coach":"00000000-0000-4000-9000-000000001004"}');
 assert not exists(select 1 from public.plan_updates where user_id='00000000-0000-4000-9000-000000001007' and applied_at is null),'Transfer kept stale queued plans';
 begin perform public.coaching_organization('transfer_member','00000000-0000-4000-9000-000000001008','{"coach_id":"00000000-0000-4000-9000-000000001010","expected_coach":"00000000-0000-4000-9000-000000001005"}');raise exception 'Cross org transfer allowed';exception when invalid_parameter_value then null;end;
 perform public.admin_set_disabled('00000000-0000-4000-9000-000000001008',true);
 assert private.coach_member_allowed('00000000-0000-4000-9000-000000001008',true),'Admin cannot manage disabled member';
 perform public.admin_set_disabled('00000000-0000-4000-9000-000000001008',false);
 expected:='{"role":"coach","is_admin":true,"reports_to":null}';
 perform public.coaching_organization('update_coach','00000000-0000-4000-9000-000000001002',jsonb_build_object('expected',expected,'role','coach','is_admin',false));
 begin perform public.coaching_organization('update_coach',auth.uid(),jsonb_build_object('expected',expected,'role','coach','is_admin',false));raise exception 'Final admin removed';exception when invalid_parameter_value then null;end;
 expected:='{"role":"coach","is_admin":false,"reports_to":null}';
 perform public.coaching_organization('update_coach','00000000-0000-4000-9000-000000001002',jsonb_build_object('expected',expected,'role','coach','is_admin',true));
 begin perform public.coaching_organization('update_coach','00000000-0000-4000-9000-000000001002',jsonb_build_object('expected',expected,'role','lead','is_admin',true));raise exception 'Stale role overwrite allowed';exception when serialization_failure then null;end;
 assert jsonb_array_length(public.coaching_organization()->'audit')>=5,'Admin changes lack audit';
end $$;
set local request.jwt.claim.sub='00000000-0000-4000-9000-000000001004';
do $$ begin
 assert not private.coach_member_allowed('00000000-0000-4000-9000-000000001007'),'Old coach kept transferred member';
 assert not exists(select 1 from public.coach_messages where message='Synthetic original coach message'),'Old coach kept conversation';
 begin perform public.coach_messaging('peek','00000000-0000-4000-9000-000000001007');raise exception 'Old coach RPC retained access';exception when insufficient_privilege then null;end;
end $$;
set local request.jwt.claim.sub='00000000-0000-4000-9000-000000001005';
do $$ declare r jsonb; begin
 r:=public.coach_messaging('read','00000000-0000-4000-9000-000000001007');assert jsonb_array_length(r->'messages')=3,'New coach lost conversation history';
 perform public.coach_messaging('send','00000000-0000-4000-9000-000000001007','{"client_id":"00000000-0000-4000-9000-000000001203","message":"Synthetic new coach reply"}');
 perform set_config('test.organization_invite',(select code from public.create_invite('Synthetic new member')),true);
end $$;
set local request.jwt.claim.sub='00000000-0000-4000-9000-000000001015';
do $$ begin assert public.redeem_invite(current_setting('test.organization_invite'))='ok','Organization invite failed';end $$;
set local request.jwt.claim.sub='00000000-0000-4000-9000-000000001016';
do $$ begin
 begin perform public.coaching_organization();raise exception 'App owner became org admin implicitly';exception when insufficient_privilege then null;end;
end $$;
set local role anon;
do $$ begin
 begin perform public.coaching_organization();raise exception 'Anonymous org RPC allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$ begin
 assert not exists(select 1 from public.plan_updates where user_id='00000000-0000-4000-9000-000000001012' and applied_at is null),'Promotion retained queued member plan';
 assert (select state#>>'{settings,name}' from public.app_state where user_id='00000000-0000-4000-9000-000000001012')='Synthetic','Promotion changed saved personal plan';
 assert exists(select 1 from public.workout_logs where user_id='00000000-0000-4000-9000-000000001012'),'Promotion deleted personal history';
end $$;
rollback;
select 'PASS organizations: coach/lead/admin scope, personal privacy, Google staff, role/cycle/final-admin/stale guards, transfer history/revocation, invite and audit; fixtures rolled back' result;
