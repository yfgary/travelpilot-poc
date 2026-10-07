(function(){
'use strict';

/* =========================================================
   Japan Winter 2027 - user plan override 2026-09-28
   - D2: Matsumoto Castle + 2h Outlet + arrive Chikuma <=17:30
   - Shiraito / Onioshidashi become Backup only
   - Add rail price references
   - Add snow-shrine / Inari reference cards + parking
   - Live Cam links now use live.html because index.html is the itinerary landing redirect
========================================================= */

const DATA = window.Japan2027EnhancementData;

function findAttraction(id){
    if(!DATA || !Array.isArray(DATA.attractions)) return null;
    return DATA.attractions.find(function(x){ return x.id === id; }) || null;
}

function patchAttraction(id, patch){
    const a=findAttraction(id);
    if(a) Object.assign(a,patch);
}

/* ---------- Update existing deep-info wording to match the new D2 ---------- */
patchAttraction('matsumoto-castle',{
    fit:'D2 先於 09:30 取車，再駕車去松本城。今次正式入天守，唔再只睇外圍；之後先去輕井澤 Outlet。',
    time:'外圍＋天守約 60–75 分鐘；官方一般建議天守本身預 45–60 分鐘。'
});
patchAttraction('shiraito',{
    fit:'D2 已降做 Backup，不再係主線。只有當日時間、路況同導航 ETA 都非常鬆先考慮，而且唔可以影響 17:30 前到千曲溫泉酒店。',
    winter:'白絲 Highland Way 係冬季山路；一有結冰、降雪、封路或時間唔鬆，直接 Skip。'
});
patchAttraction('onioshidashi',{
    fit:'D2 已降做第二 Backup，優先級低過白絲瀑布。唔會為鬼押出園犧牲 Outlet 2 小時或者 17:30 前到千曲館。',
    winter:'冬季風大、積雪會遮住石縫；時間唔鬆或道路唔理想就直接取消。'
});
patchAttraction('karuizawa-outlet',{
    fit:'D2 核心行程之一，正式預留完整 2 小時。松本城完成後直去 Outlet，再直接去千曲。',
    winter:'戶外型商場會吹風。目標約 15:10 左右離開；最遲離開時間要睇即時導航，原則係 17:30 前一定到千曲館。',
    time:'完整預留約 2 小時（包括簡單午餐／小食時間可彈性安排）。'
});

/* ---------- Snow shrine / Inari deep-info data ---------- */
if(DATA && Array.isArray(DATA.attractions)){
    const shrineData=[
        {
            id:'hida-toshogu',
            aliases:['飛驒東照宮','飛騨東照宮'],
            title:'⛩️ 飛驒東照宮',
            why:'高山市內好容易順路加入嘅雪景神社。冬天紅橋、石階、唐門同白雪反差好靚，而且通常比熱門市中心景點安靜。',
            background:'飛驒東照宮祭祀德川家康，現存配置保留東照宮系廟建築特色。高山市官方資料指由高山站駕車約10分鐘。',
            look:['紅橋配白雪係第一個代表角度。','由石階向上望唐門／本殿，冬天層次最好。','唔需要留太耐，當高山市區日 25–35 分鐘 Bonus 最合適。'],
            fit:'⭐ 如有時間加。跟「高山市區日」一齊移動，D6–D8 邊日做高山市區就邊日考慮。',
            winter:'官方有普通車停車位；落雪後石階會滑，冰爪／防滑鞋視地面情況使用。',
            time:'約 25–35 分鐘。',
            source:'https://www.hidatakayama.or.jp/spot/detail_1184.html'
        },
        {
            id:'hie-shrine-takayama',
            aliases:['日枝神社'],
            title:'⛩️ 高山・日枝神社',
            why:'高山祭「山王祭」嘅神社，杉林、石燈籠同雪景氣氛非常傳統。唔係鳥居隧道型，但神社感好完整。',
            background:'日枝神社相傳創建於1141年，長年作為高山南半部氏神，亦係春之高山祭（山王祭）核心神社。',
            look:['杉林參道＋石燈籠。','雪落喺參道同樹根位置時氣氛最好。','如果只想影一個「雪＋神社」畫面，可以快速行一圈。'],
            fit:'🔄 Backup。高山市區日時間有剩先加；優先級低過豊川城山稲荷同飛驒東照宮。',
            winter:'神社官方旅遊資料列明無普通車停車位，建議泊高山市營天滿駐車場再步行。',
            time:'約 30–40 分鐘（另加停車場步行）。',
            source:'https://www.hidatakayama.or.jp/spot/detail_1180.html'
        },
        {
            id:'hirayu-shrine',
            aliases:['平湯神社'],
            title:'⛩️ 平湯神社',
            why:'規模細，但位置正正在奧飛驒高海拔雪區；如果經平湯，15–20分鐘就可以補到「雪中小神社」畫面。',
            background:'平湯神社位於平湯民俗館附近，周圍係平湯溫泉舊聚落景觀；最大優勢係一月積雪相對可靠。',
            look:['雪覆屋頂同參道。','同平湯民俗館古民家一齊睇最順。','唔需要特登長途繞路，經過先停。'],
            fit:'⭐ 如有時間加。跟平湯／新穗高／安房方向路線走，唔指定死某一日。',
            winter:'導航去平湯民俗館；官方資料普通車停車約5台。大雪／滿位就 Skip。',
            time:'約 15–20 分鐘。',
            source:'https://www.kankou-gifu.jp/spot/detail_3165.html'
        },
        {
            id:'toyokawa-shiroyama-inari',
            aliases:['豊川城山稲荷','豊川稲荷神社','豊川城山稻荷','豊川稲荷'],
            title:'⛩️ 豊川城山稲荷・城山公園',
            why:'呢個係今次最貼近「雪＋一排朱紅鳥居」要求嘅高山選擇。紅鳥居喺雪地樹林入面非常突出，攝影價值高。',
            background:'位於高山城跡一帶城山公園。高山官方冬季文章亦特別提到豊川稲荷神社紅鳥居喺雪景中非常搶眼。',
            look:['一排朱紅鳥居配白雪。','狐狸／稻荷元素同樹林雪景。','城山公園本身亦可影到安靜雪地步道。'],
            fit:'⭐ 如有時間加；如果高山市區日只揀一個鳥居型雪景，我會優先呢個。',
            winter:'城山公園停車場約15台，冬天會除雪；但上山係急斜路。積雪大時即使雪軚都要非常小心，4WD較有利；路況唔靚直接取消。',
            time:'約 20–30 分鐘。',
            source:'https://www.hidatakayama.or.jp/blog/detail_97.html'
        },
        {
            id:'kasamori-inari-matsumoto',
            aliases:['瘡守稲荷神社','瘡守稲荷大明神','瘡守稻荷神社','瘡守稻荷大明神'],
            title:'⛩️ 瘡守稲荷神社・松本',
            why:'松本市中心細型稻荷，最大特色係紅鳥居同大型白狐；如果松本有空檔，可以好快補一個鳥居場景。',
            background:'位於浄林寺後方，歷史上除商賣繁盛外，亦寄託咗希望守護居民免受疱瘡（天然痘）侵害嘅信仰。',
            look:['紅鳥居列。','大型白狐。','社殿彩色雕刻同百度石。'],
            fit:'🔄 松本 Backup。唔會為佢改 D2 / D9 主線，只有真正有多餘時間先去。',
            winter:'本身無專用停車位；建議用松本市營中央駐車場（M Wing北棟），再步行前往。',
            time:'約 15–25 分鐘（另加停車／步行）。',
            source:'https://visitmatsumoto.com/spot/detail_1093.html'
        }
    ];
    shrineData.forEach(function(x){
        if(!DATA.attractions.some(function(a){return a.id===x.id;})) DATA.attractions.push(x);
    });
}

function text(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
function mapAttrs(q,label){
    return ' data-map="'+q.replace(/"/g,'&quot;')+'" data-map-label="'+(label||q).replace(/"/g,'&quot;')+'"';
}

function rewriteLiveLinks(root){
    (root||document).querySelectorAll('a[href^="index.html"]').forEach(function(a){
        a.setAttribute('href',a.getAttribute('href').replace(/^index\.html/,'live.html'));
    });
}

/* =========================================================
   D2 - replace old main line completely
========================================================= */
function patchD2(){
    const day=document.getElementById('d2');
    if(!day || day.dataset.v87D2==='1') return;
    day.dataset.v87D2='1';

    const title=day.querySelector('.day-title');
    const route=day.querySelector('.day-route');
    if(title) title.textContent='🏯 松本城 → 輕井澤 → 千曲';
    if(route) route.textContent='09:30 Times 取車 → 松本城天守 → 輕井澤 Outlet（2小時）→ 千曲｜白絲瀑布／鬼押出園＝Backup';

    const grid=day.querySelector('.day-highlights .highlights-grid');
    if(grid){
        grid.innerHTML='\
          <div class="highlight-item highlight-danger">🔴 <strong>09:30 Times 取車</strong>，先取車再駕車去松本城，唔再由酒店步行來回。</div>\
          <div class="highlight-item">🏯 <strong>松本城正式入天守</strong>；唔再只睇外圍。天守本身預約45–60分鐘。</div>\
          <div class="highlight-item">🛍️ <strong>輕井澤 Outlet 完整預留2小時</strong>，唔為 Backup 景點縮短。</div>\
          <div class="highlight-item highlight-danger">♨️ <strong>17:30 前一定到 Club Wyndham 千曲館</strong>；白絲／鬼押唔可以影響呢個目標。</div>';
    }

    const hero=day.querySelector('.hero-photo');
    if(hero){
        const img=hero.querySelector('img');
        const cap=hero.querySelector('.photo-caption');
        if(img){
            img.src='assets/images/d1-matsumoto-castle.jpg';
            img.alt='松本城・國寶現存天守';
            img.dataset.caption='🏯 松本城・國寶現存天守';
        }
        if(cap) cap.textContent='🏯 松本城・國寶現存天守';
    }
    const cards=day.querySelectorAll('.photo-gallery .photo-card');
    if(cards[0]){
        const img=cards[0].querySelector('img'), cap=cards[0].querySelector('.photo-caption');
        if(img){img.src='assets/images/d2-karuizawa-outlet.jpg';img.alt='輕井澤王子購物廣場';img.dataset.caption='🛍️ 輕井澤王子購物廣場・2小時';}
        if(cap)cap.textContent='🛍️ 輕井澤王子購物廣場・2小時';
    }
    if(cards[1]){
        const img=cards[1].querySelector('img'), cap=cards[1].querySelector('.photo-caption');
        if(img){img.src='assets/images/d2-shiraito.jpg';img.alt='白絲瀑布 Backup';img.dataset.caption='💧 白絲瀑布・Backup only';}
        if(cap)cap.textContent='💧 白絲瀑布・Backup only';
    }

    const content=day.querySelector('.day-content');
    if(!content) return;
    content.innerHTML='\
      <div class="special-box weather">\
        🧭 <strong>D2 新原則：</strong>今日主線只有「松本城天守 → 輕井澤 Outlet → 千曲」。白絲瀑布同鬼押出園全部改做 Backup；任何時候只要導航顯示會令千曲到達時間接近 17:30，就唔去 Backup。\
      </div>\
      <div class="timeline">\
        <div class="timeline-item"><div class="time">08:00–08:45</div><div class="timeline-card"><span class="event-type">🍳 早餐</span><h3'+mapAttrs('Matsumoto Station','松本站一帶')+'>松本站一帶</h3><p>酒店不包早餐。食完返酒店執最後行李。</p></div></div>\
        <div class="timeline-item"><div class="time">08:45–09:10</div><div class="timeline-card"><span class="event-type">🧳 CHECK-OUT</span><h3'+mapAttrs('TABINO HOTEL lit Matsumoto')+'>TABINO HOTEL lit 松本</h3><p>Check-out、攞齊行李；之後帶行李去 Times，唔再行去松本城再返轉頭。</p></div></div>\
        <div class="timeline-item"><div class="time">09:10–09:25</div><div class="timeline-card"><span class="event-type">🚶 步行</span><h3'+mapAttrs('Times Car Rental Matsumoto Station')+'>酒店 → Times 松本站前</h3><p>冬天地面有雪／結冰，步行時間預鬆。</p></div></div>\
        <div class="timeline-item"><div class="time">09:30</div><div class="timeline-card hard-cut"><span class="event-type">🔴 HARD CUT・取車</span><h3'+mapAttrs('Times Car Rental Matsumoto Station')+'>Times 4WD＋雪軚</h3><p>目標09:30開始辦手續；驗車、確認雪軚、雪刷後出發。</p></div></div>\
        <div class="timeline-item"><div class="time">09:50–10:05</div><div class="timeline-card"><span class="event-type">🚗 市內短程</span><h3'+mapAttrs('松本城大手門駐車場','松本城大手門駐車場')+'>Times → 松本城停車場</h3><p>直接揸車去松本城附近停車，省返酒店來回步行時間。</p></div></div>\
        <div class="timeline-item"><div class="time">10:05–11:15</div><div class="timeline-card"><span class="event-type">🏯 核心景點</span><h3'+mapAttrs('Matsumoto Castle','國寶松本城')+'>國寶・松本城／天守</h3><p>今次正式入現存木造天守。官方一般建議天守本身預45–60分鐘；另留少量時間影護城河及外觀。冬天入天守要除鞋，木地板凍、樓梯亦非常陡。</p><span class="price">現行參考：電子票 ¥1,200／現場 ¥1,300</span></div></div>\
        <div class="timeline-item"><div class="time">11:15–11:25</div><div class="timeline-card"><span class="event-type">🚶 返回停車場</span><h3>松本城 → 停車場</h3><p>落雪／結冰時慢行，唔用平時步速硬計。</p></div></div>\
        <div class="timeline-item"><div class="time">11:25–13:10</div><div class="timeline-card"><span class="event-type">🚗 約1小時45分級別</span><h3'+mapAttrs('Karuizawa Prince Shopping Plaza')+'>松本 → 輕井澤 Outlet</h3><p>冬季預鬆；實際以當日高速／國道路況及 Google Maps 為準。</p></div></div>\
        <div class="timeline-item"><div class="time">13:10–15:10</div><div class="timeline-card"><span class="event-type">🛍️ SHOPPING・2小時</span><h3'+mapAttrs('Karuizawa Prince Shopping Plaza')+'>輕井澤王子購物廣場</h3><p>完整預留2小時。午餐可喺 Outlet 內簡單食，避免另開一段長時間。</p></div></div>\
        <div class="timeline-item"><div class="time">15:10</div><div class="timeline-card hard-cut"><span class="event-type">🧭 目標離開</span><h3'+mapAttrs('Club Wyndham Chikumakan')+'>Outlet → 千曲館</h3><p>正常目標15:10左右離開。<strong>15:30只可當最遲參考</strong>；如果即時導航顯示17:15–17:30先到，就要更早離開。</p></div></div>\
        <div class="timeline-item"><div class="time">16:30–17:00</div><div class="timeline-card"><span class="event-type">♨️ 目標 CHECK-IN</span><h3'+mapAttrs('Club Wyndham Chikumakan')+'>Club Wyndham 千曲館</h3><p>目標16:30–17:00左右到，泊車、Check-in、放低行李，食晚飯前有時間休息。</p></div></div>\
        <div class="timeline-item"><div class="time">17:30</div><div class="timeline-card hard-cut"><span class="event-type">🔴 絕對目標</span><h3'+mapAttrs('Club Wyndham Chikumakan')+'>最遲已到千曲館</h3><p>唔再為任何 Backup 景點推遲。酒店／溫泉時間比多塞一個景點重要。</p></div></div>\
        <div class="timeline-item"><div class="time">18:30</div><div class="timeline-card"><span class="event-type">🍽️ 晚餐</span><h3'+mapAttrs('Club Wyndham Chikumakan')+'>千曲館</h3><p>住宿包晚餐；飯後慢慢浸溫泉。</p></div></div>\
      </div>\
      <div class="scenario-title">🔄 Backup 景點｜不屬主線</div>\
      <div class="special-box backup">\
        <strong>💧 白絲瀑布：</strong>Backup #1。只有當日松本城／Outlet比預期早好多、Highland Way路況安全，而且導航仍可穩陣17:30前到千曲先考慮。<br><br>\
        <strong>🌋 鬼押出園：</strong>Backup #2，優先級再低一級。唔會為佢縮 Outlet 2小時，亦唔會為佢延遲到溫泉酒店。<br><br>\
        <strong>原則：</strong>兩個都可以成日完全唔去，D2仍然係完整行程。\
      </div>\
      <div class="day-buttons"><a class="button" href="live.html#d2">📹 睇 D2 Live Cam</a></div>';
}

/* =========================================================
   Rail price references - D1 / D9
========================================================= */
function findTimelineItem(day, needles){
    if(!day) return null;
    const arr=Array.isArray(needles)?needles:[needles];
    return Array.from(day.querySelectorAll('.timeline-item')).find(function(item){
        const h=text(item.querySelector('h3'));
        return arr.every(function(n){return h.includes(n);});
    }) || null;
}
function addPrice(item, label){
    if(!item || item.querySelector('.v87-rail-price')) return;
    const card=item.querySelector('.timeline-card');
    if(!card) return;
    const s=document.createElement('span');
    s.className='price v87-rail-price';
    s.textContent=label;
    card.appendChild(s);
}
function addRailPrices(){
    const d1=document.getElementById('d1');
    const d9=document.getElementById('d9');
    addPrice(findTimelineItem(d1,['中部機場','名古屋']),'μSKY 現行參考：約 ¥1,430／人（普通運賃＋μticket）');
    addPrice(findTimelineItem(d1,['名古屋','松本']),'特急しなの指定席 現行參考：約 ¥6,160／人');
    addPrice(findTimelineItem(d9,['松本','名古屋']),'特急しなの指定席 現行參考：約 ¥6,160／人');
    addPrice(findTimelineItem(d9,['名古屋','中部國際機場']),'μSKY 現行參考：約 ¥1,430／人');

    [d1,d9].forEach(function(day){
        if(!day || day.querySelector('.v87-rail-total')) return;
        const content=day.querySelector('.day-content');
        if(!content) return;
        const box=document.createElement('div');
        box.className='special-box v87-rail-total';
        box.innerHTML='🚆 <strong>火車預算：</strong>μSKY 約 ¥1,430／人＋特急しなの指定席約 ¥6,160／人＝<strong>約 ¥7,590／人／單程</strong>；2人約 ¥15,180。D1＋D9 兩人來回合計約 <strong>¥30,360</strong>。全部以現行票價作預算，2026年12月再核對2027正式票價／班次。';
        content.insertAdjacentElement('afterbegin',box);
    });
}

/* =========================================================
   Trip Info: rail budget + shrine / parking cards + D2 Hard Cuts
========================================================= */
function addTripInfoRail(){
    const parking=document.getElementById('parking');
    if(!parking || document.getElementById('rail-prices')) return;
    const sec=document.createElement('section');
    sec.className='section';
    sec.id='rail-prices';
    sec.innerHTML='\
      <div class="section-header"><h2 class="section-title">🚆 火車票價預算</h2><div class="section-desc">D1／D9 名鐵 μSKY＋JR 特急しなの・現行參考</div></div>\
      <div class="section-body">\
        <div class="parking-list">\
          <div class="parking-card"><div class="parking-icon">🚆</div><div class="parking-main"><h3>D1・NGO → 名古屋 → 松本</h3><p><strong>μSKY：約 ¥1,430／人</strong>（普通運賃＋μticket）</p><p><strong>特急しなの指定席：約 ¥6,160／人</strong></p><p>單人約 ¥7,590｜2人約 ¥15,180</p></div></div>\
          <div class="parking-card"><div class="parking-icon">🚆</div><div class="parking-main"><h3>D9・松本 → 名古屋 → NGO</h3><p><strong>特急しなの指定席：約 ¥6,160／人</strong></p><p><strong>μSKY：約 ¥1,430／人</strong></p><p>單人約 ¥7,590｜2人約 ¥15,180</p></div></div>\
        </div>\
        <div class="note-box">💴 <strong>D1＋D9 兩人來回鐵路暫計：約 ¥30,360。</strong><br>以上全部係現行票價預算；2027正式時刻／票價於2026年12月最後核對。</div>\
      </div>';
    parking.insertAdjacentElement('beforebegin',sec);
}

function addTripInfoShrines(){
    const parking=document.getElementById('parking');
    if(!parking || document.getElementById('winter-shrines')) return;
    const sec=document.createElement('section');
    sec.className='section';
    sec.id='winter-shrines';
    sec.innerHTML='\
      <div class="section-header"><h2 class="section-title">⛩️ 雪景神社・稻荷 Bonus</h2><div class="section-desc">唔硬塞主線；按當日時間、積雪同道路安全先加</div></div>\
      <div class="section-body"><div class="parking-list">\
        <div class="parking-card"><div class="parking-icon">⛩️</div><div class="parking-main">\
          <h3'+mapAttrs('飛騨東照宮','飛驒東照宮')+'>飛驒東照宮　⭐ 如有時間加</h3>\
          <p><strong>建議時間：</strong>25–35分鐘。祭祀德川家康，紅橋、長石階、唐門配白雪係重點。</p>\
          <p><strong>停車：</strong>神社官方資料有普通車停車位；導航直接用「飛騨東照宮」。</p>\
          <div class="parking-warning">❄️ 石階有雪／冰時慢行；跟「高山市區日」一齊移動。</div>\
        </div></div>\
        <div class="parking-card"><div class="parking-icon">⛩️</div><div class="parking-main">\
          <h3'+mapAttrs('城山公園 駐車場 高山','城山公園停車場・豊川城山稲荷')+'>豊川城山稲荷　⭐ 如有時間加</h3>\
          <p><strong>建議時間：</strong>20–30分鐘。今程高山最貼「雪＋一排朱紅鳥居」要求嘅位置。</p>\
          <p><strong>停車：</strong>城山公園普通車約15台；冬天停車場會除雪。</p>\
          <div class="parking-warning">⚠️ 上城山公園係急斜路。大雪時即使雪軚都可以好難行；4WD較有利，但路況差直接取消。</div>\
        </div></div>\
        <div class="parking-card"><div class="parking-icon">⛩️</div><div class="parking-main">\
          <h3'+mapAttrs('高山市営天満駐車場','日枝神社・天滿駐車場')+'>日枝神社　🔄 Backup</h3>\
          <p><strong>建議時間：</strong>30–40分鐘＋步行。1141年起源，係春之高山祭「山王祭」核心神社；杉林、石燈籠同雪景氣氛好傳統。</p>\
          <p><strong>停車：</strong>日枝神社官方旅遊資料列明無普通車停車位，使用市營天滿駐車場。普通車92台；日間現行 ¥150／30分鐘。</p>\
          <div class="parking-warning">🚶 泊車後步行前往；雪地預比平時慢。</div>\
        </div></div>\
        <div class="parking-card"><div class="parking-icon">⛩️</div><div class="parking-main">\
          <h3'+mapAttrs('平湯民俗館','平湯神社・平湯民俗館停車')+'>平湯神社　⭐ 如有時間加</h3>\
          <p><strong>建議時間：</strong>15–20分鐘。細型山間神社，但一月奧飛驒積雪可靠；經平湯時順路停最合理。</p>\
          <p><strong>停車：</strong>導航「平湯民俗館」。官方資料普通車約5台；神社／民俗館由平湯巴士總站附近步行約3分鐘級別。</p>\
          <div class="parking-warning">❄️ 唔專登為佢改路；滿位、大雪或道路唔靚就 Skip。</div>\
        </div></div>\
        <div class="parking-card"><div class="parking-icon">🦊</div><div class="parking-main">\
          <h3'+mapAttrs('松本市営中央駐車場 Mウイング北棟','瘡守稲荷神社・中央駐車場')+'>瘡守稲荷神社　🔄 松本 Backup</h3>\
          <p><strong>建議時間：</strong>15–25分鐘＋步行。浄林寺後面，有紅鳥居、大型白狐同彩色社殿雕刻；歷史上亦有祈求免受疱瘡侵害嘅信仰。</p>\
          <p><strong>停車：</strong>本身無專用停車位；建議松本市營中央駐車場（M Wing北棟），165台，現行 ¥150／30分鐘。</p>\
          <div class="parking-warning">🔄 唔會影響 D2 松本城／Outlet 或 D9 JR Hard Cut；只係真正多時間先去。</div>\
        </div></div>\
      </div><div class="note-box">📌 優先邏輯：<strong>豊川城山稲荷／飛驒東照宮＝如有時間加；平湯神社＝經過先加；日枝神社／瘡守稲荷＝Backup。</strong></div></div>';
    parking.insertAdjacentElement('beforebegin',sec);
}

function patchTripInfoHardCuts(){
    const sec=document.getElementById('hardcuts');
    if(!sec || sec.dataset.v87==='1') return;
    sec.dataset.v87='1';
    const items=Array.from(sec.querySelectorAll('.hardcut-item'));
    const pickup=items.find(function(x){return text(x.querySelector('.hardcut-time'))==='D2 10:00';});
    if(pickup){
        pickup.querySelector('.hardcut-time').textContent='D2 09:30';
        pickup.querySelector('.hardcut-text').innerHTML='🚗 Times 松本站前取車；之後先駕車去松本城入天守。';
    }
    const oldLeave=items.find(function(x){return text(x.querySelector('.hardcut-time'))==='D2 16:30';});
    if(oldLeave){
        oldLeave.querySelector('.hardcut-time').textContent='D2 15:30';
        oldLeave.querySelector('.hardcut-text').innerHTML='🛍️ Outlet 最遲參考離開時間；實際要按導航提早，確保 17:30 前到千曲館。';
        const latest=document.createElement('div');
        latest.className='hardcut-item';
        latest.innerHTML='<div class="hardcut-time">D2 17:30</div><div class="hardcut-text">♨️ 最遲必須已到 Club Wyndham 千曲館；白絲瀑布／鬼押出園不得影響。</div>';
        oldLeave.insertAdjacentElement('afterend',latest);
    }
}

function addItineraryShrineQuick(){
    if(!document.getElementById('d1') || document.getElementById('v87ShrineQuick')) return;
    const anchor=document.getElementById('tripv2WeatherSelect') || document.getElementById('weather3dPanel') || document.querySelector('.intro');
    if(!anchor) return;
    const box=document.createElement('section');
    box.id='v87ShrineQuick';
    box.className='intro';
    box.innerHTML='<h2>⛩️ 雪景神社／鳥居 Bonus</h2><p><strong>高山市區日：</strong>豊川城山稲荷（紅鳥居）／飛驒東照宮如有時間加；日枝神社做 Backup。<br><strong>經平湯：</strong>平湯神社如有時間加。<br><strong>松本：</strong>瘡守稲荷神社只做 Backup。<br><a class="button" href="trip-info.html#winter-shrines">🅿️ 睇介紹＋停車位置</a></p>';
    anchor.insertAdjacentElement('afterend',box);
}

function runDomPatches(){
    rewriteLiveLinks(document);
    patchD2();
    addRailPrices();
    addTripInfoRail();
    addTripInfoShrines();
    patchTripInfoHardCuts();
    addItineraryShrineQuick();
    if(typeof window.addMapPins==='function') window.addMapPins();
}

/* Most source DOM already exists because this file is loaded at the end of body.
   Run once now so later UI scanners can see the D2 replacement, then again after
   DOMContentLoaded because v8.6 scripts also add content at that stage. */
try{ patchD2(); rewriteLiveLinks(document); }catch(e){ console.warn('v8.7 early patch',e); }

if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
        setTimeout(runDomPatches,80);
        setTimeout(runDomPatches,400);
    });
}else{
    setTimeout(runDomPatches,0);
    setTimeout(runDomPatches,300);
}

/* D6-D8 selector can redraw dynamic content. Re-run harmless navigation/detail patches. */
document.addEventListener('click',function(e){
    if(e.target && e.target.closest && e.target.closest('.tripv2-choice')){
        setTimeout(runDomPatches,120);
    }
});

})();
