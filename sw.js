const CACHE_NAME='travelpilot-v10.18.0-20261007';
const CORE=[
  './',
  './index.html',
  './itinerary.html',
  './trip-info.html',
  './attractions.html',
  './live.html',
  './manifest.webmanifest',
  './assets/travelpilot-home.css',
  './assets/images/travelpilot-icon-exact.jpg',
  './assets/images/d5-mountain-harbor.jpg',
  './assets/multi-trip-runtime-v1.js',
  './assets/attraction-info.js',
  './assets/multi-trip-context-v1.js',
  './assets/multi-trip-shared-ui-v1.css',
  './assets/multi-trip-nav-v1.js',
  './assets/multi-trip-data-v1.js',
  './assets/multi-trip-itinerary-renderer-v1.js',
  './assets/multi-trip-attractions-renderer-v1.js',
  './assets/multi-trip-live-renderer-v1.js',
  './assets/multi-trip-live-entry-v1.js',
  './assets/multi-trip-trip-info-renderer-v1.js',
  './assets/multi-trip-departure-checklist-v1.js',
  './assets/multi-trip-checklist-sync-v1.js',
  './trips/registry.json',
  './trips/shirakawago-shinhotaka-2027/trip.json',
  './trips/shirakawago-shinhotaka-2027/itinerary.json',
  './trips/shirakawago-shinhotaka-2027/trip-info.json',
  './trips/shirakawago-shinhotaka-2027/hotels.json',
  './trips/shirakawago-shinhotaka-2027/attractions.json',
  './trips/shirakawago-shinhotaka-2027/live-cams.json',
  './trips/shirakawago-shinhotaka-2027/weather.json',
  './trips/shirakawago-shinhotaka-2027/departure-checklist.json'
];

async function put(cache,request,response){
  try{if(response&&response.ok)await cache.put(request,response.clone());}catch(e){}
  return response;
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.allSettled(CORE.map(async path=>{
      try{
        const response=await fetch(path,{cache:'no-store'});
        if(response.ok)await cache.put(path,response);
      }catch(e){}
    }));
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

/* Older cached live.html copies may not contain the Standard runtime entry yet.
   Inject the same shared runtime boot used by all four pages; the runtime then
   chooses the compatibility or Standard module set. */
async function patchLive(response,url){
  if(!response||!url.pathname.endsWith('/live.html'))return response;
  try{
    let text=await response.text();
    if(!text.includes('assets/multi-trip-runtime-v1.js')){
      text=text.replace(/<\/body>/i,'<script src="assets/multi-trip-runtime-v1.js?v=10.18.0"><\/script>\n</body>');
    }
    const headers=new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    return new Response(text,{status:response.status,statusText:response.statusText,headers});
  }catch(e){return response;}
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==location.origin)return;

  const networkFirst=async()=>{
    try{
      const response=await fetch(request,{cache:'no-store'});
      const output=await patchLive(response,url);
      put(await caches.open(CACHE_NAME),request,output.clone());
      return output;
    }catch(error){
      const cached=await caches.match(request,{ignoreSearch:true});
      if(cached)return patchLive(cached,url);
      if(request.mode==='navigate')return caches.match('./index.html');
      throw error;
    }
  };

  const dynamic=
    url.pathname.endsWith('/version.json')||
    url.pathname.endsWith('/trips/registry.json')||
    /\/trips\/.*\.json$/.test(url.pathname)||
    request.mode==='navigate'||
    request.destination==='document'||
    request.destination==='script'||
    request.destination==='style';

  if(dynamic){
    event.respondWith(networkFirst());
    return;
  }

  event.respondWith(
    caches.match(request,{ignoreSearch:true}).then(async cached=>{
      if(cached)return cached;
      const response=await fetch(request);
      return put(await caches.open(CACHE_NAME),request,response);
    })
  );
});
