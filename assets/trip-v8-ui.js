(function(){
'use strict';

if(window.__japan2027V8UI) return;
window.__japan2027V8UI=true;

const v8=window.Japan2027V8;
const data=window.Japan2027EnhancementData;
if(!v8 || !data) return;

function norm(t){
  return (t||'').replace(/📍|ⓘ/g,'').replace(/\s+/g,' ').trim().toLowerCase();
}

function attractionById(id){
  return (data.attractions||[]).find(function(x){return x.id===id;}) || null;
}

function attractionFromText(text){
  const n=norm(text);
  let best=null,bestLen=0;
  (data.attractions||[]).forEach(function(a){
    (a.aliases||[]).forEach(function(alias){
      const x=norm(alias);
      if(x && n.includes(x) && x.length>bestLen){best=a;bestLen=x.length;}
    });
    const title=norm(a.title||'');
    if(title && (n.includes(title)||title.includes(n)) && Math.min(title.length,n.length)>bestLen){
      best=a;bestLen=Math.min(title.length,n.length);
    }
  });
  return best;
}

function getVisitForElement(el){
  const btn=el.querySelector('[data-deep-info-id]');
  let info=null;
  if(btn){
    info=attractionById(btn.dataset.deepInfoId);
  }else{
    const type=(el.querySelector('.event-type')?.textContent||'');
    if(/(🚗|CHECK|HARD CUT|🍳|🍜|✈️|🚆|名鐵|入境|轉車|還車|入油|休息|Gondola|步行|接駁|Check-out|🏨)/i.test(type)) return null;
    info=attractionFromText(el.textContent);
  }
  if(!info) return null;
  const visit=v8.visits[info.id];
  return visit ? {info:info,visit:visit} : null;
}

function photoHtml(v){
  if(!v.photo || !v.photo.show) return '';
  return '<div class="visit-photo-warning '+(v.photo.level||'caution')+'">'+v.photo.text+'</div>';
}

function compactHtml(v){
  return '<div class="visit-meta-line">'+
    '<span>🕒 <strong>開門</strong> '+v.open+'</span>'+
    '<span>⏳ <strong>最後入場</strong> '+v.last+'</span>'+
    '<span>🚪 <strong>關門</strong> '+v.close+'</span>'+
    '<span>🎟️ <strong>收費</strong> '+v.fee+'</span>'+
    '</div>'+
    (v.note?'<div class="visit-meta-note">'+v.note+'</div>':'')+
    photoHtml(v);
}

function decorateTimeline(root){
  (root||document).querySelectorAll('.timeline-card').forEach(function(card){
    if(card.dataset.v8Visit==='true') return;
    const match=getVisitForElement(card);
    if(!match) return;
    const box=document.createElement('div');
    box.className='visit-meta-card';
    box.innerHTML=compactHtml(match.visit);
    const price=card.querySelector('.price');
    if(price) price.insertAdjacentElement('afterend',box);
    else card.appendChild(box);
    card.dataset.v8Visit='true';
  });
}

function decorateBackups(root){
  (root||document).querySelectorAll('.backup-attraction-card').forEach(function(card){
    if(card.dataset.v8Visit==='true') return;
    const match=getVisitForElement(card);
    if(!match) return;
    const box=document.createElement('div');
    box.className='visit-meta-backup';
    box.innerHTML=compactHtml(match.visit);
    const jp=card.querySelector('.backup-jp');
    if(jp) jp.insertAdjacentElement('afterend',box);
    else card.prepend(box);
    card.dataset.v8Visit='true';
  });
}

function findModalInfo(){
  const modal=document.getElementById('tripDeepInfoModal');
  if(!modal || !modal.classList.contains('show')) return null;
  const title=modal.querySelector('.enhance-modal-title');
  if(!title) return null;
  const n=norm(title.textContent);
  let found=(data.attractions||[]).find(function(a){return norm(a.title)===n;});
  if(!found) found=attractionFromText(title.textContent);
  if(!found || !v8.visits[found.id]) return null;
  return {modal:modal,info:found,visit:v8.visits[found.id]};
}

function enrichModal(){
  const x=findModalInfo();
  if(!x) return;
  const body=x.modal.querySelector('.enhance-modal-body');
  if(!body) return;
  const existing=body.querySelector('.deep-visit-info');
  if(existing && existing.dataset.id===x.info.id) return;
  if(existing) existing.remove();
  const v=x.visit;
  const photo=(v.photo&&v.photo.show)
    ? '<div class="deep-photo-rule '+(v.photo.level||'caution')+'">'+v.photo.text+
      (v.photo.source?'<br><a class="deep-photo-source" href="'+v.photo.source+'" target="_blank" rel="noopener">↗ 攝影／自拍神棍規則來源</a>':'')+'</div>'
    : '';
  const section=document.createElement('div');
  section.className='deep-visit-info';
  section.dataset.id=x.info.id;
  section.innerHTML=
    '<h3>🕒 開放時間／最後入場／收費</h3>'+
    '<div class="deep-visit-grid">'+
      '<div class="deep-visit-item"><strong>開門／開始</strong>'+v.open+'</div>'+
      '<div class="deep-visit-item"><strong>最後入場／最後受付</strong>'+v.last+'</div>'+
      '<div class="deep-visit-item"><strong>關門／結束</strong>'+v.close+'</div>'+
      '<div class="deep-visit-item deep-visit-fee"><strong>入場收費</strong>'+v.fee+'</div>'+
    '</div>'+
    (v.note?'<div class="deep-visit-warning">⚠️ '+v.note+'</div>':'')+
    photo+
    (v.source?'<a class="deep-visit-source" href="'+v.source+'" target="_blank" rel="noopener">↗ 營業時間／收費官方資料</a>':'')+
    '<span class="deep-visit-checked">資料查核：'+v8.checked+'。2027年1月尚未正式公布嘅季節時間／票價已明確標示，出發前會再核對。</span>';
  const first=body.firstElementChild;
  body.insertBefore(section,first||null);
}

function decorateAll(root){
  decorateTimeline(root||document);
  decorateBackups(root||document);
  enrichModal();
}

function start(){
  decorateAll(document);
  /* Legacy itinerary builders finish a few DOM writes shortly after startup.
     This renderer is idempotent, so bounded startup passes cover those writes
     without leaving an attributes/subtree observer alive for the whole trip. */
  [120,350,800,1600,2600].forEach(function(delay){
    setTimeout(function(){decorateAll(document);},delay);
  });
  document.addEventListener('click',function(){setTimeout(enrichModal,0);},false);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
else start();

})();
