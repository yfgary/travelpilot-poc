(function(){
'use strict';
if(window.__japan2027TravelModeV1)return;
window.__japan2027TravelModeV1=true;

const CORE=window.Japan2027Core||null;
const PREVIEW_KEY='japan2027_travel_mode_preview_day';
const $=(s,r)=> (r||document).querySelector(s);
const $$=(s,r)=> [...(r||document).querySelectorAll(s)];
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mapUrl=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q||'');

function tokyoParts(){
 try{
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
  const o={};p.forEach(x=>o[x.type]=x.value);
  return {date:o.year+'-'+o.month+'-'+o.day,minutes:Number(o.hour)*60+Number(o.minute),time:o.hour+':'+o.minute};
 }catch(e){const d=new Date();return{date:d.toISOString().slice(0,10),minutes:d.getHours()*60+d.getMinutes(),time:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};}
}
function parseTime(v){const m=String(v||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null;}
function text(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
function dayForDate(date){if(!CORE||!CORE.days)return null;return Object.values(CORE.days).find(d=>d.date===date)||null;}
function currentDayId(){const t=tokyoParts(),hit=dayForDate(t.date);if(hit)return hit.id;const saved=localStorage.getItem(PREVIEW_KEY);return /^d[1-9]$/.test(saved||'')?saved:'d1';}
function dayLabel(id){return 'D'+String(id||'d1').replace(/\D/g,'');}

function extractItems(day){
 return $$('.timeline-item',day).map((item,idx)=>{
  const timeEl=$('.time',item),endEl=$('.end-time',item),card=$('.timeline-card',item),h=$('h3',item),type=$('.event-type',item),p=$('p',item);
  let start='';
  if(timeEl){
   const clone=timeEl.cloneNode(true);clone.querySelectorAll('.end-time').forEach(x=>x.remove());start=text(clone);
  }
  const map=h&&(h.dataset.map||'')||'';
  const pin=item.querySelector('a.map-pin[href]');
  return {idx,start,end:text(endEl),minutes:parseTime(start),type:text(type),title:text(h),desc:text(p),map,href:pin&&pin.href||'',hard:!!(card&&card.classList.contains('hard-cut')),hotelEnd:!!(card&&card.classList.contains('hotel-end-marker')),raw:item};
 }).filter(x=>x.title||x.start);
}
function findNext(items,isActualToday){
 if(!items.length)return{current:null,next:null,index:-1};
 if(!isActualToday)return{current:null,next:items[0],index:0};
 const now=tokyoParts().minutes;
 let nextIndex=items.findIndex(x=>x.minutes!=null&&x.minutes>=now);
 if(nextIndex<0)nextIndex=items.length;
 const current=nextIndex>0?items[nextIndex-1]:null;
 const next=nextIndex<items.length?items[nextIndex]:null;
 return{current,next,index:nextIndex};
}
function usefulMap(item){if(!item)return'';return item.href||mapUrl(item.map||item.title);}
function findParking(items,fromIndex){
 const arr=items.slice(Math.max(0,fromIndex));
 return arr.find(x=>/駐車場|parking|停車/i.test((x.map||'')+' '+x.title))||null;
}
function findHotel(items){
 const explicit=[...items].reverse().find(x=>x.hotelEnd);
 if(explicit)return explicit;
 return [...items].reverse().find(x=>/check-?in|酒店|住宿|旅館|hotel|ryokan|今日完結/i.test(x.type+' '+x.title))||null;
}
function findHard(items){return items.find(x=>x.hard||/hard\s*cut|最遲|deadline|絕對/i.test(x.type+' '+x.title+' '+x.desc))||null;}
function weatherText(code){const c=Number(code);if(c===0)return['☀️','晴天'];if(c===1)return['🌤️','大致晴朗'];if(c===2)return['⛅','部分多雲'];if(c===3)return['☁️','多雲／陰天'];if(c===45||c===48)return['🌫️','有霧'];if(c>=51&&c<=57)return['🌦️','毛毛雨'];if(c>=61&&c<=67)return['🌧️','有雨'];if(c>=71&&c<=77)return['🌨️','有雪'];if(c>=80&&c<=82)return['🌦️','驟雨'];if(c===85||c===86)return['🌨️','驟雪'];if(c>=95)return['⛈️','雷暴'];return['🌡️','天氣'];}
function km(v){const x=Number(v);return Number.isFinite(x)?(x/1000).toFixed(x>=10000?0:1)+' km':'—';}
function cm(v){const x=Number(v);if(!Number.isFinite(x))return'—';const c=x*100;return(c>=10?Math.round(c):Math.round(c*10)/10)+' cm';}
function closestSnow(data){const h=data&&data.hourly;if(!h||!h.time||!h.snow_depth||!h.time.length)return null;const target=Date.parse((data.current&&data.current.time)||h.time[0]);let best=0,dist=Infinity;h.time.forEach((t,i)=>{const d=Math.abs(Date.parse(t)-target);if(d<dist){dist=d;best=i;}});return h.snow_depth[best];}

function addStyle(){
 if($('#travelModeStyleV1'))return;
 const s=document.createElement('style');s.id='travelModeStyleV1';s.textContent=`
 #travelModeOverlay{position:fixed;inset:0;z-index:9000;background:#eef2f6;overflow:auto;color:#243746;font-family:Arial,"Microsoft JhengHei","Noto Sans TC",sans-serif}
 .tm-head{position:sticky;top:0;z-index:3;background:linear-gradient(135deg,#163a5c,#28689d);color:#fff;padding:13px 14px;box-shadow:0 2px 8px rgba(0,0,0,.18)}
 .tm-head-row{max-width:920px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:10px}.tm-head h1{font-size:21px;margin:0}.tm-head-sub{font-size:11px;opacity:.9;margin-top:3px}.tm-close{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.14);color:#fff;border-radius:9px;padding:8px 11px;font-weight:800;cursor:pointer}
 .tm-wrap{max-width:920px;margin:auto;padding:12px 12px 80px}.tm-preview{padding:9px 11px;background:#fff7dd;border:1px solid #ead38c;border-radius:10px;color:#755900;font-size:11px;line-height:1.5;margin-bottom:10px}
 .tm-days{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px}.tm-day{flex:0 0 auto;border:1px solid #cadbe7;background:#eef4f8;color:#1f4e79;border-radius:18px;padding:7px 11px;font-weight:800;cursor:pointer}.tm-day.active{background:#1f4e79;color:#fff;border-color:#1f4e79}
 .tm-card{background:#fff;border-radius:14px;padding:14px;margin-bottom:11px;box-shadow:0 2px 8px rgba(0,0,0,.07)}.tm-kicker{font-size:10px;font-weight:900;color:#6d8291;text-transform:uppercase;letter-spacing:.3px}.tm-title{font-size:21px;font-weight:900;color:#1f4e79;line-height:1.35;margin-top:3px}.tm-route{font-size:12px;color:#596d7b;line-height:1.55;margin-top:6px}
 .tm-next{border-left:5px solid #2d7db2;background:#f7fbfe}.tm-next-time{font-size:30px;font-weight:900;color:#1f4e79}.tm-next-type{font-size:11px;color:#678090;font-weight:800}.tm-next-title{font-size:22px;font-weight:900;margin:4px 0;color:#273f50}.tm-desc{font-size:12px;line-height:1.6;color:#5a6872}.tm-now{display:inline-block;margin-top:8px;padding:5px 8px;border-radius:13px;background:#e7f4e9;color:#2e6c40;font-size:10px;font-weight:900}
 .tm-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.tm-btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border:0;border-radius:9px;background:#1f4e79;color:#fff;padding:9px 11px;font-size:12px;font-weight:900;cursor:pointer}.tm-btn.secondary{background:#edf3f7;color:#1f4e79;border:1px solid #cddce7}.tm-btn.green{background:#2f7c4c}
 .tm-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.tm-mini{background:#fff;border-radius:12px;padding:12px;box-shadow:0 2px 7px rgba(0,0,0,.06);min-height:105px}.tm-mini h3{margin:0 0 6px;font-size:13px;color:#1f4e79}.tm-mini strong{font-size:14px}.tm-mini p{margin:5px 0 0;font-size:11px;line-height:1.5;color:#61717c}
 .tm-weather-main{display:flex;gap:9px;align-items:center}.tm-weather-icon{font-size:31px}.tm-weather-temp{font-size:23px;font-weight:900}.tm-weather-metrics{font-size:10px;line-height:1.55;color:#536775;margin-top:6px}.tm-weather-loading{font-size:11px;color:#71818d}
 .tm-list{display:grid;gap:7px;margin-top:8px}.tm-row{display:grid;grid-template-columns:58px 1fr auto;gap:8px;align-items:start;padding:9px 0;border-top:1px solid #edf1f4}.tm-row:first-child{border-top:0}.tm-row-time{font-weight:900;color:#1f4e79;font-size:12px}.tm-row-title{font-weight:800;font-size:12px}.tm-row-type{font-size:9px;color:#72828d;margin-top:2px}.tm-map{font-size:18px;text-decoration:none}
 .tm-empty{font-size:12px;color:#71818d;line-height:1.6}.tm-footer-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;margin-top:14px}
 @media(max-width:720px){.tm-grid{grid-template-columns:1fr}.tm-title{font-size:19px}.tm-next-title{font-size:20px}.tm-next-time{font-size:27px}.tm-head h1{font-size:19px}.tm-btn{flex:1 1 auto}.tm-row{grid-template-columns:52px 1fr 28px}}
 `;document.head.appendChild(s);
}

function createOverlay(){
 let o=$('#travelModeOverlay');if(o)return o;
 addStyle();o=document.createElement('div');o.id='travelModeOverlay';o.hidden=true;o.innerHTML=`
  <div class="tm-head"><div class="tm-head-row"><div><h1>🧭 今日模式</h1><div class="tm-head-sub" id="tmHeadSub">Japan Winter 2027</div></div><button class="tm-close" id="tmClose">返回完整行程</button></div></div>
  <div class="tm-wrap"><div id="tmPreview"></div><div class="tm-days" id="tmDays"></div><div id="tmBody"></div></div>`;
 document.body.appendChild(o);
 $('#tmClose',o).onclick=close;
 return o;
}
function close(){const o=$('#travelModeOverlay');if(o)o.hidden=true;document.body.style.overflow='';const u=new URL(location.href);if(u.searchParams.get('travel')==='1'){u.searchParams.delete('travel');history.replaceState({},'',u.pathname+(u.search?u.search:'')+u.hash);}document.querySelectorAll('.page-switch a[data-travel-mode-link]').forEach(a=>a.classList.remove('active'));const normal=document.querySelector('.page-switch a[href="itinerary.html"],.page-switch a[href$="/itinerary.html"]');if(normal)normal.classList.add('active');}

function renderDay(dayId){
 const overlay=createOverlay(),day=document.getElementById('legacy-mode-'+dayId)||document.getElementById(dayId);if(!day)return;
 localStorage.setItem(PREVIEW_KEY,dayId);
 const t=tokyoParts(),coreDay=CORE&&CORE.days&&CORE.days[dayId],actual=!!(coreDay&&coreDay.date===t.date),items=extractItems(day),state=findNext(items,actual),parking=findParking(items,state.index<0?0:state.index),hotel=findHotel(items),hard=findHard(items);
 const title=text($('.day-title',day))||dayLabel(dayId),date=text($('.day-date',day)),route=text($('.day-route',day));
 $('#tmHeadSub',overlay).textContent=dayLabel(dayId)+'｜'+date+(actual?'｜日本時間 '+t.time:'｜預覽模式');
 $('#tmPreview',overlay).innerHTML=actual?'':'<div class="tm-preview">🧪 而家未到 2027 行程日，所以顯示<strong>預覽模式</strong>。旅行期間會自動開返當日 D1–D9，並按日本時間判斷「下一站」。</div>';
 $('#tmDays',overlay).innerHTML=Object.keys((CORE&&CORE.days)||{d1:1,d2:1,d3:1,d4:1,d5:1,d6:1,d7:1,d8:1,d9:1}).map(id=>'<button class="tm-day '+(id===dayId?'active':'')+'" data-tm-day="'+id+'">'+dayLabel(id)+'</button>').join('');
 $$('.tm-day',overlay).forEach(b=>b.onclick=()=>renderDay(b.dataset.tmDay));
 const next=state.next,current=state.current;
 let hero='';
 if(next){hero=`<section class="tm-card tm-next"><div class="tm-kicker">${actual?'NEXT STOP｜下一站':'PREVIEW｜第一站'}</div><div class="tm-next-time">${esc(next.start||'—')}</div><div class="tm-next-type">${esc(next.type)}</div><div class="tm-next-title">${esc(next.title)}</div><div class="tm-desc">${esc(next.desc)}</div>${current&&actual?'<span class="tm-now">而家：約 '+esc(current.start)+' '+esc(current.title)+'</span>':''}<div class="tm-actions"><a class="tm-btn green" href="${esc(usefulMap(next))}" target="_blank" rel="noopener">📍 Google Maps</a><a class="tm-btn secondary" href="itinerary.html#${dayId}">🗓️ 完整行程</a><a class="tm-btn secondary" href="live.html#${dayId}">📹 Live Cam</a></div></section>`;
 }else{hero=`<section class="tm-card tm-next"><div class="tm-kicker">TODAY</div><div class="tm-next-title">✅ 今日主要行程已完成</div><div class="tm-desc">可以睇今晚住宿資料，或者返回完整行程。</div></section>`;}
 const parkHtml=parking?`<h3>🅿️ 下一個停車／導航點</h3><strong>${esc(parking.title)}</strong><p>${esc(parking.map||parking.desc||'')}</p><div class="tm-actions"><a class="tm-btn secondary" href="${esc(usefulMap(parking))}" target="_blank" rel="noopener">📍 導航</a></div>`:`<h3>🅿️ 停車／導航</h3><p>今段行程未有獨立停車場標記；用下一站 Google Maps 為準。</p>`;
 const hotelHtml=hotel?`<h3>🏨 今日住宿／結束</h3><strong>${esc(hotel.start?hotel.start+' · ':'')}${esc(hotel.title)}</strong><p>${esc(hotel.desc)}</p>${hotel.map||hotel.href?'<div class="tm-actions"><a class="tm-btn secondary" href="'+esc(usefulMap(hotel))+'" target="_blank" rel="noopener">📍 酒店導航</a></div>':''}`:`<h3>🏨 今日住宿／結束</h3><p>請參考今日完整行程最後一段。</p>`;
 const hardHtml=hard?`<h3>⏰ 今日時間底線</h3><strong>${esc(hard.start)} · ${esc(hard.title)}</strong><p>${esc(hard.desc)}</p>`:`<h3>⏰ 今日時間底線</h3><p>今日冇獨立 Hard Cut 標記；冬季仍然以道路安全同酒店 Check-in 為先。</p>`;
 const start=Math.max(0,state.index<0?0:state.index),upcoming=items.slice(start,start+5);
 const list=upcoming.length?upcoming.map(x=>`<div class="tm-row"><div class="tm-row-time">${esc(x.start||'—')}</div><div><div class="tm-row-title">${esc(x.title)}</div><div class="tm-row-type">${esc(x.type)}</div></div><a class="tm-map" href="${esc(usefulMap(x))}" target="_blank" rel="noopener" aria-label="導航">📍</a></div>`).join(''):'<div class="tm-empty">今日冇更多行程。</div>';
 $('#tmBody',overlay).innerHTML=`
  <section class="tm-card"><div class="tm-kicker">${esc(dayLabel(dayId))}</div><div class="tm-title">${esc(title)}</div><div class="tm-route">${esc(route)}</div></section>
  ${hero}
  <div class="tm-grid"><section class="tm-mini" id="tmWeather"><h3>🌤️ 今日天氣</h3><div class="tm-weather-loading">讀取中…</div></section><section class="tm-mini">${parkHtml}</section><section class="tm-mini">${hotelHtml}</section></div>
  <section class="tm-card">${hardHtml}</section>
  <section class="tm-card"><div class="tm-kicker">UP NEXT</div><div class="tm-title" style="font-size:17px">之後行程</div><div class="tm-list">${list}</div></section>
  <div class="tm-footer-actions"><a class="tm-btn secondary" href="trip-info.html">🧳 旅程資料</a><a class="tm-btn secondary" href="attractions.html">🗾 景點總覽</a><button class="tm-btn" id="tmBackBottom">返回完整行程</button></div>`;
 $('#tmBackBottom',overlay).onclick=close;
 loadWeather(dayId);
}

function loadWeather(dayId){
 const box=$('#tmWeather');if(!box||!CORE)return;
 const regionId=CORE.weatherRegionForDay(dayId),r=CORE.regions&&CORE.regions[regionId];if(!r)return;
 const url='https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(r.lat)+'&longitude='+encodeURIComponent(r.lon)+'&current='+encodeURIComponent('temperature_2m,apparent_temperature,weather_code,wind_gusts_10m,visibility,snowfall')+'&hourly=snow_depth&timezone=Asia%2FTokyo&forecast_days=1';
 fetch(url,{cache:'no-store'}).then(x=>{if(!x.ok)throw new Error('weather');return x.json();}).then(data=>{
  const c=data.current||{},w=weatherText(c.weather_code),snow=closestSnow(data);
  box.innerHTML='<h3>🌤️ '+esc(r.name)+' 即時天氣</h3><div class="tm-weather-main"><span class="tm-weather-icon">'+w[0]+'</span><div><div class="tm-weather-temp">'+(c.temperature_2m==null?'—':Math.round(c.temperature_2m)+'°C')+'</div><div style="font-size:11px;font-weight:800">'+w[1]+'｜體感 '+(c.apparent_temperature==null?'—':Math.round(c.apparent_temperature)+'°C')+'</div></div></div><div class="tm-weather-metrics">👁️ 能見度 '+km(c.visibility)+'<br>💨 陣風 '+(c.wind_gusts_10m==null?'—':Math.round(c.wind_gusts_10m)+' km/h')+'<br>❄️ 新降雪 '+(c.snowfall==null?'—':Number(c.snowfall).toFixed(1)+' cm')+'｜☃️ 積雪 '+cm(snow)+'</div><div class="tm-actions"><a class="tm-btn secondary" href="itinerary.html#weather3dPanel">🌤️ 睇 5 日預測</a></div>';
 }).catch(()=>{box.innerHTML='<h3>🌤️ 今日天氣</h3><p>目前暫時攞唔到即時天氣；可以返回主頁天氣區睇離線快取。</p><div class="tm-actions"><a class="tm-btn secondary" href="itinerary.html#weather3dPanel">🌤️ 天氣預測</a></div>';});
}

function open(dayId){const o=createOverlay();o.hidden=false;document.body.style.overflow='hidden';renderDay(dayId||currentDayId());}
function bindEntry(){
 const params=new URLSearchParams(location.search);
 if(params.get('travel')==='1')setTimeout(()=>open(currentDayId()),180);
 const old=document.getElementById('todayBtn');if(old&&!old.dataset.tmBound){old.dataset.tmBound='1';old.textContent='🧭 今日模式';old.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();open(currentDayId());},true);}
 document.addEventListener('click',function(e){const a=e.target.closest&&e.target.closest('a[data-travel-mode-link]');if(!a||!/(?:^|\/)itinerary\.html$/.test(location.pathname))return;e.preventDefault();open(currentDayId());},true);
}

function boot(){let n=0;const go=()=>{n++;if(document.getElementById('d1')){bindEntry();return;}if(n<12)setTimeout(go,n<4?120:300);};go();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.Japan2027TravelMode={open,close,renderDay};
})();