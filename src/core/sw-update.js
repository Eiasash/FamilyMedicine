// Service-worker registration + auto-update.
// Extracted from src/ui/app.js to mirror Geriatrics' src/sw-update.js.
//
// Update model (v1.21.38): updates apply SILENTLY and AUTOMATICALLY. When a new
// SW finishes installing and an old one is already in control, we immediately
// tell it to skipWaiting; the resulting `controllerchange` triggers a single
// page reload onto the fresh assets. This fixes the recurring "stale bundle"
// trap where users saw the new version label (HTML is network-first) while
// still running old cache-first JS/CSS (dead Check button, old colors).
//
// Two guards keep it safe:
//   • _hadController — true only if a SW already controlled the page at load.
//     First-install activation also fires controllerchange (clients.claim in
//     sw.js), and we must NOT reload then (that's the "no-first-install-reload"
//     behavior). We reload only when this was an UPDATE.
//   • _refreshing — prevents a reload loop if controllerchange fires twice.
// The manual banner is kept purely as a fallback for the rare case where the
// silent path is blocked; it is no longer the primary mechanism.

let _dismissKey;
let _refreshing = false;
let _hadController = false;

export function showUpdateBanner() {
  if (document.getElementById('update-banner')) return;
  if (localStorage.getItem(_dismissKey)) return;
  const b = document.createElement('div');
  b.id = 'update-banner';
  b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 16px;font-size:12px;display:flex;align-items:center;gap:10px;justify-content:space-between;box-shadow:0 2px 12px rgba(0,0,0,.3)';
  b.innerHTML = `<div><b>🆕 עדכון זמין!</b> גרסה חדשה מוכנה</div>
<div style="display:flex;gap:6px;flex-shrink:0">
<button data-action="apply-update" style="background:#fff;color:#4f46e5;border:none;border-radius:8px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer">🔄 עדכן עכשיו</button>
<button data-action="close-update-banner" style="background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:8px;padding:6px 10px;font-size:11px;cursor:pointer">✕</button>
</div>`;
  document.body.prepend(b);
}

export function dismissUpdate() {
  try { if (_dismissKey) localStorage.setItem(_dismissKey, '1'); } catch (e) { /* noop */ }
  const b = document.getElementById('update-banner');
  if (b) b.remove();
}

export function applyUpdate() {
  try { localStorage.removeItem(_dismissKey); } catch (e) { /* noop */ }
  (async () => {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        const regs = await navigator.serviceWorker.getRegistrations();
        regs.forEach(r => { if (r.waiting) r.waiting.postMessage({ type: 'SKIP_WAITING' }); });
      }
      const ks = await caches.keys();
      await Promise.all(ks.map(k => caches.delete(k)));
    } catch (e) { console.warn('Cache clear error:', e); }
    window.location.reload();
  })();
}

/**
 * Register the service worker, wire update detection, clean old caches.
 * @param {string} appVersion - APP_VERSION, used to name the dismiss key + match cache prefix
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export function initSWUpdate(appVersion) {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  _dismissKey = 'mishpacha_update_dismissed_' + appVersion;

  // Snapshot control state BEFORE registration: a SW controlling the page now
  // means any later controllerchange is an update (reload), not a first install.
  _hadController = !!navigator.serviceWorker.controller;

  // Single reload when a NEW worker takes control (update only, never first install).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (_refreshing) return;
    // First-install claim (no prior controller): don't reload, but mark the page
    // as controlled so a LATER update in this same session does reload.
    if (!_hadController) { _hadController = true; return; }
    _refreshing = true;
    window.location.reload();
  });

  // Auto-activate a waiting worker (no user tap needed).
  const _autoApply = (worker) => {
    if (worker) { try { worker.postMessage({ type: 'SKIP_WAITING' }); } catch (e) { /* noop */ } }
  };

  caches.keys().then(ks => {
    const old = ks.filter(k => k.startsWith('mishpacha-') && k !== 'mishpacha-v' + appVersion);
    old.forEach(k => { caches.delete(k); if(import.meta.env.DEV)console.log('Deleted old cache:', k); });
  });

  return navigator.serviceWorker.register('sw.js').then(reg => {
    // A worker is already waiting from a previous load → activate it now.
    if (reg.waiting && navigator.serviceWorker.controller) { _autoApply(reg.waiting); showUpdateBanner(); }
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          // Update finished installing while an old SW controls the page:
          // activate immediately → controllerchange → silent reload.
          _autoApply(nw);
          showUpdateBanner(); // fallback cue; usually the reload wins the race
        }
      });
    });
    reg.update().catch(() => {});
    return reg;
  }).catch(() => null);
}
