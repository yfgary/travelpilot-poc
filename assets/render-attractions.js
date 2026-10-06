(() => {
  'use strict';
  const TP=window.TravelPilot;

  const modalHtml=a=>`
    <h2 id="modalTitle">${TP.esc(a.name)}</h2>
    ${a.localName?`<p class="subtle">${TP.esc(a.localName)}</p>`:''}
    ${a.score!=null?`<p class="score">★ ${TP.esc(a.score)} / 10</p>`:''}
    ${[['簡介',a.summary||a.info],['歷史／背景',a.history],['去到睇乜',a.visit],['交通／到達',a.access],['冬季／天氣注意',a.winter],['實用提示',a.tips],['評分原因',a.scoreReason]].filter(([,v])=>v).map(([h,v])=>`<h3>${TP.esc(h)}</h3><p>${TP.esc(v)}</p>`).join('')}
    ${a.highlights?.length?`<h3>重點</h3><ul>${a.highlights.map(x=>`<li>${TP.esc(x)}</li>`).join('')}</ul>`:''}
    ${a.sources?.length?`<h3>資料來源</h3><div class="actions">${a.sources.map(s=>`<a class="btn" href="${TP.esc(s.url)}" target="_blank" rel="noopener">${TP.esc(s.label||s.title||'來源')}</a>`).join('')}</div>`:''}
  `;

  async function render(){
    try{
      const ctx=await TP.init('attractions');
      const data=await TP.loadData(ctx,'attractions');
      const app=document.getElementById('app');
      app.innerHTML=`
        <section class="panel"><div class="panel-body"><h1 class="page-title">🗾 景點總覽</h1><p class="subtle">${TP.esc(ctx.config.name)} · ${data.attractions.length} 個景點</p></div></section>
        <div class="attractions-grid">${data.attractions.map(a=>`
          <article class="attraction-card">
            <div class="card-body">
              <div class="badges">
                <span class="badge">${TP.esc(a.location||'')}</span>
                <span class="badge ${a.status==='main'?'good':'warn'}">${TP.esc(a.status||'')}</span>
                ${a.day?`<span class="badge">${TP.esc(a.day)}</span>`:''}
              </div>
              <h2>${TP.esc(a.name)}</h2>
              ${a.localName?`<div class="local-name">${TP.esc(a.localName)}</div>`:''}
              ${a.score!=null?`<div class="score">★ ${TP.esc(a.score)} / 10</div>`:''}
              <p>${TP.esc(a.summary||a.info||'')}</p>
              <div class="actions">
                ${a.map?`<a class="btn" href="${TP.mapUrl(a.map)}" target="_blank" rel="noopener">📍 地圖</a>`:''}
                <button class="btn primary" type="button" data-info="${TP.esc(a.id)}">ⓘ 詳細資料</button>
              </div>
            </div>
          </article>`).join('')}</div>`;
      app.querySelectorAll('[data-info]').forEach(btn=>btn.addEventListener('click',()=>{
        const a=data.attractions.find(x=>x.id===btn.dataset.info); if(a)TP.openModal(modalHtml(a));
      }));
    }catch(error){TP.renderError(error);}
  }
  render();
})();