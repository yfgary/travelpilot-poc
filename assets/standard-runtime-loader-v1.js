(() => {
'use strict';
if(window.__travelPilotStandardRuntimeLoaderV1)return;
window.__travelPilotStandardRuntimeLoaderV1=true;

const params=new URLSearchParams(location.search);
const page=(location.pathname.split('/').pop()||'').replace(/\.html$/,'')||'itinerary';
const pageKey=page==='trip-info'?'tripInfo':page==='live'?'liveCam':page;

const json=async url=>{
  const r=await fetch(url+(url.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store'});
  if(!r.ok)throw new Error(r.status+' '+url);
  return r.json();
};
const addCss=href=>{
  if(document.querySelector('link[href="'+href+'"]'))return;
  const l=document.createElement('link');
  l.rel='stylesheet';l.href=href;document.head.appendChild(l);
};
const loadScript=src=>new Promise((resolve,reject)=>{
  if([...document.scripts].some(s=>s.getAttribute('src')===src)){resolve();return;}
  const s=document.createElement('script');
  s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('script '+src));
  document.head.appendChild(s);
});
const mark=(tripId)=>{
  document.documentElement.dataset.standardRuntimeLoader='v1';
  if(tripId)document.documentElement.dataset.standardRuntimeTrip=tripId;
};

function embeddedPlan(){
  const el=document.getElementById('travelPilotRuntimePlan');
  if(!el)return null;
  try{return JSON.parse(el.textContent||'');}catch(e){console.error('Invalid embedded runtime plan',e);return null;}
}
function parserBoot(plan){
  const spec=plan&&plan.pages&&plan.pages[pageKey];
  if(!spec)return false;
  (spec.styles||[]).forEach(addCss);
  mark(plan.tripId||'');
  if(document.readyState==='loading'){
    (spec.scripts||[]).forEach(src=>document.write('<script src="'+src+'"><'+'/script>'));
    document.write('<script>document.dispatchEvent(new CustomEvent("travelpilot:runtime-ready",{detail:{tripId:"'+String(plan.tripId||'').replace(/["\\]/g,'')+'",page:"'+pageKey+'"}}));<'+'/script>');
    return true;
  }
  return false;
}

const embedded=embeddedPlan();
if(embedded&&parserBoot(embedded))return;

(async()=>{
  const registry=await json('trips/registry.json');
  const requested=(params.get('trip')||registry.defaultTrip||'').trim();
  const entry=(registry.trips||[]).find(t=>t.id===requested)
    ||(registry.trips||[]).find(t=>t.id===registry.defaultTrip)
    ||(registry.trips||[])[0];
  if(!entry)throw new Error('No trip');
  const cfgPath=entry.config||('trips/'+entry.id+'/trip.json');
  const cfg=await json(cfgPath);
  const planName=cfg.runtime&&cfg.runtime.plan;
  if(!planName)throw new Error('No runtime plan for '+entry.id);
  const base='trips/'+encodeURIComponent(entry.id)+'/';
  const plan=await json(base+planName);
  const spec=plan.pages&&plan.pages[pageKey];
  if(!spec)throw new Error('No runtime plan page '+pageKey);
  (spec.styles||[]).forEach(addCss);
  for(const src of spec.scripts||[])await loadScript(src);
  mark(entry.id);
  document.dispatchEvent(new CustomEvent('travelpilot:runtime-ready',{detail:{tripId:entry.id,page:pageKey}}));
})().catch(err=>{
  console.error('TravelPilot Standard runtime loader failed',err);
  document.documentElement.dataset.standardRuntimeError=String(err&&err.message||err);
});
})();