# DEV1: A calmer guided workout

This experiment starts from development commit d0c45f9. It changes presentation and navigation only. The three primary tabs are Today, Plan and Progress; the header profile button opens Settings and retains unread badges. The exercise catalogue is accessible from Plan; all original Library routes remain valid. The main workout action precedes optional exercises, and compact progress follows the workout.

Dev1 uses calm sage neutrals, spacious layouts and the existing connected set/rest path. Exercise targets start collapsed.

Light/dark and existing color choices remain available. The new neutral palette applies to the default color; saved color choices are respected. Typography uses system fonts without a font download. Media, swaps, coaching, timing, completion, warnings and account controls keep their existing behavior.

No database migration, storage key, state version, account policy, exercise ID or sync payload changes. This branch shares development data with dev and the other preview; edits to a test account remain account edits across all three. Presentation choices stay in DOM/transient UI state. Production is unchanged.

Preview: https://dev1.strongstart.app/ . Build: `node scripts/build-preview.mjs dev1`.
