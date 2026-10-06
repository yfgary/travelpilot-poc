(function(){
'use strict';

/* =========================================================
   Japan Winter 2027 - D2 final plan override v8.8
   Confirmed plan:
   - 08:30 leave hotel for a quick breakfast
   - Walk to Matsumoto Castle; allow 1h30 for photos + tower
   - Walk back to hotel, collect luggage, then pick up rental car
   - Karuizawa Outlet: about 2 hours including a quick lunch
   - Target leave Outlet 15:20; 15:30 is the hard cut
   - Target Chikumakan about 16:50-17:10; 17:30 absolute latest
   - Shiraito Falls / Onioshidashi are removed from D2 and left for a future trip
========================================================= */

const DATA = window.Japan2027EnhancementData;

function findAttraction(id){
    if(!DATA || !Array.isArray(DATA.attractions)) return null;
    return DATA.attractions.find(function(x){ return x.id === id; }) || null;
}

function patchAttraction(id, patch){
    const item = findAttraction(id);
    if(item) Object.assign(item, patch);
}

function esc(value){
    return String(value || '')
        .replace(/&/g,'&amp;')
        .replace(/"/g,'&quot;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
}

function mapAttrs(query, label){
    return ' data-map="' + esc(query) + '" data-map-label="' + esc(label || query) + '"';
}

/* Deep-info wording must match the final D2 plan. */
patchAttraction('matsumoto-castle',{
    fit:'D2 朝早先將行李寄存酒店，08:30 出門快食早餐，再步行去松本城。今次正式預足約 1 小時 30 分鐘，重點係影相＋入國寶現存天守；完成後先返酒店攞行李，再去 Times 取車。',
    time:'松本城本身預約 1 小時 30 分鐘；另計酒店往返步行各約 10–15 分鐘。冬季如有結冰，步行再預多 5–10 分鐘。'
});

patchAttraction('shiraito',{
    fit:'今次 D2 正式取消，唔再作 Backup。白絲瀑布留待下次輕井澤／草津一帶冬季行程先去。',
    winter:'冬季景色值得，但今次唔會為佢壓縮松本城、Outlet 或千曲溫泉酒店時間。'
});

patchAttraction('onioshidashi',{
    fit:'今次 D2 正式取消，唔再作 Backup。鬼押出園留待下次輕井澤／草津冬季行程。',
    winter:'冬季黑色熔岩＋白雪好有特色，但今次已選擇松本城，唔再塞入同一日。'
});

patchAttraction('karuizawa-outlet',{
    fit:'D2 核心行程之一。松本城完成、取車後直接去 Outlet，正式預留約 2 小時，午餐亦放喺呢 2 小時內完成。',
    time:'約 2 小時（包括快速午餐／小食）。目標 15:20 離開，15:30 為 Hard Cut。',
    winter:'戶外型商場冬天會凍同有風；如果松本出發比預期遲，先縮少量 Shopping，唔推遲 17:30 前到千曲館。'
});

function patchD2(){
    const day = document.getElementById('d2');
    if(!day || day.dataset.v88D2 === '1') return;
    day.dataset.v88D2 = '1';

    const nav = document.querySelector('.day-nav a[data-day="d2"]');
    if(nav) nav.textContent = '🏯 D2 松本城';

    const title = day.querySelector('.day-title');
    const route = day.querySelector('.day-route');
    if(title) title.textContent = '🏯 松本城 → 輕井澤 Outlet → 千曲';
    if(route) route.textContent = '08:30 快早餐 → 步行松本城（1.5小時）→ 返酒店攞行李 → Times 取車 → 輕井澤 Outlet（2小時）→ 千曲溫泉';

    const grid = day.querySelector('.day-highlights .highlights-grid');
    if(grid){
        grid.innerHTML = '\
          <div class="highlight-item">🏯 <strong>松本城預足 1 小時 30 分鐘</strong>，影相＋正式入國寶現存天守，唔再趕住打卡。</div>\
          <div class="highlight-item highlight-road">🚶 <strong>先步行松本城，之後先取車</strong>：行李寄存酒店，慳松本城停車費，亦唔使市中心揸車搵位。</div>\
          <div class="highlight-item">🛍️ <strong>Outlet 約 2 小時</strong>，快速午餐包括喺入面；目標 15:20 離開。</div>\
          <div class="highlight-item highlight-danger">🔴 <strong>15:30 Outlet Hard Cut；17:30 前一定到千曲館。</strong> 白絲瀑布／鬼押出園今次正式取消。</div>';
    }

    const hero = day.querySelector('.hero-photo');
    if(hero){
        const img = hero.querySelector('img');
        const cap = hero.querySelector('.photo-caption');
        if(img){
            img.src = 'assets/images/d1-matsumoto-castle.jpg';
            img.alt = '松本城・國寶現存天守';
            img.dataset.caption = '🏯 松本城・國寶現存天守';
        }
        if(cap) cap.textContent = '🏯 松本城・國寶現存天守';
    }

    const gallery = day.querySelector('.photo-gallery');
    const cards = day.querySelectorAll('.photo-gallery .photo-card');
    if(cards[0]){
        const img = cards[0].querySelector('img');
        const cap = cards[0].querySelector('.photo-caption');
        if(img){
            img.src = 'assets/images/d2-karuizawa-outlet.jpg';
            img.alt = '輕井澤王子購物廣場';
            img.dataset.caption = '🛍️ 輕井澤王子購物廣場';
        }
        if(cap) cap.textContent = '🛍️ 輕井澤王子購物廣場';
    }
    if(cards[1]) cards[1].style.display = 'none';
    if(gallery) gallery.style.gridTemplateColumns = '1fr';

    const content = day.querySelector('.day-content');
    if(!content) return;

    content.innerHTML = '\
      <div class="special-box weather">\
        ❄️ <strong>冬季步行：</strong>松本市中心 1 月未必日日厚雪，但朝早有機會路面結冰。酒店 ↔ 松本城平時約 10–15 分鐘；有雪／冰就預多 5–10 分鐘，慢行就得。\
      </div>\
      <div class="timeline">\
        <div class="timeline-item"><div class="time">08:20–08:30</div><div class="timeline-card"><span class="event-type">🧳 CHECK-OUT／寄存</span><h3'+mapAttrs('TABINO HOTEL lit Matsumoto')+'>TABINO HOTEL lit 松本</h3><p>完成 Check-out；大件行李繼續寄存酒店，只帶輕便隨身物品去松本城。</p></div></div>\
        <div class="timeline-item"><div class="time">08:30–09:00</div><div class="timeline-card"><span class="event-type">🍳 快早餐</span><h3'+mapAttrs('Matsumoto Station','松本站一帶')+'>松本站／酒店附近</h3><p>酒店不包早餐。以快食為主，09:00 左右開始行去松本城。</p></div></div>\
        <div class="timeline-item"><div class="time">09:00–09:15</div><div class="timeline-card"><span class="event-type">🚶 步行</span><h3'+mapAttrs('Matsumoto Castle','國寶松本城')+'>早餐位置 → 松本城</h3><p>正常約 10–15 分鐘；如果有積雪／結冰就慢行，唔用平時步速硬趕。</p></div></div>\
        <div class="timeline-item"><div class="time">09:15–10:45</div><div class="timeline-card"><span class="event-type">🏯 核心景點・1小時30分</span><h3'+mapAttrs('Matsumoto Castle','國寶松本城')+'>國寶・松本城／天守</h3><p>今次預足 1 小時 30 分鐘，先影護城河、黑色天守、紅橋／外圍角度，再入現存木造天守。你鍾意影相，所以唔再壓縮做 30–60 分鐘。</p><span class="price">現行參考：電子票 ¥1,200／現場 ¥1,300</span></div></div>\
        <div class="timeline-item"><div class="time">10:45–11:00</div><div class="timeline-card"><span class="event-type">🚶 返回酒店</span><h3'+mapAttrs('TABINO HOTEL lit Matsumoto')+'>松本城 → TABINO</h3><p>步行返酒店；冬天地面滑就預多幾分鐘。</p></div></div>\
        <div class="timeline-item"><div class="time">11:00–11:05</div><div class="timeline-card"><span class="event-type">🧳 取行李</span><h3'+mapAttrs('TABINO HOTEL lit Matsumoto')+'>TABINO HOTEL lit 松本</h3><p>攞返 28吋／26吋／20吋行李，再去 Times。</p></div></div>\
        <div class="timeline-item"><div class="time">11:05–11:20</div><div class="timeline-card"><span class="event-type">🚗 取車</span><h3'+mapAttrs('Times Car Rental Matsumoto Station')+'>Times 松本站前・4WD＋雪軚</h3><p>辦文件、驗車、確認雪軚／雪刷。目標約 11:20 正式開車；租車預約時間亦以約 11:00 為較合理。</p></div></div>\
        <div class="timeline-item"><div class="time">11:20–13:20</div><div class="timeline-card"><span class="event-type">🚗 約 2 小時</span><h3'+mapAttrs('Karuizawa Prince Shopping Plaza')+'>松本 → 輕井澤 Outlet</h3><p>冬季按高速／國道路況慢駛；約 2 小時作行程預算，實際以當日導航為準。</p></div></div>\
        <div class="timeline-item"><div class="time">13:20–15:20</div><div class="timeline-card"><span class="event-type">🛍️ SHOPPING＋快午餐</span><h3'+mapAttrs('Karuizawa Prince Shopping Plaza')+'>輕井澤王子購物廣場</h3><p>約 2 小時。快速午餐亦喺呢段時間內完成，唔另外再開一段 45–60 分鐘午餐時間。</p></div></div>\
        <div class="timeline-item"><div class="time">15:20</div><div class="timeline-card"><span class="event-type">🚗 目標離開</span><h3'+mapAttrs('Club Wyndham Chikumakan')+'>Outlet → 千曲館</h3><p>目標 15:20 左右開車。上車前睇即時 ETA；如果冬季路況慢，寧願早幾分鐘離開。</p></div></div>\
        <div class="timeline-item"><div class="time">15:30</div><div class="timeline-card hard-cut"><span class="event-type">🔴 HARD CUT</span><h3>最遲離開 Outlet</h3><p>15:30 必須開車。之後唔再加任何景點，直接去戶倉上山田溫泉。</p></div></div>\
        <div class="timeline-item"><div class="time">16:50–17:10</div><div class="timeline-card"><span class="event-type">♨️ 目標 CHECK-IN</span><h3'+mapAttrs('Club Wyndham Chikumakan')+'>Club Wyndham 千曲館</h3><p>正常目標約 16:50–17:10 到；泊車、Check-in、放低行李後仲有時間休息／浸一陣溫泉。</p></div></div>\
        <div class="timeline-item"><div class="time">17:30</div><div class="timeline-card hard-cut"><span class="event-type">🔴 最遲到達</span><h3'+mapAttrs('Club Wyndham Chikumakan')+'>千曲館</h3><p>呢個係全日真正底線。就算前面有延誤，都以 17:30 前到酒店為優先。</p></div></div>\
        <div class="timeline-item"><div class="time">18:30</div><div class="timeline-card"><span class="event-type">🍽️ 晚餐</span><h3'+mapAttrs('Club Wyndham Chikumakan')+'>千曲館</h3><p>住宿包晚餐；飯後慢慢浸溫泉。</p></div></div>\
      </div>\
      <div class="scenario-title">⏭️ 留待下次</div>\
      <div class="special-box backup">\
        <strong>💧 白絲瀑布＋🌋 鬼押出園：</strong>今次已正式由 D2 移除，亦唔再當 Backup。原因係你已經選擇將今次時間留俾松本城；兩個雪景景點留待下一次輕井澤／草津方向旅行，唔再臨時塞返入今日。\
      </div>\
      <div class="day-buttons"><a class="button" href="live.html#d2">📹 睇 D2 Live Cam</a></div>';

    if(typeof addMapPins === 'function') addMapPins();
}

function init(){
    patchD2();
}

if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
}else{
    init();
}

})();
