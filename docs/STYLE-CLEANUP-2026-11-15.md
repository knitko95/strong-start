# Consistent controls on development — November 15, 2026

## Scope

Development-only candidate from `76ddb2a33f1fd2b19bd7e902e676aab42f818b77`, version 0.8.1. This record covers visual cleanup requested after a screen/style audit; it does not authorize production publication.

- Constrain quick and longer setup to the available phone width and use shrinkable weekday/duration grid columns.
- Style the active equipment-location tab from its actual selection attribute.
- Darken Blush, Green and Blue light-theme muted text. Dark palettes retain their existing colors.
- Share segmented-selector styles between Settings/setup, Progress, Feedback and coach inbox. Selected text uses the theme foreground token.
- Give common secondary buttons and action links consistent 44 px touch heights and deliberate text sizes. Compact unit controls retain a smaller variant inside their input fields.
- Share right-side chevrons across primary expandable cards and subordinate native details rows; preserve their information hierarchy and open/closed behavior.
- Use a common dialog title/Close treatment, retaining existing Cancel/Done/confirmation actions. Focused workout summary sheets and full-height conversations retain their contextual layouts.

Provider branding, workouts/media, navigation destinations, standalone policy pages, state/schema/storage, permissions and analytics capture/configuration are unchanged. No database migration or production configuration change is introduced by this candidate.

## Verification

- Isolated dev build: syntax/environment/version, 108 persistence/workout regression scenarios and eight offline scenarios passed.
- New synthetic style suite at 1280/390/320 px: quick/longer schedule fit, active multi-location tabs, helper-text contrast on page/card/sunken surfaces across four palettes in light/dark, secondary touch targets, pointer/keyboard disclosures, dialog labels, Cancel focus, Close/Escape behavior, focus return and saved-data preservation passed.
- Settings navigation/persistence, Progress calculations/search/filtering, analytics consent/reload, Today exercise previews/swaps, coach messages/composer and focus geometry passed at desktop and narrow phone widths. Analytics requests were intercepted.
- Warm-up and cool-down timeline suites passed, including their interaction journeys.
- Workout layout suite: 304 layouts passed, including 320/390 px, desktop/landscape, light/dark and simulated safe areas. Its selector was updated for the already-existing workout-preview card markup.
- Screen-family visual pass: 109 synthetic states at three base viewport/theme configurations plus 54 selected state families in five additional palette configurations (597 screenshot/computed-style records). No uncaught fixture page errors or horizontal document overflow recorded. Representative screenshots reviewed, including fixed setup, multi-location equipment, Settings, Progress, Feedback, action menus and dark sheets.
- Relevant browser suites now wait for the existing asynchronous device-storage startup before injecting synthetic state or asserting after reload. This addresses fixture races; no application startup/persistence workaround was added.

The local capture set includes synthetic auth, coach and owner render states. It is appearance evidence, not live permission/provider/backend verification. Not every possible text length, validation state, keyboard, device or theme cross-product was exercised. Physical phones, real-account workflows and native provider/system sheets remain unverified.

## Reproduce

Build with the existing development environment and public analytics configuration, then run:

```powershell
node scripts/build-dev.mjs
node scripts/test-style-consistency.cjs
node scripts/test-settings-navigation.cjs
node scripts/test-history-progress.cjs
node scripts/test-analytics-browser.cjs
node scripts/test-coach-messaging.cjs
node scripts/test-today-previews.cjs
node scripts/test-warmup-timeline.cjs
node scripts/test-cooldown-timeline.cjs
node scripts/test-workout-layout.cjs
```

Browser tests use the repository's optional Playwright installation and installed Chrome. Public-font suites need network access; synthetic suites block account/database mutations. The new style suite and most existing suites accept the hosted dev URL as an argument for post-deployment checks. Local screenshots and fixtures are excluded from the release.
