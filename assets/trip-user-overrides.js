(function(){
'use strict';
const d=window.Japan2027EnhancementData;
if(!d) return;

function replaceHotel(alias, patch, extraAliases){
  const h=d.hotels.find(x=>x.aliases.some(a=>a.includes(alias)||alias.includes(a)));
  if(!h) return;
  Object.assign(h,patch);
  (extraAliases||[]).forEach(a=>{if(!h.aliases.includes(a))h.aliases.push(a);});
}

/* Arrival-payment view: only show what still needs to be paid at the hotel. */
replaceHotel('TABINO HOTEL lit 松本',{
  badges:[['arrival-pay','🏨 到店要付房費']],
  detail:'到店以日圓支付房費 ¥13,668。🍳 此訂房方案不包早餐。'
},['松本・TABINO HOTEL lit']);

replaceHotel('Club Wyndham 千曲館',{
  badges:[['onsen','♨️ 溫泉酒店'],['arrival-clear','✅ 到店唔使付房費'],['breakfast','🍳 包早餐']],
  detail:'房費按預訂安排稍後由信用卡扣款；去到酒店唔需要再付房費。🍳 行程預定早餐 08:00–09:00；酒店官方未見公開固定早餐供應時段，入住時再確認。'
},['千曲館溫泉酒店・Club Wyndham']);

replaceHotel('一乃湯果亭',{
  badges:[['onsen','♨️ 溫泉旅館'],['arrival-tax','⚠️ 到店只付地方稅'],['breakfast','🍳 包早餐']],
  detail:'房費唔需要再付；到店只需付地方稅約 HK$15.25。🍳 行程預定早餐 08:00–09:00；官方訂單確認包早晚餐，但未列固定早餐供應時間，入住時再確認。'
},['澀溫泉・一乃湯果亭']);

replaceHotel('Hotel JAL City Nagano',{
  badges:[['arrival-clear','✅ 到店唔使付房費'],['breakfast','🍳 包2人自助早餐']],
  detail:'房費已處理；到店毋須再付房費。🍳 酒店現行早餐 06:30–09:30，最遲入場 09:10；行程預定 07:45–08:30。繁忙日酒店可能提早開餐或採分時段安排。'
},['長野日航都市酒店']);

replaceHotel('高山櫻庵',{
  badges:[['onsen','♨️ 天然溫泉酒店'],['arrival-tax','⚠️ 到店只付地方稅']],
  detail:'房費唔需要再付；到店只需付城市／地方稅約 HK$30.19（2晚合計）。🍳 目前訂房資料寫「早餐另議」，未確認包含早餐；如最終方案包含／加購，酒店現行早餐用餐時段 06:30–10:00，季節可能調整。'
},['飛驒花里之湯・高山櫻庵']);

replaceHotel('Residence Hotel Takayama Station',{
  badges:[['booked','✅ 已正式預訂'],['arrival-clear','✅ 到店唔使付房費']],
  detail:'Hotels.com 訂單已確認，HK$447.28 已支付；到店毋須再付房費。🍳 目前預訂資料未見包含早餐。',
  noteOverride:'標準雙人房・非吸煙｜1/15 15:00 入住 → 1/16 11:00 退房｜已正式預訂'
},['高山站前 Residence Hotel']);

replaceHotel('Iroha Grand Hotel Matsumoto Ekimae',{
  badges:[['pending','📝 尚待正式訂單／付款資料'],['breakfast','🍳 目前選定方案包2人早餐']],
  detail:'目前未有正式付款資料，所以暫時只標示為待確認；確認後只會顯示「到店要付／到店唔使付」。🍳 酒店現行早餐 06:30–10:00，最遲入場／LO 09:30；行程預定 08:00–09:00。'
},['松本站前 Iroha Grand Hotel']);

/* Extra pre-departure items that are easy to forget. */
const ids=new Set(d.departureChecklist.flatMap(g=>g.items.map(x=>x[0])));
function addGroup(group,items){
  const fresh=items.filter(x=>!ids.has(x[0]));
  fresh.forEach(x=>ids.add(x[0]));
  if(fresh.length)d.departureChecklist.push({group,items:fresh});
}
addGroup('🧴 個人用品／藥物',[
  ['meds','平時需要嘅藥物＋少量常用藥'],
  ['toiletries','牙刷／牙膏／剃鬚／護膚用品'],
  ['lipbalm','潤唇膏＋護手霜／凡士林（日本冬天空氣乾）'],
  ['tissues','紙巾／濕紙巾'],
  ['heatpacks','暖包／暖貼'],
  ['smalltowel','細毛巾／溫泉用小袋'],
  ['mask','口罩（長途交通／乾燥環境備用）']
]);
addGroup('🧳 行李／雜項',[
  ['luggage','28吋＋26吋＋20吋行李箱狀態／鎖確認'],
  ['daybag','每日用背囊／斜孭袋'],
  ['zipbags','密實袋／膠袋：濕襪、濕手套、垃圾用'],
  ['laundry','少量洗衣袋／污衣袋'],
  ['pen','原子筆＋少量便條'],
  ['copies','護照／駕照／保險重要資料另存雲端＋離線副本']
]);
})();


/* v8.6 D1 / D9 transport-food-lounge patch */
(function(){
  'use strict';

  function textOf(el){return (el?.textContent||'').replace(/\s+/g,' ').trim();}
  function timelineItem(day, needle){
    if(!day) return null;
    return [...day.querySelectorAll('.timeline-item')].find(x=>textOf(x.querySelector('h3')).includes(needle)) || null;
  }
  function setTime(item, value){const t=item?.querySelector('.time'); if(t)t.textContent=value;}
  function setDesc(item, html){const p=item?.querySelector('.timeline-card p'); if(p)p.innerHTML=html;}
  function makeItem(cls,time,type,title,jp,desc){
    const div=document.createElement('div');
    div.className='timeline-item '+cls;
    div.innerHTML='<div class="time">'+time+'</div><div class="timeline-card"><span class="event-type">'+type+'</span><h3>'+title+'</h3>'+
      (jp?'<div class="jp-place-name">🇯🇵 '+jp+'</div>':'')+'<p>'+desc+'</p></div>';
    return div;
  }
  function insertAfter(ref,node){if(ref&&node&&!node.isConnected)ref.insertAdjacentElement('afterend',node);}
  function insertBefore(ref,node){if(ref&&node&&!node.isConnected)ref.insertAdjacentElement('beforebegin',node);}

  function patchD1(){
    const day=document.getElementById('d1');
    if(!day) return;
    const tl=day.querySelector('.timeline');
    if(!tl) return;

    const arrival=timelineItem(day,'中部國際機場 T2');
    if(arrival){
      setTime(arrival,'14:30–15:30');
      setDesc(arrival,'落機後辦理入境及攞行李。<strong>目標約 15:30 出禁區</strong>；最遲仍以約 15:45 作保守 Buffer。HK Express 現時使用 T2，出禁區後沿 FLIGHT OF DREAMS／Access Plaza 方向前行。');
    }

    if(!day.querySelector('.v86-d1-lunch')){
      const lunch=makeItem('v86-d1-lunch','15:30–15:55','🍜 快食午餐','FLIGHT OF DREAMS 2樓・Seattle Terrace','フライト・オブ・ドリームズ 2F シアトルテラス','UO680 無飛機餐，出禁區後先快食。呢度正正在 T2 前往 Access Plaza／T1 路線附近；建議揀<strong>烏冬、拉麵或 Food Court 快食</strong>，控制約 20–25 分鐘。<br><strong>⚠️ 如果 15:35 後先出禁區：</strong>改外賣／便利店，唔好為午餐影響 17:40 JR 特急信濃 Hard Cut。');
      insertAfter(arrival,lunch);
    }

    const train=timelineItem(day,'中部機場 → 名古屋');
    if(train){
      setTime(train,'16:15 前後');
      setDesc(train,'買完兩程車票後，搭<strong>最近一班 μSKY</strong>前往名鐵名古屋。現行最快約 28 分鐘；2027 正式班次出發前再確認。<strong>目標 17:05 前到名古屋</strong>，保留轉 JR Buffer。');
    }

    if(!day.querySelector('.v86-d1-jr-ticket')){
      const jr=makeItem('v86-d1-jr-ticket','15:55–16:05','🎫 買 JR 車票','Central Japan Travel Center・T1 2樓到着大堂','セントラルジャパン トラベルセンター','由 T2／FLIGHT OF DREAMS 行去 T1 2樓到着大堂。呢個櫃位<strong>可以出票 JR 車票</strong>，營業 09:00–19:00（旅行業務至 19:00）。直接買<strong>名古屋 → 松本・特急しなの指定席</strong>。<br>⚠️ 呢度<strong>唔賣名鐵車票</strong>。如果排隊太長，立即 Skip，改到 JR 名古屋站指定席售票機／JR Ticket Office 買。');
      insertBefore(train,jr);
    }

    if(!day.querySelector('.v86-d1-meitetsu-ticket')){
      const m=makeItem('v86-d1-meitetsu-ticket','16:05–16:15','🎫 買名鐵車票','中部國際空港站・Access Plaza','中部国際空港駅','去 Access Plaza 旁嘅名鐵中部國際空港站。閘口<strong>左邊</strong>有售票機／有人櫃位，可買普通乘車券＋μSKY 所需嘅 <strong>μticket</strong>。μSKY 特別車廂現行 μticket 為 ¥450。');
      insertBefore(train,m);
    }

    const transfer=timelineItem(day,'名鐵名古屋 → JR 名古屋');
    if(transfer){
      setTime(transfer,'約16:45–17:20');
      setDesc(transfer,'到名鐵名古屋後轉去 JR 名古屋站。最好已經喺機場買好 JR 信濃指定席，咁到名古屋可以直接搵月台；如果機場未買到，立即用 JR 指定席售票機／JR Ticket Office 買。<strong>17:40 特急信濃係今日 Hard Cut。</strong>');
    }
  }

  function patchD9(){
    const day=document.getElementById('d9');
    if(!day) return;
    const flight=timelineItem(day,'UO685');
    const airportTrain=timelineItem(day,'名古屋 → 中部國際機場');
    if(!flight) return;

    if(!day.querySelector('.v86-d9-lounge-check')){
      const check=makeItem('v86-d9-lounge-check','17:20–17:30','🛋️ Lounge／Terminal 確認','Plaza Premium Lounge 名古屋・重要限制','プラザ・プレミアム・ラウンジ名古屋','<strong>現時 HK Express（UO）使用 Terminal 2；而 Plaza Premium Lounge International 同 Domestic 都喺 Terminal 1。</strong><br>• International：T1 國際線禁區 2F、Gate 18 旁。<br>• Domestic：T1 國內線禁區，只供國內線旅客，UO685 國際線唔適用。<br><strong>⚠️ T2 官方現時冇 Lounge。</strong>所以如果 2027/1 UO685 仍然由 T2 出發，兩間 Plaza Premium Lounge 都入唔到；出發前一定再核對 UO685 Terminal。');
      insertBefore(flight,check);
    }

    if(!day.querySelector('.v86-d9-dinner')){
      const dinner=makeItem('v86-d9-dinner','17:30–18:15','🍽️ 晚餐方案','如果 UO685 仍係 T2：先喺禁區外食','第2ターミナル利用時：保安検査前に食事','如果 UO685 仍然係 T2，建議<strong>先喺 FLIGHT OF DREAMS／T1 禁區外食晚餐</strong>，之後先行去 T2 Check-in／保安／出境。咁就唔會因為 T2 冇 Lounge 而去到閘口先發現冇得食。');
      insertBefore(flight,dinner);
    }

    if(!day.querySelector('.v86-d9-intl-lounge')){
      const lounge=makeItem('v86-d9-intl-lounge','18:30–19:45','🛋️ 條件式 Lounge','Plaza Premium Lounge Nagoya・International Departures','プラザ・プレミアム・ラウンジ名古屋（国際線出発）','<strong>只限 UO685 到時改用 Terminal 1 才使用。</strong>位置係 T1 國際線禁區 2F、Gate 18 旁，有餐飲、Wi‑Fi、充電等。現行星期日營業參考 07:00–22:30。食完約 19:45 離開 Lounge，返 Gate 等 20:40 UO685。');
      insertBefore(flight,lounge);
    }

    if(airportTrain){
      setDesc(airportTrain,'現行參考 16:49 → 17:17。到機場後<strong>先確認 UO685 當日 Terminal</strong>；現時 HK Express 使用 T2。');
    }
  }

  function apply(){patchD1();patchD9();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{apply();setTimeout(apply,800);setTimeout(apply,2200);});
  else {apply();setTimeout(apply,800);setTimeout(apply,2200);}
})();


/* Cross-device departure checklist sync */
(function(){
  if(document.getElementById("checklistSyncScript")) return;
  const s=document.createElement("script");
  s.id="checklistSyncScript";
  s.src="assets/checklist-sync.js?v=2";
  s.defer=true;
  document.head.appendChild(s);
})();
