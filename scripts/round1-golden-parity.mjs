import { chromium } from 'playwright';
import crypto from 'node:crypto';

const candidateBase='http://127.0.0.1:8000';
const referenceBase='http://127.0.0.1:8001';
const trip='shirakawago-shinhotaka-2027';
const failures=[];
const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
const fixture={
 latitude:36.2,longitude:137.9,generationtime_ms:0,utc_offset_seconds:32400,timezone:'Asia/Tokyo',
 current_units:{time:'iso8601',temperature_2m:'°C',relative_humidity_2m:'%',apparent_temperature:'°C',precipitation:'mm',snowfall:'cm',weather_code:'wmo code',cloud_cover:'%',wind_speed_10m:'km/h',wind_gusts_10m:'km/h',visibility:'m'},
 current:{time:'2026-10-07T13:00',temperature_2m:13,relative_humidity_2m:72,apparent_temperature:12,precipitation:0,snowfall:0,weather_code:1,cloud_cover:32,wind_speed_10m:8,wind_gusts_10m:18,visibility:10000},
 hourly_units:{time:'iso8601',snow_depth:'m'},
 hourly:{time:['2026-10-07T12:00','2026-10-08T12:00','2026-10-09T12:00','2026-10-10T12:00','2026-10-11T12:00','2026-10-12T12:00'],snow_depth:[0,0,0,0,0,0]},
 daily_units:{time:'iso8601',weather_code:'wmo code',temperature_2m_max:'°C',temperature_2m_min:'°C',apparent_temperature_max:'°C',apparent_temperature_min:'°C',precipitation_probability_max:'%',snowfall_sum:'cm',wind_gusts_10m_max:'km/h',visibility_mean:'m',visibility_min:'m',visibility_max:'m',cloud_cover_mean:'%'},
 daily:{time:['2026-10-07','2026-10-08','2026-10-09','2026-10-10','2026-10-11','2026-10-12'],weather_code:[1,2,0,1,2,3],temperature_2m_max:[20,22,24,24,23,21],temperature_2m_min:[11,12,11,10,10,9],apparent_temperature_max:[19,21,23,23,22,20],apparent_temperature_min:[10,11,10,9,9,8],precipitation_probability_max:[10,10,10,15,20,30],snowfall_sum:[0,0,0,0,0,0],wind_gusts_10m_max:[18,20,19,22,24,25],visibility_mean:[10000,10000,12000,11000,10000,9000],visibility_min:[8000,8000,10000,9000,8000,7000],visibility_max:[15000,15000,16000,15000,15000,14000],cloud_cover_mean:[32,45,20,30,50,70]}
};

async function prep(page){
 await page.addInitScript(()=>{
   const fixed=Date.parse('2026-10-07T05:00:00Z'),RealDate=Date;
   class MockDate extends RealDate{constructor(...args){super(...(args.length?args:[fixed]));}static now(){return fixed;}}
   Object.setPrototypeOf(MockDate,RealDate);window.Date=MockDate;
 });
 await page.route('**/api.open-meteo.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
}
async function open(base,path){
 const page=await browser.newPage({viewport:{width:1440,height:1100},serviceWorkers:'block'});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));await prep(page);
 await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.waitForTimeout(3600);
 return {page,errors};
}
async function normalizeRuntimeUi(page){
 await page.evaluate(()=>{
   document.querySelectorAll('#siteVersionBadge,#catalogVersion').forEach(x=>{x.textContent='VERSION';x.title='';});
   document.querySelectorAll('#backToTopBtn,.floating-top').forEach(x=>x.classList.remove('show'));
 });
}
async function bodySnapshot(page){
 return page.evaluate(()=>{
   const clone=document.body.cloneNode(true);
   clone.querySelectorAll('#siteVersionBadge,#catalogVersion,#backToTopBtn,.tripv2-status,.floating-top,script,style,template,noscript').forEach(x=>x.remove());
   return {
     text:(clone.innerText||clone.textContent||'').replace(/\s+/g,' ').trim(),
     links:[...document.querySelectorAll('.page-switch a')].map(x=>(x.textContent||'').replace(/\s+/g,' ').trim()),
     dayCount:document.querySelectorAll('details.day[id]').length,
     regionCount:document.querySelectorAll('details.region[id]').length,
     sectionCount:document.querySelectorAll('main section,.container section').length
   };
 });
}
function diff(a,b,path='root',out=[]){
 if(typeof a!==typeof b){out.push(path+': type mismatch');return out;}
 if(a===null||b===null||typeof a!=='object'){
  if(a!==b){
   if(typeof a==='string'&&typeof b==='string'){
    let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;
    const start=Math.max(0,i-260),endA=Math.min(a.length,i+360),endB=Math.min(b.length,i+360);
    out.push(path+': first string difference at '+i+'\nREFERENCE …'+JSON.stringify(a.slice(start,endA))+'…\nCANDIDATE …'+JSON.stringify(b.slice(start,endB))+'…');
   }else out.push(path+': '+JSON.stringify(a)+' != '+JSON.stringify(b));
  }
  return out;
 }
 if(Array.isArray(a)){if(a.length!==b.length)out.push(path+': length '+a.length+' != '+b.length);for(let i=0;i<Math.min(a.length,b.length);i++)diff(a[i],b[i],path+'['+i+']',out);return out;}
 for(const k of new Set([...Object.keys(a),...Object.keys(b)])){if(!(k in a)||!(k in b))out.push(path+'.'+k+': missing');else diff(a[k],b[k],path+'.'+k,out);}
 return out;
}
async function comparePage(path,{screenshot=true}={}){
 const a=await open(referenceBase,path),b=await open(candidateBase,path);
 if(a.errors.length)failures.push(path+' production page errors: '+a.errors.join(' | '));
 if(b.errors.length)failures.push(path+' POC page errors: '+b.errors.join(' | '));
 await normalizeRuntimeUi(a.page);await normalizeRuntimeUi(b.page);
 const [sa,sb]=await Promise.all([bodySnapshot(a.page),bodySnapshot(b.page)]);
 const d=diff(sa,sb,path);if(d.length)failures.push(path+' DOM/text parity:\n'+d.slice(0,80).join('\n'));
 if(screenshot){
   const [pa,pb]=await Promise.all([
     a.page.screenshot({fullPage:true,animations:'disabled'}),
     b.page.screenshot({fullPage:true,animations:'disabled'})
   ]);
   const h=x=>crypto.createHash('sha256').update(x).digest('hex');
   if(h(pa)!==h(pb))failures.push(path+' screenshot hash mismatch '+h(pa)+' != '+h(pb));
 }
 return {a,b};
}
async function overlaySnapshot(page,sel){return page.locator(sel).evaluate(el=>({hidden:el.hidden,text:(el.innerText||'').replace(/\s+/g,' ').trim(),htmlClass:el.className}));}
async function itineraryStructure(page){
 return page.evaluate(()=>[...document.querySelectorAll('details.day[id]')].map(day=>({
   id:day.id,
   children:[...(day.querySelector(':scope > .day-inner')?.children||[])].map(x=>x.tagName.toLowerCase()+'.'+[...x.classList].join('.')),
   counts:{
     timeline:day.querySelectorAll('.timeline-item').length,
     mapPins:day.querySelectorAll('a.map-pin').length,
     info:day.querySelectorAll('.enhance-info-btn,.attraction-info-btn,.v90-shrine-info-btn,.backup-info-btn').length,
     jp:day.querySelectorAll('.jp-place-name').length,
     duration:day.querySelectorAll('.duration-badge').length,
     visit:day.querySelectorAll('.visit-meta,.visit-meta-inline,.visit-meta-backup').length,
     routeStop:day.querySelectorAll('.v90-route-stop').length,
     backup:day.querySelectorAll('details.backup-panel').length
   }
 })));
}

const browser=await chromium.launch({headless:true});
try{
 const it=await comparePage('/itinerary.html?trip='+trip,{screenshot:true});
 const info=await comparePage('/trip-info.html?trip='+trip,{screenshot:true});
 const attr=await comparePage('/attractions.html?trip='+trip,{screenshot:true});
 const live=await comparePage('/live.html?trip='+trip,{screenshot:false});
 await info.a.page.close();await info.b.page.close();await attr.a.page.close();await attr.b.page.close();await live.a.page.close();await live.b.page.close();

 const a=it.a.page,b=it.b.page;
 const [structA,structB]=await Promise.all([itineraryStructure(a),itineraryStructure(b)]);
 const structDiff=diff(structA,structB,'itineraryStructure');
 if(structDiff.length)failures.push('Itinerary structure parity:\n'+structDiff.slice(0,120).join('\n'));
 const gates=await b.evaluate(()=>({
   selector:document.querySelectorAll('#tripv2WeatherSelect').length,
   d68Panel:document.querySelectorAll('#d6d8WeatherDecision').length,
   d68Cards:document.querySelectorAll('#d6d8WeatherDecision .d68-card').length,
   days:document.querySelectorAll('details.day[id]').length,
   weather:document.querySelectorAll('#weather3dPanel').length,
   forecast:document.querySelectorAll('#weather3dPanel .weather3d-day').length,
   photos:document.querySelectorAll('img.zoomable').length,
   today:document.querySelectorAll('#todayBtn').length
 }));
 if(gates.selector!==1)failures.push('Round 1 Golden Reference manual D6-D8 selector missing');
 if(gates.d68Panel!==1||gates.d68Cards!==3)failures.push('Round 1 Golden Reference weather D6-D8 auto-comparison surface missing');
 if(gates.days!==9||gates.weather!==1||gates.forecast<5||gates.photos<20||gates.today!==1)failures.push('Golden feature gate changed: '+JSON.stringify(gates));

 await a.locator('details.day#d1').evaluate(el=>{el.open=true;});await b.locator('details.day#d1').evaluate(el=>{el.open=true;});
 await a.locator('#d1 img.zoomable').first().click();await b.locator('#d1 img.zoomable').first().click();
 let da=await overlaySnapshot(a,'#photoModal'),db=await overlaySnapshot(b,'#photoModal');let dd=diff(da,db,'photoModal');if(dd.length)failures.push('Photo zoom parity:\n'+dd.join('\n'));
 await a.locator('#photoModal').press('Escape').catch(()=>{});await b.locator('#photoModal').press('Escape').catch(()=>{});

 await a.evaluate(()=>window.Japan2027TravelMode.open('d2'));await b.evaluate(()=>window.Japan2027TravelMode.open('d2'));
 await a.waitForSelector('#travelModeOverlay:not([hidden])');await b.waitForSelector('#travelModeOverlay:not([hidden])');
 da=await overlaySnapshot(a,'#travelModeOverlay');db=await overlaySnapshot(b,'#travelModeOverlay');dd=diff(da,db,'todayMode');if(dd.length)failures.push('Today Mode parity:\n'+dd.slice(0,60).join('\n'));
 await a.evaluate(()=>window.Japan2027TravelMode.close());await b.evaluate(()=>window.Japan2027TravelMode.close());

 await a.evaluate(()=>window.Japan2027DrivingMode.open('d2'));await b.evaluate(()=>window.Japan2027DrivingMode.open('d2'));
 await a.waitForSelector('#drivingModeOverlay:not([hidden])');await b.waitForSelector('#drivingModeOverlay:not([hidden])');
 da=await overlaySnapshot(a,'#drivingModeOverlay');db=await overlaySnapshot(b,'#drivingModeOverlay');dd=diff(da,db,'drivingMode');if(dd.length)failures.push('Driving Mode parity:\n'+dd.slice(0,60).join('\n'));
 await a.locator('#drivingModeOverlay #dmNext').click();await b.locator('#drivingModeOverlay #dmNext').click();
 await a.waitForTimeout(150);await b.waitForTimeout(150);
 da=await overlaySnapshot(a,'#drivingModeOverlay');db=await overlaySnapshot(b,'#drivingModeOverlay');dd=diff(da,db,'drivingModeNext');if(dd.length)failures.push('Driving Mode next-stop parity:\n'+dd.slice(0,60).join('\n'));

 await a.close();await b.close();
}finally{await browser.close();}
if(failures.length){console.error('\nRound 1 Golden Reference failures:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1);}
console.log('Round 1 Golden Reference source + DOM + interaction + visual parity PASS');
