(function(){
'use strict';
if(window.__japan2027DrivingModeV1)return;
window.__japan2027DrivingModeV1=true;

const CORE=window.Japan2027Core||null;
const PREVIEW_KEY='japan2027_travel_mode_preview_day';
const INDEX_PREFIX='japan2027_drive_index_';
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let wakeLock=null;
let activeDay='d1';
let activeIndex=0;

function tokyoParts(){
 try{
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()),o={};
  p.forEach(x=>o[x.type]=x.value);
  return{date:o.year+'-'+o.month+'-'+o.day,minutes:Number(o.hour)*60+Number(o.minute),time:o.hour+':'+o.minute};
 }catch(e){const d=new Date();return{date:d.toISOString().slice(0,10),minutes:d.getHours()*60+d.getMinutes(),time:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};}
}
function parseTime(v){const m=String(v||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null;}
function text(el){return(el&&el.textContent||'').replace(/\s+/g,' ').trim();}
function dayLabel(id){return'D'+String(id||'d1').replace(/\D/g,'');}
function dayForDate(date){if(!CORE||!CORE.days)return null;return Object.values(CORE.days).find(d=>d.date===date)||null;}
function initialDay(){
 const q=new URLSearchParams(location.search).get('day');if(/^d[1-9]$/.test(q||''))return q;
 const hit=dayForDate(tokyoParts().date);if(hit)return hit.id;
 const saved=localStorage.getItem(PREVIEW_KEY)||'';return /^d[1-9]$/.test(saved)?saved:'d1';
}
function extractItems(day){
 return $$('.timeline-item',day).map((item,idx)=>{
  const timeEl=$('.time',item),endEl=$('.end-time',item),card=$('.timeline-card',item),h=$('h3',item),type=$('.event-type',item),p=$('p',item);
  let start='';
  if(timeEl){const c=timeEl.cloneNode(true);c.querySelectorAll('.end-time').forEach(x=>x.remove());start=text(c);}
  const pin=item.querySelector('a.map-pin[href]');
  return{idx,start,end:text(endEl),minutes:parseTime(start),type:text(type),title:text(h),desc:text(p),map:h&&(h.dataset.map||'')||'',href:pin&&pin.href||'',hard:!!(card&&card.classList.contains('hard-cut')),hotelEnd:!!(card&&card.classList.contains('hotel-end-marker'))};
 }).filter(x=>x.title||x.start);
}
function defaultIndex(items,actual){
 if(!items.length)return 0;
 const saved=sessionStorage.getItem(INDEX_PREFIX+activeDay);
 if(saved!=null&&/^\d+$/.test(saved))return Math.min(items.length-1,Number(saved));
 if(!actual)return 0;
 const now=tokyoParts().minutes;let i=items.findIndex(x=>x.minutes!=null&&x.minutes>=now);if(i<0)i=items.length-1;return Math.max(0,i);
}
function destinationQuery(item){return(item&&(item.map||item.title))||'';}
function directionsUrl(item){const q=destinationQuery(item);return q?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(q)+'&travelmode=driving':'https://www.google.com/maps';}
function searchUrl(item){if(item&&item.href)return item.href;const q=destinationQuery(item);return'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q||'');}
function findParking(items,index){return items.slice(Math.max(0,index),Math.min(items.length,index+5)).find(x=>/駐車場|parking|停車/i.test((x.map||'')+' '+x.title+' '+x.type))||null;}
function findHotel(items){return[...items].reverse().find(x=>x.hotelEnd)||[...items].reverse().find(x=>/check-?in|酒店|住宿|旅館|hotel|ryokan|今日完結/i.test(x.type+' '+x.title))||null;}
function findHard(items){return items.find(x=>x.hard||/hard\s*cut|最遲|deadline|絕對/i.test(x.type+' '+x.title+' '+x.desc))||null;}
function countdown(item,actual){if(!actual||!item||item.minutes==null)return'';const d=item.minutes-tokyoParts().minutes;if(d===0)return'原定而家出發';if(d>0){const h=Math.floor(d/60),m=d%60;return'距原定時間 '+(h?h+'小時 ':'')+(m?m+'分鐘':'');}const a=Math.abs(d),h=Math.floor(a/60),m=a%60;return'原定時間已過 '+(h?h+'小時 ':'')+(m?m+'分鐘':'');}
function weatherText(code){const c=Number(code);if(c===0)return['☀️','晴天'];if(c<=2)return['⛅','大致晴朗／多雲'];if(c===3)return['☁️','多雲／陰天'];if(c===45||c===48)return['🌫️','有霧'];if(c>=61&&c<=67)return['🌧️','有雨'];if(c>=71&&c<=77||c===85||c===86)return['🌨️','有雪'];if(c>=95)return['⛈️','雷暴'];return['🌡️','天氣'];}
function km(v){const x=Number(v);return Number.isFinite(x)?(x/1000).toFixed(x>=10000?0:1)+' km':'—';}
function cm(v){const x=Number(v);if(!Number.isFinite(x))return'—';const c=x*100;return(c>=10?Math.round(c):Math.round(c*10)/10)+' cm';}
function closestSnow(data){const h=data&&data.hourly;if(!h||!h.time||!h.snow_depth||!h.time.length)return null;const target=Date.parse((data.current&&data.current.time)||h.time[0]);let best=0,dist=Infinity;h.time.forEach((t,i)=>{const d=Math.abs(Date.parse(t)-target);if(d<dist){dist=d;best=i;}});return h.snow_depth[best];}

function addStyle(){
 if($('#drivingModeStyleV1'))return;
 const s=document.createElement('style');s.id='drivingModeStyleV1';s.textContent=`
 #drivingModeOverlay{position:fixed;inset:0;z-index:9200;background:#e9eef2;color:#172b3a;overflow:auto;font-family:Arial,"Microsoft JhengHei","Noto Sans TC",sans-serif}
 .dm-head{position:sticky;top:0;z-index:5;background:#102f49;color:#fff;padding:11px 12px;box-shadow:0 2px 9px rgba(0,0,0,.2)}.dm-head-row{max-width:880px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:10px}.dm-head h1{font-size:20px;margin:0}.dm-head-sub{font-size:10px;opacity:.88;margin-top:3px}.dm-close{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;border-radius:9px;padding:8px 10px;font-weight:900}
 .dm-wrap{max-width:880px;margin:auto;padding:11px 11px 85px}.dm-safety{background:#fff6dc;border:1px solid #e3c871;color:#6d5400;border-radius:10px;padding:8px 10px;font-size:10px;line-height:1.45;margin-bottom:9px}.dm-days{display:flex;gap:6px;overflow-x:auto;padding:1px 0 9px}.dm-day{flex:0 0 auto;border:1px solid #c6d5df;background:#f4f7f9;color:#234d69;border-radius:17px;padding:7px 10px;font-weight:900}.dm-day.active{background:#1f4e79;color:#fff;border-color:#1f4e79}
 .dm-card{background:#fff;border-radius:14px;padding:13px;margin-bottom:10px;box-shadow:0 2px 7px rgba(0,0,0,.07)}.dm-kicker{font-size:9px;font-weight:900;color:#71828d;letter-spacing:.4px}.dm-time{font-size:34px;font-weight:1000;color:#174d72;line-height:1.05;margin-top:5px}.dm-title{font-size:25px;font-weight:1000;line-height:1.25;margin:5px 0;color:#162f41}.dm-type{font-size:10px;font-weight:900;color:#68808f}.dm-desc{font-size:12px;line-height:1.55;color:#52646f;margin-top:5px}.dm-countdown{display:inline-block;margin-top:8px;padding:5px 8px;border-radius:12px;background:#e9f3f9;color:#285c7c;font-size:10px;font-weight:900}
 .dm-nav{display:block;width:100%;margin-top:12px;border:0;border-radius:12px;background:#267a45;color:#fff;text-align:center;text-decoration:none;padding:15px 12px;font-size:18px;font-weight:1000}.dm-map-secondary{display:inline-flex;margin-top:7px;text-decoration:none;background:#eef4f8;color:#1f4e79;border:1px solid #ccdae3;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:900}
 .dm-controls{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:7px;margin-top:10px}.dm-control{border:1px solid #cad7df;background:#fff;color:#234d69;border-radius:10px;padding:10px 6px;font-weight:900;font-size:11px}.dm-control.primary{background:#1f4e79;color:#fff;border-color:#1f4e79}.dm-control:disabled{opacity:.38}
 .dm-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.dm-mini{background:#fff;border-radius:12px;padding:11px;box-shadow:0 2px 7px rgba(0,0,0,.06);min-height:110px}.dm-mini h3{font-size:12px;color:#1f4e79;margin:0 0 6px}.dm-mini strong{font-size:13px}.dm-mini p{font-size:10px;color:#60717c;line-height:1.5;margin:5px 0 0}.dm-mini .dm-map-secondary{font-size:10px}
 .dm-road-ok{color:#2b6a3f}.dm-road-warn{color:#8a5e00}.dm-road-bad{color:#9a332b}.dm-weather-main{display:flex;gap:8px;align-items:center}.dm-weather-icon{font-size:27px}.dm-weather-temp{font-size:20px;font-weight:1000}.dm-weather-line{font-size:9px;line-height:1.55;color:#566b78;margin-top:5px}
 .dm-bottom{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;margin-top:11px}.dm-bottom a,.dm-bottom button{border:1px solid #cad9e3;background:#fff;color:#1f4e79;border-radius:9px;padding:9px 10px;text-decoration:none;font-size:10px;font-weight:900}.dm-bottom button.active{background:#fff3c7;color:#725700;border-color:#e3ca6c}
 @media(max-width:700px){.dm-grid{grid-template-columns:1fr}.dm-title{font-size:23px}.dm-time{font-size:31px}.dm-controls{grid-template-columns:1fr 1fr}.dm-control.primary{grid-column:1/-1}.dm-head h1{font-size:18px}}
 `;document.head.appendChild(s);
}

function createOverlay(){
 let o=$('#drivingModeOverlay');if(o)return o;
 addStyle();o=document.createElement('div');o.id='drivingModeOverlay';o.hidden=true;o.innerHTML=`
 <div class="dm-head"><div class="dm-head-row"><div><h1>🚗 揸車模式</h1><div class="dm-head-sub" id="dmHeadSub">Japan Winter 2027</div></div><button class="dm-close" id="dmClose">返回行程</button></div></div>
 <div class="dm-wrap"><div class="dm-safety">⚠️ 駕駛期間請由乘客操作；司機要操作手機請先安全停車。Google Maps 開啟後會提供實時路線同 ETA。</div><div class="dm-days" id="dmDays"></div><div id="dmBody"></div></div>`;
 document.body.appendChild(o);$('#dmClose',o).onclick=close;return o;
}
function close(){
 const o=$('#drivingModeOverlay');if(o)o.hidden=true;document.body.style.overflow='';releaseWake();
 const u=new URL(location.href);u.searchParams.delete('drive');u.searchParams.delete('day');history.replaceState({},'',u.pathname+(u.search||'')+(u.hash||''));
 document.querySelectorAll('.page-switch a[data-driving-mode-link]').forEach(a=>a.classList.remove('active'));
 const normal=document.querySelector('.page-switch a[href="itinerary.html"],.page-switch a[href$="/itinerary.html"]');if(normal)normal.classList.add('active');
}
function open(dayId){const o=createOverlay();o.hidden=false;document.body.style.overflow='hidden';renderDay(dayId||initialDay());}

function renderDay(dayId,forcedIndex){
 const day=document.getElementById(dayId);if(!day)return;activeDay=dayId;localStorage.setItem(PREVIEW_KEY,dayId);
 const o=createOverlay(),coreDay=CORE&&CORE.days&&CORE.days[dayId],tp=tokyoParts(),actual=!!(coreDay&&coreDay.date===tp.date),items=extractItems(day);
 if(!items.length){$('#dmBody',o).innerHTML='<div class="dm-card">今日冇可用行程資料。</div>';return;}
 activeIndex=forcedIndex==null?defaultIndex(items,actual):Math.max(0,Math.min(items.length-1,forcedIndex));sessionStorage.setItem(INDEX_PREFIX+dayId,String(activeIndex));
 const cur=items[activeIndex],next=items[activeIndex+1]||null,parking=findParking(items,activeIndex),hotel=findHotel(items),hard=findHard(items),date=text($('.day-date',day));
 $('#dmHeadSub',o).textContent=dayLabel(dayId)+'｜'+date+(actual?'｜日本時間 '+tp.time:'｜預覽模式');
 $('#dmDays',o).innerHTML=Object.keys((CORE&&CORE.days)||{d1:1,d2:1,d3:1,d4:1,d5:1,d6:1,d7:1,d8:1,d9:1}).map(id=>'<button class="dm-day '+(id===dayId?'active':'')+'" data-dm-day="'+id+'">'+dayLabel(id)+'</button>').join('');
 $$('.dm-day',o).forEach(b=>b.onclick=()=>{sessionStorage.removeItem(INDEX_PREFIX+b.dataset.dmDay);renderDay(b.dataset.dmDay);});
 const cd=countdown(cur,actual),parkingHtml=parking?'<h3>🅿️ 下一個停車點</h3><strong>'+esc(parking.title)+'</strong><p>'+esc(parking.map||parking.desc||'')+'</p><a class="dm-map-secondary" href="'+esc(directionsUrl(parking))+'" target="_blank" rel="noopener">🅿️ 導航去停車場</a>':'<h3>🅿️ 停車</h3><p>未有獨立停車場標記；到埗前請以景點／官方停車資訊為準。</p>';
 const hotelHtml=hotel?'<h3>🏨 今日住宿／終點</h3><strong>'+esc((hotel.start?hotel.start+' · ':'')+hotel.title)+'</strong><p>'+esc(hotel.desc)+'</p><a class="dm-map-secondary" href="'+esc(directionsUrl(hotel))+'" target="_blank" rel="noopener">🏨 酒店導航</a>':'<h3>🏨 今日住宿／終點</h3><p>請睇完整行程最後一段。</p>';
 const hardHtml=hard?'<h3>⏰ 今日時間底線</h3><strong>'+esc((hard.start?hard.start+' · ':'')+hard.title)+'</strong><p>'+esc(hard.desc)+'</p>':'<h3>⏰ 時間底線</h3><p>今日冇獨立 Hard Cut 標記；冬季道路安全優先。</p>';
 $('#dmBody',o).innerHTML=`
 <section class="dm-card"><div class="dm-kicker">${actual?'NOW / NEXT DESTINATION':'PREVIEW DESTINATION'} · ${activeIndex+1}/${items.length}</div><div class="dm-time">${esc(cur.start||'—')}</div><div class="dm-type">${esc(cur.type)}</div><div class="dm-title">${esc(cur.title)}</div><div class="dm-desc">${esc(cur.desc)}</div>${cd?'<div class="dm-countdown">⏱️ '+esc(cd)+'</div>':''}<a class="dm-nav" href="${esc(directionsUrl(cur))}" target="_blank" rel="noopener">🚗 開 Google Maps 導航</a><a class="dm-map-secondary" href="${esc(searchUrl(cur))}" target="_blank" rel="noopener">📍 只睇地點</a><div class="dm-controls"><button class="dm-control" id="dmPrev" ${activeIndex===0?'disabled':''}>← 上一站</button><button class="dm-control" id="dmAuto">🕒 按時間自動</button><button class="dm-control primary" id="dmNext" ${activeIndex>=items.length-1?'disabled':''}>✅ 已到達／下一站 →</button></div></section>
 <div class="dm-grid"><section class="dm-mini" id="dmWeather"><h3>🌨️ 冬季行車天氣</h3><p>讀取中…</p></section><section class="dm-mini">${parkingHtml}</section><section class="dm-mini">${hardHtml}</section></div>
 <section class="dm-card"><div class="dm-kicker">AFTER THIS</div><div style="font-weight:1000;font-size:15px;color:#1f4e79;margin-top:4px">${next?'下一站：'+esc((next.start?next.start+' · ':'')+next.title):'今日已經係最後一站'}</div>${next?'<div class="dm-desc">'+esc(next.desc)+'</div>':''}</section>
 <section class="dm-card">${hotelHtml}</section>
 <div class="dm-bottom"><a href="live.html#${dayId}">📹 Live Cam</a><a href="itinerary.html#weather3dPanel">🌤️ 5 日天氣</a><a href="itinerary.html#${dayId}">🗓️ 完整行程</a><button id="dmWake">☀️ 保持螢幕常亮</button></div>`;
 $('#dmPrev',o).onclick=()=>renderDay(dayId,activeIndex-1);$('#dmNext',o).onclick=()=>renderDay(dayId,activeIndex+1);$('#dmAuto',o).onclick=()=>{sessionStorage.removeItem(INDEX_PREFIX+dayId);renderDay(dayId);};
 $('#dmWake',o).onclick=toggleWake;updateWakeButton();loadWeather(dayId);
}

function loadWeather(dayId){
 const box=$('#dmWeather');if(!box||!CORE)return;const regionId=CORE.weatherRegionForDay(dayId),r=CORE.regions&&CORE.regions[regionId];if(!r)return;
 const url='https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(r.lat)+'&longitude='+encodeURIComponent(r.lon)+'&current='+encodeURIComponent('temperature_2m,apparent_temperature,weather_code,wind_gusts_10m,visibility,snowfall')+'&hourly=snow_depth&timezone=Asia%2FTokyo&forecast_days=1';
 fetch(url,{cache:'no-store'}).then(x=>{if(!x.ok)throw new Error('weather');return x.json();}).then(data=>{
  const c=data.current||{},w=weatherText(c.weather_code),snow=closestSnow(data),temp=Number(c.temperature_2m),vis=Number(c.visibility),gust=Number(c.wind_gusts_10m),fall=Number(c.snowfall);let cls='dm-road-ok',msg='✅ 暫未見明顯天氣警示';
  const alerts=[];if(Number.isFinite(temp)&&temp<=2)alerts.push('低溫，留意結冰');if(Number.isFinite(fall)&&fall>0)alerts.push('正在降雪');if(Number.isFinite(vis)&&vis<5000)alerts.push('能見度偏低');if(Number.isFinite(gust)&&gust>=40)alerts.push('陣風較強');if(alerts.length){cls=alerts.length>=2?'dm-road-bad':'dm-road-warn';msg='⚠️ '+alerts.join('・');}
  box.innerHTML='<h3>🌨️ '+esc(r.name)+' 行車天氣提示</h3><div class="dm-weather-main"><span class="dm-weather-icon">'+w[0]+'</span><div><div class="dm-weather-temp">'+(c.temperature_2m==null?'—':Math.round(c.temperature_2m)+'°C')+'</div><div style="font-size:10px;font-weight:900">'+w[1]+'｜體感 '+(c.apparent_temperature==null?'—':Math.round(c.apparent_temperature)+'°C')+'</div></div></div><div class="dm-weather-line">👁️ '+km(c.visibility)+'｜💨 陣風 '+(c.wind_gusts_10m==null?'—':Math.round(c.wind_gusts_10m)+' km/h')+'<br>❄️ 新降雪 '+(c.snowfall==null?'—':Number(c.snowfall).toFixed(1)+' cm')+'｜☃️ 積雪 '+cm(snow)+'</div><p class="'+cls+'"><strong>'+msg+'</strong></p><p>只係天氣提示，唔代表實際路面狀況。</p>';
 }).catch(()=>{box.innerHTML='<h3>🌨️ 冬季行車天氣</h3><p>暫時攞唔到即時資料；請睇 5 日天氣同 Live Cam。</p>';});
}

async function toggleWake(){
 if(wakeLock){await releaseWake();updateWakeButton();return;}
 if(!('wakeLock' in navigator)){const b=$('#dmWake');if(b)b.textContent='此裝置唔支援常亮';return;}
 try{wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null;updateWakeButton();});}catch(e){}updateWakeButton();
}
async function releaseWake(){if(wakeLock){try{await wakeLock.release();}catch(e){}wakeLock=null;}}
function updateWakeButton(){const b=$('#dmWake');if(!b)return;b.classList.toggle('active',!!wakeLock);b.textContent=wakeLock?'☀️ 螢幕常亮中':'☀️ 保持螢幕常亮';}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&wakeLock)toggleWake().then(()=>toggleWake()).catch(()=>{});});

function bindEntry(){
 const p=new URLSearchParams(location.search);if(p.get('drive')==='1')setTimeout(()=>open(initialDay()),220);
 document.addEventListener('click',function(e){const a=e.target.closest&&e.target.closest('a[data-driving-mode-link]');if(!a||!/(?:^|\/)itinerary\.html$/.test(location.pathname))return;e.preventDefault();open(initialDay());},true);
}
function boot(){let n=0;const go=()=>{n++;if(document.getElementById('d1')){bindEntry();return;}if(n<14)setTimeout(go,n<5?120:300);};go();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.Japan2027DrivingMode={open,close,renderDay};
})();
