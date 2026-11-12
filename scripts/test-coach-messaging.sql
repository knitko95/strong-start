-- Development only. Synthetic people and temporary staff roles roll back.
begin;
do $$ begin
 assert exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='coach_messages'),'Live message publication missing';
 assert (select relrowsecurity from pg_class where oid='public.coach_messages'::regclass),'Live table has no RLS';
end $$;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000301','message-member@example.invalid'),
 ('00000000-0000-4000-8000-000000000302','message-coach@example.invalid'),
 ('00000000-0000-4000-8000-000000000303','message-other@example.invalid'),
 ('00000000-0000-4000-8000-000000000304','message-other-coach@example.invalid'),
 ('00000000-0000-4000-8000-000000000305','message-unassigned@example.invalid');
insert into public.coaches(user_id) values('00000000-0000-4000-8000-000000000302'),('00000000-0000-4000-8000-000000000304');
update public.profiles set approved_at=now(),name='Synthetic member' where id::text like '00000000-0000-4000-8000-00000000030%';
update public.profiles set name='Synthetic coach' where id='00000000-0000-4000-8000-000000000302';
update public.profiles set invited_by='00000000-0000-4000-8000-000000000302' where id='00000000-0000-4000-8000-000000000301';
update public.profiles set invited_by='00000000-0000-4000-8000-000000000304' where id='00000000-0000-4000-8000-000000000303';
set local role anon;
do $$ begin
 begin perform public.coach_messaging('summary');raise exception 'Anonymous RPC allowed';exception when insufficient_privilege then null;end;
 begin perform * from public.coach_messages;raise exception 'Anonymous table read allowed';exception when insufficient_privilege then null;end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000301',true);
do $$ declare r jsonb; begin
 r:=public.coach_messaging('summary');assert r#>>'{coach,name}'='Synthetic coach','Wrong coach';
 assert jsonb_array_length(r->'inbox')=0,'Member has coach inbox';
 perform public.coach_messaging('send',null,'{"client_id":"00000000-0000-4000-8000-000000000311","message":"Synthetic question","tag":"question"}');
 perform public.coach_messaging('send',null,'{"client_id":"00000000-0000-4000-8000-000000000311","message":"Synthetic question","tag":"question"}');
 assert (select count(*) from public.coach_messages)=1,'Retry duplicated a message';
 begin perform public.coach_messaging('read','00000000-0000-4000-8000-000000000303');raise exception 'Member read another member';exception when insufficient_privilege then null;end;
 begin perform public.coach_messaging('done');raise exception 'Member marked coach done';exception when insufficient_privilege then null;end;
 begin insert into public.coach_messages(thread_id,sender_id,message) select id,auth.uid(),'Forged' from public.coach_threads;raise exception 'Direct write allowed';exception when insufficient_privilege then null;end;
 begin update public.coach_messages set read_at=now();raise exception 'Direct read-state write allowed';exception when insufficient_privilege then null;end;
 begin perform public.coach_messaging('send',null,'{"client_id":"00000000-0000-4000-8000-000000000312","message":" ","kind":"plan"}');raise exception 'Empty message allowed';exception when invalid_parameter_value then null;end;
 begin insert into public.feedback(kind,message)values('coach','Old shared API');raise exception 'Shared coach API still accepts messages';exception when insufficient_privilege then null;end;
 insert into public.feedback(kind,message)values('app','Synthetic owner feedback stays separate');
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000304',true);
do $$ begin
 assert (select count(*) from public.coach_messages)=0,'Other coach can see messages';
 begin perform public.coach_messaging('read','00000000-0000-4000-8000-000000000301');raise exception 'Other coach RPC can read messages';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000302',true);
do $$ declare r jsonb; msg jsonb; through text; begin
 r:=public.coach_messaging('summary');assert jsonb_array_length(r->'inbox')=1,'Coach missing thread';
 assert r#>>'{inbox,0,unread}'='1' and r#>>'{inbox,0,needs_reply}'='true','Missing unread/reply state';
 r:=public.coach_messaging('peek','00000000-0000-4000-8000-000000000301');
 assert r#>>'{messages,0,read_at}' is null,'Background peek issued a receipt';
 assert public.coach_messaging('summary')#>>'{inbox,0,unread}'='1','Peek cleared unread';
 r:=public.coach_messaging('read','00000000-0000-4000-8000-000000000301');through:=r#>>'{messages,0,id}';
 assert r#>>'{messages,0,read_at}' is not null,'Opened conversation has no read receipt';
 r:=public.coach_messaging('summary');assert r#>>'{inbox,0,unread}'='0' and r#>>'{inbox,0,needs_reply}'='true','Reading cleared needs reply';
 perform public.coach_messaging('send','00000000-0000-4000-8000-000000000301',jsonb_build_object('message','Synthetic reply','client_id','00000000-0000-4000-8000-000000000313','through',through));
 assert (select count(*) from public.coach_messages where sender_id=auth.uid())=1,'Sender was forged';
 r:=public.coach_messaging('summary');assert r#>>'{inbox,0,needs_reply}'='false','Reply failed to resolve';
 assert not exists(select 1 from public.feedback where kind='app'),'Coach sees owner feedback';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000301',true);
do $$ declare r jsonb; through text; begin
 r:=public.coach_messaging('summary');assert r#>>'{coach,unread}'='1','Reply missing unread badge';through:=r#>>'{coach,through}';
 r:=public.coach_messaging('peek');assert r#>>'{messages,1,read_at}' is null,'Unopened reply was marked read';
 perform public.coach_messaging('dismiss',null,jsonb_build_object('through',through));
 r:=public.coach_messaging('peek');assert r#>>'{messages,1,read_at}' is not null,'Dismiss did not issue Read receipt';
 r:=public.coach_messaging('summary');assert r#>>'{coach,unread}'='0','Dismiss did not clear badge';
 r:=public.coach_messaging('read');assert jsonb_array_length(r->'messages')=2,'Dismiss deleted conversation';
 perform public.coach_messaging('send',null,'{"client_id":"00000000-0000-4000-8000-000000000314","message":"New incoming after coach read"}');
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000302',true);
do $$ declare r jsonb; previous_ctid text; begin
 select ctid::text into previous_ctid from public.coach_messages where sender_id<>auth.uid() and message='Synthetic question';
 r:=public.coach_messaging('peek','00000000-0000-4000-8000-000000000301');assert r#>>'{messages,1,read_at}' is not null,'Sender cannot see Read receipt';
 perform public.coach_messaging('read','00000000-0000-4000-8000-000000000301');
 assert (select ctid::text from public.coach_messages where sender_id<>auth.uid() and message='Synthetic question')=previous_ctid,'Repeated read rewrote a receipt and would cause live loops';
 -- A stale retry/done must never resolve a newer member message.
 perform public.coach_messaging('send','00000000-0000-4000-8000-000000000301','{"client_id":"00000000-0000-4000-8000-000000000313","message":"Synthetic reply","through":"999999999"}');
 perform public.coach_messaging('done','00000000-0000-4000-8000-000000000301','{"through":"0"}');
 r:=public.coach_messaging('summary');assert r#>>'{inbox,0,needs_reply}'='true','Stale retry resolved newer message';
 r:=public.coach_messaging('read','00000000-0000-4000-8000-000000000301');
 perform public.coach_messaging('done','00000000-0000-4000-8000-000000000301',jsonb_build_object('through',r#>>'{messages,2,id}'));
 assert public.coach_messaging('summary')#>>'{inbox,0,needs_reply}'='false','Mark done failed';
 insert into public.plan_updates(user_id,update)values('00000000-0000-4000-8000-000000000301','{"plan":{},"note":"Synthetic new plan note"}');
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000301',true);
do $$ declare r jsonb; begin
 r:=public.coach_messaging('summary');assert r#>>'{coach,unread}'='1','Plan note missing unread badge';
 r:=public.coach_messaging('read');assert r#>>'{messages,3,kind}'='plan','Plan note missing from thread';
end $$;
reset role;
-- Pagination, disable/reassign, deleted-account cascades, and stale-token guards.
insert into public.coach_messages(thread_id,sender_id,message,created_at)
 select id,member_id,'Synthetic older unresolved question','2000-01-01T00:00:00Z'
 from public.coach_threads where member_id='00000000-0000-4000-8000-000000000301';
insert into public.coach_messages(thread_id,sender_id,message)
 select t.id,t.coach_id,'Synthetic history '||n from public.coach_threads t cross join generate_series(1,60)n
 where member_id='00000000-0000-4000-8000-000000000301';
set local role authenticated;
do $$ declare r jsonb; older jsonb; begin
 r:=public.coach_messaging('read');assert jsonb_array_length(r->'messages')=50 and r->>'has_more'='true','Pagination missing';
 assert public.coach_messaging('summary')#>>'{coach,unread}'='0','Opening long conversation left old unread messages';
 older:=public.coach_messaging('read',null,jsonb_build_object('before',r#>>'{messages,0,id}'));
 assert jsonb_array_length(older->'messages')=15 and older->>'has_more'='false','Older history missing';
 assert older#>>'{messages,0,message}'='Synthetic older unresolved question','Imported history sorted by ID instead of date';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000302',true);
do $$ declare r jsonb; begin
 r:=public.coach_messaging('read','00000000-0000-4000-8000-000000000301');
 assert r->>'needs_reply'='true','Older pending question lost from reply status';
 perform public.coach_messaging('done','00000000-0000-4000-8000-000000000301',jsonb_build_object('through',r->>'through'));
 assert public.coach_messaging('summary')#>>'{inbox,0,needs_reply}'='false','Older pending question cannot be marked done';
end $$;
reset role;
update public.profiles set disabled_at=now() where id='00000000-0000-4000-8000-000000000301';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000301',true);
do $$ begin
 assert (select count(*) from public.coach_messages)=0,'Disabled member sees messages';
 begin perform public.coach_messaging('summary');raise exception 'Disabled member RPC allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.profiles set disabled_at=null,invited_by='00000000-0000-4000-8000-000000000304' where id='00000000-0000-4000-8000-000000000301';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000302',true);
do $$ begin
 assert (select count(*) from public.coach_messages)=0,'Old coach retains thread after reassignment';
 begin perform public.coach_messaging('read','00000000-0000-4000-8000-000000000301');raise exception 'Old coach RPC still allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
delete from auth.users where id='00000000-0000-4000-8000-000000000301';
do $$ begin assert not exists(select 1 from public.coach_messages where message like 'Synthetic history%'),'Deleted member messages retained';end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000301',true);
do $$ begin
 begin perform public.coach_messaging('send',null,'{"client_id":"00000000-0000-4000-8000-000000000315","message":"Stale token"}');raise exception 'Deleted user can send';exception when insufficient_privilege then null;end;
end $$;
select 'PASS private coaching threads: isolation, sender/write protection, retries, read/reply distinction, plan notes, pagination, disable/reassign/delete' as result;
rollback;
