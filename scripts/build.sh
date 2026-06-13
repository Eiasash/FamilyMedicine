#!/usr/bin/env bash
set -euo pipefail

echo "=== Mishpacha Mega — Production Build ==="

# 1. Run Vite build (bundles JS/CSS, processes HTML)
echo "→ Vite build..."
npx vite build

# 2. Copy static assets that Vite doesn't process
echo "→ Copying static assets..."
cp -r data/ dist/data/
cp goroll_chapters.json dist/
cp nelson_chapters.json dist/
cp lerner_index.json dist/

# 2a. Merge AI-hard seed Qs into dist/data/questions.json (v1.4.0+)
# Source-of-truth questions.json stays clean of generated content; seed lives alongside.
# We inject at build time so the merged bundle ships with the prod app.
if [ -f data/ai_hard_seed.json ]; then
  echo "→ Merging AI-hard seed Qs into dist/data/questions.json..."
  node -e "
    const fs=require('fs');
    const base=JSON.parse(fs.readFileSync('dist/data/questions.json','utf8'));
    const seed=JSON.parse(fs.readFileSync('data/ai_hard_seed.json','utf8'));
    const tags={};
    seed.forEach(q=>{tags[q.t]=(tags[q.t]||0)+1;});
    const merged=[...base,...seed];
    fs.writeFileSync('dist/data/questions.json',JSON.stringify(merged));
    console.log('  base='+base.length+' + seed='+seed.length+' = '+merged.length+' total');
    console.log('  seed tags:',JSON.stringify(tags));
  "
fi
cp -r shared/ dist/shared/
cp -r exams/ dist/exams/
find dist/exams -name '*.pdf' -delete   # IMA exam PDFs are copyrighted; ship only question images
[ -d articles ] && cp -r articles/ dist/articles/ || echo "  (skip: articles/ not present)"
[ -d docs/references/afp_hari ] && cp -r docs/references/afp_hari/ dist/afp_hari/ || echo "  (skip: docs/references/afp_hari/ not present)"
[ -d questions ] && cp -r questions/ dist/questions/ || echo "  (skip: questions/ not present)"
[ -d syllabus ] && cp -r syllabus/ dist/syllabus/ || echo "  (skip: syllabus/ not present)"
cp manifest.json dist/manifest.json
cp index.html dist/index.html

# 3. Fix manifest.json path in built HTML
# Vite hashes it to assets/manifest-HASH.json — revert to plain manifest.json
echo "→ Fixing manifest path in built HTML..."
sed -i 's|href="[^"]*manifest[^"]*\.json"|href="manifest.json"|' dist/mishpacha-mega.html


# Defensive parity check — cp -r can silently drop files under ENOSPC or
# similar per-file errors while returning 0 at the invocation level. Assert
# every static-asset sub-tree that landed in dist/ matches its source count.
echo "→ Verifying static-asset parity (src vs dist)..."
for d in data shared articles docs/references/afp_hari questions syllabus; do
  dst=$(basename "$d")
  if [ -d "$d" ] && [ -d "dist/$dst" ]; then
    src_count=$(find "$d" -type f | wc -l)
    dst_count=$(find "dist/$dst" -type f | wc -l)
    if [ "$src_count" -ne "$dst_count" ]; then
      echo "FATAL: $d/ → dist/$dst/ lost files (src=$src_count, dst=$dst_count)" >&2
      exit 1
    fi
    echo "  ✓ $d/ → dist/$dst/ ($src_count files)"
  fi
done

# 4. Generate production service worker
# In production, JS/CSS are content-hashed (immutable) — browser cache handles them.
# SW only needs to cache: HTML shell (offline access) + data JSON (offline quiz).
echo "→ Generating production service worker..."
# Read APP_VERSION from src/core/constants.js so CACHE name always matches
APP_VER=$(grep -oE "APP_VERSION\s*=\s*'[^']+'" src/core/constants.js | head -1 | sed -E "s/.*'([^']+)'/\1/")
if [ -z "$APP_VER" ]; then
  echo "ERROR: could not read APP_VERSION from src/core/constants.js" >&2
  exit 1
fi
echo "  → CACHE=mishpacha-v${APP_VER}"
cat > dist/sw.js << SWEOF
const CACHE='mishpacha-v${APP_VER}';
const SHELL_URLS=['mishpacha-mega.html','manifest.json','shared/fsrs.js','shared/tokens.css','shared/install-promo.js','shared/install-promo-config.js'];
// CRITICAL_DATA: pre-cached on install (best-effort — Promise.allSettled).
// One transient 5xx must NOT kill SW install — these files are also fetched
// at runtime via stale-while-revalidate, so a missed pre-cache self-heals.
const CRITICAL_DATA=['data/questions.json','data/highyield.json','data/topics.json','data/notes.json','data/tabs.json','data/distractors.json'];
// LAZY_DATA: NOT pre-cached on install (~8 MB total). Cached on first fetch via
// the stale-while-revalidate handler below. Removes 8 MB of network from the
// install path so SW activates fast even on slow mobile (LCP fix, issue #25).
const LAZY_DATA=['data/afp_hari_index.json','data/nelson_notes.json','goroll_chapters.json','nelson_chapters.json','lerner_index.json'];
// DATA_URLS preserved so the fetch handler's stale-while-revalidate match still
// covers both critical and lazy entries (cache-on-first-fetch for LAZY items).
const DATA_URLS=[...CRITICAL_DATA,...LAZY_DATA];

self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(async c=>{
    // SHELL is atomic — if it fails the SW is unusable, fail loud.
    await c.addAll(SHELL_URLS);
    // CRITICAL is best-effort — runtime SWR will heal anything that missed.
    await Promise.allSettled(CRITICAL_DATA.map(u=>c.add(u)));
  }).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(!e.request.url.startsWith(self.location.origin))return;
  const url=new URL(e.request.url).pathname;
  // Navigate → network-first with HTML fallback
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(res=>{
      if(res.ok){const c=res.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c));}
      return res;
    }).catch(()=>caches.match('mishpacha-mega.html')));
  }
  // Data JSON → stale-while-revalidate
  else if(DATA_URLS.some(d=>url.endsWith(d))){
    e.respondWith(caches.match(e.request).then(r=>{
      const nf=fetch(e.request).then(res=>{
        if(res.ok){const c=res.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c));}
        return res;
      });
      return r||nf;
    }).catch(()=>caches.match(e.request)));
  }
  // Hashed assets (JS/CSS) → cache-first (immutable by content hash)
  else if(url.includes('/assets/')){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      if(res.ok){const c=res.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c));}
      return res;
    })));
  }
  // Everything else → network-first
  else{
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
  }
});

// Background sync for Supabase backup
self.addEventListener('sync',e=>{
if(e.tag==='supabase-backup'){
e.waitUntil(
(async()=>{
try{
const db=await new Promise((resolve,reject)=>{
const req=indexedDB.open('mishpacha_mega_db',1);
req.onsuccess=ev=>resolve(ev.target.result);
req.onerror=ev=>reject(ev.target.error);
});
const tx=db.transaction('state','readonly');
const req=tx.objectStore('state').get('pending_sync');
const data=await new Promise(r=>{req.onsuccess=()=>r(req.result);req.onerror=()=>r(null);});
if(data&&data.url&&data.body){
const res=await fetch(data.url,{method:'POST',headers:{'Content-Type':'application/json','apikey':data.apikey||''},body:JSON.stringify(data.body)});
if(res.ok){
const clearTx=db.transaction('state','readwrite');
clearTx.objectStore('state').delete('pending_sync');
}
}
}catch(err){console.warn('Background sync failed:',err);}
})()
);
}
});

self.addEventListener('message',e=>{
if(e.data&&e.data.type==='SKIP_WAITING'){self.skipWaiting();}
if(e.data&&e.data.type==='schedule-notification'){
const dueCount=e.data.dueCount||0;
if(dueCount>0&&self.registration.showNotification){
self.registration.showNotification('Mishpacha Mega — Daily Review',{
body:'You have '+dueCount+' question'+(dueCount>1?'s':'')+' due for spaced repetition review.',
tag:'daily-review',renotify:true,
data:{url:self.registration.scope+'mishpacha-mega.html'}
});
}
}
});

self.addEventListener('notificationclick',e=>{
e.notification.close();
e.waitUntil(
clients.matchAll({type:'window'}).then(cls=>{
for(const c of cls){if(c.url.includes('mishpacha-mega')&&'focus' in c)return c.focus();}
if(clients.openWindow)return clients.openWindow(e.notification.data?.url||'mishpacha-mega.html');
})
);
});
SWEOF

# 4b. Verify the generated dist/sw.js is internally consistent.
#     Catches drift between scripts/build.sh heredoc and what Vite actually emits
#     (e.g. someone renames data/*.json but forgets to update the heredoc list).
echo "→ Verifying dist/sw.js manifest…"
node scripts/verify-dist-sw.cjs

# 5. Summary
echo ""
echo "=== Build complete ==="
echo "Output: dist/"
du -sh dist/
echo ""
echo "Key files:"
ls -lh dist/mishpacha-mega.html dist/sw.js dist/manifest.json dist/assets/*.js dist/assets/*.css 2>/dev/null
echo ""
echo "Static assets:"
du -sh dist/data/ dist/shared/ dist/exams/ 2>/dev/null; \
  for d in dist/articles/ dist/questions/ dist/syllabus/; do [ -d "$d" ] && du -sh "$d"; done; true
