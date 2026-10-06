(function(){
'use strict';
if(window.MultiTripWeather&&window.MultiTripWeather.__v1)return;

const DEFAULT_TRIP='shirakawago-shinhotaka-2027';
const TTL=10*60*1000;
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const num=v=>{const x=Number(v);return Number.isFinite(x)?x:null;};
const round1=v=>Math.round(v*10)/10;

function cfg(){return window.MultiTrip&&window.MultiTrip.config||{};}
function tripId(){return window.MultiTrip&&window.MultiTrip.id||DEFAULT_TRIP;}
function weatherData(){return window.MultiTripData&&window.MultiTripData.all('weather')||null;}
function itineraryData(){return window.MultiTripData&&window.MultiTripData.all('itinerary')||null;}
function tz(){return cfg().timezone||'Asia/Tokyo';}
function cacheKey(){return'multiTrip.weather.cache.'+tripId();}
function regionKey(){return'multiTrip.weather.region.'+tripId();}
function legacyRegionKey(){return tripId()===DEFAULT_TRIP?'japan2027_weather_region':null;}
function regions(){return weatherData()&&weatherData().regions||{};}
function regionList(){return Object.entries(regions()).map(([id,r])=>Object.assign({id},r||{}));}
function dayRegionMap(){return weatherData()&&weatherData().dayRegions||{};}
function dynamicRules(){return weatherData()&&weatherData().dynamicRegionRules||{};}
function scoreProfiles(){return weatherData()&&weatherData().scoreProfiles||{};}

function dateKey(date){
 try{const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz(),year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date||new Date()),o={};p.forEach(x=>o[x.type]=x.value);return o.year+'-'+o.month+'-'+o.day;}catch(e){return new Date().toISOString().slice(0,10);}
}
function formatDate(s){const d=new Date(s+'T12:00:00');const w=['日','一','二','三','四','五','六'];return(d.getMonth()+1)+'/'+d.getDate()+' ('+w[d.getDay()]+')';}
function weatherText(code){const c=Number(code);if(c===0)return['☀️','晴天'];if(c===1)return['🌤️','大致晴朗'];if(c===2)return['⛅','部分多雲'];if(c===3)return['☁️','多雲／陰天'];if(c===45||c===48)return['🌫️','有霧'];if(c>=51&&c<=57)return['🌦️','毛毛雨'];if(c>=61&&c<=67)return['🌧️','有雨'];if(c>=71&&c<=77)return['🌨️','有雪'];if(c>=80&&c<=82)return['🌦️','驟雨'];if(c===85||c===86)return['🌨️','驟雪'];if(c>=95)return['⛈️','雷暴'];return['🌡️','天氣'];}
function fmt(v,suffix,dp){const x=num(v);return x==null?'—':(dp==null?Math.round(x):x.toFixed(dp))+suffix;}
function km(v){const x=num(v);return x==null?'—':(x/1000).toFixed(x>=10000?0:1)+' km';}
function cmFromM(v){const x=num(v);if(x==null)return'—';const c=x*100;return(c>=10?Math.round(c):round1(c))+' cm';}
function cacheRead(){try{return JSON.parse(localStorage.getItem(cacheKey())||'{}');}catch(e){return{};}}
function cacheWrite(v){try{localStorage.setItem(cacheKey(),JSON.stringify(v));}catch(e){}}

function flexiblePlan(){
 const it=itineraryData(),rules=it&&it.flexibleRules;if(!rules)return null;
 const key=rules.storageKey||'',raw=key?localStorage.getItem(key)||'':'',scenarios=rules.scenarios||{};
 return scenarios[raw]||scenarios.unset||null;
}
function regionForDay(dayId){
 const map=dayRegionMap(),base=map[dayId];
 if(base&&base!=='dynamic')return regions()[base]?base:null;
 if(base==='dynamic'){
  const plan=flexiblePlan(),kind=plan&&plan[dayId],rid=dynamicRules()[kind];
  if(rid&&regions()[rid])return rid;
 }
 const it=itineraryData(),day=it&&Array.isArray(it.days)?it.days.find(x=>x&&x.id===dayId):null;
 if(day&&day.weatherRegion&&day.weatherRegion!=='dynamic'&&regions()[day.weatherRegion])return day.weatherRegion;
 return regionList()[0]&&regionList()[0].id||null;
}
function defaultRegion(){
 const rs=regions();let saved=localStorage.getItem(regionKey())||'';
 if(!saved&&legacyRegionKey())saved=localStorage.getItem(legacyRegionKey())||'';
 if(saved&&rs[saved])return saved;
 const today=dateKey(),it=itineraryData(),day=it&&Array.isArray(it.days)?it.days.find(x=>x&&x.date===today):null;
 return day?regionForDay(day.id):(regionList()[0]&&regionList()[0].id||null);
}
function setRegion(id){
 if(!regions()[id])return false;
 localStorage.setItem(regionKey(),id);
 const legacy=legacyRegionKey();if(legacy)localStorage.setItem(legacy,id);
 if(window.Japan2027Core&&typeof window.Japan2027Core.setWeatherRegion==='function')try{window.Japan2027Core.setWeatherRegion(id);}catch(e){}
 document.dispatchEvent(new CustomEvent('multitrip:weatherregionchange',{detail:{tripId:tripId(),regionId:id}}));
 return true;
}

function bandScore(v,rows){if(v==null)return null;for(const r of rows){if(v>=r[0])return r[1];}return rows[rows.length-1][1];}
function invBandScore(v,rows){if(v==null)return null;for(const r of rows){if(v<=r[0])return r[1];}return rows[rows.length-1][1];}
function visibilityScore(type,v){if(v==null)return null;if(type==='mountain')return bandScore(v,[[20,10],[15,9],[10,7.5],[5,5],[0,2.5]]);if(type==='village')return bandScore(v,[[10,10],[7,9],[5,7.5],[3,5.5],[0,3]]);if(type==='snowwalk')return bandScore(v,[[10,10],[7,9],[5,7],[3,5],[0,3]]);if(type==='road')return bandScore(v,[[10,10],[5,8],[3,6],[0,3.5]]);if(type==='cityscenic')return bandScore(v,[[10,10],[7,9],[5,8],[3,6.5],[0,4]]);return bandScore(v,[[7,10],[5,9],[3,7.5],[0,5]]);}
function cloudScore(type,v){if(v==null)return null;if(type==='mountain')return invBandScore(v,[[20,10],[30,9.5],[50,8],[70,5.5],[85,3.5],[100,2]]);if(type==='village')return invBandScore(v,[[80,10],[95,9],[100,8]]);if(type==='snowwalk')return invBandScore(v,[[70,10],[90,8.5],[100,7]]);if(type==='cityscenic')return invBandScore(v,[[60,10],[80,9],[95,8],[100,7]]);return invBandScore(v,[[90,10],[100,9]]);}
function gustScore(type,v){if(v==null)return null;if(type==='mountain')return invBandScore(v,[[20,10],[30,9],[40,7],[50,4.5],[999,2]]);if(type==='village')return invBandScore(v,[[25,10],[35,8.5],[45,6],[999,3]]);if(type==='snowwalk')return invBandScore(v,[[20,10],[30,8.5],[40,6],[50,4],[999,2]]);if(type==='road')return invBandScore(v,[[20,10],[30,8.5],[40,6.5],[50,4],[999,2]]);if(type==='cityscenic')return invBandScore(v,[[25,10],[35,9],[45,7],[55,5],[999,3]]);return invBandScore(v,[[30,10],[40,8.5],[50,6.5],[999,4]]);}
function precipScore(v,daily){if(v==null)return null;return daily?invBandScore(v,[[20,10],[40,9],[60,7.5],[80,5.5],[100,3.5]]):invBandScore(v,[[0,10],[0.5,8.5],[2,6.5],[5,4],[999,2]]);}
function snowScore(type,v,daily){if(v==null)return null;if(!daily){if(v<=0)return 10;if(v<=0.2)return 9;if(v<=0.7)return 7;if(v<=1.5)return 5;return 3;}if(type==='village')return invBandScore(v,[[5,10],[10,9],[20,7],[999,4]]);if(type==='snowwalk')return invBandScore(v,[[5,10],[10,8.5],[20,6],[999,3]]);if(type==='mountain')return invBandScore(v,[[1,10],[5,8.5],[10,6],[20,4],[999,2]]);return invBandScore(v,[[2,10],[5,9],[10,7],[999,4.5]]);}
function weighted(parts){let s=0,w=0;parts.forEach(p=>{if(p[0]!=null&&p[1]>0){s+=p[0]*p[1];w+=p[1];}});return w?Math.max(0,Math.min(10,s/w)):null;}
function weightsFor(type){const p=scoreProfiles()[type];if(p)return[p.visibility||0,p.cloud||0,p.gust||0,p.precipitation||0,p.snow||0];return{mountain:[.35,.25,.20,.10,.10],village:[.30,.05,.25,.20,.20],snowwalk:[.20,.08,.25,.22,.25],road:[.25,.05,.30,.25,.15],cityscenic:[.20,.10,.25,.30,.15],city:[.15,.05,.25,.40,.15]}[type]||[.20,.10,.25,.30,.15];}
function scoreWeather(regionId,m,daily){
 const r=regions()[regionId];if(!r)return null;const type=r.type||'city',vis=num(m.visibility)==null?null:num(m.visibility)/1000;
 const vals=[visibilityScore(type,vis),cloudScore(type,num(m.cloud)),gustScore(type,num(m.gust)),precipScore(num(m.precip),daily),snowScore(type,num(m.snow),daily)],wt=weightsFor(type),score=weighted(vals.map((v,i)=>[v,wt[i]]));if(score==null)return null;
 const s=round1(score),colour=s>=8?'green':s>=5.5?'yellow':'red';let text=s>=9?'非常理想':s>=8?'適合':s>=6.5?'可以去':s>=5.5?'勉強可以':'不理想';
 if(regionId==='shinhotaka'&&s>=9)text='非常適合・值得優先去';if(regionId==='shinhotaka'&&s<5.5)text='不建議用呢日去';if(regionId==='shirakawago'&&s<5.5)text='不理想・道路安全優先';
 const basis=[];if(vis!=null)basis.push((daily?'平均能見度 ':'能見度 ')+round1(vis)+' km');if(num(m.cloud)!=null)basis.push((daily?'平均雲量 ':'雲量 ')+Math.round(num(m.cloud))+'%');if(num(m.gust)!=null)basis.push((daily?'最大陣風 ':'陣風 ')+Math.round(num(m.gust))+' km/h');if(daily&&num(m.precip)!=null)basis.push('降水 '+Math.round(num(m.precip))+'%');
 const note=r.scoreNote||r.note||({mountain:'山區仍要配合 Live Cam／運行狀況',village:'道路積雪／封路狀況要另外確認',snowwalk:'步道積雪／結冰要另外確認',road:'實際道路積雪／結冰要另外確認'}[type]||'');
 return{score:s,colour,text,basis:basis.join(' ・ '),note};
}
function dot(c){return c==='green'?'🟢':c==='yellow'?'🟡':'🔴';}
function scoreHtml(regionId,res,trend){if(!res)return'';const r=regions()[regionId]||{};return'<div class="weather-suit weather-suit-'+res.colour+(trend?' weather-suit-trend':'')+'"><div class="weather-suit-main"><span>'+dot(res.colour)+'</span><strong>'+esc(r.label||r.name||regionId)+'天氣適合度 '+res.score.toFixed(1)+'/10</strong><span>'+esc(res.text)+(trend?'｜趨勢參考':'')+'</span></div><div class="weather-suit-basis">'+esc(res.basis)+(res.note?'｜'+esc(res.note):'')+'</div></div>';}

function apiUrl(r){const current=['temperature_2m','relative_humidity_2m','apparent_temperature','precipitation','snowfall','weather_code','cloud_cover','wind_speed_10m','wind_gusts_10m','visibility'].join(','),daily=['weather_code','temperature_2m_max','temperature_2m_min','apparent_temperature_max','apparent_temperature_min','precipitation_probability_max','snowfall_sum','wind_gusts_10m_max','visibility_mean','visibility_min','visibility_max','cloud_cover_mean'].join(',');return'https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(r.lat)+'&longitude='+encodeURIComponent(r.lon)+'&current='+encodeURIComponent(current)+'&hourly=snow_depth&daily='+encodeURIComponent(daily)+'&timezone='+encodeURIComponent(tz())+'&forecast_days=5';}
function closestSnow(data,target){const h=data&&data.hourly,t=h&&h.time,v=h&&h.snow_depth;if(!t||!v||!t.length)return null;let best=0,bd=Infinity,tt=Date.parse(target||t[0]);for(let i=0;i<t.length;i++){const d=Math.abs(Date.parse(t[i])-tt);if(d<bd){bd=d;best=i;}}return num(v[best]);}
function noonSnow(data,day){const h=data&&data.hourly,t=h&&h.time,v=h&&h.snow_depth;if(!t||!v)return null;let i=t.indexOf(day+'T12:00');if(i<0)i=t.findIndex(x=>x.indexOf(day+'T12:')===0);if(i<0)i=t.findIndex(x=>x.indexOf(day+'T')===0);return i>=0?num(v[i]):null;}
function forecastNote(){
 const start=cfg().startDate,end=cfg().endDate,today=dateKey();
 if(start&&end&&(today<start||today>end))return'⚠️ 5 日預測係由今日起計，唔代表 '+esc(start)+' 至 '+esc(end)+' 行程天氣；到出發前幾日先會變成真正有用嘅行程預報。第 4–5 日只作趨勢參考。';
 return'❄️ 第 1–3 日可用作主要決策；第 4–5 日只作趨勢參考。山區仍要配合 Live Cam、運行及道路狀況。積雪深度係模型估算地面積雪，唔代表路面積雪。';
}
function ensureStyle(){if(document.getElementById('multiTripWeatherV1Style'))return;const s=document.createElement('style');s.id='multiTripWeatherV1Style';s.textContent='.weather-suit{margin:9px 0 0;padding:8px 10px;border-radius:9px;border:1px solid;font-size:10px;line-height:1.45}.weather-suit-main{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.weather-suit-main strong{font-size:11px}.weather-suit-basis{margin-top:3px;opacity:.82}.weather-suit-green{background:#edf8ef;border-color:#b9ddc0;color:#25623a}.weather-suit-yellow{background:#fff8df;border-color:#ead38c;color:#755900}.weather-suit-red{background:#fff0ef;border-color:#efbbb6;color:#9b3029}.weather-suit-trend{opacity:.72}.weather3d-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.weather3d-day{min-width:0}.weather3d-trend{opacity:.82;border-style:dashed}.weather3d-trend-label{font-size:9px;font-weight:900;color:#7a6a30;margin-top:4px}.weather-live-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}@media(max-width:900px){.weather3d-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.weather3d-grid{grid-template-columns:1fr}.weather-live-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}';document.head.appendChild(s);}
function ensurePanel(){
 let old=document.getElementById('weather3dPanel');
 if(old&&old.dataset.multiTripWeather==='1')return old;
 const p=document.createElement('section');p.id='weather3dPanel';p.dataset.multiTripWeather='1';p.className='weather3d-panel';p.innerHTML='<div class="weather3d-head"><div><h2 class="weather3d-title">🌤️ 行程地區・即時天氣＋5天天氣預測</h2><p class="weather3d-subtitle">即時天氣＋未來 5 日｜第 1–3 日主要決策，第 4–5 日趨勢參考｜天氣地區由目前 Trip Data 提供</p></div><button type="button" class="weather3d-refresh" id="weather3dRefresh">↻ 刷新</button></div><div class="weather3d-regions" id="weather3dRegions"></div><div class="weather3d-body" id="weather3dBody"><div class="weather3d-status">載入即時天氣及 5 日預報…</div></div>';
 if(old){old.insertAdjacentElement('afterend',p);old.remove();return p;}
 const host=document.querySelector('main.container')||document.querySelector('.container');if(!host)return null;
 const first=host.firstElementChild;if(first&&first.classList&&(first.classList.contains('today-panel')||first.classList.contains('intro')))first.insertAdjacentElement('afterend',p);else host.insertBefore(p,first||null);return p;
}
function mark(panel,id){panel.querySelectorAll('.weather3d-region').forEach(b=>b.classList.toggle('active',b.dataset.region===id));}
function render(panel,regionId,data,meta){
 const r=regions()[regionId],body=panel.querySelector('#weather3dBody');if(!r||!body||!data||!data.daily||!data.daily.time){if(body)body.innerHTML='<div class="weather3d-status weather3d-offline">暫時攞唔到天氣資料。</div>';return;}
 const c=data.current||{},cw=weatherText(c.weather_code),snowNow=closestSnow(data,c.time),cr=scoreWeather(regionId,{visibility:c.visibility,cloud:c.cloud_cover,gust:c.wind_gusts_10m,precip:c.precipitation,snow:c.snowfall},false);
 const live='<div class="weather-live-wrap"><div class="weather-live-head"><span class="weather-live-label">📡 即時天氣</span><span class="weather-live-time">'+esc(c.time?c.time.replace('T',' ')+' '+tz():'最新資料')+'</span></div><div class="weather-live-main"><span class="weather-live-icon">'+cw[0]+'</span><div><div class="weather-live-temp">'+fmt(c.temperature_2m,'°C')+'</div><div class="weather-live-cond">'+cw[1]+'｜體感 '+fmt(c.apparent_temperature,'°C')+'</div></div></div>'+scoreHtml(regionId,cr,false)+'<div class="weather-live-grid"><div class="weather-live-metric">👁️ 能見度<strong>'+km(c.visibility)+'</strong></div><div class="weather-live-metric">☁️ 雲量<strong>'+fmt(c.cloud_cover,'%')+'</strong></div><div class="weather-live-metric">💧 濕度<strong>'+fmt(c.relative_humidity_2m,'%')+'</strong></div><div class="weather-live-metric">💨 風速／陣風<strong>'+fmt(c.wind_speed_10m,'')+' / '+fmt(c.wind_gusts_10m,'')+' km/h</strong></div><div class="weather-live-metric">☔ 降水<strong>'+fmt(c.precipitation,' mm',1)+'</strong></div><div class="weather-live-metric">❄️ 新降雪<strong>'+fmt(c.snowfall,' cm',1)+'</strong></div><div class="weather-live-metric">☃️ 地面積雪<strong>'+cmFromM(snowNow)+'</strong></div></div></div>';
 const d=data.daily,cards=d.time.slice(0,5).map((day,i)=>{const w=weatherText(d.weather_code&&d.weather_code[i]),trend=i>=3,rr=scoreWeather(regionId,{visibility:d.visibility_mean&&d.visibility_mean[i],cloud:d.cloud_cover_mean&&d.cloud_cover_mean[i],gust:d.wind_gusts_10m_max&&d.wind_gusts_10m_max[i],precip:d.precipitation_probability_max&&d.precipitation_probability_max[i],snow:d.snowfall_sum&&d.snowfall_sum[i]},true),sd=noonSnow(data,day);return'<div class="weather3d-day'+(trend?' weather3d-trend':'')+'"><div class="weather3d-date">'+formatDate(day)+'</div>'+(trend?'<div class="weather3d-trend-label">趨勢參考</div>':'')+'<div class="weather3d-main"><span class="weather3d-icon">'+w[0]+'</span><span class="weather3d-condition">'+w[1]+'</span></div><div class="weather3d-temp">'+fmt(d.temperature_2m_max&&d.temperature_2m_max[i],'°')+' <span>/ '+fmt(d.temperature_2m_min&&d.temperature_2m_min[i],'°C')+'</span></div>'+scoreHtml(regionId,rr,trend)+'<div class="weather3d-metrics"><div>🧣 體感 '+fmt(d.apparent_temperature_max&&d.apparent_temperature_max[i],'°')+' / '+fmt(d.apparent_temperature_min&&d.apparent_temperature_min[i],'°C')+'</div><div>☔ 降水 '+fmt(d.precipitation_probability_max&&d.precipitation_probability_max[i],'%')+'</div><div>❄️ 新降雪 '+fmt(d.snowfall_sum&&d.snowfall_sum[i],' cm',1)+'</div><div>☃️ 積雪 '+cmFromM(sd)+'（約12:00）</div><div>💨 最大陣風 '+fmt(d.wind_gusts_10m_max&&d.wind_gusts_10m_max[i],' km/h')+'</div><div>👁️ 平均 '+km(d.visibility_mean&&d.visibility_mean[i])+'｜最低 '+km(d.visibility_min&&d.visibility_min[i])+'</div><div>☁️ 平均雲量 '+fmt(d.cloud_cover_mean&&d.cloud_cover_mean[i],'%')+'</div></div></div>';}).join('');
 body.innerHTML=live+'<div class="weather-forecast-label">📅 未來 5 日</div><div class="weather3d-grid">'+cards+'</div><div class="weather3d-note">'+forecastNote()+'</div>'+(meta&&meta.cached?'<div class="weather3d-note">📦 暫用快取資料</div>':'');
}
function load(panel,regionId,force){const r=regions()[regionId];if(!r)return;mark(panel,regionId);const body=panel.querySelector('#weather3dBody'),cache=cacheRead(),hit=cache[regionId];if(!force&&hit&&Date.now()-hit.at<TTL){render(panel,regionId,hit.data,{cached:false});return;}body.innerHTML='<div class="weather3d-status">更新 '+esc(r.name||regionId)+' 天氣…</div>';fetch(apiUrl(r),{cache:'no-store'}).then(x=>{if(!x.ok)throw new Error('weather');return x.json();}).then(data=>{cache[regionId]={at:Date.now(),data};cacheWrite(cache);render(panel,regionId,data,{cached:false});}).catch(()=>{if(hit)render(panel,regionId,hit.data,{cached:true});else body.innerHTML='<div class="weather3d-status weather3d-offline">暫時攞唔到天氣資料。</div>';});}
function boot(){
 const wd=weatherData();if(!wd||!cfg().features||cfg().features.weather!==false){/* continue */}else return;
 const list=regionList();if(!wd||!list.length)return;
 ensureStyle();const panel=ensurePanel();if(!panel)return;const bar=panel.querySelector('#weather3dRegions');bar.innerHTML='';let active=defaultRegion();
 list.forEach(r=>{const b=document.createElement('button');b.type='button';b.className='weather3d-region';b.dataset.region=r.id;b.textContent=r.name||r.label||r.id;b.addEventListener('click',()=>{active=r.id;setRegion(r.id);load(panel,r.id,false);});bar.appendChild(b);});
 if(!active||!regions()[active])active=list[0].id;setRegion(active);const refresh=panel.querySelector('#weather3dRefresh');refresh.addEventListener('click',()=>load(panel,active,true));load(panel,active,false);
 document.documentElement.dataset.weatherModule='multi-trip-v1';document.documentElement.dataset.weatherTrip=tripId();
}

window.MultiTripWeather={__v1:true,regions,regionList,regionForDay,defaultRegion,setRegion,scoreWeather,boot};
Promise.all([
 window.MultiTrip&&window.MultiTrip.ready?window.MultiTrip.ready:Promise.resolve(),
 window.MultiTripData&&window.MultiTripData.ready?window.MultiTripData.ready:Promise.resolve()
]).then(()=>{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}).catch(err=>console.error('Multi Trip weather failed',err));
})();
