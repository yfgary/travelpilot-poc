(() => {
  'use strict';

  const PAGE_TO_RENDERER={
    'itinerary.html':'itinerary',
    'trip-info.html':'tripInfo',
    'attractions.html':'attractions',
    'live.html':'liveCam'
  };
  const page=location.pathname.split('/').pop()||'itinerary.html';
  const rendererKey=PAGE_TO_RENDERER[page]||'itinerary';
  const params=new URLSearchParams(location.search);

  const escapeHtml=value=>String(value??'').replace(/[&<>"]/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'
  })[ch]);

  const fail=message=>{
    document.body.innerHTML='<main style="font-family:Arial,sans-serif;padding:24px"><h1>TravelPilot POC</h1><p>'+escapeHtml(message)+'</p></main>';
  };

  (async()=>{
    try{
      const registryResponse=await fetch('trips/registry.json',{cache:'no-store'});
      if(!registryResponse.ok)throw new Error('無法載入旅程清單');
      const registry=await registryResponse.json();

      let stored='';
      try{stored=localStorage.getItem('multiTrip.activeTrip')||'';}catch(_){}
      const requested=(params.get('trip')||stored||registry.defaultTrip||'').trim();
      const entry=registry.trips.find(t=>t.id===requested)
        || registry.trips.find(t=>t.id===registry.defaultTrip)
        || registry.trips[0];
      if(!entry)throw new Error('沒有可用旅程');

      params.set('trip',entry.id);
      const configPath=entry.config||('trips/'+entry.id+'/trip.json');
      const configResponse=await fetch(configPath,{cache:'no-store'});
      if(!configResponse.ok)throw new Error('無法載入旅程設定：'+entry.id);
      const config=await configResponse.json();

      const renderer=config.renderers?.[rendererKey];
      const standard=Number(config.schemaVersion)>=12
        && !config.legacy
        && renderer?.mode==='generate';

      const target=(standard?'standard/':'legacy/')+page+'?'+params.toString()+location.hash;
      location.replace(target);
    }catch(error){
      fail(error?.message||error);
    }
  })();
})();