const CACHE_NAME='travelpilot-poc-standard-v12-round7-20261007';
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
  './assets/standard-app-v1.css',
  './assets/standard-home-v1.js',
  './assets/standard-core-v1.js',
  './assets/standard-modes-v1.js',
  './assets/standard-render-itinerary-v1.js',
  './assets/standard-render-trip-info-v1.js',
  './assets/standard-render-attractions-v1.js',
  './assets/standard-render-live-v1.js',
  './trips/registry.json'
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
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==location.origin)return;

  const networkFirst=async()=>{
    try{
      const response=await fetch(request,{cache:'no-store'});
      return put(await caches.open(CACHE_NAME),request,response);
    }catch(error){
      const cached=await caches.match(request,{ignoreSearch:true});
      if(cached)return cached;
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
