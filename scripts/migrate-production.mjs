import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { chromium } from 'playwright';

const ROOT=process.cwd();
const SRC=path.resolve(process.env.PRODUCTION_SOURCE || 'production-source');
const OUT=path.join(ROOT,'trips','shirakawago-shinhotaka-2027');
const BASE_URL=process.env.PRODUCTION_URL || 'http://127.0.0.1:8010';
const TRIP_ID='shirakawago-shinhotaka-2027';

const read=p=>fs.readFileSync(path.join(SRC,p),'utf8');
const readJson=p=>JSON.parse(read(p));
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const textJoin=v=>Array.isArray(v)?v.map(clean).filter(Boolean).join('\n\n'):clean(v);
const ensureDir=p=>fs.mkdirSync(p,{recursive:true});
const write=(name,obj)=>fs.writeFileSync(path.join(OUT,name),JSON.stringify(obj,null,2)+'\n');
const uniq=(arr,key=x=>JSON.stringify(x))=>{
  const seen=new Set(); return arr.filter(x=>{const k=key(x);if(!k||seen.has(k))return false;seen.add(k);return true;});
};
const stripEmoji=s=>clean(s).replace(/^[^\p{L}\p{N}]+/u,'');
const norm=s=>stripEmoji(s).toLowerCase().replace(/[\s・·／/→｜|（）()【】［］\[\]：:，,。.!！?？'"]/g,'');

ensureDir(OUT);

function evalDataFiles(){
  const sandbox={window:{},console};
  vm.createContext(sandbox);
  for(const file of [
    'assets/trip-enhancement-data.js',
    'assets/trip-deep-info-d1-d4.js',
    'assets/trip-deep-info-d5-d9.js',
    'assets/trip-deep-info-backups.js',
    'assets/trip-v8-data.js'
  ]){
    vm.runInContext(read(file),sandbox,{filename:file});
  }
  const final=read('assets/trip-v9-final-fixes.js');
  const start=final.indexOf('const SHRINES={');
  const end=final.indexOf('\n};\n\nfunction patchShrineData',start);
  let shrines={};
  if(start>=0&&end>start){
    const literal=final.slice(start+'const SHRINES='.length,end+2);
    shrines=vm.runInContext('('+literal+')',sandbox,{filename:'shrines-extract'});
  }
  return {
    enhancement:sandbox.window.Japan2027EnhancementData || {},
    v8:sandbox.window.Japan2027V8 || {},
    shrines
  };
}

function richAttractions(data){
  const base=readJson('trips/shirakawago-shinhotaka-2027/attractions.json').attractions || [];
  const baseById=new Map(base.map(x=>[x.id,{...x}]));
  const aliasId={santera:'santera-mairi',daio:'daio-wasabi'};
  const enrichById=new Map();
  for(const a of data.enhancement.attractions || []){
    const id=aliasId[a.id]||a.id;
    enrichById.set(id,{...(enrichById.get(id)||{}),...a,id});
  }

  const shrineMap={
    '飛驒東照宮':'hida-toshogu',
    '平湯神社':'hirayu-shrine',
    '日枝神社':'hie-shrine',
    '豐川城山稻荷':'toyokawa-shiroyama-inari'
  };
  for(const [name,d] of Object.entries(data.shrines||{})){
    const id=shrineMap[name];
    if(!id)continue;
    enrichById.set(id,{...(enrichById.get(id)||{}),id,title:d.title,jp:d.jp,why:d.why,history:d.history,importance:d.importance,look:d.look,fit:d.fit,winter:d.winter,time:d.time,source:d.source});
    if(!baseById.has(id)){
      baseById.set(id,{id,name,location:'高山',day:'D6–D8',status:'backup',score:7.0,map:name,weatherProfiles:['historic_outdoor']});
    }
  }

  for(const [id,a] of enrichById){
    if(!baseById.has(id)){
      baseById.set(id,{
        id,
        name:stripEmoji(a.title||id).split('｜')[0],
        location:'',
        day:'',
        status:'backup',
        map:(a.aliases||[])[0]||stripEmoji(a.title||id).split('｜')[0],
        weatherProfiles:[]
      });
    }
  }

  const visits=data.v8.visits || {};
  const result=[];
  for(const [id,b] of baseById){
    const a=enrichById.get(id)||{};
    const v=visits[id]||{};
    const sources=uniq([
      a.source?{label:'官方／參考資料',url:a.source}:null,
      v.source&&v.source!==a.source?{label:'營業／票價資料',url:v.source}:null
    ].filter(Boolean),x=>x.url);
    const whyLong=a.whyLong?.length?a.whyLong:a.why?[a.why]:[];
    const history=a.history?.length?a.history:a.background?[a.background]:[];
    const visit=a.visit?.length?a.visit:a.look?.length?a.look:[];
    const importance=Array.isArray(a.importance)?a.importance:(a.importance?[a.importance]:[]);
    const tips=[a.understand,a.fit].filter(Boolean).join('\n\n');
    result.push({
      ...b,
      id,
      name:b.name || stripEmoji(a.title||id).split('｜')[0],
      localName:a.jp || b.localName || '',
      summary:textJoin(whyLong) || clean(a.why||''),
      info:clean(a.why||''),
      history:textJoin(history),
      visit:textJoin(visit),
      highlights:importance.map(clean).filter(Boolean),
      access:clean(a.access||''),
      winter:clean(a.winter||''),
      tips:textJoin(tips),
      duration:clean(a.time||b.duration||''),
      openingHours:v.open||'',
      lastEntry:v.last||'',
      closingTime:v.close||'',
      fee:v.fee||'',
      visitNote:v.note||'',
      aliases:uniq([...(a.aliases||[]),b.name,a.title,a.jp].filter(Boolean).map(clean)),
      sources
    });
  }
  return {schemaVersion:3,tripId:TRIP_ID,attractions:result};
}

function buildAliasMatcher(attractions){
  const rows=[];
  for(const a of attractions.attractions){
    for(const alias of uniq([a.name,a.localName,...(a.aliases||[])].filter(Boolean))){
      const n=norm(alias);
      if(n.length>=2) rows.push({id:a.id,n,len:n.length});
    }
  }
  rows.sort((a,b)=>b.len-a.len);
  const manual=[
    ['松本城','matsumoto-castle'],['白馬岩岳','hakuba-iwatake'],['mountainharbor','mountain-harbor'],
    ['新穗高','shinhotaka'],['新穂高','shinhotaka'],['白川鄉','shirakawago'],['白川郷','shirakawago'],
    ['三町','sanmachi'],['高山陣屋','takayama-jinya'],['宮川朝市','miyagawa'],['大鐘乳洞','hida-cave'],
    ['平湯神社','hirayu-shrine'],['飛驒東照宮','hida-toshogu'],['飛騨東照宮','hida-toshogu'],
    ['豐川城山稻荷','toyokawa-shiroyama-inari'],['豊川城山稲荷','toyokawa-shiroyama-inari'],
    ['日枝神社','hie-shrine'],['地獄谷','snow-monkey'],['九湯','shibu-onsen'],['澀溫泉','shibu-onsen'],
    ['輕井澤王子','karuizawa-outlet'],['軽井沢','karuizawa-outlet'],['oranche','oranche'],
    ['小布施','obuse'],['aeonmall須坂','aeon-suzaka'],['aeon須坂','aeon-suzaka'],
    ['飛驒古川','hida-furukawa'],['三寺','santera-mairi'],['大王山葵','daio-wasabi'],
    ['繩手','nawate'],['中町','nakamachi']
  ].map(([s,id])=>({n:norm(s),id,len:norm(s).length}));
  rows.unshift(...manual);
  return title=>{
    const n=norm(title);
    const hit=rows.find(r=>n.includes(r.n)||r.n.includes(n));
    return hit?.id||'';
  };
}

function extractMapFromHref(href){
  if(!href)return '';
  try{
    const u=new URL(href,'http://x');
    return decodeURIComponent(u.searchParams.get('destination')||u.searchParams.get('query')||'');
  }catch{return '';}
}

async function scrapeItinerary(page,baseItinerary,attractions){
  await page.goto(BASE_URL+'/itinerary.html?trip='+TRIP_ID,{waitUntil:'networkidle'});
  await page.waitForTimeout(4200);
  await page.evaluate(()=>{document.querySelectorAll('details.day').forEach(d=>d.open=true);});
  await page.waitForTimeout(800);
  const raw=await page.evaluate(()=>{
    const t=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
    const mediaItem=box=>{
      if(!box)return null;
      const img=box.querySelector('img');
      if(!img)return null;
      const cap=box.querySelector('.photo-caption');
      const credit=box.querySelector('.v90-plan-photo-credit');
      return {src:img.getAttribute('src')||'',alt:img.getAttribute('alt')||'',caption:t(cap)||img.dataset.caption||'',credit:credit?{label:t(credit)}:null};
    };
    return [...document.querySelectorAll('details.day')].map(day=>({
      id:day.id,
      title:t(day.querySelector('.day-title')),
      route:t(day.querySelector('.day-route')),
      highlights:[...day.querySelectorAll('.highlight-item')].map(x=>({text:t(x),classes:[...x.classList]})),
      media:{
        hero:mediaItem(day.querySelector('.hero-photo')),
        gallery:[...day.querySelectorAll('.photo-card')].map(mediaItem).filter(Boolean)
      },
      items:[...day.querySelectorAll('.timeline-item')].map(item=>{
        const card=item.querySelector('.timeline-card')||item;
        const h=card.querySelector('h3');
        const local=card.querySelector('.jp-place-name');
        const map=h?.dataset?.map||'';
        const links=[...card.querySelectorAll('a[href]')].map(a=>({label:t(a),href:a.href})).filter(x=>x.label);
        return {
          time:t(item.querySelector('.time')),
          type:t(card.querySelector('.event-type')),
          title:t(h),
          localName:t(local),
          description:[...card.querySelectorAll('p')].map(t).filter(Boolean).join(' '),
          price:t(card.querySelector('.price')),
          map,
          classes:[...card.classList],
          links
        };
      }).filter(x=>x.time||x.title),
      special:[...day.querySelectorAll('.special-box,.v90-backup-note')].map(x=>({text:t(x),classes:[...x.classList]}))
    }));
  });
  const baseById=new Map(baseItinerary.days.map(d=>[d.id,d]));
  const findAttraction=buildAliasMatcher(attractions);
  const hardMap=new Map();
  const tripInfo=readJson('trips/shirakawago-shinhotaka-2027/trip-info.json');
  for(const h of tripInfo.hardCuts?.items||[]){
    const m=String(h.time||'').match(/D([1-9])\s+(.+)/);
    if(!m)continue;
    const id='d'+m[1]; if(!hardMap.has(id))hardMap.set(id,[]);
    hardMap.get(id).push({time:m[2],label:h.text||''});
  }
  const fixedRegion={d6:'shinhotaka',d7:'shirakawago',d8:'takayama'};
  const days=raw.map((d,idx)=>{
    const b=baseById.get(d.id)||{};
    const items=d.items.map(it=>{
      let title=it.title;
      if(it.localName && title.endsWith(it.localName)) title=title.slice(0,-it.localName.length).trim();
      const attractionId=findAttraction(title);
      const isGoogle=href=>/google\.[^/]+\/maps|maps\.app\.goo\.gl/.test(href||'');
      const links=(it.links||[]).filter(l=>!isGoogle(l.href)).map(l=>({label:l.label,href:l.href}));
      const map=it.map || (it.links||[]).map(l=>extractMapFromHref(l.href)).find(Boolean) || '';
      const out={
        time:it.time,type:it.type||'item',title,localName:it.localName||'',description:it.description||'',map
      };
      if(attractionId)out.attractionId=attractionId;
      if(it.price)out.price=it.price;
      if(links.length)out.links=links;
      if(/hard.?cut|最遲|必須離開/i.test((it.type||'')+' '+title+' '+it.description))out.hardCut=true;
      return out;
    });
    const backups=[...(b.backups||[])];
    const bonus=[...(b.bonus||[])];
    const constraints=[...(b.constraints||[])];
    for(const s of d.special){
      const tx=s.text;
      if(/backup|後備|備用/i.test(tx))backups.push({text:tx});
      else if(/bonus|加碼|有時間/i.test(tx))bonus.push({text:tx});
      else constraints.push({text:tx});
    }
    return {
      id:d.id,
      day:b.day||idx+1,
      date:b.date,
      title:d.title||b.title,
      route:d.route||b.route,
      weatherRegion:fixedRegion[d.id]||b.weatherRegion,
      driving:!!b.driving,
      ...(b.hotelId?{hotelId:b.hotelId}:{}),
      ...(hardMap.get(d.id)?.length?{hardCuts:hardMap.get(d.id)}:(b.hardCuts?.length?{hardCuts:b.hardCuts}:{})),
      ...(d.highlights.length?{highlights:d.highlights.map(h=>({title:h.text,tone:h.classes.includes('highlight-danger')?'warn':h.classes.includes('highlight-weather')?'weather':h.classes.includes('highlight-road')?'road':''}))}:{}),
      ...(d.media.hero||d.media.gallery.length?{media:d.media}:{}),
      items,
      ...(backups.length?{backups:uniq(backups)}:{}),
      ...(bonus.length?{bonus:uniq(bonus)}:{}),
      ...(constraints.length?{constraints:uniq(constraints)}:{})
    };
  });
  return {schemaVersion:3,tripId:TRIP_ID,days};
}

function normalizeCardSection(s){
  if(!s)return s;
  const src=s.cards||s.items||[];
  const cards=src.map(x=>({
    ...(x.badges?{badges:x.badges}:{}),
    title:clean([x.icon,x.time,x.number,x.title].filter(Boolean).join(' ')),
    ...(x.map?{map:x.map}:{}),
    lines:[x.target,...(x.lines||[]),x.text,x.note].filter(Boolean).map(clean),
    ...(x.warning?{warning:clean(x.warning)}:{})
  }));
  return {title:s.title||'',desc:s.desc||'',cards,note:s.note||''};
}

async function scrapeExtraTripInfo(page){
  await page.goto(BASE_URL+'/trip-info.html?trip='+TRIP_ID,{waitUntil:'networkidle'});
  await page.waitForTimeout(4200);
  return page.evaluate(()=>{
    const known=new Set(['transport','car','hotels','parking','hardcuts','weather','checklist','emergency']);
    const t=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
    return [...document.querySelectorAll('section.section')].filter(s=>s.id&&!known.has(s.id)).map(s=>({
      id:s.id,
      title:t(s.querySelector('.section-title'))||s.id,
      desc:t(s.querySelector('.section-desc')),
      cards:[...s.querySelectorAll('.info-card')].map(c=>({
        title:t(c.querySelector('h3')),
        lines:[...c.querySelectorAll('p')].map(t).filter(Boolean),
        map:c.querySelector('h3')?.dataset?.map||'',
        warning:t(c.querySelector('.warning-box,.note-box')),
        links:[...c.querySelectorAll('a[href]')].map(a=>({label:t(a),href:a.href})).filter(x=>x.label)
      })),
      text:t(s.querySelector('.section-body'))
    }));
  });
}

function buildTripInfo(extraSections){
  const src=readJson('trips/shirakawago-shinhotaka-2027/trip-info.json');
  const custom=extraSections.map(s=>({
    id:s.id,title:s.title,desc:s.desc,type:s.cards.length?'cards':'notice',
    ...(s.cards.length?{cards:s.cards.map(c=>({title:c.title,lines:c.lines,...(c.map?{map:c.map}:{}),...(c.warning?{warning:c.warning}:{}),...(c.links?.length?{links:c.links}:{} )}))}:{text:s.text})
  }));
  custom.push({
    id:'weather-manual-rule',title:'🌨️ D6–D8 固定日・天氣只作人手判斷',type:'notice',
    text:'D6 固定新穗高、D7 固定白川鄉、D8 固定高山市區／向東返松本。Weather Score、Live Cam、道路資訊仍保留，但 App 不會自動換日或重排 itinerary。'
  });
  return {
    schemaVersion:2,tripId:TRIP_ID,overview:src.overview,nav:src.nav,
    transport:normalizeCardSection(src.transport),
    car:normalizeCardSection(src.car),
    hotelStays:src.hotelStays,
    parking:normalizeCardSection(src.parking),
    hardCuts:normalizeCardSection(src.hardCuts),
    weather:{
      title:'🌨️ 天氣／道路判斷',
      desc:'保留天氣資料，但移除 D6–D8 auto selection。',
      cards:[
        {title:'D6・新穗高',lines:['睇官方運行、山頂 Live Cam、能見度、風況同冬季道路。天氣差由人手決定 Plan B。']},
        {title:'D7・白川鄉',lines:['睇降雪、道路／交通管制同村內情況。行程日子固定。']},
        {title:'D8・高山市區 → 松本',lines:['睇高山、平湯／安房方向道路情況，安全返松本優先。']}
      ]
    },
    checklist:{...src.checklist,legacyStorageKey:undefined},
    emergency:normalizeCardSection(src.emergency),
    customSections:custom
  };
}

async function scrapeLive(page,itinerary){
  await page.goto(BASE_URL+'/live.html?trip='+TRIP_ID,{waitUntil:'networkidle'});
  await page.waitForTimeout(4200);
  await page.evaluate(()=>{document.querySelectorAll('details.region').forEach(d=>d.open=true);});
  await page.waitForTimeout(1200);
  const regions=await page.evaluate(()=>{
    const t=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
    return [...document.querySelectorAll('details.region')].map(r=>({
      title:t(r.querySelector('.summary-title')),
      dayLine:t(r.querySelector('.day-line')),
      desc:t(r.querySelector('.summary-desc')),
      itineraryHref:r.querySelector('.itinerary-button')?.getAttribute('href')||'',
      route:t(r.querySelector('.route-text')),
      places:[...r.querySelectorAll('.map-link')].map(a=>({label:t(a),href:a.href})),
      officialLinks:[...r.querySelectorAll('.official-links a.small-link')].map(a=>({label:t(a),url:a.href})),
      cameras:[...r.querySelectorAll('.cam-card')].map(c=>({
        title:t(c.querySelector('h3')),
        desc:t(c.querySelector('.cam-text p')),
        badges:[...c.querySelectorAll('.badge')].map(t),
        video:c.querySelector('iframe.live-video')?.dataset?.src||'',
        image:c.querySelector('img.live-img')?.dataset?.src||'',
        actions:[...c.querySelectorAll('.actions a[href]')].map(a=>({label:t(a),href:a.href}))
      }))
    }));
  });
  const camByKey=new Map();
  let seq=0;
  const slug=s=>norm(s).replace(/[^a-z0-9\u4e00-\u9fff]+/g,'').slice(0,28);
  const dayAgg=new Map(itinerary.days.map(d=>[d.id,{id:d.id,label:d.id.toUpperCase(),date:d.date,title:d.title,desc:'',route:d.route,cameras:[],places:[],officialLinks:[]}]));
  for(const r of regions){
    let days=[...r.dayLine.matchAll(/D([1-9])/g)].map(m=>'d'+m[1]);
    const hm=r.itineraryHref.match(/#(d[1-9])/i); if(hm)days.push(hm[1].toLowerCase());
    days=uniq(days);
    const cids=[];
    for(const c of r.cameras){
      const type=c.video?'youtube':c.image?'image':'official';
      const key=type+'|'+c.title;
      if(!camByKey.has(key)){
        seq++;
        const priority=c.badges.some(x=>/必睇/.test(x))?'must':c.badges.some(x=>/後備|backup/i.test(x))?'optional':'ref';
        const action=c.actions[0]?.href||'';
        const videoId=c.video.match(/embed\/([^?&/]+)/)?.[1]||'';
        camByKey.set(key,{
          id:'cam-'+String(seq).padStart(3,'0')+'-'+slug(c.title),
          title:c.title,type,
          ...(videoId?{videoId}:{}),
          ...(c.image?{imageUrl:c.image}:{}),
          ...(action?{sourceUrl:action,sourceLabel:c.actions[0]?.label||'來源'}:{}),
          priority,desc:c.desc,
          tags:c.badges.filter(x=>!/(必睇|參考|後備|即時影片|道路鏡頭)/.test(x))
        });
      }
      cids.push(camByKey.get(key).id);
    }
    for(const id of days){
      const d=dayAgg.get(id); if(!d)continue;
      if(r.desc)d.desc=[d.desc,r.desc].filter(Boolean).join(' · ');
      if(r.route)d.route=r.route;
      d.cameras.push(...cids);
      d.places.push(...r.places.map(p=>({label:p.label,map:extractMapFromHref(p.href)||p.label})));
      d.officialLinks.push(...r.officialLinks);
    }
  }
  for(const d of dayAgg.values()){
    d.cameras=uniq(d.cameras);
    d.places=uniq(d.places,x=>x.label+'|'+x.map);
    d.officialLinks=uniq(d.officialLinks,x=>x.url);
  }
  const external=readJson('trips/shirakawago-shinhotaka-2027/live-cams.json').externalLinks||{};
  for(const [label,url] of Object.entries(external)){
    if(!url)continue;
    const target=label.toLowerCase().includes('shirakawa')?'d7':label.toLowerCase().includes('shinhotaka')?'d6':'d8';
    const d=dayAgg.get(target);
    if(d)d.officialLinks.push({label,url});
  }
  return {
    schemaVersion:3,tripId:TRIP_ID,enabled:true,
    notice:'由原 Japan 2027 Live Cam dashboard 遷移到 Standard cameras[] + days[]。D6–D8 已固定，不再有動態 camera binding。',
    cameras:[...camByKey.values()],
    days:[...dayAgg.values()]
  };
}

function copyReferencedMedia(itinerary){
  const refs=[];
  for(const d of itinerary.days){
    const all=[d.media?.hero,...(d.media?.gallery||[])].filter(Boolean);
    for(const m of all)if(m.src?.startsWith('assets/'))refs.push(m.src.split('?')[0]);
  }
  let copied=0;
  for(const rel of uniq(refs)){
    const src=path.join(SRC,rel),dst=path.join(ROOT,rel);
    if(!fs.existsSync(src))continue;
    ensureDir(path.dirname(dst));
    fs.copyFileSync(src,dst);copied++;
  }
  return {refs:uniq(refs),copied};
}

function buildTrip(){
  const src=readJson('trips/shirakawago-shinhotaka-2027/trip.json');
  const features={...src.features,shinhotakaPlanner:false};
  delete features.shinhotakaPlanner;
  return {
    schemaVersion:12,id:TRIP_ID,name:src.name,shortName:src.shortName,subtitle:src.subtitle,
    startDate:src.startDate,endDate:src.endDate,timezone:src.timezone,country:src.country,
    features,modules:[],
    pages:src.pages,
    dataFiles:{...src.dataFiles},
    renderers:{
      itinerary:{mode:'generate',source:'itinerary'},
      tripInfo:{mode:'generate',source:'tripInfo'},
      attractions:{mode:'generate',source:'attractions'},
      liveCam:{mode:'generate',source:'liveCams'},
      weather:{mode:'generate',source:'weather',profileStandard:'v1',useActivityProfiles:true},
      todayMode:{mode:'generate',source:'itinerary'},
      drivingMode:{mode:'generate',source:'itinerary'}
    },
    photoCredits:src.photoCredits||[]
  };
}

function buildWeather(){
  const src=readJson('trips/shirakawago-shinhotaka-2027/weather.json');
  return {
    schemaVersion:4,tripId:TRIP_ID,profileStandardVersion:src.profileStandardVersion||'v1',
    regions:src.regions,
    dayRegions:{...src.dayRegions,d6:'shinhotaka',d7:'shirakawago',d8:'takayama'},
    scoreProfiles:src.scoreProfiles
  };
}

function copySimple(){
  const hotels=readJson('trips/shirakawago-shinhotaka-2027/hotels.json');
  hotels.tripId=TRIP_ID;
  write('hotels.json',hotels);
  const dep=readJson('trips/shirakawago-shinhotaka-2027/departure-checklist.json');
  dep.tripId=TRIP_ID;
  write('departure-checklist.json',dep);
}

async function main(){
  const rich=evalDataFiles();
  const attractions=richAttractions(rich);
  const baseItinerary=readJson('trips/shirakawago-shinhotaka-2027/itinerary.json');

  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>{
    localStorage.setItem('japanWinter2027_shinhotakaDay','d6');
  });
  const page=await context.newPage();
  const itinerary=await scrapeItinerary(page,baseItinerary,attractions);
  const extra=await scrapeExtraTripInfo(page);
  const tripInfo=buildTripInfo(extra);
  const live=await scrapeLive(page,itinerary);
  await browser.close();

  write('trip.json',buildTrip());
  write('itinerary.json',itinerary);
  write('trip-info.json',tripInfo);
  write('attractions.json',attractions);
  write('live-cams.json',live);
  write('weather.json',buildWeather());
  copySimple();
  const media=copyReferencedMedia(itinerary);

  const checklist=JSON.parse(fs.readFileSync(path.join(OUT,'departure-checklist.json'),'utf8'));
  const report={
    generatedAt:new Date().toISOString(),
    source:{repo:'yfgary/travelpilot',ref:'main',tripId:TRIP_ID},
    fixedPlan:{d6:'shinhotaka',d7:'shirakawago',d8:'takayama-city-to-matsumoto'},
    removed:['D6-D8 automatic day selection','weather-driven D6-D8 automatic selection'],
    counts:{
      days:itinerary.days.length,
      timelineItems:itinerary.days.reduce((n,d)=>n+d.items.length,0),
      photos:itinerary.days.reduce((n,d)=>n+(d.media?.hero?1:0)+(d.media?.gallery?.length||0),0),
      attractions:attractions.attractions.length,
      richAttractions:attractions.attractions.filter(a=>a.summary||a.history||a.visit).length,
      hotels:JSON.parse(fs.readFileSync(path.join(OUT,'hotels.json'),'utf8')).hotels.length,
      departureChecklistItems:(checklist.groups||[]).reduce((n,g)=>n+(g.items?.length||0),0),
      liveCameras:live.cameras.length,
      liveDays:live.days.length,
      customTripInfoSections:tripInfo.customSections.length,
      mediaCopied:media.copied
    },
    tripInfoCustomSections:tripInfo.customSections.map(s=>({id:s.id,title:s.title,type:s.type})),
    mediaRefs:media.refs
  };
  fs.writeFileSync(path.join(OUT,'migration-report.json'),JSON.stringify(report,null,2)+'\n');

  const registry={
    defaultTrip:TRIP_ID,
    trips:[
      {id:TRIP_ID,name:buildTrip().name,subtitle:'Production data migrated into TravelPilot Standard POC',status:'golden',config:'trips/'+TRIP_ID+'/trip.json'},
      {id:'city-demo',name:'City Demo',subtitle:'第二個 generic trip，驗證 0 destination-specific core code',status:'demo',config:'trips/city-demo/trip.json'}
    ]
  };
  fs.writeFileSync(path.join(ROOT,'trips','registry.json'),JSON.stringify(registry,null,2)+'\n');

  fs.rmSync(path.join(ROOT,'trips','golden-reference-2027'),{recursive:true,force:true});
  console.log(JSON.stringify(report,null,2));
}

await main();
