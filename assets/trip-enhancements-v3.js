(function(){
'use strict';

const data=window.Japan2027EnhancementData;
if(!data) return;
const SH_KEY='japanWinter2027_shinhotakaDay';
let modal=null,titleEl=null,bodyEl=null;

/* -----------------------------------------------------
   Lookup helpers
----------------------------------------------------- */
function norm(t){return (t||'').replace(/📍/g,'').replace(/ⓘ/g,'').replace(/\s+/g,' ').trim();}
function bestByAlias(list,text){
  const n=norm(text); let best=null,bestLen=-1;
  list.forEach(obj=>{(obj.aliases||[]).forEach(a=>{if(a&&n.includes(a)&&a.length>bestLen){best=obj;bestLen=a.length;}});});
  return best;
}
function findAttraction(text){return bestByAlias(data.attractions||[],text);}
function findHotel(text){return bestByAlias(data.hotels||[],text);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function paras(arr){
  if(!arr) return '';
  if(!Array.isArray(arr)) arr=[arr];
  return arr.filter(Boolean).map(x=>'<p>'+x+'</p>').join('');
}
function bullets(arr){
  if(!arr) return '';
  if(!Array.isArray(arr)) arr=[arr];
  return '<ul>'+arr.filter(Boolean).map(x=>'<li>'+x+'</li>').join('')+'</ul>';
}

/* -----------------------------------------------------
   Deep attraction modal
----------------------------------------------------- */
function ensureModal(){
  if(modal) return;
  modal=document.createElement('div');
  modal.className='enhance-modal';
  modal.id='tripDeepInfoModal';
  modal.innerHTML='<div class="enhance-modal-card" role="dialog" aria-modal="true" aria-labelledby="tripDeepInfoTitle"><div class="enhance-modal-head"><h2 class="enhance-modal-title" id="tripDeepInfoTitle"></h2><button type="button" class="enhance-modal-close" aria-label="關閉">×</button></div><div class="enhance-modal-body"></div></div>';
  document.body.appendChild(modal);
  titleEl=modal.querySelector('.enhance-modal-title');
  bodyEl=modal.querySelector('.enhance-modal-body');
  modal.querySelector('.enhance-modal-close').addEventListener('click',closeModal);
  modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('show'))closeModal();});
}
function openModal(info){
  ensureModal();
  titleEl.textContent=info.title;
  const why=info.whyLong || info.why || '';
  const hist=info.history || info.background || '';
  const imp=info.importance || [];
  const visit=info.visit || info.look || [];
  const understand=info.understand || '';
  bodyEl.innerHTML=
    (info.jp?'<div class="deep-jp-name">🇯🇵 '+esc(info.jp)+'</div>':'')+
    '<div class="deep-summary"><h3>🧭 點解值得去</h3>'+paras(why)+'</div>'+
    '<div class="deep-section"><h3>📚 歷史／背景：點解會有呢個地方</h3>'+paras(hist)+'</div>'+
    (imp&&imp.length?'<div class="deep-section"><h3>🏛️ 點解喺日本／當地重要</h3>'+bullets(imp)+'</div>':'')+
    '<div class="deep-section"><h3>👀 去到現場應該睇乜</h3>'+bullets(visit)+'</div>'+
    (understand?'<div class="deep-understand"><strong>💡 睇完應該明白乜：</strong><br>'+understand+'</div>':'')+
    (info.fit?'<div class="deep-trip-fit"><strong>🗺️ 點解排喺你呢日行程：</strong><br>'+info.fit+'</div>':'')+
    (info.winter?'<div class="deep-winter"><strong>❄️ 1月冬季重點：</strong><br>'+info.winter+'</div>':'')+
    (info.time?'<div class="deep-time">⏱️ 建議停留：'+info.time+'</div>':'')+
    (info.source?'<a class="deep-source" href="'+esc(info.source)+'" target="_blank" rel="noopener">↗ 官方／主要資料來源</a>':'');
  modal.classList.add('show');
  document.body.style.overflow='hidden';
}
function closeModal(){if(!modal)return;modal.classList.remove('show');document.body.style.overflow='';}
function makeInfoButton(info,cls){
  const b=document.createElement('button');
  b.type='button';b.className=cls||'enhance-info-btn';b.textContent='ⓘ';
  b.dataset.deepInfoId=info.id;b.title='詳盡介紹：歷史、重要性、現場睇乜';
  b.setAttribute('aria-label','詳盡景點介紹：'+info.title);return b;
}
function getById(id){return (data.attractions||[]).find(x=>x.id===id)||null;}

document.addEventListener('click',function(e){
  const btn=e.target.closest('.attraction-info-btn,.enhance-info-btn,.backup-info-btn');
  if(!btn)return;
  let info=btn.dataset.deepInfoId?getById(btn.dataset.deepInfoId):null;
  if(!info){const host=btn.closest('h3,.backup-attraction-title');if(host)info=findAttraction(host.textContent);}
  if(!info)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openModal(info);
},true);

/* -----------------------------------------------------
   Chinese-first names + Japanese place names
----------------------------------------------------- */
const hotelNames=[
 {aliases:['TABINO HOTEL lit 松本','TABINO HOTEL lit Matsumoto','たびのホテル lit 松本'],zh:'松本・TABINO HOTEL lit',jp:'たびのホテル lit 松本'},
 {aliases:['Club Wyndham 千曲館','千曲館','Chikumakan'],zh:'千曲館溫泉酒店・Club Wyndham',jp:'クラブウィンダム千曲館 長野'},
 {aliases:['一乃湯果亭','Ichinoyu Katei'],zh:'澀溫泉・一乃湯果亭',jp:'渋温泉 一乃湯 果亭'},
 {aliases:['Hotel JAL City Nagano','長野日航都市酒店'],zh:'長野日航都市酒店',jp:'ホテルJALシティ長野'},
 {aliases:['飛驒花里之湯 高山櫻庵','高山櫻庵','Takayama Ouan'],zh:'飛驒花里之湯・高山櫻庵',jp:'飛騨花里の湯 高山桜庵'},
 {aliases:['Residence Hotel Takayama Station','Residence','高山站前'],zh:'高山站前 Residence Hotel',jp:'レジデンスホテル高山駅前'},
 {aliases:['Iroha Grand Hotel Matsumoto Ekimae','Iroha','松本酒店'],zh:'松本站前 Iroha Grand Hotel',jp:'いろはグランホテル松本駅前'}
];
const placeNames=[
 {aliases:['中部國際機場 T2','中部國際機場','Chubu Centrair'],zh:'中部國際機場 T2',jp:'中部国際空港 第2ターミナル'},
 {aliases:['松本站','Matsumoto Station'],zh:'松本站',jp:'松本駅'},
 {aliases:['名古屋站','JR 名古屋','名鐵名古屋'],zh:'名古屋站',jp:'名古屋駅'},
 {aliases:['Times 松本站前','Times 4WD','Times松本站前'],zh:'Times 松本站前租車',jp:'タイムズカー松本駅前店'},
 {aliases:['白絲瀑布','白糸の滝'],zh:'輕井澤・白絲瀑布',jp:'白糸の滝'},
 {aliases:['鬼押出園','鬼押出し園'],zh:'鬼押出園・淺間山熔岩地貌',jp:'鬼押出し園'},
 {aliases:['Karuizawa Prince Shopping Plaza','輕井澤 Outlet','Prince Shopping Plaza'],zh:'輕井澤王子購物廣場',jp:'軽井沢・プリンスショッピングプラザ'},
 {aliases:['小布施舊街','栗之小徑','栗の小径'],zh:'小布施舊街・栗之小徑',jp:'小布施・栗の小径'},
 {aliases:['北齋館','北斎館'],zh:'小布施・北齋館',jp:'北斎館'},
 {aliases:['JA中野市 農産物産館 Oranche','JA Oranche','Oranche'],zh:'JA中野市・農產物產館 Oranche',jp:'農産物産館オランチェ'},
 {aliases:['澀溫泉街','九湯巡禮','澀溫泉'],zh:'澀溫泉・九湯巡禮',jp:'渋温泉・九湯めぐり'},
 {aliases:['地獄谷野猿公苑'],zh:'地獄谷野猿公苑・雪猴',jp:'地獄谷野猿公苑'},
 {aliases:['須坂 蔵之町並み','須坂 蔵之町','須坂蔵之町'],zh:'須坂・藏之町歷史街區',jp:'須坂・蔵の町並み'},
 {aliases:['AEON Mall 須坂','AEON MALL SUZAKA','AEON 須坂'],zh:'須坂 AEON MALL',jp:'イオンモール須坂'},
 {aliases:['白馬岩岳 Mountain Resort','白馬岩岳'],zh:'白馬岩岳山岳度假村',jp:'白馬岩岳マウンテンリゾート'},
 {aliases:['HAKUBA MOUNTAIN HARBOR','Mountain Harbor'],zh:'白馬岩岳・Mountain Harbor觀景台',jp:'HAKUBA MOUNTAIN HARBOR'},
 {aliases:['IWATAKE WHITE PARK','WHITE PARK','White Park'],zh:'白馬岩岳・White Park雪地區',jp:'IWATAKE WHITE PARK'},
 {aliases:['宮川朝市'],zh:'高山・宮川朝市',jp:'宮川朝市'},
 {aliases:['高山陣屋'],zh:'高山陣屋・江戶幕府官署',jp:'高山陣屋'},
 {aliases:['三町古街','三町古街＋中橋＋酒藏','三町'],zh:'高山三町古街・中橋・酒藏',jp:'古い町並・中橋・酒蔵'},
 {aliases:['飛驒大鐘乳洞','飛騨大鍾乳洞','冰之溪谷'],zh:'飛驒大鐘乳洞・冰之溪谷',jp:'飛騨大鍾乳洞・氷の渓谷'},
 {aliases:['新穗高纜車','新穂高ロープウェイ','新穗高'],zh:'新穗高纜車・北阿爾卑斯',jp:'新穂高ロープウェイ'},
 {aliases:['白川鄉・荻町合掌村','荻町合掌村','白川鄉'],zh:'世界遺產・白川鄉荻町合掌村',jp:'白川郷・荻町合掌造り集落'},
 {aliases:['和田家'],zh:'白川鄉・和田家',jp:'和田家'},
 {aliases:['荻町城跡展望台'],zh:'白川鄉・荻町城跡展望台',jp:'荻町城跡展望台'},
 {aliases:['飛驒古川 三寺まいり','三寺まいり','三寺巡禮'],zh:'飛驒古川・三寺巡禮',jp:'三寺まいり'},
 {aliases:['飛驒古川 白壁土蔵街','白壁土蔵街'],zh:'飛驒古川・白壁土藏街',jp:'瀬戸川と白壁土蔵街'},
 {aliases:['飛驒之里'],zh:'飛驒之里・古民家戶外博物館',jp:'飛騨の里'},
 {aliases:['高山祭屋台會館'],zh:'高山祭屋台會館',jp:'高山祭屋台会館'},
 {aliases:['平湯之森'],zh:'奧飛驒・平湯之森',jp:'ひらゆの森'},
 {aliases:['奧飛驒熊牧場'],zh:'奧飛驒熊牧場',jp:'奥飛騨クマ牧場'},
 {aliases:['大王山葵農場'],zh:'安曇野・大王山葵農場',jp:'大王わさび農場'},
 {aliases:['繩手通'],zh:'松本・繩手通',jp:'縄手通り'},
 {aliases:['中町通'],zh:'松本・中町通',jp:'中町通り'},
 {aliases:['AEON Mall Matsumoto','AEON Mall 松本','AEON → 油站'],zh:'松本 AEON MALL',jp:'イオンモール松本'},
 {aliases:['高山地元超市','駿河屋','Valor'],zh:'高山地元超市',jp:'駿河屋／バロー 高山'}
];
function matchName(list,text){return bestByAlias(list,text);}
function replaceHeadingText(h3,newText){
  const preserve=[...h3.querySelectorAll('a.map-pin,button.attraction-info-btn,button.enhance-info-btn')];
  h3.childNodes.forEach(n=>{if(n.nodeType===3)n.remove();});
  h3.insertBefore(document.createTextNode(newText+' '),h3.firstChild);
  preserve.forEach(x=>{if(!h3.contains(x))h3.appendChild(x);});
}
function setJapaneseAfter(h3,jp){
  if(!jp)return;
  let el=h3.nextElementSibling;
  if(el&&el.classList.contains('jp-place-name')){el.textContent=jp;return;}
  el=document.createElement('div');el.className='jp-place-name';el.textContent=jp;h3.insertAdjacentElement('afterend',el);
}
function isAttractionCard(card){
  const type=card?.querySelector('.event-type')?.textContent||'';
  return !/(🚗|CHECK|HARD CUT|🍳|🍜|✈️|🚆|名鐵|入境|轉車|還車|入油|休息|溫泉 \/ 休息|Gondola|步行|接駁|Check-out)/.test(type);
}
function localizeTimeline(root){
  (root||document).querySelectorAll('.timeline-card h3').forEach(h3=>{
    const raw=norm(h3.textContent);
    const hotel=matchName(hotelNames,raw);
    if(hotel){replaceHeadingText(h3,hotel.zh);setJapaneseAfter(h3,hotel.jp);return;}
    const card=h3.closest('.timeline-card');
    if(isAttractionCard(card)){
      const info=findAttraction(raw);
      if(info){replaceHeadingText(h3,info.title);setJapaneseAfter(h3,info.jp);return;}
    }
    const loc=matchName(placeNames,raw);
    if(loc)setJapaneseAfter(h3,loc.jp);
  });
}
function localizeHotelRows(){
  document.querySelectorAll('.hotel-row .hotel-name').forEach(el=>{
    const x=matchName(hotelNames,el.textContent);if(!x)return;
    const pins=[...el.querySelectorAll('a.map-pin')];
    [...el.childNodes].forEach(n=>{if(n.nodeType===3)n.remove();});
    el.insertBefore(document.createTextNode(x.zh+' '),el.firstChild);
    pins.forEach(p=>{if(!el.contains(p))el.appendChild(p);});
    if(!el.querySelector('.jp-place-name')){const jp=document.createElement('div');jp.className='jp-place-name';jp.textContent=x.jp;el.appendChild(jp);}
  });
}

/* -----------------------------------------------------
   Info buttons
----------------------------------------------------- */
function decorateInfo(root){
  (root||document).querySelectorAll('.timeline-card h3').forEach(h3=>{
    const card=h3.closest('.timeline-card');if(!isAttractionCard(card))return;
    const info=findAttraction(h3.textContent);if(!info)return;
    let b=h3.querySelector('.attraction-info-btn,.enhance-info-btn');
    if(!b){b=makeInfoButton(info);h3.appendChild(b);}else b.dataset.deepInfoId=info.id;
  });
}

/* -----------------------------------------------------
   Hotel arrival-payment status
----------------------------------------------------- */
function clearLegacyHotelStatus(root){(root||document).querySelectorAll('.hotel-status-inline,.hotel-status-badges,.hotel-payment-line').forEach(x=>x.classList.add('legacy-hotel-status'));}
function addHotelBadges(container,h){
  if(container.querySelector('.arrival-status-inline'))return;
  const wrap=document.createElement('div');wrap.className='arrival-status-inline';
  (h.badges||[]).forEach(([type,label])=>{const s=document.createElement('span');s.className='arrival-badge '+type;s.textContent=label;wrap.appendChild(s);});
  const detail=document.createElement('div');detail.className='arrival-payment-detail';detail.textContent=h.detail||'';
  container.append(wrap,detail);
}
function decorateHotels(root){
  clearLegacyHotelStatus(root);
  (root||document).querySelectorAll('.timeline-card h3').forEach(h3=>{const h=findHotel(h3.textContent);if(!h)return;addHotelBadges(h3.closest('.timeline-card')||h3.parentElement,h);});
  document.querySelectorAll('.hotel-row').forEach(row=>{
    const name=row.querySelector('.hotel-name'),note=row.querySelector('.hotel-note');if(!name||!note)return;
    const h=findHotel(name.textContent);if(!h)return;
    if(h.noteOverride)note.textContent=h.noteOverride;
    addHotelBadges(name,h);
  });
}

/* -----------------------------------------------------
   Backup panels
----------------------------------------------------- */
function mapsUrl(q){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);}
function backupCard(item){
  const info=getById(item.id);if(!info)return null;
  const card=document.createElement('div');card.className='backup-attraction-card';
  const head=document.createElement('div');head.className='backup-attraction-title';
  const st=document.createElement('strong');st.textContent=info.title;head.appendChild(st);
  const b=makeInfoButton(info,'backup-info-btn');head.appendChild(b);
  const map=document.createElement('a');map.className='backup-map';map.href=mapsUrl((info.aliases||[])[0]||info.title);map.target='_blank';map.rel='noopener';map.textContent='📍';map.title='Google Maps';head.appendChild(map);
  card.appendChild(head);
  if(info.jp){const jp=document.createElement('div');jp.className='backup-jp';jp.textContent='🇯🇵 '+info.jp;card.appendChild(jp);}
  card.insertAdjacentHTML('beforeend','<div class="backup-row"><span>✅ 乜情況用</span><p>'+item.when+'</p></div><div class="backup-row"><span>🗺️ 最順路擺法</span><p>'+item.route+'</p></div><div class="backup-row backup-rule"><span>⚠️ 底線</span><p>'+item.rule+'</p></div>');
  return card;
}
function injectBackups(){
  Object.entries(data.backups||{}).forEach(([dayId,items])=>{
    const day=document.getElementById(dayId);if(!day)return;
    let old=day.querySelector('.backup-panel');if(old)old.remove();
    const panel=document.createElement('details');panel.className='backup-panel';
    panel.innerHTML='<summary>🧩 後備／早到景點 <span class="backup-count">'+items.length+' 個</span></summary><div class="backup-panel-body"><div class="backup-intro">主行程唔變。只有早到、天氣切換或原路線唔適合先用；每個後備位都寫明應該放喺邊一站之後最順路。</div></div>';
    const body=panel.querySelector('.backup-panel-body');items.forEach(i=>{const c=backupCard(i);if(c)body.appendChild(c);});
    if(['d6','d7','d8'].includes(dayId)){const x=document.createElement('div');x.className='backup-excluded';x.innerHTML='<strong>🚫 上高地唔列入1月後備</strong><span>1月係冬季閉山期，一般觀光巴士及常規旅遊配套暫停；今次唔用佢做臨時替代。</span>';body.appendChild(x);}
    const inner=day.querySelector('.day-inner');(inner||day).appendChild(panel);
  });
}

/* -----------------------------------------------------
   Hong Kong departure checklist
----------------------------------------------------- */
function injectDepartureChecklist(){
  const existing=document.getElementById('checklist');if(!existing)return;
  const old=document.getElementById('departure-checklist');if(old)old.remove();
  const section=document.createElement('section');section.className='section';section.id='departure-checklist';
  section.innerHTML='<div class="section-header"><h2 class="section-title">🧳 香港出發前・已帶物品 Checklist</h2><div class="section-desc">呢份係離開香港前執行李用，唔同每日出車Checklist。Tick狀態會保留喺呢部iPhone／PWA。</div><div class="departure-progress" id="departureProgress"></div></div><div class="section-body"><div id="departureChecklistGroups"></div><div class="departure-actions"><button type="button" id="resetDepartureChecklist">↺ 全部重設</button></div></div>';
  existing.parentNode.insertBefore(section,existing);
  const nav=document.querySelector('.quick-nav-inner');if(nav&&!nav.querySelector('a[href="#departure-checklist"]')){const a=document.createElement('a');a.href='#departure-checklist';a.textContent='🧳 出發前';const before=nav.querySelector('a[href="#checklist"]');before?nav.insertBefore(a,before):nav.appendChild(a);}
  const key='japanWinter2027DepartureChecklistV1';let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch(e){}
  const box=section.querySelector('#departureChecklistGroups');
  (data.departureChecklist||[]).forEach(group=>{const g=document.createElement('div');g.className='departure-group';const h=document.createElement('h3');h.textContent=group.group;g.appendChild(h);const grid=document.createElement('div');grid.className='departure-grid';group.items.forEach(([id,label])=>{const item=document.createElement('label');item.className='departure-item'+(saved[id]?' checked':'');const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!saved[id];const span=document.createElement('span');span.textContent=label;item.append(cb,span);cb.addEventListener('change',()=>{saved[id]=cb.checked;item.classList.toggle('checked',cb.checked);localStorage.setItem(key,JSON.stringify(saved));update();});grid.appendChild(item);});g.appendChild(grid);box.appendChild(g);});
  const progress=section.querySelector('#departureProgress');
  function update(){const all=section.querySelectorAll('input[type="checkbox"]'),done=section.querySelectorAll('input[type="checkbox"]:checked');progress.textContent='完成 '+done.length+' / '+all.length+(done.length===all.length?'　✅ 可以出發':'');}
  update();section.querySelector('#resetDepartureChecklist').addEventListener('click',()=>{if(!confirm('重設所有「香港出發前」Checklist？'))return;saved={};localStorage.removeItem(key);section.querySelectorAll('input[type="checkbox"]').forEach(cb=>{cb.checked=false;cb.closest('.departure-item').classList.remove('checked');});update();});
}

/* -----------------------------------------------------
   Day starts / ends at hotel
----------------------------------------------------- */
const dayHotels={
 d1:{start:['香港・出發日','香港国際空港'],end:['松本・TABINO HOTEL lit','たびのホテル lit 松本']},
 d2:{start:['松本・TABINO HOTEL lit','たびのホテル lit 松本'],end:['千曲館溫泉酒店・Club Wyndham','クラブウィンダム千曲館 長野']},
 d3:{start:['千曲館溫泉酒店・Club Wyndham','クラブウィンダム千曲館 長野'],end:['澀溫泉・一乃湯果亭','渋温泉 一乃湯 果亭']},
 d4:{start:['澀溫泉・一乃湯果亭','渋温泉 一乃湯 果亭'],end:['長野日航都市酒店','ホテルJALシティ長野']},
 d5:{start:['長野日航都市酒店','ホテルJALシティ長野'],end:['飛驒花里之湯・高山櫻庵','飛騨花里の湯 高山桜庵']},
 d6:{start:['飛驒花里之湯・高山櫻庵','飛騨花里の湯 高山桜庵'],end:['飛驒花里之湯・高山櫻庵','飛騨花里の湯 高山桜庵']},
 d7:{start:['飛驒花里之湯・高山櫻庵','飛騨花里の湯 高山桜庵'],end:['高山站前 Residence Hotel','レジデンスホテル高山駅前']},
 d8:{start:['高山站前 Residence Hotel','レジデンスホテル高山駅前'],end:['松本站前 Iroha Grand Hotel','いろはグランホテル松本駅前']},
 d9:{start:['松本站前 Iroha Grand Hotel','いろはグランホテル松本駅前'],end:['香港・返港日','香港国際空港']}
};
function injectHotelRoute(){
  Object.entries(dayHotels).forEach(([id,x])=>{const day=document.getElementById(id);if(!day)return;day.querySelector('.day-hotel-route')?.remove();const box=document.createElement('div');box.className='day-hotel-route';box.innerHTML='<div class="day-hotel-point"><div class="day-hotel-label">🏨 今日開始</div><div class="day-hotel-name">'+x.start[0]+'</div><div class="day-hotel-jp">🇯🇵 '+x.start[1]+'</div></div><div class="day-hotel-arrow">→</div><div class="day-hotel-point"><div class="day-hotel-label">🏨 今日完結</div><div class="day-hotel-name">'+x.end[0]+'</div><div class="day-hotel-jp">🇯🇵 '+x.end[1]+'</div></div>';const hi=day.querySelector('.day-highlights');hi?hi.insertAdjacentElement('afterend',box):day.querySelector('.day-inner')?.prepend(box);});
}
function normalizeFixedDayStarts(){
  const fixes={d2:['08:00','松本・TABINO HOTEL lit（今日開始）','たびのホテル lit 松本'],d3:['08:00','千曲館溫泉酒店・Club Wyndham（今日開始）','クラブウィンダム千曲館 長野'],d4:['08:00','澀溫泉・一乃湯果亭（今日開始）','渋温泉 一乃湯 果亭'],d5:['07:45','長野日航都市酒店（今日開始）','ホテルJALシティ長野'],d9:['08:00','松本站前 Iroha Grand Hotel（今日開始）','いろはグランホテル松本駅前']};
  Object.entries(fixes).forEach(([id,[time,title,jp]])=>{const day=document.getElementById(id);if(!day)return;const item=[...day.querySelectorAll('.timeline-item')].find(i=>(i.querySelector('.time')?.childNodes[0]?.textContent||i.querySelector('.time')?.textContent||'').trim().startsWith(time));if(!item)return;const h3=item.querySelector('h3');if(h3){replaceHeadingText(h3,title);setJapaneseAfter(h3,jp);item.querySelector('.timeline-card')?.classList.add('hotel-start-marker');}});
}
function ensureFixedHotelEnds(){
  const ends={d1:['松本・TABINO HOTEL lit','たびのホテル lit 松本','Bonus完成／Skip後返回酒店休息。'],d3:['澀溫泉・一乃湯果亭','渋温泉 一乃湯 果亭','夜間巡湯／散步後返回旅館休息。'],d4:['長野日航都市酒店','ホテルJALシティ長野','晚餐後返回酒店，今日正式完結。'],d5:['飛驒花里之湯・高山櫻庵','飛騨花里の湯 高山桜庵','晚餐後返回酒店；浸溫泉／休息。']};
  Object.entries(ends).forEach(([id,[title,jp,desc]])=>{const day=document.getElementById(id);if(!day)return;const tl=day.querySelector('.timeline');if(!tl||tl.querySelector('.v3-hotel-end'))return;const item=document.createElement('div');item.className='timeline-item v3-hotel-end';item.innerHTML='<div class="time">晚上</div><div class="timeline-card hotel-end-marker"><span class="event-type">🏨 今日完結</span><h3>'+title+'</h3><div class="jp-place-name">'+jp+'</div><p>'+desc+'</p></div>';tl.appendChild(item);});
}

/* -----------------------------------------------------
   Fixed D1-D5/D9 Excel exact durations
----------------------------------------------------- */
const fixedRules={
 d1:[['06:45','','07:00','15分鐘'],['07:00','','07:30','30分鐘'],['07:30','','09:20','1小時50分'],['10:00','','14:30','4小時30分'],['14:30','','15:45','1小時15分'],['15:45','','16:35','50分鐘'],['16:35','','17:35','1小時'],['17:40','','19:46','2小時06分'],['19:50','','20:10','20分鐘'],['20:20','','21:05','45分鐘']],
 d2:[['08:00','','09:00','1小時'],['09:10','','09:40','30分鐘'],['09:40','','10:00','20分鐘'],['10:00','松本 → 白絲','11:55','1小時55分'],['11:55','','12:35','40分鐘'],['12:35','','12:50','15分鐘'],['12:50','','13:40','50分鐘'],['13:40','','14:10','30分鐘'],['14:10','','15:00','50分鐘'],['15:00','','16:30','1小時30分'],['16:30','','17:50','1小時20分'],['17:50','','18:25','35分鐘'],['18:30','','20:00','1小時30分']],
 d3:[['08:00','','09:00','1小時'],['09:15','','10:00','45分鐘'],['10:00','','11:15','1小時15分'],['11:15','北齋','12:00','45分鐘'],['12:00','','12:45','45分鐘'],['12:45','','13:05','20分鐘'],['13:05','','13:40','35分鐘'],['13:40','','14:20','40分鐘'],['14:20','','15:00','40分鐘'],['15:00','','17:30','2小時30分'],['18:00','','19:30','1小時30分'],['20:00','','21:30','1小時30分'],['11:15','岩松院','11:50','35分鐘']],
 d4:[['08:00','','09:00','1小時'],['09:00','','09:40','40分鐘'],['09:40','','10:15','35分鐘'],['10:15','','11:30','1小時15分'],['11:30','','12:05','35分鐘'],['12:05','','12:45','40分鐘'],['12:45','午餐','13:30','45分鐘'],['13:30','','17:00','3小時30分'],['17:00','','17:40','40分鐘'],['17:45','','18:30','45分鐘'],['19:00','','20:00','1小時'],['12:45','須坂','13:25','40分鐘']],
 d5:[['07:45','','08:30','45分鐘'],['08:30','','09:00','30分鐘'],['09:00','','10:15','1小時15分'],['10:20','','10:35','15分鐘'],['10:35','','11:15','40分鐘'],['11:15','','11:50','35分鐘'],['11:50','','12:20','30分鐘'],['12:20','','12:35','15分鐘'],['12:35','','13:20','45分鐘'],['13:20','','16:30','3小時10分'],['16:30','','17:00','30分鐘'],['17:00','','18:30','1小時30分'],['19:15','','20:30','1小時15分'],['15:45','','16:45','1小時']],
 d9:[['08:00','','09:00','1小時'],['09:00','','09:15','15分鐘'],['09:15','','09:30','15分鐘'],['09:30','','11:00','1小時30分'],['11:00','','11:15','15分鐘'],['11:15','','11:25','10分鐘'],['11:25','','11:40','15分鐘'],['11:40','','12:10','30分鐘'],['12:10','','13:25','1小時15分'],['13:56','','16:07','2小時11分'],['16:07','','16:40','33分鐘'],['16:49','','17:17','28分鐘'],['17:17','','19:30','2小時13分'],['20:40','','00:30 +1','3小時50分']]
};
function baseTime(item){const t=item.querySelector('.time');if(!t)return'';return (t.childNodes[0]?.textContent||t.textContent||'').trim();}
function decorateFixedDurations(){
  Object.entries(fixedRules).forEach(([id,rules])=>{const day=document.getElementById(id);if(!day)return;const items=[...day.querySelectorAll('.timeline-item')];const used=new Set();rules.forEach(([start,needle,end,dur])=>{const item=items.find((it,idx)=>!used.has(idx)&&baseTime(it).startsWith(start)&&(!needle||norm(it.textContent).includes(needle)));if(!item)return;used.add(items.indexOf(item));const t=item.querySelector('.time');if(t&&!t.querySelector('.end-time')){const e=document.createElement('span');e.className='end-time';e.textContent=end;t.appendChild(e);}const card=item.querySelector('.timeline-card');const et=card?.querySelector('.event-type');if(card&&!card.querySelector('.duration-badge')){const b=document.createElement('span');b.className='duration-badge';b.textContent='⏱ '+dur;et?et.insertAdjacentElement('afterend',b):card.prepend(b);}});});
}

/* -----------------------------------------------------
   Exact selected D6-D8 plan from Master Itinerary v3
----------------------------------------------------- */
const JP={ouan:'飛騨花里の湯 高山桜庵',res:'レジデンスホテル高山駅前',iroha:'いろはグランホテル松本駅前',sh:'新穂高ロープウェイ',miyagawa:'宮川朝市',jinya:'高山陣屋',sanmachi:'古い町並・中橋・酒蔵',cave:'飛騨大鍾乳洞・氷の渓谷',shirakawa:'白川郷・荻町合掌造り集落',wada:'和田家',view:'荻町城跡展望台',daio:'大王わさび農場'};
function row(start,end,dur,type,title,jp,desc,opt){return Object.assign({start,end,dur,type,title,jp,desc},opt||{});}
function d6Rows(sh){
 const common=[row('07:45','08:15','30分鐘','🌨️ 天氣判斷','飛驒花里之湯・高山櫻庵（今日開始）',JP.ouan,'喺酒店睇新穗高官方Operation Status、Live Camera、山頂能見度及風況；只有狀況值得先按已選日子執行。',{hotelStart:true,map:'Takayama Ouan'}),row('08:15','08:50','35分鐘','🍳 早餐','飛驒花里之湯・高山櫻庵',JP.ouan,'早餐／出發準備。',{map:'Takayama Ouan'})];
 if(sh)return common.concat([
  row('08:50','10:10','1小時20分','🚗 車','高山 → 新穗高','新穂高温泉','冬季山路預鬆，唔為趕纜車超速。',{map:'新穂高温泉駐車場'}),
  row('10:15','12:45','2小時30分','🚡 核心景點','新穗高纜車・北阿爾卑斯',JP.sh,'兩段纜車去海拔2,156米西穗高口；能見度係體驗關鍵。',{map:'新穂高温泉駐車場',price:'成人約 ¥3,800'}),
  row('12:45','13:30','45分鐘','🍜 午餐','新穗高','新穂高温泉','簡單午餐，按纜車排隊及實際停留調整。',{map:'新穂高温泉駐車場'}),
  row('13:30','14:50','1小時20分','🚗 車','新穗高 → 高山','新穂高温泉 → 高山市','保留冬季道路Buffer。',{map:'Takayama Ouan'}),
  row('15:10','16:15','1小時05分','🛍️ 彈性','高山古街／地元超市','高山市','買手信或地元食品；高山市區完整參觀留另一日。',{map:'高山駅'}),
  row('17:00','19:00','2小時','♨️ 溫泉／休息','飛驒花里之湯・高山櫻庵',JP.ouan,'返酒店浸天然溫泉、休息。',{hotelEnd:true,map:'Takayama Ouan'}),
  row('19:15','20:45','1小時30分','🍖 晚餐','飛驒牛晚餐','高山市','高山市內正式飛驒牛晚餐。',{map:'高山駅'}),
  row('晚餐後','','','🏨 今日完結','飛驒花里之湯・高山櫻庵',JP.ouan,'晚餐後返回酒店休息。',{hotelEnd:true,map:'Takayama Ouan'})
 ]);
 return common.concat([
  row('09:30','10:10','40分鐘','🥬 景點','高山・宮川朝市',JP.miyagawa,'睇地元蔬果、漬物、味噌、手信及小食。',{map:'宮川朝市 高山'}),
  row('10:15','11:00','45分鐘','🏯 景點','高山陣屋・江戶幕府官署',JP.jinya,'江戶幕府直接管治飛驒時嘅地方行政機關。',{map:'中橋駐車場 高山',price:'成人約 ¥500'}),
  row('11:00','12:25','1小時25分','🏘️ 古街／酒藏','高山三町古街・中橋・酒藏',JP.sanmachi,'町家、酒藏、味噌店、傳統老舖；司機唔試酒。',{map:'中橋駐車場 高山'}),
  row('12:25','13:10','45分鐘','🍜 午餐','高山市內','高山市','高山拉麵／蕎麥麵等。',{map:'高山駅'}),
  row('13:10','13:50','40分鐘','🚗 車','高山 → 飛驒大鐘乳洞','高山市 → 飛騨大鍾乳洞','冬季山路預留Buffer。',{map:'飛騨大鍾乳洞'}),
  row('13:50','15:20','1小時30分','🧊 景點','飛驒大鐘乳洞・冰之溪谷',JP.cave,'室內洞穴較少受落雪影響；1月冰景係特色。',{map:'飛騨大鍾乳洞',price:'成人約 ¥1,100'}),
  row('15:20','16:00','40分鐘','🚗 車','飛驒大鐘乳洞 → 高山','飛騨大鍾乳洞 → 高山市','返高山市區。',{map:'高山駅'}),
  row('16:00','17:15','1小時15分','🛒 購物','高山地元超市','駿河屋／バロー 高山','買水果、零食、調味料、飛驒牛等。',{map:'高山駅'}),
  row('17:15','19:00','1小時45分','♨️ 溫泉／休息','飛驒花里之湯・高山櫻庵',JP.ouan,'晚餐前返酒店休息／浸溫泉。',{hotelEnd:true,map:'Takayama Ouan'}),
  row('19:15','20:45','1小時30分','🍖 晚餐','飛驒牛晚餐','高山市','正式飛驒牛晚餐。',{map:'高山駅'}),
  row('晚餐後','','','🏨 今日完結','飛驒花里之湯・高山櫻庵',JP.ouan,'晚餐後返回酒店休息。',{hotelEnd:true,map:'Takayama Ouan'})
 ]);
}
function d7Rows(sh){
 const base=[row('08:00','08:45','45分鐘','🍳 早餐／執行李','飛驒花里之湯・高山櫻庵（今日開始）',JP.ouan,'早餐、執行李；今日退房後搬去Residence。',{hotelStart:true,map:'Takayama Ouan'}),row('08:45','09:15','30分鐘','🧳 Check-out／搬行李','高山櫻庵 → 高山站前 Residence','高山桜庵 → レジデンスホテル高山駅前','將行李移去Residence；未能寄存就放車內。',{map:'Residence Hotel Takayama Station'})];
 if(sh)return base.concat([
  row('09:15','10:35','1小時20分','🚗 車','高山 → 新穗高','高山市 → 新穂高温泉','冬季預1小時20分，唔為趕纜車超速。',{map:'新穂高温泉駐車場'}),
  row('10:35','13:15','2小時40分','🚡 核心景點','新穗高纜車・北阿爾卑斯',JP.sh,'雙層纜車上高海拔展望位置，睇北阿爾卑斯雪峰。',{map:'新穂高温泉駐車場',price:'成人約 ¥3,800'}),
  row('13:15','14:00','45分鐘','🍜 午餐','新穗高','新穂高温泉','簡單午餐。',{map:'新穂高温泉駐車場'}),
  row('14:00','15:20','1小時20分','🚗 車','新穗高 → 高山','新穂高温泉 → 高山市','下午返高山，留充足冬季Buffer。',{map:'Residence Hotel Takayama Station'}),
  row('15:30','16:00','30分鐘','🏨 Check-in／今日主線完結','高山站前 Residence Hotel',JP.res,'正式入住Residence；夜晚Bonus另睇後備區。',{hotelEnd:true,map:'Residence Hotel Takayama Station'})
 ]);
 return base.concat([
  row('09:15','10:15','1小時','🚗 車','高山 → 白川鄉','高山市 → 白川郷','只要道路安全就按計劃前往。',{map:'せせらぎ公園駐車場 白川郷'}),
  row('10:15','11:20','1小時05分','🏘️ 核心景點','世界遺產・白川鄉荻町合掌村',JP.shirakawa,'日間完整參觀合掌造聚落。',{map:'せせらぎ公園駐車場 白川郷'}),
  row('11:20','11:55','35分鐘','🏠 景點','白川鄉・和田家',JP.wada,'入屋睇木樑、圍爐及合掌屋頂內部。',{map:'和田家 白川郷',price:'成人約 ¥400'}),
  row('12:00','12:50','50分鐘','🍜 午餐','白川鄉','白川郷','蕎麥麵／鄉土定食。',{map:'白川郷'}),
  row('13:00','13:50','50分鐘','📷 景點','白川鄉・荻町城跡展望台',JP.view,'俯瞰成個荻町雪村；按當日Shuttle安排。',{map:'荻町城跡展望台'}),
  row('14:00','15:15','1小時15分','🚗 車','白川鄉 → 高山','白川郷 → 高山市','冬季預鬆時間返高山。',{map:'Residence Hotel Takayama Station'}),
  row('15:30','16:00','30分鐘','🏨 Check-in／今日主線完結','高山站前 Residence Hotel',JP.res,'放低行李休息；1月15日晚Bonus另睇後備區。',{hotelEnd:true,map:'Residence Hotel Takayama Station'})
 ]);
}
function d8Rows(mode){
 if(mode==='city')return [
  row('08:00','08:45','45分鐘','🍳 早餐','高山站前 Residence Hotel（今日開始）',JP.res,'早餐自行安排。',{hotelStart:true,map:'Residence Hotel Takayama Station'}),
  row('08:45','09:15','30分鐘','🧳 Check-out','高山站前 Residence Hotel',JP.res,'退房，行李放車；今日一路向東去松本。',{map:'Residence Hotel Takayama Station'}),
  row('09:30','10:05','35分鐘','🥬 景點','高山・宮川朝市',JP.miyagawa,'朝市短行。',{map:'宮川朝市 高山'}),
  row('10:10','10:50','40分鐘','🏯 景點','高山陣屋・江戶幕府官署',JP.jinya,'理解幕府直轄飛驒歷史。',{map:'中橋駐車場 高山',price:'成人約 ¥500'}),
  row('10:50','12:00','1小時10分','🏘️ 景點／酒藏','高山三町古街・中橋・酒藏',JP.sanmachi,'町屋街景、酒藏、手信；司機唔試酒。',{map:'中橋駐車場 高山'}),
  row('12:00','12:40','40分鐘','🍜 午餐','高山市內','高山市','簡單午餐。',{map:'高山駅'}),
  row('12:40','13:20','40分鐘','🚗 車','高山 → 飛驒大鐘乳洞','高山市 → 飛騨大鍾乳洞','鐘乳洞位於去平湯／松本方向，今日做最順。',{map:'飛騨大鍾乳洞'}),
  row('13:20','14:40','1小時20分','🧊 景點','飛驒大鐘乳洞・冰之溪谷',JP.cave,'洞穴＋一月冰景。',{map:'飛騨大鍾乳洞',price:'成人約 ¥1,100'}),
  row('14:40','17:15','2小時35分','🚗 車','飛驒大鐘乳洞 → 松本','飛騨大鍾乳洞 → 松本市','經平湯／安房方向，冬季預約2.5小時。',{map:'Iroha Grand Hotel Matsumoto Ekimae'}),
  row('17:15','17:40','25分鐘','🏨 Check-in／今日完結','松本站前 Iroha Grand Hotel',JP.iroha,'最後一晚入住，放低行李休息。',{hotelEnd:true,map:'Iroha Grand Hotel Matsumoto Ekimae'})
 ];
 if(mode==='shirakawa')return [
  row('08:15','09:15','1小時','🍳 早餐／Check-out','高山站前 Residence Hotel（今日開始）',JP.res,'早餐＋退房，行李放車。',{hotelStart:true,map:'Residence Hotel Takayama Station'}),
  row('09:15','10:15','1小時','🚗 車','高山 → 白川鄉','高山市 → 白川郷','冬季約1小時級別。',{map:'せせらぎ公園駐車場 白川郷'}),
  row('10:15','11:20','1小時05分','🏘️ 核心景點','世界遺產・白川鄉荻町合掌村',JP.shirakawa,'日間完整參觀世界遺產聚落。',{map:'せせらぎ公園駐車場 白川郷'}),
  row('11:20','11:55','35分鐘','🏠 景點','白川鄉・和田家',JP.wada,'補充合掌造內部結構與生活空間。',{map:'和田家 白川郷',price:'成人約 ¥400'}),
  row('12:00','12:50','50分鐘','🍜 午餐','白川鄉','白川郷','鄉土午餐。',{map:'白川郷'}),
  row('13:00','13:50','50分鐘','📷 景點','白川鄉・荻町城跡展望台',JP.view,'最後由高位俯瞰整條雪村。',{map:'荻町城跡展望台'}),
  row('14:00','17:15','3小時15分','🚗 長途車','白川鄉 → 松本','白川郷 → 松本市','冬季長途段預鬆；路況差可提早離開。',{map:'Iroha Grand Hotel Matsumoto Ekimae'}),
  row('17:15','17:40','25分鐘','🏨 Check-in／今日完結','松本站前 Iroha Grand Hotel',JP.iroha,'入住最後一晚酒店。',{hotelEnd:true,map:'Iroha Grand Hotel Matsumoto Ekimae'})
 ];
 return [
  row('08:15','09:00','45分鐘','🍳 早餐／Check-out','高山站前 Residence Hotel（今日開始）',JP.res,'早餐＋退房；朝早再確認新穗高值唔值得去。',{hotelStart:true,map:'Residence Hotel Takayama Station'}),
  row('09:00','10:20','1小時20分','🚗 車','高山 → 新穗高','高山市 → 新穂高温泉','只有纜車正常＋能見度值得先出發。',{map:'新穂高温泉駐車場'}),
  row('10:30','12:45','2小時15分','🚡 核心景點','新穗高纜車・北阿爾卑斯',JP.sh,'最後一次補回核心雪山景點。',{map:'新穂高温泉駐車場',price:'成人約 ¥3,800'}),
  row('12:45','13:30','45分鐘','🍜 午餐','新穗高','新穂高温泉','簡單午餐。',{map:'新穂高温泉駐車場'}),
  row('13:30','15:15','1小時45分','🚗 車','新穗高 → 安曇野／松本','新穂高温泉 → 安曇野・松本','一路向松本；非常早到先考慮大王山葵。',{map:'大王わさび農場'}),
  row('15:15','16:05','50分鐘','⭐ Bonus','安曇野・大王山葵農場',JP.daio,'只限15:00前左右已到安曇野、關門前仍有時間；唔可以因此推遲返松本。',{map:'大王わさび農場',price:'免費入場'}),
  row('16:05','17:00','55分鐘','🚗 車','安曇野 → 松本','安曇野 → 松本市','去Iroha。',{map:'Iroha Grand Hotel Matsumoto Ekimae'}),
  row('17:00','17:30','30分鐘','🏨 Check-in／今日完結','松本站前 Iroha Grand Hotel',JP.iroha,'入住最後一晚酒店。',{hotelEnd:true,map:'Iroha Grand Hotel Matsumoto Ekimae'})
 ];
}
function renderRows(dayId,rows){
  const day=document.getElementById(dayId);if(!day)return;
  const tl=day.querySelector('.timeline');if(!tl)return;
  tl.innerHTML='';
  rows.forEach(r=>{const item=document.createElement('div');item.className='timeline-item';const cls='timeline-card'+(r.hotelStart?' hotel-start-marker':'')+(r.hotelEnd?' hotel-end-marker':'');item.innerHTML='<div class="time">'+r.start+(r.end?'<span class="end-time">'+r.end+'</span>':'')+'</div><div class="'+cls+'"><span class="event-type">'+r.type+'</span>'+(r.dur?'<span class="duration-badge">⏱ '+r.dur+'</span>':'')+'<h3'+(r.map?' data-map="'+esc(r.map)+'"'+(r.mapLabel?' data-map-label="'+esc(r.mapLabel)+'"':''):'')+'>'+r.title+'</h3>'+(r.jp?'<div class="jp-place-name">'+r.jp+'</div>':'')+'<p>'+r.desc+'</p>'+(r.price?'<span class="price">'+r.price+'</span>':'')+'</div>';tl.appendChild(item);});
  if(typeof window.addMapPins==='function')try{window.addMapPins();}catch(e){}
  localizeTimeline(day);decorateInfo(day);decorateHotels(day);
}
function syncSelectedTimelines(){
  const sh=localStorage.getItem(SH_KEY);if(!['d6','d7','d8'].includes(sh))return;
  renderRows('d6',d6Rows(sh==='d6'));
  renderRows('d7',d7Rows(sh==='d7'));
  renderRows('d8',d8Rows(sh==='d8'?'sh':(sh==='d7'?'shirakawa':'city')));
}

/* -----------------------------------------------------
   Boot / bounded startup refresh
----------------------------------------------------- */
let booted=false;
function runDecorators(root){localizeTimeline(root);decorateInfo(root);decorateHotels(root);localizeHotelRows();}
function boot(){
 if(booted)return;booted=true;ensureModal();injectHotelRoute();normalizeFixedDayStarts();decorateFixedDurations();ensureFixedHotelEnds();injectBackups();injectDepartureChecklist();syncSelectedTimelines();runDecorators(document);
 document.addEventListener('click',e=>{if(e.target.closest('.tripv2-choice'))setTimeout(()=>{syncSelectedTimelines();injectHotelRoute();runDecorators(document);},80);});
 [120,350,800,1600,2600].forEach(t=>setTimeout(()=>runDecorators(document),t));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

})();
