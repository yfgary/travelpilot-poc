(() => {
  'use strict';
  const TP = window.TravelPilot;

  const badgeHtml = badge => {
    if (typeof badge === 'string') return `<span class="badge">${TP.esc(badge)}</span>`;
    const tone = badge?.tone ? ' '+TP.esc(badge.tone) : '';
    return `<span class="badge${tone}">${TP.esc(badge?.label || badge?.text || '')}</span>`;
  };

  const mediaItem = item => {
    if (!item?.src) return '';
    const credit = item.credit?.label
      ? `<span class="credit"> · ${item.credit.url ? `<a href="${TP.esc(item.credit.url)}" target="_blank" rel="noopener">${TP.esc(item.credit.label)}</a>` : TP.esc(item.credit.label)}</span>`
      : '';
    return `<figure>
      <img src="${TP.esc(item.src)}" alt="${TP.esc(item.alt || item.caption || '')}" loading="lazy" data-zoom-src="${TP.esc(item.src)}" data-zoom-caption="${TP.esc(item.caption || item.alt || '')}">
      <figcaption class="caption">${TP.esc(item.caption || '')}${credit}</figcaption>
    </figure>`;
  };

  const renderMedia = media => {
    if (!media?.hero && !media?.gallery?.length) return '';
    return `<div class="media">
      ${media.hero ? `<div class="hero-media">${mediaItem(media.hero)}</div>` : ''}
      ${media.gallery?.length ? `<div class="gallery">${media.gallery.map(mediaItem).join('')}</div>` : ''}
    </div>`;
  };

  const lookupHotel = (hotels, id) => hotels?.hotels?.find(h => h.id === id);
  const lookupAttraction = (attractions, id) => attractions?.attractions?.find(a => a.id === id);
  const weatherCard = (day, weather) => {
    const key = weather?.dayRegions?.[day.id] || day.weatherRegion;
    const region = key ? weather?.regions?.[key] : null;
    if (!region) return '';
    const profiles = (region.activityProfiles || []).map(p => typeof p === 'string' ? p : p.id).filter(Boolean);
    return `<div class="section-strip"><strong>🌤️ ${TP.esc(region.label || region.name || key)}</strong>
      ${profiles.length ? `<div class="badges">${profiles.map(p=>`<span class="badge">${TP.esc(p)}</span>`).join('')}</div>` : ''}
      ${region.scoreNote ? `<div class="subtle">${TP.esc(region.scoreNote)}</div>` : ''}
    </div>`;
  };

  const hotelMarker = (label, hotel) => hotel ? `
    <div class="hotel-marker">
      <strong>${TP.esc(label)}：${TP.esc(hotel.name)}</strong>
      <div class="subtle">${TP.esc(hotel.address || '')}</div>
      <div class="actions">
        ${hotel.map ? `<a class="btn" href="${TP.mapUrl(hotel.map)}" target="_blank" rel="noopener">📍 地圖</a>` : ''}
        ${hotel.checkIn ? `<span class="badge">Check-in ${TP.esc(hotel.checkIn)}</span>` : ''}
        ${hotel.checkOut ? `<span class="badge">Check-out ${TP.esc(hotel.checkOut)}</span>` : ''}
      </div>
    </div>` : '';

  const timelineItem = (ctx, item, attractions, hotels) => {
    const attraction = lookupAttraction(attractions, item.attractionId);
    const hotel = lookupHotel(hotels, item.hotelId);
    const title = item.title || attraction?.name || hotel?.name || '';
    const localName = item.localName || attraction?.localName || '';
    const description = item.description || item.note || attraction?.summary || '';
    const map = item.map || attraction?.map || hotel?.map || '';
    const badges = [...(item.badges || [])];
    if (item.durationMinutes) badges.push({label:`約 ${item.durationMinutes} 分鐘`});
    if (item.hardCut) badges.push({label:'Hard Cut',tone:'warn'});
    return `<div class="timeline-item">
      <div class="time">${TP.esc(item.time)}</div>
      <article class="timeline-card">
        <div class="badges"><span class="badge">${TP.esc(item.type)}</span>${badges.map(badgeHtml).join('')}</div>
        <h3>${TP.esc(title)}</h3>
        ${localName ? `<div class="local-name">${TP.esc(localName)}</div>` : ''}
        ${description ? `<p>${TP.esc(description)}</p>` : ''}
        ${item.price ? `<div class="badge good">💴 ${TP.esc(item.price)}</div>` : ''}
        <div class="actions">
          ${map ? `<a class="btn" href="${TP.mapUrl(map)}" target="_blank" rel="noopener">📍 地圖</a>` : ''}
          ${map && (item.type === 'drive' || item.type === 'car') ? `<a class="btn primary" href="${TP.directionsUrl(map)}" target="_blank" rel="noopener">🚗 導航</a>` : ''}
          ${item.links?.map(l => `<a class="btn" href="${TP.esc(l.href)}" target="_blank" rel="noopener">${TP.esc(l.label)}</a>`).join('') || ''}
          ${attraction ? `<button class="btn" type="button" data-attraction-info="${TP.esc(attraction.id)}">ⓘ 景點資料</button>` : ''}
        </div>
      </article>
    </div>`;
  };

  const strip = (title, items, tone='') => {
    if (!items?.length) return '';
    return `<div class="section-strip ${tone}"><strong>${TP.esc(title)}</strong>
      ${items.map(x => typeof x === 'string' ? `<div>• ${TP.esc(x)}</div>` : `<div>• ${TP.esc(x.title || x.label || x.text || '')}</div>`).join('')}
    </div>`;
  };

  const attractionModal = a => {
    const sections = [
      ['簡介',a.summary || a.info],
      ['歷史／背景',a.history],
      ['去到睇乜',a.visit],
      ['交通／到達',a.access],
      ['冬季／天氣注意',a.winter],
      ['實用提示',a.tips],
      ['評分原因',a.scoreReason],
      ['營業時間',a.openingHours],
      ['最後入場／受付',a.lastEntry],
      ['關門時間',a.closingTime],
      ['票價',a.fee],
      ['營業／票價備註',a.visitNote],
      ['建議停留',a.duration]
    ].filter(([,v]) => v);
    return `<h2 id="modalTitle">${TP.esc(a.name)}</h2>
      ${a.localName ? `<p class="subtle">${TP.esc(a.localName)}</p>` : ''}
      ${a.score != null ? `<p class="score">★ ${TP.esc(a.score)} / 10</p>` : ''}
      ${sections.map(([h,v]) => `<h3>${TP.esc(h)}</h3><p class="rich-text">${TP.esc(v)}</p>`).join('')}
      ${a.highlights?.length ? `<h3>重點</h3><ul>${a.highlights.map(x=>`<li>${TP.esc(x)}</li>`).join('')}</ul>` : ''}
      ${a.sources?.length ? `<h3>資料來源</h3><div class="actions">${a.sources.map(s=>`<a class="btn" href="${TP.esc(s.url)}" target="_blank" rel="noopener">${TP.esc(s.label || s.title || '來源')}</a>`).join('')}</div>` : ''}
    `;
  };

  async function render() {
    try {
      const ctx = await TP.init('itinerary');
      const [itinerary, attractions, hotels, weather] = await Promise.all([
        TP.loadData(ctx,'itinerary'),
        TP.loadData(ctx,'attractions',true),
        TP.loadData(ctx,'hotels',true),
        TP.loadData(ctx,'weather',true)
      ]);
      const app = document.getElementById('app');
      app.innerHTML = `
        <section class="panel">
          <div class="panel-body">
            <h1 class="page-title">🗓️ ${TP.esc(ctx.config.name)}</h1>
            <p class="subtle">${TP.esc(ctx.config.subtitle || '')}</p>
            <div id="modeBar" class="mode-bar"></div>
          </div>
        </section>
        <div id="days">${itinerary.days.map((day, index) => {
          const startHotel = index > 0 ? lookupHotel(hotels, itinerary.days[index-1].hotelId) : null;
          const endHotel = lookupHotel(hotels, day.hotelId);
          return `<section class="day-card" id="${TP.esc(day.id)}">
            <div class="day-head">
              <div class="badges"><span class="badge">D${TP.esc(day.day)}</span>${day.driving ? '<span class="badge">🚗 自駕</span>' : ''}</div>
              <h2>${TP.esc(day.title)}</h2>
              <div class="day-meta"><span>${TP.esc(day.date)}</span>${day.weatherRegion ? `<span>🌤️ ${TP.esc(day.weatherRegion)}</span>` : ''}</div>
              <div class="route">${TP.esc(day.route)}</div>
            </div>
            <div class="day-body">
              ${day.highlights?.length ? `<div class="highlight-grid">${day.highlights.map(h=>`<div class="highlight"><strong>${TP.esc((h.icon||'⭐')+' '+(h.title||''))}</strong><span>${TP.esc(h.text||'')}</span></div>`).join('')}</div>` : ''}
              ${weatherCard(day, weather)}
              ${renderMedia(day.media)}
              ${hotelMarker('今朝出發酒店',startHotel)}
              ${day.hardCuts?.length ? `<div class="section-strip warning"><strong>⏰ Hard Cut</strong>${day.hardCuts.map(h=>`<div>• ${TP.esc(h.time)} ${TP.esc(h.label || h.text || '')}</div>`).join('')}</div>` : ''}
              <div class="timeline">${(day.items || []).map(item=>timelineItem(ctx,item,attractions,hotels)).join('')}</div>
              ${hotelMarker('今晚酒店',endHotel)}
              ${strip('🔄 Backup',day.backups)}
              ${strip('✨ Bonus',day.bonus)}
              ${strip('⚠️ 注意',day.constraints,'warning')}
            </div>
          </section>`;
        }).join('')}</div>
      `;

      app.querySelectorAll('[data-zoom-src]').forEach(img => img.addEventListener('click', () => {
        TP.openModal(`<h2 id="modalTitle">${TP.esc(img.dataset.zoomCaption || img.alt || '相片')}</h2><img class="modal-photo" src="${TP.esc(img.dataset.zoomSrc)}" alt="${TP.esc(img.alt || '')}">`);
      }));
      app.querySelectorAll('[data-attraction-info]').forEach(btn => btn.addEventListener('click', () => {
        const a = lookupAttraction(attractions, btn.dataset.attractionInfo);
        if (a) TP.openModal(attractionModal(a));
      }));

      if (window.TravelPilotModes) window.TravelPilotModes.mount(ctx,itinerary,attractions,hotels);
    } catch (error) { TP.renderError(error); }
  }

  render();
})();