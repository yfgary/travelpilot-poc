import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT=process.cwd();
const TRIP='shirakawago-shinhotaka-2027';
const OUT=path.join(ROOT,'trips',TRIP,'itinerary.json');
const BASE_URL=process.env.PRODUCTION_URL||'http://127.0.0.1:8010';

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const base=readJson(OUT);
const trip=readJson(path.join(ROOT,'trips',TRIP,'trip.json'));
const planner=(trip.modules||[]).find(x=>x&&x.type==='conditional-day-planner')||{};
const stateKey=planner.stateKey||base.flexibleRules?.storageKey||'japanWinter2027_shinhotakaDay';

const fixture={
 latitude:36.2,longitude:137.9,generationtime_ms:0,utc_offset_seconds:32400,timezone:'Asia/Tokyo',
 current_units:{time:'iso8601',temperature_2m:'°C',relative_humidity_2m:'%',apparent_temperature:'°C',precipitation:'mm',snowfall:'cm',weather_code:'wmo code',cloud_cover:'%',wind_speed_10m:'km/h',wind_gusts_10m:'km/h',visibility:'m'},
 current:{time:'2026-10-07T13:00',temperature_2m:13,relative_humidity_2m:72,apparent_temperature:12,precipitation:0,snowfall:0,weather_code:1,cloud_cover:32,wind_speed_10m:8,wind_gusts_10m:18,visibility:10000},
 hourly_units:{time:'iso8601',snow_depth:'m'},
 hourly:{time:['2026-10-07T12:00','2026-10-08T12:00','2026-10-09T12:00','2026-10-10T12:00','2026-10-11T12:00','2026-10-12T12:00'],snow_depth:[0,0,0,0,0,0]},
 daily_units:{time:'iso8601',weather_code:'wmo code',temperature_2m_max:'°C',temperature_2m_min:'°C',apparent_temperature_max:'°C',apparent_temperature_min:'°C',precipitation_probability_max:'%',snowfall_sum:'cm',wind_gusts_10m_max:'km/h',visibility_mean:'m',visibility_min:'m',visibility_max:'m',cloud_cover_mean:'%'},
 daily:{time:['2026-10-07','2026-10-08','2026-10-09','2026-10-10','2026-10-11','2026-10-12'],weather_code:[1,2,0,1,2,3],temperature_2m_max:[20,22,24,24,23,21],temperature_2m_min:[11,12,11,10,10,9],apparent_temperature_max:[19,21,23,23,22,20],apparent_temperature_min:[10,11,10,9,9,8],precipitation_probability_max:[10,10,10,15,20,30],snowfall_sum:[0,0,0,0,0,0],wind_gusts_10m_max:[18,20,19,22,24,25],visibility_mean:[10000,10000,12000,11000,10000,9000],visibility_min:[8000,8000,10000,9000,8000,7000],visibility_max:[15000,15000,16000,15000,15000,14000],cloud_cover_mean:[32,45,20,30,50,70]}
};

function compactHtml(s){
 return String(s||'').replace(/\s+/g,' ').replace(/>\s+</g,'><').trim();
}

async function snapshot(browser,selection){
 const ctx=await browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block'});
 await ctx.addInitScript(({key,value})=>{
   if(value)localStorage.setItem(key,value);
   else localStorage.removeItem(key);
 },{key:stateKey,value:selection});
 const page=await ctx.newPage();
 await page.route('**/api.open-meteo.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
 await page.goto(BASE_URL+'/itinerary.html?trip='+TRIP,{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(4700);
 await page.evaluate(()=>document.querySelectorAll('details.day').forEach(x=>x.open=true));
 await page.waitForTimeout(350);

 const result=await page.evaluate(()=>{
  const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
  const html=e=>String(e?.innerHTML||'').replace(/\s+/g,' ').replace(/>\s+</g,'><').trim();
  const visible=e=>{
    if(!e)return false;
    let n=e;
    while(n&&n!==document.documentElement){
      const s=getComputedStyle(n);
      if(s.display==='none'||s.visibility==='hidden'||n.hidden)return false;
      n=n.parentElement;
    }
    return e.getClientRects().length>0;
  };
  const directText=e=>[...(e?.childNodes||[])].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent||'').join(' ').replace(/\s+/g,' ').trim();

  function highlightData(day){
    const host=[...day.querySelectorAll(':scope > .day-inner > .day-highlights')].find(visible);
    if(!host)return null;
    return {
      title:clean(host.querySelector('.highlights-title')?.textContent),
      items:[...host.querySelectorAll('.highlights-grid > .highlight-item')].filter(visible).map(x=>({
        className:[...x.classList].join(' '),
        html:html(x)
      }))
    };
  }

  function panelData(el){
    if(el.classList.contains('quick-decision')){
      return {
        type:'decision',
        className:[...el.classList].join(' '),
        title:clean(el.querySelector('.quick-decision-title')?.textContent),
        options:[...el.querySelectorAll('.decision-option')].filter(visible).map(x=>({
          className:[...x.classList].join(' '),
          html:html(x)
        }))
      };
    }
    return {type:'panel',className:[...el.classList].join(' '),html:html(el)};
  }

  function mediaItem(el){
    if(!el||!visible(el))return null;
    const img=el.querySelector('img');
    if(!img)return null;
    return {
      src:img.getAttribute('src')||'',
      alt:img.getAttribute('alt')||'',
      caption:clean(el.querySelector('.photo-caption')?.textContent)||img.dataset.caption||'',
      credit:clean(el.querySelector('.v90-plan-photo-credit')?.textContent)||''
    };
  }

  function timelineItem(item){
    const card=item.querySelector(':scope > .timeline-card')||item.querySelector('.timeline-card');
    if(!card)return null;
    const time=item.querySelector(':scope > .time')||item.querySelector('.time');
    const h=card.querySelector(':scope > h3')||card.querySelector('h3');
    const hClone=h?.cloneNode(true);
    hClone?.querySelectorAll('button,.map-pin').forEach(x=>x.remove());
    const links=[...card.querySelectorAll(':scope > a[href]')].filter(visible).map(a=>({
      className:[...a.classList].join(' '),
      label:clean(a.textContent),
      href:a.getAttribute('href')||''
    }));
    const extras=[...card.children].filter(el=>visible(el)&&el.classList.contains('v90-route-stop')).map(el=>({
      className:[...el.classList].join(' '),
      html:html(el)
    }));
    return {
      itemClass:[...item.classList].join(' '),
      cardClass:[...card.classList].join(' '),
      start:directText(time),
      end:clean(time?.querySelector('.end-time')?.textContent),
      eventType:clean(card.querySelector(':scope > .event-type')?.textContent||card.querySelector('.event-type')?.textContent),
      duration:clean(card.querySelector(':scope > .duration-badge')?.textContent||card.querySelector('.duration-badge')?.textContent),
      title:clean(hClone?.textContent),
      map:h?.dataset?.map||'',
      mapLabel:h?.dataset?.mapLabel||'',
      localName:clean(card.querySelector(':scope > .jp-place-name')?.textContent||card.querySelector('.jp-place-name')?.textContent).replace(/^🇯🇵\s*/u,''),
      paragraphs:[...card.querySelectorAll(':scope > p')].filter(visible).map(p=>html(p)),
      price:clean(card.querySelector(':scope > .price')?.textContent||card.querySelector('.price')?.textContent),
      links,
      extras
    };
  }

  function contentBlock(el){
    if(el.classList.contains('timeline')){
      return {type:'timeline',className:[...el.classList].join(' '),items:[...el.children].filter(x=>x.classList.contains('timeline-item')&&visible(x)).map(timelineItem).filter(Boolean)};
    }
    if(el.classList.contains('scenario-title'))return {type:'scenarioTitle',className:[...el.classList].join(' '),text:clean(el.textContent)};
    if(el.classList.contains('day-buttons')){
      return {type:'buttons',className:[...el.classList].join(' '),links:[...el.querySelectorAll('a[href]')].filter(visible).map(a=>({className:[...a.classList].join(' '),label:clean(a.textContent),href:a.getAttribute('href')||''}))};
    }
    if(el.classList.contains('multi-trip-itinerary-hotel'))return null;
    return panelData(el);
  }

  return [...document.querySelectorAll('details.day[id]')].map(day=>{
    const inner=day.querySelector(':scope > .day-inner');
    const photo=inner?.querySelector(':scope > .photo-section');
    const content=inner?.querySelector(':scope > .day-content:not(.tripv2-hidden-original)');
    const pre=[];
    if(inner){
      for(const el of [...inner.children]){
        if(el===photo||el===content||el.classList.contains('day-highlights'))continue;
        if(!visible(el)||el.classList.contains('tripv2-hidden-original'))continue;
        pre.push(panelData(el));
      }
    }
    const hero=[...(photo?.querySelectorAll(':scope > .hero-photo')||[])].find(visible);
    const gallery=[...(photo?.querySelectorAll('.photo-gallery > .photo-card')||[])].filter(visible).map(mediaItem).filter(Boolean);
    return {
      id:day.id,
      title:clean(day.querySelector('.day-title')?.textContent),
      route:clean(day.querySelector('.day-route')?.textContent),
      dateLabel:clean(day.querySelector('.day-date')?.textContent),
      highlights:highlightData(day),
      preBlocks:pre,
      media:photo?{hero:mediaItem(hero),gallery}:null,
      contentBlocks:content?[...content.children].filter(visible).map(contentBlock).filter(Boolean):[]
    };
  });
 });
 await ctx.close();
 return result;
}

function sameView(a,b){return JSON.stringify(a)===JSON.stringify(b);}

const browser=await chromium.launch({headless:true});
const states={};
for(const sel of ['',...(planner.candidateDays||['d6','d7','d8'])]){
 states[sel||'unset']=await snapshot(browser,sel);
}
await browser.close();

const byState={};
for(const [state,days] of Object.entries(states))byState[state]=new Map(days.map(d=>[d.id,d]));
const baseById=new Map((base.days||[]).map(d=>[d.id,d]));
const defaultViews=byState.unset;
const outDays=[];

for(const d of base.days||[]){
 const snap=defaultViews.get(d.id);
 if(!snap)throw new Error('Production snapshot missing '+d.id);
 const out={...d,title:snap.title,route:snap.route,dateLabel:snap.dateLabel,view:{
   highlights:snap.highlights,
   preBlocks:snap.preBlocks,
   media:snap.media,
   contentBlocks:snap.contentBlocks
 }};
 if(Array.isArray(d.moduleRefs)&&d.moduleRefs.length){
   const variants={};
   for(const sel of planner.candidateDays||[]){
     const assigned=planner.assignments?.[sel]?.[d.id];
     const candidate=byState[sel]?.get(d.id);
     if(assigned&&candidate){
       const v={
         title:candidate.title,route:candidate.route,dateLabel:candidate.dateLabel,
         highlights:candidate.highlights,preBlocks:candidate.preBlocks,media:candidate.media,contentBlocks:candidate.contentBlocks
       };
       if(!sameView(v,out.view))variants[assigned]=v;
     }
   }
   if(Object.keys(variants).length)out.variants=variants;
 }
 outDays.push(out);
}

const output={
 schemaVersion:4,
 tripId:TRIP,
 presentationProfile:'standard-itinerary-v1',
 days:outDays
};
if(base.flexibleRules)output.flexibleRules=base.flexibleRules;
fs.writeFileSync(OUT,JSON.stringify(output,null,2)+'\n');

const report={
 source:'Production Golden Reference',
 states:Object.fromEntries(Object.entries(states).map(([k,v])=>[k,{days:v.length,blocks:v.reduce((n,d)=>n+(d.contentBlocks?.length||0),0)}])),
 variants:Object.fromEntries(outDays.filter(d=>d.variants).map(d=>[d.id,Object.keys(d.variants)])),
 timelineItems:outDays.reduce((n,d)=>n+(d.view?.contentBlocks||[]).reduce((m,b)=>m+(b.type==='timeline'?(b.items?.length||0):0),0),0)
};
fs.writeFileSync(path.join(ROOT,'trips',TRIP,'round4-itinerary-capture-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
