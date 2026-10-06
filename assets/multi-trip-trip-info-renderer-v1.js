(function(){
'use strict';
if(window.MultiTripTripInfoRenderer&&window.MultiTripTripInfoRenderer.__v1)return;

const DEFAULT_TRIP='shirakawago-shinhotaka-2027';
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const nl=s=>esc(s).replace(/\n/g,'<br>');

function cfg(){return window.MultiTrip&&window.MultiTrip.config||{};}
function tripId(){return window.MultiTrip&&window.MultiTrip.id||DEFAULT_TRIP;}
function data(){return window.MultiTripData&&window.MultiTripData.all('tripInfo')||null;}
function mode(){const c=cfg(),r=c.renderers&&c.renderers.tripInfo;return r&&r.mode?r.mode:((c.id||'')===DEFAULT_TRIP?'hydrate':'generate');}
function tone(t){return ['blue','green','yellow','red','grey'].includes(t)?t:'grey';}
function section(id){return document.getElementById(id);}
function body(id){const s=section(id);return s&&s.querySelector('.section-body');}
function setHead(id,obj){
 const s=section(id);if(!s||!obj)return;
 const t=s.querySelector('.section-title');if(t&&obj.title)t.textContent=obj.title;
 const d=s.querySelector('.section-desc');if(d&&obj.desc)d.textContent=obj.desc;
 s.hidden=false;
 s.dataset.tripInfoSource='trip-info.json';
}
function hideMissing(ids,present){ids.forEach(id=>{const s=section(id);if(s)s.hidden=!present.has(id);});}
function mapAttrs(item){return item&&item.map?' data-map="'+esc(item.map)+'"'+(item.mapLabel?' data-map-label="'+esc(item.mapLabel)+'"':''):'';}
function noteBox(text){return text?'<div class="note-box">'+nl(text)+'</div>':'';}

function ensureStyles(){
 if(document.getElementById('multiTripTripInfoStyles'))return;
 const s=document.createElement('style');s.id='multiTripTripInfoStyles';s.textContent=`
 #hotels .hotel-list{gap:9px}
 #hotels .hotel-row{grid-template-columns:76px minmax(190px,.8fr) minmax(0,2.45fr);gap:12px;align-items:start;padding:10px 12px}
 #hotels .hotel-day{padding-top:2px}
 #hotels .hotel-name{line-height:1.42;padding-top:1px}
 .hotel-name-badges{display:flex;flex-wrap:wrap;gap:3px;margin-top:7px}
 .hotel-rich{font-size:11.5px;line-height:1.45;color:#56656f;min-width:0}
 .hotel-rich-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
 .hotel-rich-group{min-width:0;padding:8px 9px;border:1px solid #e2e8ed;border-radius:8px;background:#fff}
 .hotel-rich-group-title{margin:0 0 5px;color:#1f4e79;font-size:11px;font-weight:800}
 .hotel-rich-line{margin:2px 0;overflow-wrap:anywhere}
 .hotel-rich-line strong{color:#263f52}
 .hotel-arrival{margin:5px 0 0;padding:6px 7px;border-radius:6px;background:#eef7ef;border:1px solid #cfe2d2;color:#285f38;font-weight:700;line-height:1.4}
 .hotel-arrival.pay{background:#fff1ef;border-color:#edcbc5;color:#9a342b}
 .hotel-arrival.tax{background:#fff7df;border-color:#ead99d;color:#785b00}
 .hotel-extra-note{margin-top:5px;padding-top:5px;border-top:1px dashed #d6dee5;color:#66747e}
 @media(max-width:980px){#hotels .hotel-row{grid-template-columns:72px minmax(175px,.85fr) minmax(0,2fr)}.hotel-rich-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hotel-rich-group:last-child{grid-column:1/-1}}
 @media(max-width:720px){#hotels .hotel-row{grid-template-columns:1fr;gap:6px}.hotel-name-badges{margin-top:5px}.hotel-rich-grid{grid-template-columns:1fr}.hotel-rich-group:last-child{grid-column:auto}}
 `;document.head.appendChild(s);
}

function renderOverview(d){
 const o=d.overview;if(!o)return;
 const root=document.querySelector('.intro');if(!root)return;
 const h=root.querySelector('h2');if(h&&o.title)h.textContent=o.title;
 const ps=root.querySelectorAll(':scope > p');
 if(ps[0]&&o.summary)ps[0].textContent=o.summary;
 if(ps[1]&&o.note)ps[1].textContent=o.note;
 let grid=root.querySelector('.intro-grid');
 if(!grid){grid=document.createElement('div');grid.className='intro-grid';root.appendChild(grid);}
 grid.innerHTML=(o.highlights||[]).map(x=>'<div class="intro-item"><strong>'+esc(x.title)+'</strong><br>'+esc(x.text)+'</div>').join('');
 root.dataset.tripInfoSource='trip-info.json';
}
function renderNav(d){
 const nav=document.querySelector('.quick-nav-inner');if(!nav||!Array.isArray(d.nav))return;
 nav.innerHTML=d.nav.map(x=>'<a href="#'+esc(x.id)+'">'+esc(x.label)+'</a>').join('');
}
function renderCards(id,obj){
 if(!obj)return;setHead(id,obj);const b=body(id);if(!b)return;
 const cards=(obj.cards||[]).map(c=>{
  const badges=(c.badges||[]).map(x=>'<span class="label label-'+tone(x[1])+'">'+esc(x[0])+'</span>').join('');
  const lines=(c.lines||[]).map(x=>'<p>'+esc(x)+'</p>').join('');
  return '<div class="info-card">'+badges+'<h3'+mapAttrs(c)+'>'+esc(c.title||'')+'</h3>'+lines+'</div>';
 }).join('');
 b.innerHTML='<div class="card-grid">'+cards+'</div>'+noteBox(obj.note);
}
function hotelBadge(tag,h){
 const map={
  booked:['green',h.statusLabel||'✅ 已訂'],
  onsen:['blue','♨️ 溫泉'],
  'arrival-pay':['red','🏨 到店要付房費'],
  'arrival-tax':['yellow','⚠️ 到店只付稅／費用'],
  'arrival-clear':['green','✅ 到店唔使付房費'],
  breakfast:['green','🍳 包早餐'],
  pending:['yellow','📝 待確認']
 };
 const x=map[tag]||['grey',tag];return '<span class="label label-'+x[0]+'">'+esc(x[1])+'</span>';
}
function hotelLine(icon,label,val){return val?'<div class="hotel-rich-line">'+icon+' <strong>'+esc(label)+'：</strong>'+esc(val)+'</div>':'';}
function group(title,html){return html?'<div class="hotel-rich-group"><div class="hotel-rich-group-title">'+title+'</div>'+html+'</div>':'';}
function renderHotels(obj){
 if(!obj)return;setHead('hotels',obj);const b=body('hotels');if(!b)return;ensureStyles();
 const rows=(obj.stays||[]).map(s=>{
  const h=window.MultiTripData&&window.MultiTripData.hotel(s.hotelId);if(!h)return'';
  const tags=[...new Set(h.badges||[])];
  const badges=tags.map(x=>hotelBadge(x,h)).join('');
  let arrivalClass='';if(tags.includes('arrival-pay'))arrivalClass=' pay';else if(tags.includes('arrival-tax'))arrivalClass=' tax';
  const payment=hotelLine('💰','總價',h.totalPrice)
   +hotelLine('💳','已付／狀態',h.paidAmount)
   +(h.arrivalPayment?'<div class="hotel-arrival'+arrivalClass+'">'+esc(h.arrivalPayment)+'</div>':'');
  const stay=hotelLine('🛏️','房型',h.room)
   +hotelLine('🍽️','餐飲',h.meals)
   +hotelLine('🕒','入住／退房',(h.checkIn||h.checkOut)?((h.checkIn||'—')+' → '+(h.checkOut||'—')):'');
  const practical=hotelLine('📍','地址',h.address)
   +hotelLine('☎️','電話',h.phone)
   +hotelLine('🚗','停車',h.parking)
   +hotelLine('↩️','取消',h.cancellation)
   +((s.note||h.note)?'<div class="hotel-extra-note">'+esc(s.note||h.note)+'</div>':'');
  const name='<div class="hotel-name-wrap"><div class="hotel-name"'+mapAttrs({map:h.map||h.name})+'>'+esc(s.icon||'🏨')+' '+esc(h.name||h.en||s.hotelId)+'</div>'+(badges?'<div class="hotel-name-badges">'+badges+'</div>':'')+'</div>';
  const detail='<div class="hotel-rich"><div class="hotel-rich-grid">'+group('付款',payment)+group('住宿',stay)+group('實用資料',practical)+'</div></div>';
  return '<div class="hotel-row"><div class="hotel-day">'+esc(s.day)+(s.date?'・'+esc(s.date):'')+'</div>'+name+detail+'</div>';
 }).join('');
 b.innerHTML='<div class="hotel-list">'+rows+'</div>';
}
function renderParking(obj){
 if(!obj)return;setHead('parking',obj);const b=body('parking');if(!b)return;
 const rows=(obj.items||[]).map(x=>'<div class="parking-card"><div class="parking-icon">'+esc(x.icon||'🅿️')+'</div><div class="parking-main"><h3'+mapAttrs(x)+'>'+esc(x.title||'')+'</h3>'+(x.target?'<p><strong>'+esc(x.target)+'</strong></p>':'')+(x.lines||[]).map(y=>'<p>'+esc(y)+'</p>').join('')+(x.warning?'<div class="parking-warning">'+esc(x.warning)+'</div>':'')+'</div></div>').join('');
 b.innerHTML='<div class="parking-list">'+rows+'</div>'+noteBox(obj.note);
}
function renderHardCuts(obj){
 if(!obj)return;setHead('hardcuts',obj);const b=body('hardcuts');if(!b)return;
 b.innerHTML='<div class="hardcut-list">'+(obj.items||[]).map(x=>'<div class="hardcut-item"><div class="hardcut-time">'+esc(x.time||'')+'</div><div class="hardcut-text">'+esc(x.text||'')+'</div></div>').join('')+'</div>';
}
function dynamicWeatherSummary(obj){
 if(!obj||!obj.dynamicSummary)return'';
 const it=window.MultiTripData&&window.MultiTripData.all('itinerary');
 const rules=it&&it.flexibleRules,choice=localStorage.getItem(obj.storageKey||rules&&rules.storageKey||'');
 const selected=rules&&rules.scenarios&&rules.scenarios[choice];
 if(!selected)return '<div class="tripv2-weather-summary">🌨️ <strong>D6–D8 尚未鎖定。</strong> 去「詳細行程」揀 D6／D7／D8 邊日去新穗高。</div>';
 const labels=obj.kindLabels||{};
 const line=id=>labels[selected[id]]||selected[id]||'—';
 return '<div class="tripv2-weather-summary">🚡 <strong>'+esc(String(choice||'').toUpperCase())+' 去新穗高</strong><br>D6：'+esc(line('d6'))+'<br>D7：'+esc(line('d7'))+'<br>D8：'+esc(line('d8'))+' → 松本</div>';
}
function renderWeather(obj){
 if(!obj)return;setHead('weather',obj);const b=body('weather');if(!b)return;
 const boxes=(obj.decisions||[]).map(x=>'<div class="decision-box"><div class="decision-title">'+esc(x.title||'')+'</div>'+(x.lines||[]).map(y=>'<div class="decision-line">'+esc(y)+'</div>').join('')+'</div>').join('');
 const buttons=(obj.buttons||[]).length?'<div class="button-row">'+obj.buttons.map(x=>'<a class="button" href="'+esc((window.MultiTrip&&window.MultiTrip.withTrip)?window.MultiTrip.withTrip(x.href):x.href)+'">'+esc(x.label)+'</a>').join('')+'</div>':'';
 b.innerHTML=dynamicWeatherSummary(obj)+boxes+buttons;
}
function checklistKey(){return 'multiTrip.checklist.'+tripId();}
function setupChecklistState(obj,wrap){
 const key=checklistKey(),legacy=obj.legacyStorageKey||'';
 let state={};
 try{
  const raw=localStorage.getItem(key)||((tripId()===DEFAULT_TRIP&&legacy)?localStorage.getItem(legacy):null)||'{}';state=JSON.parse(raw)||{};
  if(!localStorage.getItem(key)&&Object.keys(state).length)localStorage.setItem(key,JSON.stringify(state));
 }catch(e){state={};}
 wrap.querySelectorAll('.check-item').forEach((item,idx)=>{
  const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!state['i'+idx];item.prepend(cb);item.classList.toggle('done',cb.checked);
  const save=()=>{state['i'+idx]=cb.checked;localStorage.setItem(key,JSON.stringify(state));item.classList.toggle('done',cb.checked);};
  cb.addEventListener('change',save);item.addEventListener('click',e=>{if(e.target===cb)return;cb.checked=!cb.checked;save();});
 });
 const reset=document.createElement('button');reset.type='button';reset.className='tripv2-reset-check';reset.textContent='↺ 全部 Checklist 重設';reset.addEventListener('click',()=>{localStorage.removeItem(key);wrap.querySelectorAll('input').forEach(c=>{c.checked=false;c.dispatchEvent(new Event('change'));});});wrap.insertAdjacentElement('afterend',reset);
}
function renderChecklist(obj){
 if(!obj)return;setHead('checklist',obj);const b=body('checklist');if(!b)return;
 b.innerHTML='<div class="checklist">'+(obj.items||[]).map(x=>'<div class="check-item">'+esc(x)+'</div>').join('')+'</div>'+noteBox(obj.note);
 const wrap=b.querySelector('.checklist');if(wrap)setupChecklistState(obj,wrap);
}
function renderEmergency(obj){
 if(!obj)return;setHead('emergency',obj);const b=body('emergency');if(!b)return;
 b.innerHTML='<div class="emergency-grid">'+(obj.items||[]).map(x=>'<div class="emergency-card"><div class="emergency-number">'+esc(x.number||'')+'</div><div class="emergency-title">'+esc(x.title||'')+'</div><div class="emergency-note">'+esc(x.note||'')+'</div></div>').join('')+'</div>'+noteBox(obj.note);
}
function refreshMapPins(){[0,80,250,600].forEach(t=>setTimeout(()=>{if(typeof window.addMapPins==='function')try{window.addMapPins();}catch(e){}},t));}
function render(){
 if(!/(?:^|\/)trip-info\.html$/.test(location.pathname))return 0;
 const d=data();if(!d)return 0;
 ensureStyles();renderOverview(d);renderNav(d);
 renderCards('transport',d.transport);renderCards('car',d.car);renderHotels(d.hotelStays);renderParking(d.parking);renderHardCuts(d.hardCuts);renderWeather(d.weather);renderChecklist(d.checklist);renderEmergency(d.emergency);
 const present=new Set(['transport','car','hotels','parking','hardcuts','weather','checklist','emergency'].filter(id=>({transport:d.transport,car:d.car,hotels:d.hotelStays,parking:d.parking,hardcuts:d.hardCuts,weather:d.weather,checklist:d.checklist,emergency:d.emergency})[id]));
 hideMissing(['transport','car','hotels','parking','hardcuts','weather','checklist','emergency'],present);
 document.documentElement.dataset.tripInfoRenderer=mode();document.documentElement.dataset.tripInfoData='trip-info.json';refreshMapPins();
 document.dispatchEvent(new CustomEvent('multitrip:tripinforendered',{detail:{mode:mode(),tripId:tripId()}}));
 return present.size;
}

window.MultiTripTripInfoRenderer={__v1:true,render,mode};
Promise.all([
 window.MultiTrip&&window.MultiTrip.ready?window.MultiTrip.ready:Promise.resolve(),
 window.MultiTripData&&window.MultiTripData.ready?window.MultiTripData.ready:Promise.resolve()
]).then(()=>{render();[250,900].forEach(t=>setTimeout(render,t));}).catch(err=>console.error('Multi Trip Trip Info renderer failed',err));
})();
