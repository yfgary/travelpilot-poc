(function(){
'use strict';
if(window.__japan2027NavEnhancementsV4)return;
window.__japan2027NavEnhancementsV4=true;

function ensureContext(){
 if(window.MultiTrip)return Promise.resolve(window.MultiTrip);
 return new Promise(function(resolve){
  let s=document.getElementById('multiTripContextV1Script');
  if(s){s.addEventListener('load',function(){resolve(window.MultiTrip);},{once:true});setTimeout(function(){resolve(window.MultiTrip||null);},1200);return;}
  s=document.createElement('script');s.id='multiTripContextV1Script';s.src='assets/multi-trip-context-v1.js?v=8';s.async=false;
  s.onload=function(){resolve(window.MultiTrip);};s.onerror=function(){resolve(null);};(document.head||document.documentElement).appendChild(s);
 });
}
function loadOnce(id,src){
 return new Promise(function(resolve){
  if(document.getElementById(id)){resolve();return;}
  const s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=resolve;s.onerror=resolve;(document.head||document.documentElement).appendChild(s);
 });
}
function ensureAttractionsRenderer(){
 if(!/(?:^|\/)attractions\.html$/.test(location.pathname))return Promise.resolve();
 const loadData=window.MultiTripData?Promise.resolve():loadOnce('multiTripDataV1Script','assets/multi-trip-data-v1.js?v=2');
 return loadData.then(function(){return loadOnce('multiTripAttractionsRendererV1Script','assets/multi-trip-attractions-renderer-v1.js?v=1');});
}
function tripHref(file,extra){
 const u=new URL(file,location.href),q=new URLSearchParams(extra||'');
 if(window.MultiTrip&&window.MultiTrip.id)q.set('trip',window.MultiTrip.id);
 u.search=q.toString();return u.pathname.split('/').pop()+(u.search||'');
}
function ensure(){
 document.querySelectorAll('.page-switch').forEach(function(sw){
  const legacyLive=Array.from(sw.querySelectorAll('a')).find(a=>/Live Cam/i.test(a.textContent||''));
  if(legacyLive)legacyLive.href=tripHref('live.html');
  let home=sw.querySelector('a[data-multi-trip-home]');
  if(!home){home=document.createElement('a');home.href='index.html';home.dataset.multiTripHome='1';home.textContent='🏠 旅程';sw.insertBefore(home,sw.firstChild);}
  let travel=sw.querySelector('a[data-travel-mode-link]');
  if(!travel){
   travel=document.createElement('a');travel.dataset.travelModeLink='1';travel.textContent='🧭 今日模式';
   const catalog=sw.querySelector('a[href^="attractions.html"]');if(catalog)sw.insertBefore(travel,catalog);else sw.appendChild(travel);
  }
  travel.href=tripHref('itinerary.html','travel=1');
  let drive=sw.querySelector('a[data-driving-mode-link]');
  if(!drive){
   drive=document.createElement('a');drive.dataset.drivingModeLink='1';drive.textContent='🚗 揸車模式';
   const catalog=sw.querySelector('a[href^="attractions.html"]');if(catalog)sw.insertBefore(drive,catalog);else sw.appendChild(drive);
  }
  drive.href=tripHref('itinerary.html','drive=1');
  const q=new URLSearchParams(location.search),onItinerary=/(?:^|\/)itinerary\.html$/.test(location.pathname),travelActive=onItinerary&&q.get('travel')==='1',driveActive=onItinerary&&q.get('drive')==='1';
  travel.classList.toggle('active',travelActive);drive.classList.toggle('active',driveActive);
  if(travelActive||driveActive){const normal=Array.from(sw.querySelectorAll('a')).find(a=>/詳細行程|Detailed Itinerary/.test(a.textContent||''));if(normal)normal.classList.remove('active');}
  sw.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href')||'';if(/^(?:itinerary|trip-info|attractions|live)\.html/.test(h)&&window.MultiTrip)a.href=window.MultiTrip.withTrip(h);});
 });
}

ensureContext().then(function(){ensure();ensureAttractionsRenderer();if(window.MultiTrip&&window.MultiTrip.ready)window.MultiTrip.ready.then(function(){ensure();ensureAttractionsRenderer();});});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
setTimeout(ensure,500);setTimeout(ensure,1800);
})();
