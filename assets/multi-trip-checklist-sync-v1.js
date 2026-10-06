(async function(){
'use strict';
if(window.MultiTripChecklistSync&&window.MultiTripChecklistSync.__v3)return;

const URL='https://rihnuowhkzrpfkvrsxej.supabase.co';
const KEY='sb_publishable_BRRplXPLHlRw2vcr5aMGmw_bHaHlJvy';
const DEFAULT_TRIP='shirakawago-shinhotaka-2027';
const LEGACY_LOCAL='japanWinter2027DepartureChecklistV1';
const LEGACY_PENDING='japanWinter2027DepartureChecklistPendingV1';
const LEGACY_SPLIT_MAP={
  pack_cards:['pack_visa','pack_master','pack_unionpay'],
  pack_gloves:['pack_ski_gloves','pack_decathlon_gloves'],
  pack_hat_scarf:['pack_hats','pack_scarves'],
  pack_socks:['pack_regular_socks','pack_thick_socks'],
  pack_clothes:['pack_outfits_min','pack_base_layers','pack_windy_thermal','pack_long_sleeves','pack_snow_pants','pack_gary_jeans','pack_windy_skirt'],
  pack_toothbrush:['pack_electric_toothbrush','pack_sensitive_toothpaste','pack_disposable_toothpaste','pack_disposable_toothbrush'],
  pack_haircare:['pack_conditioner','pack_shampoo'],
  pack_hangers:['pack_hangers','pack_clothesline'],
  pack_skincare:['pack_skincare_set','pack_handcream','pack_bodylotion','pack_vaseline','pack_eczema_cream'],
  pack_makeup:['pack_makeup','pack_makeup_wipes'],
  pack_dental:['pack_toothpicks','pack_floss'],
  pack_lunchbox:['pack_lunchbox','pack_forks'],
  pack_medicines:['pack_panadol','pack_trumpet','pack_cold_drink','pack_plasters','pack_antiseptic_wipes','pack_antiseptic_liquid'],
  pack_selfiestick:['pack_selfiestick','pack_tripod'],
  pack_kettle:['pack_kettle','pack_stove'],
  pack_cctv:['pack_cctv','pack_memorycard'],
  pack_dashcam:['pack_dashcam','pack_dashcam_mount']
};
let createClient;try{({createClient}=await import('https://esm.sh/@supabase/supabase-js@2'));}catch(e){return;}
const db=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const tid=()=>window.MultiTrip&&window.MultiTrip.id||'trip';
const LOCAL=()=>`multiTrip.departureChecklist.${tid()}`;
const PENDING=()=>`multiTrip.departureChecklistPending.${tid()}`;
const remoteId=id=>`${tid()}::${id}`;
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{};}catch(e){return{};}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v||{}));}catch(e){}};
function expandLegacyState(source){
  const out=Object.assign({},source||{});
  Object.keys(LEGACY_SPLIT_MAP).forEach(oldId=>{
    if(out[oldId]!==true)return;
    LEGACY_SPLIT_MAP[oldId].forEach(newId=>{if(out[newId]===undefined)out[newId]=true;});
  });
  return out;
}
function mergeMissing(target,source,allowed){
  const allow=allowed?new Set(allowed):null;
  Object.keys(source||{}).forEach(k=>{if((!allow||allow.has(k))&&target[k]===undefined)target[k]=source[k];});
  return target;
}
function migrateLegacyLocal(){
  if(tid()!==DEFAULT_TRIP)return;
  try{
    const current=expandLegacyState(read(LOCAL()));
    const legacy=expandLegacyState(read(LEGACY_LOCAL));
    mergeMissing(current,legacy);
    write(LOCAL(),current);
    const pending=expandLegacyState(read(PENDING()));
    const oldPending=expandLegacyState(read(LEGACY_PENDING));
    mergeMissing(pending,oldPending);
    write(PENDING(),pending);
  }catch(e){}
}
function waitSection(){return new Promise(resolve=>{const now=document.getElementById('departure-checklist');if(now)return resolve(now);const o=new MutationObserver(()=>{const s=document.getElementById('departure-checklist');if(s){o.disconnect();resolve(s);}});o.observe(document.documentElement,{childList:true,subtree:true});});}
const section=await waitSection();migrateLegacyLocal();
function rows(){return [...section.querySelectorAll('.mt-departure-item[data-key]')];}
function mapInputs(){const out={};rows().forEach(r=>{const cb=r.querySelector('input[type="checkbox"]');if(cb){cb.dataset.syncId=r.dataset.key;out[r.dataset.key]=cb;}});return out;}
function refreshProgress(){let p=section.querySelector('#mtDepartureProgress');if(!p){p=document.createElement('div');p.id='mtDepartureProgress';p.className='mt-departure-progress';section.querySelector('.section-header')?.appendChild(p);}const all=Object.values(mapInputs()),done=all.filter(x=>x.checked).length;p.textContent='完成 '+done+' / '+all.length+(all.length&&done===all.length?'　✅ 可以出發':'');}
const head=section.querySelector('.section-header');let panel=document.getElementById('multiTripCloudSyncPanel');if(!panel){panel=document.createElement('div');panel.id='multiTripCloudSyncPanel';panel.style.cssText='margin-top:10px;padding:10px;border:1px solid #d8e3ea;border-radius:9px;background:#f7fafc;display:flex;gap:7px;flex-wrap:wrap;align-items:center';panel.innerHTML='<span data-sync-status style="flex:1 1 190px;font-size:11px;font-weight:700">☁️ 未登入同步</span><button data-sync-login type="button" style="border:0;border-radius:7px;padding:7px 10px;background:#1f4e79;color:white;font-weight:700">登入同步</button><button data-sync-create type="button" style="border:0;border-radius:7px;padding:7px 10px;background:#dff0e5;color:#295c3a;font-weight:700">首次建立帳戶</button><button data-sync-now type="button" style="border:0;border-radius:7px;padding:7px 10px;background:#e9f0f5;color:#294c67;font-weight:700">↻ 同步</button><div style="width:100%;font-size:10.5px;color:#6b7882">同一個同步帳戶登入 PC／iPhone，可共用目前 Trip 嘅出發前 Checklist；不同 Trip 會分開儲存。</div>';head?.appendChild(panel);}
const status=panel.querySelector('[data-sync-status]'),loginBtn=panel.querySelector('[data-sync-login]'),createBtn=panel.querySelector('[data-sync-create]'),syncBtn=panel.querySelector('[data-sync-now]');
const setStatus=t=>{if(status)status.textContent=t;};
function applyState(state){const m=mapInputs();Object.entries(m).forEach(([id,cb])=>{cb.checked=!!state[id];cb.closest('.mt-departure-item')?.classList.toggle('done',!!state[id]);});write(LOCAL(),state);refreshProgress();}
async function session(){return (await db.auth.getSession()).data.session;}
async function refreshAccountUI(){const s=await session();if(s){loginBtn.textContent='登出同步';createBtn.style.display='none';setStatus('☁️ 已登入：'+(s.user?.email||'同步帳戶'));}else{loginBtn.textContent='登入同步';createBtn.style.display='inline-block';setStatus('☁️ 未登入同步');}return s;}
async function canonicalRemote(userId){const prefix=tid()+'::';const {data,error}=await db.from('trip_checklist_state').select('item_id,checked,updated_at').eq('user_id',userId).like('item_id',prefix+'%');if(error)throw error;const out={};(data||[]).forEach(r=>{const item=String(r.item_id||'').slice(prefix.length);if(item)out[item]=!!r.checked;});return{rows:data||[],state:expandLegacyState(out)};}
async function legacyJapanRemote(userId,keys){
  if(tid()!==DEFAULT_TRIP||!keys.length)return{rows:[],state:{}};
  const lookup=[...new Set(keys.concat(Object.keys(LEGACY_SPLIT_MAP)))];
  const {data,error}=await db.from('trip_checklist_state').select('item_id,checked,updated_at').eq('user_id',userId).in('item_id',lookup);
  if(error)throw error;
  const raw={};(data||[]).forEach(r=>{if(lookup.includes(r.item_id))raw[r.item_id]=!!r.checked;});
  const expanded=expandLegacyState(raw),out={};keys.forEach(k=>{if(expanded[k]!==undefined)out[k]=expanded[k];});
  return{rows:data||[],state:out};
}
async function upsertState(userId,state,ids){const chosen=ids||Object.keys(state);if(!chosen.length)return;const rows=chosen.map(id=>({user_id:userId,item_id:remoteId(id),checked:!!state[id]}));const r=await db.from('trip_checklist_state').upsert(rows);if(r.error)throw r.error;}
let syncing=false;
async function sync(){
  if(syncing)return;
  const s=await session();if(!s){setStatus('☁️ 未登入同步');return;}if(!navigator.onLine){setStatus('📴 離線：稍後再同步');return;}
  syncing=true;setStatus('🔄 同步中…');migrateLegacyLocal();
  try{
    const inputs=mapInputs(),keys=Object.keys(inputs),keySet=new Set(keys),local=expandLegacyState(read(LOCAL())),pending=expandLegacyState(read(PENDING()));
    const canonical=await canonicalRemote(s.user.id),remote={};
    keys.forEach(k=>{if(canonical.state[k]!==undefined)remote[k]=canonical.state[k];});

    if(tid()===DEFAULT_TRIP){
      const legacy=await legacyJapanRemote(s.user.id,keys);
      mergeMissing(remote,legacy.state,keys);
    }
    mergeMissing(remote,local,keys);

    Object.keys(pending).forEach(k=>{if(keySet.has(k))remote[k]=!!local[k];});
    const pendingKeys=Object.keys(pending).filter(k=>keySet.has(k));
    if(pendingKeys.length){await upsertState(s.user.id,remote,pendingKeys);}

    const missingCanonical=keys.filter(k=>remote[k]!==undefined&&canonical.state[k]===undefined);
    if(missingCanonical.length)await upsertState(s.user.id,remote,missingCanonical);

    write(PENDING(),{});
    applyState(remote);
    setStatus('✅ 已同步');
  }catch(error){setStatus('⚠️ 同步失敗：'+(error&&error.message||error));}
  finally{syncing=false;}
}
loginBtn.onclick=async()=>{const cur=await session();if(cur){if(confirm('要登出目前同步帳戶？')){await db.auth.signOut();await refreshAccountUI();}return;}const email=prompt('同步帳戶 Email：');if(!email)return;const password=prompt('同步帳戶密碼：');if(!password)return;setStatus('🔐 登入中…');const r=await db.auth.signInWithPassword({email,password});if(r.error){alert('登入失敗：'+r.error.message);await refreshAccountUI();return;}await refreshAccountUI();await sync();};
createBtn.onclick=async()=>{if(await session()){await refreshAccountUI();return;}const email=prompt('建立同步帳戶 Email：');if(!email)return;const password=prompt('建立密碼（PC／iPhone 用同一組）：');if(!password)return;if(password.length<6){alert('密碼最少 6 個字元。');return;}setStatus('🆕 建立帳戶中…');const redirect=location.origin+location.pathname+location.search;const r=await db.auth.signUp({email,password,options:{emailRedirectTo:redirect}});if(r.error){alert('建立帳戶失敗：'+r.error.message);await refreshAccountUI();return;}if(r.data.session){await refreshAccountUI();await sync();return;}setStatus('📧 已寄確認電郵');alert('帳戶已建立。請到 Email 按確認連結，再返回旅程資料登入同步。');};
syncBtn.onclick=sync;
section.addEventListener('change',async e=>{const cb=e.target.closest('.mt-departure-item input[type="checkbox"]');if(!cb)return;const row=cb.closest('.mt-departure-item'),item=row?.dataset.key;if(!item)return;refreshProgress();const local=expandLegacyState(read(LOCAL()));local[item]=cb.checked;write(LOCAL(),local);const p=expandLegacyState(read(PENDING()));p[item]=true;write(PENDING(),p);const s=await session();if(s&&navigator.onLine){try{await upsertState(s.user.id,local,[item]);const q=read(PENDING());delete q[item];write(PENDING(),q);setStatus('✅ 已同步');}catch(error){setStatus('⚠️ 待同步');}}},true);
document.addEventListener('multitrip:departure-reset',e=>{if(e.detail&&e.detail.tripId&&e.detail.tripId!==tid())return;const keys=e.detail&&Array.isArray(e.detail.keys)?e.detail.keys:Object.keys(mapInputs()),local={},pending={};keys.forEach(k=>{local[k]=false;pending[k]=true;});write(LOCAL(),local);write(PENDING(),pending);setStatus('⚠️ 重設待同步');setTimeout(sync,0);});
document.addEventListener('multitrip:departurerendered',()=>{mapInputs();refreshProgress();});
const observer=new MutationObserver(()=>{mapInputs();refreshProgress();});observer.observe(section.querySelector('.section-body')||section,{childList:true,subtree:true});
window.addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});db.auth.onAuthStateChange(()=>setTimeout(async()=>{await refreshAccountUI();await sync();},0));
mapInputs();refreshProgress();await refreshAccountUI();await sync();window.MultiTripChecklistSync={__v3:true,sync,migrateLegacyLocal,expandLegacyState};
})();
