// App entry point — orchestrates all modules, wires up window bindings for onclick handlers
import '../debug/console.js'; // FIRST IMPORT: installs console/fetch/error wrappers before anything else runs
import G from '../core/globals.js';
import { APP_VERSION, LS, TOPICS, EXAM_FREQ, CHANGELOG, BUILD_HASH, SYLLABUS_VERSION } from '../core/constants.js';
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
import { submitLeaderboardScore, fetchLeaderboard, showLeaderboard, renderFeedback,
         submitFeedbackForm, cloudBackup, cloudRestore, getDiagnostics, submitReport,
         saveAnswerReport, _sbDeviceId } from '../features/cloud.js';
import { renderQuiz, toggleBk, uploadQImage, removeQImage, viewImg, pauseTimed,
         startTimedQ, stopTimedMode, sdCheck, sdNext, initQuizEvents } from './quiz-view.js';
// v1.21.13: bind startTimedQ on G so engine.js can call G.startTimedQ() without
// needing a direct import (which would create a circular dep:
// engine.js → quiz-view.js → track-view.js → engine.js). 7h chaos run on
// 2026-05-05 caught 16 ReferenceError pageerrors from engine.js calling the
// unbound name; same root cause as Pnimit Mega's 38 hits, fixed in parallel.
G.startTimedQ = startTimedQ;
import { renderStudy, toggleNote, filterNotes, renderFlash, renderDrugs, initLearnEvents } from './learn-view.js';
import { renderLibrary, openHarrisonChapter,
         toggleHarrisonAI, submitHarrisonAI, aiSummarizeChapter, quizMeOnChapter,
         addChapterQsToBank, renderWrongAnswerLog, initLibraryEvents } from './library-view.js';
import { renderTrack, renderCalc, calcUp, calcEstScore, renderStudyPlan, renderExamTrendCard, renderPriorityMatrix,
         renderDailyPlan, renderSessionCard, setExamDate, exportCheatSheet,
         saveSessionSummary, initTrackEvents } from './track-view.js';
import { renderSearch, renderChat, sendChat, sendChatStarter, clearChat,
         showAnswerHardFail, renderNotes,
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
  else if(G.learnSub==='drugs')G.S.libSub='drugs';
  else G.S.libSub='notes';
  G.save&&G.save();
  el.innerHTML='';render();break;
case'study':G.tab='lib';G.S.libSub='notes';el.innerHTML='';render();break;
case'flash':G.tab='lib';G.S.libSub='cards';el.innerHTML='';render();break;
case'drugs':G.tab='lib';G.S.libSub='drugs';el.innerHTML='';render();break;
case'lib':
  {const _libSub=G.S.libSub||'read';
  const _libBar='<div style="display:flex;gap:4px;margin-bottom:12px;padding:4px;background:#f1f5f9;border-radius:12px">'+
  [{id:'read',ic:'📖',l:'Read'},{id:'cards',ic:'🃏',l:'Cards'},{id:'notes',ic:'📝',l:'Notes'},{id:'drugs',ic:'💊',l:'Drugs'}].map(s=>
    '<button data-action="lib-sub" data-sub="'+s.id+'" style="flex:1;padding:8px 4px;border:none;border-radius:10px;font-size:11px;font-weight:'+(_libSub===s.id?'700':'400')+';cursor:pointer;background:'+(_libSub===s.id?'#fff':'transparent')+';color:'+(_libSub===s.id?'#0f172a':'#64748b')+';box-shadow:'+(_libSub===s.id?'0 1px 3px rgba(0,0,0,.1)':'none')+'">'+s.ic+' '+s.l+'</button>'
  ).join('')+'</div>';
  let _libBody='';
  if(_libSub==='cards')_libBody=renderFlash();
  else if(_libSub==='notes')_libBody=renderStudy();
  else if(_libSub==='drugs')_libBody=renderDrugs();
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
  if(['study','flash','drugs'].includes(G.moreSub)){G.tab='lib';G.S.libSub=G.moreSub==='study'?'notes':(G.moreSub==='flash'?'cards':'drugs');G.moreSub='calc';el.innerHTML='';render();break;}
  // 'settings' migrated to gear-icon overlay v1.19.0 — auto-redirect old state
  if(G.moreSub==='settings')G.moreSub='calc';
  if(!['calc','search','notes','chat','feedback'].includes(G.moreSub))G.moreSub='calc';
  {const _moreBar='<div style="display:flex;gap:4px;margin-bottom:12px;padding:4px;background:#f1f5f9;border-radius:12px">'+
  [{id:'calc',ic:'🧮',l:'Calc'},{id:'search',ic:'🔍',l:'Search'},{id:'notes',ic:'📝',l:'Notes'},{id:'chat',ic:'💬',l:'Chat'},{id:'feedback',ic:'💡',l:'Feedback'}].map(s=>
    '<button data-action="more-sub" data-sub="'+s.id+'" style="flex:1;padding:8px 4px;border:none;border-radius:10px;font-size:11px;font-weight:'+(G.moreSub===s.id?'700':'400')+';cursor:pointer;background:'+(G.moreSub===s.id?'#fff':'transparent')+';color:'+(G.moreSub===s.id?'#0f172a':'#64748b')+';box-shadow:'+(G.moreSub===s.id?'0 1px 3px rgba(0,0,0,.1)':'none')+'">'+s.ic+' '+s.l+'</button>'
  ).join('')+'</div>';
  let _mBody='';
  if(G.moreSub==='calc')_mBody=renderCalc();
  else if(G.moreSub==='search')_mBody=renderSearch();
  else if(G.moreSub==='notes')_mBody=renderNotes();
  else if(G.moreSub==='chat')_mBody=renderChat();
  else if(G.moreSub==='feedback')_mBody=renderFeedback();
  el.innerHTML=_moreBar+_mBody;}break; // safe-innerhtml: _moreBar is static HTML; _mBody from internal render*() functions (no user input)
case'calc':G.tab='more';G.moreSub='calc';el.innerHTML='';render();break;
case'search':G.tab='more';G.moreSub='search';el.innerHTML='';render();break;
case'chat':G.tab='more';G.moreSub='chat';el.innerHTML='';render();break;
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

export function showHelp(){
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
'<b>📋 Exam</b> — מבחן מדומה 150 שאלות (3 שעות)<br>'+
'<b>💀 Sudden Death</b> — טעות אחת = סוף המשחק'
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
'<b>⏱️ Pomodoro</b> — טיימר 25 דקות פוקוס / 5 דקות הפסקה<br>'+
'<b>📖 Library</b> — <bdi>Goroll 8e</bdi> (239 פרקים) · <bdi>Nelson 22e</bdi> · <bdi>Harrison 22e</bdi> (cross-ref)<br>'+
'<b>📝 Notes</b> — הערות אישיות כלליות + לכל שאלה<br>'+
'<b>🃏 Flashcards</b> — '+G.FLASH.length+' כרטיסים עם חזרה מרווחת<br>'+
'<b>📄 Articles</b> — רשימת קריאה מלאה של <bdi>P0062-2025</bdi>: PCC, Family systems, EBM, הר"י<br>'+
'<b>🧮 Calculators</b> — CrCl, CHA₂DS₂-VASc, CURB-65, Wells, PADUA'
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
_w.sendChatStarter = sendChatStarter;

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
    // v1.21.x perf (#25): defer the first-visit help-overlay autoshow until
    // the page is idle so it doesn't become the LCP element. With the prior
    // setTimeout(showHelp,500) the large help overlay (multiple sec() blocks
    // + CHANGELOG list) painted ~600ms after first render and Lighthouse
    // picked the CHANGELOG block as LCP → 7.3s LCP. Deferring to
    // requestIdleCallback lets the quiz content paint and stabilize first;
    // LCP element becomes the small quiz card, expected LCP < 3s. Help still
    // autoshows for first-time users — just ~2-3s later, after they've seen
    // the app. 3000ms timeout fallback ensures it appears on slow devices
    // that never become idle within the budget.
    if(typeof requestIdleCallback==='function'){
      requestIdleCallback(()=>setTimeout(showHelp,300),{timeout:3000});
    }else{
      setTimeout(showHelp,1500);
    }
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
