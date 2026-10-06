import { chromium } from 'playwright';

const base='http://127.0.0.1:8000';
const trips={
  'shirakawago-shinhotaka-2027':{days:9,attractions:42,hotels:7,checklist:96,live:true,liveDays:9,driving:true,mediaDays:9},
  'bangkok-2026':{days:8,attractions:28,hotels:1,checklist:9,live:false,liveDays:0,driving:false,mediaDays:8},
  'hokkaido-2025':{days:8,attractions:26,hotels:4,checklist:15,live:true,liveDays:8,driving:true,mediaDays:8},
  'multi-trip-demo-okinawa':{days:3,attractions:6,hotels:1,checklist:12,live:false,liveDays:0,driving:true,mediaDays:0},
};
const failures=[];
const assert=(v,m)=>{if(!v)throw new Error(m);};
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
async function check(name,fn){try{await fn();console.log('PASS',name);}catch(e){failures.push(name+': '+e.message);console.error('FAIL',name,e.message);}}
async function getJson(path){const r=await fetch(base+path);if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json();}

const registry=await getJson('/trips/registry.json');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1365,height:950}});

async function open(url){
  const page=await context.newPage();
  const scripts=[],errors=[],internalFailed=[];
  page.on('request',req=>{try{const u=new URL(req.url());if(u.origin===base&&req.resourceType()==='script')scripts.push(u.pathname.replace(/^\//,''));}catch{}});
  page.on('requestfailed',req=>{try{const u=new URL(req.url());if(u.origin===base)internalFailed.push(u.pathname);}catch{}});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+url,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(450);
  return {page,scripts:[...new Set(scripts)],errors,internalFailed};
}

await check('Homepage uses Standard runtime and all production trips',async()=>{
  const {page,scripts,errors,internalFailed}=await open('/index.html');
  assert(registry.trips.length===4,'registry does not have 4 trips');
  assert(await page.locator('.tp-trip-card').count()===4,'homepage does not render 4 trip cards');
  assert(scripts.includes('assets/standard-home-v1.js'),'homepage Standard runtime missing');
  assert(!scripts.some(s=>s.includes('multi-trip-context')),'homepage still loaded old MultiTrip context');
  assert(errors.length===0,'homepage page errors: '+errors.join(' | '));
  assert(internalFailed.length===0,'homepage internal failed requests: '+internalFailed.join(', '));
  await page.close();
});

for(const [tripId,expected] of Object.entries(trips)){
  await check(tripId+' itinerary direct Standard render',async()=>{
    const [itinerary,config]=await Promise.all([
      getJson('/trips/'+tripId+'/itinerary.json'),
      getJson('/trips/'+tripId+'/trip.json')
    ]);
    const {page,scripts,errors,internalFailed}=await open('/itinerary.html?trip='+tripId);
    const want=['assets/standard-core-v1.js','assets/standard-modes-v1.js','assets/standard-render-itinerary-v1.js'];
    for(const s of want)assert(scripts.includes(s),'missing '+s);
    assert(!scripts.some(s=>/multi-trip|trip-v8|trip-v9|trip-core|site-shell|japan2027|cutover-router/i.test(s)),'legacy script loaded: '+scripts.join(', '));
    assert(await page.locator('.day-card').count()===expected.days,'day card count mismatch');
    assert(await page.locator('.media').count()===expected.mediaDays,'media-day count mismatch');
    assert(await page.getByRole('button',{name:/Today Mode/}).count()===1,'Today Mode missing');
    assert((await page.getByRole('button',{name:/Driving Mode/}).count()===1)===expected.driving,'Driving Mode feature gating mismatch');
    const body=await page.locator('#app').innerText();
    assert(body.includes(config.name),'trip identity missing from itinerary');
    assert(errors.length===0,'page errors: '+errors.join(' | '));
    assert(internalFailed.length===0,'internal failed requests: '+internalFailed.join(', '));
    for(const d of itinerary.days){
      assert(await page.locator('#'+d.id+' .timeline-item').count()===(d.items||[]).length,d.id+' timeline count mismatch');
    }
    await page.close();
  });

  await check(tripId+' Trip Info Standard parity',async()=>{
    const [hotels,dep]=await Promise.all([
      getJson('/trips/'+tripId+'/hotels.json'),
      getJson('/trips/'+tripId+'/departure-checklist.json')
    ]);
    const {page,scripts,errors}=await open('/trip-info.html?trip='+tripId);
    assert(scripts.includes('assets/standard-render-trip-info-v1.js'),'Trip Info Standard renderer missing');
    assert(!scripts.some(s=>/multi-trip|trip-v8|trip-v9|site-shell|cutover-router/i.test(s)),'Trip Info legacy script loaded');
    const body=await page.locator('#app').innerText();
    for(const h of hotels.hotels||[])assert(body.includes(h.name),'hotel missing: '+h.name);
    assert(await page.locator('[data-departure-id]').count()===expected.checklist,'departure checklist count mismatch');
    const first=dep.groups?.[0]?.items?.[0]?.id;
    if(first){
      const cb=page.locator('[data-departure-id="'+first+'"]');
      await cb.check();
      const key='multiTrip.departureChecklist.'+tripId+'.'+first;
      assert(await page.evaluate(k=>localStorage.getItem(k),key)==='true','trip-scoped checklist key missing');
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForTimeout(250);
      assert(await page.locator('[data-departure-id="'+first+'"]').isChecked(),'checklist state did not persist');
    }
    assert(errors.length===0,'Trip Info page errors: '+errors.join(' | '));
    await page.close();
  });

  await check(tripId+' Attractions Standard parity',async()=>{
    const {page,scripts,errors}=await open('/attractions.html?trip='+tripId);
    assert(scripts.includes('assets/standard-render-attractions-v1.js'),'Attractions Standard renderer missing');
    assert(await page.locator('.attraction-card').count()===expected.attractions,'attraction count mismatch');
    assert(errors.length===0,'Attractions page errors: '+errors.join(' | '));
    await page.close();
  });

  await check(tripId+' Live Cam feature parity',async()=>{
    const {page,scripts,errors}=await open('/live.html?trip='+tripId);
    assert(scripts.includes('assets/standard-render-live-v1.js'),'Live Standard renderer missing');
    assert(await page.locator('.live-day').count()===expected.liveDays,'Live day count mismatch');
    const navCount=await page.locator('.page-nav a',{hasText:'Live Cam'}).count();
    assert((navCount===1)===expected.live,'Live nav feature gating mismatch');
    assert(errors.length===0,'Live page errors: '+errors.join(' | '));
    await page.close();
  });
}

await check('Japan fixed D6-D8 behavior remains intact',async()=>{
  const {page}=await open('/itinerary.html?trip=shirakawago-shinhotaka-2027&day=d6');
  const d6=await page.locator('#d6').innerText();
  const d6timeline=await page.locator('#d6 .timeline').innerText();
  assert(d6.includes('平湯神社｜如有時間加'),'D6 optional Hirayu backup missing');
  assert(!d6timeline.includes('平湯神社'),'D6 optional Hirayu shrine leaked into main timeline');
  const d7timeline=await page.locator('#d7 .timeline').innerText();
  assert(!d7timeline.includes('飛驒東照宮')&&!d7timeline.includes('豐川城山稻荷'),'D7 optional shrine leaked into timeline');
  await page.close();
});

await check('Hokkaido rich scores and Live Cam survived Standard migration',async()=>{
  const attrs=await getJson('/trips/hokkaido-2025/attractions.json');
  assert(attrs.attractions.filter(a=>a.score!=null&&a.scoreReason).length>=20,'Hokkaido score migration incomplete');
  const {page}=await open('/live.html?trip=hokkaido-2025');
  assert(await page.locator('.live-day').count()===8,'Hokkaido live days mismatch');
  assert(await page.locator('.live-camera').count()>=11,'Hokkaido live cameras missing');
  await page.close();
});

await check('Cross-trip state stays scoped',async()=>{
  let opened=await open('/itinerary.html?trip=shirakawago-shinhotaka-2027&day=d6');
  let page=opened.page;
  await page.getByRole('button',{name:/Driving Mode/}).click();
  const next=page.getByRole('button',{name:/完成／下一站/});
  if(await next.isEnabled())await next.click();
  await page.close();

  opened=await open('/itinerary.html?trip=multi-trip-demo-okinawa&day=d2');page=opened.page;
  await page.getByRole('button',{name:/Driving Mode/}).click();
  const text=clean(await page.locator('#modalBody').innerText());
  assert(text.includes('D2'),'Okinawa Driving Mode did not resolve its own day');
  const keys=await page.evaluate(()=>Object.keys(localStorage));
  assert(keys.some(k=>k.startsWith('multiTrip.driving.shirakawago-shinhotaka-2027.')),'Japan driving state missing');
  assert(!keys.some(k=>/japanWinter2027|japan2027|tripv2|shinhotakaDay/i.test(k)),'legacy storage key exists');
  await page.close();
});

await browser.close();
if(failures.length){
  console.error('\nRound 7 browser failures:\n'+failures.map(x=>' - '+x).join('\n'));
  process.exit(1);
}
console.log('\nRound 7 all-trip Standard browser QA PASS');
