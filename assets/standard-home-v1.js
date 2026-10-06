(() => {
  'use strict';

  const grid=document.getElementById('tripGrid');
  const count=document.getElementById('tripCount');
  let active='';
  try{active=localStorage.getItem('multiTrip.activeTrip')||'';}catch(_){}

  const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'
  })[c]||c);

  const fmt=s=>{
    if(!s)return'';
    const p=s.split('-');
    return p.length===3?p[0]+'/'+p[1]+'/'+p[2]:s;
  };

  const url=(file,id)=>{
    const hash=file.includes('#')?file.slice(file.indexOf('#')):'';
    const clean=hash?file.slice(0,file.indexOf('#')):file;
    return clean+'?trip='+encodeURIComponent(id)+hash;
  };

  const remember=id=>{
    active=id;
    try{localStorage.setItem('multiTrip.activeTrip',id);}catch(_){}
  };

  const displayName=t=>t.status==='test'
    ? (t.displayName||t.shortName||'測試旅程')
    : (t.displayName||t.name||t.shortName||'未命名旅程');

  const displaySub=t=>t.status==='test'
    ? (t.displaySubtitle||'功能驗證用旅程')
    : (t.displaySubtitle||t.subtitle||'');

  const isCompleted=t=>{
    if(t.status==='test'||!t.endDate)return false;
    const end=new Date(t.endDate+'T23:59:59');
    return !Number.isNaN(end.getTime())&&end.getTime()<Date.now();
  };

  const link=(label,file,t,secondary)=>
    '<a class="tp-btn'+(secondary?' tp-btn-secondary':'')+'" href="'+url(file,t.id)+'" data-trip="'+esc(t.id)+'">'+label+'</a>';

  const card=t=>{
    const f=t.features||{},isTest=t.status==='test',completed=isCompleted(t),isCurrent=active===t.id;
    const el=document.createElement('article');
    el.className='tp-trip-card'+(isCurrent?' is-current':'')+(isTest?' is-test':'')+(completed?' is-completed':'');
    const primaryUrl=url(t.entry||'itinerary.html',t.id);
    el.dataset.href=primaryUrl;
    el.tabIndex=0;
    el.setAttribute('role','link');
    el.setAttribute('aria-label','開啟 '+displayName(t));
    const cover=t.cover?"background-image:url('"+esc(t.cover)+"')":'';
    let actions='';
    if(f.itinerary!==false)actions+=link('▶ 開啟行程',t.entry||'itinerary.html',t,false);
    if(f.tripInfo!==false)actions+=link('🧳 旅程資料','trip-info.html',t,true);
    if(f.attractions!==false)actions+=link('📍 景點','attractions.html',t,true);
    if(f.liveCam!==false)actions+=link('📷 Live Cam','live.html',t,true);
    const badgeText=isTest?'測試旅程':(completed?'已完成旅程':(t.badge||'旅程'));
    const badgeClass=isTest?'is-test':(completed?'is-completed':'');
    el.innerHTML='<div class="tp-cover" style="'+cover+'"><div class="tp-country">'+esc(t.emoji||'✈️')+' '+esc(t.country||'')+'</div><div class="tp-badges"><span class="tp-badge '+badgeClass+'">'+esc(badgeText)+'</span>'+(isCurrent?'<span class="tp-badge is-current">最近使用</span>':'')+'</div></div><div class="tp-trip-body"><div class="tp-trip-name">'+esc(displayName(t))+'</div><div class="tp-trip-sub">'+esc(displaySub(t))+'</div><div class="tp-trip-date">📅 '+esc(fmt(t.startDate))+' – '+esc(fmt(t.endDate))+'</div>'+(isTest?'<div class="tp-test-note">呢個係功能驗證用旅程，不代表真實預訂。</div>':'')+'<div class="tp-actions">'+actions+'</div></div>';
    el.querySelectorAll('[data-trip]').forEach(x=>x.addEventListener('click',()=>remember(t.id)));
    el.addEventListener('click',e=>{
      if(e.target.closest('a,button'))return;
      remember(t.id);
      location.href=primaryUrl;
    });
    el.addEventListener('keydown',e=>{
      if((e.key==='Enter'||e.key===' ')&&!e.target.closest('a,button')){
        e.preventDefault();
        remember(t.id);
        location.href=primaryUrl;
      }
    });
    return el;
  };

  const render=trips=>{
    trips=[...trips].sort((a,b)=>String(b.startDate||'').localeCompare(String(a.startDate||'')));
    if(!active){
      const first=trips.find(t=>t.status!=='test')||trips[0];
      if(first)active=first.id;
    }
    grid.innerHTML='';
    trips.forEach(t=>grid.appendChild(card(t)));
    count.textContent=trips.length+' 個旅程';
  };

  const fail=()=>{
    grid.innerHTML='<article class="tp-trip-card"><div class="tp-trip-body"><div class="tp-trip-name">⚠️ 旅程清單載入失敗</div><div class="tp-trip-sub">請重新整理頁面；TravelPilot 不會用其他 Trip 資料代替。</div></div></article>';
    count.textContent='載入失敗';
  };

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
  }

  fetch('trips/registry.json?t='+Date.now(),{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('registry');return r.json();})
    .then(x=>render((x.trips||[]).filter(t=>t.status!=='hidden')))
    .catch(fail);
})();