# Strong Start

A phone-first workout app that builds balanced weekly plans from a library of 320+ exercises, with warm-ups, cool-downs and progressive overload.

## How it's hosted
- Everything lives in `index.html` (one self-contained page), plus `manifest.webmanifest` and `icons/` so it can be added to a phone's Home Screen with the Strong Start logo.
- Hosted free on GitHub Pages from the `main` branch. Every push to `main` redeploys the site within a minute or two.

## Saving data
- Right now each person's data is saved in their own browser (key `strongstart_state_v3`). Settings › Backup can copy and load it.
- Next step: accounts and a shared database (Supabase) so data follows people across devices and the coach can see progress.

## Undoing a bad update
Every change is a commit. To roll back, revert the commit on GitHub (or ask Claude to) and the site redeploys the previous version.
