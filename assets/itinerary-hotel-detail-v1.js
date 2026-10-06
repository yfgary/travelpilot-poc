(function(){
'use strict';
if(window.__multiTripItineraryHotelDetailV1)return;
window.__multiTripItineraryHotelDetailV1=true;
if(!/(?:^|\/)itinerary\.html$/.test(location.pathname))return;

const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const mapUrl=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q||'');

function ensureStyle(){
 if(document.getElementById('multiTripItineraryHotelStyle'))return;
 const s=document.createElement('style');
 s.id='multiTripItineraryHotelStyle';
 s.textContent=`
 .multi-trip-itinerary-hotel{margin:11px 0 16px;padding:12px 14px;border:1px solid #dce5ec;border-radius:10px;background:#f7f9fb;box-shadow:0 1px 3px rgba(0,0,0,.03)}
 .mti-hotel-head{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-bottom:9px}
 .mti-hotel-title{font-weight:800;color:#1f4e79;font-size:12px}
 .mti-hotel-name{font-weight:800;color:#263f52;font-size:15px}
 .mti-hotel-status{font-size:10px;font-weight:800;padding:3px 7px;border-radius:10px;background:#e7f4e9;color:#317147}
 .mti-hotel-map{display:inline-flex;align-items:center;justify-content:center;width:27px;height:27px;border-radius:50%;background:#e4f3e9;border:1px solid #bddac6;text-decoration:none;font-size:14px}
 .mti-hotel-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
 .mti-hotel-col{background:#fff;border:1px solid #e7ecef;border-radius:8px;padding:8px 9px;font-size:11px;line-height:1.5;color:#56656f;min-width:0}
 .mti-hotel-col-title{font-weight:800;color:#1f4e79;margin-bottom:5px;font-size:11px}
 .mti-hotel-line{margin:2px 0;overflow-wrap:anywhere}
 .mti-hotel-line strong{color:#263f52}
 .mti-hotel-arrival{margin-top:6px;padding:6px 7px;border-radius:6px;background:#eef7ef;border:1px solid #cfe2d2;color:#285f38;font-weight:700}
 .mti-hotel-arrival.pay{background:#fff1ef;border-color:#edcbc5;color:#9a342b}
 .mti-hotel-arrival.tax{background:#fff7df;border-color:#ead99d;color:#785b00}
 .mti-hotel-note{margin-top:8px;padding-top:7px;border-top:1px dashed #d6dee5;color:#6a7780;font-size:11px;line-height:1.5}
 @media(max-width:900px){.mti-hotel-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mti-hotel-col:last-child{grid-column:1/-1}}
 @media(max-width:620px){.mti-hotel-grid{grid-template-columns:1fr}.mti-hotel-col:last-child{grid-column:auto}}
 `;
 document.head.appendChild(s);
}

function line(icon,label,val){
 return val?'<div class="mti-hotel-line">'+icon+' <strong>'+esc(label)+'：</strong>'+esc(val)+'</div>':'';
}
function arrivalClass(h){
 const tags=h&&h.badges||[];
 if(tags.includes('arrival-pay'))return' pay';
 if(tags.includes('arrival-tax'))return' tax';
 return'';
}
function renderDay(day){
 if(!day||!day.hotelId||!window.MultiTripData)return;
 const h=window.MultiTripData.hotel(day.hotelId);
 const dayEl=document.getElementById(day.id);
 if(!h||!dayEl)return;
 const host=dayEl.querySelector('.day-content')||dayEl;
 let card=dayEl.querySelector('.multi-trip-itinerary-hotel');
 if(!card){card=document.createElement('section');card.className='multi-trip-itinerary-hotel';host.appendChild(card);}
 const stay=(h.checkIn||h.checkOut)?((h.checkIn||'—')+' → '+(h.checkOut||'—')):'';
 const mapQ=h.map||h.name||'';
 card.dataset.hotelId=day.hotelId;
 card.innerHTML=
  '<div class="mti-hotel-head">'
  +'<span class="mti-hotel-title">🏨 酒店預訂資料</span>'
  +'<span class="mti-hotel-name">'+esc(h.name||h.en||day.hotelId)+'</span>'
  +(h.statusLabel?'<span class="mti-hotel-status">'+esc(h.statusLabel)+'</span>':'')
  +(mapQ?'<a class="mti-hotel-map" href="'+mapUrl(mapQ)+'" target="_blank" rel="noopener" title="Google Maps">📍</a>':'')
  +'</div>'
  +'<div class="mti-hotel-grid">'
   +'<div class="mti-hotel-col"><div class="mti-hotel-col-title">💳 付款</div>'
    +line('💰','總價',h.totalPrice)
    +line('💳','已付／付款狀態',h.paidAmount)
    +(h.arrivalPayment?'<div class="mti-hotel-arrival'+arrivalClass(h)+'">'+esc(h.arrivalPayment)+'</div>':'')
   +'</div>'
   +'<div class="mti-hotel-col"><div class="mti-hotel-col-title">🛏️ 住宿</div>'
    +line('🛏️','房型',h.room)
    +line('🍽️','餐飲',h.meals)
    +line('🕒','入住／退房',stay)
   +'</div>'
   +'<div class="mti-hotel-col"><div class="mti-hotel-col-title">📍 實用資料</div>'
    +line('📍','地址',h.address)
    +line('☎️','電話',h.phone)
    +line('🚗','停車',h.parking)
    +line('↩️','取消條款',h.cancellation)
   +'</div>'
  +'</div>'
  +(h.note?'<div class="mti-hotel-note">'+esc(h.note)+'</div>':'');
}
function renderAll(){
 ensureStyle();
 const data=window.MultiTripData&&window.MultiTripData.all('itinerary');
 const ds=data&&Array.isArray(data.days)?data.days:[];
 ds.forEach(renderDay);
}

Promise.all([
 window.MultiTrip&&window.MultiTrip.ready?window.MultiTrip.ready:Promise.resolve(),
 window.MultiTripData&&window.MultiTripData.ready?window.MultiTripData.ready:Promise.resolve()
]).then(()=>{[0,350,900,1800,2800].forEach(t=>setTimeout(renderAll,t));}).catch(()=>{});

document.addEventListener('multitrip:itineraryrendered',()=>setTimeout(renderAll,40));
})();
