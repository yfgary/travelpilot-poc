(function(){
'use strict';
if(window.MultiTripWeatherProfileStandard&&window.MultiTripWeatherProfileStandard.__v1)return;

const DEFAULT_TRIP='shirakawago-shinhotaka-2027';
const round1=v=>Math.round(v*10)/10;
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null;};
const clamp=v=>Math.max(0,Math.min(10,v));
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/*
 Weather Activity Profile Standard v1
 -----------------------------------
 Final suitability is NOT one universal weather score.
 Each activity gets:
   1) Experience score: how enjoyable/useful the activity is in this weather.
   2) Access/Safety score: whether getting there / doing it is sensible.
   3) Final score: weighted result with a safety cap when access becomes poor.

 Marine profiles are included now. If wave/swell/water-temperature data is not
 available, the result is explicitly marked as preliminary instead of pretending
 that land-weather data is enough for sea safety.
*/

const PRESETS={
 experience:{
  indoor:{baseline:.78,weights:{precip:.06,gust:.03,apparent:.05,thunder:.08},modes:{precip:'sheltered',gust:'sheltered',apparent:'neutral'}},
  semiIndoor:{baseline:.38,weights:{precip:.24,gust:.14,apparent:.12,thunder:.12},modes:{precip:'sheltered',gust:'normal',apparent:'general'}},
  cityWalk:{weights:{visibility:.05,cloud:.03,gust:.18,precip:.34,snow:.14,apparent:.16,thunder:.10},modes:{visibility:'low',cloud:'low',gust:'normal',precip:'dry',snow:'risk',apparent:'general'}},
  historic:{weights:{visibility:.10,cloud:.05,gust:.17,precip:.30,snow:.13,apparent:.15,thunder:.10},modes:{visibility:'normal',cloud:'low',gust:'normal',precip:'dry',snow:'risk',apparent:'general'}},
  outdoorMarket:{weights:{gust:.25,precip:.34,snow:.11,apparent:.18,thunder:.12},modes:{gust:'normal',precip:'dry',snow:'risk',apparent:'general'}},
  outlet:{weights:{gust:.22,precip:.34,snow:.16,apparent:.18,thunder:.10},modes:{gust:'normal',precip:'dry',snow:'risk',apparent:'general'}},
  themePark:{weights:{gust:.28,precip:.28,apparent:.14,thunder:.24,visibility:.06},modes:{gust:'strict',precip:'dry',apparent:'general',visibility:'low'}},
  mountainView:{weights:{visibility:.40,cloud:.30,gust:.15,precip:.05,snow:.04,thunder:.06},modes:{visibility:'strict',cloud:'strict',gust:'strict',precip:'dry',snow:'risk'}},
  ropeway:{weights:{visibility:.32,cloud:.23,gust:.27,precip:.05,snow:.05,thunder:.08},modes:{visibility:'strict',cloud:'strict',gust:'ropeway',precip:'dry',snow:'risk'}},
  hiking:{weights:{visibility:.13,cloud:.04,gust:.23,precip:.22,snow:.10,apparent:.13,thunder:.15},modes:{visibility:'normal',cloud:'low',gust:'strict',precip:'dry',snow:'risk',apparent:'cold'}},
  snowWalk:{weights:{visibility:.08,gust:.18,precip:.13,snow:.20,snowDepth:.20,apparent:.11,thunder:.10},modes:{visibility:'path',gust:'normal',precip:'dry',snow:'risk',snowDepth:'path',apparent:'cold'}},
  skiSnow:{weights:{visibility:.14,cloud:.04,gust:.23,precip:.08,snow:.18,snowDepth:.22,apparent:.06,thunder:.05},modes:{visibility:'normal',cloud:'low',gust:'strict',precip:'dry',snow:'sport',snowDepth:'sport',apparent:'veryCold'}},
  village:{weights:{visibility:.13,cloud:.04,gust:.13,precip:.13,scenicSnow:.37,apparent:.10,thunder:.10},modes:{visibility:'normal',cloud:'low',gust:'normal',precip:'dry',scenicSnow:'village',apparent:'cold'}},
  waterfall:{weights:{visibility:.08,gust:.18,precip:.25,snow:.14,apparent:.15,thunder:.15,cloud:.05},modes:{visibility:'normal',gust:'normal',precip:'dry',snow:'risk',apparent:'general',cloud:'low'}},
  wildlife:{weights:{visibility:.08,gust:.18,precip:.22,snow:.14,apparent:.15,thunder:.15,cloud:.08},modes:{visibility:'normal',gust:'normal',precip:'dry',snow:'risk',apparent:'cold',cloud:'low'}},
  roadScenic:{weights:{visibility:.24,cloud:.08,gust:.16,precip:.18,snow:.14,apparent:.08,thunder:.12},modes:{visibility:'road',cloud:'normal',gust:'normal',precip:'dry',snow:'risk',apparent:'general'}},
  coastal:{weights:{visibility:.23,cloud:.09,gust:.24,precip:.18,apparent:.10,thunder:.16},modes:{visibility:'normal',cloud:'normal',gust:'sea',precip:'dry',apparent:'general'}},
  beach:{weights:{gust:.16,wind:.10,precip:.20,apparent:.18,thunder:.18,wave:.10,waterTemp:.08},modes:{gust:'sea',wind:'sea',precip:'dry',apparent:'beach',wave:'beach',waterTemp:'swim'}},
  boat:{weights:{visibility:.12,gust:.18,wind:.10,precip:.10,thunder:.15,wave:.22,swell:.13},modes:{visibility:'normal',gust:'sea',wind:'sea',precip:'dry',wave:'boat',swell:'boat'}},
  openSea:{weights:{visibility:.08,gust:.18,wind:.10,precip:.07,thunder:.15,wave:.25,swell:.17},modes:{visibility:'normal',gust:'sea',wind:'sea',precip:'dry',wave:'openSea',swell:'openSea'}},
  snorkel:{weights:{wind:.10,precip:.06,thunder:.18,wave:.20,swell:.16,waterTemp:.12,marineVisibility:.18},modes:{wind:'sea',precip:'dry',wave:'snorkel',swell:'snorkel',waterTemp:'swim',marineVisibility:'snorkel'}},
  surf:{weights:{wind:.12,precip:.05,thunder:.18,wave:.27,swell:.23,waterTemp:.10,visibility:.05},modes:{wind:'surf',precip:'dry',wave:'surf',swell:'surf',waterTemp:'sportWater',visibility:'low'}},
  lake:{weights:{gust:.24,wind:.10,precip:.18,thunder:.25,apparent:.13,visibility:.10},modes:{gust:'strict',wind:'normal',precip:'dry',apparent:'general',visibility:'normal'}},
  cycling:{weights:{gust:.27,precip:.26,apparent:.14,snow:.09,thunder:.14,visibility:.10},modes:{gust:'strict',precip:'dry',apparent:'general',snow:'risk',visibility:'road'}},
  nightView:{weights:{visibility:.40,cloud:.27,precip:.13,gust:.09,thunder:.11},modes:{visibility:'strict',cloud:'strict',precip:'dry',gust:'normal'}},
  festival:{weights:{precip:.30,gust:.23,apparent:.18,thunder:.19,snow:.10},modes:{precip:'dry',gust:'normal',apparent:'general',snow:'risk'}},
  onsen:{weights:{apparent:.21,gust:.21,precip:.12,scenicSnow:.18,thunder:.20,visibility:.08},modes:{apparent:'cold',gust:'normal',precip:'sheltered',scenicSnow:'onsen',visibility:'low'}},
  garden:{weights:{precip:.25,gust:.17,apparent:.17,visibility:.10,cloud:.06,snow:.10,thunder:.15},modes:{precip:'dry',gust:'normal',apparent:'general',visibility:'normal',cloud:'low',snow:'risk'}},
  stargazing:{weights:{cloud:.46,visibility:.34,precip:.09,gust:.05,thunder:.06},modes:{cloud:'strict',visibility:'strict',precip:'dry',gust:'normal'}},
  camping:{weights:{precip:.27,gust:.27,apparent:.18,thunder:.18,snow:.10},modes:{precip:'dry',gust:'strict',apparent:'general',snow:'risk'}},
  golf:{weights:{precip:.27,gust:.28,apparent:.14,thunder:.24,cloud:.07},modes:{precip:'dry',gust:'strict',apparent:'general',cloud:'low'}}
 },
 access:{
  none:{baseline:1},
  cityTransit:{baseline:.15,weights:{visibility:.14,gust:.12,precip:.28,snow:.18,snowDepth:.18,thunder:.10},modes:{visibility:'road',gust:'normal',precip:'access',snow:'risk',snowDepth:'road'}},
  normalRoad:{weights:{visibility:.23,gust:.14,precip:.25,snow:.18,snowDepth:.13,thunder:.07},modes:{visibility:'road',gust:'normal',precip:'access',snow:'risk',snowDepth:'road'}},
  winterRoad:{weights:{visibility:.24,gust:.14,precip:.17,snow:.20,snowDepth:.20,thunder:.05},modes:{visibility:'road',gust:'normal',precip:'access',snow:'risk',snowDepth:'winterRoad'}},
  mountainRoad:{weights:{visibility:.25,gust:.18,precip:.14,snow:.16,snowDepth:.22,thunder:.05},modes:{visibility:'road',gust:'strict',precip:'access',snow:'risk',snowDepth:'winterRoad'}},
  walkPath:{weights:{visibility:.10,gust:.19,precip:.24,snow:.18,snowDepth:.17,apparent:.07,thunder:.05},modes:{visibility:'path',gust:'normal',precip:'access',snow:'risk',snowDepth:'path',apparent:'cold'}},
  marineSafety:{weights:{visibility:.08,gust:.14,wind:.10,precip:.07,thunder:.15,wave:.25,swell:.16,waterTemp:.05},modes:{visibility:'normal',gust:'sea',wind:'sea',precip:'access',wave:'openSea',swell:'openSea',waterTemp:'sportWater'}}
 }
};

const PROFILES={
 indoor:{icon:'🏬',label:'室內景點',experience:'indoor',access:'cityTransit',accessShare:.55},
 semi_indoor:{icon:'🏘️',label:'半室內／有蓋景點',experience:'semiIndoor',access:'cityTransit',accessShare:.45},
 city_walk:{icon:'🚶',label:'市區散步',experience:'cityWalk',access:'cityTransit',accessShare:.35},
 historic_outdoor:{icon:'🏯',label:'戶外古蹟',experience:'historic',access:'normalRoad',accessShare:.35},
 outdoor_market:{icon:'🧺',label:'戶外市集',experience:'outdoorMarket',access:'cityTransit',accessShare:.35},
 outlet_open_air:{icon:'🛍️',label:'戶外 Outlet',experience:'outlet',access:'normalRoad',accessShare:.38},
 theme_park:{icon:'🎢',label:'主題樂園',experience:'themePark',access:'normalRoad',accessShare:.35},
 mountain_view:{icon:'🏔️',label:'山景／展望台',experience:'mountainView',access:'mountainRoad',accessShare:.35,operationNote:'山景最後仍要配合現場能見度／Live Cam。'},
 ropeway_mountain:{icon:'🚡',label:'山岳纜車',experience:'ropeway',access:'mountainRoad',accessShare:.42,operationRequired:true,operationNote:'官方運行／停駛狀態優先於分數。'},
 hiking:{icon:'🥾',label:'行山／自然步道',experience:'hiking',access:'walkPath',accessShare:.45},
 snow_walk:{icon:'🥾',label:'雪地步行',experience:'snowWalk',access:'walkPath',accessShare:.50},
 ski_snow:{icon:'⛷️',label:'滑雪／玩雪',experience:'skiSnow',access:'mountainRoad',accessShare:.38,operationNote:'雪場運行／雪質資料要另外確認。'},
 village_scenic:{icon:'🏘️',label:'村落雪景',experience:'village',access:'winterRoad',accessShare:.48},
 waterfall_river:{icon:'💧',label:'瀑布／溪谷',experience:'waterfall',access:'winterRoad',accessShare:.42},
 cave:{icon:'🧊',label:'洞穴／室內自然景點',experience:'indoor',access:'mountainRoad',accessShare:.65},
 wildlife_outdoor:{icon:'🐒',label:'戶外動物觀察',experience:'wildlife',access:'walkPath',accessShare:.45},
 road_trip:{icon:'🚗',label:'自駕／山路',experience:'roadScenic',access:'winterRoad',accessShare:.72},
 coastal_scenic:{icon:'🌊',label:'海岸景觀',experience:'coastal',access:'normalRoad',accessShare:.35,requiresMarine:true},
 beach:{icon:'🏖️',label:'沙灘／海水浴',experience:'beach',access:'marineSafety',accessShare:.40,requiresMarine:true},
 boat_cruise:{icon:'🚤',label:'觀光船／遊船',experience:'boat',access:'marineSafety',accessShare:.58,requiresMarine:true,operationRequired:true,operationNote:'船公司官方運航狀態優先於分數。'},
 open_sea:{icon:'🐋',label:'出海／賞鯨／海釣',experience:'openSea',access:'marineSafety',accessShare:.68,requiresMarine:true,operationRequired:true,operationNote:'實際海況及船公司決定優先。'},
 ferry:{icon:'⛴️',label:'渡輪／高速船',experience:'boat',access:'marineSafety',accessShare:.78,requiresMarine:true,operationRequired:true,operationNote:'官方停航／限航直接凌駕天氣分。'},
 snorkel_dive:{icon:'🤿',label:'浮潛／潛水',experience:'snorkel',access:'marineSafety',accessShare:.58,requiresMarine:true},
 surf_water_sport:{icon:'🏄',label:'衝浪／SUP／Kayak',experience:'surf',access:'marineSafety',accessShare:.55,requiresMarine:true},
 lake_activity:{icon:'🛶',label:'湖上活動',experience:'lake',access:'normalRoad',accessShare:.42},
 cycling:{icon:'🚲',label:'單車／E-bike',experience:'cycling',access:'normalRoad',accessShare:.42},
 night_view:{icon:'🌃',label:'夜景／觀景',experience:'nightView',access:'normalRoad',accessShare:.30},
 festival_outdoor:{icon:'🏮',label:'戶外祭典／夜市',experience:'festival',access:'cityTransit',accessShare:.35},
 outdoor_onsen:{icon:'♨️',label:'露天風呂',experience:'onsen',access:'winterRoad',accessShare:.35},
 garden_park:{icon:'🌳',label:'花園／公園',experience:'garden',access:'normalRoad',accessShare:.30},
 stargazing:{icon:'✨',label:'觀星',experience:'stargazing',access:'normalRoad',accessShare:.30},
 camping:{icon:'⛺',label:'露營',experience:'camping',access:'normalRoad',accessShare:.45},
 golf:{icon:'⛳',label:'高爾夫',experience:'golf',access:'normalRoad',accessShare:.35}
};

const TYPE_FALLBACK={mountain:'mountain_view',village:'village_scenic',snowwalk:'snow_walk',road:'road_trip',cityscenic:'city_walk',city:'city_walk'};

function tripId(){return window.MultiTrip&&window.MultiTrip.id||DEFAULT_TRIP;}
function weather(){return window.MultiTripData&&window.MultiTripData.all('weather')||null;}
function regions(){return weather()&&weather().regions||{};}
function cacheKey(){return'multiTrip.weather.cache.'+tripId();}
function readCache(){try{return JSON.parse(localStorage.getItem(cacheKey())||'{}');}catch(e){return{};}}
function weighted(parts,baseline){let s=(baseline||0)*10,w=baseline||0;Object.entries(parts||{}).forEach(([k,x])=>{if(x&&x.value!=null&&x.weight>0){s+=x.value*x.weight;w+=x.weight;}});return w?clamp(s/w):null;}
function band(v,rows,reverse){if(v==null)return null;for(const r of rows){if(reverse?v<=r[0]:v>=r[0])return r[1];}return rows[rows.length-1][1];}

function metricScore(metric,value,mode,daily,m){
 const v=n(value);if(v==null)return null;
 if(metric==='visibility'){
  const km=v>200?v/1000:v;
  if(mode==='strict')return band(km,[[25,10],[15,9],[10,7],[5,4.5],[2,2.5],[0,1]],false);
  if(mode==='road')return band(km,[[10,10],[7,9],[5,8],[3,6],[1,3.5],[0,2]],false);
  if(mode==='path')return band(km,[[8,10],[5,8.5],[3,6.5],[1,4],[0,2.5]],false);
  if(mode==='low')return band(km,[[5,10],[3,9],[1,7],[0,5]],false);
  return band(km,[[15,10],[10,9],[7,8],[5,7],[3,5],[0,3]],false);
 }
 if(metric==='cloud'){
  if(mode==='strict')return band(v,[[20,10],[35,9],[50,7.5],[70,5],[85,3],[100,1.5]],true);
  if(mode==='low')return band(v,[[75,10],[90,9],[100,8]],true);
  return band(v,[[40,10],[60,9],[80,7],[100,5]],true);
 }
 if(metric==='gust'||metric==='wind'){
  if(mode==='ropeway')return band(v,[[20,10],[30,8.5],[40,6],[50,3.5],[65,2],[999,1]],true);
  if(mode==='sea')return band(v,[[15,10],[22,8.5],[30,6],[40,3.5],[55,2],[999,1]],true);
  if(mode==='surf')return band(v,[[12,10],[20,9],[28,7],[38,4.5],[999,2]],true);
  if(mode==='sheltered')return band(v,[[35,10],[50,9],[65,7],[999,5]],true);
  if(mode==='strict')return band(v,[[20,10],[30,8.5],[40,6],[50,4],[65,2],[999,1]],true);
  return band(v,[[25,10],[35,9],[45,7],[55,5],[70,3],[999,1.5]],true);
 }
 if(metric==='precip'){
  if(daily){
   if(mode==='sheltered')return band(v,[[50,10],[70,9],[85,8],[100,6.5]],true);
   if(mode==='access')return band(v,[[20,10],[40,9],[60,7.5],[80,5.5],[100,3.5]],true);
   return band(v,[[15,10],[30,9],[50,7.5],[70,5.5],[90,3.5],[100,2.5]],true);
  }
  if(mode==='sheltered')return band(v,[[0.5,10],[2,9],[5,8],[10,6.5],[999,5]],true);
  if(mode==='access')return band(v,[[0.1,10],[0.5,9],[2,7.5],[5,5.5],[10,3.5],[999,2]],true);
  return band(v,[[0.1,10],[0.5,8.5],[2,6],[5,3.5],[10,2],[999,1]],true);
 }
 if(metric==='snow'){
  if(mode==='sport'){
   if(daily)return v<=0?7:v<=5?10:v<=12?9:v<=20?7:v<=35?5:3;
   return v<=0?8:v<=0.5?10:v<=1.5?9:v<=3?7:v<=6?5:3;
  }
  const rows=daily?[[2,10],[5,9],[10,7],[20,4.5],[35,3],[999,1.5]]:[[0.2,10],[0.8,9],[2,7],[4,4.5],[8,3],[999,1.5]];
  return band(v,rows,true);
 }
 if(metric==='scenicSnow'){
  if(mode==='village')return v<=0?8:v<=5?10:v<=12?9:v<=20?7:v<=35?5:3;
  if(mode==='onsen')return v<=0?8.5:v<=5?10:v<=12?9:v<=20?7:v<=35?5:3;
  return 10;
 }
 if(metric==='snowDepth'){
  const cm=v<3?v*100:v;
  if(mode==='sport')return cm<=2?6:cm<=10?8:cm<=30?9:cm<=80?10:9;
  if(mode==='path')return band(cm,[[2,10],[5,9],[10,7.5],[20,5],[35,3],[999,1.5]],true);
  if(mode==='winterRoad')return band(cm,[[1,10],[3,8.5],[7,6.5],[15,4],[30,2],[999,1]],true);
  return band(cm,[[1,10],[3,9],[7,7],[15,5],[30,3],[999,1.5]],true);
 }
 if(metric==='apparent'){
  if(mode==='beach')return v>=26&&v<=32?10:v>=23&&v<=35?8.5:v>=20&&v<=37?6.5:4;
  if(mode==='veryCold')return v>=-12&&v<=5?10:v>=-18&&v<=8?8.5:v>=-25&&v<=10?6.5:4;
  if(mode==='cold')return v>=-8&&v<=12?10:v>=-15&&v<=18?8.5:v>=-22&&v<=22?6.5:4;
  if(mode==='neutral')return 10;
  return v>=5&&v<=25?10:v>=0&&v<=30?9:v>=-8&&v<=34?7:v>=-15&&v<=38?5:3;
 }
 if(metric==='thunder')return Number(m&&m.weatherCode)>=95?0:10;
 if(metric==='wave'){
  if(mode==='beach')return band(v,[[0.5,10],[1,8],[1.5,5.5],[2,3],[999,1]],true);
  if(mode==='snorkel')return band(v,[[0.4,10],[0.8,8],[1.2,5],[1.8,2.5],[999,1]],true);
  if(mode==='surf')return v>=0.8&&v<=1.8?10:v>=0.5&&v<=2.5?8:v>=0.3&&v<=3?6:3;
  if(mode==='boat')return band(v,[[0.8,10],[1.5,8],[2,5],[3,2.5],[999,1]],true);
  return band(v,[[0.6,10],[1.2,8],[2,5],[3,2.5],[999,1]],true);
 }
 if(metric==='swell'){
  if(mode==='snorkel')return band(v,[[0.5,10],[1,8],[1.5,5],[2,2.5],[999,1]],true);
  if(mode==='surf')return v>=0.8&&v<=2?10:v>=0.5&&v<=2.8?8:v>=0.3&&v<=3.5?6:3;
  if(mode==='boat')return band(v,[[1,10],[1.8,8],[2.5,5],[3.5,2.5],[999,1]],true);
  return band(v,[[0.8,10],[1.5,8],[2.2,5],[3,2.5],[999,1]],true);
 }
 if(metric==='waterTemp'){
  if(mode==='swim')return v>=25&&v<=31?10:v>=22&&v<=32?8:v>=19&&v<=33?6:3;
  return v>=20&&v<=30?10:v>=16&&v<=32?8:v>=12&&v<=34?6:3;
 }
 if(metric==='marineVisibility')return mode==='snorkel'?band(v,[[15,10],[10,9],[7,7],[4,5],[0,3]],false):band(v,[[10,10],[5,8],[0,5]],false);
 return null;
}

function presetScore(group,id,m,daily){
 const p=PRESETS[group]&&PRESETS[group][id];if(!p)return null;
 const parts={};
 Object.entries(p.weights||{}).forEach(([metric,weight])=>{
  let value=m&&m[metric];
  if(metric==='scenicSnow')value=m&&m.snow;
  parts[metric]={weight,value:metricScore(metric,value,(p.modes||{})[metric]||'',daily,m)};
 });
 return weighted(parts,p.baseline||0);
}
function safetyCap(final,access){
 if(access==null)return final;
 if(access<2.5)return Math.min(final,3.5);
 if(access<4)return Math.min(final,5.0);
 if(access<5.5)return Math.min(final,6.5);
 return final;
}
function profileResult(id,m,daily){
 const p=PROFILES[id];if(!p)return null;
 const experience=presetScore('experience',p.experience,m,daily);
 const access=presetScore('access',p.access,m,daily);
 if(experience==null&&access==null)return null;
 const e=experience==null?10:experience,a=access==null?10:access,share=p.accessShare==null?.4:p.accessShare;
 let final=e*(1-share)+a*share;final=safetyCap(final,a);
 if(Number(m&&m.weatherCode)>=95&&!['indoor','cave'].includes(id))final=Math.min(final,4);
 final=round1(final);
 const marineMissing=!!p.requiresMarine&&[m&&m.wave,m&&m.swell,m&&m.waterTemp].every(x=>n(x)==null);
 return{id,icon:p.icon,label:p.label,experience:round1(e),access:round1(a),final,colour:final>=8?'green':final>=5.5?'yellow':'red',marineMissing,operationRequired:!!p.operationRequired,note:p.operationNote||''};
}
function normalizeProfiles(region){
 let raw=region&&region.activityProfiles;
 if(!Array.isArray(raw)||!raw.length)raw=[TYPE_FALLBACK[region&&region.type]||'city_walk'];
 return raw.map(x=>typeof x==='string'?{id:x,weight:1}:x).filter(x=>x&&PROFILES[x.id]).map(x=>({id:x.id,weight:Number(x.weight)>0?Number(x.weight):1}));
}
function regionResult(regionId,m,daily){
 const r=regions()[regionId];if(!r)return null;const specs=normalizeProfiles(r),results=specs.map(s=>({spec:s,res:profileResult(s.id,m,daily)})).filter(x=>x.res);if(!results.length)return null;
 let es=0,ew=0,fs=0,fw=0,accessMin=10,marineMissing=false,operation=false,notes=[];
 results.forEach(({spec,res})=>{es+=res.experience*spec.weight;ew+=spec.weight;fs+=res.final*spec.weight;fw+=spec.weight;accessMin=Math.min(accessMin,res.access);marineMissing=marineMissing||res.marineMissing;operation=operation||res.operationRequired;if(res.note)notes.push(res.note);});
 const experience=round1(es/ew),access=round1(accessMin),final=round1(safetyCap(fs/fw,access)),colour=final>=8?'green':final>=5.5?'yellow':'red';
 let text=final>=9?'非常理想':final>=8?'適合':final>=6.5?'可以去':final>=5.5?'勉強可以':'不理想';
 if(access<4)text='到達／安全條件差';else if(access<5.5)text='安全條件要優先考慮';
 return{regionId,experience,access,final,colour,text,profiles:results.map(x=>x.res),marineMissing,operationRequired:operation,notes:[...new Set(notes)]};
}

function currentMetrics(data){
 const c=data&&data.current||{};return{visibility:c.visibility,cloud:c.cloud_cover,gust:c.wind_gusts_10m,wind:c.wind_speed_10m,precip:c.precipitation,snow:c.snowfall,snowDepth:closestSnow(data,c.time),apparent:c.apparent_temperature,weatherCode:c.weather_code,wave:c.wave_height,swell:c.swell_wave_height,waterTemp:c.sea_surface_temperature,marineVisibility:c.marine_visibility};
}
function dailyMetrics(data,i){
 const d=data&&data.daily||{},max=n(d.apparent_temperature_max&&d.apparent_temperature_max[i]),min=n(d.apparent_temperature_min&&d.apparent_temperature_min[i]);return{visibility:d.visibility_mean&&d.visibility_mean[i],cloud:d.cloud_cover_mean&&d.cloud_cover_mean[i],gust:d.wind_gusts_10m_max&&d.wind_gusts_10m_max[i],wind:d.wind_speed_10m_max&&d.wind_speed_10m_max[i],precip:d.precipitation_probability_max&&d.precipitation_probability_max[i],snow:d.snowfall_sum&&d.snowfall_sum[i],snowDepth:noonSnow(data,d.time&&d.time[i]),apparent:max!=null&&min!=null?(max+min)/2:(max!=null?max:min),weatherCode:d.weather_code&&d.weather_code[i],wave:d.wave_height_max&&d.wave_height_max[i],swell:d.swell_wave_height_max&&d.swell_wave_height_max[i],waterTemp:d.sea_surface_temperature_max&&d.sea_surface_temperature_max[i],marineVisibility:d.marine_visibility_mean&&d.marine_visibility_mean[i]};
}
function closestSnow(data,target){const h=data&&data.hourly,t=h&&h.time,v=h&&h.snow_depth;if(!t||!v||!t.length)return null;let best=0,dist=Infinity,tt=Date.parse(target||t[0]);for(let i=0;i<t.length;i++){const dd=Math.abs(Date.parse(t[i])-tt);if(dd<dist){dist=dd;best=i;}}return n(v[best]);}
function noonSnow(data,day){const h=data&&data.hourly,t=h&&h.time,v=h&&h.snow_depth;if(!t||!v||!day)return null;let i=t.indexOf(day+'T12:00');if(i<0)i=t.findIndex(x=>x.indexOf(day+'T12:')===0);if(i<0)i=t.findIndex(x=>x.indexOf(day+'T')===0);return i>=0?n(v[i]):null;}
function activeRegion(){const b=document.querySelector('#weather3dPanel .weather3d-region.active[data-region]');return b&&b.dataset.region||null;}
function colourDot(c){return c==='green'?'🟢':c==='yellow'?'🟡':'🔴';}

function ensureStyle(){
 if(document.getElementById('weatherProfileStandardV1Style'))return;
 const s=document.createElement('style');s.id='weatherProfileStandardV1Style';s.textContent=`
 .weather-profile-split{display:flex;gap:7px;flex-wrap:wrap;margin-top:5px;font-size:10px;font-weight:800}.weather-profile-split span{padding:3px 6px;border-radius:8px;background:rgba(255,255,255,.72);border:1px solid rgba(80,110,130,.16)}
 .weather-profile-chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}.weather-profile-chip{font-size:9px;padding:3px 6px;border-radius:9px;background:rgba(255,255,255,.68);border:1px solid rgba(80,110,130,.14);white-space:nowrap}
 .weather-profile-note{margin-top:5px;font-size:9px;line-height:1.45;opacity:.86}.weather-profile-note.warn{font-weight:800}
 `;document.head.appendChild(s);
}
function decorateScore(el,result,trend,label){
 if(!el||!result)return;
 el.classList.remove('weather-suit-green','weather-suit-yellow','weather-suit-red');el.classList.add('weather-suit-'+result.colour);el.dataset.profileStandard='v1';
 const chips=result.profiles.map(p=>'<span class="weather-profile-chip">'+esc(p.icon)+' '+esc(p.label)+' '+p.final.toFixed(1)+'</span>').join('');
 const extra=[];if(result.operationRequired)extra.push('官方運行／停駛狀態優先於分數');if(result.marineMissing)extra.push('海況資料未齊：海上活動分只屬初步天氣分');result.notes.forEach(x=>extra.push(x));
 el.innerHTML='<div class="weather-suit-main"><span>'+colourDot(result.colour)+'</span><strong>'+esc(label)+'行程適合度 '+result.final.toFixed(1)+'/10</strong><span>'+esc(result.text)+(trend?'｜趨勢參考':'')+'</span></div>'
  +'<div class="weather-profile-split"><span>🎯 體驗 '+result.experience.toFixed(1)+'/10</span><span>🚗 到達／安全 '+result.access.toFixed(1)+'/10</span></div>'
  +'<div class="weather-profile-chips">'+chips+'</div>'
  +(extra.length?'<div class="weather-profile-note'+(result.access<5.5||result.marineMissing?' warn':'')+'">'+esc([...new Set(extra)].join('｜'))+'</div>':'');
}
function apply(){
 const rid=activeRegion();if(!rid)return false;const hit=readCache()[rid],data=hit&&hit.data;if(!data)return false;const r=regions()[rid]||{},label=r.label||r.name||rid;
 const live=document.querySelector('#weather3dPanel .weather-live-wrap .weather-suit');if(live)decorateScore(live,regionResult(rid,currentMetrics(data),false),false,label);
 document.querySelectorAll('#weather3dPanel .weather3d-day').forEach((card,i)=>{const el=card.querySelector('.weather-suit');if(el)decorateScore(el,regionResult(rid,dailyMetrics(data,i),true),i>=3,label);});
 document.documentElement.dataset.weatherProfileStandard='v1';return true;
}
function schedule(){[80,260,650,1200,2200].forEach(t=>setTimeout(apply,t));}

window.MultiTripWeatherProfileStandard={__v1:true,profiles:PROFILES,presets:PRESETS,profileResult,regionResult,apply,schedule};
if(window.MultiTripWeather)Object.assign(window.MultiTripWeather,{activityProfiles:PROFILES,scoreActivityProfile:profileResult,scoreActivityRegion:regionResult});

Promise.all([
 window.MultiTrip&&window.MultiTrip.ready?window.MultiTrip.ready:Promise.resolve(),
 window.MultiTripData&&window.MultiTripData.ready?window.MultiTripData.ready:Promise.resolve()
]).then(()=>{ensureStyle();schedule();}).catch(()=>{});
document.addEventListener('multitrip:weatherregionchange',schedule);
document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('#weather3dPanel .weather3d-region,#weather3dRefresh');if(t)schedule();},true);
window.addEventListener('online',schedule);
})();
