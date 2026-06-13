// Settings overlay — modal opened via the ⚙️ gear button in the header.
// Lives outside #ct (in <div id="settings-overlay"> in mishpacha-mega.html) so
// it survives G.render() innerHTML resets. Holds: Account, Theme (dark + study),
// FSRS Reminders, API key, Data, Feedback, About — the items that previously
// lived in More→Settings.
//
// Mirrored from Pnimit v10.3.0 (PR #68/#77). FM divergence:
//  - Adds Study/Night Mode toggle (FM-only — warm sepia palette for late-night reading)
//  - Namespace: 'mishpacha_*' instead of 'pnimit_*'
//  - Brand chip uses FM amber (#d97706) instead of Pnimit blue
import G from '../core/globals.js';
import { sanitize, getApiKey, setApiKey, toast } from '../core/utils.js';
import { APP_VERSION, BUILD_HASH, LS, SUPA_URL, SUPA_ANON } from '../core/constants.js';
import { renderAuthSection, bindAuthEvents, syncApiKeyToAccount } from '../features/auth.js';
import { getCurrentUser } from '../features/auth.js';
import { renderStudyPlanSection, bindStudyPlanEvents } from '../features/study_plan/index.js';

let _escBound = false;
let _bodyBound = false;

// FSRS reminder support (moved from more-view.js in v1.19.0 consolidation).
// Module-level cache: Notification API support cannot change after page load.
const _notifSupported = typeof Notification !== 'undefined';

export function isSettingsOpen() {
  const overlay = document.getElementById('settings-overlay');
  return !!overlay && !overlay.hidden;
}

export function openSettings() {
  const overlay = document.getElementById('settings-overlay');
  if (!overlay) return;
  overlay.innerHTML = renderSettingsBody();
  overlay.hidden = false;
  document.body.classList.add('settings-open');
  // Focus the close button so ESC/keyboard users have a clear handle.
  const closeBtn = overlay.querySelector('[data-action="close-settings"]');
  if (closeBtn) closeBtn.focus();
  // Bind study-plan handlers (idempotent — doc-level click guarded by
  // window.__studyPlanBound; slider labels rebind per render via dataset flag).
  bindStudyPlanEvents();
}

export function closeSettings() {
  const overlay = document.getElementById('settings-overlay');
  if (!overlay) return;
  overlay.hidden = true;
  overlay.innerHTML = '';
  document.body.classList.remove('settings-open');
  // Return focus to the gear so screen-reader users don't lose context.
  const gear = document.querySelector('[data-action="open-settings"]');
  if (gear) gear.focus();
}

// Re-render in place (e.g. after login/logout, theme toggle, API key save).
export function refreshSettings() {
  if (!isSettingsOpen()) return;
  const overlay = document.getElementById('settings-overlay');
  overlay.innerHTML = renderSettingsBody();
  // Slider labels need rebinding because innerHTML wiped the prior listeners.
  bindStudyPlanEvents();
}

// Render the FSRS reminder card (state derivation + HTML). Logic moved
// verbatim from more-view.js renderSettings() in v1.19.0 consolidation;
// toggleNotifOptIn below is the state-mutation half. Returns inner HTML —
// caller wraps in <section class="settings-section">.
function _renderNotifSection() {
  const optIn = !!G.S.notifOptIn;
  const browserPerm = _notifSupported ? Notification.permission : 'unsupported';
  const canToggle = _notifSupported && browserPerm !== 'denied';

  let permHint = '';
  if (!_notifSupported) {
    permHint = '<div style="font-size:10px;color:#94a3b8;margin-top:6px">הדפדפן לא תומך בהתראות.</div>';
  } else if (browserPerm === 'denied') {
    permHint = '<div style="font-size:10px;color:#dc2626;margin-top:6px">ההרשאה נחסמה בדפדפן. פתח הגדרות אתר כדי לאפשר מחדש.</div>';
  } else if (optIn && browserPerm === 'granted') {
    permHint = '<div style="font-size:10px;color:#059669;margin-top:6px">✓ תזכורת תישלח בשעה 07:00 כשיש שאלות לחזרה.</div>';
  } else if (optIn && browserPerm !== 'granted') {
    permHint = '<div style="font-size:10px;color:#b45309;margin-top:6px">ההרשאה טרם ניתנה — לחץ שוב כדי לבקש.</div>';
  }

  return `
      <div class="sec-t" style="font-size:13px">🔔 Reminders</div>
      <div class="sec-s" style="margin-bottom:10px">תזכורות יומיות לחזרה מרווחת (FSRS)</div>
      <div class="card" style="padding:14px;display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div style="flex:1">
          <div style="font-weight:700;font-size:13px">🔔 תזכורות חזרה יומיות</div>
          <div style="font-size:11px;color:#64748b;margin-top:4px;line-height:1.5">
            התראה יומית ב-07:00 אם יש שאלות מוכנות לחזרה.
          </div>
          ${permHint}
        </div>
        <button class="btn ${optIn ? 'btn-p' : 'btn-o'}"
                data-action="settings-toggle-notif-opt-in"
                ${canToggle ? '' : 'disabled'}
                aria-pressed="${optIn}">
          ${optIn ? 'פעיל' : 'כבוי'}
        </button>
      </div>`;
}

function renderSettingsBody() {
  const isDark = document.body.classList.contains('dark');
  const isStudy = document.body.classList.contains('study');
  const storedKey = getApiKey();
  const buildDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Theme label — mutually-exclusive between Light / Dark / Study (warm sepia).
  const themeLabel = isStudy ? '🕯️ Study mode (sepia)' : isDark ? '🌙 Dark mode' : '☀️ Light mode';

  return `
<div class="settings-backdrop" data-action="close-settings" aria-hidden="true"></div>
<div class="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
  <div class="settings-header">
    <h2 id="settings-title">⚙️ Settings</h2>
    <button class="settings-close" data-action="close-settings" aria-label="סגור הגדרות">✕</button>
  </div>
  <div class="settings-body">

    <section class="settings-section">
      ${renderAuthSection()}
    </section>

    <section class="settings-section">
      ${renderStudyPlanSection()}
    </section>

    <section class="settings-section">
      <div class="sec-t" style="font-size:13px">🎨 Theme</div>
      <div class="sec-s" style="margin-bottom:10px">בחירת ערכת נושא — Light / Dark / Study (sepia)</div>
      <div class="card" style="padding:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px">
          <div style="font-weight:700;font-size:13px">${themeLabel}</div>
          <div style="font-size:11px;color:#64748b;margin-top:4px">לחץ כדי להחליף</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-p" data-action="settings-toggle-dark" aria-pressed="${isDark}" style="font-size:11px;min-height:44px;min-width:80px">
            ${isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button class="btn btn-o" data-action="settings-toggle-study" aria-pressed="${isStudy}" style="font-size:11px;min-height:44px;min-width:80px">
            ${isStudy ? '☀️ Light' : '🕯️ Study'}
          </button>
        </div>
      </div>
    </section>

    <section class="settings-section">
      ${_renderNotifSection()}
    </section>

    <section class="settings-section">
      <div class="sec-t" style="font-size:13px">🔑 API Key</div>
      <div class="sec-s" style="margin-bottom:10px">Anthropic API key — מאוחסן בדפדפן בלבד</div>
      <div class="card" style="padding:14px">
        ${storedKey
          ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
               <div style="flex:1;font-size:11px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:8px;padding:6px 10px;color:#065f46">✅ API key מוגדר (sk-...${sanitize(storedKey.slice(-6))})</div>
               <button class="btn btn-o" style="font-size:11px;min-height:44px" data-action="settings-remove-api-key" aria-label="Remove API key">הסר</button>
             </div>${
               getCurrentUser()
                 ? `<button class="btn" style="font-size:11px;min-height:44px;width:100%;margin-bottom:8px;background:#f0f9ff;color:#075985;border:1px solid #bae6fd" data-action="settings-sync-api-key" aria-label="סנכרן את המפתח לחשבון">🔄 סנכרן את המפתח לחשבון</button>`
                 : ''
             }`
          : `<div style="padding:8px 10px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:8px;font-size:10px;color:#065f46;margin-bottom:10px">✅ AI פועל דרך proxy — לא צריך מפתח אישי. אפשר להוסיף כגיבוי. <a href="https://console.anthropic.com/keys" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;min-height:44px;color:#d97706;font-weight:700">קבל מפתח ↗</a></div>
             <div style="display:flex;gap:8px;margin-bottom:8px">
               <input id="settings-api-key-input" type="password" placeholder="sk-ant-..." class="calc-in" style="flex:1;margin:0;font-size:11px" aria-label="Claude API key">
               <button class="btn btn-p" style="font-size:11px;min-height:44px" data-action="settings-save-api-key" aria-label="Save API key">שמור</button>
             </div>`}
        <div style="font-size:9px;color:#94a3b8">API key נשמר ב-localStorage · בחשבון מחובר תוצע שמירה גם בחשבון (עם אישור סיסמה) כדי שהמפתח יעבור איתך בין מכשירים</div>
      </div>
    </section>

    <section class="settings-section">
      <div class="sec-t" style="font-size:13px">💾 Data</div>
      <div class="sec-s" style="margin-bottom:10px">גיבוי, שחזור וייצוא של ההתקדמות</div>
      <div class="card" style="padding:14px">
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
          <button class="btn btn-p" data-action="settings-export-progress" aria-label="Export progress">📥 ייצא התקדמות</button>
          <button class="btn btn-g" data-action="settings-import-progress" aria-label="Import progress">📤 ייבא התקדמות</button>
          <button class="btn btn-o" data-action="settings-reset-all" aria-label="Reset all data">🗑️ איפוס</button>
        </div>
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:8px">
          <button class="btn btn-g" data-action="settings-cloud-backup" aria-label="Cloud backup">☁️ גיבוי לענן</button>
          <button class="btn btn-p" data-action="settings-cloud-restore" aria-label="Cloud restore">⬇️ שחזור מענן</button>
        </div>
        <div style="font-size:9px;color:#94a3b8;text-align:center;margin-top:8px">ההתקדמות נשמרת אוטומטית בדפדפן · גיבוי ענן לפי device ID</div>
      </div>
    </section>

    <section class="settings-section">
      <div class="sec-t" style="font-size:13px">💡 Feedback</div>
      <div class="sec-s" style="margin-bottom:10px">דיווח באג / בקשת פיצ'ר / שיפור</div>
      <div class="card" style="padding:14px">
        <select id="settings-fb-type" style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;margin-bottom:8px;background:#f8fafc">
          <option value="bug">🐛 דיווח באג</option>
          <option value="feature">✨ בקשת פיצ'ר</option>
          <option value="content">📝 תיקון תוכן</option>
          <option value="ux">🎨 שיפור UX</option>
          <option value="other">💬 אחר</option>
        </select>
        <textarea id="settings-fb-text" dir="auto" placeholder="תאר את ההצעה / הבאג / השאלה..." style="width:100%;min-height:80px;padding:10px;border:1px solid #e2e8f0;border-radius:10px;font-size:12px;font-family:inherit;resize:vertical;margin-bottom:8px"></textarea>
        <button class="btn btn-p" data-action="settings-submit-feedback" style="width:100%;min-height:44px;font-size:12px;font-weight:700">📤 שלח</button>
      </div>
    </section>

    <section class="settings-section">
      <div class="sec-t" style="font-size:13px">ℹ️ About</div>
      <div class="card" style="padding:14px;text-align:center">
        <div style="font-weight:700;font-size:13px;margin-bottom:6px">Mishpacha Mega</div>
        <div style="font-size:11px;color:#64748b;line-height:1.8">
          <div>v${sanitize(APP_VERSION)} · build ${sanitize(BUILD_HASH)}</div>
          <div>Israeli Family Medicine Board Prep · P0062-2025</div>
          <div>Goroll 8e · Harrison · Nelson · ${G.QZ ? G.QZ.length : '—'} Questions</div>
          <div style="margin-top:8px">${buildDate}</div>
          <div style="margin-top:8px">صدقة جارية الى من نحب</div>
        </div>
        <div class="utility-actions">
          <button class="btn btn-o" data-action="settings-share-app">📤 Share App Link</button>
          <button class="btn btn-p" data-action="settings-force-update">🔄 Force Update</button>
          <a class="btn btn-d" href="https://eiasash.github.io/InternalMedicine/" target="_blank" rel="noopener">🩺 Pnimit →</a>
          <a class="btn btn-g" href="https://eiasash.github.io/Geriatrics/" target="_blank" rel="noopener">👴 Geriatrics →</a>
        </div>
      </div>
    </section>

  </div>
</div>`;
}

// Wire ESC + click delegation. Idempotent: safe to call once at boot.
export function bindSettingsEvents() {
  if (_escBound) return;
  _escBound = true;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isSettingsOpen()) {
      e.preventDefault();
      closeSettings();
    }
  });

  if (_bodyBound) return;
  _bodyBound = true;
  // Auth events are bound to #ct in more-view; the overlay lives outside #ct,
  // so we re-bind here at the document level. bindAuthEvents() is idempotent
  // (uses window.__authBound), but we want the doc-level listener regardless.
  bindAuthEvents();

  document.addEventListener('click', (e) => {
    const overlay = document.getElementById('settings-overlay');
    if (!overlay || overlay.hidden) return;
    const btn = e.target.closest('[data-action]');
    if (!btn || !overlay.contains(btn)) return;
    const action = btn.dataset.action;
    handleSettingsAction(action, btn);
  });
}

async function handleSettingsAction(action, btn) {
  if (action === 'close-settings') {
    closeSettings();
    return;
  }
  if (action === 'settings-toggle-dark') {
    if (typeof window.toggleDark === 'function') window.toggleDark();
    refreshSettings();
    return;
  }
  if (action === 'settings-toggle-study') {
    if (typeof window.toggleStudyMode === 'function') window.toggleStudyMode();
    refreshSettings();
    return;
  }
  if (action === 'settings-toggle-notif-opt-in') {
    await toggleNotifOptIn();
    refreshSettings();
    return;
  }
  if (action === 'settings-save-api-key') {
    const v = document.getElementById('settings-api-key-input')?.value?.trim();
    if (v) {
      // Local save FIRST — never blocked by the network (#353).
      setApiKey(v);
      const r = await syncApiKeyToAccount(v);
      if (r.ok) toast('🔑 המפתח נשמר וסונכרן לחשבון', 'success');
      else if (r.error === 'cancelled') toast('המפתח נשמר במכשיר זה בלבד', 'info');
      else if (r.error === 'not_logged_in') toast('API key נשמר', 'success');
      else toast('המפתח נשמר מקומית — הסנכרון לחשבון נכשל (' + (r.error || '') + ')', 'warn');
      refreshSettings();
    }
    return;
  }
  if (action === 'settings-remove-api-key') {
    setApiKey('');
    const r = await syncApiKeyToAccount('');
    if (r.ok) toast('🔑 המפתח הוסר גם מהחשבון', 'success');
    else if (r.error === 'cancelled') toast('המפתח הוסר מהמכשיר בלבד — עותק החשבון נשאר', 'info');
    else if (r.error !== 'not_logged_in') toast('המפתח הוסר מקומית — ההסרה מהחשבון נכשלה (' + (r.error || '') + ')', 'warn');
    refreshSettings();
    return;
  }
  if (action === 'settings-sync-api-key') {
    // #353 round-2: push an ALREADY-saved key to the account (no remove+re-enter).
    const k = getApiKey();
    if (k) {
      const r = await syncApiKeyToAccount(k);
      if (r.ok) toast('🔑 המפתח סונכרן לחשבון', 'success');
      else if (r.error === 'cancelled') toast('הסנכרון בוטל — המפתח נשאר במכשיר זה', 'info');
      else if (r.error !== 'not_logged_in') toast('הסנכרון לחשבון נכשל (' + (r.error || '') + ')', 'warn');
      refreshSettings();
    }
    return;
  }
  if (action === 'settings-export-progress') { window.exportProgress?.(); return; }
  if (action === 'settings-import-progress') { window.importProgress?.(); return; }
  if (action === 'settings-cloud-backup')    { window.cloudBackup?.(); return; }
  if (action === 'settings-cloud-restore')   { window.cloudRestore?.(); return; }
  if (action === 'settings-reset-all') {
    if (confirm('Reset ALL data? This cannot be undone.')) {
      localStorage.removeItem(LS); location.reload();
    }
    return;
  }
  if (action === 'settings-force-update') { window.applyUpdate?.(); return; }
  if (action === 'settings-share-app') { window.shareApp?.(); return; }
  if (action === 'settings-submit-feedback') {
    submitSettingsFeedback();
    return;
  }
}

async function submitSettingsFeedback() {
  const type = document.getElementById('settings-fb-type')?.value || 'other';
  const text = document.getElementById('settings-fb-text')?.value?.trim();
  if (!text) { toast('כתוב את הפידבק', 'info'); return; }
  const user = getCurrentUser();
  const uid = user?.username || ('guest-' + (localStorage.getItem('mishpacha_guest_id') || ''));
  const entry = { type, text, ts: Date.now(), version: APP_VERSION, uid };
  let fb = [];
  try { fb = JSON.parse(localStorage.getItem('mishpacha_fb_sent') || '[]'); } catch (e) {}
  fb.push(entry);
  localStorage.setItem('mishpacha_fb_sent', JSON.stringify(fb));
  // Payload field names must match the live mishpacha_feedback table schema:
  // (id, type, text, ts, version, uid, created_at, …). The earlier
  // `{message, type, app_version}` shape was rejected by PostgREST with 400
  // (no such columns) — and the silent `.catch` made it invisible to users.
  let _serverOk = false;
  try {
    const res = await fetch(SUPA_URL + '/rest/v1/mishpacha_feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPA_ANON,
        'Authorization': 'Bearer ' + SUPA_ANON,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ type, text, ts: entry.ts, version: APP_VERSION, uid }),
    });
    _serverOk = !!(res && res.ok);
    if (!_serverOk) {
      const errBody = await (res && res.text ? res.text().catch(() => '') : Promise.resolve(''));
      if(import.meta.env.DEV)console.warn('Settings feedback submit non-ok', res && res.status, errBody && errBody.slice(0, 200));
    }
  } catch (e) { /* offline-tolerant — fall through and surface accurate toast */ }
  if (_serverOk) {
    toast('תודה — הפידבק נשלח', 'success');
  } else {
    toast('⚠️ הפידבק נשמר מקומית, השליחה לשרת נכשלה', 'info');
  }
  const ta = document.getElementById('settings-fb-text');
  if (ta) ta.value = '';
}

// Toggle daily-review notifications. Moved verbatim from more-view.js
// in v1.19.0 consolidation. Asynchronously requests browser permission on
// first opt-in. Mutates G.S.notifOptIn — the daily-notification scheduler in
// app.js reads that flag.
export async function toggleNotifOptIn() {
  if (!_notifSupported) return;
  if (G.S.notifOptIn) {
    // Turning off — keep browser perm as-is; just stop scheduling.
    G.S.notifOptIn = false;
    G.save();
    G.render();
    return;
  }
  // Turning on — request permission if not yet granted.
  let perm = Notification.permission;
  if (perm === 'default') {
    try { perm = await Notification.requestPermission(); } catch (e) { perm = 'denied'; }
  }
  G.S.notifOptIn = perm === 'granted';
  G.save();
  G.render();
}
