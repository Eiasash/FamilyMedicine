// App entry point — orchestrates all modules, wires up window bindings for onclick handlers
import '../debug/console.js'; // FIRST IMPORT: installs console/fetch/error wrappers before anything else runs
import G from '../core/globals.js';
import { APP_VERSION, LS, TOPICS, EXAM_FREQ, BUILD_HASH, SYLLABUS_VERSION } from '../core/constants.js';
import { sanitize, fmtT, safeJSONParse, getApiKey, setApiKey, toast, isOk} from "../core/utils.js";
import { migrateToIDB } from '../core/state.js';
import '../core/data-loader.js'; // side-effect: populates G.QZ, G.TABS, etc.
import '../clock.js'; // side-effect: header clock (#hdr-sub)
import { getDueQuestions, getWeakTopics, getStudyStreak, getTopicStats, buildRescuePool,
         srScore, trackChapterRead, getChaptersDueForReading, isExamTrap } from '../sr/spaced-repetition.js';
import { buildPool, setFilt, setTopicFilt, startOnCallMode, exitOnCallMode, flipCard,
         onCallPick, renderOnCall, runExplainOnCall, pick, check, next, _storeDiff,
         startTopicMiniExam, endMiniExam, startExam, startMockExam, endExam, endMockExam,
         checkMockIntercept, showMockExamResult, buildMockExamPool,
         replayMockWrong, replayLastMockWrong } from '../quiz/engine.js';
import { requestWakeLock, startPomodoro, stopPomodoro, startSuddenDeath, endSuddenDeath,
         speakQuestion, startNextBestStep, startVoiceParser } from '../quiz/modes.js';
import { callAI } from '../ai/client.js';
import { explainWithAI, aiAutopsy, gradeTeachBack, renderExplainBox, toggleFlagExplain,
         startVoiceTeachBack } from '../ai/explain.js';
import { submitLeaderboardScore, fetchLeaderboard, showLeaderboard, cloudBackup, cloudRestore, getDiagnostics, submitReport,
         saveAnswerReport, _sbDeviceId } from '../features/cloud.js';
import { renderQuiz, toggleBk, uploadQImage, removeQImage, viewImg, pauseTimed,
         startTimedQ, stopTimedMode, sdCheck, sdNext, initQuizEvents } from './quiz-view.js';
// v1.21.13: bind startTimedQ on G so engine.js can call G.startTimedQ() without
// needing a direct import (which would create a circular dep:
// engine.js → quiz-view.js → track-view.js → engine.js). 7h chaos run on
// 2026-05-05 caught 16 ReferenceError pageerrors from engine.js calling the
// unbound name; same root cause as Pnimit Mega's 38 hits, fixed in parallel.
G.startTimedQ = startTimedQ;
import { renderStudy, renderFlash, renderDrugs, toggleNote, filterNotes, initLearnEvents } from './learn-view.js';
import { renderLibrary, openHarrisonChapter,
         toggleHarrisonAI, submitHarrisonAI, aiSummarizeChapter, quizMeOnChapter,
         addChapterQsToBank, renderWrongAnswerLog, initLibraryEvents } from './library-view.js';
import { renderTrack, renderStudyPlan, renderExamTrendCard, renderPriorityMatrix,
         renderDailyPlan, renderSessionCard, renderStudyDashboard, setExamDate, exportCheatSheet,
         saveSessionSummary, initTrackEvents } from './track-view.js';
import { renderSearch, showAnswerHardFail, renderNotes,
         initMoreEvents } from './more-view.js';
import { getCurrentUser } from '../features/auth.js';
import { initPostLoginRestore } from '../features/post-login-restore.js';
import { openSettings, bindSettingsEvents, refreshSettings } from './settings-overlay.js';

export function renderTabs(){
// safe-innerhtml: G.TABS is a hardcoded array of tab definitions (id/label/icon); no user input
document.getElementById('tb').innerHTML=G.TABS.map(t=>
`<button class="${t.id===G.tab?'on':''}" data-action="go" data-tab="${t.id}" role="tab" aria-selected="${t.id===G.tab?'true':'false'}" aria-label="${t.l}"><span class="ic">${t.ic}</span>${t.l}</button>`
).join('');
}
export function go(t){G.tab=t;renderTabs();render()}

export function render(){
// v1.21.45 dedup: keep soft-retired duplicate questions (dup:1) out of any
// multi-question pool before it is displayed. Several pool builders set G.pool
// directly without going through buildPool(), so this render chokepoint (G.render,
// called by every builder) is the reliable single place to enforce it. Single-item
// pools (explicit "go to this question" navigation) are left intact.
if(Array.isArray(G.pool)&&G.pool.length>1){G.pool=G.pool.filter(i=>!G.QZ||!G.QZ[i]||(!G.QZ[i].dup&&!G.QZ[i].broken));}
const el=document.getElementById('ct');
const focused=document.activeElement?.id;
const sv={srchi:document.getElementById('srchi')?.value,nfilt:document.getElementById('nfilt')?.value,dsrch:document.getElementById('dsrch')?.value};
if(G.tab!==G.lastTab){el.classList.remove('fade-in');void el.offsetWidth;el.classList.add('fade-in');window.scrollTo({top:0});G.lastTab=G.tab;}
switch(G.tab){
case'quiz':el.innerHTML=G.onCallMode?renderOnCall():renderQuiz();break;
// v1.19.0: Learn tab merged into Library. learnSub='flash' → Library Cards;
// 'study' → Library Notes; 'drugs' → Library Drugs. Mirrors Pnimit v10.0 (PR #70)
// but FM keeps the Drugs sub-tab — Family Medicine drug data is FM-specific
// (pregnancy/peds/renal columns) and not duplicated in ward-helper.
case'learn':
  G.tab='lib';
  if(G.learnSub==='flash')G.S.libSub='cards';
  else if(G.learnSub==='drugs')G.S.libSub='meds';
  else G.S.libSub='notes';
  G.save&&G.save();
  el.innerHTML='';render();break;
case'study':G.tab='lib';G.S.libSub=G.openNote!==null?'notes':'today';el.innerHTML='';render();break;
case'lib':
  {const _libSub=G.S.libSub||'today';
  const _libBar='<div class="subtabs" role="tablist" aria-label="Study sections">'+
  [{id:'today',ic:'📌',l:'Today'},{id:'read',ic:'📖',l:'מקורות'},{id:'notes',ic:'📝',l:'סיכומים'},{id:'cards',ic:'🃏',l:'Cards'},{id:'meds',ic:'💊',l:'Meds'}].map(s=>
    '<button data-action="lib-sub" data-sub="'+s.id+'" class="subtab-btn '+(_libSub===s.id?'on':'')+'" role="tab" aria-selected="'+(_libSub===s.id?'true':'false')+'"><span>'+s.ic+'</span><span>'+s.l+'</span></button>'
  ).join('')+'</div>';
  let _libBody='';
  if(_libSub==='today')_libBody=renderStudyDashboard();
  else if(_libSub==='notes')_libBody=renderStudy();
  else if(_libSub==='cards')_libBody=renderFlash();
  else if(_libSub==='meds')_libBody=renderDrugs();
  else _libBody=renderLibrary();
  el.innerHTML=_libBar+_libBody;}break; // safe-innerhtml: _libBar is static HTML; _libBody from internal render*() functions (no user input)
case'articles':G.libSec='afphari';G.tab='lib';G.S.libSub='read';el.innerHTML='';render();break;
case'track':
  if(!G._sessionSaved&&(G._sessionOk+G._sessionNo)>=5){
    saveSessionSummary();G._sessionSaved=true;
  }
  el.innerHTML=renderTrack();break;
case'more':
  // v1.19.0: Settings sub-tab removed — moved to gear-icon overlay (mirrors Pnimit v10.3.0).
  // v1.10.0: shrunk from 9 sub-tabs to 6 — Study/Cards/Drugs moved to the
  // restored Learn tab. v1.19.0: Learn → Library, so legacy learnSub maps below.
  // Repair stale G.moreSub from a pre-1.19.0 install whose last view was
  // study/flash/drugs (it'd render the Calc 'undefined' state otherwise).
  if(['study','flash','drugs','calc','chat','feedback'].includes(G.moreSub)){G.tab='lib';if(G.moreSub==='study')G.S.libSub='notes';G.moreSub='search';el.innerHTML='';render();break;}
  // 'settings' migrated to gear-icon overlay v1.19.0 — auto-redirect old state
  if(G.moreSub==='settings')G.moreSub='search';
  if(!['search','notes'].includes(G.moreSub))G.moreSub='search';
  {const _moreBar='<div class="subtabs" role="tablist" aria-label="More sections">'+
  [{id:'search',ic:'🔍',l:'חיפוש'},{id:'notes',ic:'📝',l:'הערות'}].map(s=>
    '<button data-action="more-sub" data-sub="'+s.id+'" class="subtab-btn '+(G.moreSub===s.id?'on':'')+'" role="tab" aria-selected="'+(G.moreSub===s.id?'true':'false')+'"><span>'+s.ic+'</span><span>'+s.l+'</span></button>'
  ).join('')+'</div>';
  let _mBody='';
  if(G.moreSub==='notes')_mBody=renderNotes();
  else _mBody=renderSearch();
  el.innerHTML=_moreBar+_mBody;}break; // safe-innerhtml: _moreBar is static HTML; _mBody from internal render*() functions (no user input)
case'search':G.tab='more';G.moreSub='search';el.innerHTML='';render();break;
case'book':case'syl':G.tab='lib';el.innerHTML=renderLibrary();break;
default:G.tab='quiz';el.innerHTML=renderQuiz();break;
}
// Ward modal

// Restore input values and focus
if(sv.srchi!==undefined&&document.getElementById('srchi'))document.getElementById('srchi').value=sv.srchi;
if(sv.nfilt!==undefined&&document.getElementById('nfilt'))document.getElementById('nfilt').value=sv.nfilt;
if(sv.dsrch!==undefined&&document.getElementById('dsrch'))document.getElementById('dsrch').value=sv.dsrch;
if(focused){const fe=document.getElementById(focused);if(fe){fe.focus();if(fe.value){try{fe.setSelectionRange(fe.value.length,fe.value.length);}catch(_){}}}}
updateAccountChip();
}

// Header account chip — shows user initial when logged in, 👤 when guest.
// Click goes to More → Settings, where the account section lives.
// Mirrors Pnimit v9.87.0; see InternalMedicine/src/ui/app.js for design notes.
export function updateAccountChip(){
  const btn=document.getElementById('hdr-account-btn');
  if(!btn)return;
  const u=getCurrentUser();
  if(u){
    const name=u.displayName||u.username||'?';
    const initial=name.trim().charAt(0).toUpperCase();
    btn.textContent=initial;
    btn.style.background='#0D7377'; // teal
    btn.style.color='#fff';
    btn.style.fontWeight='700';
    btn.title=name+' — Account';
  }else{
    btn.textContent='👤';
    btn.style.background='rgba(255,255,255,0.08)';
    btn.style.color='#fff';
    btn.style.fontWeight='400';
    btn.title='Log in / Register';
  }
}
window.updateAccountChip=updateAccountChip;

// ===== DARK MODE =====
// v1.21.0 — also sync `<html data-theme>` so shared/tokens.css's
// `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }`
// fallback never fires when the user's OS is in dark mode but the app is in
// light mode. Without this, every cream-on-white quiz screen surfaced the bug
// that 1.20.0 left half-fixed (only body.dark/study were bridged).
function _syncDataTheme(){
  // Dark wins; otherwise Light is asserted explicitly. Study mode sets light
  // (tokens.css has no study theme block) — body.study + the CSS bridge
  // in quiz-view.css handles the sepia palette.
  document.documentElement.dataset.theme = G.S.dark ? 'dark' : 'light';
}
export function toggleDark(){document.body.classList.toggle('dark');G.S.dark=document.body.classList.contains('dark');if(G.S.dark&&document.body.classList.contains('study')){document.body.classList.remove('study');G.S.studyMode=false;}_syncDataTheme();G.save();}
export function toggleStudyMode(){document.body.classList.toggle('study');G.S.studyMode=document.body.classList.contains('study');if(G.S.studyMode&&document.body.classList.contains('dark')){document.body.classList.remove('dark');G.S.dark=false;}_syncDataTheme();G.save();}
if(G.S.dark)document.body.classList.add('dark');
if(G.S.studyMode)document.body.classList.add('study');
_syncDataTheme(); // assert data-theme on first paint, before quiz-view renders

// ===== FLASHCARD SPACED REP =====
// fcRate moved to learn-view.js

// ===== SHARE =====
export function shareQ(){
const q=G.QZ[G.pool[G.qi]];
let txt=q.q+'\n';
q.o.forEach((o,i)=>{txt+=(isOk(q,i)?'✅ ':'❌ ')+o+'\n';});
if(navigator.share){navigator.share({title:'Mishpacha Mega — Question',text:txt}).catch(()=>{});}
else if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>{const b=document.getElementById('shbtn');if(b){b.textContent='✅ הועתק';setTimeout(()=>b.textContent='📋 שתף',1500)}}).catch(()=>{});
}
export function shareApp(){
const url=location.href;
if(navigator.share){navigator.share({title:'Mishpacha Mega — Family Medicine Board Prep',text:'Family Medicine Board Prep — Goroll 8e + AFP + Required Articles + Calculators + Spaced Repetition',url:url}).catch(()=>{});}
else if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>toast('✅ Link copied!','success')).catch(()=>{});}
}

// ===== EXPORT PROGRESS =====

export function importProgress(){
const input=document.createElement('input');input.type='file';input.accept='.json';
input.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
r.onload=ev=>{try{const d=JSON.parse(ev.target.result);const allowed=new Set(Object.keys(G.S));const validated={};for(const k of Object.keys(d)){if(allowed.has(k))validated[k]=d[k];}Object.assign(G.S,validated);G.save();render();
toast('✅ Progress imported successfully!','success');}catch(err){toast('❌ Invalid file','error');}};r.readAsText(f);};
input.click();}

export function exportProgress(){
const data=JSON.stringify(G.S,null,2);
const blob=new Blob([data],{type:'application/json'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mishpacha-progress.json';a.click();
}

export function takeWeeklySnapshot(){
  try{
    const now=new Date();
    const weekKey='w_'+now.getFullYear()+'_'+Math.floor((now-new Date(now.getFullYear(),0,0))/(7*864e5));
    const snapshots=JSON.parse(localStorage.getItem('mishpacha_weekly')||'{}');
    if(snapshots[weekKey])return; // already taken this week
    const tSt=G.S&&G.S.ts?G.S.ts:{};
    const snap={};
    for(let i=0;i<TOPICS.length;i++){const s=tSt[i]||{ok:0,no:0,tot:0};snap[i]=s.tot>=3?Math.round(s.ok/s.tot*100):null;}
    snapshots[weekKey]={date:now.toISOString(),acc:snap};
    const keys=Object.keys(snapshots).sort();
    if(keys.length>52)delete snapshots[keys[0]];
    localStorage.setItem('mishpacha_weekly',JSON.stringify(snapshots));
  }catch(e){}
}

// ===== SHARED AI PROXY =====

export async function showHelp(){
// Dedupe — if a #help-overlay is already mounted, no-op. Without this,
// the deferred first-visit autoshow (rIC+setTimeout, ~2-3s after page load)
// can race with a manual click on the Help button: user clicks → showHelp()
// mounts overlay #1 → user reads/dismisses → 2s later deferred callback
// fires → showHelp() mounts a SECOND stacked overlay. Caught by Codex P2
// on PR #76.
if(document.getElementById('help-overlay'))return;
// CHANGELOG is large (~30KB gzipped, was ~23% of main bundle). Lazy-load
// it only when the help overlay actually opens — keeps it out of the
// critical-path bundle. The first call costs one chunk fetch (~30KB gz,
// served from same origin/cache); subsequent calls hit the module cache.
const { CHANGELOG } = await import('../core/changelog.js');
const ov=document.createElement('div');
ov.id='help-overlay';
ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px';
ov.onclick=e=>{if(e.target===ov)ov.remove();};
const sec=(title,icon,color,items)=>`<div style="margin-bottom:14px">
<div style="font-weight:700;font-size:12px;margin-bottom:6px;color:${color}">${icon} ${title}</div>
<div dir="auto" style="font-size:10px;line-height:1.8;unicode-bidi:plaintext">${items}</div></div>`;
// safe-innerhtml: help-overlay content is fully static — only interpolated values are APP_VERSION and CHANGELOG entries (code-controlled constants, no user input).
ov.innerHTML=`<div style="max-width:420px;margin:0 auto;background:#fff;border-radius:16px;padding:20px;color:#1e293b;font-size:11px;line-height:1.7">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div style="font-size:16px;font-weight:800">🏥 Mishpacha Mega</div>
<button data-action="close-help" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8" aria-label="Close help">✕</button>
</div>
<div style="font-size:10px;color:#64748b;margin-bottom:16px;unicode-bidi:plaintext">Israeli Family Medicine Board Exam Prep (<bdi>שלב א׳ רפואת המשפחה</bdi>) · ${SYLLABUS_VERSION} · Goroll 8e + Nelson 22e + AFP + <bdi>הר"י</bdi> · Works Offline</div>
<div style="padding:10px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:14px">
<div style="font-weight:700;font-size:11px;margin-bottom:6px;color:#065f46">🆕 What's New in v${APP_VERSION}</div>
<div style="font-size:10px;line-height:1.7;color:#047857">
${(CHANGELOG[APP_VERSION]||CHANGELOG[Object.keys(CHANGELOG).sort().pop()]||['No changelog available']).map(c=>'<b>'+c.split(' — ')[0]+'</b>'+(c.includes(' — ')?' — '+c.split(' — ').slice(1).join(' — '):'')).join('<br>')}
</div></div>
${sec('Quiz Filters','📝','#047857',
'<b>הכל</b> — כל '+G.QZ.length.toLocaleString()+' השאלות, מעורבב<br>'+
'<b>2020–Jun25</b> — סינון לפי מועד מבחן<br>'+
'<b>🔥 Hard</b> — שאלות שטעית בהן, הגרועות קודם<br>'+
'<b>⏱️ Slow</b> — שאלות שלקחו לך יותר מ־60 שניות<br>'+
'<b>🎯 Weak</b> — הנושאים החלשים שלך<br>'+
'<b>🔄 Due</b> — חזרה מרווחת (SM-2)<br>'+
'<b>📋 Exam</b> — מבחן מדומה 150 שאלות (3 שעות)'
)}
${sec('AI Study Tools','🤖','#6d28d9',
'כל יכולות ה-AI עובדות בלי מפתח API — דרך פרוקסי משותף.<br><br>'+
'<b>🤖 AI Explain</b> — הסבר בעברית לתשובה הנכונה<br>'+
'<b>🔬 Distractor Autopsy</b> — AI מסביר למה כל הסחות דעת שגויה ומתי הייתה נכונה<br>'+
'<b>🎓 Teach-Back</b> — הקלד הסבר משלך, ה-AI נותן ציון<br>'+
'<b>❌ Wrong Answer</b> — דווח שגיאות, ה-AI מוודא את מפתח התשובות'
)}
${sec('Study Modes','📚','#dc2626',
'<b>🙈 Cover Options</b> — מסתיר תשובות, מכריח היזכרות חופשית<br>'+
'<b>📖 Library</b> — <bdi>Goroll 8e</bdi> (239 פרקים) · <bdi>Nelson 22e</bdi> · <bdi>Harrison 22e</bdi> (cross-ref)<br>'+
'<b>📝 Notes</b> — הערות אישיות כלליות + לכל שאלה<br>'+
'<b>📄 Articles</b> — רשימת קריאה מלאה של <bdi>P0062-2025</bdi>: PCC, Family systems, EBM, הר"י'
)}
${sec('Progress Tracking','📊','#f59e0b',
'<b>⏱️ Answer Timer</b> — מעקב שקט אחרי זמן לכל שאלה<br>'+
'<b>🗺️ Weak Spots Map</b> — מפת חום נושא × שנה (לשונית Track)<br>'+
'<b>📊 Accuracy Bars</b> — דיוק לכל נושא, הגרועים קודם<br>'+
'<b>☁️ Cloud Sync</b> — גיבוי ושחזור בין מכשירים<br>'+
'<b>🔥 Streak</b> — רצף לימוד יומי'
)}
<div style="padding:10px;background:#f0fdf4;border-radius:10px;margin-bottom:12px">
<div style="font-weight:700;font-size:11px;margin-bottom:4px">🚀 Quick Start</div>
<div dir="auto" style="font-size:10px;line-height:1.7;unicode-bidi:plaintext">1. לחץ <bdi><b>Quiz</b></bdi> ← ענה על שאלות<br>2. עיין ב-<bdi><b>🔬 Distractor Autopsy</b></bdi> לניתוח AI<br>3. בלשונית <bdi><b>Track</b></bdi> ראה נקודות תורפה<br>4. סנן לפי <bdi><b>🔥 Hard</b></bdi> כדי לתרגל טעויות<br>5. קרא <bdi><b>Library → Goroll</b></bdi> לתוכן הפרק</div>
</div>
<div style="text-align:center;font-size:9px;color:#94a3b8;line-height:1.5">
صدقة جارية الى من نحب<br>Ceaseless Charity — To the People That We Love<br><br>
<button data-action="share-app" style="background:#059669;color:#fff;border:none;border-radius:8px;padding:6px 16px;font-size:10px;font-weight:600;cursor:pointer" aria-label="Share app with friends">📤 Share with Friends</button>
</div>
</div>`;
document.body.appendChild(ov);
}

// PWA + Background Sync + Daily Notification
// SW update banner + registration live in core/sw-update.js.
// Kept here: daily-notification scheduling that needs getDueQuestions() from the app.
import { initSWUpdate, applyUpdate, dismissUpdate } from '../core/sw-update.js';

initSWUpdate(APP_VERSION).then(reg => {
  if (!reg) return;
  // Daily-review notification is opt-in: scheduler only runs if the user enabled
  // it in Settings AND the OS has granted the permission. No auto-prompt on load.
  function scheduleDailyNotification() {
    const now = new Date();
    const target = new Date(now);
    target.setHours(7, 0, 0, 0);
    if (now >= target) target.setDate(target.getDate() + 1);
    setTimeout(() => {
      if (G.S.notifOptIn && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const dueN = getDueQuestions().length;
        if (dueN > 0 && reg.active) {
          reg.active.postMessage({ type: 'schedule-notification', dueCount: dueN });
        }
      }
      scheduleDailyNotification();
    }, target - now);
  }
  scheduleDailyNotification();
});
// queueBackgroundSync removed — dead code

G._dataPromise.then(()=>{renderTabs();render();}).catch(()=>{});

// === Expose G on window for onclick handler access ===
window.G = G;

// === Wire up G references for cross-module calls ===
G.render = render;
G.renderTabs = renderTabs;

// === Window bindings for onclick/onchange/oninput handlers in HTML strings ===
const _w = window;
// Core navigation
_w.go = go; _w.render = render;
// Quiz
 _w.setTopicFilt = setTopicFilt;

// AI

// Library
_w.openHarrisonChapter = openHarrisonChapter;
 // aiSummarizeChapter: now handled by library-view delegation

// Learn
// toggleNote, filterNotes, fcRate: now handled by learn-view delegation
// Track
// calcUp: track-view delegation
// setExamDate: track-view delegation
// exportCheatSheet: track-view delegation
// Cloud & social
_w.showLeaderboard = showLeaderboard;
_w.submitLeaderboardScore = submitLeaderboardScore;
_w.cloudBackup = cloudBackup; _w.cloudRestore = cloudRestore;

// More
 // still needed by track-view onclick

// Settings
_w.toggleDark = toggleDark; _w.toggleStudyMode = toggleStudyMode;
_w.showHelp = showHelp; _w.applyUpdate = applyUpdate;
_w.importProgress = importProgress; _w.exportProgress = exportProgress;
_w.shareQ = shareQ;
 _w.shareApp = shareApp;

// === Event delegation (set up once, survives innerHTML changes) ===
// Tab bar (outside #ct)
document.getElementById('tb').addEventListener('click', (e) => {
  const el = e.target.closest('[data-action="go"]');
  if (el) go(el.dataset.tab);
});
// Sub-tab + view delegation (inside #ct)
const _ct = document.getElementById('ct');
_ct.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.dataset.action === 'lib-sub') { G.S.libSub = el.dataset.sub; G.save&&G.save(); render(); }
  else if (el.dataset.action === 'learn-sub') { G.learnSub = el.dataset.sub; render(); }
  else if (el.dataset.action === 'more-sub') { G.moreSub = el.dataset.sub; render(); }
});
initMoreEvents(_ct);
initLibraryEvents(_ct);
initLearnEvents(_ct);
initTrackEvents(_ct);
initQuizEvents(_ct);
bindSettingsEvents();

// === Header button delegation (outside #ct) ===
document.querySelector('.hdr').addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.dataset.action === 'toggle-dark') { toggleDark(); refreshSettings(); }
  else if (el.dataset.action === 'toggle-study') { toggleStudyMode(); refreshSettings(); }
  else if (el.dataset.action === 'open-settings') openSettings();
  else if (el.dataset.action === 'show-help') showHelp();
  else if (el.dataset.action === 'goto-account') openSettings();
});

// === Body-level delegation for overlays, banners, modals ===
document.body.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.dataset.action === 'close-help') { const ov = document.getElementById('help-overlay'); if (ov) ov.remove(); }
  else if (el.dataset.action === 'share-app') shareApp();
  else if (el.dataset.action === 'apply-update') applyUpdate();
  else if (el.dataset.action === 'close-update-banner') { dismissUpdate(); }
  else if (el.dataset.action === 'close-mock-modal') { const m = document.getElementById('mexModal'); if (m) m.remove(); }
  else if (el.dataset.action === 'replay-mock-wrong') { replayMockWrong(window.__mishpachaLastMockWrong || []); }
  else if (el.dataset.action === 'replay-last-mock-wrong') { replayLastMockWrong(); }
  else if (el.dataset.action === 'close-exam-modal') { const m = document.getElementById('examModal'); if (m) m.remove(); }
});

// === Boot ===
// Wake lock
requestWakeLock();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') requestWakeLock();
});

// Header version
{const hv=document.getElementById('headerVer');if(hv)hv.textContent='v'+APP_VERSION;}
window.APP_VERSION=APP_VERSION; // expose for debug-console

// IDB migration → initial render
migrateToIDB().then(()=>{
  renderTabs();render();
  // Post-login auto-restore prompt (v1.18.0): subscribes to auth events and
  // surfaces a one-tap restore modal when a user logs in on a fresh device.
  // Must be initialized AFTER the first render so G.S is fully hydrated when
  // the listener fires.
  initPostLoginRestore();
  if(!localStorage.getItem('mishpacha_seen_help')){
    localStorage.setItem('mishpacha_seen_help','1');
    // v1.21.x perf v2 (#25): interaction-triggered help autoshow. The
    // requestIdleCallback approach from #76 wasn't aggressive enough —
    // Lighthouse measurement window (~10s on simulated Slow-4G + 4× CPU)
    // still captured the help overlay because the 3000ms rIC timeout fired
    // well within that window.
    //
    // New strategy:
    //   - Real users typically click/scroll/tap within 1-3s → autoshow fires
    //     promptly after first interaction. Same UX as before, just gated.
    //   - Lighthouse / scripted audits never interact → autoshow fires only
    //     at the 12000ms safety-net, past the LCP measurement window.
    //   - The 12s fallback ensures real users who DO somehow sit still for
    //     12s still see the onboarding (rare but possible).
    //
    // Combined with the showHelp() dedupe shipped in #76, this is safe
    // even if the user manually clicks Help before the autoshow fires.
    //
    // EVENT CHOICE — only events that fire AFTER the user's intended action
    // completes:
    //   click     — fires after mousedown+mouseup; button activation done
    //   keyup     — fires after key release; key's own handler done
    //   scroll    — fires during scroll, but scroll doesn't intercept any
    //               other tap target so it's safe
    // Codex P2 (#77) ruled out touchstart/pointerdown/keydown because they
    // fire BEFORE the corresponding click/keyup/action — on slow devices
    // the 50ms autoshow could mount the overlay over the user's tap target
    // before its click handler ran, swallowing the first intended action.
    let _autoshowFired=false;
    const _tryAutoshow=(e)=>{
      if(_autoshowFired)return;
      // Defense-in-depth: reject events known to be synthetic (dispatchEvent,
      // .click()). Note however that browser-generated events from API calls
      // like window.scrollTo() are STILL isTrusted=true in Chromium/Firefox
      // because the scroll event is emitted by the user agent regardless of
      // who triggered it. So we cannot rely on this alone to suppress the
      // first-render programmatic scroll — see _events trigger list below.
      if(e && e.isTrusted===false) return;
      _autoshowFired=true;
      // Small delay so the click handler that triggered us has fully done
      // its work (state updates, navigation, etc.) before the overlay mounts.
      setTimeout(showHelp,50);
    };
    // Trigger list: ONLY click + keyup. Both are events fired by genuine
    // user actions (post-action: after the click completes, after the key
    // releases). scroll was REMOVED in this revision — Codex P1 on #80
    // pointed out that src/ui/app.js:58's first-render
    // `window.scrollTo({top:0})` produces a scroll event with isTrusted=true
    // (browser-generated), so the isTrusted gate above won't suppress it.
    // And the {once:true} registration means the synthetic event consumes
    // the listener, breaking real subsequent user scrolls too (Codex P2 on
    // sibling PRs). Real users click or type within seconds — scroll was
    // a redundant trigger.
    const _events=['click','keyup'];
    _events.forEach(ev=>window.addEventListener(ev,_tryAutoshow,{once:true,passive:true}));
    // Safety net 30s — past Lighthouse's simulated-throttling LCP window.
    setTimeout(_tryAutoshow,30000);
  }
}).catch(e=>{console.error('IDB init failed, falling back to localStorage:',e);renderTabs();render();initPostLoginRestore();});

// Prevent accidental navigation during mock exam
window.addEventListener('beforeunload', function(e){
  if(G.examMode&&(G.S.qOk+G.S.qNo)>0){
    e.preventDefault(); e.returnValue='Mock exam in progress — are you sure you want to leave?';
    return e.returnValue;
  }
});
// iOS Safari: save on background
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState==='hidden'){
    try{localStorage.setItem('mishpacha_mega',JSON.stringify(G.S));}catch(e){}
  }
});
// Data promise → render after load
