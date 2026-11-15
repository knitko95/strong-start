-- Additive: older clients and feedback rows keep NULL metadata.
-- Existing RLS still limits updates to approved app owners.
alter table public.feedback
  add column app_version text check (app_version is null or (char_length(app_version)<=30 and app_version ~ '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$')),
  add column app_build text check (app_build is null or char_length(app_build) between 1 and 100),
  add column app_environment text check (app_environment in ('development','production')),
  add column resolved_version text check (resolved_version is null or (char_length(resolved_version)<=30 and resolved_version ~ '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$')),
  add constraint feedback_resolution_done check (resolved_version is null or done_at is not null);

grant insert (app_version,app_build,app_environment) on public.feedback to authenticated;
grant update (resolved_version) on public.feedback to authenticated;
-- SELECT is already a table grant. No new table/function/policy or staff grants.
