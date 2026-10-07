(function(){
'use strict';
if(window.Japan2027Core)return;

const VERSION='v9.1.1';
const SH_KEY='japanWinter2027_shinhotakaDay';
const WEATHER_REGION_KEY='japan2027_weather_region';
/* D6-D8 selector retired */
try{localStorage.removeItem(SH_KEY);}catch(e){}

const regions={
 matsumoto:{id:'matsumoto',name:'松本',en:'Matsumoto',jp:'松本市',label:'松本城／市區',type:'cityscenic',lat:36.2381,lon:137.9720},
 karuizawa:{id:'karuizawa',name:'輕井澤',en:'Karuizawa',jp:'軽井沢町',label:'輕井澤戶外／Outlet',type:'cityscenic',lat:36.3485,lon:138.5969},
 chikuma:{id:'chikuma',name:'千曲',en:'Chikuma',jp:'千曲市',label:'千曲',type:'road',lat:36.5330,lon:138.1200},
 yamanouchi:{id:'yamanouchi',name:'山之內／澀溫泉',en:'Yamanouchi / Shibu Onsen',jp:'山ノ内町・渋温泉',label:'地獄谷／澀溫泉',type:'snowwalk',lat:36.7344,lon:138.4331},
 nagano:{id:'nagano',name:'長野／須坂',en:'Nagano / Suzaka',jp:'長野市・須坂市',label:'長野／須坂',type:'city',lat:36.6486,lon:138.2450},
 hakuba:{id:'hakuba',name:'白馬',en:'Hakuba',jp:'白馬村',label:'白馬岩岳',type:'mountain',lat:36.6982,lon:137.8619},
 takayama:{id:'takayama',name:'高山',en:'Takayama',jp:'高山市',label:'高山市區',type:'cityscenic',lat:36.1461,lon:137.2522},
 shinhotaka:{id:'shinhotaka',name:'新穗高',en:'Shinhotaka',jp:'新穂高ロープウェイ周辺',label:'新穗高',type:'mountain',lat:36.2828,lon:137.5804},
 shirakawago:{id:'shirakawago',name:'白川鄉',en:'Shirakawa-go',jp:'白川郷・荻町',label:'白川鄉',type:'village',lat:36.2573,lon:136.9068}
};

const days={
 d1:{id:'d1',date:'2027-01-09',weather:'matsumoto'},
 d2:{id:'d2',date:'2027-01-10',weather:'karuizawa'},
 d3:{id:'d3',date:'2027-01-11',weather:'yamanouchi'},
 d4:{id:'d4',date:'2027-01-12',weather:'yamanouchi'},
 d5:{id:'d5',date:'2027-01-13',weather:'hakuba'},
 d6:{id:'d6',date:'2027-01-14',weather:'dynamic'},
 d7:{id:'d7',date:'2027-01-15',weather:'dynamic'},
 d8:{id:'d8',date:'2027-01-16',weather:'dynamic'},
 d9:{id:'d9',date:'2027-01-17',weather:'matsumoto'}
};

const cameras={
 d2:['松本城及北阿爾卑斯','國道18號・追分','國道18號繞道・消防署附近','新輕井澤西交叉口','王子通','輕井澤站北口','千曲川・平和橋'],
 shirakawago:['新穗高纜車・西穗高口','國道156號・岩瀨橋（往白川村）','國道156號・福島（往莊川）','國道156號・椿原（往莊川）'],
 shinhotaka:['新穗高纜車・西穗高口','國道158號・丹生川町茶屋野（往平湯）','國道158號・丹生川町久手（往平湯）','國道158號・平湯（往高山）','國道158號・大瀧橋（往平湯）'],
 city:['高山中橋','高山陣屋前','國道158號・丹生川町茶屋野（往平湯）','國道158號・丹生川町茶屋野（往高山）'],
 east:['國道158號・丹生川町久手（往平湯）','國道158號・平湯（往高山）','國道158號・乘鞍山道入口（往高山）']
};

const externalLinks={
 shinhotakaStatus:'https://shinhotaka-ropeway.jp/',
 gifuRoad:'https://douro.pref.gifu.lg.jp/',
 shirakawagoTraffic:'https://shirakawa-going.jp/tw/index.html',
 takayamaLive:'https://www.hidatakayama.or.jp/index_10.html'
};

function uniq(a){return [...new Set(a||[])];}
function selectedShinhotakaDay(){try{localStorage.removeItem(SH_KEY);}catch(e){}return '';}
function setSelectedShinhotakaDay(){try{localStorage.removeItem(SH_KEY);}catch(e){}return '';}
function resolveFlexibleDays(){
 return{selected:'',d6:'shirakawago',d7:'planning',d8:'planningEast'};
}
function weatherRegionForDay(dayId,v){
 const d=days[dayId];if(!d)return'matsumoto';if(d.weather!=='dynamic')return d.weather;
 const plan=resolveFlexibleDays(v),kind=plan[dayId];
 if(kind==='shinhotaka')return'shinhotaka';
 if(kind==='shirakawago')return'shirakawago';
 return'takayama';
}
function defaultWeatherRegion(dateKey,v){
 const saved=localStorage.getItem(WEATHER_REGION_KEY);if(saved&&regions[saved])return saved;
 const entry=Object.values(days).find(d=>d.date===dateKey);return entry?weatherRegionForDay(entry.id,v):'matsumoto';
}
function setWeatherRegion(id){if(regions[id])localStorage.setItem(WEATHER_REGION_KEY,id);}

function d2Live(){return{
 nav:'🏯 D2 松本城・輕井澤',title:'🏯 松本城・輕井澤・千曲',
 desc:'松本城（1.5小時）→ Times 取車 → 輕井澤 Outlet → 千曲',
 route:'08:30 快早餐 → 步行松本城（1.5小時）→ 返酒店攞行李 → Times 取車 → 輕井澤 Outlet（2小時）→ 千曲｜白絲瀑布／鬼押出園今次取消',
 places:[['松本城','Matsumoto Castle'],['Times 松本站前','Times Car Rental Matsumoto Station'],['輕井澤王子購物廣場','Karuizawa Prince Shopping Plaza'],['千曲館','Club Wyndham Chikumakan Nagano']],
 cams:cameras.d2.slice()
};}
function shirakawagoLive(day){return{
 nav:'🏘️ '+day.toUpperCase()+' 白川鄉',title:'🏘️ 白川鄉 Shirakawa-go',
 desc:day==='d6'?'白川鄉優先日；只有新穗高突然極好天先改計劃':'D6 已去新穗高，所以今日補白川鄉',
 route:'高山 → 白川鄉荻町合掌村 → 和田家 → 荻町城跡展望台 → 高山',
 places:[['白川鄉','Shirakawa-go'],['和田家','Wada House Shirakawa-go'],['荻町城跡展望台','Ogimachi Castle Observation Deck'],['高山住宿',day==='d7'?'Residence Hotel Takayama Station':'Takayama Ouan']],
 cams:cameras.shirakawago.slice(),
 decision:{title:day.toUpperCase()+' 天氣決策',steps:['白川鄉只安排 D6 或 D7；D8 不再向西兜去白川鄉。','出發前照睇一次新穗高山頂；如果今日係三日唯一極佳能見度，可以即時改今日去新穗高。','白川鄉道路大雪／封路就安全優先。'],links:[['白川鄉交通 Live Cam',externalLinks.shirakawagoTraffic],['岐阜道路雪況',externalLinks.gifuRoad],['新穗高運行狀況',externalLinks.shinhotakaStatus]]}
};}
function shinhotakaLive(day){return{
 nav:'🚡 '+day.toUpperCase()+' 新穗高',title:'🚡 新穗高纜車 Shinhotaka Ropeway',
 desc:'今日已選做新穗高日；山頂能見度、風況同纜車運行正常先出發。',
 route:'高山 → 新穗高纜車 → 平湯神社'+(day==='d8'?' → 安房方向 → 松本':' → 高山'),
 places:[['新穗高纜車','Shinhotaka Ropeway'],['平湯神社','平湯神社'],[day==='d8'?'松本住宿':'高山住宿',day==='d8'?'Iroha Grand Hotel Matsumoto Ekimae':(day==='d7'?'Residence Hotel Takayama Station':'Takayama Ouan')]],
 cams:uniq(cameras.shinhotaka.concat(day==='d8'?cameras.east:[])),
 decision:{title:day.toUpperCase()+' 新穗高判斷',steps:['先睇西穗高口 Live Cam＋官方 Operation Status。','山頂清晰、風況可接受、纜車正常先出發。',day==='d8'?'D8 完成後一路向東返松本；白川鄉唔會放今日。':'完成新穗高後，其餘兩日自動分配白川鄉／高山市區＋鐘乳洞。'],links:[['新穗高運行狀況',externalLinks.shinhotakaStatus],['岐阜道路雪況',externalLinks.gifuRoad]]}
};}
function cityCaveLive(day){return{
 nav:'🧊 '+day.toUpperCase()+' 高山・鐘乳洞',title:'🧊 高山市區・飛驒大鐘乳洞'+(day==='d8'?' → 松本':''),
 desc:day==='d7'?'高山市區＋飛驒大鐘乳洞；晚上三寺まいり只做 Bonus':'完成高山市區＋鐘乳洞後一路向東返松本',
 route:'宮川朝市 → 高山陣屋 → 三町古街 → 飛驒大鐘乳洞'+(day==='d8'?' → 平湯／安房 → 松本':' → 高山 → 1/15 三寺まいり Bonus'),
 places:[['宮川朝市','Miyagawa Morning Markets Takayama'],['高山陣屋','Takayama Jinya'],['三町古街','Sanmachi Suji Takayama'],['飛驒大鐘乳洞','Hida Great Limestone Cave'],[day==='d8'?'松本住宿':'三寺まいり Bonus',day==='d8'?'Iroha Grand Hotel Matsumoto Ekimae':'Hida-Furukawa Station']],
 cams:uniq(cameras.city.concat(day==='d8'?cameras.east:[])),
 decision:{title:day.toUpperCase()+' 道路重點',steps:['鐘乳洞位於高山東面方向。',day==='d8'?'鐘乳洞後直接經平湯／安房方向返松本。':'1/15 三寺まいり只係 Bonus；道路、體力、時間任何一樣唔理想就 Skip。','冬季 R158 以道路安全同即時導航為準。'],links:[['飛驒高山 Live Camera',externalLinks.takayamaLive],['岐阜道路雪況',externalLinks.gifuRoad]]}
};}
function planningD7Live(){return{nav:'🌨️ D7 彈性日',title:'🌨️ D7 新穗高／高山市區',desc:'視 D6 結果同新穗高天氣決定；1/15 三寺まいり只做 Bonus。',route:'新穗高 或 高山市區＋飛驒大鐘乳洞',places:[['新穗高纜車','Shinhotaka Ropeway'],['飛驒大鐘乳洞','Hida Great Limestone Cave'],['高山站','Takayama Station']],cams:uniq(cameras.shinhotaka.concat(cameras.city)),decision:{title:'D7 規劃模式',steps:['用「D6–D8 新穗高日子」鎖定日子。','如果 D6 已去新穗高，D7 就係白川鄉。','如果新穗高留 D8，D7 做高山市區＋鐘乳洞。'],links:[['新穗高運行狀況',externalLinks.shinhotakaStatus],['岐阜道路雪況',externalLinks.gifuRoad]]}};}
function planningD8Live(){return{nav:'🚗 D8 東面→松本',title:'🚗 D8 剩餘東面行程 → 松本',desc:'D8 不再安排白川鄉；只會係新穗高或者高山市區＋鐘乳洞後返松本。',route:'新穗高／飛驒大鐘乳洞 → 平湯／安房方向 → 松本',places:[['新穗高纜車','Shinhotaka Ropeway'],['飛驒大鐘乳洞','Hida Great Limestone Cave'],['松本住宿','Iroha Grand Hotel Matsumoto Ekimae']],cams:uniq(cameras.shinhotaka.concat(cameras.east)),decision:{title:'D8 規劃模式',steps:['D8 永遠唔去白川鄉。','如果新穗高留 D8，朝早以 Live Cam／運行狀況作最後判斷。','如果新穗高已完成，D8 做高山市區＋鐘乳洞後直接返松本。'],links:[['新穗高運行狀況',externalLinks.shinhotakaStatus],['岐阜道路雪況',externalLinks.gifuRoad]]}};}
function liveConfig(dayId,v){
 if(dayId==='d2')return d2Live();
 const plan=resolveFlexibleDays(v),kind=plan[dayId];
 if(kind==='shinhotaka')return shinhotakaLive(dayId);
 if(kind==='shirakawago')return shirakawagoLive(dayId);
 if(kind==='cityCave')return cityCaveLive(dayId);
 if(dayId==='d7')return planningD7Live();
 if(dayId==='d8')return planningD8Live();
 return null;
}
function selectorStatus(v){const s=['d6','d7','d8'].includes(v)?v:selectedShinhotakaDay();return s?s.toUpperCase()+' 去新穗高｜白川鄉自動放 D6／D7；D8 不去白川鄉。':'規劃模式｜D6 白川鄉優先；到時睇新穗高 Live Cam 再決定 D6／D7／D8。';}

window.Japan2027Core={
 version:VERSION,
 storage:{shinhotakaDay:SH_KEY,weatherRegion:WEATHER_REGION_KEY},
 regions,regionsArray:Object.values(regions),days,cameras,externalLinks,
 getSelectedShinhotakaDay:selectedShinhotakaDay,
 setSelectedShinhotakaDay,
 resolveFlexibleDays,
 weatherRegionForDay,
 defaultWeatherRegion,
 setWeatherRegion,
 liveConfig,
 selectorStatus
};
document.documentElement.dataset.tripCore='v1';
})();
