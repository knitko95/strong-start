# DEV2: A clearer workout log

This experiment starts from development commit d0c45f9. It changes presentation and navigation only. The three primary tabs are Today, Plan and Progress; the header profile button opens Settings and retains unread badges. The exercise catalogue is accessible from Plan; all original Library routes remain valid. The main workout action precedes optional exercises, and compact progress follows the workout.

Dev2 uses neutral blue, aligned compact sections, an initially open exercise list, and a set ledger with logged values and explicit Now/Done labels. Tap any set to use the existing editor; rest buttons use existing rest controls. Paired sets retain A/B labels and shared rests.

Light/dark and existing color choices remain available. The new neutral palette applies to the default color; saved color choices are respected. Typography uses system fonts without a font download. Media, swaps, coaching, timing, completion, warnings and account controls keep their existing behavior.

No database migration, storage key, state version, account policy, exercise ID or sync payload changes. This branch shares development data with dev and the other preview; edits to a test account remain account edits across all three. Presentation choices stay in DOM/transient UI state. Production is unchanged.

Preview: https://dev2.strongstart.app/ . Build: `node scripts/build-preview.mjs dev2`.
