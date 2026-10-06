(function(){
'use strict';
if(window.__japan2027TravelModeNavFixV2)return;
window.__japan2027TravelModeNavFixV2=true;

const PREVIEW_KEY='japan2027_travel_mode_preview_day';

function currentTravelDay(){
  const active=document.querySelector('#travelModeOverlay .tm-day.active[data-tm-day]');
  if(active&&/^d[1-9]$/.test(active.dataset.tmDay||''))return active.dataset.tmDay;
  const saved=localStorage.getItem(PREVIEW_KEY)||'';
  return /^d[1-9]$/.test(saved)?saved:'d1';
}

function syncCanonicalNav(){
  setTimeout(()=>{
    if(window.MultiTripNav&&typeof window.MultiTripNav.render==='function')window.MultiTripNav.render();
  },0);
}

function syncWeatherRegionToTravelDay(){
  const core=window.Japan2027Core;
  if(!core||typeof core.weatherRegionForDay!=='function')return null;
  const dayId=currentTravelDay();
  const regionId=core.weatherRegionForDay(dayId);
  if(!regionId)return null;
  if(typeof core.setWeatherRegion==='function')core.setWeatherRegion(regionId);
  else localStorage.setItem('japan2027_weather_region',regionId);

  const btn=document.querySelector('#weather3dPanel .weather3d-region[data-region="'+regionId+'"]');
  if(btn)btn.click();
  return {dayId,regionId};
}

function leaveTravelMode(hash,weatherSync){
  const overlay=document.getElementById('travelModeOverlay');
  if(overlay)overlay.hidden=true;
  document.body.style.overflow='';

  const u=new URL(location.href);
  u.searchParams.delete('travel');
  u.hash=hash||'';
  history.replaceState({},'',u.pathname+(u.search||'')+(u.hash||''));
  syncCanonicalNav();

  const id=(hash||'').replace(/^#/,'');
  if(/^d[1-9]$/.test(id)){
    const day=document.getElementById(id);
    if(day&&day.tagName==='DETAILS')day.open=true;
  }

  requestAnimationFrame(()=>setTimeout(()=>{
    if(weatherSync&&weatherSync.regionId){
      const btn=document.querySelector('#weather3dPanel .weather3d-region[data-region="'+weatherSync.regionId+'"]');
      if(btn&&!btn.classList.contains('active'))btn.click();
    }
    const target=id&&document.getElementById(id);
    if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
  },60));
}

document.addEventListener('click',function(e){
  const close=e.target.closest&&e.target.closest('#travelModeOverlay #tmClose');
  if(close){syncCanonicalNav();return;}

  const a=e.target.closest&&e.target.closest('#travelModeOverlay a[href]');
  if(!a)return;
  let url;
  try{url=new URL(a.getAttribute('href'),location.href);}catch(err){return;}
  if(url.origin!==location.origin)return;
  if(!/(?:^|\/)itinerary\.html$/.test(url.pathname))return;
  if(!url.hash)return;

  e.preventDefault();
  e.stopPropagation();

  const weatherSync=url.hash==='#weather3dPanel'?syncWeatherRegionToTravelDay():null;
  leaveTravelMode(url.hash,weatherSync);
},true);

window.Japan2027TravelModeNavFix={leaveTravelMode,syncWeatherRegionToTravelDay,currentTravelDay,syncCanonicalNav};
})();
