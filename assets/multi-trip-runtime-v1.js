(function(){
'use strict';
if(window.MultiTripRuntime&&window.MultiTripRuntime.__v1)return;

const APP_VERSION='10.18.0';
const DEFAULT_TRIP='shirakawago-shinhotaka-2027';
const params=new URLSearchParams(location.search);
const selectedTrip=(params.get('trip')||DEFAULT_TRIP).trim();
const legacyTrip=selectedTrip===DEFAULT_TRIP;

function pageType(){
  const p=location.pathname.split('/').pop()||'';
  if(p==='itinerary.html')return'itinerary';
  if(p==='trip-info.html')return'tripInfo';
  if(p==='attractions.html')return'attractions';
  if(p==='live.html')return'liveCam';
  return'';
}
const page=pageType();

function addCss(href){
  if(document.querySelector('link[href="'+href+'"]'))return;
  const l=document.createElement('link');
  l.rel='stylesheet';
  l.href=href;
  l.dataset.multiTripRuntimeCss='1';
  document.head.appendChild(l);
}

if(page==='itinerary'||page==='tripInfo'){
  addCss('assets/trip-enhancements-v2.css?v=913');
  addCss('assets/trip-enhancements-v3.css?v=913');
  addCss('assets/site-shell-v7.css?v=913');
  addCss('assets/trip-v8.css?v=913');
  addCss('assets/trip-v8-1.css?v=913');
}

const commonScripts=[
  'assets/multi-trip-context-v1.js?v='+APP_VERSION,
  'assets/multi-trip-data-v1.js?v=2',
  'assets/multi-trip-nav-v1.js?v=2'
];

const legacyItineraryScripts=[
  'assets/trip-core-v1.js?v=8',
  'assets/site-shell-v7.js?v=10.12.0',
  'assets/weather-suitability-v1.js?v=6',
  'assets/d6-d8-weather-decision-v1.js?v=1',
  'assets/nav-enhancements-v1.js?v=3',
  'assets/trip-enhancement-data.js?v=913',
  'assets/japan2027-attraction-core-v1.js?v=2',
  'assets/trip-user-overrides.js?v=913',
  'assets/trip-deep-info-d1-d4.js?v=913',
  'assets/trip-deep-info-d5-d9.js?v=913',
  'assets/trip-deep-info-backups.js?v=913',
  'assets/trip-v8-data.js?v=913',
  'assets/trip-v8-1-overrides.js?v=913',
  'assets/trip-enhancements-v3.js?v=913',
  'assets/trip-v8-ui.js?v=913',
  'assets/trip-v8-7-user-plan.js?v=913',
  'assets/trip-v8-8-d2-plan.js?v=913',
  'assets/trip-v8-9-user-fixes.js?v=913',
  'assets/trip-v9-final-fixes.js?v=914',
  'assets/trip-v9-hotfix.js?v=4',
  'assets/trip-v9-1-visit-fix.js?v=5',
  'assets/info-icon-repair-v1.js?v=7',
  'assets/multi-trip-itinerary-renderer-v1.js?v=4',
  'assets/itinerary-hotel-detail-v1.js?v=1',
  'assets/multi-trip-weather-v1.js?v=2',
  'assets/weather-profile-standard-v1.js?v=1',
  'assets/multi-trip-mode-core-v1.js?v=1',
  'assets/catalog-link.js?v=2',
  'assets/travel-mode-v1.js?v=2',
  'assets/travel-mode-nav-fix-v1.js?v=2',
  'assets/driving-mode-v1.js?v=1',
  'assets/multi-trip-mode-weather-bridge-v1.js?v=1'
];

const genericItineraryScripts=[
  'assets/multi-trip-itinerary-renderer-v1.js?v=4',
  'assets/itinerary-hotel-detail-v1.js?v=1',
  'assets/multi-trip-weather-v1.js?v=2',
  'assets/weather-profile-standard-v1.js?v=1',
  'assets/multi-trip-mode-core-v1.js?v=1',
  'assets/multi-trip-today-mode-v1.js?v=1',
  'assets/multi-trip-driving-mode-v1.js?v=1',
  'assets/multi-trip-generic-qa-fix-v1.js?v=1'
];

const legacyTripInfoScripts=[
  'assets/trip-core-v1.js?v=8',
  'assets/site-shell-v7.js?v=10.12.0',
  'assets/weather-suitability-v1.js?v=6',
  'assets/d6-d8-weather-decision-v1.js?v=1',
  'assets/nav-enhancements-v1.js?v=3',
  'assets/trip-enhancement-data.js?v=913',
  'assets/japan2027-attraction-core-v1.js?v=2',
  'assets/trip-user-overrides.js?v=913',
  'assets/trip-deep-info-d1-d4.js?v=913',
  'assets/trip-deep-info-d5-d9.js?v=913',
  'assets/trip-deep-info-backups.js?v=913',
  'assets/trip-v8-data.js?v=913',
  'assets/trip-v8-1-overrides.js?v=913',
  'assets/trip-v8-7-user-plan.js?v=913',
  'assets/trip-v9-final-fixes.js?v=914',
  'assets/trip-v9-hotfix.js?v=4',
  'assets/catalog-link.js?v=2',
  'assets/multi-trip-trip-info-renderer-v1.js?v=3',
  'assets/multi-trip-departure-checklist-v1.js?v=4',
  'assets/multi-trip-checklist-sync-v1.js?v=3',
  'assets/multi-trip-weather-v1.js?v=2',
  'assets/weather-profile-standard-v1.js?v=1'
];

const genericTripInfoScripts=[
  'assets/multi-trip-trip-info-renderer-v1.js?v=3',
  'assets/multi-trip-departure-checklist-v1.js?v=4',
  'assets/multi-trip-checklist-sync-v1.js?v=3',
  'assets/multi-trip-weather-v1.js?v=2',
  'assets/weather-profile-standard-v1.js?v=1'
];

const legacyAttractionsScripts=[
  'assets/trip-core-v1.js?v=8',
  'assets/nav-enhancements-v1.js?v=3',
  'assets/trip-enhancement-data.js?v=913',
  'assets/trip-deep-info-d1-d4.js?v=913',
  'assets/trip-deep-info-d5-d9.js?v=913',
  'assets/trip-deep-info-backups.js?v=913',
  'assets/trip-v8-data.js?v=913',
  'assets/trip-v8-1-overrides.js?v=913',
  'assets/attractions-catalog.js?v=3',
  'assets/attractions-layout-v2.js?v=2',
  'assets/attractions-group-fix.js?v=2',
  'assets/multi-trip-attractions-renderer-v1.js?v=5'
];

const genericAttractionsScripts=[
  'assets/multi-trip-attractions-renderer-v1.js?v=5'
];

const legacyLiveScripts=[
  'assets/site-shell-v7.js?v=7'
];

const genericLiveScripts=[
  'assets/multi-trip-live-entry-v1.js?v='+APP_VERSION
];

function pageScripts(){
  if(page==='itinerary')return commonScripts.concat(legacyTrip?legacyItineraryScripts:genericItineraryScripts);
  if(page==='tripInfo')return commonScripts.concat(legacyTrip?legacyTripInfoScripts:genericTripInfoScripts);
  if(page==='attractions')return commonScripts.concat(legacyTrip?legacyAttractionsScripts:genericAttractionsScripts);
  if(page==='liveCam')return legacyTrip?legacyLiveScripts:genericLiveScripts;
  return[];
}

const scripts=pageScripts();
window.MultiTripRuntime={
  __v1:true,
  version:'v'+APP_VERSION,
  page,
  profile:legacyTrip?'legacy-compat':'standard',
  selectedTrip,
  dependencies:scripts.slice()
};
document.documentElement.dataset.multiTripRuntime='v1';
document.documentElement.dataset.multiTripRuntimePage=page||'unknown';
document.documentElement.dataset.multiTripRuntimeProfile=window.MultiTripRuntime.profile;

function logical(src){return src.split('?',1)[0];}
function alreadyLoaded(src){
  const target=logical(src);
  return [...document.scripts].some(s=>s.src&&logical(new URL(s.src,location.href).pathname.split('/').slice(-2).join('/'))===target)
    || [...document.scripts].some(s=>s.getAttribute('src')&&logical(s.getAttribute('src'))===target);
}

function loadScript(src){
  if(alreadyLoaded(src))return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.dataset.multiTripRuntimeDependency='1';
    s.onload=resolve;
    s.onerror=()=>reject(new Error('Failed to load '+src));
    document.head.appendChild(s);
  });
}

if(document.readyState==='loading'){
  scripts.forEach(src=>{
    if(!alreadyLoaded(src))document.write('<script data-multi-trip-runtime-dependency="1" src="'+src+'"><'+'/script>');
  });
  return;
}

scripts.reduce((p,src)=>p.then(()=>loadScript(src)),Promise.resolve())
  .catch(err=>console.error('Multi Trip runtime failed to load',err));
})();
