(function(){
'use strict';

if(window.__japan2027AttractionsLayoutV2)return;
window.__japan2027AttractionsLayoutV2=true;

const DATA=window.Japan2027EnhancementData;
const V8=window.Japan2027V8||null;
let modal=null;

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function arr(v){if(!v)return[];return Array.isArray(v)?v:[v];}
function paras(v){return arr(v).filter(Boolean).map(x=>'<p>'+x+'</p>').join('');}
function bullets(v){const a=arr(v).filter(Boolean);return a.length?'<ul>'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'';}
function byId(id){return DATA?.attractions?.find(x=>x.id===id)||null;}
function visitFor(id){return V8?.visits?.[id]||null;}

function compactVisit(v){
 if(!v)return'';
 const photo=(v.photo&&v.photo.show)?'<div class="visit-photo-warning '+(v.photo.level||'caution')+'">'+v.photo.text+'</div>':'';
 return '<div class="visit-meta-card"><div class="visit-meta-line">'+
  '<span>🕒 <strong>開門</strong> '+v.open+'</span>'+
  '<span>⏳ <strong>最後入場</strong> '+v.last+'</span>'+
  '<span>🚪 <strong>關門</strong> '+v.close+'</span>'+
  '<span>🎟️ <strong>收費</strong> '+v.fee+'</span>'+
  '</div>'+(v.note?'<div class="visit-meta-note">'+v.note+'</div>':'')+photo+'</div>';
}
function pricePill(v){
 if(!v?.fee||v.fee==='—'||/未有|不適用/.test(v.fee))return'';
 let s=String(v.fee).replace(/^現行[:：]\s*/,'');
 if(s.length>72)s=s.slice(0,69)+'…';
 return '<div class="price">🎟️ '+s+'</div>';
}
function deepVisit(id){
 const v=visitFor(id);if(!v)return'';
 const photo=(v.photo&&v.photo.show)?'<div class="deep-photo-rule '+(v.photo.level||'caution')+'">'+v.photo.text+(v.photo.source?'<br><a class="deep-photo-source" href="'+esc(v.photo.source)+'" target="_blank" rel="noopener">↗ 攝影／自拍神棍規則來源</a>':'')+'</div>':'';
 return '<div class="deep-visit-info" data-id="'+esc(id)+'"><h3>🕒 開放時間／最後入場／收費</h3><div class="deep-visit-grid">'+
  '<div class="deep-visit-item"><strong>開門／開始</strong>'+v.open+'</div>'+
  '<div class="deep-visit-item"><strong>最後入場／最後受付</strong>'+v.last+'</div>'+
  '<div class="deep-visit-item"><strong>關門／結束</strong>'+v.close+'</div>'+
  '<div class="deep-visit-item deep-visit-fee"><strong>入場收費</strong>'+v.fee+'</div></div>'+
  (v.note?'<div class="deep-visit-warning">⚠️ '+v.note+'</div>':'')+photo+
  (v.source?'<a class="deep-visit-source" href="'+esc(v.source)+'" target="_blank" rel="noopener">↗ 營業時間／收費官方資料</a>':'')+
  '<span class="deep-visit-checked">資料查核：'+(V8?.checked||'最新資料')+'。2027年1月尚未正式公布嘅季節時間／票價已明確標示，出發前會再核對。</span></div>';
}

function ensureModal(){
 if(modal)return;
 modal=document.createElement('div');
 modal.className='enhance-modal';
 modal.id='tripDeepInfoModalCatalog';
 modal.innerHTML='<div class="enhance-modal-card" role="dialog" aria-modal="true"><div class="enhance-modal-head"><h2 class="enhance-modal-title"></h2><button type="button" class="enhance-modal-close" aria-label="關閉">×</button></div><div class="enhance-modal-body"></div></div>';
 document.body.appendChild(modal);
 const close=()=>{modal.classList.remove('show');document.body.style.overflow='';};
 modal.querySelector('.enhance-modal-close').addEventListener('click',close);
 modal.addEventListener('click',e=>{if(e.target===modal)close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('show'))close();});
}
function openInfo(id){
 const a=byId(id);if(!a)return;
 ensureModal();
 modal.querySelector('.enhance-modal-title').textContent=a.title||'';
 const why=a.whyLong||a.why||'';
 const hist=a.history||a.background||'';
 const imp=a.importance||[];
 const look=a.visit||a.look||[];
 const understand=a.understand||'';
 modal.querySelector('.enhance-modal-body').innerHTML=
  deepVisit(id)+
  (a.jp?'<div class="deep-jp-name">🇯🇵 '+esc(a.jp)+'</div>':'')+
  '<div class="deep-summary"><h3>🧭 點解值得去</h3>'+paras(why)+'</div>'+
  '<div class="deep-section"><h3>📚 歷史／背景：點解會有呢個地方</h3>'+paras(hist)+'</div>'+
  (arr(imp).length?'<div class="deep-section"><h3>🏛️ 點解喺日本／當地重要</h3>'+bullets(imp)+'</div>':'')+
  '<div class="deep-section"><h3>👀 去到現場應該睇乜</h3>'+bullets(look)+'</div>'+
  (understand?'<div class="deep-understand"><strong>💡 睇完應該明白乜：</strong><br>'+understand+'</div>':'')+
  (a.fit?'<div class="deep-trip-fit"><strong>🗺️ 點解排喺你呢日行程：</strong><br>'+a.fit+'</div>':'')+
  (a.winter?'<div class="deep-winter"><strong>❄️ 1月冬季重點：</strong><br>'+a.winter+'</div>':'')+
  (a.time?'<div class="deep-time">⏱️ 建議停留：'+a.time+'</div>':'')+
  (a.source?'<a class="deep-source" href="'+esc(a.source)+'" target="_blank" rel="noopener">↗ 官方／主要資料來源</a>':'');
 modal.classList.add('show');document.body.style.overflow='hidden';
}

function transformCard(card){
 const id=(card.id||'').replace(/^spot-/,'');
 const titleEl=card.querySelector('.cat-card-head h3,.cat-title-wrap h3,h3');
 if(!titleEl)return null;
 const title=titleEl.textContent.trim();
 const jp=(card.querySelector('.cat-jp')?.textContent||'').replace(/^🇯🇵\s*/,'').trim();
 const score=(card.querySelector('.cat-score')?.textContent||'').trim();
 const mainBadge=card.querySelector('.cat-badge.main');
 const backupBadge=card.querySelector('.cat-badge.backup');
 const status=mainBadge?'main':'backup';
 const statusText=(mainBadge||backupBadge)?.textContent?.trim()||(status==='main'?'✅ 主行程':'🔄 後備景點');
 const dayText=(card.querySelector('.cat-badge.day')?.textContent||'').replace(/^🗓️\s*/,'').trim()||'行程內';
 const map=card.querySelector('.cat-map')?.getAttribute('href')||'#';
 const why=card.querySelector('.cat-detail.why p,.cat-full-body .cat-detail p')?.textContent?.trim()||'';
 let summary=why;
 if(summary.length>150)summary=summary.slice(0,147)+'…';
 let dur=(card.querySelector('.cat-time')?.textContent||'').replace(/^\s*⏱️?\s*建議停留[:：]?\s*/,'').trim();
 const v=visitFor(id);
 const dayParts=dayText.split(/｜/);
 const day=dayParts.shift()||dayText;
 const note=dayParts.join('｜');
 const el=document.createElement('div');
 el.className='catalog-item';el.dataset.status=status;el.id='v2-'+id;
 el.innerHTML='<div class="catalog-day">'+esc(day)+(note?'<small>'+esc(note)+'</small>':'')+'</div><div class="timeline-card">'+
   '<span class="event-type">'+esc(statusText)+'</span>'+
   (dur?'<span class="duration-badge">⏱ '+esc(dur)+'</span>':'')+
   (score?'<span class="catalog-score">⭐ '+esc(score)+'</span>':'')+
   '<h3>'+esc(title)+'<button type="button" class="enhance-info-btn catalog-v2-info" data-id="'+esc(id)+'" aria-label="詳細介紹">ⓘ</button><a class="map-pin" href="'+esc(map)+'" target="_blank" rel="noopener" aria-label="Google Maps">📍</a></h3>'+
   (jp?'<div class="jp-place-name">'+esc(jp)+'</div>':'')+
   (summary?'<p>'+esc(summary)+'</p>':'')+
   pricePill(v)+compactVisit(v)+
   '</div>';
 return el;
}

function applyFilter(mode){
 document.querySelectorAll('.catalog-v2-filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===mode));
 document.querySelectorAll('.catalog-item').forEach(c=>c.classList.toggle('catalog-hidden',mode!=='all'&&c.dataset.status!==mode));
 document.querySelectorAll('.cat-group').forEach(g=>g.classList.toggle('catalog-hidden',![...g.querySelectorAll('.catalog-item')].some(c=>!c.classList.contains('catalog-hidden'))));
}

function run(){
 const cards=[...document.querySelectorAll('.cat-card')];
 if(!cards.length||document.body.dataset.catalogV2==='1')return false;
 document.body.dataset.catalogV2='1';
 document.querySelectorAll('.cat-grid').forEach(grid=>{
   const timeline=document.createElement('div');timeline.className='catalog-timeline';
   [...grid.children].forEach(card=>{const n=transformCard(card);if(n)timeline.appendChild(n);});
   grid.replaceWith(timeline);
 });
 const toolbar=document.querySelector('.toolbar');
 if(toolbar)toolbar.innerHTML='<button class="catalog-v2-filter active" data-filter="all">全部</button><button class="catalog-v2-filter" data-filter="main">✅ 主行程</button><button class="catalog-v2-filter" data-filter="backup">🔄 後備景點</button>';
 applyFilter('all');
 return true;
}

document.addEventListener('click',e=>{
 const f=e.target.closest('.catalog-v2-filter');if(f){e.preventDefault();applyFilter(f.dataset.filter);return;}
 const b=e.target.closest('.catalog-v2-info');if(b){e.preventDefault();e.stopPropagation();openInfo(b.dataset.id);}
},true);

function boot(){if(run())return;[60,150,350,700].forEach(t=>setTimeout(run,t));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
