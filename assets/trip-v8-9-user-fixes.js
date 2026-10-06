(function(){
'use strict';

const DATA=window.Japan2027EnhancementData||null;
const SH_KEY='japanWinter2027_shinhotakaDay';
const DAY_MATSUMOTO='https://commons.wikimedia.org/wiki/Special:Redirect/file/Matsumoto_Castle_snow.jpg';

function txt(el){return (el?.textContent||'').replace(/\s+/g,' ').trim();}
function placeUrl(q){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q||'');}
function findItem(day,needle){return [...(day?.querySelectorAll('.timeline-item')||[])].find(x=>txt(x.querySelector('h3')).includes(needle))||null;}
function makeItem(cls,time,type,title,jp,desc,map,dur){
  const d=document.createElement('div');
  d.className='timeline-item '+(cls||'');
  d.innerHTML='<div class="time">'+time+'</div><div class="timeline-card"><span class="event-type">'+type+'</span>'+(dur?'<span class="duration-badge">⏱ '+dur+'</span>':'')+'<h3'+(map?' data-map="'+String(map).replace(/"/g,'&quot;')+'"':'')+'>'+title+'</h3>'+(jp?'<div class="jp-place-name">🇯🇵 '+jp+'</div>':'')+'<p>'+desc+'</p></div>';
  return d;
}
function insertAfter(ref,node){if(ref&&node)ref.insertAdjacentElement('afterend',node);}
function setTime(item,v){const t=item?.querySelector('.time');if(t)t.textContent=v;}
function setTitle(item,v){const h=item?.querySelector('h3');if(h)h.textContent=v;}
function setDesc(item,v){const p=item?.querySelector('.timeline-card p');if(p)p.innerHTML=v;}

/* ---------------------------------------------------------
   1) Google Maps: open the place, not driving directions
--------------------------------------------------------- */
window.googleDriveUrl=function(destination){return placeUrl(destination);};
function mapQuery(a){
  const h=a.closest?.('[data-map]');
  if(h?.dataset?.map)return h.dataset.map;
  if(a.dataset?.mapQuery)return a.dataset.mapQuery;
  try{
    const u=new URL(a.href,location.href);
    return u.searchParams.get('destination')||u.searchParams.get('daddr')||u.searchParams.get('query')||'';
  }catch(e){return '';}
}
function rewriteMaps(root){
  (root||document).querySelectorAll('a.map-pin,a.backup-map,a[href*="google.com/maps/dir"],a[href*="maps.google.com"]').forEach(a=>{
    const q=mapQuery(a);if(!q)return;
    a.href=placeUrl(q);a.target='_blank';a.rel='noopener';
    a.title='Google Maps：開啟地點';
    a.setAttribute('aria-label','Google Maps：開啟地點 '+q);
  });
  document.querySelectorAll('footer').forEach(f=>{f.innerHTML=f.innerHTML.replace(/📍\s*=\s*Google Maps 駕車導航/g,'📍 = Google Maps 地點');});
}

/* ---------------------------------------------------------
   2) D2: daytime Matsumoto + standard 3 photos + backups
--------------------------------------------------------- */
function patchD2(){
  const day=document.getElementById('d2');if(!day)return;
  const route=day.querySelector('.day-route');
  if(route)route.textContent='08:30 快早餐 → 步行松本城（1.5小時）→ 返酒店攞行李 → Times 取車 → 輕井澤 Outlet（2小時）→ 千曲｜白絲瀑布＋鬼押出園保留 Backup';

  const hero=day.querySelector('.hero-photo');
  if(hero){
    const img=hero.querySelector('img'),cap=hero.querySelector('.photo-caption');
    if(img){img.src=DAY_MATSUMOTO;img.alt='松本城・冬日日景';img.dataset.caption='🏯 松本城・冬日日景';img.loading='lazy';}
    if(cap)cap.textContent='🏯 松本城・冬日日景';
  }
  const gallery=day.querySelector('.photo-gallery');
  if(gallery){
    gallery.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';
    gallery.innerHTML='<div class="photo-card"><img class="zoomable" src="assets/images/d2-shiraito.jpg" alt="白絲瀑布・Backup" data-caption="🔄 Backup・白絲瀑布" loading="lazy"><div class="photo-caption">🔄 Backup・白絲瀑布</div></div><div class="photo-card"><img class="zoomable" src="assets/images/d2-onioshidashi.jpg" alt="鬼押出園・Backup" data-caption="🔄 Backup・鬼押出園" loading="lazy"><div class="photo-caption">🔄 Backup・鬼押出園</div></div>';
  }
  const title=[...day.querySelectorAll('.scenario-title')].find(x=>/留待下次|Backup/.test(txt(x)));
  if(title)title.textContent='🔄 Backup 景點｜保留，唔屬主線';
  const box=[...day.querySelectorAll('.special-box.backup')].pop();
  if(box)box.innerHTML='<strong>💧 白絲瀑布：</strong>Backup #1。只有松本城、取車同 Outlet 都比預計順利好多，而且即時導航仍可穩陣 17:30 前到千曲館先考慮。<br><br><strong>🌋 鬼押出園：</strong>Backup #2，優先級低過白絲瀑布。唔會為佢縮短 Outlet 2 小時，亦唔會令溫泉酒店遲到。<br><br><strong>原則：</strong>兩個景點保留喺 App，當日唔去完全冇問題；主線仍然係松本城 → Outlet → 千曲。';
  const high=day.querySelector('.highlights-grid');
  if(high){
    [...high.children].forEach(x=>{if(/正式取消|唔再/.test(txt(x))&&/白絲|鬼押/.test(txt(x)))x.innerHTML='🔄 <strong>白絲瀑布＋鬼押出園保留做 Backup</strong>，只有非常順先加，唔影響 Outlet／千曲。';});
  }
  if(DATA?.attractions){
    const sh=DATA.attractions.find(x=>x.id==='shiraito');if(sh){sh.fit='D2 保留做 Backup #1。只有松本城、取車、Outlet 全部明顯早過預期，而且即時導航仍可穩陣 17:30 前到千曲館先考慮。';}
    const on=DATA.attractions.find(x=>x.id==='onioshidashi');if(on){on.fit='D2 保留做 Backup #2，優先級低過白絲瀑布。唔會為鬼押出園縮短 Outlet 或推遲千曲溫泉酒店。';}
  }
  if(typeof window.addMapPins==='function')try{window.addMapPins();}catch(e){}
}

/* delegated zoom for the D2 images recreated above */
function setupD2Zoom(){
  if(window.__v89D2Zoom)return;window.__v89D2Zoom=true;
  document.addEventListener('click',e=>{
    const img=e.target.closest?.('#d2 img.zoomable');if(!img)return;
    const m=document.getElementById('photoModal'),mi=document.getElementById('modalImage'),c=document.getElementById('modalCaption');
    if(!m||!mi||!c)return;
    mi.src=img.src;mi.alt=img.alt;c.textContent=img.dataset.caption||img.alt;m.classList.add('show');document.body.style.overflow='hidden';
  });
}

/* ---------------------------------------------------------
   3) Shrines: actually schedule them, not "if time"
--------------------------------------------------------- */
function clearShrines(){document.querySelectorAll('.v89-shrine').forEach(x=>x.remove());}
function addCityShrinesToD6(){
  const day=document.getElementById('d6');if(!day)return;
  const san=findItem(day,'三町古街');if(!san)return;
  const lunch=findItem(day,'高山市內');
  const caveDrive=findItem(day,'高山 → 飛驒大鐘乳洞');
  const cave=findItem(day,'飛驒大鐘乳洞＋冰之溪谷');
  const shop=findItem(day,'高山地元超市');
  setTime(san,'11:00–11:45');
  if(lunch)setTime(lunch,'13:25–13:55');
  if(caveDrive){setTime(caveDrive,'14:00–14:40');setDesc(caveDrive,'完成三個高山市區神社後向丹生川方向出發；核心景點冇刪減。');}
  if(cave)setTime(cave,'14:40–15:50');
  if(shop)setTime(shop,'16:35–17:05');

  let tail=san;
  const a=makeItem('v89-shrine','11:45–12:15','⛩️ 神社','日枝神社・高山祭山王祭之神社','飛騨山王宮 日枝神社（ひえじんじゃ）','已正式放入主線，唔再寫「如有時間」。由三町一帶短程移動；重點睇杉林參道、千年大杉，同理解春之高山祭「山王祭」嘅源頭。','日枝神社 高山市','30分鐘');insertAfter(tail,a);tail=a;
  const b=makeItem('v89-shrine','12:15–12:30','🚗 市內短程','日枝神社 → 豐川城山稻荷','日枝神社 → 豊川城山稲荷','短程移動去城山一帶。','豊川城山稲荷','15分鐘');insertAfter(tail,b);tail=b;
  const c=makeItem('v89-shrine','12:30–12:50','⛩️ 神社','豐川城山稻荷・朱紅鳥居','豊川城山稲荷（とよかわしろやまいなり）','固定短停。重點係城山樹林＋朱紅鳥居；冬季有雪時攝影效果最好。','豊川城山稲荷','20分鐘');insertAfter(tail,c);tail=c;
  const d=makeItem('v89-shrine','12:50–13:00','🚗 市內短程','豐川城山稻荷 → 飛驒東照宮','豊川城山稲荷 → 飛騨東照宮','同屬高山市內短程，唔需要取消其他景點。','飛騨東照宮','10分鐘');insertAfter(tail,d);tail=d;
  const f=makeItem('v89-shrine','13:00–13:20','⛩️ 神社','飛驒東照宮・德川家康與飛驒匠人','飛騨東照宮（ひだとうしょうぐう）','固定加入。重點睇本殿、唐門、透塀，將高山陣屋嘅幕府行政背景同德川信仰、飛驒匠人工藝串連。','飛騨東照宮','20分鐘');insertAfter(tail,f);
}
function addCityShrinesToD7AfterShirakawa(){
  const day=document.getElementById('d7');if(!day)return;
  const hotel=findItem(day,'Residence Hotel Takayama Station');if(!hotel)return;
  setTime(hotel,'15:30–15:50');
  let tail=hotel;
  const seq=[
    ['15:50–16:00','🚗 市內短程','Residence → 日枝神社','レジデンスホテル高山駅前 → 日枝神社','白川鄉主線已完成，放低行李後先去神社；唔會Cut白川鄉。','日枝神社 高山市','10分鐘'],
    ['16:00–16:20','⛩️ 神社','日枝神社・高山祭山王祭之神社','飛騨山王宮 日枝神社（ひえじんじゃ）','正式加入行程。趁天色未完全暗先睇杉林參道、千年大杉同山王祭背景。','日枝神社 高山市','20分鐘'],
    ['16:20–16:30','🚗 市內短程','日枝神社 → 豐川城山稻荷','日枝神社 → 豊川城山稲荷','短程移動。','豊川城山稲荷','10分鐘'],
    ['16:30–16:50','⛩️ 神社','豐川城山稻荷・朱紅鳥居','豊川城山稲荷（とよかわしろやまいなり）','正式加入行程；雪地朱紅鳥居係攝影重點。','豊川城山稲荷','20分鐘'],
    ['16:50–17:00','🚗 市內短程','豐川城山稻荷 → 飛驒東照宮','豊川城山稲荷 → 飛騨東照宮','短程移動。','飛騨東照宮','10分鐘'],
    ['17:00–17:20','⛩️ 神社','飛驒東照宮・德川家康與飛驒匠人','飛騨東照宮（ひだとうしょうぐう）','正式加入行程；20分鐘睇本殿、唐門同透塀。冬季接近日落，路面有冰就慢行。','飛騨東照宮','20分鐘'],
    ['17:20–17:30','🚗 返回酒店','飛驒東照宮 → Residence','飛騨東照宮 → レジデンスホテル高山駅前','返酒店休息；晚間三寺巡禮 Bonus 仍可按道路／精神狀態決定。','Residence Hotel Takayama Station','10分鐘']
  ];
  seq.forEach(x=>{const n=makeItem('v89-shrine',...x);insertAfter(tail,n);tail=n;});
}
function addHirayuToSelectedDay(dayId){
  const day=document.getElementById(dayId);if(!day)return;
  const ret=[...day.querySelectorAll('.timeline-item')].find(x=>{const h=txt(x.querySelector('h3'));return h.includes('新穗高 → 高山')||h.includes('新穗高 → 安曇野')||h.includes('新穗高 → 松本');});
  if(!ret)return;
  const before=ret.previousElementSibling;
  let aTime,bTime,cTime,target;
  if(dayId==='d6'){aTime='13:30–14:05';bTime='14:05–14:25';cTime='14:25';target='高山';}
  else if(dayId==='d7'){aTime='13:15–13:50';bTime='13:50–14:10';cTime='14:10';target='高山';}
  else {aTime='13:30–14:00';bTime='14:00–14:20';cTime='14:20';target='松本';}
  const a=makeItem('v89-shrine',aTime,'🚗 順路短程','新穗高 → 平湯神社','新穂高温泉 → 平湯神社','新穗高完成後順住主要道路去平湯，唔需要折返。','平湯神社','約30–35分鐘');
  const b=makeItem('v89-shrine',bTime,'⛩️ 神社','平湯神社・奧飛驒溫泉鄉信仰','平湯神社（ひらゆじんじゃ）','正式加入新穗高日，唔再當「如有時間」。短停20分鐘，理解平湯溫泉聚落同地方信仰；免費參拜。','平湯神社','20分鐘');
  before?.insertAdjacentElement('afterend',a);insertAfter(a,b);
  setTime(ret,cTime);
  setTitle(ret,'平湯 → '+target);
  setDesc(ret,target==='高山'?'由平湯返高山市區，保留冬季道路 Buffer。':'由平湯沿主要道路直接去松本；大王山葵農場只保留真正早到先用嘅 Bonus。');
}
function patchShrines(){
  const selected=localStorage.getItem(SH_KEY);if(!selected)return;
  clearShrines();
  addHirayuToSelectedDay(selected);
  if(selected==='d6')addCityShrinesToD7AfterShirakawa();
  else addCityShrinesToD6();
  if(typeof window.addMapPins==='function')try{window.addMapPins();}catch(e){}
}

/* ---------------------------------------------------------
   4) Trip-info topics: trains + shrines must be visible in top nav
--------------------------------------------------------- */
function ensureTripTopics(){
  const nav=document.querySelector('.quick-nav-inner');if(!nav)return;
  if(!nav.querySelector('a[href="#trains"]')){
    const a=document.createElement('a');a.href='#trains';a.textContent='🚆 火車';
    const ref=nav.querySelector('a[href="#transport"]');ref?ref.insertAdjacentElement('afterend',a):nav.appendChild(a);
  }
  if(!nav.querySelector('a[href="#winter-shrines"]')){
    const a=document.createElement('a');a.href='#winter-shrines';a.textContent='⛩️ 神社';
    const ref=nav.querySelector('a[href="#hotels"]');ref?ref.insertAdjacentElement('afterend',a):nav.appendChild(a);
  }
  if(!document.getElementById('trains')){
    const sec=document.createElement('section');sec.className='section';sec.id='trains';
    sec.innerHTML='<div class="section-header"><h2 class="section-title">🚆 火車／買票重點</h2><div class="section-desc">D1、D9 真正要用嘅名鐵 μSKY 同 JR 特急信濃。</div></div><div class="section-body"><div class="card-grid"><div class="info-card"><h3>名鐵 μSKY｜中部國際機場 → 名古屋</h3><p>🇯🇵 名鉄ミュースカイ</p><p>D1 去 Access Plaza／中部國際空港站售票機或有人櫃位買普通乘車券＋μticket。</p></div><div class="info-card"><h3>JR 特急信濃｜名古屋 → 松本</h3><p>🇯🇵 特急しなの</p><p>D1 17:40 左右班次係 Hard Cut；機場 Central Japan Travel Center 排隊短可先出票，否則到 JR 名古屋站買。</p></div><div class="info-card"><h3>D9｜松本 → 名古屋 → NGO</h3><p>🇯🇵 特急しなの → 名鉄</p><p>現行規劃約 13:56 松本出發；到名古屋轉名鐵往中部國際機場。</p></div></div></div>';
    const ref=document.getElementById('transport');ref?ref.insertAdjacentElement('afterend',sec):document.querySelector('.container')?.appendChild(sec);
  }
  const shr=document.getElementById('winter-shrines');
  if(shr){
    const d=shr.querySelector('.section-desc');if(d)d.textContent='已 review 全程時間：飛驒東照宮、日枝神社、豐川城山稻荷會放入高山市區可行時段；平湯神社固定放入你選定嘅新穗高日。唔需要取消核心景點。';
    shr.querySelectorAll('.parking-card').forEach(card=>{
      const h=card.querySelector('h3');if(!h)return;
      h.innerHTML=h.innerHTML.replace(/⭐ 如有時間加|🔄 Backup/g,'✅ 已排入行程');
    });
    const note=shr.querySelector('.note-box');if(note)note.innerHTML='📌 <strong>新版安排：</strong>四個神社唔再只寫「如有時間」。App 會按你揀 D6／D7／D8 邊日去新穗高，自動將高山市區三社同平湯神社放入最順路嗰日。';
  }
}

function addDayPhotoCredit(){
  const body=document.querySelector('.credits-body');if(!body||body.querySelector('.v89-day-credit'))return;
  const p=document.createElement('p');p.className='v89-day-credit';
  p.innerHTML='D2 松本城冬日日景 — Japanexperterna.se / CC BY-SA 3.0 — <a href="https://commons.wikimedia.org/wiki/File:Matsumoto_Castle_snow.jpg" target="_blank" rel="noopener">Wikimedia Commons</a>';
  body.appendChild(p);
}

function apply(){patchD2();patchShrines();ensureTripTopics();rewriteMaps(document);addDayPhotoCredit();}
function refreshLateUi(){rewriteMaps(document);ensureTripTopics();}
function boot(){
  setupD2Zoom();
  apply();
  [300,700,1200,2200].forEach(t=>setTimeout(()=>{apply();refreshLateUi();},t));
  document.addEventListener('click',e=>{if(e.target.closest?.('.tripv2-choice'))setTimeout(()=>{apply();refreshLateUi();},250);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
