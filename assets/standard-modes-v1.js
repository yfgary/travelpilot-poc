(() => {
  'use strict';
  const TP = window.TravelPilot;

  const zonedDate = timezone => {
    try {
      const parts = new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
      const o = Object.fromEntries(parts.map(p=>[p.type,p.value]));
      return `${o.year}-${o.month}-${o.day}`;
    } catch (_) { return new Date().toISOString().slice(0,10); }
  };

  const selectedDay = (ctx,itinerary) => {
    const p = new URLSearchParams(location.search);
    const preview = p.get('day');
    return itinerary.days.find(d=>d.id===preview)
      || itinerary.days.find(d=>d.date===zonedDate(ctx.config.timezone))
      || itinerary.days[0];
  };

  const todayModal = (ctx,day,attractions,hotels) => {
    const stop = day.items?.[0];
    const hotel = hotels?.hotels?.find(h=>h.id===day.hotelId);
    const attr = attractions?.attractions?.find(a=>a.id===stop?.attractionId);
    return `
      <h2 id="modalTitle">🧭 Today Mode · D${TP.esc(day.day)}</h2>
      <p><strong>${TP.esc(day.title)}</strong></p>
      <p class="subtle">${TP.esc(day.route)}</p>
      ${stop ? `<div class="mode-card"><strong>下一站</strong><div>${TP.esc(stop.time)} · ${TP.esc(stop.title)}</div>${attr?.score!=null ? `<div class="score">景點適合度資料：${TP.esc(attr.score)}/10</div>` : ''}</div>` : ''}
      ${day.hardCuts?.length ? `<h3>Hard Cut</h3><ul>${day.hardCuts.map(h=>`<li>${TP.esc(h.time)} ${TP.esc(h.label||h.text||'')}</li>`).join('')}</ul>` : ''}
      ${hotel ? `<h3>今晚酒店</h3><p>${TP.esc(hotel.name)}</p>` : ''}
      <div class="actions"><a class="btn" href="#${TP.esc(day.id)}" onclick="TravelPilot.closeModal()">返回當日行程</a></div>
    `;
  };

  const drivingModal = (ctx,day,attractions,hotels) => {
    const stops = (day.items||[]).filter(i=>i.map || i.attractionId || i.hotelId);
    let index = Number(TP.state.get(ctx,'driving',day.id,0)) || 0;
    index = Math.max(0,Math.min(index,Math.max(0,stops.length-1)));
    const stop = stops[index];
    const hotel = hotels?.hotels?.find(h=>h.id===day.hotelId);
    const attr = attractions?.attractions?.find(a=>a.id===stop?.attractionId);
    const target = stop?.map || attr?.map || hotel?.map || '';
    return `
      <h2 id="modalTitle">🚗 Driving Mode · D${TP.esc(day.day)}</h2>
      <p class="subtle">進度 ${stops.length ? index+1 : 0} / ${stops.length}</p>
      ${stop ? `<div class="mode-card"><strong>下一站</strong><div>${TP.esc(stop.time)} · ${TP.esc(stop.title)}</div>${attr?.score!=null ? `<div class="score">目的地適合度資料：${TP.esc(attr.score)}/10</div>` : ''}</div>` : '<p>今日沒有導航站點。</p>'}
      ${day.hardCuts?.[0] ? `<p><strong>⏰ Hard Cut：</strong>${TP.esc(day.hardCuts[0].time)} ${TP.esc(day.hardCuts[0].label||'')}</p>` : ''}
      <div class="actions">
        ${target ? `<a class="btn primary" href="${TP.directionsUrl(target)}" target="_blank" rel="noopener">Google Maps 導航</a>` : ''}
        <button class="btn" id="drivePrev" ${index<=0?'disabled':''}>上一站</button>
        <button class="btn" id="driveNext" ${index>=stops.length-1?'disabled':''}>完成／下一站</button>
        <button class="btn" id="wakeLockBtn">保持螢幕</button>
      </div>
    `;
  };

  const bindDriving = (ctx,day,attractions,hotels) => {
    const rerender = delta => {
      const stops=(day.items||[]).filter(i=>i.map||i.attractionId||i.hotelId);
      let i=Number(TP.state.get(ctx,'driving',day.id,0))||0;
      i=Math.max(0,Math.min(i+delta,Math.max(0,stops.length-1)));
      TP.state.set(ctx,'driving',day.id,i);
      TP.openModal(drivingModal(ctx,day,attractions,hotels));
      bindDriving(ctx,day,attractions,hotels);
    };
    document.getElementById('drivePrev')?.addEventListener('click',()=>rerender(-1));
    document.getElementById('driveNext')?.addEventListener('click',()=>rerender(1));
    document.getElementById('wakeLockBtn')?.addEventListener('click',async()=>{
      try { await navigator.wakeLock?.request('screen'); } catch (_) {}
    });
  };

  function mount(ctx,itinerary,attractions,hotels) {
    const bar=document.getElementById('modeBar');
    if(!bar)return;
    const day=selectedDay(ctx,itinerary);
    if(TP.feature(ctx,'todayMode')) {
      const b=document.createElement('button');b.className='btn';b.textContent='🧭 Today Mode';
      b.addEventListener('click',()=>TP.openModal(todayModal(ctx,day,attractions,hotels)));bar.appendChild(b);
    }
    if(TP.feature(ctx,'drivingMode')) {
      const b=document.createElement('button');b.className='btn primary';b.textContent='🚗 Driving Mode';
      b.addEventListener('click',()=>{TP.openModal(drivingModal(ctx,day,attractions,hotels));bindDriving(ctx,day,attractions,hotels);});bar.appendChild(b);
    }
    const hint=document.createElement('span');hint.className='subtle';hint.textContent=`Preview: ${day.id.toUpperCase()}（可用 ?day=d6 切換）`;bar.appendChild(hint);
  }

  window.TravelPilotModes={mount};
})();