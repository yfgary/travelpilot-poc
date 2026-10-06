(function(){
'use strict';
if(window.MultiTripModeCore&&window.MultiTripModeCore.__v1)return;
const DEFAULT_TRIP='shirakawago-shinhotaka-2027',TTL=10*60*1000;
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const text=e=>(e&&e.textContent||'').replace(/\s+/g,' ').trim();
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null;};
function tripId(){return window.MultiTrip&&window.MultiTrip.id||DEFAULT_TRIP;}
function cfg(){return window.MultiTrip&&window.MultiTrip.config||{};}
function itinerary(){return window.MultiTripData&&window.MultiTripData.all('itinerary')||{};}
function attractions(){return window.MultiTripData&&window.MultiTripData.all('attractions')||{};}
function weather(){return window.MultiTripData&&window.MultiTripData.all('weather')||{};}
function days(){return Array.isArray(itinerary().days)?itinerary().days:[];}
function day(id){return days().find(x=>x&&x.id===id)||null;}
function dayIds(){return days().map(x=>x.id).filter(Boolean);}
function label(id){const d=day(id);return d&&d.day!=null?'D'+d.day:'D'+String(id||'').replace(/\D/g,'');}
function previewKey(){return'multiTrip.mode.preview.'+tripId();}
function driveIndexKey(id){return'multiTrip.drive.index.'+tripId()+'.'+id;}
function timeParts(){
 const zone=cfg().timezone||'Asia/Tokyo';
 try{const p=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()),o={};p.forEach(x=>o[x.type]=x.value);return{date:o.year+'-'+o.month+'-'+o.day,minutes:Number(o.hour)*60+Number(o.minute),time:o.hour+':'+o.minute,zone};}
 catch(e){const d=new Date();return{date:d.toISOString().slice(0,10),minutes:d.getHours()*60+d.getMinutes(),time:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),zone};}
}
function parseTime(v){const m=String(v||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null;}
function migrateLegacyPreview(){if(tripId()!==DEFAULT_TRIP||localStorage.getItem(previewKey()))return;const v=localStorage.getItem('japan2027_travel_mode_preview_day');if(v)localStorage.setItem(previewKey(),v);}
function currentDayId(){migrateLegacyPreview();const t=timeParts(),hit=days().find(d=>d.date===t.date);if(hit)return hit.id;const saved=localStorage.getItem(previewKey())||'';return day(saved)?saved:(dayIds()[0]||'d1');}
function setPreviewDay(id){if(day(id)){localStorage.setItem(previewKey(),id);if(tripId()===DEFAULT_TRIP)localStorage.setItem('japan2027_travel_mode_preview_day',id);}}
function domItems(id){
 const root=document.getElementById(id);if(!root)return[];
 return $$('.timeline-item',root).map((item,idx)=>{const timeEl=$('.time',item),endEl=$('.end-time',item),card=$('.timeline-card',item),h=$('h3',item),type=$('.event-type',item),p=$('p',item);let start='';if(timeEl){const c=timeEl.cloneNode(true);c.querySelectorAll('.end-time').forEach(x=>x.remove());start=text(c);}const pin=item.querySelector('a.map-pin[href]');return{idx,start,end:text(endEl),minutes:parseTime(start),type:text(type),title:text(h),desc:text(p),map:h&&(h.dataset.map||'')||'',href:pin&&pin.href||'',hard:!!(card&&card.classList.contains('hard-cut')),hotelEnd:!!(card&&card.classList.contains('hotel-end-marker')),source:'dom'};}).filter(x=>x.title||x.start);
}
function jsonItems(id){const d=day(id);return d&&Array.isArray(d.items)?d.items.map((x,idx)=>({idx,start:x.time||'',end:x.endTime||'',minutes:parseTime(x.time),type:x.type||'',title:x.title||'',desc:x.note||x.desc||'',map:x.map||'',href:x.href||'',hard:!!x.hardCut,hotelEnd:x.type==='hotel',attractionId:x.attractionId||'',source:'json'})):[];}
function items(id){const dom=domItems(id);return dom.length?dom:jsonItems(id);}
function regionForDay(id){if(window.MultiTripWeather&&typeof window.MultiTripWeather.regionForDay==='function')return window.MultiTripWeather.regionForDay(id);const d=day(id),w=weather(),regions=w.regions||{},base=(w.dayRegions||{})[id]||(d&&d.weatherRegion);return base&&base!=='dynamic'&&regions[base]?base:Object.keys(regions)[0]||null;}
function region(id){return (weather().regions||{})[id]||null;}
function weatherCacheKey(){return'multiTrip.weather.cache.'+tripId();}
function readWeatherCache(){try{return JSON.parse(localStorage.getItem(weatherCacheKey())||'{}');}catch(e){return{};}}
function writeWeatherCache(v){try{localStorage.setItem(weatherCacheKey(),JSON.stringify(v));}catch(e){}}
function weatherUrl(r){const current=['temperature_2m','relative_humidity_2m','apparent_temperature','precipitation','snowfall','weather_code','cloud_cover','wind_speed_10m','wind_gusts_10m','visibility'].join(','),daily=['weather_code','temperature_2m_max','temperature_2m_min','apparent_temperature_max','apparent_temperature_min','precipitation_probability_max','snowfall_sum','wind_gusts_10m_max','visibility_mean','visibility_min','visibility_max','cloud_cover_mean'].join(',');return'https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(r.lat)+'&longitude='+encodeURIComponent(r.lon)+'&current='+encodeURIComponent(current)+'&hourly=snow_depth&daily='+encodeURIComponent(daily)+'&timezone='+encodeURIComponent(cfg().timezone||'Asia/Tokyo')+'&forecast_days=5';}
function fetchWeather(id,force){const rid=regionForDay(id),r=region(rid);if(!r)return Promise.resolve(null);const cache=readWeatherCache(),hit=cache[rid];if(!force&&hit&&Date.now()-hit.at<TTL&&hit.data)return Promise.resolve({regionId:rid,region:r,data:hit.data,cached:false});return fetch(weatherUrl(r),{cache:'no-store'}).then(x=>{if(!x.ok)throw new Error('weather');return x.json();}).then(data=>{cache[rid]={at:Date.now(),data};writeWeatherCache(cache);return{regionId:rid,region:r,data,cached:false};}).catch(()=>hit&&hit.data?{regionId:rid,region:r,data:hit.data,cached:true}:null);}
function closestSnow(data){const h=data&&data.hourly;if(!h||!h.time||!h.snow_depth||!h.time.length)return null;const target=Date.parse((data.current&&data.current.time)||h.time[0]);let best=0,dist=Infinity;h.time.forEach((t,i)=>{const d=Math.abs(Date.parse(t)-target);if(d<dist){dist=d;best=i;}});return n(h.snow_depth[best]);}
function currentMetrics(data){const c=data&&data.current||{};return{visibility:c.visibility,cloud:c.cloud_cover,gust:c.wind_gusts_10m,wind:c.wind_speed_10m,precip:c.precipitation,snow:c.snowfall,snowDepth:closestSnow(data),apparent:c.apparent_temperature,weatherCode:c.weather_code,wave:c.wave_height,swell:c.swell_wave_height,waterTemp:c.sea_surface_temperature,marineVisibility:c.marine_visibility};}
function norm(s){return String(s||'').toLowerCase().replace(/[\s・／\/()（）\-_.]/g,'');}
function attractionForItem(item){const list=Array.isArray(attractions().attractions)?attractions().attractions:[];if(item&&item.attractionId){const hit=list.find(a=>a.id===item.attractionId);if(hit)return hit;}const title=norm(item&&item.title),map=norm(item&&item.map);return list.find(a=>{const an=norm(a.name),am=norm(a.map);return !!((title&&an&&(title.includes(an)||an.includes(title)))||(map&&am&&(map.includes(am)||am.includes(map))));})||null;}
function activityScore(dayId,item,data){const std=window.MultiTripWeatherProfileStandard,m=currentMetrics(data),rid=regionForDay(dayId),r=region(rid)||{},a=attractionForItem(item);if(!std)return null;let ids=a&&Array.isArray(a.weatherProfiles)&&a.weatherProfiles.length?a.weatherProfiles:(Array.isArray(r.activityProfiles)?r.activityProfiles.map(x=>typeof x==='string'?x:x.id):[]);ids=[...new Set(ids.filter(Boolean))];if(!ids.length&&typeof std.regionResult==='function')return std.regionResult(rid,m,false);const results=ids.map(id=>std.profileResult(id,m,false)).filter(Boolean);if(!results.length)return null;const avg=k=>results.reduce((s,x)=>s+(n(x[k])||0),0)/results.length,experience=avg('experience'),access=avg('access');let final=avg('final');if(access<2.5)final=Math.min(final,3.5);else if(access<4)final=Math.min(final,5);else if(access<5.5)final=Math.min(final,6.5);const colour=final>=8?'green':final>=5.5?'yellow':'red';return{experience:Math.round(experience*10)/10,access:Math.round(access*10)/10,final:Math.round(final*10)/10,colour,profiles:ids.map(id=>std.profiles&&std.profiles[id]).filter(Boolean),attraction:a,marineMissing:results.some(x=>x.marineMissing),operationRequired:results.some(x=>x.operationRequired)};}
function mapUrl(item,drive){const q=item&&(item.map||item.title)||'';if(item&&item.href&&!drive)return item.href;return drive?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(q)+'&travelmode=driving':'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);}
window.MultiTripModeCore={__v1:true,tripId,cfg,days,day,dayIds,label,timeParts,parseTime,currentDayId,setPreviewDay,previewKey,driveIndexKey,items,regionForDay,region,fetchWeather,currentMetrics,attractionForItem,activityScore,mapUrl,esc,text};
})();
