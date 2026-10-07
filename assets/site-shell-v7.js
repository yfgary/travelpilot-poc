(function(){
'use strict';

if(window.__japan2027SiteShellV7)return;
window.__japan2027SiteShellV7=true;

const DEFAULT_TRIP='shirakawago-shinhotaka-2027';
const WEATHER_CACHE_KEY='japan2027_weather_cache_v2';
const WEATHER_REGION_KEY='japan2027_weather_region';
const WEATHER_TTL=10*60*1000;
const SH_KEY='japanWinter2027_shinhotakaDay';

const REGIONS=[
 {id:'matsumoto',name:'松本',jp:'松本市',lat:36.2381,lon:137.9720},
 {id:'karuizawa',name:'輕井澤',jp:'軽井沢町',lat:36.3485,lon:138.5969},
 {id:'chikuma',name:'千曲',jp:'千曲市',lat:36.5330,lon:138.1200},
 {id:'yamanouchi',name:'山之內／澀溫泉',jp:'山ノ内町・渋温泉',lat:36.7344,lon:138.4331},
 {id:'nagano',name:'長野／須坂',jp:'長野市・須坂市',lat:36.6486,lon:138.2450},
 {id:'hakuba',name:'白馬',jp:'白馬村',lat:36.6982,lon:137.8619},
 {id:'takayama',name:'高山',jp:'高山市',lat:36.1461,lon:137.2522},
 {id:'shinhotaka',name:'新穗高',jp:'新穂高ロープウェイ周辺',lat:36.2828,lon:137.5804},
 {id:'shirakawago',name:'白川鄉',jp:'白川郷・荻町',lat:36.2573,lon:136.9068}
];

function japanDateKey(){
 try{
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const o={};p.forEach(x=>o[x.type]=x.value);return o.year+'-'+o.month+'-'+o.day;
 }catch(e){return new Date().toISOString().slice(0,10);}
}
function japanTimeLabel(date){
 try{return new Intl.DateTimeFormat('zh-HK',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(date||new Date());}
 catch(e){return '';}
}

function getDefaultRegion(){
 const saved=localStorage.getItem(WEATHER_REGION_KEY);if(REGIONS.some(r=>r.id===saved))return saved;
 const d=japanDateKey();const sh=localStorage.getItem(SH_KEY)||'';
 const fixed={'2027-01-09':'matsumoto','2027-01-10':'karuizawa','2027-01-11':'yamanouchi','2027-01-12':'yamanouchi','2027-01-13':'hakuba','2027-01-17':'matsumoto'};
 if(d==='2027-01-14')return sh==='d6'?'shinhotaka':'shirakawago';
 if(d==='2027-01-15'){
  if(sh==='d7')return 'shinhotaka';
  if(sh==='d6')return 'shirakawago';
  return 'takayama';
 }
 if(d==='2027-01-16')return sh==='d8'?'shinhotaka':'takayama';
 return fixed[d]||'matsumoto';
}
function weatherText(code){
 const c=Number(code);if(c===0)return['☀️','晴天'];if(c===1)return['🌤️','大致晴朗'];if(c===2)return['⛅','部分多雲'];if(c===3)return['☁️','多雲／陰天'];if(c===45||c===48)return['🌫️','有霧'];if(c>=51&&c<=57)return['🌦️','毛毛雨'];if(c>=61&&c<=67)return['🌧️','有雨'];if(c>=71&&c<=77)return['🌨️','有雪'];if(c>=80&&c<=82)return['🌦️','驟雨'];if(c===85||c===86)return['🌨️','驟雪'];if(c>=95)return['⛈️','雷暴'];return['🌡️','天氣'];
}
function formatDate(s){const d=new Date(s+'T12:00:00');const w=['日','一','二','三','四','五','六'];return(d.getMonth()+1)+'/'+d.getDate()+' ('+w[d.getDay()]+')';}
function readCache(){try{return JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY)||'{}');}catch(e){return{};}}
function writeCache(c){try{localStorage.setItem(WEATHER_CACHE_KEY,JSON.stringify(c));}catch(e){}}
function km(v){return v==null?'—':(Number(v)/1000).toFixed(Number(v)>=10000?0:1)+' km';}
function weatherApiUrl(r){
 const current=['temperature_2m','relative_humidity_2m','apparent_temperature','precipitation','snowfall','weather_code','cloud_cover','wind_speed_10m','wind_gusts_10m','visibility'].join(',');
 const daily=['weather_code','temperature_2m_max','temperature_2m_min','apparent_temperature_max','apparent_temperature_min','precipitation_probability_max','snowfall_sum','wind_gusts_10m_max','visibility_mean','visibility_min','visibility_max'].join(',');
 return'https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(r.lat)+'&longitude='+encodeURIComponent(r.lon)+'&current='+encodeURIComponent(current)+'&daily='+encodeURIComponent(daily)+'&timezone=Asia%2FTokyo&forecast_days=3';
}
function tripForecastNote(){return japanDateKey()<'2026-12-20'?'⚠️ 3 日預測係「由今日起 3 日」，唔係 2027 年 1 月行程天氣；即時天氣就係目前最新模型狀況。到出發前幾日／旅途中會自動變成真正有用嘅預報。':'❄️ 山區天氣變化快；新穗高／白馬仍要同時睇即時能見度、官方 Live Cam、纜車運行及道路狀況。';}

function addWeatherLiveStyle(){
 if(document.getElementById('weatherLiveStyleV2'))return;
 const s=document.createElement('style');s.id='weatherLiveStyleV2';s.textContent='.weather-live-wrap{margin:0 0 12px;padding:12px;border:1px solid #d9e5ed;border-radius:12px;background:#f3f8fb}.weather-live-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:9px}.weather-live-label{font-size:12px;font-weight:900;color:#1f4e79}.weather-live-time{font-size:9px;color:#72818c}.weather-live-main{display:flex;align-items:center;gap:10px}.weather-live-icon{font-size:34px;line-height:1}.weather-live-temp{font-size:26px;font-weight:900;color:#263f52}.weather-live-cond{font-size:13px;font-weight:800;color:#3b5568}.weather-live-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.weather-live-metric{padding:7px 8px;background:white;border:1px solid #e0e8ee;border-radius:8px;font-size:10px;color:#50636f;line-height:1.4}.weather-live-metric strong{display:block;color:#294c67;font-size:11px;margin-top:2px}.weather-forecast-label{font-size:11px;font-weight:900;color:#536a7a;margin:3px 0 8px}.weather3d-day .weather-vis{margin-top:3px;color:#3f6075;font-weight:800}@media(max-width:720px){.weather-live-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.weather-live-temp{font-size:23px}}';document.head.appendChild(s);
}

function buildWeatherPanel(){
 if(document.getElementById('weather3dPanel'))return;
 const host=document.querySelector('main.container')||document.querySelector('.container');if(!host)return;
 addWeatherLiveStyle();
 const p=document.createElement('section');p.id='weather3dPanel';p.className='weather3d-panel';p.innerHTML='<div class="weather3d-head"><div><h2 class="weather3d-title">🌤️ 行程地區・即時天氣＋3天天氣預測</h2><p class="weather3d-subtitle">即時溫度／體感／濕度／雲量／風力／能見度 ＋ 未來 3 日最高最低溫、降水、降雪、陣風、能見度</p></div><button type="button" class="weather3d-refresh" id="weather3dRefresh">↻ 刷新</button></div><div class="weather3d-regions" id="weather3dRegions"></div><div class="weather3d-body" id="weather3dBody"><div class="weather3d-status">載入即時天氣及 3 日預報…</div></div>';
 const first=host.firstElementChild;if(first&&first.classList&&(first.classList.contains('today-panel')||first.classList.contains('intro')))first.insertAdjacentElement('afterend',p);else host.insertBefore(p,first||null);
 const bar=p.querySelector('#weather3dRegions'),body=p.querySelector('#weather3dBody');let active=getDefaultRegion();
 REGIONS.forEach(r=>{const b=document.createElement('button');b.type='button';b.className='weather3d-region';b.dataset.region=r.id;b.textContent=r.name;b.onclick=()=>{active=r.id;localStorage.setItem(WEATHER_REGION_KEY,active);mark();load(r,false);};bar.appendChild(b);});
 function mark(){bar.querySelectorAll('.weather3d-region').forEach(b=>b.classList.toggle('active',b.dataset.region===active));}
 function render(r,data,meta){
  if(!data||!data.daily||!data.daily.time){body.innerHTML='<div class="weather3d-status weather3d-offline">暫時攞唔到天氣資料。</div>';return;}
  const c=data.current||{};const cw=weatherText(c.weather_code);
  const live='<div class="weather-live-wrap"><div class="weather-live-head"><span class="weather-live-label">📡 即時天氣</span><span class="weather-live-time">'+(c.time?c.time.replace('T',' ')+' JST':'最新資料')+'</span></div><div class="weather-live-main"><span class="weather-live-icon">'+cw[0]+'</span><div><div class="weather-live-temp">'+(c.temperature_2m==null?'—':Math.round(c.temperature_2m)+'°C')+'</div><div class="weather-live-cond">'+cw[1]+'｜體感 '+(c.apparent_temperature==null?'—':Math.round(c.apparent_temperature)+'°C')+'</div></div></div><div class="weather-live-grid"><div class="weather-live-metric">👁️ 能見度<strong>'+km(c.visibility)+'</strong></div><div class="weather-live-metric">☁️ 雲量<strong>'+(c.cloud_cover==null?'—':Math.round(c.cloud_cover)+'%')+'</strong></div><div class="weather-live-metric">💧 濕度<strong>'+(c.relative_humidity_2m==null?'—':Math.round(c.relative_humidity_2m)+'%')+'</strong></div><div class="weather-live-metric">💨 風速／陣風<strong>'+(c.wind_speed_10m==null?'—':Math.round(c.wind_speed_10m))+' / '+(c.wind_gusts_10m==null?'—':Math.round(c.wind_gusts_10m))+' km/h</strong></div><div class="weather-live-metric">☔ 降水<strong>'+(c.precipitation==null?'—':Number(c.precipitation).toFixed(1)+' mm')+'</strong></div><div class="weather-live-metric">❄️ 降雪<strong>'+(c.snowfall==null?'—':Number(c.snowfall).toFixed(1)+' cm')+'</strong></div></div></div>';
  const x=data.daily,cards=x.time.slice(0,3).map((day,i)=>{const w=weatherText(x.weather_code&&x.weather_code[i]),max=x.temperature_2m_max&&x.temperature_2m_max[i],min=x.temperature_2m_min&&x.temperature_2m_min[i],fm=x.apparent_temperature_max&&x.apparent_temperature_max[i],fn=x.apparent_temperature_min&&x.apparent_temperature_min[i],rain=x.precipitation_probability_max&&x.precipitation_probability_max[i],snow=x.snowfall_sum&&x.snowfall_sum[i],gust=x.wind_gusts_10m_max&&x.wind_gusts_10m_max[i],vm=x.visibility_mean&&x.visibility_mean[i],vn=x.visibility_min&&x.visibility_min[i];return'<div class="weather3d-day"><div class="weather3d-date">'+formatDate(day)+'</div><div class="weather3d-main"><span class="weather3d-icon">'+w[0]+'</span><span class="weather3d-condition">'+w[1]+'</span></div><div class="weather3d-temp">'+Math.round(max)+'° <span>/ '+Math.round(min)+'°C</span></div><div class="weather3d-metrics"><div>🧣 體感 '+(fm==null?'—':Math.round(fm)+'°')+' / '+(fn==null?'—':Math.round(fn)+'°C')+'</div><div>☔ 降水 '+(rain==null?'—':Math.round(rain)+'%')+'</div><div>❄️ 降雪 '+(snow==null?'—':Number(snow).toFixed(1)+' cm')+'</div><div>💨 陣風 '+(gust==null?'—':Math.round(gust)+' km/h')+'</div><div class="weather-vis">👁️ 能見度 平均 '+km(vm)+'｜最低 '+km(vn)+'</div></div></div>';}).join('');
  const stamp=meta&&meta.cachedAt?new Date(meta.cachedAt):new Date();body.innerHTML='<div class="weather3d-location"><strong>'+r.name+'</strong><span class="weather3d-jp">🇯🇵 '+r.jp+'</span></div>'+live+'<div class="weather-forecast-label">📅 未來 3 日預測</div><div class="weather3d-days">'+cards+'</div><div class="weather3d-foot"><span>資料：Open-Meteo</span><span>'+((meta&&meta.fromCache)?'上次資料':'更新')+'：日本時間 '+japanTimeLabel(stamp)+'</span><span>即時天氣為最新模型 current conditions</span></div><div class="weather3d-warning">'+tripForecastNote()+'</div>';
 }
 function load(r,force){
  body.innerHTML='<div class="weather3d-status">🌤️ 讀取 '+r.name+' 即時天氣＋3 日預報…</div>';const cache=readCache(),hit=cache[r.id];if(!force&&hit&&(Date.now()-hit.cachedAt)<WEATHER_TTL){render(r,hit.data,{cachedAt:hit.cachedAt,fromCache:true});return;}
  fetch(weatherApiUrl(r),{cache:'no-store'}).then(x=>{if(!x.ok)throw new Error('weather');return x.json();}).then(data=>{cache[r.id]={cachedAt:Date.now(),data};writeCache(cache);render(r,data,{cachedAt:Date.now(),fromCache:false});}).catch(()=>{if(hit){render(r,hit.data,{cachedAt:hit.cachedAt,fromCache:true});const n=document.createElement('div');n.className='weather3d-warning weather3d-offline';n.textContent='目前無法連線更新，以上係上次成功下載嘅資料。';body.appendChild(n);}else body.innerHTML='<div class="weather3d-status weather3d-offline">🟠 天氣資料需要上網；目前未有離線快取。</div>';});
 }
 p.querySelector('#weather3dRefresh').onclick=()=>load(REGIONS.find(r=>r.id===active)||REGIONS[0],true);mark();load(REGIONS.find(r=>r.id===active)||REGIONS[0],false);
}

function requestedTrip(){return(new URLSearchParams(location.search).get('trip')||'').trim();}
function loadScriptOnce(id,src){
 if(document.getElementById(id))return;
 const s=document.createElement('script');s.id=id;s.src=src;s.async=false;document.body.appendChild(s);
}
function loadLiveSync(){
 if(!/(?:^|\/)live\.html$/.test(location.pathname))return;
 if(!window.MultiTripLiveEntry)loadScriptOnce('multiTripLiveEntryScript','assets/multi-trip-live-entry-v1.js?v=10.17.0');
 const trip=requestedTrip();
 if(trip&&trip!==DEFAULT_TRIP)return;
 if(!window.__japan2027LiveV1050Sync)loadScriptOnce('liveV92SyncScript','assets/live-v9-2-sync.js?v=10.12.0');
}
function init(){
 const trip=requestedTrip();
 if(!trip||trip===DEFAULT_TRIP)buildWeatherPanel();
 loadLiveSync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
