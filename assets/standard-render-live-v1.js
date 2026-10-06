(() => {
  'use strict';
  const TP=window.TravelPilot;

  const cameraHtml=cam=>{
    const media=cam.type==='youtube'&&cam.videoId
      ? `<iframe class="video" src="https://www.youtube-nocookie.com/embed/${TP.esc(cam.videoId)}" title="${TP.esc(cam.title)}" loading="lazy" allowfullscreen></iframe>`
      : cam.type==='image'&&cam.imageUrl
        ? `<img class="camera-image" src="${TP.esc(cam.imageUrl)}" alt="${TP.esc(cam.title)}" loading="lazy">`
        : '';
    return `<article class="live-camera">
      <div class="badges"><span class="badge">${TP.esc(cam.type)}</span>${cam.priority?`<span class="badge ${cam.priority==='must'?'warn':''}">${TP.esc(cam.priority)}</span>`:''}${(cam.tags||[]).map(t=>`<span class="badge">${TP.esc(t)}</span>`).join('')}</div>
      <h3>${TP.esc(cam.title)}</h3>
      ${cam.desc?`<p class="subtle">${TP.esc(cam.desc)}</p>`:''}
      ${media}
      <div class="actions">
        ${cam.sourceUrl?`<a class="btn primary" href="${TP.esc(cam.sourceUrl)}" target="_blank" rel="noopener">${TP.esc(cam.sourceLabel||'官方來源')}</a>`:''}
        ${cam.map?`<a class="btn" href="${TP.mapUrl(cam.map)}" target="_blank" rel="noopener">📍 地圖</a>`:''}
      </div>
    </article>`;
  };

  async function render(){
    try{
      const ctx=await TP.init('liveCam');
      const data=await TP.loadData(ctx,'liveCams');
      const byId=new Map((data.cameras||[]).map(c=>[c.id,c]));
      const app=document.getElementById('app');
      app.innerHTML=`
        <section class="panel"><div class="panel-body"><h1 class="page-title">📹 Live Cam</h1><p class="subtle">${TP.esc(data.notice||ctx.config.name)}</p></div></section>
        ${(data.days||[]).map(day=>`
          <section class="live-day" id="${TP.esc(day.id)}">
            <div class="live-head"><div class="badges"><span class="badge">${TP.esc(day.label||day.id.toUpperCase())}</span><span class="badge">${TP.esc(day.date||'')}</span></div><h2>${TP.esc(day.title)}</h2><p class="subtle">${TP.esc(day.desc||'')}</p><div class="route">${TP.esc(day.route||'')}</div></div>
            <div class="live-body">
              ${(day.cameras||[]).map(id=>byId.get(id)).filter(Boolean).map(cameraHtml).join('')}
              ${day.places?.length?`<div class="actions">${day.places.map(p=>`<a class="btn" href="${TP.mapUrl(p.map)}" target="_blank" rel="noopener">📍 ${TP.esc(p.label)}</a>`).join('')}</div>`:''}
              ${day.officialLinks?.length?`<div class="actions">${day.officialLinks.map(l=>`<a class="btn" href="${TP.esc(l.url)}" target="_blank" rel="noopener">${TP.esc(l.label)}</a>`).join('')}</div>`:''}
            </div>
          </section>`).join('') || '<section class="panel"><div class="panel-body empty">呢個 Trip 未設定 Live Cam。</div></section>'}
      `;
    }catch(error){TP.renderError(error);}
  }
  render();
})();