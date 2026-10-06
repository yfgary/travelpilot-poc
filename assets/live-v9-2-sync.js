(function(){
'use strict';
if(window.__japan2027LiveV1050Sync)return;
window.__japan2027LiveV1050Sync=true;

const DEFAULT_TRIP='shirakawago-shinhotaka-2027';
const HAKUBA47_LIVE='https://www.vill.hakuba.nagano.jp/livecamera/';
const tpl=new Map();
const $=s=>document.querySelector(s);
const section=id=>document.getElementById(id);
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const mapUrl=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q||'');

function waitForGlobal(test,timeout){
 return new Promise(resolve=>{
  const started=Date.now();
  const tick=()=>{const value=test();if(value||Date.now()-started>=timeout){resolve(value||null);return;}setTimeout(tick,25);};
  tick();
 });
}
function ensureMultiTrip(){
 if(window.MultiTrip)return Promise.resolve(window.MultiTrip);
 const existing=[...document.scripts].find(s=>(s.src||'').includes('multi-trip-context-v1.js'));
 if(existing)return waitForGlobal(()=>window.MultiTrip,1800);
 return new Promise(resolve=>{
  const s=document.createElement('script');s.id='multiTripContextV1Script';s.src='assets/multi-trip-context-v1.js?v=10.12.0';s.async=false;
  s.onload=()=>resolve(window.MultiTrip||null);s.onerror=()=>resolve(null);(document.head||document.documentElement).appendChild(s);
 });
}
function ensureData(){
 if(window.MultiTripData)return window.MultiTripData.ready||Promise.resolve(window.MultiTripData);
 const existing=[...document.scripts].find(s=>(s.src||'').includes('multi-trip-data-v1.js'));
 if(existing)return waitForGlobal(()=>window.MultiTripData,1800).then(d=>d&&d.ready?d.ready.then(()=>d):d);
 return new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.id='multiTripDataV1Script';s.src='assets/multi-trip-data-v1.js?v=2';s.async=false;
  s.onload=()=>{const d=window.MultiTripData;d&&d.ready?d.ready.then(()=>resolve(d),reject):resolve(d);};s.onerror=reject;(document.head||document.documentElement).appendChild(s);
 });
}
function ensureCore(){
 if(window.Japan2027Core)return Promise.resolve(window.Japan2027Core);
 return new Promise((resolve,reject)=>{
  let s=document.getElementById('tripCoreV1Script');
  if(s){s.addEventListener('load',()=>resolve(window.Japan2027Core),{once:true});s.addEventListener('error',reject,{once:true});return;}
  s=document.createElement('script');s.id='tripCoreV1Script';s.src='assets/trip-core-v1.js?v=9';s.async=false;
  s.onload=()=>resolve(window.Japan2027Core);s.onerror=reject;(document.head||document.documentElement).appendChild(s);
 });
}
function loadRenderer(){
 if(window.MultiTripLiveRenderer){try{window.MultiTripLiveRenderer.render();}catch(e){}return;}
 if([...document.scripts].some(s=>(s.src||'').includes('multi-trip-live-renderer-v1.js')))return;
 const s=document.createElement('script');s.id='multiTripLiveRendererV1Script';s.src='assets/multi-trip-live-renderer-v1.js?v=1';s.async=false;document.body.appendChild(s);
}
function capture(){document.querySelectorAll('.cam-card').forEach(card=>{const h=card.querySelector('h3'),name=h?(h.textContent||'').replace(/\s+/g,' ').trim():'';if(name&&!tpl.has(name))tpl.set(name,card.cloneNode(true));});}
function cloneCam(name){const x=tpl.get(name);if(!x)return null;const n=x.cloneNode(true);n.querySelectorAll('iframe.live-video').forEach(f=>{f.removeAttribute('src');const b=f.closest('.media-box');if(b)b.classList.remove('loaded');});n.querySelectorAll('img.live-img').forEach(i=>{i.removeAttribute('src');const b=i.closest('.media-box');if(b)b.classList.remove('loaded');});return n;}
function rebuild(id,names){const el=section(id);if(!el)return;const grid=el.querySelector('.cam-grid');if(!grid)return;const frag=document.createDocumentFragment();(names||[]).forEach(name=>{const c=cloneCam(name);if(c)frag.appendChild(c);});if(frag.childNodes.length){grid.innerHTML='';grid.appendChild(frag);}const count=el.querySelector('.count');if(count)count.textContent=grid.querySelectorAll('.cam-card').length+' 個 Camera';if(el.open&&typeof loadSection==='function'){try{loadSection(el);}catch(e){}}}
function places(id,items){const el=section(id);if(!el)return;let box=el.querySelector('.places-box');const grid=el.querySelector('.cam-grid');if(!box&&grid){box=document.createElement('div');box.className='places-box';box.innerHTML='<div class="places-title">📍 今日景點導航</div><div class="places-row"></div>';grid.insertAdjacentElement('beforebegin',box);}if(!box)return;const row=box.querySelector('.places-row');if(!row)return;row.innerHTML=(items||[]).map(x=>'<a class="map-link" href="'+mapUrl(x[1])+'" target="_blank" rel="noopener">📍 '+esc(x[0])+'</a>').join('');}
function decision(id,cfg){const el=section(id);if(!el)return;let box=el.querySelector('.decision-panel');const grid=el.querySelector('.cam-grid');if(!cfg){if(box)box.remove();return;}if(!box&&grid){box=document.createElement('div');box.className='decision-panel';grid.insertAdjacentElement('beforebegin',box);}if(!box)return;box.innerHTML='<div class="decision-title">🌨️ '+esc(cfg.title)+'</div>'+(cfg.steps||[]).map(s=>'<div class="decision-step">'+esc(s)+'</div>').join('')+'<div class="decision-links">'+(cfg.links||[]).map(x=>'<a class="button" href="'+x[1]+'" target="_blank" rel="noopener">'+esc(x[0])+'</a>').join('')+'</div>';}
function patch(id,cfg){if(!cfg)return;const el=section(id);if(!el)return;const t=el.querySelector('.summary-title');if(t)t.textContent=cfg.title||'';const d=el.querySelector('.summary-desc');if(d)d.textContent=cfg.desc||'';const r=el.querySelector('.route-text');if(r)r.textContent=cfg.route||'';const nav=document.querySelector('.quick-nav a[data-day="'+id+'"]');if(nav)nav.textContent=cfg.nav||id.toUpperCase();places(id,cfg.places||[]);decision(id,cfg.decision||null);rebuild(id,cfg.cams||[]);}
function patchD3(){const el=section('d3');if(!el)return;el.querySelectorAll('.map-link').forEach(a=>{if(/JA/.test(a.textContent||'')){a.textContent='📍 JA中野市 Oranche';a.href=mapUrl('JA中野市 農産物産館 オランチェ');}});}
function fixHakuba47(){const el=section('d5');if(!el)return;const card=[...el.querySelectorAll('.cam-card')].find(c=>{const h=c.querySelector('h3');return h&&/白馬47/.test(h.textContent||'');});if(!card)return;const media=card.querySelector('.media-box');if(media){media.classList.remove('loaded');media.innerHTML='<div class="media-status" style="display:flex">白馬村官方 Hakuba47 Live Camera<br>舊 YouTube ID 已停止使用；請用下方官方 Live。</div>';}
 const badge=card.querySelector('.badge-video');if(badge)badge.textContent='官方 Live';
 let actions=card.querySelector('.actions');if(!actions){actions=document.createElement('div');actions.className='actions';card.appendChild(actions);}actions.querySelectorAll('[data-hakuba47-live]').forEach(x=>x.remove());const a=document.createElement('a');a.className='button';a.dataset.hakuba47Live='1';a.href=HAKUBA47_LIVE;a.target='_blank';a.rel='noopener';a.textContent='🔴 開啟 Hakuba47 官方 Live';actions.prepend(a);card.dataset.hakuba47Source='hakuba-village-official';}
function jsonCameraNames(id,fallback){const live=window.MultiTripData&&window.MultiTripData.all('liveCams');if(!live)return fallback||[];let spec=live.fixedDayBindings&&live.fixedDayBindings[id]||'';if(!spec){const it=window.MultiTripData.all('itinerary'),rules=it&&it.flexibleRules;if(rules&&rules.scenarios){const key=localStorage.getItem(rules.storageKey)||'unset';const sc=rules.scenarios[key]||rules.scenarios.unset||{};const kind=sc[id];if(kind&&live.dynamicBindings)spec=live.dynamicBindings[kind]||'';}}if(!spec)return fallback||[];const out=[];String(spec).split('+').forEach(g=>(live.groups&&live.groups[g]||[]).forEach(name=>{if(name&&!out.includes(name))out.push(name);}));return out.length?out:(fallback||[]);}
function configFor(id,core){const c=core.liveConfig(id);return c?Object.assign({},c,{cams:jsonCameraNames(id,c.cams||[])}):c;}
function chooser(core){let box=document.getElementById('livePlanChooserV92');if(box){refreshChooser(core,box);return;}const notice=$('.notice');if(!notice)return;if(!document.getElementById('livePlanChooserCoreStyle')){const s=document.createElement('style');s.id='livePlanChooserCoreStyle';s.textContent='#livePlanChooserV92 .tripv2-choice{display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;border:1px solid #b8d3e6;border-radius:8px;background:#eaf4fb;color:#1f4e79;font-weight:800;cursor:pointer;text-decoration:none;margin:3px 4px 3px 0}#livePlanChooserV92 .tripv2-choice:hover{background:#dcecf7}#livePlanChooserV92 .tripv2-choice.v90-active{background:#1f4e79!important;color:#fff!important;box-shadow:0 0 0 2px #a9c8dd}#livePlanChooserV92 .tripv2-choice.secondary{background:#f3f5f7;color:#55636d;border-color:#d7dde1}';document.head.appendChild(s);}box=document.createElement('section');box.id='livePlanChooserV92';box.className='decision-panel';box.style.margin='0 0 14px';const route=window.MultiTrip?window.MultiTrip.withTrip('itinerary.html#d6'):'itinerary.html#d6';box.innerHTML='<div class="decision-title">🌨️ D6–D8 新穗高日子｜同行程同步</div><div class="decision-step" id="livePlanStatusV92"></div><div class="decision-links"><button class="tripv2-choice" data-sh="d6">🚡 D6 去新穗高</button><button class="tripv2-choice" data-sh="d7">🚡 D7 去新穗高</button><button class="tripv2-choice" data-sh="d8">🚡 D8 去新穗高</button><button class="tripv2-choice secondary" data-sh="">重設／規劃模式</button><a class="tripv2-choice secondary" href="'+route+'">🗓️ 睇 D6–D8 行程</a></div>';notice.insertAdjacentElement('afterend',box);box.querySelectorAll('button[data-sh]').forEach(b=>b.addEventListener('click',()=>{core.setSelectedShinhotakaDay(b.dataset.sh||'');location.reload();}));refreshChooser(core,box);}
function refreshChooser(core,box){const cur=core.getSelectedShinhotakaDay();const st=box.querySelector('#livePlanStatusV92');if(st)st.innerHTML='<strong>目前：</strong>'+esc(core.selectorStatus(cur));box.querySelectorAll('button[data-sh]').forEach(b=>b.classList.toggle('v90-active',!!cur&&b.dataset.sh===cur));}
function loadWeather(){if(document.getElementById('weatherSuitabilityScriptV1'))return;const s=document.createElement('script');s.id='weatherSuitabilityScriptV1';s.src='assets/weather-suitability-v1.js?v=6';s.async=false;document.body.appendChild(s);}
function loadDecision(){if(document.getElementById('d6d8WeatherDecisionScriptV1'))return;const s=document.createElement('script');s.id='d6d8WeatherDecisionScriptV1';s.src='assets/d6-d8-weather-decision-v1.js?v=1';s.async=false;document.body.appendChild(s);}
function loadNav(){if(document.getElementById('navEnhancementsV1Script'))return;const s=document.createElement('script');s.id='navEnhancementsV1Script';s.src='assets/nav-enhancements-v1.js?v=3';s.async=false;document.body.appendChild(s);}
function loadI18n(){if(document.getElementById('i18nV1Script'))return;const s=document.createElement('script');s.id='i18nV1Script';s.src='assets/i18n-v1.js?v=3';s.async=false;document.body.appendChild(s);}
function run(core){if(!section('d2'))return false;capture();patch('d2',configFor('d2',core));patchD3();['d6','d7','d8'].forEach(id=>patch(id,configFor(id,core)));fixHakuba47();[250,900,1800].forEach(t=>setTimeout(fixHakuba47,t));if(!window.MultiTrip||window.MultiTrip.feature('shinhotakaPlanner'))chooser(core);else{const old=document.getElementById('livePlanChooserV92');if(old)old.remove();}document.documentElement.dataset.liveSync='v10.12-multitrip-json';document.documentElement.dataset.liveCameraGroups='live-cams.json';loadWeather();if(!window.MultiTrip||window.MultiTrip.feature('shinhotakaPlanner'))loadDecision();loadNav();loadI18n();if(window.MultiTrip)window.MultiTrip.refresh();loadRenderer();return true;}
function boot(core){let n=0;const go=()=>{n++;if(run(core)||n>=12)return;setTimeout(go,n<4?100:300);};go();}
ensureMultiTrip().then(async mt=>{if(mt&&mt.ready)await mt.ready;await ensureData();return mt||window.MultiTrip||null;}).then(mt=>{if(mt&&mt.id!==DEFAULT_TRIP){if(mt.refresh)mt.refresh();loadRenderer();return null;}return ensureCore().then(core=>{if(!core)throw new Error('Trip core unavailable');if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot(core),{once:true});else boot(core);return core;});}).catch(err=>console.error('Live core load failed',err));
})();
