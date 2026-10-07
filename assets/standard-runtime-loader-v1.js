(() => {
'use strict';
if(window.__travelPilotStandardRuntimeLoaderV1)return;
window.__travelPilotStandardRuntimeLoaderV1=true;

const params=new URLSearchParams(location.search);
const page=(location.pathname.split('/').pop()||'').replace(/\.html$/,'')||'itinerary';
const pageKey=page==='trip-info'?'tripInfo':page==='live'?'liveCam':page;

function loadJsonSync(url){
  const xhr=new XMLHttpRequest();
  xhr.open('GET',url+(url.includes('?')?'&':'?')+'t='+Date.now(),false);
  xhr.send(null);
  if(xhr.status<200||xhr.status>=300)throw new Error(xhr.status+' '+url);
  return JSON.parse(xhr.responseText);
}
function addCss(href){
  if(document.querySelector('link[href="'+href+'"]'))return;
  const l=document.createElement('link');
  l.rel='stylesheet';l.href=href;document.head.appendChild(l);
}
function loadScript(src){
  return new Promise((resolve,reject)=>{
    if([...document.scripts].some(s=>s.getAttribute('src')===src)){resolve();return;}
    const s=document.createElement('script');
    s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('script '+src));
    document.head.appendChild(s);
  });
}
function resolvePlan(){
  const registry=loadJsonSync('trips/registry.json');
  const requested=(params.get('trip')||registry.defaultTrip||'').trim();
  const entry=(registry.trips||[]).find(t=>t.id===requested)
    ||(registry.trips||[]).find(t=>t.id===registry.defaultTrip)
    ||(registry.trips||[])[0];
  if(!entry)throw new Error('No trip');
  const cfgPath=entry.config||('trips/'+entry.id+'/trip.json');
  const cfg=loadJsonSync(cfgPath);
  const planName=cfg.runtime&&cfg.runtime.plan;
  if(!planName)throw new Error('No runtime plan for '+entry.id);
  const plan=loadJsonSync('trips/'+encodeURIComponent(entry.id)+'/'+planName);
  const spec=plan.pages&&plan.pages[pageKey];
  if(!spec)throw new Error('No runtime plan page '+pageKey);
  return{entry,spec};
}
function ready(entry){
  document.documentElement.dataset.standardRuntimeLoader='v1';
  document.documentElement.dataset.standardRuntimeTrip=entry.id;
  document.dispatchEvent(new CustomEvent('travelpilot:runtime-ready',{detail:{tripId:entry.id,page:pageKey}}));
}

try{
  const {entry,spec}=resolvePlan();
  (spec.styles||[]).forEach(addCss);

  if(document.readyState==='loading'){
    (spec.scripts||[]).forEach(src=>document.write('<script src="'+src+'"><'+'/script>'));
    document.write('<script>document.documentElement.dataset.standardRuntimeLoader="v1";document.documentElement.dataset.standardRuntimeTrip='+JSON.stringify(entry.id)+';document.dispatchEvent(new CustomEvent("travelpilot:runtime-ready",{detail:{tripId:'+JSON.stringify(entry.id)+',page:'+JSON.stringify(pageKey)+'}}));<'+'/script>');
  }else{
    (async()=>{
      for(const src of spec.scripts||[])await loadScript(src);
      ready(entry);
    })().catch(err=>{
      console.error('TravelPilot Standard runtime loader failed',err);
      document.documentElement.dataset.standardRuntimeError=String(err&&err.message||err);
    });
  }
}catch(err){
  console.error('TravelPilot Standard runtime loader failed',err);
  document.documentElement.dataset.standardRuntimeError=String(err&&err.message||err);
}
})();