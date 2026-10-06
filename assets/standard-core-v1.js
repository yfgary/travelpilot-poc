(() => {
  'use strict';

  const cache = new Map();
  const qs = new URLSearchParams(location.search);

  const esc = (value='') => String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);

  const fetchJson = async path => {
    if (cache.has(path)) return cache.get(path);
    const response = await fetch(path, {cache:'no-store'});
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    const value = await response.json();
    cache.set(path, value);
    return value;
  };

  const tripPath = (ctx, file) => `trips/${encodeURIComponent(ctx.tripId)}/${file}`;
  const dataUrl = (ctx, key) => {
    const file = ctx.config.dataFiles?.[key];
    if (!file) return null;
    return tripPath(ctx, file);
  };

  const loadData = async (ctx, key, optional=false) => {
    const path = dataUrl(ctx, key);
    if (!path) {
      if (optional) return null;
      throw new Error(`Trip ${ctx.tripId} has no dataFiles.${key}`);
    }
    return fetchJson(path);
  };

  const link = (ctx, page, hash='') => {
    const url = new URL(page, location.href);
    url.searchParams.set('trip', ctx.tripId);
    if (hash) url.hash = hash;
    return url.pathname.split('/').pop() + url.search + url.hash;
  };

  const mapUrl = query => query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : '#';

  const directionsUrl = query => query
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
    : '#';

  const stateKey = (ctx, feature, subkey='') =>
    ['multiTrip', feature, ctx.tripId, subkey].filter(Boolean).join('.');

  const state = {
    get(ctx, feature, subkey, fallback=null) {
      try {
        const raw = localStorage.getItem(stateKey(ctx, feature, subkey));
        return raw == null ? fallback : JSON.parse(raw);
      } catch (_) { return fallback; }
    },
    set(ctx, feature, subkey, value) {
      localStorage.setItem(stateKey(ctx, feature, subkey), JSON.stringify(value));
    },
    remove(ctx, feature, subkey) {
      localStorage.removeItem(stateKey(ctx, feature, subkey));
    }
  };

  const feature = (ctx, name) => ctx.config.features?.[name] === true;

  const pageItems = ctx => [
    ['itinerary','🗓️ 詳細行程',ctx.config.pages?.itinerary || 'itinerary.html'],
    ['tripInfo','🧳 旅程資料',ctx.config.pages?.tripInfo || 'trip-info.html'],
    ['attractions','🗾 景點總覽',ctx.config.pages?.attractions || 'attractions.html'],
    ['liveCam','📹 Live Cam',ctx.config.pages?.liveCam || 'live.html']
  ].filter(([key]) => feature(ctx, key));

  const renderShell = (ctx, active) => {
    document.title = `${ctx.config.shortName || ctx.config.name}｜TravelPilot POC`;
    const root = document.getElementById('site');
    root.innerHTML = `
      <header class="site-header">
        <a class="brand" href="${link(ctx,'index.html')}">
          <span class="brand-mark">TP</span>
          <span><strong>TravelPilot Standard POC</strong><small>${esc(ctx.config.shortName || ctx.config.name)}</small></span>
        </a>
        <span class="poc-badge">POC</span>
      </header>
      <nav class="page-nav" aria-label="主要頁面">
        ${pageItems(ctx).map(([key,label,page]) => `
          <a class="${key===active?'active':''}" href="${link(ctx,page)}">${label}</a>
        `).join('')}
      </nav>
      <main id="app" class="app-shell"><div class="loading">載入旅程資料…</div></main>
      <div id="modal" class="modal" hidden>
        <button class="modal-backdrop" data-close-modal aria-label="關閉"></button>
        <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <button class="modal-close" data-close-modal aria-label="關閉">×</button>
          <div id="modalBody"></div>
        </section>
      </div>
    `;
    root.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
  };

  const openModal = html => {
    const modal = document.getElementById('modal');
    document.getElementById('modalBody').innerHTML = html;
    modal.hidden = false;
    document.body.classList.add('modal-open');
  };

  function closeModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  const renderError = error => {
    const app = document.getElementById('app');
    if (app) app.innerHTML = `<section class="panel error"><h2>載入失敗</h2><p>${esc(error.message || error)}</p></section>`;
  };

  const init = async active => {
    const registry = await fetchJson('trips/registry.json');
    const requested = (qs.get('trip') || registry.defaultTrip || '').trim();
    const entry = registry.trips.find(t => t.id === requested) || registry.trips[0];
    if (!entry) throw new Error('registry.json 沒有旅程');
    const config = await fetchJson(entry.config || `trips/${entry.id}/trip.json`);
    const ctx = {tripId:entry.id, registry, entry, config};
    renderShell(ctx, active);
    return ctx;
  };

  window.TravelPilot = {
    esc, fetchJson, loadData, dataUrl, link, mapUrl, directionsUrl,
    stateKey, state, feature, init, openModal, closeModal, renderError
  };
})();