# Homepage and policy release: November 11, 2026

The owner explicitly approved publishing the reviewed homepage, privacy policy, terms and footer changes, followed by submitting Google branding for verification.

## Website publication

- Tested dev candidate: `abcf05344f3573efcf9ded4d721f1efbe2838dc3`, including `f07bcfd`.
- Production release: `42ca97b63e3d32af6ac5f30cacb8bdd0d769f500`. Only the two approved feature commits were cherry-picked onto current production. Unrelated dev hosting changes and local animation work were excluded.
- Cloudflare Workers Build `8d5acf61-ccfe-4edc-b107-a2196eb4ca3d` succeeded for that exact production SHA.
- The released `index.html`, `privacy.html`, `terms.html` and `sw.js` match the tested dev source. Production packaging preserves existing hosting behavior and includes the new terms page.
- Live pages: [homepage](https://strongstart.app/), [privacy](https://strongstart.app/privacy.html), [terms](https://strongstart.app/terms.html).

## Checks and limits

The isolated development build passed syntax/environment checks, 49 persistence/workout scenarios and six offline scenarios. The production package built successfully. Hosted live runtime files matched the release output, and the public files have no development noindex header.

Read-only live browser checks passed at 1280 × 844, 390 × 844, 320 × 568 and 844 × 390. The fixed policy footer is visible without scrolling; sign-in controls can scroll clear of it. Sign-in, reset, invite screens and terms navigation passed with no captured console errors. The app selected the production environment. No real account, workout, message or invite was mutated. Physical-phone keyboard and safe-area behavior remain unverified.

No database migration, Supabase configuration change, OAuth callback change or additional scope was required.

## Google branding: saved, not submitted

The existing Google Cloud project's app name is Strong Start. Its existing app icon, homepage, privacy URL and terms URL are saved. Existing support/developer contacts and OAuth clients were preserved. The app is already External and In production. Google reports no sensitive or restricted scopes needing data-access verification.

Domain ownership for `strongstart.app` was verified in the project owner's Google Search Console account using an additive DNS TXT record. Keep that record so verification remains valid. No Cloudflare account delegation or DNS routing change was made, and the verification value is not stored in this repository.

Submission remains blocked: the Branding page exposes no Verify Branding, Publish Branding or submission action, even after saving, reloading and verifying domain ownership. Verification Center says the branding is not shown to users and directs the owner back to Branding. Google's documented legacy consent-screen URL redirects to the same Google Auth Platform. No verification request was submitted, and no Google approval or branded consent screen was observed.

This is an observed console blocker; its cause is unconfirmed. [Google's brand-verification workflow](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification) describes the missing action. Check the [project's Verification Center](https://console.cloud.google.com/auth/verification?project=strong-start-1) and [Branding page](https://console.cloud.google.com/auth/branding?project=strong-start-1) again, or contact Google support if the action remains absent. Do not add unnecessary scopes, alter callbacks or recreate the project to force a submission control.
