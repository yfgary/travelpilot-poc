(function(){
'use strict';

if(window.__japan2027AttractionGroupFixV2)return;
window.__japan2027AttractionGroupFixV2=true;

const ORDER=['松本','輕井澤','上田','小布施／中野','澀溫泉／山之內','須坂','白馬','高山','奧飛驒／新穗高／平湯','白川鄉','飛驒古川','安曇野'];
const MOVES={
  'matsumoto-projection':{group:'松本',day:'D1',note:'夜景 Bonus'},
  'aeon-matsumoto':{group:'松本',day:'D9',note:'回程補貨'},
  'mountain-harbor':{group:'白馬',day:'D5',note:'白馬岩岳山頂'},
  'white-park':{group:'白馬',day:'D5',note:'白馬岩岳山頂'},
  'takayama-supermarket':{group:'高山',day:'D6–D8',note:'高山市區日'}
};

function slug(v){return 'loc-'+v.replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');}
function section(name){return document.getElementById(slug(name));}
function findItem(id){return document.getElementById('spot-'+id)||document.getElementById('v2-'+id)||null;}
function setDay(item,meta){
  const d=item.querySelector('.catalog-day');
  if(!d)return;
  d.innerHTML=meta.day+(meta.note?'<small>'+meta.note+'</small>':'');
}
function updateCount(sec){
  if(!sec)return;
  const count=sec.querySelectorAll('.catalog-item').length;
  const s=sec.querySelector('.cat-group-head span');
  if(s)s.textContent=count+' 個';
  sec.hidden=count===0;
}
function rebuildNav(){
  const nav=document.getElementById('locationNav');if(!nav)return;
  nav.innerHTML=ORDER.map(name=>{
    const sec=section(name);if(!sec)return'';
    const count=sec.querySelectorAll('.catalog-item').length;
    if(!count)return'';
    return '<a href="#'+sec.id+'">'+name+' <b>'+count+'</b></a>';
  }).join('');
}
function moveKnownItems(){
  Object.entries(MOVES).forEach(([id,meta])=>{
    const item=findItem(id);if(!item)return;
    const target=section(meta.group)?.querySelector('.catalog-timeline');
    if(!target)return;
    if(item.parentElement!==target)target.appendChild(item);
    setDay(item,meta);
  });
}
function rescueOtherByText(){
  const other=section('其他');if(!other)return;
  [...other.querySelectorAll('.catalog-item')].forEach(item=>{
    const t=(item.textContent||'').replace(/\s+/g,' ');
    let group='';
    if(/松本|Matsumoto|イオンモール松本/.test(t))group='松本';
    else if(/白馬|岩岳|HAKUBA|IWATAKE/.test(t))group='白馬';
    else if(/高山|飛驒|飛騨|Takayama/.test(t))group='高山';
    else if(/新穗高|新穂高|平湯|奥飛騨|奧飛驒/.test(t))group='奧飛驒／新穗高／平湯';
    else if(/白川鄉|白川郷|荻町/.test(t))group='白川鄉';
    else if(/飛驒古川|飛騨古川|三寺/.test(t))group='飛驒古川';
    else if(/安曇野|大王わさび|山葵/.test(t))group='安曇野';
    else if(/輕井澤|軽井沢|白絲|白糸|鬼押/.test(t))group='輕井澤';
    else if(/小布施|中野|北齋|北斎|Oranche/.test(t))group='小布施／中野';
    else if(/澀溫泉|渋温泉|地獄谷|山之內|山ノ内/.test(t))group='澀溫泉／山之內';
    else if(/須坂/.test(t))group='須坂';
    else if(/上田/.test(t))group='上田';
    if(!group)return;
    const target=section(group)?.querySelector('.catalog-timeline');
    if(target)target.appendChild(item);
  });
}
function run(){
  if(!document.querySelector('.catalog-item'))return false;
  moveKnownItems();
  rescueOtherByText();
  document.querySelectorAll('.cat-group').forEach(updateCount);
  const other=section('其他');
  if(other&&!other.querySelector('.catalog-item'))other.remove();
  rebuildNav();
  return true;
}

function boot(){
  if(run())return;
  [80,180,400,800,1400].forEach(t=>setTimeout(run,t));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
