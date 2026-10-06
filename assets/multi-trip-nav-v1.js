(function(){
'use strict';
if(window.MultiTripNav&&window.MultiTripNav.__v1)return;
function mt(){return window.MultiTrip;}function type(){const f=location.pathname.split('/').pop()||'index.html';return f==='itinerary.html'?'itinerary':f==='trip-info.html'?'tripInfo':f==='attractions.html'?'attractions':f==='live.html'?'liveCam':'home';}
function href(path){return mt()&&mt().withTrip?mt().withTrip(path):path;}function enabled(name){return !mt()||mt().feature(name);}
function renderOne(sw){if(!sw)return;const page=type(),q=new URLSearchParams(location.search),travel=q.get('travel')==='1',drive=q.get('drive')==='1';const defs=[
{key:'home',label:'🏠 旅程',url:'index.html',on:true,active:page==='home',attrs:'data-multi-trip-home="1"'},
{key:'itinerary',label:'🗓️ 詳細行程',url:href('itinerary.html'),on:enabled('itinerary'),active:page==='itinerary'&&!travel&&!drive},
{key:'tripInfo',label:'🧳 旅程資料',url:href('trip-info.html'),on:enabled('tripInfo'),active:page==='tripInfo'},
{key:'attractions',label:'🗾 景點總覽',url:href('attractions.html'),on:enabled('attractions'),active:page==='attractions'},
{key:'liveCam',label:'📹 Live Cam',url:href('live.html'),on:enabled('liveCam'),active:page==='liveCam',attrs:'data-feature-link="liveCam"'},
{key:'todayMode',label:'🧭 今日模式',url:href('itinerary.html?travel=1'),on:enabled('todayMode'),active:page==='itinerary'&&travel,attrs:'data-travel-mode-link="1"'},
{key:'drivingMode',label:'🚗 揸車模式',url:href('itinerary.html?drive=1'),on:enabled('drivingMode'),active:page==='itinerary'&&drive,attrs:'data-driving-mode-link="1"'}];
sw.innerHTML=defs.filter(x=>x.on).map(x=>'<a href="'+x.url+'" data-mt-nav="'+x.key+'" '+(x.attrs||'')+' class="'+(x.active?'active':'')+'">'+x.label+'</a>').join('');sw.dataset.multiTripManaged='1';}
function render(){document.querySelectorAll('.page-switch').forEach(renderOne);}function boot(){const p=mt()&&mt().ready?mt().ready:Promise.resolve();p.then(()=>{render();[180,650,1600,3600,5600].forEach(t=>setTimeout(render,t));});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.MultiTripNav={__v1:true,render};
})();
