/* App-shell availability is separate from workout/account sync. */
(() => {
  let registration, pending, status = 'Checking offline readiness…';
  const notice = document.createElement('aside');
  notice.className = 'wrap'; notice.id = 'offline-notice'; notice.setAttribute('role','status');
  notice.style.cssText = 'padding-top:10px;padding-bottom:10px';
  document.querySelector('header').after(notice);
  function paint() {
    notice.hidden = navigator.onLine;
    const text = 'Offline. Saved workouts stay on this device until account sync succeeds. Sign-in, messages, and coach updates need a connection.';
    if (notice.textContent !== text) notice.textContent = text;
    document.querySelectorAll('[data-offline-status]').forEach(el => { if(el.textContent !== status) el.textContent = status; });
  }
  async function check(repair = false) {
    if(pending) return pending;
    pending = (async () => {
      try {
        if (!('serviceWorker' in navigator)) { status = 'Offline reopening is not supported in this browser.'; return; }
        registration = registration || await navigator.serviceWorker.getRegistration('./') || await navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'});
        const active = await Promise.race([navigator.serviceWorker.ready, new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),15000))]);
        const result = await new Promise((resolve,reject) => {
          const channel = new MessageChannel(), timeout=setTimeout(()=>{channel.port1.close();reject(Error('timeout'));},10000);
          channel.port1.onmessage = e => {clearTimeout(timeout); channel.port1.close(); resolve(e.data);};
          active.active.postMessage({type:repair && navigator.onLine?'PREPARE_OFFLINE':'OFFLINE_STATUS'},[channel.port2]);
        });
        status = result.ready ? 'Ready to reopen offline on this browser.' : 'Offline download is incomplete. Connect to the internet and check again.';
      } catch (e) { status = 'Offline access is not ready. Connect to the internet and check again.'; }
      finally { paint(); }
    })();
    try { await pending; } finally { pending=null; }
  }
  document.addEventListener('click', async e => {
    if (!e.target.closest('[data-offline-help]')) return;
    await check(true);
    modal(`<h2>Offline access</h2><p role="status">${esc(status)}</p><p class="small">Sign in and open your saved plan online on this browser first. You can then reopen it, log sets, and resume a saved workout without a connection. Reconnect and check that your save status says Synced.</p><p class="small muted">Clearing browser storage removes downloaded files and local workouts. Your Home Screen installation may need its own first online visit. Messages, sign-in, and coach updates still need the internet.</p><button class="btn primary" data-action="closemodal">Close</button>`);
  });
  new MutationObserver(paint).observe(document.getElementById('app'), {childList:true,subtree:true});
  window.addEventListener('offline', paint);
  window.addEventListener('online', () => { paint(); check(true); });
  document.addEventListener('visibilitychange', () => { if(!document.hidden) check(); });
  navigator.serviceWorker?.addEventListener('controllerchange', () => check());
  paint(); check(true);
})();
