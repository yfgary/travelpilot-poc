(function(){
'use strict';
if(window.__multiTripCatalogLinkV3)return;
window.__multiTripCatalogLinkV3=true;

function isCatalogLink(a){
  if(!a)return false;
  const raw=a.getAttribute('href')||'';
  try{
    const u=new URL(raw,location.href);
    return /(?:^|\/)attractions\.html$/.test(u.pathname);
  }catch(e){
    return /(?:^|\/)attractions\.html(?:[?#]|$)/.test(raw);
  }
}

function desiredHref(){
  const raw='attractions.html';
  if(window.MultiTrip&&typeof window.MultiTrip.withTrip==='function')return window.MultiTrip.withTrip(raw);
  const id=new URLSearchParams(location.search).get('trip')||localStorage.getItem('multiTrip.activeTrip')||'';
  return id?raw+'?trip='+encodeURIComponent(id):raw;
}

function add(){
  document.querySelectorAll('.page-switch').forEach(sw=>{
    const links=Array.from(sw.querySelectorAll('a')).filter(isCatalogLink);
    let a=links.shift();
    links.forEach(dup=>dup.remove());

    if(!a){
      a=document.createElement('a');
      a.textContent='🗾 景點總覽';
      sw.appendChild(a);
    }

    a.href=desiredHref();
    a.dataset.catalogLink='1';
    a.classList.toggle('active',/(?:^|\/)attractions\.html$/.test(location.pathname));
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();
if(window.MultiTrip&&window.MultiTrip.ready)window.MultiTrip.ready.then(add);
[250,900,1800].forEach(t=>setTimeout(add,t));
})();
