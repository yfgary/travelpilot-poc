import { chromium } from 'playwright';
import crypto from 'node:crypto';

const candidateBase='http://127.0.0.1:8000';
const referenceBase='http://127.0.0.1:8001';
const trip='shirakawago-shinhotaka-2027';
const failures=[];
const assert=(v,m)=>{if(!v)throw new Error(m);};
const norm=s=>String(s??'').replace(/\s+/g,' ').trim();

const fixture={
  latitude:36.2,longitude:137.9,generationtime_ms:0,utc_offset_seconds:32400,timezone:'Asia/Tokyo',
  current_units:{time:'iso8601',temperature_2m:'°C',relative_humidity_2m:'%',apparent_temperature:'°C',precipitation:'mm',snowfall:'cm',weather_code:'wmo code',cloud_cover:'%',wind_speed_10m:'km/h',wind_gusts_10m:'km/h',visibility:'m'},
  current:{time:'2026-10-07T13:00',temperature_2m:13,relative_humidity_2m:72,apparent_temperature:12,precipitation:0,snowfall:0,weather_code:1,cloud_cover:32,wind_speed_10m:8,wind_gusts_10m:18,visibility:10000},
  hourly_units:{time:'iso8601',snow_depth:'m'},
  hourly:{
    time:['2026-10-07T12:00','2026-10-08T12:00','2026-10-09T12:00','2026-10-10T12:00','2026-10-11T12:00','2026-10-12T12:00','2026-10-13T12:00','2026-10-14T12:00'],
    snow_depth:[0,0,0,0,0,0,0,0]
  },
  daily_units:{time:'iso8601',weather_code:'wmo code',temperature_2m_max:'°C',temperature_2m_min:'°C',apparent_temperature_max:'°C',apparent_temperature_min:'°C',precipitation_probability_max:'%',snowfall_sum:'cm',wind_gusts_10m_max:'km/h',visibility_mean:'m',visibility_min:'m',visibility_max:'m',cloud_cover_mean:'%'},
  daily:{
    time:['2026-10-07','2026-10-08','2026-10-09','2026-10-10','2026-10-11','2026-10-12','2026-10-13','2026-10-14'],
    weather_code:[1,2,0,1,2,3,1,0],
    temperature_2m_max:[20,22,24,24,23,21,19,18],
    temperature_2m_min:[11,12,11,10,10,9,8,7],
    apparent_temperature_max:[19,21,23,23,22,20,18,17],
    apparent_temperature_min:[10,11,10,9,9,8,7,6],
    precipitation_probability_max:[10,10,10,15,20,30,20,10],
    snowfall_sum:[0,0,0,0,0,0,0,0],
    wind_gusts_10m_max:[18,20,19,22,24,25,20,18],
    visibility_mean:[10000,10000,12000,11000,10000,9000,10000,12000],
    visibility_min:[8000,8000,10000,9000,8000,7000,8000,10000],
    visibility_max:[15000,15000,16000,15000,15000,14000,15000,16000],
    cloud_cover_mean:[32,45,20,30,50,70,35,20]
  }
};

async function prep(page){
  await page.addInitScript(() => {
    const fixed=Date.parse('2026-10-07T05:00:00Z');
    const RealDate=Date;
    class MockDate extends RealDate{
      constructor(...args){ super(...(args.length?args:[fixed])); }
      static now(){ return fixed; }
    }
    Object.setPrototypeOf(MockDate,RealDate);
    window.Date=MockDate;
  });
  await page.route('**/api.open-meteo.com/**',route=>route.fulfill({
    status:200,
    contentType:'application/json',
    body:JSON.stringify(fixture)
  }));
}

async function open(base,path,candidate=false){
  const page=await browser.newPage({viewport:{width:1440,height:1100},serviceWorkers:'block'});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await prep(page);
  await page.goto(base+path,{waitUntil:'domcontentloaded'});
  if(candidate) await page.waitForFunction(()=>document.documentElement.dataset.standardRuntimeLoader==='v1',{timeout:15000});
  await page.waitForSelector('#weather3dPanel',{timeout:15000});
  await page.waitForSelector('details.day#d9',{timeout:15000});
  await page.waitForTimeout(3600);
  return {page,errors};
}

async function snapshot(page){
  return page.evaluate(() => {
    const texts=(sel)=>[...document.querySelectorAll(sel)].map(x=>(x.innerText||x.textContent||'').replace(/\s+/g,' ').trim());
    const count=sel=>document.querySelectorAll(sel).length;
    const dayCounts={};
    document.querySelectorAll('details.day[id]').forEach(d=>{
      dayCounts[d.id]={
        timeline:d.querySelectorAll('.timeline-item').length,
        images:d.querySelectorAll('img').length,
        highlights:d.querySelectorAll('.highlight-item').length,
        info:d.querySelectorAll('.enhance-info-btn,.multi-trip-info-btn').length,
        maps:d.querySelectorAll('.map-pin').length,
        special:d.querySelectorAll('.special-box').length
      };
    });
    const floatingNodes=[...document.querySelectorAll('#siteVersionBadge,#catalogVersion,#backToTopBtn,.tripv2-status,.floating-top')];
    const floatingTexts=floatingNodes.map(x=>(x.innerText||x.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean);
    let bodyText=(document.body.innerText||'').replace(/\s+/g,' ').trim();
    for(const t of floatingTexts) bodyText=bodyText.replace(t,'').replace(/\s+/g,' ').trim();
    const floating={
      version:[...document.querySelectorAll('#siteVersionBadge,#catalogVersion')].map(x=>(x.innerText||x.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean).sort(),
      status:[...document.querySelectorAll('.tripv2-status')].map(x=>(x.innerText||x.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean).sort(),
      backToTop:document.querySelectorAll('#backToTopBtn,.floating-top').length
    };
    return {
      bodyText,
      floating,
      pageSwitch:texts('.page-switch a'),
      dayNav:texts('.day-nav-inner a,.day-nav-inner button'),
      dayTitles:texts('details.day .day-title'),
      dayRoutes:texts('details.day .day-route'),
      dayCounts,
      weather:{
        panel:count('#weather3dPanel'),
        regions:texts('#weather3dRegions .weather3d-region'),
        forecastCards:count('#weather3dPanel .weather3d-day'),
        liveMetrics:count('#weather3dPanel .weather-live-metric'),
        suits:count('#weather3dPanel .weather-suit')
      },
      d68:{
        panel:count('#d6d8WeatherDecision'),
        cards:count('#d6d8WeatherDecision .d68-card')
      },
      selector:count('#tripv2WeatherSelect'),
      photos:{
        sections:count('.photo-section'),
        images:count('.photo-section img'),
        zoomable:count('img.zoomable')
      },
      controls:{
        today:count('#todayBtn'),
        collapse:count('#collapseAll'),
        expand:count('#expandAll'),
        photoModal:count('#photoModal')
      },
      rich:{
        price:count('.price'),
        backup:count('.special-box.backup'),
        bonus:count('.special-box.bonus'),
        weather:count('.special-box.weather'),
        credits:count('details.credits')
      },
      bonusText:(document.body.innerText||'').includes('雪景神社')||(document.body.innerText||'').includes('鳥居 Bonus')
    };
  });
}

async function overlaySnapshot(page,selector){
  return page.locator(selector).evaluate(el=>({
    hidden:el.hidden,
    text:(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim(),
    buttons:[...el.querySelectorAll('button')].map(x=>(x.innerText||x.textContent||'').replace(/\s+/g,' ').trim()),
    links:[...el.querySelectorAll('a[href]')].map(x=>({
      text:(x.innerText||x.textContent||'').replace(/\s+/g,' ').trim(),
      href:x.getAttribute('href')||''
    })),
    dayButtons:[...el.querySelectorAll('[data-tm-day],[data-dm-day]')].map(x=>({
      day:x.getAttribute('data-tm-day')||x.getAttribute('data-dm-day')||'',
      active:x.classList.contains('active')
    }))
  }));
}

function diff(a,b,path='root',out=[]){
  if(typeof a!==typeof b){out.push(path+': type '+typeof a+' != '+typeof b);return out;}
  if(a===null||b===null||typeof a!=='object'){if(a!==b)out.push(path+': '+JSON.stringify(a)+' != '+JSON.stringify(b));return out;}
  if(Array.isArray(a)!==Array.isArray(b)){out.push(path+': array mismatch');return out;}
  if(Array.isArray(a)){
    if(a.length!==b.length)out.push(path+': length '+a.length+' != '+b.length);
    for(let i=0;i<Math.min(a.length,b.length);i++)diff(a[i],b[i],path+'['+i+']',out);
    return out;
  }
  const keys=new Set([...Object.keys(a),...Object.keys(b)]);
  for(const k of keys){
    if(!(k in a)||!(k in b))out.push(path+'.'+k+': missing');
    else diff(a[k],b[k],path+'.'+k,out);
  }
  return out;
}

const browser=await chromium.launch({headless:true});
try{
  const baseline=await open(referenceBase,'/itinerary.html?trip='+trip,false);
  const candidate=await open(candidateBase,'/itinerary.html?trip='+trip,true);

  assert(baseline.errors.length===0,'baseline page errors: '+baseline.errors.join(' | '));
  assert(candidate.errors.length===0,'candidate page errors: '+candidate.errors.join(' | '));

  const [a,b]=await Promise.all([snapshot(baseline.page),snapshot(candidate.page)]);
  const differences=diff(a,b);
  if(differences.length) failures.push('DOM/feature parity:\n'+differences.slice(0,80).join('\n'));

  // Golden-reference gates: these features must exist before any later migration step.
  for(const [label,value,min] of [
    ['weather panel',b.weather.panel,1],
    ['5-day forecast',b.weather.forecastCards,5],
    ['weather live metrics',b.weather.liveMetrics,7],
    ['D1-D9 cards',Object.keys(b.dayCounts).length,9],
    ['photo sections',b.photos.sections,8],
    ['zoomable photos',b.photos.zoomable,20],
    ['price badges',b.rich.price,1],
    ['weather special boxes',b.rich.weather,1],
    ['photo credits',b.rich.credits,1]
  ]) if(value<min) failures.push(label+' '+value+' < '+min);
  if(!b.bonusText) failures.push('Snow shrine / torii Bonus text missing');
  if(b.d68.panel!==1||b.d68.cards!==3) failures.push('D6-D8 weather comparison parity missing');
  if(b.selector!==1) failures.push('D6-D8 selector parity missing');

  // Interaction parity: photo zoom.
  await baseline.page.locator('details.day#d1').evaluate(el=>{el.open=true;});
  await candidate.page.locator('details.day#d1').evaluate(el=>{el.open=true;});
  const baseZoom=baseline.page.locator('#d1 img.zoomable').first();
  const candZoom=candidate.page.locator('#d1 img.zoomable').first();
  await baseZoom.scrollIntoViewIfNeeded(); await candZoom.scrollIntoViewIfNeeded();
  await baseZoom.click(); await candZoom.click();
  const baseModal=await baseline.page.locator('#photoModal').evaluate(el=>({hidden:el.hidden,display:getComputedStyle(el).display,text:(el.innerText||'').replace(/\s+/g,' ').trim()}));
  const candModal=await candidate.page.locator('#photoModal').evaluate(el=>({hidden:el.hidden,display:getComputedStyle(el).display,text:(el.innerText||'').replace(/\s+/g,' ').trim()}));
  const modalDiff=diff(baseModal,candModal,'photoModal');
  if(modalDiff.length) failures.push('Photo zoom parity:\n'+modalDiff.join('\n'));


  // Interaction parity: Today mode. Verify the overlay itself and a day switch.
  await baseline.page.evaluate(()=>window.Japan2027TravelMode.open('d2'));
  await candidate.page.evaluate(()=>window.Japan2027TravelMode.open('d2'));
  await baseline.page.waitForSelector('#travelModeOverlay:not([hidden])');
  await candidate.page.waitForSelector('#travelModeOverlay:not([hidden])');
  await baseline.page.waitForTimeout(250); await candidate.page.waitForTimeout(250);
  const baseToday=await overlaySnapshot(baseline.page,'#travelModeOverlay');
  const candToday=await overlaySnapshot(candidate.page,'#travelModeOverlay');
  const todayDiff=diff(baseToday,candToday,'todayMode');
  if(todayDiff.length) failures.push('Today mode parity:\n'+todayDiff.slice(0,80).join('\n'));
  await baseline.page.locator('#travelModeOverlay [data-tm-day="d3"]').click();
  await candidate.page.locator('#travelModeOverlay [data-tm-day="d3"]').click();
  await baseline.page.waitForTimeout(150); await candidate.page.waitForTimeout(150);
  const baseTodayD3=await overlaySnapshot(baseline.page,'#travelModeOverlay');
  const candTodayD3=await overlaySnapshot(candidate.page,'#travelModeOverlay');
  const todayD3Diff=diff(baseTodayD3,candTodayD3,'todayModeD3');
  if(todayD3Diff.length) failures.push('Today mode D3 switch parity:\n'+todayD3Diff.slice(0,80).join('\n'));
  await baseline.page.evaluate(()=>window.Japan2027TravelMode.close());
  await candidate.page.evaluate(()=>window.Japan2027TravelMode.close());

  // Interaction parity: Driving mode. Verify destination details and next-stop action.
  await baseline.page.evaluate(()=>window.Japan2027DrivingMode.open('d2'));
  await candidate.page.evaluate(()=>window.Japan2027DrivingMode.open('d2'));
  await baseline.page.waitForSelector('#drivingModeOverlay:not([hidden])');
  await candidate.page.waitForSelector('#drivingModeOverlay:not([hidden])');
  await baseline.page.waitForTimeout(250); await candidate.page.waitForTimeout(250);
  const baseDrive=await overlaySnapshot(baseline.page,'#drivingModeOverlay');
  const candDrive=await overlaySnapshot(candidate.page,'#drivingModeOverlay');
  const driveDiff=diff(baseDrive,candDrive,'drivingMode');
  if(driveDiff.length) failures.push('Driving mode parity:\n'+driveDiff.slice(0,80).join('\n'));
  await baseline.page.locator('#drivingModeOverlay #dmNext').click();
  await candidate.page.locator('#drivingModeOverlay #dmNext').click();
  await baseline.page.waitForTimeout(150); await candidate.page.waitForTimeout(150);
  const baseDriveNext=await overlaySnapshot(baseline.page,'#drivingModeOverlay');
  const candDriveNext=await overlaySnapshot(candidate.page,'#drivingModeOverlay');
  const driveNextDiff=diff(baseDriveNext,candDriveNext,'drivingModeNext');
  if(driveNextDiff.length) failures.push('Driving mode next-stop parity:\n'+driveNextDiff.slice(0,80).join('\n'));
  await baseline.page.evaluate(()=>window.Japan2027DrivingMode.close());
  await candidate.page.evaluate(()=>window.Japan2027DrivingMode.close());

  // Same deterministic viewport + data should render identical pixels.
  await baseline.page.locator('#photoModal').press('Escape').catch(()=>{});
  await candidate.page.locator('#photoModal').press('Escape').catch(()=>{});
  await baseline.page.waitForTimeout(150); await candidate.page.waitForTimeout(150);
  const pngA=await baseline.page.screenshot({fullPage:true,animations:'disabled'});
  const pngB=await candidate.page.screenshot({fullPage:true,animations:'disabled'});
  const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
  const ha=hash(pngA),hb=hash(pngB);
  if(ha!==hb) failures.push('Visual screenshot hash mismatch '+ha+' != '+hb);

  await baseline.page.close(); await candidate.page.close();
}finally{
  await browser.close();
}

if(failures.length){
  console.error('\nRound 7 parity failures:\n'+failures.map(x=>' - '+x).join('\n'));
  process.exit(1);
}
console.log('Round 7 Golden Reference feature + DOM + visual parity PASS');
