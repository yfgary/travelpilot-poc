(function(){
'use strict';
if(window.MultiTripData&&window.MultiTripData.__v1)return;

let resolveReady,rejectReady;
const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
const state={tripId:null,basePath:null,files:{},data:{},errors:{}};

function get(path,root){
  const parts=String(path||'').split('.').filter(Boolean);
  let cur=root===undefined?state.data:root;
  for(const p of parts){if(cur==null)return undefined;cur=cur[p];}
  return cur;
}
function day(id){
  const arr=get('itinerary.days')||[];
  return arr.find(x=>x&&x.id===id)||null;
}
function hotel(id){
  const arr=get('hotels.hotels')||[];
  return arr.find(x=>x&&x.id===id)||null;
}
function attraction(id){
  const arr=get('attractions.attractions')||[];
  return arr.find(x=>x&&x.id===id)||null;
}
function region(id){return get('weather.regions.'+id)||null;}
function all(name){return state.data[name]||null;}

window.MultiTripData={
  __v1:true,
  ready,
  state,
  get,
  day,
  hotel,
  attraction,
  region,
  all,
  get tripId(){return state.tripId;}
};

function loadJson(url){
  return fetch(url+(url.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status+' '+url);return r.json();});
}
function boot(cfg){
  const tripId=(cfg&&cfg.id)||(window.MultiTrip&&window.MultiTrip.id)||'';
  state.tripId=tripId;
  state.basePath='trips/'+encodeURIComponent(tripId)+'/';
  const defaults={itinerary:'itinerary.json',tripInfo:'trip-info.json',hotels:'hotels.json',attractions:'attractions.json',liveCams:'live-cams.json',weather:'weather.json'};
  const files=Object.assign({},defaults,(cfg&&cfg.dataFiles)||{});
  state.files=files;
  const jobs=Object.entries(files).map(([key,file])=>loadJson(state.basePath+file).then(data=>{state.data[key]=data;}).catch(err=>{state.errors[key]=String(err&&err.message||err);}));
  Promise.all(jobs).then(()=>{
    const detail={tripId:state.tripId,data:state.data,errors:state.errors};
    document.dispatchEvent(new CustomEvent('multitrip:dataready',{detail}));
    resolveReady(window.MultiTripData);
  }).catch(rejectReady);
}

if(window.MultiTrip&&window.MultiTrip.ready){
  window.MultiTrip.ready.then(boot).catch(err=>{state.errors.trip=String(err&&err.message||err);rejectReady(err);});
}else{
  const err=new Error('MultiTrip context unavailable');state.errors.trip=err.message;rejectReady(err);
}
})();
