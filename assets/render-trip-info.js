(() => {
  'use strict';
  const TP = window.TravelPilot;

  const badge = b => {
    if (Array.isArray(b)) return `<span class="badge ${TP.esc(b[1]||'')}">${TP.esc(b[0]||'')}</span>`;
    if (typeof b === 'string') return `<span class="badge">${TP.esc(b)}</span>`;
    return `<span class="badge ${TP.esc(b?.tone||'')}">${TP.esc(b?.label||b?.text||'')}</span>`;
  };

  const card = c => `
    <article class="card">
      ${c.badges?.length ? `<div class="badges">${c.badges.map(badge).join('')}</div>` : ''}
      <h3>${TP.esc(c.title||'')}</h3>
      ${c.lines?.map(x=>`<p>${TP.esc(x)}</p>`).join('') || ''}
      ${c.warning ? `<div class="section-strip warning">${TP.esc(c.warning)}</div>` : ''}
      <div class="actions">
        ${c.map ? `<a class="btn" href="${TP.mapUrl(c.map)}" target="_blank" rel="noopener">📍 地圖</a>` : ''}
        ${c.links?.map(l=>`<a class="btn" href="${TP.esc(l.href||l.url||'#')}" target="_blank" rel="noopener">${TP.esc(l.label||'Link')}</a>`).join('') || ''}
      </div>
    </article>`;

  const cardSection = s => s ? `
    <section class="panel" id="${TP.esc(s.id||'')}">
      <div class="panel-head"><h2>${TP.esc(s.title||'')}</h2>${s.desc ? `<p class="subtle">${TP.esc(s.desc)}</p>` : ''}</div>
      <div class="panel-body">
        ${s.cards?.length ? `<div class="grid">${s.cards.map(card).join('')}</div>` : ''}
        ${s.note ? `<div class="section-strip">${TP.esc(s.note)}</div>` : ''}
      </div>
    </section>` : '';

  const customSection = s => {
    if (!s) return '';
    let body='';
    if (s.type==='cards') body = `<div class="grid">${(s.cards||[]).map(card).join('')}</div>`;
    if (s.type==='list') body = `<ul>${(s.items||[]).map(x=>`<li>${TP.esc(typeof x==='string'?x:(x.text||x.label||x.title||''))}</li>`).join('')}</ul>`;
    if (s.type==='notice') body = `<div class="section-strip warning">${TP.esc(s.text||'')}</div>`;
    if (s.type==='links') body = `<div class="actions">${(s.links||[]).map(l=>`<a class="btn" href="${TP.esc(l.href)}" target="_blank" rel="noopener">${TP.esc(l.label)}</a>`).join('')}</div>`;
    return `<section class="panel" id="${TP.esc(s.id)}"><div class="panel-head"><h2>${TP.esc(s.title)}</h2>${s.desc?`<p class="subtle">${TP.esc(s.desc)}</p>`:''}</div><div class="panel-body">${body}</div></section>`;
  };

  const hotelSection = (data,hotels) => {
    if (!data?.hotelStays) return '';
    const byId = id => hotels?.hotels?.find(h=>h.id===id);
    return `<section class="panel" id="hotels">
      <div class="panel-head"><h2>${TP.esc(data.hotelStays.title||'🏨 住宿')}</h2><p class="subtle">${TP.esc(data.hotelStays.desc||'')}</p></div>
      <div class="panel-body"><div class="grid">${(data.hotelStays.stays||[]).map(s=>{
        const h=byId(s.hotelId)||{};
        return card({
          badges:[[s.day||'', ''], [h.statusLabel||h.status||'', 'good']],
          title:`${s.icon||'🏨'} ${h.name||s.hotelId||''}`,
          map:h.map,
          lines:[
            [s.date,s.note].filter(Boolean).join(' · '),
            h.room ? `房型：${h.room}` : '',
            h.meals ? `餐食：${h.meals}` : '',
            h.totalPrice ? `總價：${h.totalPrice}` : '',
            h.paidAmount ? `已付：${h.paidAmount}` : '',
            h.arrivalPayment || '',
            h.cancellation ? `取消：${h.cancellation}` : '',
            h.parking ? `泊車：${h.parking}` : ''
          ].filter(Boolean)
        });
      }).join('')}</div></div>
    </section>`;
  };

  const checklistSection = (ctx,info,departure) => {
    const daily = info?.checklist;
    const parts=[];
    if (daily?.items?.length) {
      parts.push(`<h3>${TP.esc(daily.title||'每日 Checklist')}</h3><p class="subtle">${TP.esc(daily.desc||'')}</p><div class="checklist">${daily.items.map((label,i)=>{
        const id=`daily-${i}`; const checked=TP.state.get(ctx,'checklist',id,false)===true;
        return `<label class="check-item"><input type="checkbox" data-check-id="${id}" ${checked?'checked':''}><span>${TP.esc(label)}</span></label>`;
      }).join('')}</div>`);
    }
    if (departure?.groups?.length) {
      parts.push(`<h3 class="section-spaced">${TP.esc(departure.title||'出發 Checklist')}</h3><p class="subtle">${TP.esc(departure.desc||'')}</p>`);
      for (const group of departure.groups) {
        parts.push(`<h3>${TP.esc(group.title||'')}</h3><div class="checklist">${group.items.map(item=>{
          const checked=TP.state.get(ctx,'departureChecklist',item.id,false)===true;
          return `<label class="check-item"><input type="checkbox" data-departure-id="${TP.esc(item.id)}" ${checked?'checked':''}><span>${TP.esc(item.label)}</span></label>`;
        }).join('')}</div>`);
      }
    }
    if (!parts.length) return '';
    return `<section class="panel" id="checklist"><div class="panel-head"><h2>🎒 Checklist</h2></div><div class="panel-body">${parts.join('')}</div></section>`;
  };

  async function render() {
    try {
      const ctx=await TP.init('tripInfo');
      const [info,hotels,departure]=await Promise.all([
        TP.loadData(ctx,'tripInfo'),TP.loadData(ctx,'hotels',true),TP.loadData(ctx,'departureChecklist',true)
      ]);
      const app=document.getElementById('app');
      const standardSections=[
        ['transport',info.transport],['car',info.car],
        ['parking',info.parking],['hardcuts',info.hardCuts],
        ['weather',info.weather],['emergency',info.emergency]
      ];
      app.innerHTML=`
        <section class="panel"><div class="panel-body"><h1 class="page-title">${TP.esc(info.overview?.title||ctx.config.name)}</h1><p>${TP.esc(info.overview?.summary||'')}</p><p class="subtle">${TP.esc(info.overview?.note||'')}</p>
          ${info.overview?.highlights?.length?`<div class="grid-3">${info.overview.highlights.map(h=>`<div class="card"><h3>${TP.esc(h.title)}</h3><p>${TP.esc(h.text)}</p></div>`).join('')}</div>`:''}
        </div></section>
        ${standardSections.map(([id,s])=>s?cardSection({...s,id}):'').join('')}
        ${hotelSection(info,hotels)}
        ${(info.customSections||[]).map(customSection).join('')}
        ${checklistSection(ctx,info,departure)}
      `;
      app.querySelectorAll('[data-check-id]').forEach(el=>el.addEventListener('change',()=>TP.state.set(ctx,'checklist',el.dataset.checkId,el.checked)));
      app.querySelectorAll('[data-departure-id]').forEach(el=>el.addEventListener('change',()=>TP.state.set(ctx,'departureChecklist',el.dataset.departureId,el.checked)));
    } catch (error) { TP.renderError(error); }
  }
  render();
})();