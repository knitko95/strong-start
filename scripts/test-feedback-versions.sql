-- Run only on strong-start-dev; all synthetic records and temporary roles roll back.
begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000601','version-member@example.invalid'),
 ('00000000-0000-4000-8000-000000000602','version-owner@example.invalid'),
 ('00000000-0000-4000-8000-000000000603','version-other@example.invalid');
update public.profiles set approved_at=now() where id in ('00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000602','00000000-0000-4000-8000-000000000603');
insert into public.app_owners(user_id) values('00000000-0000-4000-8000-000000000602');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000601',true);
insert into public.feedback(kind,message,app_version,app_build,app_environment) values('app','Synthetic version report','0.1.0','synthetic-old-build','development');
insert into public.feedback(kind,message) values('app','Synthetic legacy report');
do $$ begin
 begin insert into public.feedback(kind,message,app_version) values('app','Bad version','bad');raise exception 'Invalid version accepted';exception when check_violation then null;end;
 begin insert into public.feedback(kind,message,app_environment) values('app','Bad environment','other');raise exception 'Invalid environment accepted';exception when check_violation then null;end;
 begin insert into public.feedback(kind,message,resolved_version) values('app','Forged resolution','0.1.0');raise exception 'Sender forged resolution';exception when insufficient_privilege then null;end;
 begin update public.feedback set app_version='9.9.9';raise exception 'Reported version is mutable';exception when insufficient_privilege then null;end;
 update public.feedback set resolved_version='0.1.0',done_at=now() where message='Synthetic version report';
 assert not exists(select 1 from public.feedback where message='Synthetic version report' and done_at is not null),'Member resolved own feedback';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000603',true);
do $$ begin
 assert not exists(select 1 from public.feedback where message in ('Synthetic version report','Synthetic legacy report')),'Another member read feedback';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000602',true);
do $$ begin
 assert exists(select 1 from public.feedback where message='Synthetic legacy report' and app_version is null),'Legacy feedback changed';
 update public.feedback set done_at=now(),resolved_version='0.1.0' where message='Synthetic version report';
 assert exists(select 1 from public.feedback where message='Synthetic version report' and resolved_version='0.1.0' and app_build='synthetic-old-build'),'Owner resolution failed or altered provenance';
 begin update public.feedback set app_build='forged' where message='Synthetic version report';raise exception 'Owner changed reported build';exception when insufficient_privilege then null;end;
 update public.feedback set done_at=null,resolved_version=null where message='Synthetic version report';
 assert exists(select 1 from public.feedback where message='Synthetic version report' and done_at is null and resolved_version is null),'Undo failed';
end $$;
set local role anon;
do $$ begin
 begin perform app_version from public.feedback;raise exception 'Anonymous read allowed';exception when insufficient_privilege then null;end;
end $$;
rollback;
