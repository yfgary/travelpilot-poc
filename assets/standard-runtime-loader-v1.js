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
  document.documentElement.dataset.standardRuntimeLoader='v1';
  document.documentElement.dataset.standardRuntimeTrip=entry.id;
  document.dispatchEvent(new CustomEvent('travelpilot:runtime-ready',{detail:{tripId:entry.id,page:pageKey}}));
})().catch(err=>{
  console.error('TravelPilot Standard runtime loader failed',err);
  document.documentElement.dataset.standardRuntimeError=String(err&&err.message||err);
});
})();