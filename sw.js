// 武家合戦3D: plays from the copy saved on the phone first; only a genuine, complete game page from the server updates it.
// Same site as the original 武家合戦, so: only delete our own old caches (buke-keep3d-*), never the original's.
const CACHE='buke-keep3d-v51';
const CORE=['./','index.html','gfx.js','gfx3d.js','mount3d.js','foot3d.js','bld3d.js','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png','icon-1024.png'];
const MARK='name="app-id" content="buke-kassen-3d"';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>fetch(u,{cache:'reload'}).then(r=>{if(r.ok)return c.put(u,r);}).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k.startsWith('buke-keep3d-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
let UPDATED=false;
self.addEventListener('message',e=>{if(e.data==='buke-check'&&UPDATED&&e.source)e.source.postMessage({type:'buke-updated'});});
const mine=()=>caches.open(CACHE);
async function freshGame(req){
  try{const r=await fetch(req,{cache:'no-store'});if(!r.ok||r.redirected)return null;const t=await r.clone().text();
    if(t.length<50000||!t.includes(MARK))return null;const c=await mine();
    const old=await c.match('index.html');const was=old?await old.text():null;
    await c.put('index.html',r.clone());
    if(was!==null&&was!==t){UPDATED=true;const cs=await self.clients.matchAll({type:'window'});cs.forEach(cl=>cl.postMessage({type:'buke-updated'}));}
    return r;}catch(e){return null;}
}
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.searchParams.has('u'))return;// the update button asks the server directly
  if(r.mode==='navigate'){
    e.respondWith((async()=>{const hit=await (await mine()).match('index.html');
      if(hit){e.waitUntil(freshGame(r));return hit;}
      return (await freshGame(r))||fetch(r);})());return;}
  if(u.origin===location.origin||/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(mine().then(c=>c.match(r)).then(hit=>hit||fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();mine().then(c=>c.put(r,cp));}return res;}).catch(()=>hit)));
  }
});
