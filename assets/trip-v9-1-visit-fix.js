(function(){
'use strict';
if(window.__japan2027V91VisitFix)return;
window.__japan2027V91VisitFix=true;
const CORE=window.Japan2027AttractionCore||null;
const V8=window.Japan2027V8||null;
if(!CORE||!V8)return;
function decorate(){
 ['d6','d7','d8'].forEach(id=>{
  const day=document.getElementById(id);if(!day)return;
  day.querySelectorAll('.timeline-card').forEach(card=>{
   const h=card.querySelector('h3');if(!h)return;
   const a=CORE.findBest(h.textContent,{includeTitle:true});if(!a)return;
   CORE.ensureInfoButton(h,a,{title:'詳盡介紹：歷史、重要性、現場睇乜'});
   const v=V8.visits&&V8.visits[a.id];if(!v||card.querySelector('.visit-meta-card'))return;
   const box=document.createElement('div');box.className='visit-meta-card';
   box.innerHTML='<div class="visit-meta-line"><span>🕒 <strong>開門</strong> '+v.open+'</span><span>⏳ <strong>最後入場</strong> '+v.last+'</span><span>🚪 <strong>關門</strong> '+v.close+'</span><span>🎟️ <strong>收費</strong> '+v.fee+'</span></div>'+(v.note?'<div class="visit-meta-note">'+v.note+'</div>':'')+((v.photo&&v.photo.show)?'<div class="visit-photo-warning '+(v.photo.level||'caution')+'">'+v.photo.text+'</div>':'');
   card.appendChild(box);
  });
 });
 if(typeof window.addMapPins==='function')try{window.addMapPins();}catch(e){}
}
function onFinalPatch(e){if(e.detail&&e.detail.final===true)decorate();}
document.addEventListener('japan2027:finalpatch',onFinalPatch);
document.addEventListener('multitrip:itineraryrendered',decorate);
})();
