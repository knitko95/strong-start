// UI acceptance checks use synthetic browser drafts and mocked workspace APIs only.
// No real authoring record, workout, account or backend is mutated.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const url = process.argv[2] || 'http://127.0.0.1:8734/exercise-guides/pose-review/';
const evidence = path.join(root, 'test-results/pose-review');
const seed = JSON.parse(fs.readFileSync(path.join(root, 'exercise-guides/pose-review/seed.v1.json'), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
fs.mkdirSync(evidence, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const results = [];
  async function open(width, mode = 'static', fixture = null) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', acceptDownloads: true });
    const page = await context.newPage();
    const errors = [], requests = [], decisions = [];
    let conflict = mode === 'workspace';
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    page.on('request', request => requests.push(request.url()));
    await context.route('**/*', async route => {
      const request = route.request(), target = new URL(request.url());
      if (target.pathname.startsWith('/api/pose-review/')) {
        if (mode === 'static') return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
        if (target.pathname.endsWith('/state')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ schemaVersion: 1, mode: 'workspace', token: 'synthetic-review-token', exercises: fixture }) });
        if (target.pathname.endsWith('/decision')) {
          const body = request.postDataJSON();
          decisions.push(body);
          assert.equal(request.headers()['x-pose-review-token'], 'synthetic-review-token');
          const record = fixture.find(entry => entry.id === body.id);
          const version = record.versions.find(entry => entry.id === body.versionId);
          assert.equal(body.fingerprint, version.fingerprint, 'Decision includes the exact frame fingerprint');
          if (conflict) {
            conflict = false;
            record.revision++;
            return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Record changed. Refresh before saving.' }) });
          }
          assert.equal(body.expectedRevision, record.revision, 'A refreshed decision uses the current revision');
          record.revision++;
          record.review = { versionId: body.versionId, status: body.status, note: body.note, updatedAt: '2026-11-16T00:00:00.000Z' };
          record.history.push({ id: 'synthetic-owner-review', at: record.review.updatedAt, type: 'review', versionId: body.versionId, status: body.status, note: body.note });
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ record }) });
        }
        if (target.pathname.endsWith('/import')) {
          const body = request.postDataJSON(), changed = [];
          assert.equal(request.headers()['x-pose-review-token'], 'synthetic-review-token');
          for (const incoming of body.records) {
            const record = fixture.find(entry => entry.id === incoming.id);
            assert.equal(body.expectedRevisions[record.id], record.revision);
            record.revision++;
            record.review = clone(incoming.review);
            record.history.push({ id: 'synthetic-import-review', at: record.review.updatedAt, type: 'owner-decision', versionId: record.review.versionId, status: record.review.status, note: record.review.note });
            changed.push(record);
          }
          // The real API returns changed records only; the UI must retain all others.
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ exercises: changed }) });
        }
        return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Unexpected test API request' }) });
      }
      if (target.origin !== new URL(url).origin) return route.abort();
      return route.continue();
    });
    await page.goto(url);
    await page.locator('#exercise-list [data-exercise-id]').first().waitFor();
    return { context, page, errors, requests, decisions };
  }
  async function message(page, expression) {
    try{await page.waitForFunction(pattern => new RegExp(pattern, 'i').test(document.querySelector('#message')?.textContent || ''), expression);}catch(error){error.message+='\nVisible message: '+await page.locator('#message').textContent();throw error;}
  }
  async function selectExercise(page, id) {
    await page.locator('#exercise-list [data-exercise-id="' + id + '"]').click();
    await page.locator('#version-select').waitFor();
  }
  try {
    assert.equal(seed.exercises.length, 18);
    for (const width of [1280, 390, 320]) {
      const { context, page, errors, requests } = await open(width);
      assert.equal(await page.locator('#exercise-list [data-exercise-id]').count(), 18);
      assert.deepEqual(await page.locator('#exercise-detail > .viewer-card, #exercise-detail > .review-panel').evaluateAll(panels=>panels.slice(0,3).map(p=>p.classList.contains('viewer-card')?'Demonstration':p.querySelector('h3')?.textContent)),['Demonstration','Your review','Your reference images'],'Demonstration comes first, followed directly by review and reference images');
      assert.equal(await page.locator('details.secondary-panel').count(),3);
      assert.equal(await page.locator('details.secondary-panel[open]').count(),0,'Technical information starts collapsed');
      for(const id of ['generation-brief','independent-audit','decision-history']){await page.locator('#'+id+' > summary').click();assert.equal(await page.locator('#'+id).getAttribute('open'),'');await page.locator('#'+id+' > summary').click();}
      await page.getByRole('button', { name: 'Needs review (0)', exact: true }).click();
      assert.equal(await page.locator('#exercise-list [data-exercise-id]').count(), 0);
      assert.match(await page.locator('#exercise-list').innerText(), /caught up/i);
      assert.equal(await page.locator('#approve').count(), 0, 'An empty queue must not leave an approved exercise selected');
      await page.getByRole('button', { name: 'All exercises (18)', exact: true }).click();
      assert.match(await page.locator('#storage-detail').innerText(), /browser|export/i);
      await page.locator('#exercise-search').fill('bench');
      assert.equal(await page.locator('#exercise-list [data-exercise-id]').count(), 2, 'Search finds both bench press variations');
      await page.locator('#exercise-search').fill('');
      if (width === 1280) {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        for (const exercise of seed.exercises) {
          await selectExercise(page, exercise.id);
          await page.waitForFunction(() => [...document.querySelectorAll('#pose-stage img')].length === 2 && [...document.querySelectorAll('#pose-stage img')].every(image => image.complete && image.naturalWidth > 0));
        }
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      }
      await selectExercise(page, 'dumbbell-bench-press');
      const stage = page.locator('#pose-stage');
      await stage.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('#pose-stage')?.dataset.playing === 'true');
      const phase = await stage.getAttribute('data-pose');
      await page.waitForFunction(previous => document.querySelector('#pose-stage')?.dataset.pose !== previous, phase, { timeout: 5000 });
      assert.equal(await page.getByRole('button', { name: /^(play|pause|half speed|normal speed)$/i }).count(), 0);
      assert.equal(await page.locator('select[aria-label*="speed" i]').count(), 0);
      await page.locator('[data-view="pose0"]').click();
      assert.equal(await stage.getAttribute('data-pose'), '0');
      assert.equal(await stage.getAttribute('data-playing'), 'false');
      await page.locator('[data-view="pose1"]').click();
      assert.equal(await stage.getAttribute('data-pose'), '1');
      await page.locator('[data-view="animation"]').click();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.querySelector('#pose-stage')?.dataset.playing === 'false');
      assert.equal(await stage.getAttribute('data-pose'), '0');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.locator('#compare-toggle').click();
      assert.equal(await page.locator('#compare-panel .compare-version').count(), 2);
      assert.equal(await page.locator('#compare-panel .compare-version img').count(), 4);
      const note = 'Synthetic browser review: keep the head fixed. ' + width;
      await page.locator('#review-note').fill(note);
      await page.locator('#needs-changes').click();
      await message(page, '^Review saved:');
      await page.reload();
      await page.locator('#exercise-list [data-exercise-id]').first().waitFor();
      await selectExercise(page, 'dumbbell-bench-press');
      assert.equal(await page.locator('#review-note').inputValue(), note, 'Browser draft survives reload');
      await page.locator('#review-filter').selectOption('needs-changes');
      assert.equal(await page.locator('#exercise-list [data-exercise-id]').count(), 1);
      await page.locator('#review-filter').selectOption('all');
      const downloaded = page.waitForEvent('download');
      await page.locator('#export-reviews').click();
      const download = await downloaded;
      const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
      assert.equal(exported.schemaVersion, 1);
      assert(exported.exercises.find(entry => entry.id === 'dumbbell-bench-press').review.note.includes(note));
      if (width === 1280) {
        const restored = await open(390);
        await restored.page.locator('#import-reviews').setInputFiles({ name: 'review-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
        await message(restored.page, 'import');
        await selectExercise(restored.page, 'dumbbell-bench-press');
        assert.equal(await restored.page.locator('#review-note').inputValue(), note, 'A review export restores the exact-version note in a fresh browser');
        assert.deepEqual(restored.errors, []);
        await restored.context.close();
      }
      await page.locator('#import-reviews').setInputFiles({ name: 'invalid-review.json', mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":1,"exercises":[{"id":"__proto__"}]}') });
      await message(page, 'invalid|reject|unknown|fail|error|not applied');
      assert.equal(await page.locator('#review-note').inputValue(), note, 'Rejected import preserves the working note');
      if (width === 1280) {
        const other = await context.newPage();
        other.on('dialog', dialog => dialog.accept());
        await other.goto(url);
        await selectExercise(other, 'dumbbell-bench-press');
        await other.locator('#review-note').fill('Synthetic change from a second window.');
        await other.locator('#needs-changes').click();
        await message(other, 'saved');
        await page.locator('#review-note').fill('Synthetic unsaved correction in the stale window.');
        await page.locator('#needs-changes').click();
        await message(page, 'another|changed|conflict|reload|refresh');
        assert.equal(await page.locator('#review-note').inputValue(), 'Synthetic unsaved correction in the stale window.');
        await other.close();
      }
      const storageKeys = await page.evaluate(() => Object.keys(localStorage));
      assert(storageKeys.every(key => ['strongstart_pose_review_v1', 'strongstart_pose_review_notes_v1'].includes(key)), 'Authoring never writes app/account storage');
      assert.equal(requests.some(request => /supabase|posthog|api\/feedback/.test(request)), false);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
      await page.screenshot({ path: path.join(evidence, 'dashboard-' + width + '.png'), fullPage: true });
      assert.deepEqual(errors, []);
      results.push({ width, all18: true, automaticPlayback: true, noPlaybackControls: true, poseInspection: true, comparison: true, reducedMotion: true, browserPersistence: true, export: true, invalidImport: true, noAppStateOrBackend: true, pageErrors: errors });
      await context.close();
    }
    // Hosted preview intentionally never connects to a local authoring API.
    // Run workspace API cases only against loopback, always with synthetic mocks.
    if (['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname)) {
    // Synthetic second version exercises revision comparison and stale-save recovery.
    const fixture = clone(seed.exercises), record = fixture[0], approved = record.versions[0];
    const candidate = clone(approved);
    candidate.frames.reverse();
    candidate.fingerprint = createHash('sha256').update(candidate.frames.map(frame => frame.sha256).join('|')).digest('hex');
    candidate.id = 'v2-' + candidate.fingerprint.slice(0, 12);
    candidate.audit = { status: 'needs-changes', reviewer: 'synthetic-independent-auditor', findings: [{ severity: 'warning', text: 'Synthetic candidate needs wrist review.' }], checks: [] };
    record.versions.push(candidate);
    record.revision++;
    record.review = { versionId: candidate.id, status: 'unreviewed', note: '', updatedAt: '2026-11-16T00:00:00.000Z' };
    const { context, page, errors, decisions } = await open(390, 'workspace', fixture);
    assert.equal(await page.locator('#review-filter').inputValue(), 'pending', 'A fresh candidate queue opens in Needs review');
    assert.equal(await page.locator('#exercise-list [data-exercise-id]').count(), 1, 'Approved latest versions stay out of the queue');
    await page.getByRole('button', { name: 'Approved (17)', exact: true }).click();
    assert.equal(await page.locator('#exercise-list [data-exercise-id]').count(), 17);
    await page.locator('#exercise-search').fill('no matching exercise');
    await page.getByRole('button', { name: 'Needs review (1)', exact: true }).click();
    assert.equal(await page.locator('#exercise-search').inputValue(), '', 'Queue shortcut clears a stale search');
    assert.equal(await page.locator('#exercise-list [data-exercise-id]').count(), 1);
    assert.equal(await page.locator('#exercise-title').innerText(), record.name, 'Queue selects a matching pending candidate');
    await page.getByRole('button', { name: 'All exercises (18)', exact: true }).click();
    await selectExercise(page, record.id);
    await page.locator('#version-select').selectOption(candidate.id);
    await page.locator('#compare-toggle').click();
    assert.equal(await page.locator('#compare-panel .compare-version').count(), 2);
    await page.locator('#independent-audit > summary').click();
    assert((await page.locator('#exercise-detail').innerText()).includes('Synthetic candidate needs wrist review.'));
    const note = 'Synthetic exact candidate correction; preserve this note after conflict.';
    await page.locator('#review-note').fill(note);
    await page.locator('#needs-changes').click();
    await message(page, 'changed|conflict|refresh');
    assert.equal(await page.locator('#review-note').inputValue(), note, '409 retains the unsaved correction');
    await page.locator('#refresh-workspace').click();
    await page.locator('#version-select').selectOption(candidate.id);
    assert.equal(await page.locator('#review-note').inputValue(), note, 'Explicit refresh retains the unsaved correction');
    await page.locator('#needs-changes').click();
    await message(page, '^Review saved:');
    assert.equal(decisions.length, 2);
    assert(decisions.every(decision => decision.versionId === candidate.id && decision.fingerprint === candidate.fingerprint));
    assert.equal(record.approvedVersionId, approved.id, 'Flagging a candidate does not replace the approved version');
    assert.equal(record.developmentVersionId, approved.id, 'Reviewing a candidate does not publish it to dev');
    assert.equal(record.productionVersionId, null);
    const imported = { schemaVersion: 1, baseRevisions: Object.fromEntries(fixture.map(entry => [entry.id, entry.revision])), exercises: clone(fixture) };
    imported.exercises.find(entry => entry.id === record.id).review.note = 'Synthetic workspace import of one review only.';
    await page.locator('#import-reviews').setInputFiles({ name: 'workspace-review.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
    await message(page, 'imported');
    assert.equal(await page.locator('#exercise-list [data-exercise-id]').count(), 18, 'A partial API response must not erase the other exercises');
    assert.equal(await page.locator('#review-note').inputValue(), 'Synthetic workspace import of one review only.');
    await page.locator('#version-select').selectOption(approved.id);
    await page.locator('#review-note').fill('Synthetic note for the earlier version.');
    await page.locator('#needs-changes').click();
    await message(page, '^Review saved:');
    await page.locator('#version-select').selectOption(candidate.id);
    assert.equal(await page.locator('#review-note').inputValue(), 'Synthetic workspace import of one review only.', 'A later decision on another version preserves this version note');
    assert.match(await page.locator('.detail-heading').innerText(), /Needs changes/);
    // Worker-only audit/claim updates must not prevent the owner's next decision.
    record.revision+=2;
    record.assignment=null;
    candidate.audit.reviewer='synthetic-finished-auditor';
    await page.locator('#approve').click();
    await message(page, 'version approved');
    assert.equal(decisions.at(-1).expectedRevision,record.revision-1);
    assert.equal(record.review.status,'approved');
    // A different owner's decision is a real conflict, even on the same image.
    const countBeforeConflict=decisions.length;
    record.review={...record.review,status:'needs-changes',note:'Another window correction'};
    record.revision++;
    await page.locator('#approve').click();
    await message(page, 'changed.*refresh');
    assert.equal(decisions.length,countBeforeConflict,'Never overwrite a conflicting owner decision');
    assert.equal(record.review.note,'Another window correction');
    assert.deepEqual(errors, []);
    results.push({ workspace: true, exactVersionPayload: true, candidateComparison: true, independentFindings: true, staleSaveConflict: true, workerUpdatesAllowApproval:true, conflictingDecisionProtected:true, unsavedNotePreserved: true, approvedAndPublishedVersionsPreserved: true });
    await context.close();
    } else results.push({ workspace: 'local-only; covered by the separate loopback run' });
    fs.writeFileSync(path.join(evidence, 'results.json'), JSON.stringify({ url, results }, null, 2) + '\n');
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
