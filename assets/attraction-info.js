(function(){
'use strict';
if(window.__japan2027EnhancementLoaderV38)return;
window.__japan2027EnhancementLoaderV38=true;

function addCss(href){
  if(document.querySelector('link[href="'+href+'"]'))return;
  const l=document.createElement('link');
  l.rel='stylesheet';l.href=href;document.head.appendChild(l);
}

/* Shared multi-trip UI is owned by multi-trip-context-v1.js. */
addCss('assets/trip-enhancements-v2.css?v=913');
addCss('assets/trip-enhancements-v3.css?v=913');
addCss('assets/site-shell-v7.css?v=913');
addCss('assets/trip-v8.css?v=913');
addCss('assets/trip-v8-1.css?v=913');

const DEFAULT_TRIP='shirakawago-shinhotaka-2027';
const params=new URLSearchParams(location.search);
const selectedTrip=(params.get('trip')||DEFAULT_TRIP).trim();
const isJapanLegacy=selectedTrip===DEFAULT_TRIP;
const isTripInfo=/(?:^|\/)trip-info\.html$/.test(location.pathname);

const commonHead=[
  'assets/multi-trip-context-v1.js?v=10.14.1',
  'assets/multi-trip-data-v1.js?v=2',
  'assets/multi-trip-nav-v1.js?v=2'
];

const itineraryScripts=commonHead.concat([
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
  'assets/trip-v9-1-routing.js?v=2',
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
]);

const tripInfoScripts=commonHead.concat([
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
]);

const genericItineraryScripts=commonHead.concat([
  'assets/multi-trip-itinerary-renderer-v1.js?v=4',
  'assets/itinerary-hotel-detail-v1.js?v=1',
  'assets/multi-trip-weather-v1.js?v=2',
  'assets/weather-profile-standard-v1.js?v=1',
  'assets/multi-trip-mode-core-v1.js?v=1',
  'assets/multi-trip-today-mode-v1.js?v=1',
  'assets/multi-trip-driving-mode-v1.js?v=1',
  'assets/multi-trip-generic-qa-fix-v1.js?v=1'
]);

const genericTripInfoScripts=commonHead.concat([
  'assets/multi-trip-trip-info-renderer-v1.js?v=3',
  'assets/multi-trip-departure-checklist-v1.js?v=4',
  'assets/multi-trip-checklist-sync-v1.js?v=3',
  'assets/multi-trip-weather-v1.js?v=2',
  'assets/weather-profile-standard-v1.js?v=1'
]);

const scripts=isJapanLegacy
  ?(isTripInfo?tripInfoScripts:itineraryScripts)
  :(isTripInfo?genericTripInfoScripts:genericItineraryScripts);

if(document.readyState==='loading'){
  scripts.forEach(src=>document.write('<script src="'+src+'"><'+'/script>'));
  return;
}

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
}

scripts.reduce((p,src)=>p.then(()=>loadScript(src)),Promise.resolve())
  .catch(err=>console.error('Trip enhancements failed to load',err));
})();
