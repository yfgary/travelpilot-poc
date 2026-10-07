import { chromium } from 'playwright';
import crypto from 'node:crypto';

const C='http://127.0.0.1:8000', P='http://127.0.0.1:8001';
const failures=[];
const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=m=>failures.push(m);

const fixture={
 latitude:36.2,longitude:137.9,utc_offset_seconds:32400,timezone:'Asia/Tokyo',
 current:{time:'2026-10-07T13:00',temperature_2m:13,relative_humidity_2m:72,apparent_temperature:12,precipitation:0,snowfall:0,weather_code:1,cloud_cover:32,wind_speed_10m:8,wind_gusts_10m:18,visibility:10000},
 hourly:{time:['2026-10-07T12:00','2027-01-14T12:00','2027-01-15T12:00','2027-01-16T12:00'],snow_depth:[0,0.05,0.04,0.03]},
 daily:{
  time:['2026-10-07','2027-01-14','2027-01-15','2027-01-16','2027-01-17'],
  weather_code:[1,2,0,1,2],temperature_2m_max:[20,2,4,3,5],temperature_2m_min:[11,-5,-4,-3,-2],
  apparent_temperature_max:[19,0,2,1,3],apparent_temperature_min:[10,-8,-7,-6,-5],
  precipitation_probability_max:[10,35,10,20,15],snowfall_sum:[0,4,1,2,1],
  wind_gusts_10m_max:[18,32,18,22,20],visibility_mean:[10000,6500,12000,9000,10000],
  visibility_min:[8000,3000,10000,7000,8000],visibility_max:[15000,10000,16000,14000,15000],
  cloud_cover_mean:[32,70,20,40,35]
 }
};

async function prep(page){
 await page.addInitScript(()=>{
  const fixed=Date.parse('2026-10-07T05:00:00Z'),RealDate=Date;
  class MockDate extends RealDate{constructor(...a){super(...(a.length?a:[fixed]));}static now(){return fixed;}}
  Object.setPrototypeOf(MockDate,RealDate);window.Date=MockDate;
 });
 await page.route('**/api.open-meteo.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
}
async function open(base,path){
 const page=await browser.newPage({viewport:{width:1440,height:1100},serviceWorkers:'block'});
 const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
 await prep(page); await page.goto(base+path,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(3600);
 return {page,errors};
}
async function clean(page,selectors){
 await page.evaluate(sel=>{
  for(const s of sel)document.querySelectorAll(s).forEach(x=>x.remove());
  document.querySelectorAll('#siteVersionBadge,#catalogVersion').forEach(x=>x.remove());
 },selectors);
}
async function body(page){return page.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').trim());}
async function shot(page){return hash(await page.screenshot({fullPage:true,animations:'disabled'}));}
async function style(page,sel){
 return page.locator(sel).first().evaluate(el=>{
  const s=getComputedStyle(el); return {
   display:s.display,fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,color:s.color,
   backgroundColor:s.backgroundColor,borderRadius:s.borderRadius,padding:s.padding,margin:s.margin,
   borderTopWidth:s.borderTopWidth,borderTopStyle:s.borderTopStyle
  };
 });
}
function same(a,b,label){if(JSON.stringify(a)!==JSON.stringify(b))fail(label+' mismatch\nP='+JSON.stringify(a)+'\nC='+JSON.stringify(b));}

const browser=await chromium.launch({headless:true});
try{
 // ITINERARY: verify intentional D6-D8 differences first.
 const pI=await open(P,'/itinerary.html'), cI=await open(C,'/itinerary.html');
 if(pI.errors.length)fail('Production itinerary page errors: '+pI.errors.join(' | '));
 if(cI.errors.length)fail('Candidate itinerary page errors: '+cI.errors.join(' | '));
 const surface=await cI.page.evaluate(()=>({
  selector:document.querySelectorAll('#tripv2WeatherSelect').length,
  apply:document.querySelectorAll('#d68Apply').length,
  panel:document.querySelectorAll('#d6d8WeatherDecision').length,
  cards:document.querySelectorAll('#d6d8WeatherDecision .d68-card').length,
  panelText:document.querySelector('#d6d8WeatherDecision')?.innerText||'',
  d6:[document.querySelector('#d6 .day-title')?.textContent,document.querySelector('#d6 .day-route')?.textContent],
  d7:[document.querySelector('#d7 .day-title')?.textContent,document.querySelector('#d7 .day-route')?.textContent],
  d8:[document.querySelector('#d8 .day-title')?.textContent,document.querySelector('#d8 .day-route')?.textContent],
  d68marker:document.documentElement.dataset.d68FixedPlan||''
 }));
 if(surface.selector!==0)fail('Manual D6-D8 selector still visible');
 if(surface.apply!==0)fail('Weather recommendation Apply control still visible');
 if(surface.panel!==1||surface.cards!==3)fail('Read-only D6-D8 weather panel/cards missing');
 if(!surface.panelText.includes('不會推薦、套用或改動'))fail('Read-only weather panel does not clearly retire auto selection');
 if(norm(surface.d6[0])!=='白川鄉')fail('D6 fixed title wrong: '+surface.d6[0]);
 if(norm(surface.d7[0])!=='新穗高纜車')fail('D7 fixed title wrong: '+surface.d7[0]);
 if(norm(surface.d8[0])!=='高山市區＋飛驒大鐘乳洞 → 松本')fail('D8 fixed title wrong: '+surface.d8[0]);
 if(surface.d68marker!=='d6-shirakawago_d7-shinhotaka_d8-city-cave')fail('Fixed itinerary marker missing');

 const retired=await cI.page.evaluate(()=>{
  localStorage.setItem('japanWinter2027_shinhotakaDay','d8');
  const a=window.Japan2027Core; if(a?.setSelectedShinhotakaDay)a.setSelectedShinhotakaDay('d6');
  return {stored:localStorage.getItem('japanWinter2027_shinhotakaDay'),selected:a?.getSelectedShinhotakaDay?.(),plan:a?.resolveFlexibleDays?.('d8')};
 });
 if(retired.stored!==null||retired.selected!=='')fail('Legacy D6-D8 storage/API still active');
 same(retired.plan,{selected:'',d6:'shirakawago',d7:'shinhotaka',d8:'cityCave'},'Fixed core resolver');

 // Unaffected itinerary surfaces must be exact after masking only approved D6-D8 regions/version.
 for(const sel of ['#d1 .day-title','#d2 .day-title','#d3 .day-title','#d4 .day-title','#d5 .day-title','#d9 .day-title','.page-switch','.intro','#weather3dPanel']){
  same(await pI.page.locator(sel).first().innerText(),await cI.page.locator(sel).first().innerText(),'Itinerary '+sel+' text');
 }
 // Fixed-day elements must use the exact same production typography/presentation classes.
 for(const [ps,cs,label] of [
  ['#d6 .day-title','#d6 .day-title','day title'],
  ['#d6 .day-route','#d6 .day-route','day route'],
  ['#d6 .highlight-item','#d6 .highlight-item','highlight'],
  ['#d6 .timeline-card','#d6 .timeline-card','timeline card'],
  ['#d6 .photo-section','#d6 .photo-section','photo section']
 ]) same(await style(pI.page,ps),await style(cI.page,cs),'D6 '+label+' computed style');

 // Photo zoom on unaffected D1.
 for(const x of [pI.page,cI.page]){await x.locator('#d1').evaluate(el=>el.open=true);await x.locator('#d1 img.zoomable').first().click();}
 const modalP=await pI.page.locator('#photoModal').evaluate(el=>({display:getComputedStyle(el).display,text:(el.innerText||'').replace(/\\s+/g,' ').trim()}));
 const modalC=await cI.page.locator('#photoModal').evaluate(el=>({display:getComputedStyle(el).display,text:(el.innerText||'').replace(/\\s+/g,' ').trim()}));
 same(modalP,modalC,'D1 photo modal');
 for(const x of [pI.page,cI.page])await x.keyboard.press('Escape');

 // Today/Driving unaffected D2 must remain exact.
 for(const [api,sel] of [['Japan2027TravelMode','#travelModeOverlay'],['Japan2027DrivingMode','#drivingModeOverlay']]){
  await pI.page.evaluate(a=>window[a].open('d2'),api); await cI.page.evaluate(a=>window[a].open('d2'),api);
  await pI.page.waitForSelector(sel+':not([hidden])'); await cI.page.waitForSelector(sel+':not([hidden])');
  same(norm(await pI.page.locator(sel).innerText()),norm(await cI.page.locator(sel).innerText()),api+' D2 overlay');
  await pI.page.evaluate(a=>window[a].close(),api); await cI.page.evaluate(a=>window[a].close(),api);
 }

 await clean(pI.page,['#tripv2WeatherSelect','#d6d8WeatherDecision','#d6','#d7','#d8','.day-nav-inner [data-day="d6"]','.day-nav-inner [data-day="d7"]','.day-nav-inner [data-day="d8"]']);
 await clean(cI.page,['#tripv2WeatherSelect','#d6d8WeatherDecision','#d6','#d7','#d8','.day-nav-inner [data-day="d6"]','.day-nav-inner [data-day="d7"]','.day-nav-inner [data-day="d8"]']);
 same(await body(pI.page),await body(cI.page),'Itinerary unaffected DOM text');
 same(await shot(pI.page),await shot(cI.page),'Itinerary unaffected full-page pixels');
 await pI.page.close(); await cI.page.close();

 // TRIP INFO: only weather decision + affected hard-cut content are approved differences.
 const pT=await open(P,'/trip-info.html'), cT=await open(C,'/trip-info.html');
 if(pT.errors.length)fail('Production Trip Info page errors: '+pT.errors.join(' | '));
 if(cT.errors.length)fail('Candidate Trip Info page errors: '+cT.errors.join(' | '));
 const ti=await cT.page.evaluate(()=>({summary:document.querySelector('#tripv2WeatherSummary')?.innerText||'',weather:document.querySelector('#weather')?.innerText||''}));
 if(!ti.summary.includes('D6–D8 固定行程')||!ti.summary.includes('D7：新穗高'))fail('Trip Info fixed summary missing');
 if(!ti.weather.includes('天氣只影響安全安排')&&!ti.weather.includes('不會再交換日子'))fail('Trip Info weather safety-only wording missing');
 await clean(pT.page,['#weather','#hardcuts']); await clean(cT.page,['#weather','#hardcuts']);
 same(await body(pT.page),await body(cT.page),'Trip Info unaffected DOM text');
 for(const sel of ['header','.page-switch','#transport','#car','#hotels','#parking','#checklist','#emergency','#departure-checklist','footer']){
  const pc=await pT.page.locator(sel).count(),cc=await cT.page.locator(sel).count();
  if(pc!==cc){fail('Trip Info '+sel+' count mismatch '+pc+' != '+cc);continue;}
  if(pc) same(hash(await pT.page.locator(sel).screenshot({animations:'disabled'})),hash(await cT.page.locator(sel).screenshot({animations:'disabled'})),'Trip Info '+sel+' pixels');
 }
 await pT.page.close(); await cT.page.close();

 // LIVE: D1-D5/D9 and surrounding presentation must remain exact.
 const pL=await open(P,'/live.html'), cL=await open(C,'/live.html');
 if(pL.errors.length)fail('Production Live page errors: '+pL.errors.join(' | '));
 if(cL.errors.length)fail('Candidate Live page errors: '+cL.errors.join(' | '));
 const liveFixed=await cL.page.evaluate(()=>({
  d6:document.querySelector('#d6')?.innerText||'',d7:document.querySelector('#d7')?.innerText||'',d8:document.querySelector('#d8')?.innerText||'',
  legacy:(document.body.innerText||'').includes('等待選擇新穗高日子')
 }));
 const liveTitles=await cL.page.evaluate(()=>({
  d6:(document.querySelector('#d6 .summary-title')?.textContent||'').replace(/\\s+/g,' ').trim(),
  d7:(document.querySelector('#d7 .summary-title')?.textContent||'').replace(/\\s+/g,' ').trim(),
  d8:(document.querySelector('#d8 .summary-title')?.textContent||'').replace(/\\s+/g,' ').trim(),
  chooser:document.querySelectorAll('#livePlanChooserV92').length,
  choiceButtons:document.querySelectorAll('#livePlanChooserV92 button[data-sh]').length
 }));
 if(!liveTitles.d6.includes('白川鄉'))fail('Live D6 not fixed to Shirakawago: '+liveTitles.d6);
 if(!liveTitles.d7.includes('新穗高'))fail('Live D7 not fixed to Shinhotaka: '+liveTitles.d7);
 if(!liveTitles.d8.includes('飛驒大鐘乳洞')||!liveTitles.d8.includes('松本'))fail('Live D8 not fixed to cave/Matsumoto: '+liveTitles.d8);
 if(liveTitles.chooser!==0||liveTitles.choiceButtons!==0)fail('Live manual D6-D8 chooser still exists');
 if(liveFixed.legacy)fail('Live page still exposes selection-wait state');
 await clean(pL.page,['#d6','#d7','#d8','#livePlanChooserV92','#d6d8WeatherDecision','.quick-nav [data-day="d6"]','.quick-nav [data-day="d7"]','.quick-nav [data-day="d8"]']); await clean(cL.page,['#d6','#d7','#d8','#livePlanChooserV92','#d6d8WeatherDecision','.quick-nav [data-day="d6"]','.quick-nav [data-day="d7"]','.quick-nav [data-day="d8"]']);
 same(await body(pL.page),await body(cL.page),'Live unaffected DOM text');
 for(const sel of ['header','.page-switch','.today-panel','#weather3dPanel','#d1','#d2','#d3','#d4','#d5','#d9','footer']){
  const pc=await pL.page.locator(sel).count(),cc=await cL.page.locator(sel).count();
  if(pc!==cc){fail('Live '+sel+' count mismatch '+pc+' != '+cc);continue;}
  if(pc) same(hash(await pL.page.locator(sel).screenshot({animations:'disabled'})),hash(await cL.page.locator(sel).screenshot({animations:'disabled'})),'Live '+sel+' pixels');
 }
 await pL.page.close(); await cL.page.close();

 // ATTRACTIONS: no approved visual/content difference at all (version badge normalized).
 const pA=await open(P,'/attractions.html'), cA=await open(C,'/attractions.html');
 if(pA.errors.length)fail('Production Attractions page errors: '+pA.errors.join(' | '));
 if(cA.errors.length)fail('Candidate Attractions page errors: '+cA.errors.join(' | '));
 await clean(pA.page,[]); await clean(cA.page,[]);
 same(await body(pA.page),await body(cA.page),'Attractions DOM text');
 same(await shot(pA.page),await shot(cA.page),'Attractions full-page pixels');
 await pA.page.close(); await cA.page.close();
} finally { await browser.close(); }

if(failures.length){
 console.error('\nROUND 1 GOLDEN PARITY FAIL\n'+failures.map(x=>' - '+x).join('\n'));
 process.exit(1);
}
console.log('Round 1 Golden Reference presentation + interaction parity PASS');
