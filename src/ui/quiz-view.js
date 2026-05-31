import G from '../core/globals.js';
import { SUPA_URL, SUPA_ANON, TOPICS, EXAM_YEARS, TOPIC_TO_AFP_SPECS } from '../core/constants.js';
import { sanitize, heDir, fmtT, safeJSONParse, getOptShuffle, remapExplanationLetters, isMetaOption, toast, isOk} from "../core/utils.js";
import { getDueQuestions, getWeakTopics, isExamTrap, srScore, getTopicStats, buildRescuePool } from '../sr/spaced-repetition.js';
import { isChronicFail } from '../sr/fsrs-bridge.js';
import { renderExplainBox, toggleFlagExplain, explainWithAI, aiAutopsy, gradeTeachBack, startVoiceTeachBack } from '../ai/explain.js';
import { TOPIC_REF } from './track-view.js';
import { openHarrisonChapter } from './library-view.js';
import { buildPool, check, next, prev, pick, checkMockIntercept, exitOnCallMode, flipCard, runExplainOnCall, onCallPick,
         setFilt, setTopicFilt, toggleYearFilt, clearYearFilt, startExam, startMockExam, startMockExamByTag, showMockExamPicker, startTopicMiniExam,
         startOnCallMode, _storeDiff } from '../quiz/engine.js';
import { startPomodoro, stopPomodoro, startSuddenDeath, endSuddenDeath, speakQuestion, startNextBestStep } from '../quiz/modes.js';
import { showAnswerHardFail } from './more-view.js';
import { buildWrongReviewPool, getWrongAnswerCount, resetWrongSet } from '../quiz/wrong-review.js';
import { renderSourceLink, openSource } from './source-link.js';

export function toggleBk(){G.S.bk[G.pool[G.qi]]=!G.S.bk[G.pool[G.qi]];G.save();G.render();}
export function toggleQNote(){
  const box=document.getElementById('qnote-box');if(box){box.remove();return;}
  const idx=G.pool[G.qi];const cur=(G.S.qnotes&&G.S.qnotes[idx])||'';
  const h=`<div id="qnote-box" style="margin:8px 0;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px"><div style="font-size:10px;font-weight:700;color:#475569;margin-bottom:6px">📝 הערה לשאלה זו</div><textarea id="qnote-ta" dir="auto" placeholder="כתוב הערה אישית..." style="width:100%;min-height:70px;resize:vertical;font-family:Heebo,Inter,sans-serif;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:12px;background:#fff;color:#0f172a">${sanitize(cur)}</textarea><div style="display:flex;gap:6px;margin-top:6px"><button class="btn btn-p" data-action="save-qnote" style="flex:1;font-size:11px;min-height:36px">שמור</button><button class="btn" data-action="del-qnote" style="font-size:11px;min-height:36px;background:#fef2f2;color:#991b1b">מחק</button><button class="btn" data-action="cancel-qnote" style="font-size:11px;min-height:36px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0">ביטול</button></div></div>`;
  const tgt=document.querySelector('#ct .card')||document.querySelector('#ct');if(tgt)tgt.insertAdjacentHTML('beforeend',h);
  setTimeout(()=>{const t=document.getElementById('qnote-ta');if(t)t.focus();},50);
}
export function saveQNote(){
  const t=document.getElementById('qnote-ta');if(!t)return;
  const v=t.value.trim();const idx=G.pool[G.qi];
  if(!G.S.qnotes)G.S.qnotes={};
  if(v)G.S.qnotes[idx]=v;else delete G.S.qnotes[idx];
  G.save();toast('הערה נשמרה','success');
  const b=document.getElementById('qnote-box');if(b)b.remove();
  G.render();
}
export function delQNote(){
  const idx=G.pool[G.qi];
  if(G.S.qnotes)delete G.S.qnotes[idx];
  G.save();
  const b=document.getElementById('qnote-box');if(b)b.remove();
  G.render();
}


export async function uploadQImage(qIdx){
const input=document.createElement('input');
input.type='file';input.accept='image/*';input.capture='environment';
input.onchange=async function(){
const file=input.files[0];if(!file)return;
const ext=file.name.split('.').pop()||'png';
const fname='q'+qIdx+'_'+Date.now()+'.'+ext;
const statusEl=document.getElementById('img-status-'+qIdx);
if(statusEl)statusEl.textContent='⏳ Uploading...';
try{
const res=await fetch(SUPA_URL+'/storage/v1/object/question-images/'+fname,{
method:'POST',headers:{'Authorization':'Bearer '+SUPA_ANON,'Content-Type':file.type},body:file});
if(!res.ok)throw new Error('Upload failed: '+res.status);
const imgUrl=SUPA_URL+'/storage/v1/object/public/question-images/'+fname;
G.QZ[qIdx].img=imgUrl;
// Save to localStorage
const imgMap=safeJSONParse('mishpacha_q_images',{});
imgMap[qIdx]=imgUrl;
localStorage.setItem('mishpacha_q_images',JSON.stringify(imgMap));
if(statusEl)statusEl.textContent='✅ Image attached';
setTimeout(()=>G.render(),500);
}catch(e){if(statusEl)statusEl.textContent='❌ '+e.message;}
};
input.click();
}
export function removeQImage(qIdx){
G.QZ[qIdx].img=null;
const imgMap=safeJSONParse('mishpacha_q_images',{});
delete imgMap[qIdx];
localStorage.setItem('mishpacha_q_images',JSON.stringify(imgMap));
G.render();
}
// Load saved images on startup. v1.20.0 fix: previous IIFE ran at module-load
// time when G.QZ was still [] (data-loader is async), so persisted user
// uploads never restored. Now we wait for G._dataPromise to resolve before
// applying the localStorage map. Idempotent — safe to re-run.
(function(){
  const apply=()=>{
    const imgMap=safeJSONParse('mishpacha_q_images',{});
    Object.entries(imgMap).forEach(([idx,url])=>{if(G.QZ[parseInt(idx)])G.QZ[parseInt(idx)].img=url;});
  };
  if(G._dataPromise&&typeof G._dataPromise.then==='function'){G._dataPromise.then(apply).catch(()=>{});}
  else{apply();} // fallback: data already there (test env / cached)
})();
export function viewImg(src){
const ov=document.createElement('div');
ov.className='img-overlay';
ov.innerHTML='<img src="'+sanitize(src)+'" alt="Zoomed">';
ov.onclick=function(){ov.remove();};
document.body.appendChild(ov);
}
export function pauseTimed(){
  G.timedPaused=!G.timedPaused;
  if(G.timedPaused){clearInterval(G.timedInt);}
  else{startTimedQ();}
  G.render();
}
export function startTimedQ(){
  clearInterval(G.timedInt);
  G.timedSec=90;
  G.timedInt=setInterval(()=>{
    G.timedSec--;
    const el=document.getElementById('timed-bar');
    if(el){
      const pct=Math.round(G.timedSec/90*100);
      const col=pct>50?'#10b981':pct>25?'#f59e0b':'#ef4444';
      el.style.width=pct+'%';
      el.style.background=col;
      el.parentElement.previousElementSibling&&(el.parentElement.previousElementSibling.textContent=G.timedSec+'s');
    }
    if(G.timedSec<=0){
      clearInterval(G.timedInt);
      // Auto-advance: show correct answer briefly then next
      if(!G.ans){
        G.sel=G.QZ[G.pool[G.qi]]?.c??0;
        checkMockIntercept();
        G.ans=true;
        const q=G.QZ[G.pool[G.qi]];
        if(q){G.S.qNo++;srScore(G.pool[G.qi],false);}
        G.save();G.render();
      }
      setTimeout(()=>{if(G.timedMode)next();},1800);
    }
  },1000);
}
export function stopTimedMode(){
  G.timedMode=false;
  clearInterval(G.timedInt);
  G.render();
}


















































// ===== DAILY CONTRACT =====
// Shows a compact "today's plan" card at the top of the Quiz tab:
//   1. Due reviews (FSRS)
//   2. Weak drill (rescue pool from 2 worst topics)
//   3. Required reading (1 AFP/הר"י article from the weakest topic)
// Regenerates each calendar day. Users can dismiss; resets tomorrow.
export function renderDailyContract(dueN){
  const today=new Date().toISOString().slice(0,10);
  if(!G.S.dailyContract||G.S.dailyContract.date!==today){
    G.S.dailyContract={date:today,dueDone:false,drillDone:false,readDone:false,dismissed:false,readIdx:null,readTitle:null,drillTopic:null};
    G.save();
  }
  const dc=G.S.dailyContract;
  if(dc.dismissed)return '';
  // Resolve weakest topic (for drill + reading pick)
  const weak=getWeakTopics(2);
  const weakestTi=weak.length?weak[0].ti:null;
  const weakestName=weakestTi!=null?(TOPICS[weakestTi]||''):'';
  // Pick a stable daily required-reading article from AFP/הר"י index (if loaded).
  // Path 1: weakest topic exists → pick from that topic's specialties.
  // Path 2: no weakest topic yet (cold-start user, <3 Qs per topic) but AFP IS
  //         loaded → fall back to a deterministic random pick from any specialty.
  //         Previously this path left dc.readIdx null forever, stranding the row
  //         in "Loading…" state even though data was loaded — a cold-start user
  //         would never see an article recommendation until they answered 3+ Qs
  //         in a topic, which is exactly when they need exam-prep reading most.
  if(!dc.readIdx&&G._afpHari&&G._afpHari.papers&&G._afpHari.papers.length){
    let pickIdx=null,pickTitle=null;
    if(weakestTi!=null){
      const specs=TOPIC_TO_AFP_SPECS[weakestTi]||[];
      if(specs.length){
        const pool=G._afpHari.papers.map((p,i)=>({p,i})).filter(x=>specs.includes(x.p.specialty));
        if(pool.length){
          // Deterministic pick: hash date + topic so same article all day
          const seed=(today+'|'+weakestTi).split('').reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0);
          const pick=pool[Math.abs(seed)%pool.length];
          pickIdx=pick.i;pickTitle=pick.p.title||pick.p.file||'מאמר';
        }
      }
    }
    // Cold-start fallback: any specialty, deterministic by date alone.
    if(pickIdx===null){
      const seed=today.split('').reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0);
      const pick=G._afpHari.papers[Math.abs(seed)%G._afpHari.papers.length];
      const idx=G._afpHari.papers.indexOf(pick);
      pickIdx=idx;pickTitle=pick.title||pick.file||'מאמר';
    }
    dc.readIdx=pickIdx;
    dc.readTitle=pickTitle;
    dc.drillTopic=weakestName;
    G.save();
  }else if(G._afpHari===undefined&&!G._afpHariLoading){
    // Kick off AFP/הר"י index load so we can fill reading on next render
    G._afpHariLoading=true;
    fetch('data/afp_hari_index.json').then(r=>r.json()).then(d=>{G._afpHari=d;G._afpHariLoading=false;G.render();}).catch(()=>{G._afpHariLoading=false;});
  }
  const doneCount=(dc.dueDone?1:0)+(dc.drillDone?1:0)+(dc.readDone?1:0);
  const dueAvail=dueN>0;
  const drillAvail=weak.length>0&&weak[0].pct!==null;
  const readAvail=!!dc.readIdx;
  // Row builder
  const row=(icon,label,sub,actionBtn,done)=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px dashed #e2e8f0" dir="auto">
    <div style="font-size:16px;width:20px;text-align:center">${done?'✅':icon}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:11px;font-weight:700;color:${done?'#64748b':'#0f172a'};text-decoration:${done?'line-through':'none'}" dir="auto"><bdi>${label}</bdi></div>
      ${sub?`<div style="font-size:10px;color:#94a3b8;margin-top:1px" dir="auto"><bdi>${sub}</bdi></div>`:''}
    </div>
    ${done?'':actionBtn}
  </div>`;
  const btn=(action,txt,color)=>`<button data-action="${action}" class="btn" style="font-size:10px;padding:4px 10px;background:${color};color:#fff;border:none;border-radius:6px;font-weight:700;white-space:nowrap;cursor:pointer">${txt}</button>`;
  let h=`<div class="daily-contract" style="margin-bottom:12px;padding:12px 14px;background:linear-gradient(135deg,#eff6ff 0%,#f5f3ff 100%);border:1px solid #c7d2fe;border-radius:12px" dir="auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-weight:700;font-size:12px;color:#4338ca">📅 חוזה יומי <span style="font-weight:400;color:#6366f1;font-size:10px">· ${today}</span></div>
      <div style="display:flex;gap:6px;align-items:center">
        <div style="font-size:10px;color:#6366f1;font-weight:700">${doneCount}/3</div>
        <button data-action="dismiss-daily" class="btn" style="font-size:9px;padding:3px 7px;background:#fff;color:#6366f1;border:1px solid #c7d2fe;border-radius:5px" aria-label="בטל חוזה יומי להיום">×</button>
      </div>
    </div>`;
  // 1. Due reviews
  h+=row('🔄',`חזרות (${dueN})`,dueAvail?'חזרה מרווחת — זמן הלימוד היעיל ביותר':'🎉 אין חזרות כרגע',
    dueAvail?btn('daily-due','התחל','#ef4444'):btn('daily-mark-due','דלג','#64748b'),dc.dueDone);
  // 2. Weak drill
  h+=row('🎯',drillAvail?`תרגול חולשות · ${weakestName}`:'תרגול חולשות',
    drillAvail?`${weak.length} נושאים חלשים · ~21 שאלות`:'ענה על עוד שאלות קודם',
    drillAvail?btn('daily-drill','תרגל','#7c3aed'):btn('daily-mark-drill','דלג','#64748b'),dc.drillDone);
  // 3. Required reading
  h+=row('📄',readAvail?`קרא: ${dc.readTitle}`:'קריאה נדרשת',
    readAvail?`מהנושא החלש ביותר · ${weakestName}`:'טוען…',
    readAvail?btn('daily-read','פתח','#059669'):'',dc.readDone);
  h+=`</div>`;
  return h;
}


// === renderQuizControls (v1.15.0 helper) ===
// Filter pills + topic dropdown + mode toggles + wrong-review banner.
// Extracted from renderQuiz so the main render path stays readable.
// All markup uses tokenized classes; no inline styles.
function renderQuizControls(dueN){
  let h='<nav class="quiz-controls" aria-label="פילטרים לחידון">';
  h+='<div class="quiz-controls__row">';
  h+='<span class="quiz-controls__label">מצב</span>';
  h+='<button class="btn btn--secondary" data-action="start-mock" aria-label="התחל מבחן סימולציה">סימולציה</button>';
  h+='<button class="btn btn--ghost" data-action="start-sd" aria-label="התחל מוות פתאומי">מוות פתאומי</button>';
  h+='<button class="btn btn--ghost" data-action="start-oncall" aria-label="התחל מצב תורנות">תורנות</button>';
  if(!G.pomoActive)h+='<button class="btn btn--ghost" data-action="start-pomo" aria-label="התחל טיימר פומודורו">פומודורו</button>';
  h+='</div>';
  h+='<div class="quiz-controls__row">';
  h+='<span class="quiz-controls__label">סינון</span>';
  const _trapCount=G.QZ.filter((_,i)=>isExamTrap(i)).length;
  const _aiCount=G.QZ.filter(qq=>qq.t==='AI-Ch').length;
  const _yearSel=Array.isArray(G.years)?G.years:[];
  const _inYearMode=G.filt==='years'&&_yearSel.length>0;
  const _aiHardGCount=G.QZ.filter(qq=>qq.t==='AI-Hard-G').length;
  const _aiHardAfpCount=G.QZ.filter(qq=>qq.t==='AI-Hard-AFP').length;
  // Exam-year pills collapse behind a "📅 לפי שנה ▾" toggle to de-clutter the row.
  // Multi-select preserved; group auto-opens when years are active.
  const _yearFilts=[
    ['2020','2020'],['2021-Jun','Jun 21'],['2022-Jun','Jun 22'],['2023-Jun','Jun 23'],
    ['2024-May','May 24'],['2024-Sep','Sep 24'],['2025-Jun','Jun 25'],
  ];
  const _yearPillsOpen=G._yearPillsOpen===true||_inYearMode;
  const filts=[
    ['all',`הכל (${G.QZ.length})`],
    ['__years__',''],
    // Conditional pills — only show when their bucket has questions. Showing
    // "AI (0)" or "Traps (0)" is confusing for cold-start users: tap → empty
    // result → looks like a broken filter. Hide instead.
    ...(_aiCount>0?[['AI-Ch',`AI (${_aiCount})`]]:[]),
    ...(_aiHardGCount>0?[['AI-Hard-G',`Hard-G (${_aiHardGCount})`]]:[]),
    ...(_aiHardAfpCount>0?[['AI-Hard-AFP',`Hard-AFP (${_aiHardAfpCount})`]]:[]),
    ['hard','קשות'],['slow','איטיות'],['weak','חלשות'],['due','לחזרה'],
    ...(_trapCount>0?[['traps',`מלכודות (${_trapCount})`]]:[]),
    ['nbs','השלב הבא']
  ];
  const _weakForPill=getWeakTopics(3);
  if(_weakForPill.length&&_weakForPill[0].pct!==null&&_weakForPill[0].pct<65)filts.push(['rescue','חילוץ']);
  if(dueN>0)filts.push(['due',`לחזרה (${dueN})`]);
  const _wrongCount=getWrongAnswerCount();
  if(_wrongCount>0)filts.push(['wrong-review',`סקור טעויות (${_wrongCount})`]);
  filts.forEach(([f,l])=>{
    if(f==='__years__'){
      const _badge=_yearSel.length>0?` (${_yearSel.length})`:'';
      h+=`<span class="pill" data-state="${_inYearMode?'on':''}" data-action="toggle-year-pills" title="סנן לפי שנת מבחן — בחירה מרובה אפשרית">📅 לפי שנה${_badge} ${_yearPillsOpen?'▴':'▾'}</span>`;
      if(_yearPillsOpen){
        _yearFilts.forEach(([yf,yl])=>{
          const _yOn=_yearSel.includes(yf);
          h+=`<span class="pill" data-state="${_yOn?'on':''}" data-action="filter-year" data-f="${yf}" title="לחץ להחלפה — בחירה מרובה אפשרית">${sanitize(yl)}${_yOn?' ✓':''}</span>`;
        });
      }
    } else if(f==='rescue'){
      h+=`<span class="pill" data-state="${G.filt==='rescue'?'on':''}" data-action="filter-rescue">${sanitize(l)}</span>`;
    } else if(f==='wrong-review'){
      h+=`<span class="pill" data-state="${G.filt==='wrong-review'?'on':''}" data-action="filter-wrong-review">${sanitize(l)}</span>`;
    } else if(f==='nbs'){
      h+=`<span class="pill" data-state="${G.filt==='nbs'?'on':''}" data-action="filter-nbs">${sanitize(l)}</span>`;
    } else if(EXAM_YEARS.includes(f)){
      const _yOn=_yearSel.includes(f);
      h+=`<span class="pill" data-state="${_yOn?'on':''}" data-action="filter-year" data-f="${f}" title="לחץ להחלפה — בחירה מרובה אפשרית">${sanitize(l)}${_yOn?' ✓':''}</span>`;
    } else if(f==='all'){
      h+=`<span class="pill" data-state="${G.filt==='all'&&!_inYearMode?'on':''}" data-action="filter" data-f="${f}">${sanitize(l)}</span>`;
    } else {
      h+=`<span class="pill" data-state="${G.filt===f&&G.filt!=='topic'?'on':''}" data-action="filter" data-f="${f}">${sanitize(l)}</span>`;
    }
  });
  if(_yearSel.length>=2){
    h+=`<span class="pill" data-action="filter-year-clear" title="נקה סינון שנים">נקה ${_yearSel.length} שנים</span>`;
  }
  h+='</div>';
  h+='<div class="quiz-controls__row">';
  h+='<span class="quiz-controls__label">נושא</span>';
  h+=`<select class="quiz-controls__select" data-action="topic-select" aria-label="סנן לפי נושא">`;
  h+=`<option value="-1"${G.filt!=='topic'?' selected':''}>כל הנושאים</option>`;
  TOPICS.forEach((t,i)=>{ h+=`<option value="${i}"${G.filt==='topic'&&G.topicFilt===i?' selected':''}>${sanitize(t)}</option>`; });
  h+='</select>';
  if(G.filt==='topic'&&G.topicFilt>=0){
    const _tqCount=G.QZ.filter(qq=>qq.ti===G.topicFilt).length;
    h+=`<button class="btn btn--secondary" data-action="start-mini-exam" data-ti="${G.topicFilt}" aria-label="התחל מבחן מיני לנושא">מיני מבחן (${Math.min(_tqCount,20)})</button>`;
  }
  h+='</div>';
  h+='<div class="quiz-controls__row">';
  h+='<span class="quiz-controls__label">תרגול</span>';
  h+=`<label class="btn btn--ghost"><input type="checkbox" ${G.blindRecall?'checked':''} data-action="toggle-blind"> כסה תשובות</label>`;
  h+=`<label class="btn btn--ghost"><input type="checkbox" ${G.timedMode?'checked':''} data-action="toggle-timed"> טיימר (90 שנ׳)</label>`;
  h+='</div>';
  if(G.filt==='wrong-review'){
    const _wrCount=getWrongAnswerCount();
    h+=`<div class="quiz-controls__row">`+
       `<span class="pill pill--danger">מצב סקירת טעויות · ${_wrCount}</span>`+
       `<button class="btn btn--ghost" data-action="wrong-review-clear">נקה</button>`+
       `</div>`;
  }
  h+='</nav>';
  return h;
}

export function renderQuiz(){
// ===== SUDDEN DEATH RENDERING =====
if(G.sdMode){
if(G.sdQi>=G.sdPool.length)G.sdQi=0;
const q=G.QZ[G.sdPool[G.sdQi]];
const _qIdx=G.sdPool[G.sdQi]; // SD-mode Q index — image/upload/flag actions must target the displayed SD question, not G.pool[G.qi] (regular-mode Q)
let h=`<div class="sudden-death-banner"><span style="font-weight:700;font-size:13px">💀 Sudden Death</span>
<span style="font-size:16px;font-weight:700">🔥 ${G.sdStreak}</span>
<button class="btn" style="background:rgba(255,255,255,.2);color:#fff;font-size:10px;padding:4px 10px" data-action="quit-sd" aria-label="צא ממצב מוות פתאומי">צא</button></div>`;
h+=`<div class="card" style="padding:16px">`;
if(G.timedMode&&!G.ans){
  h+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
<span id="timed-count" style="font-size:11px;font-weight:700;color:#64748b;min-width:24px">${G.timedSec}s</span>
<div style="flex:1;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
  <div id="timed-bar" style="height:100%;width:${Math.round(G.timedSec/90*100)}%;background:${G.timedSec>45?'#10b981':G.timedSec>22?'#f59e0b':'#ef4444'};border-radius:3px;transition:width .9s linear"></div>
</div>
<button data-action="pause-timed" style="font-size:9px;padding:2px 7px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;white-space:nowrap" aria-label="${G.timedPaused?'Resume timer':'Pause timer'}">${G.timedPaused?'▶ המשך':'⏸ עצור'}</button>
</div>`;
}
const _isFlagQ=(G.S.flagged||{})[_qIdx];
const _eFlagQ=q.eFlag;
h+=`<p class="heb" style="font-size:13px;font-weight:700;line-height:1.7;margin-bottom:${q.img?'10':'16'}px" dir="auto">${_isFlagQ?'<span style="color:#dc2626;font-size:11px" title="Explanation flagged — verify">⚑ </span>':''  }${q.q}</p>`;
if(_eFlagQ&&G.ans){h+=`<div style="margin:6px 0;padding:6px 10px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:10px;color:#991b1b;text-align:start;line-height:1.4;display:flex;align-items:center;gap:6px;justify-content:space-between;unicode-bidi:plaintext" dir="auto"><span style="flex:1">⚠️ AI flagged: ההסבר עשוי לא להתאים לתשובה הנכונה (<bdi>${sanitize(_eFlagQ)}</bdi>)</span><button data-action="clear-eflag" data-idx="${_qIdx}" style="font-size:9px;padding:3px 8px;background:#991b1b;color:#fff;border:none;border-radius:6px;cursor:pointer;flex:0 0 auto">✓ אמת</button></div>`;}
if(q.img){h+=`<div style="margin-bottom:14px;text-align:center;position:relative"><img src="${q.img}" alt="Question image" style="max-width:100%;max-height:300px;border-radius:10px;border:1px solid #e2e8f0;cursor:pointer" data-action="view-img" loading="lazy"><button data-action="remove-img" data-idx="${_qIdx}" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer">✕</button>${q.imgDep?'<div style="margin-top:6px;padding:6px 10px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;font-size:10px;color:#92400e;text-align:start;line-height:1.4;display:flex;align-items:center;gap:6px;justify-content:space-between;unicode-bidi:plaintext" dir="auto"><span style="flex:1">⚠️ שאלה תלוית-תמונה: ההסבר עלול להיות שגוי.</span><button data-action="mark-verified" data-idx="'+_qIdx+'" style="font-size:9px;padding:3px 8px;background:#d97706;color:#fff;border:none;border-radius:6px;cursor:pointer;flex:0 0 auto">✓ מאומת</button></div>':''}</div>`;}
if(!q.img&&!G.examMode){h+=`<div style="margin-bottom:10px"><button data-action="upload-img" data-idx="${_qIdx}" style="font-size:10px;padding:4px 12px;background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer">📷 Attach Image</button><span id="img-status-${_qIdx}" style="font-size:10px;color:#94a3b8;margin-left:6px"></span></div>`;}
q.o.forEach((o,i)=>{
let cls='qo';
if(G.ans){cls+=' lk';if(isOk(q,i))cls+=' ok';else if(i===G.sel)cls+=' no';else cls+=' dim';}
else if(i===G.sel)cls+=' sel';
h+=`<button class="${cls}" data-action="pick" data-i="${i}" aria-label="Option ${i+1}: ${o}" dir="${heDir(o)}">${o}</button>`;
});
if(!G.ans)h+=`<button class="btn btn-p" data-action="sd-check"${G.sel===null?' disabled':''} aria-label="Check answer">בדוק</button>`;
else h+=`<button class="btn btn-d" data-action="sd-next" aria-label="Next question">הבאה ←</button>`;
h+=`</div>`;
// Leaderboard
if(G.sdLeaderboard.length){
h+=`<div class="card" style="padding:14px"><div style="font-weight:700;font-size:12px;margin-bottom:8px">🏆 Leaderboard</div>`;
G.sdLeaderboard.forEach((e,i)=>{h+=`<div class="leaderboard-row"><span>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)} ${e.streak} questions</span><span style="color:#94a3b8">${e.date}</span></div>`;});
h+=`</div>`;}
return h;
}

// === MAIN QUIZ PATH (v1.15.0 rebuild — Editorial Clinical) ===
// Emits semantic, class-driven HTML against src/ui/quiz-view.css.
// ZERO inline `style=""` attributes. All dimensions/colors via CSS tokens.
// Preserves every data-action name from the previous implementation —
// event delegation in initQuizEvents() (below) keeps working unchanged.
if(!G.pool.length)buildPool();
if(G.qi>=G.pool.length)G.qi=0;
const q=G.QZ[G.pool[G.qi]];
const tot=G.S.qOk+G.S.qNo;
const pct=tot?Math.round(G.S.qOk/tot*100)+'%':'—';
const bk=G.S.bk[G.pool[G.qi]];
const dueN=getDueQuestions().length;

let h='<section class="quiz-stage" aria-label="שאלה">';

// ── Pomodoro banner ─────────────────────────────────────────────────
if(G.pomoActive){
  h+=`<div class="quiz-banner quiz-banner--pomo">`+
     `<span class="quiz-banner__label">פומודורו</span>`+
     `<span class="quiz-banner__timer" id="pomo-time">${fmtT(G.pomoSec)}</span>`+
     `<button class="btn btn--ghost" data-action="stop-pomo" aria-label="עצור טיימר פומודורו">עצור</button>`+
     `</div>`;
}

// ── Exam-mode banner ────────────────────────────────────────────────
if(G.examMode){
  const isMock=!!G.mockExamResults;
  const totalQ=isMock?G.pool.length:150;
  h+=`<div class="quiz-banner quiz-banner--exam">`+
     `<span class="quiz-banner__label">${isMock?'סימולציה':'מבחן'}</span>`+
     `<span class="quiz-banner__timer" id="etimer">${fmtT(G.examSec)}</span>`+
     `<span>${G.qi+1} / ${totalQ}</span>`+
     `</div>`;
}

// ── Daily Contract + filter controls (skipped under exam mode) ──────
if(!G.examMode){
  h+=renderDailyContract(dueN);
  h+=renderQuizControls(dueN);
}

// ── Empty-pool guard ─────────────────────────────────────────────────
if(!G.pool.length){
  const msg=G.filt==='due'?'No questions due for review.'
    :G.filt==='wrong-review'?'No wrong answers to review — your set is empty.'
    :'No questions match this filter.';
  h+=`<div class="quiz-empty"><p class="quiz-empty__title">סיימת הכל</p><p>${msg}</p></div>`;
  h+='</section>';
  return h;
}

// ── Progress sliver ─────────────────────────────────────────────────
h+=`<div class="quiz-progress" role="progressbar" aria-label="התקדמות במבחן" aria-valuenow="${G.qi+1}" aria-valuemin="1" aria-valuemax="${G.pool.length}">`+
   `<span class="quiz-progress__fill" data-progress="${Math.round((G.qi+1)/G.pool.length*100)}"></span>`+
   `</div>`;

// ── Timed bar ───────────────────────────────────────────────────────
if(G.timedMode&&!G.ans){
  h+=`<div class="quiz-timed">`+
     `<span class="quiz-timed__count" id="timed-count">${G.timedSec}s</span>`+
     `<div class="quiz-timed__track"><span class="quiz-timed__fill" id="timed-bar" data-pct="${Math.round(G.timedSec/90*100)}"></span></div>`+
     `<button class="btn btn--ghost" data-action="pause-timed" aria-label="${G.timedPaused?'Resume timer':'Pause timer'}">${G.timedPaused?'Resume':'Pause'}</button>`+
     `</div>`;
}

// ── Meta row: year, topic, position, tools ──────────────────────────
const topicName=q.ti>=0&&TOPICS[q.ti]?TOPICS[q.ti]:'';
const tagLabel=q.t==='AI-Ch'?'AI — Chapter'
  :q.t==='AI-Hard-G'?'Hard · Goroll'
  :q.t==='AI-Hard-AFP'?'Hard · AFP'
  :q.t;
h+=`<div class="quiz-header">`;
h+=`<div class="quiz-meta__group">`;
h+=`<span class="pill">${sanitize(tagLabel)}</span>`;
if(topicName)h+=`<span class="pill pill--accent">${sanitize(topicName)}</span>`;
h+=`<span class="quiz-meta__counter" dir="ltr">${G.qi+1} / ${G.pool.length}</span>`;
h+=`</div>`;
h+=`<div class="quiz-tools">`;
h+=`<button class="quiz-tool" data-action="speak-q" title="הקרא בקול" aria-label="הקרא שאלה בקול">♫</button>`;
h+=`<button class="quiz-tool" data-action="share-q" id="shbtn" title="שתף" aria-label="שתף שאלה">↗</button>`;
const hasNote=!!(G.S.qnotes&&G.S.qnotes[G.pool[G.qi]]);
h+=`<button class="quiz-tool" data-action="toggle-qnote" aria-pressed="${hasNote}" aria-label="הערה" title="הערה">✎</button>`;
h+=`<button class="quiz-tool" data-action="toggle-bk" aria-pressed="${!!bk}" aria-label="סמן" title="סמן">${bk?'★':'☆'}</button>`;
h+=`</div>`;
h+=`</div>`;

// ── Question text ───────────────────────────────────────────────────
h+=`<h2 class="quiz-question" dir="auto">${sanitize(q.q)}</h2>`;

// ── Personal note ───────────────────────────────────────────────────
if(hasNote){
  h+=`<div class="quiz-note" data-action="toggle-qnote" dir="auto" title="Click to edit">${sanitize(G.S.qnotes[G.pool[G.qi]])}</div>`;
}

// ── Question image ──────────────────────────────────────────────────
// v1.20.0 — fixes: (a) upload button was missing in the v1.15.0 rebuild
// (only legacy path had it, this new path silently rendered nothing if no
// q.img). (b) Bonus image-warning surface for AI-flagged image-dependent Qs.
if(q.img){
  h+=`<div class="quiz-image-wrap">`;
  h+=`<img class="quiz-image" src="${sanitize(q.img)}" alt="Question image" data-action="view-img" loading="lazy">`;
  h+=`<button class="quiz-image-remove" data-action="remove-img" data-idx="${G.pool[G.qi]}" aria-label="הסר תמונה" title="הסר תמונה">✕</button>`;
  h+=`</div>`;
  if(q.imgDep){
    h+=`<div class="quiz-image-dep" dir="auto"><span style="flex:1">⚠️ שאלה תלוית-תמונה: ההסבר עלול להיות שגוי.</span><button data-action="mark-verified" data-idx="${G.pool[G.qi]}">✓ מאומת</button></div>`;
  }
}else if(!G.examMode && q.imgPending){
  // v1.21.47: only surface photo UI when the question actually references an image
  // (q.imgPending — set for the 2020 + Jun-2023 image-album exams). Previously the
  // upload button rendered on EVERY text question — pointless clutter ("where is the
  // photo?" on questions that never had one). Pure-text questions now render nothing
  // here; imgPending questions still get the honest "not in bank" note plus a manual
  // upload affordance so the real exam plate can be attached.
  h+=`<div class="quiz-image-pending" dir="auto" style="margin:8px 0;padding:8px 12px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;font-size:11px;color:#92400e;line-height:1.5">📷 שאלה זו מתייחסת לתמונה שטרם נוספה למאגר — התשובה וההסבר עשויים להיות חלקיים. ניתן לצרף תמונה ידנית.</div>`;
  h+=`<div class="quiz-image-attach"><button class="quiz-tool quiz-image-upload" data-action="upload-img" data-idx="${G.pool[G.qi]}" aria-label="צרף תמונה">📷 צרף תמונה</button><span id="img-status-${G.pool[G.qi]}" class="quiz-image-status"></span></div>`;
}

// ── Answer choices (radiogroup) ─────────────────────────────────────
const _shuf=getOptShuffle(G.pool[G.qi],q);
const LETTERS=['A','B','C','D','E','F','G','H'];
h+=`<ol class="quiz-choices" role="radiogroup" aria-label="Answer choices">`;
_shuf.forEach((origI,dispJ)=>{
  const o=q.o[origI];
  const isChecked=(origI===G.sel);
  let state='';
  if(G.ans){
    if(!G.examMode){
      if(isOk(q,origI)) state=isChecked?'correct':'correct-unchosen';
      else if(isChecked) state='wrong';
      else state='muted';
    } else if(isChecked) state='correct';
  }
  const stateAttr=state?` data-state="${state}"`:'';
  const lockAttr=G.ans?' disabled':'';
  h+=`<li role="presentation"><button class="quiz-choice" role="radio" aria-checked="${isChecked?'true':'false'}"${stateAttr}${lockAttr} data-action="pick" data-i="${origI}" aria-label="Option ${LETTERS[dispJ]}: ${sanitize(o)}">`+
       `<span class="quiz-choice__letter" aria-hidden="true">${LETTERS[dispJ]}</span>`+
       `<span class="quiz-choice__text" dir="auto">${sanitize(o)}</span>`+
       `</button></li>`;
});
h+=`</ol>`;

// ── Pre-answer footer ───────────────────────────────────────────────
if(!G.ans){
  h+=`<footer class="quiz-actions">`;
  h+=`<button class="btn btn--primary quiz-actions__primary" data-action="check-answer"${G.sel===null?' disabled':''} aria-label="בדוק תשובה">בדוק</button>`;
  if(!G.examMode){
    h+=`<button class="btn btn--ghost" data-action="give-up" aria-label="לא יודע — הצג לי את התשובה">לא יודע</button>`;
  }
  h+=`</footer>`;
  h+='</section>';
  return h;
}

// ===== POST-ANSWER =====
// ── Feedback panel ──────────────────────────────────────────────────
const correct=isOk(q,G.sel);
const feedbackVariant=correct?'ok':'err';
const feedbackTitle=correct?'נכון':'לא נכון';
h+=`<aside class="quiz-feedback quiz-feedback--${feedbackVariant}" role="status" aria-live="polite">`;
h+=`<span class="quiz-feedback__title">${feedbackTitle}</span>`;
if(!G.examMode&&q.e){
  const rendered=remapExplanationLetters(q.e,_shuf).replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>');
  h+=`<p class="quiz-feedback__body" dir="auto">${rendered}</p>`;
}
if(!G.examMode&&q.ref){
  h+=`<div class="quiz-source"><span class="quiz-source__label">מקור</span>${renderSourceLink(q.ref)}</div>`;
}
if(!G.examMode){
  const _aiIdx=G.pool[G.qi];
  h+=`<div class="quiz-feedback__row">`;
  if(G._exCache[_aiIdx]&&!G._exCache[_aiIdx].err){
    h+=`<div id="ai-explain-${_aiIdx}"></div>`;
    setTimeout(()=>renderExplainBox(_aiIdx),0);
  } else {
    const label=G._exCache[_aiIdx]?'נסה שוב':'שאל את קלוד';
    h+=`<button class="btn btn--secondary" data-action="ai-explain" data-idx="${_aiIdx}">${label}</button>`;
  }
  h+=`</div>`;
}
h+=`</aside>`;

// ── Wrong-reason chips ──────────────────────────────────────────────
if(!G.examMode&&!correct&&!G._wrongReason){
  h+=`<div class="quiz-wrong-reason">`+
     `<span class="quiz-wrong-reason__label">למה טעית?</span>`+
     `<div class="quiz-wrong-reason__row">`+
     `<button class="btn btn--secondary" data-action="wrong-reason" data-r="no_knowledge">לא ידעתי</button>`+
     `<button class="btn btn--secondary" data-action="wrong-reason" data-r="misread">קריאה שגויה</button>`+
     `<button class="btn btn--secondary" data-action="wrong-reason" data-r="between_2">היסוס בין שתיים</button>`+
     `<button class="btn btn--secondary" data-action="wrong-reason" data-r="silly">טעות טיפשית</button>`+
     `</div></div>`;
}

// ── Read-chapter shortcut ──────────────────────────────────────────
if(!G.examMode&&!correct&&q.ti>=0){
  const _chRef=TOPIC_REF[q.ti];
  if(_chRef&&_chRef.s==='har'){
    h+=`<button class="btn btn--secondary" data-action="read-chapter" aria-label="קרא פרק ${sanitize(_chRef.l||'')}">קרא: ${sanitize(_chRef.l||'')}</button>`;
  }
}

// ── Difficulty rating ──────────────────────────────────────────────
if(!G.examMode){
  const dr=G._diffRating;
  h+=`<div class="quiz-difficulty">`+
     `<span class="quiz-difficulty__label">דרגת קושי</span>`+
     `<button class="btn btn--secondary" data-action="diff-rating" data-d="easy" aria-pressed="${dr==='easy'}">קלה</button>`+
     `<button class="btn btn--secondary" data-action="diff-rating" data-d="med" aria-pressed="${dr==='med'}">בינונית</button>`+
     `<button class="btn btn--secondary" data-action="diff-rating" data-d="hard" aria-pressed="${dr==='hard'}">קשה</button>`+
     `</div>`;
}

// ── Teach-back panel (correct-only) ────────────────────────────────
if(!G.examMode&&correct){
  if(!G.teachBackState){
    h+=`<aside class="quiz-aux">`+
       `<span class="quiz-aux__title">לַמֵּד בחזרה</span>`+
       `<p class="quiz-aux__body">הסבר מדוע זו התשובה הנכונה.</p>`+
       `<textarea id="tbInput" class="quiz-teachback__input" dir="auto" placeholder="הקלד את ההסבר שלך…" aria-label="הסבר למד-בחזרה"></textarea>`+
       `<div class="quiz-feedback__row">`+
       `<button class="btn btn--primary" data-action="grade-teachback" aria-label="דרג למד-בחזרה עם AI">דרג עם AI</button>`+
       `<button class="btn btn--ghost" data-action="skip-teachback" aria-label="דלג על למד-בחזרה">דלג</button>`+
       `<button class="btn btn--ghost" data-action="voice-teachback" id="tb-mic-btn" aria-label="הקלט למד-בחזרה קולי">קול</button>`+
       `</div></aside>`;
  } else if(G.teachBackState==='grading'){
    h+=`<aside class="quiz-aux"><p class="quiz-aux__body">מדרג…</p></aside>`;
  } else if(G.teachBackState!=='skip'){
    const sc=G.teachBackState.score;
    const scoreLabel=sc===3?'מצוין':sc===2?'חלקי':'דורש עבודה';
    h+=`<aside class="quiz-aux">`+
       `<span class="quiz-aux__title">${scoreLabel}</span>`;
    if(G.teachBackState.feedback){
      h+=`<p class="quiz-aux__body" dir="auto">${sanitize(G.teachBackState.feedback)}</p>`;
    }
    h+=`</aside>`;
  }
}

// ── Distractor Autopsy ─────────────────────────────────────────────
if(!G.examMode){
  const _qIdx=G.pool[G.qi];
  const _dist=(G.DIS&&G.DIS[_qIdx])||null;
  const _apKey='autopsy_'+_qIdx;
  const _aiTxt=G._exCache[_apKey];
  h+=`<aside class="quiz-aux"><span class="quiz-aux__title">ניתוח מסיחים</span>`;
  if(_dist){
    q.o.forEach((opt,i)=>{
      const _isCorrect=isOk(q,i);
      const _isPick=(i===G.sel);
      const dState=_isCorrect?'correct':(_isPick?'wrong':'');
      const stAttr=dState?` data-state="${dState}"`:'';
      const _rationale=_dist[i];
      const mark=_isCorrect?'✓':'✗';
      const pickTag=(_isPick&&!_isCorrect)?' (your pick)':'';
      h+=`<div class="quiz-distractor"${stAttr} dir="auto">`+
         `<div class="quiz-distractor__head">${mark} ${sanitize(opt)}${pickTag}</div>`;
      if(_rationale){
        const safe=sanitize(_rationale)
          .replace(/Wrong because:/g,'<b>Wrong because:</b>')
          .replace(/Would be correct if:/g,'<b>Would be correct if:</b>');
        h+=`<div>${safe}</div>`;
      } else if(_isCorrect){
        h+=`<div>The correct answer.</div>`;
      }
      h+=`</div>`;
    });
  } else if(_aiTxt){
    h+=`<div class="quiz-aux__body" dir="auto">${_aiTxt}</div>`;
  } else {
    h+=`<p class="quiz-aux__body">Loading distractor analysis…</p>`;
    // _distLoading guard (added with PR #71 deferred-fetch refactor):
    // when distractors.json is still in-flight from the data-loader's
    // requestIdleCallback fetch, do NOT fall through to aiAutopsy —
    // that would burn a paid AI call for a question whose curated
    // rationale is about to arrive. data-loader calls G.render() once
    // G.DIS lands, which re-enters this branch with _dist populated.
    if (!G._distLoading) setTimeout(()=>{ if(!G._exCache['autopsy_'+_qIdx])aiAutopsy(_qIdx); },100);
  }
  h+=`</aside>`;
}

// ── Stats footer ───────────────────────────────────────────────────
h+=`<div class="quiz-stats">`+
   `<span>OK ${G.S.qOk}</span>`+
   `<span>NO ${G.S.qNo}</span>`+
   `<span>${pct}</span>`+
   (G.S.sr[G.pool[G.qi]]?.at?`<span>${G.S.sr[G.pool[G.qi]].at}s avg</span>`:'')+
   `</div>`;

// ── Action footer ──────────────────────────────────────────────────
h+=`<footer class="quiz-actions">`;
if(!G.examMode){
  h+=`<button class="btn btn--secondary" data-action="prev-q" aria-label="שאלה קודמת"${G.qi<=0?' disabled':''}>הקודמת</button>`;
}
h+=`<span class="quiz-actions__spacer"></span>`;
const nextLabel=G.examMode&&G.qi+1>=150?'סיים':'הבאה';
const nextAria=G.examMode&&G.qi+1>=150?'סיים מבחן':'שאלה הבאה';
h+=`<button class="btn btn--primary quiz-actions__primary" data-action="next-q" aria-label="${nextAria}">${nextLabel}</button>`;
h+=`</footer>`;

h+='</section>';
return h;
}

// Sudden Death check/next
export function sdCheck(){if(G.sel===null)return;G.ans=true;const q=G.QZ[G.sdPool[G.sdQi]];if(isOk(q,G.sel)){G.sdStreak++;G.S.qOk++;srScore(G.sdPool[G.sdQi],true);G.save();G.render();}else{G.S.qNo++;srScore(G.sdPool[G.sdQi],false);G.save();G.render();setTimeout(()=>endSuddenDeath(),800);}}
export function sdNext(){G.sdQi++;if(G.sdQi>=G.sdPool.length)G.sdQi=0;G.sel=null;G.ans=false;G.autopsyDistractor=-1;G.render();}



// Event delegation for Quiz tab — set up once on #ct container
export function initQuizEvents(container) {
  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    // === Pre-answer ===
    if (action === 'pick') {
      const i = parseInt(el.dataset.i, 10);
      if (G.blindRecall && !G.ans && i !== G.sel) el.classList.remove('qo-blur');
      pick(i);
    }
    else if (action === 'check-answer') { check(); }
    else if (action === 'give-up') { showAnswerHardFail(); }
    else if (action === 'sd-check') { sdCheck(); }
    else if (action === 'sd-next') { sdNext(); }

    // === Post-answer ===
    else if (action === 'next-q') { next(); }
    else if (action === 'prev-q') { prev(); }
    else if (action === 'wrong-reason') {
      G._wrongReason = el.dataset.r; G.save(); G.render();
    }
    else if (action === 'diff-rating') {
      const d = el.dataset.d;
      G._diffRating = d; _storeDiff(G.pool[G.qi], d);
    }
    else if (action === 'open-related-paper') {
      const idx = parseInt(el.dataset.idx, 10);
      if (!isNaN(idx)) {
        G.tab = 'lib'; G.libSec = 'afphari'; G.ahOpenIdx = idx; G.render();
      }
    }
    else if (action === 'read-chapter') {
      G.tab = 'lib'; G.libSec = 'harrison';
      const q = G.QZ[G.pool[G.qi]];
      const chRef = q ? TOPIC_REF[q.ti] : null;
      if (chRef && chRef.s === 'har' && chRef.ch) {
        openHarrisonChapter(chRef.ch);
      } else {
        G.render();
      }
    }
    else if (action === 'skip-teachback') {
      G.teachBackState = 'skip'; G.render();
    }
    else if (action === 'grade-teachback') {
      const v = document.getElementById('tbInput')?.value?.trim();
      if (v) { gradeTeachBack(G.pool[G.qi], v); }
      else { G.teachBackState = 'skip'; G.render(); }
    }
    else if (action === 'voice-teachback') { startVoiceTeachBack(); }
    else if (action === 'ai-explain') {
      explainWithAI(parseInt(el.dataset.idx, 10));
    }
    else if (action === 'ai-autopsy') { aiAutopsy(G.pool[G.qi]); }

    // === Mode controls ===
    else if (action === 'quit-sd') { endSuddenDeath(); }
    else if (action === 'pause-timed') { pauseTimed(); }
    else if (action === 'stop-pomo') { stopPomodoro(); }
    else if (action === 'start-exam') { startExam(); }
    else if (action === 'start-mock') { showMockExamPicker(); }
    else if (action === 'mock-picker-noop') { /* stop propagation so card clicks don't close modal */ }
    else if (action === 'start-mock-mixed') { document.getElementById('mockPicker')?.remove(); startMockExam(); }
    else if (action === 'start-mock-tag') { const tag=el.dataset.tag; document.getElementById('mockPicker')?.remove(); if(tag)startMockExamByTag(tag); }
    else if (action === 'close-mock-picker') { if(el.id==='mockPicker')document.getElementById('mockPicker')?.remove(); }
    else if (action === 'start-sd') { startSuddenDeath(); }
    else if (action === 'start-oncall') { startOnCallMode(); }
    else if (action === 'start-pomo') { startPomodoro(); }
    else if (action === 'start-mini-exam') {
      startTopicMiniExam(parseInt(el.dataset.ti, 10));
    }

    // === Daily Contract ===
    else if (action === 'dismiss-daily') {
      if(!G.S.dailyContract)G.S.dailyContract={};
      G.S.dailyContract.dismissed=true; G.save(); G.render();
    }
    else if (action === 'daily-due') {
      if(G.S.dailyContract){G.S.dailyContract.dueDone=true;G.save();}
      setFilt('due');
    }
    else if (action === 'daily-mark-due') {
      if(G.S.dailyContract){G.S.dailyContract.dueDone=true;G.save();G.render();}
    }
    else if (action === 'daily-drill') {
      if(G.S.dailyContract){G.S.dailyContract.drillDone=true;G.save();}
      buildRescuePool();
    }
    else if (action === 'daily-mark-drill') {
      if(G.S.dailyContract){G.S.dailyContract.drillDone=true;G.save();G.render();}
    }
    else if (action === 'daily-read') {
      if(G.S.dailyContract){G.S.dailyContract.readDone=true;G.save();}
      const idx=G.S.dailyContract&&G.S.dailyContract.readIdx;
      if(idx!=null){ G.tab='lib'; G.libSec='afphari'; G.ahOpenIdx=idx; G.render(); }
    }

    // === Filters ===
    else if (action === 'filter') { setFilt(el.dataset.f); }
    else if (action === 'toggle-year-pills') { G._yearPillsOpen = !(G._yearPillsOpen===true); G.render(); }
    else if (action === 'filter-year') { toggleYearFilt(el.dataset.f); }
    else if (action === 'filter-year-clear') { clearYearFilt(); }
    else if (action === 'filter-rescue') { buildRescuePool(); }
    else if (action === 'filter-nbs') { startNextBestStep(); }
    else if (action === 'filter-wrong-review') { buildWrongReviewPool(); }
    else if (action === 'wrong-review-clear') {
      // Confirm-then-wipe is intentionally light-touch (toast-only) — undo path is
      // cloud-backup → cloudRestore. UI lives in renderQuiz when filter is active.
      resetWrongSet();
      G.filt='all';
      buildPool();
      G.render();
    }

    // === Source-link clicks (data-action="open-source") — see src/ui/source-link.js
    else if (action === 'open-source') {
      const src = el.dataset.src;
      const chRaw = el.dataset.ch;
      const ch = chRaw != null && chRaw !== '' ? parseInt(chRaw, 10) : null;
      const ref = el.dataset.ref || '';
      openSource(src, ch, ref);
    }

    // === Toggles ===
    else if (action === 'toggle-bk') { toggleBk(); }
    else if (action === 'toggle-qnote') { toggleQNote(); }
    else if (action === 'save-qnote') { saveQNote(); }
    else if (action === 'del-qnote') { delQNote(); }
    else if (action === 'cancel-qnote') { const b = document.getElementById('qnote-box'); if (b) b.remove(); }

    // === Image/Media ===
    else if (action === 'view-img') {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (img) viewImg(img.src);
    }
    else if (action === 'remove-img') { removeQImage(parseInt(el.dataset.idx, 10)); }
    else if (action === 'mark-e-verified') {
      const idx=parseInt(el.dataset.idx,10);
      if(!isNaN(idx)&&G.QZ[idx]){delete G.QZ[idx].e_issue;G.render();}
    }
    else if (action === 'mark-verified') {
      const idx=parseInt(el.dataset.idx,10);
      if(!isNaN(idx)&&G.QZ[idx]){delete G.QZ[idx].imgDep;G.render();}
    }
    else if (action === 'clear-eflag') {
      const idx=parseInt(el.dataset.idx,10);
      if(!isNaN(idx)&&G.QZ[idx]){delete G.QZ[idx].eFlag;G.render();}
    }
    else if (action === 'upload-img') { uploadQImage(parseInt(el.dataset.idx, 10)); }
    else if (action === 'speak-q') { speakQuestion(); }
    else if (action === 'share-q') { window.shareQ(); }
    else if (action === 'dismiss') { el.parentElement.style.display = 'none'; }

    // === On-call mode ===
    else if (action === 'exit-oncall') { exitOnCallMode(); }
    else if (action === 'flip-card') { flipCard(); }
    else if (action === 'explain-oncall') { runExplainOnCall(parseInt(el.dataset.idx, 10)); }
    else if (action === 'oncall-pick') { onCallPick(el.dataset.correct === 'true'); }

    // === AI explain ===
    else if (action === 'flag-explain') { toggleFlagExplain(parseInt(el.dataset.idx, 10)); }
  });

  container.addEventListener('change', (e) => {
    const action = e.target.dataset?.action;
    if (action === 'toggle-blind') { G.blindRecall = e.target.checked; G.render(); }
    else if (action === 'toggle-autopsy') { G.autopsyMode = e.target.checked; G.render(); }
    else if (action === 'toggle-timed') {
      G.timedMode = e.target.checked;
      if (G.timedMode) { clearInterval(G.timedInt); G.timedSec = 90; G.render(); setTimeout(startTimedQ, 50); }
      else { stopTimedMode(); }
    }
    else if (action === 'topic-select') {
      const v = parseInt(e.target.value, 10);
      if (v === -1 || isNaN(v)) setFilt('all');
      else setTopicFilt(v);
    }
  });
}
