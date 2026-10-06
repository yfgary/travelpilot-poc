(function(){
'use strict';
if(window.MultiTripDepartureChecklist&&window.MultiTripDepartureChecklist.__v3)return;

const DEFAULT_TRIP='shirakawago-shinhotaka-2027';
const LEGACY_LOCAL='japanWinter2027DepartureChecklistV1';
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
const $=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function id(){return window.MultiTrip&&window.MultiTrip.id||'trip';}
function data(){
  if(!window.MultiTripData)return null;
  const dedicated=window.MultiTripData.all('departureChecklist');
  if(dedicated)return dedicated;
  const info=window.MultiTripData.all('tripInfo');
  return info&&info.departureChecklist||null;
}
function key(){return'multiTrip.departureChecklist.'+id();}
function parse(raw){try{const v=JSON.parse(raw||'{}');return v&&typeof v==='object'?v:{};}catch(e){return{};}}
function write(s){try{localStorage.setItem(key(),JSON.stringify(s||{}));}catch(e){}}
function expandLegacyState(source){
  const out=Object.assign({},source||{});
  Object.keys(LEGACY_SPLIT_MAP).forEach(oldId=>{
    if(out[oldId]!==true)return;
    LEGACY_SPLIT_MAP[oldId].forEach(newId=>{if(out[newId]===undefined)out[newId]=true;});
  });
  return out;
}
function migrateLegacyLocal(){
  if(id()!==DEFAULT_TRIP)return;
  try{
    const current=expandLegacyState(parse(localStorage.getItem(key())));
    const legacy=expandLegacyState(parse(localStorage.getItem(LEGACY_LOCAL)));
    let changed=false;
    Object.keys(legacy).forEach(k=>{if(current[k]===undefined){current[k]=legacy[k];changed=true;}});
    const stored=parse(localStorage.getItem(key()));
    Object.keys(current).forEach(k=>{if(stored[k]!==current[k])changed=true;});
    if(changed||localStorage.getItem(key())===null)write(current);
  }catch(e){}
}
function read(){migrateLegacyLocal();try{return expandLegacyState(parse(localStorage.getItem(key())));}catch(e){return{};}}
function groups(obj){
  if(Array.isArray(obj&&obj.groups))return obj.groups;
  if(Array.isArray(obj&&obj.items))return[{title:obj.title||'Checklist',items:obj.items}];
  return[];
}
function itemObject(it,idx){
  if(typeof it==='string')return{id:'i'+idx,label:it};
  if(Array.isArray(it))return{id:it[0]||'i'+idx,label:it[1]||it[0]||''};
  return it&&typeof it==='object'?{id:it.id||'i'+idx,label:it.label||it.text||''}:{id:'i'+idx,label:''};
}
function ensureStyle(){
  if($('#mtDepartureChecklistStyle'))return;
  const s=document.createElement('style');
  s.id='mtDepartureChecklistStyle';
  s.textContent='.mt-departure-progress{margin-top:8px;font-size:11px;font-weight:800;color:#526571}.mt-departure-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.mt-departure-group{background:#f7f9fb;border:1px solid #e2e8ed;border-radius:10px;padding:12px}.mt-departure-group h3{margin:0 0 8px;color:#1f4e79;font-size:14px}.mt-departure-item{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-top:1px solid #edf1f4;font-size:12px;line-height:1.45}.mt-departure-item:first-of-type{border-top:0}.mt-departure-item.done span{text-decoration:line-through;opacity:.55}.mt-departure-actions{margin-top:10px}.mt-departure-reset{border:1px solid #cad7df;background:#fff;color:#1f4e79;border-radius:8px;padding:7px 10px;font-weight:800}@media(max-width:720px){.mt-departure-groups{grid-template-columns:1fr}}';
  document.head.appendChild(s);
}
function ensureSection(obj){
  let sec=document.getElementById('departure-checklist');
  if(!sec){
    sec=document.createElement('section');
    sec.className='section';sec.id='departure-checklist';
    sec.innerHTML='<div class="section-header"><h2 class="section-title"></h2><div class="section-desc"></div><div class="mt-departure-progress" id="mtDepartureProgress"></div></div><div class="section-body"></div>';
    const before=document.getElementById('checklist')||document.getElementById('emergency'),host=$('.container');
    if(before&&before.parentNode)before.parentNode.insertBefore(sec,before);else if(host)host.appendChild(sec);
  }else if(!$('#mtDepartureProgress',sec)){
    const p=document.createElement('div');p.className='mt-departure-progress';p.id='mtDepartureProgress';sec.querySelector('.section-header')?.appendChild(p);
  }
  const t=$('.section-title',sec),d=$('.section-desc',sec);
  if(t)t.textContent=obj.title||'🧳 出發前 Checklist';
  if(d)d.textContent=obj.desc||'出發前逐項確認';
  sec.hidden=false;sec.dataset.tripInfoSource=window.MultiTripData&&window.MultiTripData.all('departureChecklist')?'departure-checklist.json':'trip-info.json';
  return sec;
}
function refreshProgress(sec){
  const all=[...sec.querySelectorAll('.mt-departure-item input[type="checkbox"]')],done=all.filter(x=>x.checked).length,p=$('#mtDepartureProgress',sec);
  if(p)p.textContent='完成 '+done+' / '+all.length+(all.length&&done===all.length?'　✅ 可以出發':'');
}
function render(){
  if(!/(?:^|\/)trip-info\.html$/.test(location.pathname))return 0;
  if(window.MultiTrip&&!window.MultiTrip.feature('packingChecklist'))return 0;
  const obj=data(),gs=groups(obj);if(!obj||!gs.length)return 0;
  ensureStyle();migrateLegacyLocal();
  const sec=ensureSection(obj),body=$('.section-body',sec),state=read();let idx=0;
  body.innerHTML='<div class="mt-departure-groups">'+gs.map(g=>'<div class="mt-departure-group"><h3>'+esc(g.title||g.group||'Checklist')+'</h3>'+(g.items||[]).map(it=>{const x=itemObject(it,idx++),k=String(x.id);return'<label class="mt-departure-item '+(state[k]?'done':'')+'" data-key="'+esc(k)+'"><input type="checkbox" '+(state[k]?'checked':'')+'><span>'+esc(x.label)+'</span></label>';}).join('')+'</div>').join('')+'</div><div class="mt-departure-actions"><button type="button" class="mt-departure-reset">↺ 重設出發前 Checklist</button></div>';
  body.querySelectorAll('.mt-departure-item input').forEach(cb=>cb.addEventListener('change',()=>{
    const row=cb.closest('.mt-departure-item'),s=read();s[row.dataset.key]=cb.checked;write(s);row.classList.toggle('done',cb.checked);refreshProgress(sec);
  }));
  $('.mt-departure-reset',body).onclick=()=>{
    const keys=[...body.querySelectorAll('.mt-departure-item[data-key]')].map(x=>x.dataset.key),s={};keys.forEach(k=>s[k]=false);write(s);render();document.dispatchEvent(new CustomEvent('multitrip:departure-reset',{detail:{tripId:id(),keys}}));
  };
  const nav=$('.quick-nav-inner');if(nav&&!nav.querySelector('a[href="#departure-checklist"]')){const a=document.createElement('a');a.href='#departure-checklist';a.textContent='🧳 出發前';const ref=nav.querySelector('a[href="#checklist"]');nav.insertBefore(a,ref||null);}
  refreshProgress(sec);
  const count=gs.reduce((n,g)=>n+(g.items||[]).length,0);
  document.documentElement.dataset.departureChecklistCount=String(count);
  document.dispatchEvent(new CustomEvent('multitrip:departurerendered',{detail:{tripId:id(),count,source:sec.dataset.tripInfoSource}}));
  return count;
}
function boot(){
  Promise.all([window.MultiTrip&&window.MultiTrip.ready||Promise.resolve(),window.MultiTripData&&window.MultiTripData.ready||Promise.resolve()]).then(()=>[40,320,1000].forEach(t=>setTimeout(render,t)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.MultiTripDepartureChecklist={__v3:true,render,read,migrateLegacyLocal,expandLegacyState};
})();
