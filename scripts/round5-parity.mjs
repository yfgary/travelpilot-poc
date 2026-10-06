import { chromium } from 'playwright';

const base='http://127.0.0.1:8000';
const getJson=async path=>{
  const r=await fetch(base+path);
  if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
};
const assert=(value,message)=>{if(!value)throw new Error(message);};
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const failures=[];
async function check(name,fn){
  try{await fn();console.log('PASS',name);}
  catch(e){failures.push(name+': '+e.message);console.error('FAIL',name,e.message);}
}

const registry=await getJson('/trips/registry.json');
const tripId=registry.defaultTrip;
const entry=registry.trips.find(x=>x.id===tripId);
assert(entry,'default trip missing from registry');
const config=await getJson('/'+entry.config);
const dir='/trips/'+encodeURIComponent(tripId)+'/';
const [itinerary,info,attractions,hotels,live,weather,departure,report]=await Promise.all([
  getJson(dir+config.dataFiles.itinerary),
  getJson(dir+config.dataFiles.tripInfo),
  getJson(dir+config.dataFiles.attractions),
  getJson(dir+config.dataFiles.hotels),
  getJson(dir+config.dataFiles.liveCams),
  getJson(dir+config.dataFiles.weather),
  getJson(dir+config.dataFiles.departureChecklist),
  getJson(dir+'migration-report.json')
]);
const attractionIds=new Set((attractions.attractions||[]).map(x=>x.id));
const hotelById=new Map((hotels.hotels||[]).map(x=>[x.id,x]));
const camById=new Map((live.cameras||[]).map(x=>[x.id,x]));

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1365,height:980}});

async function open(path){
  const page=await context.newPage();
  const pageErrors=[];
  const internalScripts=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('request',req=>{
    try{
      const u=new URL(req.url());
      if(u.origin===new URL(base).origin && req.resourceType()==='script'){
        internalScripts.push(u.pathname.replace(/^\//,''));
      }
    }catch{}
  });
  await page.goto(base+path,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#app');
  await page.waitForTimeout(250);
  return {page,pageErrors,internalScripts:[...new Set(internalScripts)]};
}

await check('Golden manifest is pure Standard generate',async()=>{
  assert(config.schemaVersion===12,'schemaVersion is not 12');
  assert(!('legacy' in config),'legacy block still exists');
  assert((config.modules||[]).length===0,'modules must be empty');
  for(const [name,r] of Object.entries(config.renderers||{})){
    assert(r.mode==='generate',`renderer ${name} is ${r.mode}, not generate`);
  }
  assert(report.counts.days===itinerary.days.length,'migration report day count drift');
  assert(report.counts.attractions===attractions.attractions.length,'migration report attraction count drift');
  assert(report.counts.hotels===hotels.hotels.length,'migration report hotel count drift');
  assert(report.counts.liveCameras===live.cameras.length,'migration report Live Cam count drift');
});

await check('All four pages load only Standard runtime scripts',async()=>{
  const pages=[
    ['/itinerary.html?trip='+tripId,['assets/core.js','assets/modes.js','assets/render-itinerary.js']],
    ['/trip-info.html?trip='+tripId,['assets/core.js','assets/render-trip-info.js']],
    ['/attractions.html?trip='+tripId,['assets/core.js','assets/render-attractions.js']],
    ['/live.html?trip='+tripId,['assets/core.js','assets/render-live.js']]
  ];
  const banned=/trip-core|trip-enhancement|trip-v8|trip-v9|multi-trip|japan2027|site-shell|attraction-info|d6-d8-weather/i;
  for(const [url,expected] of pages){
    const {page,pageErrors,internalScripts}=await open(url);
    assert(pageErrors.length===0,`${url} pageerror: ${pageErrors.join(' | ')}`);
    assert(JSON.stringify([...internalScripts].sort())===JSON.stringify([...expected].sort()),
      `${url} scripts ${internalScripts.join(', ')} != ${expected.join(', ')}`);
    assert(!internalScripts.some(x=>banned.test(x)),`${url} loaded legacy runtime script`);
    const nav=await page.locator('.page-nav a').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
    for(const href of nav){
      const u=new URL(href,location.origin);
      assert(u.searchParams.get('trip')===tripId,`nav lost trip id: ${href}`);
    }
    await page.close();
  }
});

await check('Itinerary D1-D9 is exact Standard data render',async()=>{
  const {page,pageErrors}=await open('/itinerary.html?trip='+tripId+'&day=d6');
  assert(await page.locator('.day-card').count()===itinerary.days.length,'day count mismatch');
  for(const day of itinerary.days){
    const box=page.locator('#'+day.id);
    assert(await box.count()===1,`missing ${day.id}`);
    assert(clean(await box.locator('.day-head h2').innerText())===clean(day.title),`${day.id} title mismatch`);
    assert(clean(await box.locator('.route').innerText())===clean(day.route),`${day.id} route mismatch`);
    assert(await box.locator('.timeline-item').count()===(day.items||[]).length,`${day.id} timeline item count mismatch`);
    const expectedMedia=(day.media?.hero?1:0)+(day.media?.gallery?.length||0);
    assert(await box.locator('.media img').count()===expectedMedia,`${day.id} media count mismatch`);
    if(day.hotelId){
      const hotel=hotelById.get(day.hotelId);
      assert(hotel && (await box.innerText()).includes(hotel.name),`${day.id} end-hotel marker missing`);
    }
    for(const item of day.items||[]){
      if(item.attractionId) assert(attractionIds.has(item.attractionId),`${day.id} unknown attractionId ${item.attractionId}`);
    }
    const text=await box.innerText();
    for(const group of ['backups','bonus','constraints']){
      for(const row of day[group]||[]){
        const label=typeof row==='string'?row:(row.title||row.label||row.text||'');
        if(label)assert(text.includes(label),`${day.id} missing rendered ${group}: ${label}`);
      }
    }
  }
  const d6=page.locator('#d6');
  assert((await d6.innerText()).includes('平湯神社｜如有時間加'),'D6 optional Hirayu shrine missing');
  assert(!(await d6.locator('.timeline').innerText()).includes('平湯神社'),'D6 optional Hirayu shrine leaked into main timeline');
  const d7=page.locator('#d7');
  const d7Timeline=await d7.locator('.timeline').innerText();
  assert(!d7Timeline.includes('飛驒東照宮')&&!d7Timeline.includes('豐川城山稻荷'),'D7 optional shrines leaked into main timeline');
  assert(pageErrors.length===0,'itinerary page errors: '+pageErrors.join(' | '));
  await page.close();
});

await check('Today Mode is derived from fixed itinerary data',async()=>{
  for(const id of ['d1','d6','d9']){
    const day=itinerary.days.find(x=>x.id===id);
    const {page}=await open('/itinerary.html?trip='+tripId+'&day='+id);
    await page.getByRole('button',{name:/Today Mode/}).click();
    const modal=clean(await page.locator('#modalBody').innerText());
    assert(modal.includes('D'+day.day),`${id} Today Mode day mismatch`);
    assert(modal.includes(clean(day.title)),`${id} Today Mode title missing`);
    if(day.items?.[0]?.title)assert(modal.includes(clean(day.items[0].title)),`${id} Today Mode first stop mismatch`);
    await page.close();
  }
});

await check('Driving Mode progresses and persists with trip-scoped state',async()=>{
  const day=itinerary.days.find(x=>x.id==='d6');
  const stops=(day.items||[]).filter(i=>i.map||i.attractionId||i.hotelId);
  assert(stops.length>=2,'D6 does not have enough driving stops');
  const {page}=await open('/itinerary.html?trip='+tripId+'&day=d6');
  await page.getByRole('button',{name:/Driving Mode/}).click();
  let modal=clean(await page.locator('#modalBody').innerText());
  assert(modal.includes(clean(stops[0].title)),'Driving Mode first stop mismatch');
  await page.getByRole('button',{name:/完成／下一站/}).click();
  modal=clean(await page.locator('#modalBody').innerText());
  assert(modal.includes(clean(stops[1].title)),'Driving Mode next stop mismatch');
  const key='multiTrip.driving.'+tripId+'.d6';
  assert(await page.evaluate(k=>localStorage.getItem(k),key)==='1','Driving state not stored in canonical trip-scoped key');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Driving Mode/}).click();
  modal=clean(await page.locator('#modalBody').innerText());
  assert(modal.includes(clean(stops[1].title)),'Driving Mode state did not persist after reload');
  await page.close();

  const {page:city}=await open('/itinerary.html?trip=city-demo');
  assert(await city.getByRole('button',{name:/Driving Mode/}).count()===0,'Driving Mode leaked into disabled city-demo');
  assert(await city.evaluate(()=>Object.keys(localStorage).some(k=>k.includes('multiTrip.driving.city-demo.')))===false,'Golden driving state leaked to city-demo');
  await city.close();
});

await check('Trip Info renders hotels, custom sections and all checklist state',async()=>{
  const {page,pageErrors}=await open('/trip-info.html?trip='+tripId);
  for(const id of ['transport','car','parking','hardcuts','weather','emergency','hotels','checklist']){
    assert(await page.locator('#'+id).count()===1,`Trip Info missing #${id}`);
  }
  for(const s of info.customSections||[]){
    assert(await page.locator('#'+s.id).count()===1,`Trip Info custom section missing #${s.id}`);
  }
  const body=await page.locator('#app').innerText();
  for(const h of hotels.hotels||[]) assert(body.includes(h.name),`hotel missing from Trip Info: ${h.name}`);
  const expectedDeparture=(departure.groups||[]).reduce((n,g)=>n+(g.items||[]).length,0);
  assert(await page.locator('[data-departure-id]').count()===expectedDeparture,`departure checklist count mismatch: expected ${expectedDeparture}`);
  const ids=(departure.groups||[]).flatMap(g=>g.items||[]).map(x=>x.id);
  for(const itemId of [ids[0],ids.at(-1)]){
    const el=page.locator('[data-departure-id="'+itemId+'"]');
    await el.check();
    const key='multiTrip.departureChecklist.'+tripId+'.'+itemId;
    assert(await page.evaluate(k=>localStorage.getItem(k),key)==='true',`checklist state missing ${key}`);
  }
  await page.reload({waitUntil:'domcontentloaded'});
  for(const itemId of [ids[0],ids.at(-1)]){
    assert(await page.locator('[data-departure-id="'+itemId+'"]').isChecked(),`checklist did not persist: ${itemId}`);
  }
  assert(pageErrors.length===0,'Trip Info page errors: '+pageErrors.join(' | '));
  await page.close();
});

await check('Attractions render all migrated rich records',async()=>{
  const {page,pageErrors}=await open('/attractions.html?trip='+tripId);
  assert(await page.locator('.attraction-card').count()===attractions.attractions.length,'attraction card count mismatch');
  for(const id of ['matsumoto-castle','shinhotaka','shirakawago','hirayu-shrine','hida-toshogu','hie-shrine']){
    const a=attractions.attractions.find(x=>x.id===id);
    assert(a,`missing attraction data ${id}`);
    const btn=page.locator('[data-info="'+id+'"]');
    assert(await btn.count()===1,`missing attraction info button ${id}`);
    await btn.click();
    const modal=clean(await page.locator('#modalBody').innerText());
    assert(modal.includes(clean(a.name)),`${id} modal name missing`);
    if(a.history)assert(modal.includes('歷史／背景'),`${id} history section missing`);
    if(a.winter)assert(modal.includes('冬季／天氣注意'),`${id} winter section missing`);
    if(a.sources?.length)assert(modal.includes('資料來源'),`${id} source section missing`);
    await page.locator('[data-close-modal]').last().click();
  }
  assert(pageErrors.length===0,'Attractions page errors: '+pageErrors.join(' | '));
  await page.close();
});

await check('Live Cam D1-D9 exactly follows Standard camera bindings',async()=>{
  const {page,pageErrors}=await open('/live.html?trip='+tripId);
  assert(await page.locator('.live-day').count()===live.days.length,'Live Cam day count mismatch');
  for(const day of live.days){
    const box=page.locator('#'+day.id);
    assert(await box.count()===1,`missing Live Cam ${day.id}`);
    assert(await box.locator('.live-camera').count()===(day.cameras||[]).length,`${day.id} camera count mismatch`);
    for(const id of day.cameras||[])assert(camById.has(id),`${day.id} unknown camera ${id}`);
  }
  const d7=await page.locator('#d7').innerText();
  assert(!d7.includes('新穗高')&&!d7.includes('新穂高'),'D7 Live Cam contains Shinhotaka alternate-day content');
  const d8=await page.locator('#d8').innerText();
  assert(!d8.includes('白川鄉')&&!d8.includes('白川郷')&&!d8.includes('新穗高')&&!d8.includes('新穂高'),'D8 Live Cam contains alternate-day content');
  assert(pageErrors.length===0,'Live Cam page errors: '+pageErrors.join(' | '));
  await page.close();
});

await check('Cross-page navigation preserves the active trip',async()=>{
  const {page}=await open('/itinerary.html?trip='+tripId);
  await page.getByRole('link',{name:/旅程資料/}).click();
  assert(new URL(page.url()).searchParams.get('trip')===tripId,'Trip Info navigation lost trip');
  assert((await page.locator('.brand small').innerText()).includes(config.shortName||config.name),'Trip context changed after navigation');
  await page.getByRole('link',{name:/景點總覽/}).click();
  assert(new URL(page.url()).searchParams.get('trip')===tripId,'Attractions navigation lost trip');
  await page.getByRole('link',{name:/Live Cam/}).click();
  assert(new URL(page.url()).searchParams.get('trip')===tripId,'Live Cam navigation lost trip');
  await page.close();
});

await check('Runtime creates no Japan legacy storage keys',async()=>{
  const page=await context.newPage();
  await page.goto(base+'/itinerary.html?trip='+tripId+'&day=d6',{waitUntil:'domcontentloaded'});
  const keys=await page.evaluate(()=>Object.keys(localStorage));
  const legacy=keys.filter(k=>/japanWinter2027|japan2027|tripv2|shinhotakaDay|weather-day-selector/i.test(k));
  assert(legacy.length===0,'legacy storage keys created: '+legacy.join(', '));
  const canonical=keys.filter(k=>k.startsWith('multiTrip.'));
  assert(canonical.length>=1,'no canonical trip-scoped state keys were exercised');
  await page.close();
});

await browser.close();
if(failures.length){
  console.error('\nRound 5 failures:\n'+failures.map(x=>' - '+x).join('\n'));
  process.exit(1);
}
console.log('\nTravelPilot Round 5 full Standard parity PASS');
