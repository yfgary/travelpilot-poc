(function(){
'use strict';

if(window.__japan2027V90FinalFixes)return;
window.__japan2027V90FinalFixes=true;

const SH_KEY='japanWinter2027_shinhotakaDay';
const DATA=window.Japan2027EnhancementData||null;
const DAY_MATSUMOTO='https://commons.wikimedia.org/wiki/Special:FilePath/Matsumoto-Castle-day-view-2019-Luka-Peternel.jpg?width=1600';
const MATSUMOTO_INTERIOR='https://commons.wikimedia.org/wiki/Special:FilePath/Matsumoto%20inside.JPG?width=1200';
const HIRAYU_PHOTO='https://commons.wikimedia.org/wiki/Special:FilePath/%E5%B9%B3%E6%B9%AF%E7%A5%9E%E7%A4%BE%20-%20panoramio.jpg?width=1200';
const TOSHOGU_PHOTO='https://www.hidatakayama.or.jp/lsc/upfile/spot/0000/1184/1184_6_l.jpg';

function text(el){return (el?.textContent||'').replace(/\s+/g,' ').trim();}
function findItem(day,needle){return [...(day?.querySelectorAll('.timeline-item')||[])].find(x=>text(x.querySelector('h3')).includes(needle))||null;}
function placeUrl(q){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q||'');}
function htmlEsc(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function insertAfter(ref,node){if(ref&&node)ref.insertAdjacentElement('afterend',node);}

function injectStyles(){
 if(document.getElementById('v90Styles'))return;
 const s=document.createElement('style');s.id='v90Styles';s.textContent=`
 .v90-route-stop{margin-top:9px;padding:9px 11px;border-radius:8px;background:#eef6fb;border-left:4px solid #5f92b6;color:#3f5565;font-size:12px;line-height:1.6}
 .v90-route-stop strong{color:#1f4e79}.v90-route-stop .big{color:#9b5f00;font-weight:900}.v90-route-stop .none{color:#667681}
 .v90-shrine-info-btn{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;margin-left:7px;padding:0;border:1px solid #b8d3e6;border-radius:50%;background:#eaf4fb;color:#1f4e79;font-size:14px;font-weight:900;cursor:pointer;vertical-align:middle}
 .v90-shrine-info-btn:hover{background:#dcecf7}.v90-shrine-card .timeline-card{border-left:4px solid #c85050;background:#fffaf7}
 .v90-plan-photo-credit{font-size:9px;opacity:.88;margin-left:4px}.v90-backup-note{margin:10px 18px;padding:12px 14px;border-radius:10px;background:#f7f4ff;border:1px solid #ddd4ef;font-size:12px;line-height:1.65;color:#51466b}
 .tripv2-choice.v90-active{background:#1f4e79!important;color:#fff!important;box-shadow:0 0 0 2px #a9c8dd}
 `;document.head.appendChild(s);
}

/* =========================================================
   D2 PHOTO LAYOUT
========================================================= */
function photoCard(src,alt,caption,credit){
 return '<div class="photo-card"><img class="zoomable" src="'+src+'" alt="'+htmlEsc(alt)+'" data-caption="'+htmlEsc(caption)+'" loading="lazy"><div class="photo-caption">'+caption+(credit?' <span class="v90-plan-photo-credit">'+credit+'</span>':'')+'</div></div>';
}
function heroPhoto(src,alt,caption,credit){
 return '<div class="hero-photo"><img class="zoomable" src="'+src+'" alt="'+htmlEsc(alt)+'" data-caption="'+htmlEsc(caption)+'" loading="lazy"><div class="photo-caption">'+caption+(credit?' <span class="v90-plan-photo-credit">'+credit+'</span>':'')+'</div></div>';
}
function patchD2Photos(){
 const day=document.getElementById('d2');if(!day)return;
 const p=day.querySelector('.photo-section');if(!p||p.dataset.v90Photos==='1')return;
 p.innerHTML=heroPhoto(DAY_MATSUMOTO,'松本城日間外觀','🏯 松本城・日間外觀','Luka Peternel / CC BY-SA 4.0')+
   '<div class="photo-gallery">'+
   photoCard('assets/images/d2-karuizawa-outlet.jpg','輕井澤王子購物廣場','🛍️ 輕井澤王子購物廣場','Daderot / CC0')+
   photoCard(MATSUMOTO_INTERIOR,'松本城天守內部','🏯 松本城・現存木造天守內部','James Heilman, MD / CC BY-SA 3.0')+
   '</div>';
 p.dataset.v90Photos='1';
 const route=day.querySelector('.day-route');if(route)route.textContent='08:30 快早餐 → 步行松本城（1.5小時）→ 返酒店攞行李 → Times 取車 → 輕井澤 Outlet（2小時）→ 千曲｜白絲瀑布＋鬼押出園保留 Backup';
}

/* =========================================================
   D6-D8 SELECTOR
========================================================= */
function selectedPlan(){return localStorage.getItem(SH_KEY)||'';}
function updateChoiceState(){
 const v=selectedPlan();document.querySelectorAll('#tripv2WeatherSelect [data-sh]').forEach(b=>b.classList.toggle('v90-active',(b.dataset.sh||'')===v));
}
function installChoiceFix(){
 if(window.__v90ChoiceFix)return;window.__v90ChoiceFix=true;
 document.addEventListener('click',function(e){
   const b=e.target.closest?.('#tripv2WeatherSelect [data-sh]');if(!b)return;
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
   const v=b.dataset.sh||'';if(v)localStorage.setItem(SH_KEY,v);else localStorage.removeItem(SH_KEY);
   updateChoiceState();setTimeout(()=>location.reload(),60);
 },true);
}

/* =========================================================
   D6-D8 PHOTOS
========================================================= */
const PHOTO_SETS={
 d6:{
   d6:[['assets/images/d6-shinhotaka.jpg','🚡 新穗高纜車'],[HIRAYU_PHOTO,'⛩️ 平湯神社'],['assets/images/d6-takayama.jpg','🏯 高山']],
   d7:[['assets/images/d7-shirakawago.jpg','🏘️ 白川鄉'],['assets/images/d7-shirakawago-view.jpg','📷 荻町展望台'],['assets/images/d7-hida-furukawa.jpg','🕯️ 飛驒古川・1/15 Bonus']],
   d8:[['assets/images/d6-takayama.jpg','🏯 高山市區'],['assets/images/d6-hida-cave.jpg','🧊 飛驒大鐘乳洞'],['assets/images/d9-matsumoto-station.jpg','🚉 松本・今晚終點']]
 },
 d7:{
   d6:[['assets/images/d6-takayama.jpg','🏯 高山市區'],['assets/images/d6-hida-cave.jpg','🧊 飛驒大鐘乳洞'],[TOSHOGU_PHOTO,'⛩️ 飛驒東照宮']],
   d7:[['assets/images/d6-shinhotaka.jpg','🚡 新穗高纜車'],[HIRAYU_PHOTO,'⛩️ 平湯神社'],['assets/images/d6-takayama.jpg','🏯 返回高山']],
   d8:[['assets/images/d7-shirakawago.jpg','🏘️ 白川鄉'],['assets/images/d7-shirakawago-view.jpg','📷 荻町展望台'],['assets/images/d9-matsumoto-station.jpg','🚉 松本・今晚終點']]
 },
 d8:{
   d6:[['assets/images/d6-takayama.jpg','🏯 高山市區'],['assets/images/d6-hida-cave.jpg','🧊 飛驒大鐘乳洞'],[TOSHOGU_PHOTO,'⛩️ 飛驒東照宮']],
   d7:[['assets/images/d7-shirakawago.jpg','🏘️ 白川鄉'],['assets/images/d7-shirakawago-view.jpg','📷 荻町展望台'],['assets/images/d7-hida-furukawa.jpg','🕯️ 飛驒古川・1/15 Bonus']],
   d8:[['assets/images/d6-shinhotaka.jpg','🚡 新穗高纜車'],[HIRAYU_PHOTO,'⛩️ 平湯神社'],['assets/images/d9-matsumoto-station.jpg','🚉 松本・今晚終點']]
 }
};
function setDayPhotos(dayId,photos,plan){
 const day=document.getElementById(dayId),p=day?.querySelector('.photo-section');if(!p)return;
 const key=plan+'-'+dayId;if(p.dataset.v90Plan===key)return;
 const [a,b,c]=photos;const credit=x=>x[0]===HIRAYU_PHOTO?'Wikimedia Commons':x[0]===TOSHOGU_PHOTO?'飛驒高山旅Guide':'';
 p.innerHTML=heroPhoto(a[0],a[1],a[1],credit(a))+'<div class="photo-gallery">'+photoCard(b[0],b[1],b[1],credit(b))+photoCard(c[0],c[1],c[1],credit(c))+'</div>';
 p.dataset.v90Plan=key;
}
function patchFlexiblePhotos(){const plan=selectedPlan();if(!PHOTO_SETS[plan])return;['d6','d7','d8'].forEach(id=>setDayPhotos(id,PHOTO_SETS[plan][id],plan));}
function setupZoom(){if(window.__v90Zoom)return;window.__v90Zoom=true;document.addEventListener('click',e=>{const img=e.target.closest?.('.photo-section img.zoomable');if(!img)return;const m=document.getElementById('photoModal'),mi=document.getElementById('modalImage'),c=document.getElementById('modalCaption');if(!m||!mi||!c)return;mi.src=img.src;mi.alt=img.alt;c.textContent=img.dataset.caption||img.alt;m.classList.add('show');document.body.style.overflow='hidden';});}

/* =========================================================
   SHRINE DEEP INFO
========================================================= */
const SHRINES={
 '飛驒東照宮':{
  title:'⛩️ 飛驒東照宮｜德川家康、金森家與飛驒匠人',jp:'飛騨東照宮（ひだとうしょうぐう）',
  why:'飛驒東照宮值得放入你嘅高山行程，唔係因為「順便多睇一間神社」，而係佢正好補足高山陣屋同三町古街睇唔到嗰一面：德川幕府權威、金森家統治，以及飛驒木匠技術點樣交織。你去完高山陣屋會知道幕府點樣行政管理飛驒；再到東照宮，就可以睇到地方領主點樣透過祭祀德川家康表達政治忠誠，同時將最高水平嘅地方木工放入宗教建築。',
  history:'元和5年（1619），高山藩第三代藩主金森重賴將原本供奉喺高山城內嘅德川家康遷座到今日位置，成為飛驒東照宮。金森家係德川體制下嘅大名，所以東照宮唔只係宗教場所，亦有相當清楚嘅政治象徵。金森家離開飛驒之後，建築曾經荒廢；現存主要社殿到文政元年（1818）由名匠水間相模主持重建。即係你今日見到嘅唔係現代仿古，而係有二百年以上歷史、代表江戶後期飛驒工藝水平嘅建築。',
  importance:'官方資料指出，本殿、唐門同全長約62米嘅透塀都屬岐阜縣指定重要文化財；本地堂等亦有高山市文化財身份。對高山而言，佢係少見能夠同時講「德川政治」、「東照宮信仰」同「飛驒匠」嘅地方，所以比單純影古街更能理解高山點解會形成今日嘅文化面貌。',
  look:['先睇唐門同本殿比例：東照宮系建築比一般地方神社更有「廟」嘅華麗感。','沿住約62米透塀行，留意木格、光影同保存狀態；呢段係官方特別指出極具價值嘅構件。','睇雕刻、樑柱同細部木工，將佢同高山祭屋台嘅精細工藝放埋一齊理解。','冬季如果有雪，木建築、石階、樹林同白雪層次非常適合影相，但真正重點仍然係建築本身。'],
  fit:'如果 D6/D7/D8 入面有完整高山市區日，就放喺飛驒大鐘乳洞返高山後；如果 D6 已經用咗去新穗高，則放 D7 白川鄉返高山、Residence Check-in 之後。兩個方案都唔 Cut 松本城、白川鄉、新穗高、鐘乳洞等核心景點。',winter:'戶外參拜為主；石階同樹蔭位置一月有機會結冰，防滑鞋慢行。',time:'約20–30分鐘。',source:'https://www.hidatakayama.or.jp/spot/detail_1184.html'
 },
 '豐川城山稻荷':{
  title:'⛩️ 豐川城山稻荷｜城山雪林入面嘅朱紅鳥居',jp:'豊川城山稲荷（とよかわしろやまいなり）',
  why:'呢個位最啱你嘅原因係「攝影價值高、停留短、同高山市區路線夾」。高山最多人影三町木屋，但豐川城山稻荷係另一種畫面：城山樹林、朱紅鳥居、稻荷信仰符號，如果一月有雪，紅、白、深色樹幹會形成非常強嘅對比。佢唔需要用一兩個鐘，所以可以真正塞入主線而唔犧牲大景點。',
  history:'城山一帶本身就係昔日高山城附近嘅歷史地景，除城跡外亦有寺社。豐川稻荷信仰源自愛知縣妙嚴寺所奉嘅豐川吒枳尼真天，歷史背景同一般人最熟悉嘅伏見稻荷系神社並唔完全一樣。高山呢個城山稻荷喺明治時期由地方人士建立，亦反映近代城下町居民將稻荷信仰帶入日常生活。',
  importance:'佢唔係「日本最重要神社」嗰類大型目的地，而係理解高山城山周邊宗教地景嘅好例子。對今次行程而言，佢價值在於短時間內由商人古街切換到山林寺社空間，同時滿足你想影雪＋紅鳥居嘅要求。',
  look:['鳥居排列嘅縱深感係第一重點，最好由入口向內構圖。','留意狐狸／稻荷元素，同一般神社狛犬不同。','如果有新雪，避免踩入未清理斜坡；用已清路線影紅白對比已經足夠。'],
  fit:'同飛驒東照宮一程串連。完整高山市區日就放鐘乳洞返高山後；若 D6 去新穗高，就改放 D7 白川鄉返高山之後。',winter:'城山坡道一月可能積雪、結冰；路況唔安全就保留東照宮而 Skip 呢個短停，唔值得冒險。',time:'約15–20分鐘。',source:'https://www.hidatakayama.or.jp/'
 },
 '平湯神社':{
  title:'⛩️ 平湯神社｜奧飛驒溫泉鄉嘅地方信仰',jp:'平湯神社（ひらゆじんじゃ）',
  why:'平湯神社最值得加入今次行程嘅理由係幾乎零繞路：無論你 D6、D7 定 D8 去新穗高，來回都會經平湯。用約20分鐘落車參拜，就可以令新穗高一日唔再只係「搭纜車睇雪山」，而係加埋奧飛驒溫泉聚落、山岳環境同地方信仰。',
  history:'平湯係奧飛驒溫泉鄉歷史最悠久嘅溫泉地之一。地方資料記錄，神社過去同神明神社、山神信仰有關，1980年改稱平湯神社。平湯亦流傳白猿帶領人發現溫泉嘅傳說，所以今日地方祭事、護身符同「湯」文化仍然連結得好緊密。呢類神社規模唔大，但反而係真正服務當地聚落，而唔係為旅客而設嘅大型觀光神社。',
  importance:'佢將奧飛驒「山＋溫泉＋居民信仰」三樣嘢串連。你之後見到平湯溫泉、源泉同雪山環境時，就會知道當地人點解唔單止將溫泉當旅遊資源，而係同生活同祭祀放埋一齊。',
  look:['參拜本殿，睇雪覆屋頂同樹林環境。','留意附近平湯民俗館／溫泉聚落氣氛；神社唔需要獨立拉長行程。','記住白猿與溫泉發現傳說，之後去奧飛驒其他溫泉點會更有背景。'],
  fit:'固定放喺「你揀咗去新穗高嗰一日」回程：新穗高 → 平湯神社 → 高山／松本。唔需要額外繞路，所以三個可選日期都可以真正加入。',winter:'平湯係豪雪區，停車位、參道同石面可能有厚雪／冰；只做短停，現場除雪差就唔勉強。',time:'約20分鐘。',source:'https://www.kankou-gifu.jp/spot/detail_3165.html'
 },
 '日枝神社':{
  title:'⛩️ 日枝神社｜高山祭「山王祭」嘅信仰中心',jp:'飛騨山王宮 日枝神社（ひえじんじゃ）',
  why:'日枝神社最大價值唔係「有一間靚神社」，而係春之高山祭山王祭就係佢嘅例祭。你喺高山會見到祭屋台、古街同城下町文化；知道日枝神社之後，先會明白高山祭原本係宗教例祭，而唔係為遊客表演嘅活動。',
  history:'相傳1141年由當時三佛寺城主勸請日吉山王而創建，之後金森長近平定飛驒、建立高山城，再將神社奉遷到現址並視為高山城鎮護神。高山成為幕府天領之後，歷代代官、郡代仍然敬奉。即係由中世、金森氏城下町到幕府直轄時代，佢都一直同高山政治與居民生活有連續關係。',
  importance:'今日佢仍係高山市南半部氏神，亦係聯合國教科文組織無形文化遺產相關嘅春之高山祭核心神社。拝殿前樹齡超過1000年大杉更被指定為岐阜縣天然紀念物。',
  look:['拝殿前千年大杉係第一重點，先睇樹嘅尺度再睇社殿。','杉林參道、石燈籠同冬季雪景，氣氛同三町商業街完全不同。','如果之前睇過高山祭屋台資料，喺呢度將「屋台」重新理解成神社例祭文化。'],
  fit:'按你之前決定，日枝神社繼續做 Backup，唔硬塞主線；高山市區主線明顯提早、仍有日光先加。',winter:'林蔭位置易積雪／結冰，日落前去較好。',time:'約25–35分鐘。',source:'https://www.hidatakayama.or.jp/spot/detail_1180.html'
 }
};

function patchShrineData(){
 if(!DATA?.attractions)return;
 Object.entries(SHRINES).forEach(([name,d])=>{
   const jpBase=d.jp.split('（')[0];
   let a=DATA.attractions.find(x=>(x.aliases||[]).some(z=>z.includes(name)||name.includes(z)||z.includes(jpBase)||jpBase.includes(z)));
   if(!a){a={id:'v90-'+name,aliases:[name,jpBase]};DATA.attractions.push(a);}
   Object.assign(a,{title:d.title,jp:d.jp,why:d.why,background:d.history+'<br><br>'+d.importance,look:d.look,fit:d.fit,winter:d.winter,time:d.time,source:d.source});
 });
}
function shrineForText(t){const n=String(t||'').replace(/\s+/g,' ').trim();return Object.entries(SHRINES).find(([k,v])=>n.includes(k)||n.includes(v.jp.split('（')[0]))?.[1]||null;}
function dataAttractionForText(t){
 const n=String(t||'').replace(/\s+/g,' ').trim();let best=null,bestLen=-1;
 (DATA?.attractions||[]).forEach(a=>(a.aliases||[]).forEach(alias=>{if(alias&&n.includes(alias)&&alias.length>bestLen){best=a;bestLen=alias.length;}}));
 return best;
}
let shrineModal=null;
function ensureShrineModal(){if(shrineModal)return;shrineModal=document.createElement('div');shrineModal.className='enhance-modal';shrineModal.id='v90ShrineModal';shrineModal.innerHTML='<div class="enhance-modal-card" role="dialog" aria-modal="true"><div class="enhance-modal-head"><h2 class="enhance-modal-title"></h2><button type="button" class="enhance-modal-close" aria-label="關閉">×</button></div><div class="enhance-modal-body"></div></div>';document.body.appendChild(shrineModal);shrineModal.querySelector('.enhance-modal-close').onclick=()=>{shrineModal.classList.remove('show');document.body.style.overflow='';};shrineModal.addEventListener('click',e=>{if(e.target===shrineModal){shrineModal.classList.remove('show');document.body.style.overflow='';}});}
function openShrine(d){ensureShrineModal();shrineModal.querySelector('.enhance-modal-title').textContent=d.title;shrineModal.querySelector('.enhance-modal-body').innerHTML='<div class="jp-place-name">🇯🇵 '+d.jp+'</div><div class="enhance-why"><h3>🧭 點解值得去</h3><p>'+d.why+'</p></div><div class="enhance-section"><h3>📚 完整背景／歷史</h3><p>'+d.history+'</p></div><div class="enhance-section"><h3>🏯 點解喺高山／奧飛驒重要</h3><p>'+d.importance+'</p></div><div class="enhance-section"><h3>👀 到場應該睇乜</h3><ul>'+d.look.map(x=>'<li>'+x+'</li>').join('')+'</ul></div><div class="enhance-section"><h3>🗺️ 點解排喺呢日</h3><p>'+d.fit+'</p></div><div class="enhance-section"><h3>❄️ 1月重點</h3><p>'+d.winter+'</p></div><div class="enhance-time"><strong>⏱ 建議停留：</strong>'+d.time+'</div><a class="enhance-source" href="'+d.source+'" target="_blank" rel="noopener">↗ 官方／主要資料來源</a>';shrineModal.classList.add('show');document.body.style.overflow='hidden';}
function attachShrineInfo(){
 document.querySelectorAll('.timeline-card h3,.backup-attraction-title').forEach(h=>{
   const d=shrineForText(text(h));if(!d||h.querySelector('.v90-shrine-info-btn'))return;
   const b=document.createElement('button');b.type='button';b.className='v90-shrine-info-btn';b.textContent='ⓘ';b.title='詳細神社介紹';b.onclick=e=>{e.preventDefault();e.stopPropagation();openShrine(d);};h.appendChild(b);
 });
 document.querySelectorAll('#winter-shrines .parking-main h3').forEach(h=>{
   if(h.querySelector('.enhance-info-btn,.v90-shrine-info-btn'))return;
   const info=dataAttractionForText(text(h));
   if(info){
     const b=document.createElement('button');b.type='button';b.className='enhance-info-btn';b.textContent='ⓘ';b.dataset.deepInfoId=info.id;b.title='詳盡介紹：歷史、重要性、現場睇乜';h.appendChild(b);return;
   }
   const d=shrineForText(text(h));if(!d)return;
   const b=document.createElement('button');b.type='button';b.className='v90-shrine-info-btn';b.textContent='ⓘ';b.title='詳細神社介紹';b.onclick=e=>{e.preventDefault();e.stopPropagation();openShrine(d);};h.appendChild(b);
 });
}

/* =========================================================
   SHRINE SCHEDULING
========================================================= */
function makeTimeline(cls,time,type,title,jp,desc,map,dur){const d=document.createElement('div');d.className='timeline-item v90-shrine-card '+cls;d.innerHTML='<div class="time">'+time+'</div><div class="timeline-card"><span class="event-type">'+type+'</span><span class="duration-badge">⏱ '+dur+'</span><h3 data-map="'+htmlEsc(map)+'">'+title+'</h3><div class="jp-place-name">🇯🇵 '+jp+'</div><p>'+desc+'</p></div>';return d;}
function scheduleCityShrines(dayId,mode){
 const day=document.getElementById(dayId);if(!day||day.querySelector('.v90-city-shrines'))return;
 let ref=null;
 if(mode==='after-cave'){
   const caves=[...day.querySelectorAll('.timeline-item')].filter(x=>text(x.querySelector('h3')).includes('飛驒大鐘乳洞'));
   ref=caves.reverse().find(x=>!/(🚗|車)/.test(text(x.querySelector('.event-type'))))||caves[0];
 }else{
   ref=findItem(day,'Residence Hotel Takayama Station')||findItem(day,'Residence');
 }
 if(!ref)return;
 const times=mode==='after-cave'?[['15:50–16:20','30分鐘'],['16:20–16:40','20分鐘'],['16:40–16:50','10分鐘'],['16:50–17:10','20分鐘']]:[['15:50–16:00','10分鐘'],['16:00–16:20','20分鐘'],['16:20–16:30','10分鐘'],['16:30–16:50','20分鐘']];
 const a=makeTimeline('v90-city-shrines',times[0][0],'🚗 車','前往飛驒東照宮','飛騨東照宮','由上一站順路返高山市區；核心景點完成後先加神社。','飛騨東照宮',times[0][1]);
 const b=makeTimeline('v90-city-shrines',times[1][0],'⛩️ 神社','飛驒東照宮・德川家康與飛驒匠人','飛騨東照宮（ひだとうしょうぐう）','正式主線短停：睇本殿、唐門、62米透塀，同高山陣屋嘅幕府背景串埋理解。','飛騨東照宮',times[1][1]);
 const c=makeTimeline('v90-city-shrines',times[2][0],'🚗 市內短程','飛驒東照宮 → 豐川城山稻荷','飛騨東照宮 → 豊川城山稲荷','短程移動去城山一帶。','豊川城山稲荷',times[2][1]);
 const d=makeTimeline('v90-city-shrines',times[3][0],'⛩️ 神社','豐川城山稻荷・朱紅鳥居','豊川城山稲荷（とよかわしろやまいなり）','正式主線短停：雪地朱紅鳥居係攝影重點；路面結冰嚴重就以安全為先。','豊川城山稲荷',times[3][1]);
 let tail=ref;[a,b,c,d].forEach(n=>{insertAfter(tail,n);tail=n;});
 if(mode==='after-cave'){
   const shop=findItem(day,'高山地元超市');if(shop){const t=shop.querySelector('.time');if(t)t.textContent='17:15–17:45';}
 }
}
function scheduleHirayu(dayId){
 const day=document.getElementById(dayId);if(!day||day.querySelector('.v90-hirayu-shrine'))return;
 const candidates=[...day.querySelectorAll('.timeline-item')].filter(x=>text(x.querySelector('h3')).includes('新穗高'));
 let ref=candidates.find(x=>/午餐/.test(text(x.querySelector('.event-type'))));
 if(!ref)ref=candidates.reverse().find(x=>!/(🚗|車)/.test(text(x.querySelector('.event-type'))));
 if(!ref)return;
 let passed=false;[...day.querySelectorAll('.timeline-item')].forEach(x=>{if(x===ref){passed=true;return;}if(!passed)return;const h=text(x.querySelector('h3'));if(/新穗高\s*→\s*(高山|松本|安曇野)/.test(h))x.remove();});
 const time=dayId==='d7'?[['14:00–14:35','35分鐘'],['14:35–14:55','20分鐘'],['14:55–15:45','50分鐘']]:dayId==='d8'?[['13:30–14:00','30分鐘'],['14:00–14:20','20分鐘'],['14:20–16:00','約1小時40分']]:[['13:30–14:05','35分鐘'],['14:05–14:25','20分鐘'],['14:25–15:15','50分鐘']];
 const dest=dayId==='d8'?'松本':'高山';
 const a=makeTimeline('v90-hirayu-shrine',time[0][0],'🚗 車','新穗高 → 平湯神社','新穂高温泉 → 平湯神社','沿R471／R158方向返平湯，神社就在自然回程線，唔需要繞大圈。','平湯神社',time[0][1]);
 const b=makeTimeline('v90-hirayu-shrine',time[1][0],'⛩️ 神社','平湯神社・奧飛驒溫泉鄉信仰','平湯神社（ひらゆじんじゃ）','正式加入新穗高日；短停約20分鐘，了解白猿傳說、溫泉聚落同地方信仰。','平湯神社',time[1][1]);
 const c=makeTimeline('v90-hirayu-shrine',time[2][0],'🚗 車','平湯 → '+dest,'平湯 → '+(dest==='松本'?'松本市':'高山市'),'參拜後繼續原本主線。冬季以道路安全同即時導航為準。',dest,time[2][1]);
 let tail=ref;[a,b,c].forEach(n=>{insertAfter(tail,n);tail=n;});
 if(dayId==='d7'){
   const hotel=findItem(day,'Residence Hotel Takayama Station');if(hotel){const t=hotel.querySelector('.time');if(t)t.textContent='15:50';}
 }
 if(dayId==='d8'){
   const bonus=findItem(day,'大王山葵農場');if(bonus){const t=bonus.querySelector('.time');if(t)t.textContent='超早到先加';const p=bonus.querySelector('p');if(p)p.textContent='加咗平湯神社後，正常時間已唔追呢個 Bonus；只有實際行程比預定早好多，而且仍趕到冬季關門前先考慮。';}
 }
}
function ensureHieBackup(){
 const day=document.getElementById('d6');if(!day||day.querySelector('.v90-hie-backup'))return;
 const note=document.createElement('div');note.className='v90-backup-note v90-hie-backup';note.innerHTML='<strong>🔄 神社 Backup｜日枝神社（飛騨山王宮 日枝神社）</strong><br>按你之前決定繼續做 Backup，唔硬塞主線。高山市區主線明顯提早、仍有日光先去；係春之高山祭「山王祭」嘅核心神社，亦有千年大杉。 <button type="button" class="v90-shrine-info-btn" data-v90-hie>ⓘ</button>';
 day.appendChild(note);note.querySelector('[data-v90-hie]').onclick=()=>openShrine(SHRINES['日枝神社']);
}
function scheduleShrines(){
 const plan=selectedPlan();if(!plan)return;
 document.querySelectorAll('.v89-shrine,.v87-hida-toshogu,.v87-hida-drive1,.v87-hida-drive2,.v87-hida-drive3,.v87-toyokawa,.v87-hirayu,.v87-hirayu-drive1').forEach(x=>x.remove());
 if(plan==='d6'){scheduleHirayu('d6');scheduleCityShrines('d7','after-hotel');}
 if(plan==='d7'){scheduleCityShrines('d6','after-cave');scheduleHirayu('d7');}
 if(plan==='d8'){scheduleCityShrines('d6','after-cave');scheduleHirayu('d8');}
 ensureHieBackup();
}

/* =========================================================
   SA / PA / ROADSIDE REST NOTES
========================================================= */
const REST_RULES=[
 {match:['松本 → 輕井澤','松本 → 輕井澤王子'],html:'<strong>🛣️ 預定高速線 SA／PA：</strong> 梓川SA → 筑北PA → 姨捨SA → 千曲川さかきPA → <span class="big">⭐【大SA】東部湯の丸SA</span>。想落車行下，首選東部湯の丸SA；有餐飲、手信、加油等。冬季實際路線以導航／封路為準。'},
 {match:['輕井澤 → 千曲','Outlet → 千曲'],html:'<strong>🛣️ 預定 E18 SA／PA：</strong> 佐久平PA → <span class="big">⭐【大SA】東部湯の丸SA</span> → 千曲川さかきPA。呢段如果想正式休息／行下，東部湯の丸SA最合適。'},
 {match:['千曲 → 小布施','千曲館 → 小布施'],html:'<strong>🛣️ 預定 SA／PA：</strong> <span class="big">⭐【大PA】松代PA</span> → 小布施PA。松代PA小型車位規模較大、有餐飲／購物；小布施PA較細，但同今日小布施主題最貼。'},
 {match:['長野 → 白馬'],html:'<strong>🛣️ 休息點：</strong> <span class="none">呢段主線主要係一般國道，冇高速SA／PA。</span> 如果想落車伸展，可視路線考慮「道の駅 中条」。'},
 {match:['白馬 → 高山'],html:'<strong>🛣️ 如採 R148 → 糸魚川 → E8 → 富山 → R41：</strong> 越中境PA → 入善PA → <span class="big">⭐【大SA】有磯海SA</span> → 流杉PA。長途冬季車程建議將有磯海SA當正式休息站，食嘢／行下／去洗手間。'},
 {match:['高山 → 新穗高','高山 → 新穗高纜車'],html:'<strong>🛣️ 休息點：</strong> <span class="none">山區國道，冇高速SA／PA。</span> 沿線可留意「道の駅 奥飛騨温泉郷上宝」；但新穗高天氣窗口優先，唔好為休息站拖慢上山。'},
 {match:['高山 → 白川鄉','高山 → 白川郷'],html:'<strong>🛣️ E41 SA／PA：</strong> 飛驒河合PA → 飛驒白川PA；兩個都係小型PA，呢段冇大型SA。'},
 {match:['白川鄉 → 高山','白川郷 → 高山'],html:'<strong>🛣️ E41 SA／PA：</strong> 飛驒白川PA → 飛驒河合PA；兩個都係小型PA，唔需要特登為佢哋留長時間。'},
 {match:['平湯 → 松本','新穗高 → 松本','飛驒大鐘乳洞 → 松本','高山 → 松本'],html:'<strong>🛣️ R158 山路：</strong> <span class="none">冇高速SA／PA。</span> 過安房隧道後可用「道の駅 風穴の里」做主要休息／洗手間位；冬季天黑前到松本優先。'},
 {match:['白川鄉 → 松本','白川郷 → 松本'],html:'<strong>🛣️ 休息點：</strong> 前段E41有飛驒白川PA／飛驒河合PA；轉R158後冇高速SA／PA，過安房隧道後可用「道の駅 風穴の里」。'}
];
function addRestNotes(){
 document.querySelectorAll('.timeline-item').forEach(item=>{if(item.querySelector('.v90-route-stop'))return;const type=text(item.querySelector('.event-type')),title=text(item.querySelector('h3'));if(!/(🚗|車)/.test(type))return;const r=REST_RULES.find(x=>x.match.some(m=>title.includes(m)));if(!r)return;const div=document.createElement('div');div.className='v90-route-stop';div.innerHTML=r.html;item.querySelector('.timeline-card')?.appendChild(div);});
}
function rewriteMapLinks(){document.querySelectorAll('a.map-pin,a.backup-map,a[href*="google.com/maps/dir"],a[href*="maps.google.com"]').forEach(a=>{let q=a.closest?.('[data-map]')?.dataset?.map||a.dataset?.mapQuery||'';try{const u=new URL(a.href,location.href);q=q||u.searchParams.get('destination')||u.searchParams.get('daddr')||u.searchParams.get('query')||'';}catch(e){}if(q){a.href=placeUrl(q);a.target='_blank';a.rel='noopener';a.title='Google Maps：開啟地點';}});}

function applyAll(){
 injectStyles();
 patchShrineData();
 patchD2Photos();
 patchFlexiblePhotos();
 scheduleShrines();
 addRestNotes();
 attachShrineInfo();
 rewriteMapLinks();
 updateChoiceState();
 setupZoom();
}
function emitFinalPatch(pass,delay,final){
 document.dispatchEvent(new CustomEvent('japan2027:finalpatch',{detail:{pass,delay,final}}));
}
function runFinalPatch(pass,delay,final){
 applyAll();
 emitFinalPatch(pass,delay,final);
}
function start(){
 installChoiceFix();
 runFinalPatch(0,0,false);
 /* Older enhancement scripts finish a few delayed DOM updates after DOMContentLoaded.
    Use a few bounded retries instead of a permanent MutationObserver.  The old observer
    could retrigger itself through the shrine info buttons and cause high CPU/RAM usage. */
 [250,700,1500].forEach((t,i)=>setTimeout(()=>runFinalPatch(i+1,t,t===1500),t));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
