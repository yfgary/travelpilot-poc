(function(){
'use strict';

if(window.__japan2027V91Routing)return;
window.__japan2027V91Routing=true;

const KEY='japanWinter2027_shinhotakaDay';
const DATA=window.Japan2027EnhancementData||null;
const JP={
  ouan:'飛騨花里の湯 高山桜庵',
  res:'レジデンスホテル高山駅前',
  iroha:'いろはグランホテル松本駅前',
  sh:'新穂高ロープウェイ',
  miyagawa:'宮川朝市',
  jinya:'高山陣屋',
  sanmachi:'古い町並・中橋・酒蔵',
  cave:'飛騨大鍾乳洞・氷の渓谷',
  shirakawa:'白川郷・荻町合掌造り集落',
  wada:'和田家',
  view:'荻町城跡展望台',
  daio:'大王わさび農場'
};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function row(start,end,dur,type,title,jp,desc,opt){return Object.assign({start,end,dur,type,title,jp,desc},opt||{});}
function selected(){const v=localStorage.getItem(KEY)||'';return ['d6','d7','d8'].includes(v)?v:'';}

function findAttraction(text){
  if(!DATA||!Array.isArray(DATA.attractions))return null;
  const n=String(text||'').replace(/ⓘ|📍/g,'').replace(/\s+/g,' ').trim();
  let best=null,len=0;
  DATA.attractions.forEach(a=>{
    (a.aliases||[]).forEach(alias=>{
      if(alias&&n.includes(alias)&&alias.length>len){best=a;len=alias.length;}
    });
    const title=String(a.title||'').replace(/^\s*[\p{Extended_Pictographic}\uFE0F]+\s*/u,'').trim();
    if(title&&n.includes(title)&&title.length>len){best=a;len=title.length;}
  });
  return best;
}

function addInfoButtons(day){
  if(!day)return;
  day.querySelectorAll('.timeline-card h3').forEach(h=>{
    if(h.querySelector('.attraction-info-btn,.enhance-info-btn,.backup-info-btn,.v90-shrine-info-btn'))return;
    const a=findAttraction(h.textContent);if(!a)return;
    const b=document.createElement('button');
    b.type='button';b.className='enhance-info-btn';b.textContent='ⓘ';
    b.dataset.deepInfoId=a.id;b.title='詳盡介紹：歷史、重要性、現場睇乜';
    b.setAttribute('aria-label','詳盡景點介紹：'+(a.title||a.id));
    h.appendChild(b);
  });
}

function renderRows(dayId,rows){
  const day=document.getElementById(dayId);if(!day)return;
  const tl=day.querySelector('.timeline');if(!tl)return;
  tl.innerHTML='';
  rows.forEach(r=>{
    const item=document.createElement('div');
    item.className='timeline-item'+(r.cls?' '+r.cls:'');
    const cardCls='timeline-card'+(r.hotelStart?' hotel-start-marker':'')+(r.hotelEnd?' hotel-end-marker':'')+(r.hard?' hard-cut':'');
    item.innerHTML='<div class="time">'+esc(r.start)+(r.end?'<span class="end-time">'+esc(r.end)+'</span>':'')+'</div><div class="'+cardCls+'"><span class="event-type">'+esc(r.type)+'</span>'+(r.dur?'<span class="duration-badge">⏱ '+esc(r.dur)+'</span>':'')+'<h3'+(r.map?' data-map="'+esc(r.map)+'"':'')+'>'+esc(r.title)+'</h3>'+(r.jp?'<div class="jp-place-name">'+esc(r.jp)+'</div>':'')+'<p>'+esc(r.desc)+'</p>'+(r.price?'<span class="price">'+esc(r.price)+'</span>':'')+'</div>';
    tl.appendChild(item);
  });
  addInfoButtons(day);
  if(typeof window.addMapPins==='function')try{window.addMapPins();}catch(e){}
}

function shirakawaD6Rows(){
  return [
    row('07:45','08:15','30分鐘','🌨️ 天氣判斷','飛驒花里之湯・高山櫻庵（今日開始）',JP.ouan,'朝早仍先睇新穗高 Live Cam／風況。如果 D6 突然係三日唯一極好天，可以即刻用上面選擇器改做「D6 去新穗高」。',{hotelStart:true,map:'Takayama Ouan'}),
    row('08:15','08:50','35分鐘','🍳 早餐','飛驒花里之湯・高山櫻庵',JP.ouan,'早餐、出發準備。',{map:'Takayama Ouan'}),
    row('08:50','09:55','1小時05分','🚗 車','高山 → 白川鄉','高山市 → 白川郷','D6 星期四優先去白川鄉；方向向西，今日去完再返高山，避免最後一日先向西兜路。',{map:'せせらぎ公園駐車場 白川郷'}),
    row('10:00','11:20','1小時20分','🏘️ 核心景點','世界遺產・白川鄉荻町合掌村',JP.shirakawa,'日間完整參觀合掌造聚落；平日一般比星期六更有利避人潮。',{map:'せせらぎ公園駐車場 白川郷'}),
    row('11:20','11:55','35分鐘','🏠 景點','白川鄉・和田家',JP.wada,'入屋睇木樑、圍爐、屋頂骨架同過去生活空間。',{map:'和田家 白川郷',price:'成人約 ¥400'}),
    row('12:00','12:50','50分鐘','🍜 午餐','白川鄉','白川郷','蕎麥麵／鄉土定食；唔為食飯拖慢下午展望台。',{map:'白川郷'}),
    row('13:00','13:50','50分鐘','📷 景點','白川鄉・荻町城跡展望台',JP.view,'俯瞰成個荻町雪村；按當日 Shuttle／步道路況決定上落方式。',{map:'荻町城跡展望台'}),
    row('14:00','15:15','1小時15分','🚗 車','白川鄉 → 高山','白川郷 → 高山市','冬季預鬆返高山；D8 已經唔會再安排白川鄉。',{map:'Takayama Ouan'}),
    row('15:30','15:55','25分鐘','⛩️ 神社','飛驒東照宮・德川家康與飛驒匠人','飛騨東照宮（ひだとうしょうぐう）','返到高山後短停；睇本殿、唐門、透塀，唔需要改核心景點。',{map:'飛騨東照宮',cls:'v90-city-shrines'}),
    row('16:05','16:30','25分鐘','⛩️ 神社','豐川城山稻荷・朱紅鳥居','豊川城山稲荷（とよかわしろやまいなり）','雪地朱紅鳥居攝影短停；城山路面結冰嚴重就直接 Skip。',{map:'豊川城山稲荷',cls:'v90-city-shrines'}),
    row('16:40','18:30','1小時50分','♨️ 溫泉／休息','飛驒花里之湯・高山櫻庵',JP.ouan,'返酒店浸溫泉、休息。',{hotelEnd:true,map:'Takayama Ouan'}),
    row('19:15','20:45','1小時30分','🍖 晚餐','飛驒牛晚餐','高山市','高山市內正式飛驒牛晚餐。',{map:'高山駅'})
  ];
}

function shinhotakaD6Rows(){
  return [
    row('07:45','08:15','30分鐘','🌨️ 天氣判斷','飛驒花里之湯・高山櫻庵（今日開始）',JP.ouan,'確認新穗高官方 Operation Status、Live Camera、山頂能見度及風況；真係好天先執行。',{hotelStart:true,map:'Takayama Ouan'}),
    row('08:15','08:50','35分鐘','🍳 早餐','飛驒花里之湯・高山櫻庵',JP.ouan,'早餐／出發準備。',{map:'Takayama Ouan'}),
    row('08:50','10:10','1小時20分','🚗 車','高山 → 新穗高','高山市 → 新穂高温泉','冬季山路預鬆，唔為趕纜車超速。',{map:'新穂高温泉駐車場'}),
    row('10:15','12:45','2小時30分','🚡 核心景點','新穗高纜車・北阿爾卑斯',JP.sh,'兩段纜車去西穗高口；能見度係體驗關鍵。',{map:'新穂高温泉駐車場',price:'成人約 ¥3,800'}),
    row('12:45','13:30','45分鐘','🍜 午餐','新穗高','新穂高温泉','簡單午餐，按纜車排隊及實際停留調整。',{map:'新穂高温泉駐車場'}),
    row('13:30','14:50','1小時20分','🚗 車','新穗高 → 高山','新穂高温泉 → 高山市','平湯神社會由行程功能自動加喺回程線；冬季保留道路 Buffer。',{map:'Takayama Ouan'}),
    row('15:10','16:15','1小時05分','🛍️ 彈性','高山古街／地元超市','高山市','買手信或地元食品；高山市區完整參觀留另一日。',{map:'高山駅'}),
    row('17:00','19:00','2小時','♨️ 溫泉／休息','飛驒花里之湯・高山櫻庵',JP.ouan,'返酒店浸天然溫泉、休息。',{hotelEnd:true,map:'Takayama Ouan'}),
    row('19:15','20:45','1小時30分','🍖 晚餐','飛驒牛晚餐','高山市','高山市內正式飛驒牛晚餐。',{map:'高山駅'})
  ];
}

function shirakawaD7Rows(){
  return [
    row('08:00','08:45','45分鐘','🍳 早餐／執行李','飛驒花里之湯・高山櫻庵（今日開始）',JP.ouan,'早餐、執行李；今日退房後搬去 Residence。',{hotelStart:true,map:'Takayama Ouan'}),
    row('08:45','09:15','30分鐘','🧳 Check-out／搬行李','高山櫻庵 → 高山站前 Residence','高山桜庵 → レジデンスホテル高山駅前','將行李移去 Residence；未能寄存就放車內。',{map:'Residence Hotel Takayama Station'}),
    row('09:15','10:15','1小時','🚗 車','高山 → 白川鄉','高山市 → 白川郷','只有 D6 已經用咗去新穗高，白川鄉先順延到 D7；仍然唔會拖到 D8。',{map:'せせらぎ公園駐車場 白川郷'}),
    row('10:15','11:20','1小時05分','🏘️ 核心景點','世界遺產・白川鄉荻町合掌村',JP.shirakawa,'日間完整參觀合掌造聚落。',{map:'せせらぎ公園駐車場 白川郷'}),
    row('11:20','11:55','35分鐘','🏠 景點','白川鄉・和田家',JP.wada,'入屋睇木樑、圍爐及合掌屋頂內部。',{map:'和田家 白川郷',price:'成人約 ¥400'}),
    row('12:00','12:50','50分鐘','🍜 午餐','白川鄉','白川郷','蕎麥麵／鄉土定食。',{map:'白川郷'}),
    row('13:00','13:50','50分鐘','📷 景點','白川鄉・荻町城跡展望台',JP.view,'俯瞰成個荻町雪村；按當日 Shuttle 安排。',{map:'荻町城跡展望台'}),
    row('14:00','15:15','1小時15分','🚗 車','白川鄉 → 高山','白川郷 → 高山市','冬季預鬆時間返高山。',{map:'Residence Hotel Takayama Station'}),
    row('15:30','16:00','30分鐘','🏨 Check-in','高山站前 Residence Hotel',JP.res,'放低行李；之後神社短停由現有行程功能接續。',{hotelEnd:true,map:'Residence Hotel Takayama Station'}),
    row('晚上','','','⭐ 1/15 Bonus／可取消','飛驒古川・三寺まいり','三寺まいり','只限道路、體力同時間都合適先去；主線完成先考慮，唔為 Bonus 趕雪路。',{map:'飛騨古川駅'})
  ];
}

function shinhotakaD7Rows(){
  return [
    row('08:00','08:45','45分鐘','🍳 早餐／執行李','飛驒花里之湯・高山櫻庵（今日開始）',JP.ouan,'早餐、執行李；今日退房後搬去 Residence。',{hotelStart:true,map:'Takayama Ouan'}),
    row('08:45','09:15','30分鐘','🧳 Check-out／搬行李','高山櫻庵 → 高山站前 Residence','高山桜庵 → レジデンスホテル高山駅前','將行李移去 Residence；未能寄存就放車內。',{map:'Residence Hotel Takayama Station'}),
    row('09:15','10:35','1小時20分','🚗 車','高山 → 新穗高','高山市 → 新穂高温泉','D7 天氣最好先選呢日；冬季唔為趕纜車超速。',{map:'新穂高温泉駐車場'}),
    row('10:35','13:15','2小時40分','🚡 核心景點','新穗高纜車・北阿爾卑斯',JP.sh,'雙層纜車上高海拔展望位置，睇北阿爾卑斯雪峰。',{map:'新穂高温泉駐車場',price:'成人約 ¥3,800'}),
    row('13:15','14:00','45分鐘','🍜 午餐','新穗高','新穂高温泉','簡單午餐。',{map:'新穂高温泉駐車場'}),
    row('14:00','15:20','1小時20分','🚗 車','新穗高 → 高山','新穂高温泉 → 高山市','平湯神社會由行程功能加喺回程；下午返高山保留冬季 Buffer。',{map:'Residence Hotel Takayama Station'}),
    row('15:30','16:00','30分鐘','🏨 Check-in／今日主線完結','高山站前 Residence Hotel',JP.res,'正式入住 Residence。',{hotelEnd:true,map:'Residence Hotel Takayama Station'}),
    row('晚上','','','⭐ 1/15 Bonus／可取消','飛驒古川・三寺まいり','三寺まいり','如果新穗高回程順、道路安全同體力足夠先考慮；唔係必去。',{map:'飛騨古川駅'})
  ];
}

function cityCaveD7Rows(){
  return [
    row('08:00','08:45','45分鐘','🍳 早餐／執行李','飛驒花里之湯・高山櫻庵（今日開始）',JP.ouan,'早餐、執行李；今日先處理高山市區＋鐘乳洞。',{hotelStart:true,map:'Takayama Ouan'}),
    row('08:45','09:15','30分鐘','🧳 Check-out／搬行李','高山櫻庵 → 高山站前 Residence','高山桜庵 → レジデンスホテル高山駅前','將行李移去 Residence；未能寄存就放車內。',{map:'Residence Hotel Takayama Station'}),
    row('09:30','10:05','35分鐘','🥬 景點','高山・宮川朝市',JP.miyagawa,'朝市短行，睇地元食品、漬物、味噌同小食。',{map:'宮川朝市 高山'}),
    row('10:10','10:55','45分鐘','🏯 景點','高山陣屋・江戶幕府官署',JP.jinya,'理解幕府直轄飛驒歷史。',{map:'中橋駐車場 高山',price:'成人約 ¥500'}),
    row('11:00','12:10','1小時10分','🏘️ 景點／酒藏','高山三町古街・中橋・酒藏',JP.sanmachi,'町屋街景、酒藏、手信；司機唔試酒。',{map:'中橋駐車場 高山'}),
    row('12:10','12:50','40分鐘','🍜 午餐','高山市內','高山市','簡單午餐。',{map:'高山駅'}),
    row('12:50','13:30','40分鐘','🚗 車','高山 → 飛驒大鐘乳洞','高山市 → 飛騨大鍾乳洞','鐘乳洞喺東面方向；今日去完返高山，D8 就可以專心新穗高→松本。',{map:'飛騨大鍾乳洞'}),
    row('13:30','15:00','1小時30分','🧊 景點','飛驒大鐘乳洞・冰之溪谷',JP.cave,'室內洞穴較少受落雪影響；一月冰景係特色。',{map:'飛騨大鍾乳洞',price:'成人約 ¥1,100'}),
    row('15:00','15:40','40分鐘','🚗 車','飛驒大鐘乳洞 → 高山','飛騨大鍾乳洞 → 高山市','返高山市區做兩個短神社停留。',{map:'高山駅'}),
    row('15:45','16:05','20分鐘','⛩️ 神社','飛驒東照宮・德川家康與飛驒匠人','飛騨東照宮（ひだとうしょうぐう）','短停睇本殿、唐門同透塀。',{map:'飛騨東照宮',cls:'v90-city-shrines'}),
    row('16:15','16:35','20分鐘','⛩️ 神社','豐川城山稻荷・朱紅鳥居','豊川城山稲荷（とよかわしろやまいなり）','雪地朱紅鳥居；路面結冰嚴重就 Skip。',{map:'豊川城山稲荷',cls:'v90-city-shrines'}),
    row('16:45','17:15','30分鐘','🏨 Check-in','高山站前 Residence Hotel',JP.res,'正式入住 Residence。',{hotelEnd:true,map:'Residence Hotel Takayama Station'}),
    row('晚上','','','⭐ 1/15 Bonus／可取消','飛驒古川・三寺まいり','三寺まいり','今日已經較充實；只有道路、體力同時間都好先去，否則直接休息。',{map:'飛騨古川駅'})
  ];
}

function cityCaveD8Rows(){
  return [
    row('08:00','08:45','45分鐘','🍳 早餐','高山站前 Residence Hotel（今日開始）',JP.res,'早餐自行安排。',{hotelStart:true,map:'Residence Hotel Takayama Station'}),
    row('08:45','09:15','30分鐘','🧳 Check-out','高山站前 Residence Hotel',JP.res,'退房，行李放車；今日開始一路向東去松本。',{map:'Residence Hotel Takayama Station'}),
    row('09:30','10:05','35分鐘','🥬 景點','高山・宮川朝市',JP.miyagawa,'朝市短行。',{map:'宮川朝市 高山'}),
    row('10:10','10:50','40分鐘','🏯 景點','高山陣屋・江戶幕府官署',JP.jinya,'理解幕府直轄飛驒歷史。',{map:'中橋駐車場 高山',price:'成人約 ¥500'}),
    row('10:50','12:00','1小時10分','🏘️ 景點／酒藏','高山三町古街・中橋・酒藏',JP.sanmachi,'町屋街景、酒藏、手信；司機唔試酒。',{map:'中橋駐車場 高山'}),
    row('12:00','12:40','40分鐘','🍜 午餐','高山市內','高山市','簡單午餐。',{map:'高山駅'}),
    row('12:40','13:20','40分鐘','🚗 車','高山 → 飛驒大鐘乳洞','高山市 → 飛騨大鍾乳洞','鐘乳洞正正在去平湯／松本方向，最後一日咁排最順。',{map:'飛騨大鍾乳洞'}),
    row('13:20','14:40','1小時20分','🧊 景點','飛驒大鐘乳洞・冰之溪谷',JP.cave,'洞穴＋一月冰景。',{map:'飛騨大鍾乳洞',price:'成人約 ¥1,100'}),
    row('14:40','17:15','2小時35分','🚗 車','飛驒大鐘乳洞 → 松本','飛騨大鍾乳洞 → 松本市','經平湯／安房方向一路向東；比白川鄉返松本自然得多。',{map:'Iroha Grand Hotel Matsumoto Ekimae'}),
    row('17:15','17:40','25分鐘','🏨 Check-in／今日完結','松本站前 Iroha Grand Hotel',JP.iroha,'最後一晚入住，放低行李休息。',{hotelEnd:true,map:'Iroha Grand Hotel Matsumoto Ekimae'})
  ];
}

function shinhotakaD8Rows(){
  return [
    row('08:15','09:00','45分鐘','🍳 早餐／Check-out','高山站前 Residence Hotel（今日開始）',JP.res,'早餐＋退房；朝早最後確認新穗高係咪真係值得去。',{hotelStart:true,map:'Residence Hotel Takayama Station'}),
    row('09:00','10:20','1小時20分','🚗 車','高山 → 新穗高','高山市 → 新穂高温泉','只有纜車正常＋能見度非常好先用 D8；否則可以提前改 D6／D7。',{map:'新穂高温泉駐車場'}),
    row('10:30','12:45','2小時15分','🚡 核心景點','新穗高纜車・北阿爾卑斯',JP.sh,'D8 仍然保留為天氣選項；好天就用最高回報雪山景。',{map:'新穂高温泉駐車場',price:'成人約 ¥3,800'}),
    row('12:45','13:30','45分鐘','🍜 午餐','新穗高','新穂高温泉','簡單午餐。',{map:'新穂高温泉駐車場'}),
    row('13:30','15:15','1小時45分','🚗 車','新穗高 → 安曇野／松本','新穂高温泉 → 安曇野・松本','平湯神社會由行程功能插入回程線；之後一路向東返松本。',{map:'Iroha Grand Hotel Matsumoto Ekimae'}),
    row('15:15','16:05','50分鐘','⭐ Bonus','安曇野・大王山葵農場',JP.daio,'只有實際早到好多、冬季關門前仍有時間先加；正常加咗平湯神社後可直接 Skip。',{map:'大王わさび農場',price:'免費入場'}),
    row('16:05','17:00','55分鐘','🚗 車','安曇野 → 松本','安曇野 → 松本市','去 Iroha；冬季唔為 Bonus 壓縮道路 Buffer。',{map:'Iroha Grand Hotel Matsumoto Ekimae'}),
    row('17:00','17:30','30分鐘','🏨 Check-in／今日完結','松本站前 Iroha Grand Hotel',JP.iroha,'入住最後一晚酒店。',{hotelEnd:true,map:'Iroha Grand Hotel Matsumoto Ekimae'})
  ];
}

function setSummary(dayId,title,route,highlights){
  const day=document.getElementById(dayId);if(!day)return;
  const t=day.querySelector('.day-title');if(t)t.textContent=title;
  const r=day.querySelector('.day-route');if(r)r.textContent=route;
  const grid=day.querySelector('.day-highlights .highlights-grid');
  if(grid&&highlights)grid.innerHTML=highlights.map(x=>'<div class="highlight-item'+(x.danger?' highlight-danger':'')+'">'+x.html+'</div>').join('');
}

function applyRouting(){
  const plan=selected();if(!plan)return false;
  const selectBox=document.getElementById('tripv2WeatherSelect');
  if(selectBox){
    const p=selectBox.querySelector('p');
    if(p)p.innerHTML='<strong>新規則：</strong>新穗高仍可自由揀 D6／D7／D8；<strong>白川鄉預設 D6</strong>，只有 D6 揀咗新穗高先順延 D7，<strong>D8 唔再去白川鄉</strong>。最後一日只做東面新穗高／飛驒大鐘乳洞方向，方便早返松本。';
  }
  document.querySelectorAll('.v90-city-shrines').forEach(x=>x.remove());
  if(plan==='d6'){
    renderRows('d6',shinhotakaD6Rows());
    renderRows('d7',shirakawaD7Rows());
    renderRows('d8',cityCaveD8Rows());
    setSummary('d6','🚡 新穗高 → 平湯 → 高山','新穗高好天優先日；回程經平湯，再返高山。',[{html:'☀️ <strong>D6 真係好天就去新穗高</strong>；天氣唔值就可重新揀 D7／D8。'},{html:'⛩️ <strong>平湯神社</strong>跟新穗高回程自然加入。'}]);
    setSummary('d7','🏘️ 白川鄉 → 高山','D6 已用新穗高，所以白川鄉順延到 D7；仍然唔留到 D8。',[{html:'🏘️ <strong>白川鄉最遲 D7 完成</strong>，避免最後一日向西兜路。'},{html:'🕯️ <strong>1/15 三寺まいり只做 Bonus</strong>，主線完成先考慮。'}]);
    setSummary('d8','🏯 高山市區 → 飛驒大鐘乳洞 → 松本','一路向東：高山市區 → 鐘乳洞 → 平湯／安房 → 松本。',[{html:'➡️ <strong>D8 不再安排白川鄉</strong>，避免先向西再掉頭返松本。'},{html:'🧊 <strong>飛驒大鐘乳洞正正在返松本方向</strong>，最後一日最順。'}]);
  }else if(plan==='d7'){
    renderRows('d6',shirakawaD6Rows());
    renderRows('d7',shinhotakaD7Rows());
    renderRows('d8',cityCaveD8Rows());
    setSummary('d6','🏘️ 白川鄉 → 高山','白川鄉預設日；星期四先完成西面行程，再留 D7／D8 俾東面。',[{html:'🏘️ <strong>D6 星期四先去白川鄉</strong>，人潮同路線都比留到星期六理想。'},{html:'🌨️ 如果朝早發現 D6 新穗高極好天，仍可即刻改揀 D6。'}]);
    setSummary('d7','🚡 新穗高 → 平湯 → 高山','D7 新穗高好天方案；回程經平湯返高山。',[{html:'☀️ <strong>D7 天氣最好就用呢日新穗高</strong>。'},{html:'🕯️ <strong>1/15 三寺まいり係 Bonus</strong>，回程順先考慮。'}]);
    setSummary('d8','🏯 高山市區 → 飛驒大鐘乳洞 → 松本','最後一日一路向東，鐘乳洞之後直接返松本。',[{html:'➡️ <strong>D8 唔再去白川鄉</strong>。'},{html:'🧊 鐘乳洞 → 平湯 → 松本方向自然，保留更多冬季道路 Buffer。'}]);
  }else{
    renderRows('d6',shirakawaD6Rows());
    renderRows('d7',cityCaveD7Rows());
    renderRows('d8',shinhotakaD8Rows());
    setSummary('d6','🏘️ 白川鄉 → 高山','先完成西面白川鄉；D8 留新穗高好天方案。',[{html:'🏘️ <strong>白川鄉固定提早到 D6</strong>，唔再拖到 D8。'},{html:'🌨️ D6 如果突然變成新穗高最佳日，仍可用選擇器即時改。'}]);
    setSummary('d7','🏯 高山市區 → 飛驒大鐘乳洞 → 高山','D7 做高山市區＋鐘乳洞；1/15 晚上三寺まいり只做 Bonus。',[{html:'🏯 <strong>D7 完成高山市區＋鐘乳洞</strong>，為 D8 新穗高→松本清走其他主線。'},{html:'🕯️ 三寺まいり唔硬塞，體力／雪路唔理想直接 Skip。'}]);
    setSummary('d8','🚡 新穗高 → 平湯 → 松本','D8 如果新穗高天氣最好：上山後經平湯／安房一路向東返松本。',[{html:'☀️ <strong>D8 仍然完全保留新穗高選擇</strong>；好天值得就去。'},{html:'➡️ 新穗高／平湯返松本比白川鄉返松本順路得多。'}]);
  }
  return true;
}

const PHOTO={
 d6:{d6:['assets/images/d6-shinhotaka.jpg','assets/images/d6-takayama.jpg','assets/images/d9-matsumoto-station.jpg'],d7:['assets/images/d7-shirakawago.jpg','assets/images/d7-shirakawago-view.jpg','assets/images/d7-hida-furukawa.jpg'],d8:['assets/images/d6-takayama.jpg','assets/images/d6-hida-cave.jpg','assets/images/d9-matsumoto-station.jpg']},
 d7:{d6:['assets/images/d7-shirakawago.jpg','assets/images/d7-shirakawago-view.jpg','assets/images/d6-takayama.jpg'],d7:['assets/images/d6-shinhotaka.jpg','assets/images/d6-takayama.jpg','assets/images/d7-hida-furukawa.jpg'],d8:['assets/images/d6-takayama.jpg','assets/images/d6-hida-cave.jpg','assets/images/d9-matsumoto-station.jpg']},
 d8:{d6:['assets/images/d7-shirakawago.jpg','assets/images/d7-shirakawago-view.jpg','assets/images/d6-takayama.jpg'],d7:['assets/images/d6-takayama.jpg','assets/images/d6-hida-cave.jpg','assets/images/d7-hida-furukawa.jpg'],d8:['assets/images/d6-shinhotaka.jpg','assets/images/d6-takayama.jpg','assets/images/d9-matsumoto-station.jpg']}
};
const CAPS={
 'assets/images/d6-shinhotaka.jpg':'🚡 新穗高纜車',
 'assets/images/d6-takayama.jpg':'🏯 高山',
 'assets/images/d6-hida-cave.jpg':'🧊 飛驒大鐘乳洞',
 'assets/images/d7-shirakawago.jpg':'🏘️ 白川鄉',
 'assets/images/d7-shirakawago-view.jpg':'📷 荻町展望台',
 'assets/images/d7-hida-furukawa.jpg':'🕯️ 飛驒古川・1/15 Bonus',
 'assets/images/d9-matsumoto-station.jpg':'🚉 松本・今晚終點'
};
function photoCard(src){return '<div class="photo-card"><img class="zoomable" src="'+src+'" alt="'+esc(CAPS[src]||'行程相片')+'" data-caption="'+esc(CAPS[src]||'行程相片')+'" loading="lazy"><div class="photo-caption">'+esc(CAPS[src]||'行程相片')+'</div></div>';}
function patchPhotos(){
  const plan=selected();if(!PHOTO[plan])return;
  ['d6','d7','d8'].forEach(id=>{
    const p=document.querySelector('#'+id+' .photo-section');if(!p)return;
    const a=PHOTO[plan][id];if(!a)return;
    p.innerHTML='<div class="hero-photo"><img class="zoomable" src="'+a[0]+'" alt="'+esc(CAPS[a[0]]||'行程相片')+'" data-caption="'+esc(CAPS[a[0]]||'行程相片')+'" loading="lazy"><div class="photo-caption">'+esc(CAPS[a[0]]||'行程相片')+'</div></div><div class="photo-gallery">'+photoCard(a[1])+photoCard(a[2])+'</div>';
  });
}

function boot(){
  if(!selected())return;
  applyRouting();
  [120,520,1150].forEach(t=>setTimeout(applyRouting,t));
  /* v9.0 final fixes finish shrine/rest/info decoration at 1.5s. Only photos are
     corrected afterwards; timelines are left intact so those decorations stay. */
  setTimeout(patchPhotos,1700);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
