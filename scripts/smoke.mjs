import { chromium } from 'playwright';

const base='http://127.0.0.1:8000';
const registry=await (await fetch(base+'/trips/registry.json')).json();
const golden=registry.defaultTrip;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});
const failures=[];
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{ if(m.type()==='error') pageErrors.push('console: '+m.text()); });

async function check(name,fn){
  try{await fn();console.log('PASS',name);}
  catch(e){failures.push(name+': '+e.message);console.error('FAIL',name,e.message);}
}
function assert(value,message){if(!value)throw new Error(message);}

await check('homepage has two trips',async()=>{
  await page.goto(base+'/index.html',{waitUntil:'networkidle'});
  assert(await page.locator('.card').count()===2,'expected 2 trip cards');
});

await check('Golden Reference itinerary rich render',async()=>{
  pageErrors.length=0;
  await page.goto(base+'/itinerary.html?trip='+encodeURIComponent(golden)+'&day=d6',{waitUntil:'networkidle'});
  assert(await page.locator('.day-card').count()>=4,'expected rich multi-day itinerary');
  assert(await page.locator('#d6 .hero-media img').count()===1,'D6 hero media missing');
  assert((await page.locator('#d6').innerText()).includes('ropeway_mountain'),'weather activity profile not rendered');
  assert(await page.locator('#d6 .timeline-item').count()>=4,'D6 timeline incomplete');
  assert(await page.getByRole('button',{name:/Today Mode/}).count()===1,'Today Mode missing');
  assert(await page.getByRole('button',{name:/Driving Mode/}).count()===1,'Driving Mode missing');
  const d6Timeline=await page.locator('#d6 .timeline').innerText();
  assert(!d6Timeline.includes('平湯神社'),'optional Hirayu Shrine leaked into D6 main timeline');
  const d6Text=await page.locator('#d6').innerText();
  assert(d6Text.includes('平湯神社'),'D6 optional Hirayu Shrine backup missing');
  const d7Timeline=await page.locator('#d7 .timeline').innerText();
  assert(!d7Timeline.includes('飛驒東照宮')&&!d7Timeline.includes('豐川城山稻荷'),'optional D7 shrines leaked into main timeline');
  const d7Text=await page.locator('#d7').innerText();
  assert(d7Text.includes('飛驒東照宮')&&d7Text.includes('豐川城山稻荷'),'D7 optional shrine backups missing');
  assert(pageErrors.length===0,'page errors: '+pageErrors.join(' | '));
});

await check('Today and Driving modes are data-driven',async()=>{
  await page.getByRole('button',{name:/Today Mode/}).click();
  assert((await page.locator('#modalBody').innerText()).includes('D6'),'Today Mode did not resolve preview day');
  await page.locator('[data-close-modal]').last().click();
  await page.getByRole('button',{name:/Driving Mode/}).click();
  assert((await page.locator('#modalBody').innerText()).includes('下一站'),'Driving Mode next stop missing');
  assert(await page.getByRole('link',{name:/Google Maps/}).count()===1,'Driving navigation link missing');
  await page.locator('[data-close-modal]').last().click();
});

await check('photo zoom and attraction detail',async()=>{
  await page.locator('#d6 [data-zoom-src]').first().click();
  assert(await page.locator('#modalBody .modal-photo').count()===1,'zoom modal image missing');
  await page.locator('[data-close-modal]').last().click();
  await page.locator('#d6 [data-attraction-info]').first().click();
  const text=await page.locator('#modalBody').innerText();
  assert(text.includes('歷史／背景'),'rich attraction history missing');
  assert(text.includes('冬季／天氣注意'),'rich attraction winter info missing');
  await page.locator('[data-close-modal]').last().click();
});

await check('Trip Info custom sections and checklist persistence',async()=>{
  await page.goto(base+'/trip-info.html?trip='+encodeURIComponent(golden),{waitUntil:'networkidle'});
  assert(await page.locator('[id="trains"],[id="train-fares"],[id="rail-prices"]').count()===1,'train custom section missing');
  assert(await page.locator('[id="winter-shrines"],[id="snow-shrines"]').count()===1,'shrine custom section missing');
  const checkbox=page.locator('[data-departure-id]').first();
  const itemId=await checkbox.getAttribute('data-departure-id');
  await checkbox.check();
  const expectedKey='multiTrip.departureChecklist.'+golden+'.'+itemId;
  const keys=await page.evaluate(()=>Object.keys(localStorage));
  assert(keys.includes(expectedKey),'trip-scoped checklist key missing: '+expectedKey);
  await page.reload({waitUntil:'networkidle'});
  assert(await page.locator('[data-departure-id="'+itemId+'"]').isChecked(),'checklist state did not persist');
});

await check('Attractions rich renderer',async()=>{
  await page.goto(base+'/attractions.html?trip='+encodeURIComponent(golden),{waitUntil:'networkidle'});
  assert(await page.locator('.attraction-card').count()>=6,'attraction cards missing');
  await page.locator('[data-info="matsumoto-castle"]').click();
  const text=await page.locator('#modalBody').innerText();
  assert(text.includes('評分原因'),'score reason missing');
  assert(text.includes('資料來源'),'sources missing');
});

await check('Live Cam uses cameras and days data',async()=>{
  await page.goto(base+'/live.html?trip='+encodeURIComponent(golden),{waitUntil:'networkidle'});
  assert(await page.locator('.live-day').count()>=3,'live day rendering missing');
  assert(await page.locator('.live-camera').count()>=5,'camera rendering missing');
  const d7=await page.locator('#d7').innerText();
  assert(!d7.includes('新穗高')&&!d7.includes('新穂高'),'D7 Live Cam still shows Shinhotaka');
  const d8=await page.locator('#d8').innerText();
  assert(!d8.includes('白川鄉')&&!d8.includes('白川郷')&&!d8.includes('新穗高')&&!d8.includes('新穂高'),'D8 Live Cam still shows alternate-day cameras');
});

await check('second trip uses same renderer without feature leakage',async()=>{
  pageErrors.length=0;
  await page.goto(base+'/itinerary.html?trip=city-demo',{waitUntil:'networkidle'});
  assert(await page.locator('.day-card').count()===1,'city-demo itinerary missing');
  assert(await page.getByRole('button',{name:/Today Mode/}).count()===1,'city-demo Today Mode missing');
  assert(await page.getByRole('button',{name:/Driving Mode/}).count()===0,'Driving Mode leaked into disabled trip');
  assert(await page.locator('.page-nav a',{hasText:'Live Cam'}).count()===0,'Live Cam nav leaked into disabled trip');
  assert(pageErrors.length===0,'city-demo page errors: '+pageErrors.join(' | '));
});

await browser.close();
if(failures.length){
  console.error('\nSmoke failures:\n'+failures.map(x=>' - '+x).join('\n'));
  process.exit(1);
}
console.log('\nTravelPilot browser smoke PASS');
