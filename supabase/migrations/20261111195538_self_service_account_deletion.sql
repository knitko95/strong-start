-- Self-service deletion is separate from the owner's targeted account RPC.
-- No caller-supplied account ID, no browser admin credentials, no new table grants.
create function public.delete_my_account(p_confirmation text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in to delete your account' using errcode='42501'; end if;
  if p_confirmation is distinct from 'DELETE' then
    raise exception 'Deletion confirmation required' using errcode='22023';
  end if;
  if public.is_staff(uid) then
    raise exception 'Arrange staff account deletion with the app owner' using errcode='42501';
  end if;
  -- Check the trusted live session, not token refresh time or editable metadata.
  if not exists(select 1 from auth.sessions s where s.user_id=uid
      and s.id::text=auth.jwt()->>'session_id'
      and s.created_at > now()-interval '10 minutes'
      and s.created_at <= now()
      and (s.not_after is null or s.not_after > now())) then
    raise exception 'Sign in again before deleting your account' using errcode='P0001';
  end if;
  -- Same lock as account sync: a save cannot recreate the account after deletion.
  perform 1 from public.profiles where id=uid for update;
  if not exists(select 1 from auth.users where id=uid) then
    raise exception 'Account no longer exists' using errcode='42501';
  end if;
  delete from public.feedback where user_id=uid and kind<>'app';
  update public.feedback set workout=null where user_id=uid and kind='app';
  -- FKs remove profile, state, logs, tombstones, updates, and Auth sessions.
  -- App feedback's profile FK uses SET NULL; consumed invites keep used_at.
  delete from auth.users where id=uid;
end $$;
revoke all on function public.delete_my_account(text) from public, anon, authenticated;
grant execute on function public.delete_my_account(text) to authenticated;
