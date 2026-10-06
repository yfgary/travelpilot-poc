(function(){
'use strict';
if(window.__japan2027InfoIconRepairV1)return;
window.__japan2027InfoIconRepairV1=true;

const TRIP='shirakawago-shinhotaka-2027';
if(!/(?:^|\/)itinerary\.html$/.test(location.pathname))return;
const active=(new URLSearchParams(location.search).get('trip')||localStorage.getItem('multiTrip.activeTrip')||TRIP).trim();
if(active!==TRIP)return;

const CORE=window.Japan2027AttractionCore||null;
if(!CORE)return;
const REPAIR_NORM={iconSpace:true,stripVariationSelectors:true};

function eligible(card){
 const type=CORE.norm(card&&card.querySelector('.event-type')&&card.querySelector('.event-type').textContent,REPAIR_NORM);
 if(!type)return true;
 return !/(🚗|CHECK|HARD CUT|🍳|🍜|✈️|🚆|名鐵|入境|轉車|還車|入油|休息|溫泉\s*\/\s*休息|Gondola|步行|接駁|Check-out|CHECK-OUT|HOTEL|酒店|取車|租車)/i.test(type);
}
function bestMatch(h3){
 const card=h3.closest('.timeline-card');
 const hay=[
  h3.textContent,
  h3.getAttribute('data-map'),
  h3.getAttribute('data-map-label'),
  card&&card.getAttribute('data-map'),
  card&&card.textContent
 ].filter(Boolean).join(' | ');
 return CORE.findBest(hay,{includeTitle:true,normalizeKeys:true,normOptions:REPAIR_NORM});
}
function ensureButton(h3,info){
 const existed=!!h3.querySelector(CORE.BUTTON_SELECTOR);
 const button=CORE.ensureInfoButton(h3,info,{
  title:'詳盡介紹：歷史、重要性、現場睇乜',
  ariaLabel:'詳盡景點介紹：'+(info.title||info.id),
  setExistingIdIfMissing:true
 });
 return !existed&&!!button;
}
function repair(){
 let added=0,matched=0;
 document.querySelectorAll('details.day .timeline-card h3').forEach(h3=>{
  const card=h3.closest('.timeline-card');
  if(!card||!eligible(card))return;
  const info=bestMatch(h3);
  if(!info)return;
  matched++;
  if(ensureButton(h3,info))added++;
 });
 document.documentElement.dataset.infoIconMatches=String(matched);
 document.documentElement.dataset.infoIconAdded=String(added);
 return {matched,added};
}
function catchUp(){if(document.documentElement.dataset.itineraryRenderer)repair();}

document.addEventListener('multitrip:itineraryrendered',()=>{[0,120,500].forEach(t=>setTimeout(repair,t));});
document.addEventListener('japan2027:languagechange',()=>{[0,250,800].forEach(t=>setTimeout(repair,t));});

catchUp();

window.Japan2027InfoIconRepair={repair};
})();
