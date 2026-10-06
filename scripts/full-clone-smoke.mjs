import { chromium } from 'playwright';

const base='http://127.0.0.1:8000';
const tripId='shirakawago-shinhotaka-2027';
const failures=[];
const assert=(v,m)=>{if(!v)throw new Error(m);};
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
async function check(name,fn){
  try{await fn();console.log('PASS',name);}
  catch(e){failures.push(name+': '+e.message);console.error('FAIL',name,e.message);}
}
async function getJson(path){
  const r=await fetch(base+path);
  if(!r.ok)throw new Error(path+' HTTP '+r.status);
  return r.json();
}
const [registry,itinerary,attractions,hotels,live,departure]=await Promise.all([
  getJson('/trips/registry.json'),
  getJson('/trips/'+tripId+'/itinerary.json'),
  getJson('/trips/'+tripId+'/attractions.json'),
  getJson('/trips/'+tripId+'/hotels.json'),
  getJson('/trips/'+tripId+'/live-cams.json'),
  getJson('/trips/'+tripId+'/departure-checklist.json')
]);

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1365,height:950}});

async function open(url){
  const page=await context.newPage();
  const scripts=[],docs=[],errors=[],failed=[];
  page.on('request',req=>{
    try{
      const u=new URL(req.url());
      if(u.origin!==base)return;
      if(req.resourceType()==='script')scripts.push(u.pathname.replace(/^\//,''));
      if(req.resourceType()==='document')docs.push(u.pathname);
    }catch{}
  });
  page.on('requestfailed',req=>failed.push(req.url()));
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+url,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(600);
  return {page,scripts:[...new Set(scripts)],docs:[...new Set(docs)],errors,failed};
}

await check('Production homepage clone loads real registry',async()=>{
  const {page,errors,failed}=await open('/index.html');
  const body=await page.locator('body').innerText();
  assert(registry.trips.length>=4,'production registry has fewer than 4 trips');
  assert(body.includes('2027')||body.includes('白川鄉')||body.includes('日本中部'),'homepage does not show Japan trip');
  assert(errors.length===0,'homepage errors: '+errors.join(' | '));
  assert(failed.length===0,'homepage failed requests: '+failed.join(' | '));
  await page.close();
});

await check('Japan public URL uses Standard runtime',async()=>{
  const {page,scripts,docs,errors}=await open('/itinerary.html?trip='+tripId+'&day=d6');
  assert(new URL(page.url()).pathname==='/itinerary.html','canonical itinerary URL not restored');
  assert(docs.includes('/standard/itinerary.html'),'Standard document not used');
  for(const s of ['assets/cutover-router-v1.js','assets/standard-core-v1.js','assets/standard-modes-v1.js','assets/standard-render-itinerary-v1.js']){
    assert(scripts.includes(s),'missing '+s);
  }
  assert(!scripts.some(s=>/trip-v8|trip-v9|trip-core|site-shell|d6-d8-weather|japan2027|attraction-info/i.test(s)),'Japan loaded legacy runtime');
  assert(await page.locator('.day-card').count()===9,'D1-D9 not rendered');
  assert(!(await page.locator('#d6 .timeline').innerText()).includes('平湯神社'),'D6 optional shrine leaked into main timeline');
  assert((await page.locator('#d6').innerText()).includes('平湯神社｜如有時間加'),'D6 optional shrine backup missing');
  assert(errors.length===0,'Japan itinerary page errors: '+errors.join(' | '));
  await page.close();
});

await check('Japan Today/Driving works in full clone',async()=>{
  const {page}=await open('/itinerary.html?trip='+tripId+'&day=d6');
  await page.getByRole('button',{name:/Today Mode/}).click();
  let modal=clean(await page.locator('#modalBody').innerText());
  assert(modal.includes('D6'),'Today Mode day mismatch');
  await page.locator('[data-close-modal]').last().click();
  await page.getByRole('button',{name:/Driving Mode/}).click();
  assert((await page.locator('#modalBody').innerText()).includes('下一站'),'Driving Mode missing next stop');
  const keys=await page.evaluate(()=>Object.keys(localStorage));
  assert(!keys.some(k=>/japanWinter2027|japan2027|tripv2|shinhotakaDay/i.test(k)),'legacy storage key created');
  await page.close();
});

await check('Japan Trip Info/Attractions/Live preserve parity',async()=>{
  let opened=await open('/trip-info.html?trip='+tripId);
  let page=opened.page;
  for(const h of hotels.hotels)assert((await page.locator('#app').innerText()).includes(h.name),'hotel missing '+h.name);
  assert(await page.locator('[data-departure-id]').count()===96,'checklist != 96');
  await page.close();

  opened=await open('/attractions.html?trip='+tripId); page=opened.page;
  assert(await page.locator('.attraction-card').count()===42,'attractions != 42');
  await page.locator('[data-info="matsumoto-castle"]').click();
  assert((await page.locator('#modalBody').innerText()).includes('歷史／背景'),'rich attraction history missing');
  await page.close();

  opened=await open('/live.html?trip='+tripId); page=opened.page;
  assert(await page.locator('.live-day').count()===9,'Live days != 9');
  const expected=live.days.reduce((n,d)=>n+(d.cameras||[]).length,0);
  assert(await page.locator('.live-camera').count()===expected,'Live binding count mismatch');
  await page.close();
});

await check('Other production trips still use complete legacy clone',async()=>{
  for(const [id,label] of [['bangkok-2026','曼谷'],['hokkaido-2025','北海道'],['multi-trip-demo-okinawa','沖繩']]){
    const {page,docs,errors}=await open('/itinerary.html?trip='+id);
    assert(docs.includes('/legacy/itinerary.html'),id+' did not use legacy fallback');
    const u=new URL(page.url());
    assert(u.pathname==='/itinerary.html'&&u.searchParams.get('trip')===id,id+' public URL/trip mismatch');
    const body=await page.locator('body').innerText();
    assert(body.includes(label)||body.length>500,id+' legacy page appears empty');
    assert(!body.includes('旅程資料載入失敗'),id+' load failure visible');
    assert(errors.length===0,id+' page errors: '+errors.join(' | '));
    await page.close();
  }
});

await check('Production image set is loadable from POC',async()=>{
  const imagePaths=[
    '/assets/images/d2-matsumoto-castle.jpg',
    '/assets/images/d6-shinhotaka.jpg',
    '/assets/images/d7-shirakawago.jpg'
  ];
  for(const path of imagePaths){
    const r=await fetch(base+path);
    assert(r.ok,path+' HTTP '+r.status);
    assert(Number(r.headers.get('content-length')||0)>0,path+' empty');
  }
});

await browser.close();
if(failures.length){
  console.error('\nFull-clone smoke failures:\n'+failures.map(x=>' - '+x).join('\n'));
  process.exit(1);
}
console.log('\nTravelPilot POC full-production-clone browser QA PASS');
