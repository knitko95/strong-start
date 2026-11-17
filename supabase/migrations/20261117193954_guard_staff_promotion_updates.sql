-- Promotion preserves saved personal training, but must not later apply a plan
-- that was queued while this staff account was still coached as a member.
create function private.cancel_plans_on_coach_promotion() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  delete from public.plan_updates where user_id=new.user_id and applied_at is null;
  return new;
end $$;
revoke all on function private.cancel_plans_on_coach_promotion() from public,anon,authenticated;
create trigger cancel_plans_on_coach_promotion after insert on public.coaches
for each row execute function private.cancel_plans_on_coach_promotion();
