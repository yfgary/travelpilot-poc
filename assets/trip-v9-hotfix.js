(function(){
'use strict';

if(window.__japan2027V901Hotfix)return;
window.__japan2027V901Hotfix=true;

const CORE=window.Japan2027AttractionCore||null;
if(!CORE)return;
let modal=null;

function isTripInfo(){return /(?:^|\/)trip-info\.html$/.test(location.pathname);}
function paras(v){if(!v)return'';if(!Array.isArray(v))v=[v];return v.filter(Boolean).map(x=>'<p>'+x+'</p>').join('');}
function bullets(v){if(!v)return'';if(!Array.isArray(v))v=[v];return '<ul>'+v.filter(Boolean).map(x=>'<li>'+x+'</li>').join('')+'</ul>';}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function ensureModal(){
  if(modal)return;
  modal=document.createElement('div');
  modal.className='enhance-modal';
  modal.id='v901TripInfoModal';
  modal.innerHTML='<div class="enhance-modal-card" role="dialog" aria-modal="true"><div class="enhance-modal-head"><h2 class="enhance-modal-title"></h2><button type="button" class="enhance-modal-close" aria-label="關閉">×</button></div><div class="enhance-modal-body"></div></div>';
  document.body.appendChild(modal);
  const close=()=>{modal.classList.remove('show');document.body.style.overflow='';};
  modal.querySelector('.enhance-modal-close').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
}
function openInfo(info){
  if(!info)return;ensureModal();
  modal.querySelector('.enhance-modal-title').textContent=info.title||'';
  const why=info.whyLong||info.why||'';
  const hist=info.history||info.background||'';
  const imp=info.importance||[];
  const look=info.visit||info.look||[];
  modal.querySelector('.enhance-modal-body').innerHTML=
    (info.jp?'<div class="deep-jp-name">🇯🇵 '+esc(info.jp)+'</div>':'')+
    '<div class="deep-summary"><h3>🧭 點解值得去</h3>'+paras(why)+'</div>'+
    '<div class="deep-section"><h3>📚 歷史／背景</h3>'+paras(hist)+'</div>'+
    (imp&&imp.length?'<div class="deep-section"><h3>🏛️ 點解重要</h3>'+bullets(imp)+'</div>':'')+
    '<div class="deep-section"><h3>👀 去到現場應該睇乜</h3>'+bullets(look)+'</div>'+
    (info.fit?'<div class="deep-trip-fit"><strong>🗺️ 行程安排：</strong><br>'+info.fit+'</div>':'')+
    (info.winter?'<div class="deep-winter"><strong>❄️ 1月重點：</strong><br>'+info.winter+'</div>':'')+
    (info.time?'<div class="deep-time">⏱️ 建議停留：'+info.time+'</div>':'')+
    (info.source?'<a class="deep-source" href="'+esc(info.source)+'" target="_blank" rel="noopener">↗ 官方／主要資料來源</a>':'');
  modal.classList.add('show');document.body.style.overflow='hidden';
}

function ensureTripInfoNav(){
  if(!isTripInfo())return;
  const nav=document.querySelector('.quick-nav-inner');if(!nav)return;
  if(!nav.querySelector('a[href="#trains"]')){
    const a=document.createElement('a');a.href='#trains';a.textContent='🚆 火車';
    const ref=nav.querySelector('a[href="#transport"]');ref?ref.insertAdjacentElement('afterend',a):nav.appendChild(a);
  }
  if(!nav.querySelector('a[href="#winter-shrines"]')){
    const a=document.createElement('a');a.href='#winter-shrines';a.textContent='⛩️ 神社';
    const ref=nav.querySelector('a[href="#hotels"]');ref?ref.insertAdjacentElement('afterend',a):nav.appendChild(a);
  }
}

const tripInfoButtonSelector=CORE.buttonSelector({includeBackup:false});
function wireTripInfoButtons(){
  if(!isTripInfo())return;
  document.querySelectorAll('#winter-shrines .parking-main h3').forEach(h=>{
    const info=CORE.findBest(h.textContent,{includeTitle:false});if(!info)return;
    CORE.ensureInfoButton(h,info,{existingSelector:tripInfoButtonSelector,setExistingId:true});
  });
}

function run(){
  CORE.dedupeInfoButtons(document);
  ensureTripInfoNav();
  wireTripInfoButtons();
}
function onTripInfoRendered(){if(isTripInfo())run();}
function onFinalPatch(e){if(isTripInfo()&&e.detail&&e.detail.final===true)run();}

document.addEventListener('multitrip:tripinforendered',onTripInfoRendered);
document.addEventListener('japan2027:finalpatch',onFinalPatch);

const scopedTripInfoButtonSelector=tripInfoButtonSelector.split(',').map(selector=>'#winter-shrines '+selector).join(',');
document.addEventListener('click',e=>{
  if(!isTripInfo())return;
  const b=e.target.closest(scopedTripInfoButtonSelector);
  if(!b)return;
  const h=b.closest('h3');const info=(b.dataset.deepInfoId&&CORE.byId(b.dataset.deepInfoId))||CORE.findBest(h?.textContent||'',{includeTitle:false});
  if(!info)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openInfo(info);
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
