(function(){
'use strict';
if(window.MultiTripItineraryRenderer&&window.MultiTripItineraryRenderer.__v1)return;

const TYPE_META={flight:['✈️','航班'],train:['🚆','鐵路'],transport:['🚆','交通'],drive:['🚗','駕車'],car:['🚗','租車'],hotel:['🏨','酒店'],attraction:['📍','景點'],shopping:['🛍️','購物'],meal:['🍽️','餐飲'],onsen:['♨️','溫泉'],luggage:['🧳','行李'],walk:['🚶','步行'],ferry:['⛴️','渡輪'],activity:['🎯','活動']};
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const mapUrl=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q||'');
let generatedMarker=null;

function cfg(){return window.MultiTrip&&window.MultiTrip.config||{};}
function itinerary(){return window.MultiTripData&&window.MultiTripData.all('itinerary')||{};}
function mode(){const c=cfg(),r=c.renderers&&c.renderers.itinerary;return r&&r.mode?r.mode:'generate';}
function days(){const d=itinerary();return d&&Array.isArray(d.days)?d.days:[];}
function presentationProfile(){return itinerary().presentationProfile||((cfg().renderers||{}).itinerary||{}).presentationProfile||'';}
function attractions(){const d=window.MultiTripData&&window.MultiTripData.all('attractions');return d&&Array.isArray(d.attractions)?d.attractions:[];}
function attraction(id){return id?attractions().find(x=>x.id===id)||null:null;}
function hasDetail(a){return !!(a&&(a.info||a.history||a.visit||a.tips||a.access||a.winter||(Array.isArray(a.highlights)&&a.highlights.length)||(Array.isArray(a.sources)&&a.sources.length)));}
function formatDate(date){if(!date)return'';try{const c=cfg(),tz=c.timezone||'Asia/Tokyo',dt=new Date(date+'T12:00:00');const wk=new Intl.DateTimeFormat('zh-HK',{weekday:'short',timeZone:tz}).format(dt);return date.replace(/-/g,'/')+(wk?' · '+wk:'');}catch(e){return String(date).replace(/-/g,'/');}}
function typeMeta(t){return TYPE_META[t]||['•','行程'];}
function hardCutMap(day){const m=new Map();(day.hardCuts||[]).forEach(x=>{if(x&&x.time)m.set(x.time,x);});return m;}
function mapPin(q){return q?'<a class="map-pin" href="'+mapUrl(q)+'" target="_blank" rel="noopener" title="Google Maps">📍</a>':'';}
function durationText(mins){const n=Number(mins);if(!Number.isFinite(n)||n<=0)return'';if(n<60)return n+'分鐘';const h=Math.floor(n/60),m=n%60;return h+'小時'+(m?m+'分鐘':'');}
function infoButton(item){const a=attraction(item.attractionId);return hasDetail(a)?'<button type="button" class="enhance-info-btn multi-trip-info-btn" data-attraction-id="'+esc(item.attractionId)+'" aria-label="詳細介紹">ⓘ</button>':'';}

function ensureInfoBinding(){
 if(document.documentElement.dataset.multiTripItineraryInfoBound==='1')return;
 document.documentElement.dataset.multiTripItineraryInfoBound='1';
 document.addEventListener('click',e=>{
  const b=e.target.closest('.multi-trip-info-btn');if(!b)return;
  const a=attraction(b.dataset.attractionId);
  if(a&&window.MultiTripAttractionsRenderer&&typeof window.MultiTripAttractionsRenderer.openDetail==='function')window.MultiTripAttractionsRenderer.openDetail(a);
 });
}

function ensureAttractionRenderer(){
 if(window.MultiTripAttractionsRenderer)return Promise.resolve();
 return new Promise(resolve=>{
  const old=document.querySelector('script[data-itinerary-attractions-detail]');
  if(old){old.addEventListener('load',resolve,{once:true});return;}
  const s=document.createElement('script');
  s.src='assets/multi-trip-attractions-renderer-v1.js?v=5';
  s.dataset.itineraryAttractionsDetail='1';
  s.onload=resolve;s.onerror=resolve;document.head.appendChild(s);
 });
}

function ensureGalleryAssets(){
 const c=cfg(),href=c.assets&&c.assets.dayGalleryCss;if(!href)return;
 if(!document.getElementById('multiTripDayGalleryBase')){
  const s=document.createElement('style');s.id='multiTripDayGalleryBase';
  s.textContent='.day-photo-grid{margin:12px 0 16px;border-radius:12px;overflow:hidden;background:#e8eef3 center/cover no-repeat;aspect-ratio:9/5;box-shadow:0 2px 8px rgba(0,0,0,.08)}';
  document.head.appendChild(s);
 }
 if(!document.querySelector('link[data-multi-trip-day-gallery]')){
  const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.multiTripDayGallery='1';document.head.appendChild(l);
 }
}

function isDynamicDay(day){return day&&((day.weatherRegion==='dynamic')||(Array.isArray(day.moduleRefs)&&day.moduleRefs.length>0));}
function hydrateDay(day){
 const el=document.getElementById(day.id);if(!el)return false;
 el.dataset.tripDataSource='itinerary.json';el.dataset.tripDay=String(day.day||'');el.dataset.tripDate=day.date||'';
 const n=el.querySelector('.day-number');if(n)n.textContent='DAY '+(day.day||String(day.id||'').replace(/\D/g,''));
 const d=el.querySelector('.day-date');if(d&&day.date)d.textContent=formatDate(day.date);
 if(!isDynamicDay(day)){
  const t=el.querySelector('.day-title');if(t&&day.title)t.textContent=day.title;
  const r=el.querySelector('.day-route');if(r&&day.route)r.textContent=day.route;
 }else el.dataset.tripDynamic='1';
 return true;
}
function hydrateAll(){let count=0;days().forEach(d=>{if(hydrateDay(d))count++;});document.documentElement.dataset.itineraryRenderer='hydrate';document.documentElement.dataset.itineraryDataDays=String(count);return count;}

/* ---------- Standard typed production-compatible presentation ---------- */
function moduleById(id){return (cfg().modules||[]).find(x=>x&&x.id===id)||null;}
function plannerFor(day){
 for(const ref of day.moduleRefs||[]){
  const m=moduleById(ref);
  if(m&&m.enabled!==false&&m.type==='conditional-day-planner')return m;
 }
 return null;
}
function plannerState(m){
 if(!m||!m.stateKey)return'';
 const v=localStorage.getItem(m.stateKey)||'';
 return Array.isArray(m.candidateDays)&&m.candidateDays.includes(v)?v:'';
}
function resolvedView(day){
 const base=Object.assign({title:day.title||'',route:day.route||'',dateLabel:day.dateLabel||formatDate(day.date)},day.view||{});
 const m=plannerFor(day),selected=plannerState(m);
 if(!m||!selected||!day.variants)return base;
 const variantKey=m.assignments&&m.assignments[selected]&&m.assignments[selected][day.id];
 const variant=variantKey&&day.variants[variantKey];
 return variant?Object.assign({},base,variant):base;
}
function trusted(v){return String(v==null?'':v);}

function richHighlights(view){
 const h=view&&view.highlights;if(!h||!Array.isArray(h.items)||!h.items.length)return'';
 return '<div class="day-highlights"><div class="highlights-title">'+esc(h.title||'⭐ 今日重點')+'</div><div class="highlights-grid">'
  +h.items.map(x=>'<div class="'+esc(x.className||'highlight-item')+'">'+trusted(x.html)+'</div>').join('')
  +'</div></div>';
}

function panelBlock(b){
 if(!b)return'';
 if(b.type==='decision'){
  return '<div class="'+esc(b.className||'quick-decision')+'">'
   +'<div class="quick-decision-title">'+esc(b.title||'')+'</div>'
   +'<div class="decision-options">'+(b.options||[]).map(x=>'<div class="'+esc(x.className||'decision-option')+'">'+trusted(x.html)+'</div>').join('')+'</div>'
   +'</div>';
 }
 if(String(b.className||'').split(/\s+/).includes('backup-panel')){
  return '<details class="'+esc(b.className||'backup-panel')+'">'+trusted(b.html)+'</details>';
 }
 return '<div class="'+esc(b.className||'special-box')+'">'+trusted(b.html)+'</div>';
}

function richMedia(view){
 const media=view&&view.media;if(!media)return'';
 const item=(x,cls)=>{
  if(!x||!x.src)return'';
  const credit=x.credit?'<div class="v90-plan-photo-credit">'+esc(x.credit)+'</div>':'';
  return '<div class="'+cls+'"><img class="zoomable" src="'+esc(x.src)+'" alt="'+esc(x.alt||'')+'" data-caption="'+esc(x.caption||x.alt||'')+'" loading="lazy"><div class="photo-caption">'+esc(x.caption||x.alt||'')+'</div>'+credit+'</div>';
 };
 const hero=item(media.hero,'hero-photo');
 const gallery=(media.gallery||[]).map(x=>item(x,'photo-card')).join('');
 return '<div class="photo-section">'+hero+(gallery?'<div class="photo-gallery">'+gallery+'</div>':'')+'</div>';
}

function richTimelineItem(item){
 const attrs=(item.map?' data-map="'+esc(item.map)+'"':'')+(item.mapLabel?' data-map-label="'+esc(item.mapLabel)+'"':'');
 const time=esc(item.start||'')+(item.end?'<span class="end-time">'+esc(item.end)+'</span>':'');
 const event=item.eventType?'<span class="event-type">'+esc(item.eventType)+'</span>':'';
 const duration=item.duration?'<span class="duration-badge">'+esc(item.duration)+'</span>':'';
 const local=item.localName?'<div class="jp-place-name">🇯🇵 '+esc(item.localName)+'</div>':'';
 const paras=(item.paragraphs||[]).map(x=>'<p>'+trusted(x)+'</p>').join('');
 const price=item.price?'<span class="price">'+esc(item.price)+'</span>':'';
 const links=(item.links||[]).map(x=>'<a class="'+esc(x.className||'')+'" href="'+esc(x.href||'#')+'">'+esc(x.label||'')+'</a>').join('');
 const extras=(item.extras||[]).map(x=>'<div class="'+esc(x.className||'')+'">'+trusted(x.html)+'</div>').join('');
 return '<div class="'+esc(item.itemClass||'timeline-item')+'"><div class="time">'+time+'</div><div class="'+esc(item.cardClass||'timeline-card')+'">'
  +event+duration+'<h3'+attrs+'>'+esc(item.title||'')+'</h3>'+local+paras+price+links+extras+'</div></div>';
}

function richContentBlock(b){
 if(!b)return'';
 if(b.type==='timeline')return '<div class="'+esc(b.className||'timeline')+'">'+(b.items||[]).map(richTimelineItem).join('')+'</div>';
 if(b.type==='scenarioTitle')return '<div class="'+esc(b.className||'scenario-title')+'">'+esc(b.text||'')+'</div>';
 if(b.type==='buttons')return '<div class="'+esc(b.className||'day-buttons')+'">'+(b.links||[]).map(x=>'<a class="'+esc(x.className||'button')+'" href="'+esc(x.href||'#')+'">'+esc(x.label||'')+'</a>').join('')+'</div>';
 return panelBlock(b);
}

function richDay(day){
 const view=resolvedView(day),blocks=view.preBlocks||[];
 const after=blocks.filter(b=>String(b&&b.className||'').split(/\s+/).includes('backup-panel'));
 const before=blocks.filter(b=>!String(b&&b.className||'').split(/\s+/).includes('backup-panel'));
 return '<details class="day" id="'+esc(day.id)+'" data-trip-generated="1" data-trip-data-source="itinerary.json" data-trip-day="'+esc(day.day)+'" data-trip-date="'+esc(day.date||'')+'">'
  +'<summary><div class="day-summary-main"><div class="day-number">DAY '+esc(day.day)+'</div><div class="day-title">'+esc(view.title||day.title||'')+'</div><div class="day-date">'+esc(view.dateLabel||day.dateLabel||formatDate(day.date))+'</div><div class="day-route">'+esc(view.route||day.route||'')+'</div></div></summary>'
  +'<div class="day-inner">'+richHighlights(view)+before.map(panelBlock).join('')+richMedia(view)
  +'<div class="day-content">'+(view.contentBlocks||[]).map(richContentBlock).join('')+'</div>'+after.map(panelBlock).join('')+'</div></details>';
}

function plannerUi(){
 return (cfg().modules||[]).find(x=>x&&x.enabled!==false&&x.type==='conditional-day-planner'&&x.ui&&x.ui.enabled!==false)||null;
}
function updatePlannerActive(box,m){
 const selected=plannerState(m);
 box.querySelectorAll('button[data-sh]').forEach(b=>b.classList.toggle('active',!!selected&&b.dataset.sh===selected));
}
function renderDynamicDays(){
 const ds=days().filter(d=>plannerFor(d));
 ds.forEach(day=>{
  const old=document.getElementById(day.id);if(!old)return;
  const open=old.open;
  const tmp=document.createElement('template');tmp.innerHTML=richDay(day).trim();
  const next=tmp.content.firstElementChild;if(!next)return;
  next.open=open;old.replaceWith(next);
 });
 postGenerate();
 document.dispatchEvent(new CustomEvent('multitrip:itineraryrendered',{detail:{mode:'generate',count:days().length,tripId:window.MultiTrip&&window.MultiTrip.id,plannerChange:true}}));
}
function renderPlannerUi(){
 const m=plannerUi();if(!m||!m.stateKey)return;
 const ui=m.ui||{},intro=document.querySelector('.container > .intro, main.container > .intro');
 if(!intro)return;
 let box=document.getElementById(ui.id||'multiTripConditionalPlanner');
 if(!box){
  box=document.createElement('section');
  box.id=ui.id||'multiTripConditionalPlanner';
  box.className=ui.className||'tripv2-weather-select';
  const anchor=document.getElementById('d6d8WeatherDecision')||document.getElementById('weather3dPanel')||intro;
  anchor.insertAdjacentElement('afterend',box);
  const shrine=document.getElementById('v87ShrineQuick');
  if(shrine)box.insertAdjacentElement('afterend',shrine);
 }
 box.innerHTML='<h2>'+esc(ui.title||'行程選擇')+'</h2>'+(ui.description?'<p>'+esc(ui.description)+'</p>':'')
  +'<div class="tripv2-choice-row">'+(ui.choices||[]).map(x=>'<button class="tripv2-choice" data-sh="'+esc(x.value||'')+'">'+esc(x.label||x.value||'')+'</button>').join('')
  +(ui.resetLabel?'<button class="tripv2-choice reset" data-sh="">'+esc(ui.resetLabel)+'</button>':'')+'</div>';
 box.querySelectorAll('button[data-sh]').forEach(btn=>btn.addEventListener('click',()=>{
  const v=btn.dataset.sh||'';
  if(v)localStorage.setItem(m.stateKey,v);else localStorage.removeItem(m.stateKey);
  updatePlannerActive(box,m);
  renderDynamicDays();
  document.dispatchEvent(new CustomEvent('multitrip:plannerchange',{detail:{moduleId:m.id,value:v,tripId:window.MultiTrip&&window.MultiTrip.id}}));
 }));
 updatePlannerActive(box,m);
}

function postGenerate(){
 try{if(typeof window.addMapPins==='function')window.addMapPins();}catch(e){}
 [60,220,650].forEach(t=>setTimeout(()=>{try{if(typeof window.addMapPins==='function')window.addMapPins();}catch(e){}},t));
}

/* ---------- Generic Standard fallback used by other trips ---------- */
function renderHighlights(day){
 const cuts=day.hardCuts||[],backs=day.backups||[],constraints=day.constraints||[],bonus=day.bonus||[];
 if(!cuts.length&&!backs.length&&!constraints.length&&!bonus.length)return'';
 const rows=[];
 cuts.forEach(x=>rows.push('<div class="highlight-item highlight-danger">⏰ <strong>'+esc(x.time||'')+'</strong> '+esc(x.label||'Hard Cut')+'</div>'));
 backs.forEach(x=>rows.push('<div class="highlight-item">🅱️ Backup：'+esc(typeof x==='string'?x:(x.title||x.text||''))+'</div>'));
 constraints.forEach(x=>rows.push('<div class="highlight-item highlight-road">⚠️ '+esc(typeof x==='string'?x:(x.text||''))+'</div>'));
 bonus.forEach(x=>rows.push('<div class="highlight-item">✨ Bonus：'+esc(typeof x==='string'?x:(x.title||x.text||''))+'</div>'));
 return'<div class="day-highlights"><div class="highlights-title">今日重點</div><div class="highlights-grid">'+rows.join('')+'</div></div>';
}
function renderItem(item,cutMap){
 const meta=typeMeta(item.type),cut=cutMap.get(item.time||''),hard=!!cut||item.hardCut===true,dur=durationText(item.durationMinutes);
 let note=item.note||item.description||'';if(cut&&cut.label)note+=(note?' · ':'')+'Hard Cut：'+cut.label;
 const badges='<div class="event-type">'+meta[0]+' '+esc(meta[1])+(dur?'<span class="duration-badge">⏱ '+esc(dur)+'</span>':'')+'</div>';
 return'<div class="timeline-item" data-item-type="'+esc(item.type||'item')+'"><div class="time">'+esc(item.time||'—')+'</div><div class="timeline-card'+(hard?' hard-cut':'')+'">'+badges+'<h3>'+meta[0]+' '+esc(item.title||'行程')+infoButton(item)+mapPin(item.map)+'</h3>'+(note?'<p>'+esc(note)+'</p>':'')+'</div></div>';
}
function renderHotel(day){
 if(!day.hotelId||!window.MultiTripData)return'';
 const h=window.MultiTripData.hotel(day.hotelId);if(!h)return'';
 const title=h.name||h.title||day.hotelId,detail=[h.payment,h.note].filter(Boolean).join(' · ');
 return'<div class="special-box"><strong>🏨 今日住宿：</strong>'+esc(title)+(detail?'<br>'+esc(detail):'')+'</div>';
}
function gallery(day){
 if(!day.imagePlan)return'';
 const trip=String(cfg().id||'trip').replace(/[^a-zA-Z0-9_-]/g,'-'),did=String(day.id||'').replace(/[^a-zA-Z0-9_-]/g,'-'),labels=[day.imagePlan.hero].concat(day.imagePlan.small||[]).filter(Boolean).join('、');
 return'<div class="day-photo-grid gallery-'+esc(trip)+'-'+esc(did)+'" role="img" aria-label="'+esc(labels||('DAY '+day.day+' 行程圖片'))+'"></div>';
}
function simpleDay(day){
 const cutMap=hardCutMap(day),items=Array.isArray(day.items)?day.items:[],timeline=items.length?'<div class="timeline">'+items.map(x=>renderItem(x,cutMap)).join('')+'</div>':'<div class="special-box">🧭 呢日由專用 Module／彈性規則決定；目前路線：'+esc(day.route||'待定')+'</div>';
 return'<details class="day" id="'+esc(day.id)+'" data-trip-generated="1" data-trip-data-source="itinerary.json" data-trip-day="'+esc(day.day)+'"><summary><div class="day-summary-main"><div class="day-number">DAY '+esc(day.day)+'</div><div class="day-title">'+esc(day.title||'')+'</div><div class="day-date">'+esc(formatDate(day.date))+'</div><div class="day-route">'+esc(day.route||'')+'</div></div></summary>'+renderHighlights(day)+'<div class="day-content">'+gallery(day)+timeline+renderHotel(day)+'</div></details>';
}
function renderDay(day){return presentationProfile()==='standard-itinerary-v1'&&day.view?richDay(day):simpleDay(day);}

function renderGenericIntro(ds){
 const c=cfg(),intro=document.querySelector('.container > .intro, main.container > .intro');if(!intro)return;
 const driveDays=ds.filter(d=>d&&d.driving).map(d=>'D'+d.day);
 const dateLine=[c.startDate&&c.endDate?formatDate(c.startDate).split(' · ')[0]+' – '+formatDate(c.endDate).split(' · ')[0]:'',ds.length?ds.length+'日行程':''].filter(Boolean).join(' · ');
 const cards=[['🗺️ 旅程',c.country||''],['🚗 自駕',driveDays.length?driveDays.join('、'):'無自駕日'],['📋 模式','行程資料由目前 Trip Data 產生']];
 intro.innerHTML='<h2>'+esc(c.name||c.shortName||'旅程')+'</h2>'+(c.subtitle?'<p>'+esc(c.subtitle)+'</p>':'')+(dateLine?'<p>📅 '+esc(dateLine)+'</p>':'')+'<div class="intro-grid">'+cards.map(x=>'<div class="intro-item"><strong>'+esc(x[0])+'</strong><br>'+esc(x[1])+'</div>').join('')+'</div>';
 intro.dataset.multiTripIntro='1';
}
function rebuildNav(ds){
 const inner=document.querySelector('.day-nav-inner');if(!inner)return;
 inner.querySelectorAll('a[href^="#d"],a[data-day]').forEach(a=>a.remove());
 const firstControl=inner.querySelector('.nav-btn');
 ds.forEach(d=>{const a=document.createElement('a');a.href='#'+d.id;a.dataset.day=d.id;a.textContent='D'+d.day;if(firstControl)inner.insertBefore(a,firstControl);else inner.appendChild(a);});
}

function ensureMarker(container,legacy){
 if(generatedMarker&&generatedMarker.isConnected)return generatedMarker;
 generatedMarker=document.createComment('multi-trip-generated-days');
 const first=legacy[0]||container.querySelector('details.day[data-trip-generated="1"]');
 if(first)first.parentNode.insertBefore(generatedMarker,first);else container.appendChild(generatedMarker);
 return generatedMarker;
}
function insertGeneratedDays(container,ds){
 const existing=[...container.querySelectorAll('details.day')];
 const marker=ensureMarker(container,existing);
 existing.forEach(x=>x.remove());
 const tpl=document.createElement('template');tpl.innerHTML=ds.map(renderDay).join('');
 marker.after(tpl.content);
}

function generateAll(){
 const ds=days();if(!ds.length)return 0;
 const container=document.querySelector('.container');if(!container)return 0;
 if(presentationProfile()!=='standard-itinerary-v1'){ensureGalleryAssets();renderGenericIntro(ds);}
 insertGeneratedDays(container,ds);
 if(presentationProfile()!=='standard-itinerary-v1')rebuildNav(ds);
 renderPlannerUi();
 ensureInfoBinding();
 postGenerate();
 document.documentElement.dataset.itineraryRenderer='generate';
 document.documentElement.dataset.itineraryPresentation=presentationProfile()||'standard';
 document.documentElement.dataset.itineraryDataDays=String(ds.length);
 return ds.length;
}
function render(){
 if(!/(?:^|\/)itinerary\.html$/.test(location.pathname))return 0;
 const m=mode(),count=m==='generate'?generateAll():hydrateAll();
 document.dispatchEvent(new CustomEvent('multitrip:itineraryrendered',{detail:{mode:m,count,tripId:window.MultiTrip&&window.MultiTrip.id}}));
 return count;
}

window.MultiTripItineraryRenderer={__v1:true,render,hydrateAll,generateAll,renderDynamicDays,mode};
Promise.all([
 window.MultiTrip&&window.MultiTrip.ready?window.MultiTrip.ready:Promise.resolve(),
 window.MultiTripData&&window.MultiTripData.ready?window.MultiTripData.ready:Promise.resolve()
]).then(()=>{
 const m=mode();
 if(m==='generate'){
  const start=()=>ensureAttractionRenderer().then(()=>render());
  if(presentationProfile()==='standard-itinerary-v1')return setTimeout(start,2450);
  return start();
 }
 [0,350,900,1800].forEach(t=>setTimeout(render,t));
}).catch(err=>console.error('Multi Trip itinerary renderer failed',err));
})();
