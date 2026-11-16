# Navigation and policy appearance — November 15, 2026

Development candidate v0.8.2 starts from dev `dd66acfb9e169c6009cb9ba8cbb9d79275801216` and completes the navigation/policy presentation follow-up to the style review.

- The profile icon opens the Settings overview. Weigh-ins return to Profile & appearance or Today according to their entry point, with the corresponding navigation selection. Equipment returns to Your training; coach People returns to All settings.
- Privacy and Terms share the app's typography and palette tokens, branding, light/dark/system preference and accessible links. Their existing legal wording and dates are preserved.
- A separate, environment-scoped display cache contains only `{theme,color}`. Policy pages do not load account, workout, Auth or analytics code. Missing/blocked storage uses Blush and system appearance. Shared files are included in both packaging paths and the offline shell.

Local verification passed the full isolated development build (108 regression scenarios, nine offline scenarios), display-cache isolation/sanitization, contextual navigation and policy appearance at 1280/390/320 px, all four palettes in light/dark/system modes, blocked-storage fallback, existing style/Settings suites and 15 intercepted domain-transition scenarios. A public-font pass verified Nunito and Playfair Display; representative policy screenshots were visually reviewed. Production packaging was built locally only.

Reproduce with `node scripts/build-dev.mjs`, `node scripts/test-policy-navigation.cjs`, `node scripts/test-style-consistency.cjs`, `node scripts/test-settings-navigation.cjs` and `node scripts/test-domain-transition.cjs` (the latter also requires `node scripts/build-production.mjs`). The policy/navigation suite accepts the hosted dev URL; `POLICY_VERIFY_FONTS=1` enables the public-font check. Browser suites use synthetic storage and block account/analytics traffic.

Physical phones, native screen readers and real-account/provider behavior remain unverified. No database migration, production configuration change or production publication is part of this work. Hosted deployment evidence belongs in the release handoff after the exact candidate is deployed and checked.
