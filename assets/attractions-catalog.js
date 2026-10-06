(function(){
'use strict';

const DATA=window.Japan2027EnhancementData;
const V8=window.Japan2027V8||null;
if(!DATA||!Array.isArray(DATA.attractions))return;

const LOCATION_ORDER=['松本','輕井澤','上田','小布施／中野','澀溫泉／山之內','須坂','白馬','高山','奧飛驒／新穗高／平湯','白川鄉','飛驒古川','安曇野','其他'];

const META={
 'matsumoto-castle':{location:'松本',day:'D2',dayNote:'D1 夜景 Bonus',status:'main',score:9.5},
 'nawate':{location:'松本',day:'D1／D8',status:'backup',score:7.0},
 'nakamachi':{location:'松本',day:'D8',status:'backup',score:7.0},
 'shiraito':{location:'輕井澤',day:'D2',status:'backup',score:7.8},
 'onioshidashi':{location:'輕井澤',day:'D2',status:'backup',score:7.6},
 'karuizawa-outlet':{location:'輕井澤',day:'D2',status:'main',score:7.5},
 'kumoba':{location:'輕井澤',day:'D2',status:'backup',score:6.8},
 'ueda-castle':{location:'上田',day:'D2',status:'backup',score:7.5},
 'yanagimachi':{location:'上田',day:'D2',status:'backup',score:6.5},
 'obuse':{location:'小布施／中野',day:'D3',status:'main',score:8.2},
 'hokusai':{location:'小布施／中野',day:'D3',status:'backup',score:7.5},
 'oranche':{location:'小布施／中野',day:'D3',status:'main',score:6.8},
 'ganshoin':{location:'小布施／中野',day:'D3',status:'backup',score:7.2},
 'shibu-onsen':{location:'澀溫泉／山之內',day:'D3',status:'main',score:9.0},
 'snow-monkey':{location:'澀溫泉／山之內',day:'D4',status:'main',score:9.0},
 'aeon-suzaka':{location:'須坂',day:'D4',status:'main',score:6.5},
 'suzaka-kura':{location:'須坂',day:'D4',status:'backup',score:7.0},
 'hakuba-iwatake':{location:'白馬',day:'D5',status:'main',score:9.0},
 'miyagawa':{location:'高山',day:'D6–D8',dayNote:'高山市區日',status:'main',score:7.5},
 'takayama-jinya':{location:'高山',day:'D6–D8',dayNote:'高山市區日',status:'main',score:8.5},
 'sanmachi':{location:'高山',day:'D6–D8',dayNote:'高山市區日',status:'main',score:9.0},
 'hida-cave':{location:'高山',day:'D6–D8',dayNote:'高山市區日',status:'main',score:8.0},
 'hida-no-sato':{location:'高山',day:'D5／D6',status:'backup',score:8.0},
 'yatai-kaikan':{location:'高山',day:'D5／D6',status:'backup',score:8.0},
 'shinhotaka':{location:'奧飛驒／新穗高／平湯',day:'D6–D8',dayNote:'揀最好天氣一日',status:'main',score:9.5},
 'hirayu-no-mori':{location:'奧飛驒／新穗高／平湯',day:'D6–D8',dayNote:'新穗高日',status:'backup',score:8.5},
 'bear-park':{location:'奧飛驒／新穗高／平湯',day:'D6–D8',dayNote:'新穗高日',status:'backup',score:6.0},
 'shirakawago':{location:'白川鄉',day:'D6–D8',dayNote:'同新穗高互換',status:'main',score:10.0},
 'wada-house':{location:'白川鄉',day:'D6–D8',dayNote:'白川鄉日',status:'main',score:8.8},
 'ogimachi-view':{location:'白川鄉',day:'D6–D8',dayNote:'白川鄉日',status:'main',score:9.5},
 'hida-furukawa':{location:'飛驒古川',day:'D7',status:'backup',score:8.0},
 'santera':{location:'飛驒古川',day:'D7',dayNote:'1/15限定',status:'backup',score:9.0},
 'daio':{location:'安曇野',day:'D8',status:'backup',score:7.5}
};

const NAME_META=[
 {match:['飛驒東照宮','飛騨東照宮'],location:'高山',day:'D6–D8',dayNote:'高山市區日',status:'main',score:7.8},
 {match:['豐川城山稻荷','豊川城山稲荷'],location:'高山',day:'D6–D8',dayNote:'高山市區日',status:'main',score:7.2},
 {match:['日枝神社'],location:'高山',day:'D6–D8',status:'backup',score:7.5},
 {match:['平湯神社'],location:'奧飛驒／新穗高／平湯',day:'D6–D8',dayNote:'新穗高日',status:'main',score:7.0},
 {match:['笠森稻荷','笠森稲荷'],location:'高山',day:'D6–D8',status:'backup',score:6.5}
];

const SHRINES={
 '飛驒東照宮':{
  title:'⛩️ 飛驒東照宮｜德川家康、金森家與飛驒匠人',jp:'飛騨東照宮（ひだとうしょうぐう）',
  why:'飛驒東照宮值得放入你嘅高山行程，唔係因為「順便多睇一間神社」，而係佢正好補足高山陣屋同三町古街睇唔到嗰一面：德川幕府權威、金森家統治，以及飛驒木匠技術點樣交織。你去完高山陣屋會知道幕府點樣行政管理飛驒；再到東照宮，就可以睇到地方領主點樣透過祭祀德川家康表達政治忠誠，同時將最高水平嘅地方木工放入宗教建築。',
  history:'元和5年（1619），高山藩第三代藩主金森重賴將原本供奉喺高山城內嘅德川家康遷座到今日位置，成為飛驒東照宮。金森家係德川體制下嘅大名，所以東照宮唔只係宗教場所，亦有相當清楚嘅政治象徵。金森家離開飛驒之後，建築曾經荒廢；現存主要社殿到文政元年（1818）由名匠水間相模主持重建。即係你今日見到嘅唔係現代仿古，而係有二百年以上歷史、代表江戶後期飛驒工藝水平嘅建築。',
  importance:'官方資料指出，本殿、唐門同全長約62米嘅透塀都屬岐阜縣指定重要文化財；本地堂等亦有高山市文化財身份。對高山而言，佢係少見能夠同時講「德川政治」、「東照宮信仰」同「飛驒匠」嘅地方，所以比單純影古街更能理解高山點解會形成今日嘅文化面貌。',
  look:['先睇唐門同本殿比例：東照宮系建築比一般地方神社更有「廟」嘅華麗感。','沿住約62米透塀行，留意木格、光影同保存狀態；呢段係官方特別指出極具價值嘅構件。','睇雕刻、樑柱同細部木工，將佢同高山祭屋台嘅精細工藝放埋一齊理解。','冬季如果有雪，木建築、石階、樹林同白雪層次非常適合影相，但真正重點仍然係建築本身。'],
  fit:'如果 D6/D7/D8 入面有完整高山市區日，就放喺飛驒大鐘乳洞返高山後；如果 D6 已經用咗去新穗高，則放 D7 白川鄉返高山、Residence Check-in 之後。兩個方案都唔 Cut 松本城、白川鄉、新穗高、鐘乳洞等核心景點。',winter:'戶外參拜為主；石階同樹蔭位置一月有機會結冰，防滑鞋慢行。',time:'約20–30分鐘。',source:'https://www.hidatakayama.or.jp/spot/detail_1184.html',summary:'正式主線短停：睇本殿、唐門、62米透塀，同高山陣屋嘅幕府背景串埋理解。'
 },
 '豐川城山稻荷':{
  title:'⛩️ 豐川城山稻荷｜城山雪林入面嘅朱紅鳥居',jp:'豊川城山稲荷（とよかわしろやまいなり）',
  why:'呢個位最啱你嘅原因係「攝影價值高、停留短、同高山市區路線夾」。高山最多人影三町木屋，但豐川城山稻荷係另一種畫面：城山樹林、朱紅鳥居、稻荷信仰符號，如果一月有雪，紅、白、深色樹幹會形成非常強嘅對比。佢唔需要用一兩個鐘，所以可以真正塞入主線而唔犧牲大景點。',
  history:'城山一帶本身就係昔日高山城附近嘅歷史地景，除城跡外亦有寺社。豐川稻荷信仰源自愛知縣妙嚴寺所奉嘅豐川吒枳尼真天，歷史背景同一般人最熟悉嘅伏見稻荷系神社並唔完全一樣。高山呢個城山稻荷喺明治時期由地方人士建立，亦反映近代城下町居民將稻荷信仰帶入日常生活。',
  importance:'佢唔係「日本最重要神社」嗰類大型目的地，而係理解高山城山周邊宗教地景嘅好例子。對今次行程而言，佢價值在於短時間內由商人古街切換到山林寺社空間，同時滿足你想影雪＋紅鳥居嘅要求。',
  look:['鳥居排列嘅縱深感係第一重點，最好由入口向內構圖。','留意狐狸／稻荷元素，同一般神社狛犬不同。','如果有新雪，避免踩入未清理斜坡；用已清路線影紅白對比已經足夠。'],
  fit:'同飛驒東照宮一程串連。完整高山市區日就放鐘乳洞返高山後；若 D6 去新穗高，就改放 D7 白川鄉返高山之後。',winter:'城山坡道一月可能積雪、結冰；路況唔安全就保留東照宮而 Skip 呢個短停，唔值得冒險。',time:'約15–20分鐘。',source:'https://www.hidatakayama.or.jp/',summary:'正式主線短停：雪地朱紅鳥居係攝影重點；路面結冰嚴重就以安全為先。'
 },
 '平湯神社':{
  title:'⛩️ 平湯神社｜奧飛驒溫泉鄉嘅地方信仰',jp:'平湯神社（ひらゆじんじゃ）',
  why:'平湯神社最值得加入今次行程嘅理由係幾乎零繞路：無論你 D6、D7 定 D8 去新穗高，來回都會經平湯。用約20分鐘落車參拜，就可以令新穗高一日唔再只係「搭纜車睇雪山」，而係加埋奧飛驒溫泉聚落、山岳環境同地方信仰。',
  history:'平湯係奧飛驒溫泉鄉歷史最悠久嘅溫泉地之一。地方資料記錄，神社過去同神明神社、山神信仰有關，1980年改稱平湯神社。平湯亦流傳白猿帶領人發現溫泉嘅傳說，所以今日地方祭事、護身符同「湯」文化仍然連結得好緊密。呢類神社規模唔大，但反而係真正服務當地聚落，而唔係為旅客而設嘅大型觀光神社。',
  importance:'佢將奧飛驒「山＋溫泉＋居民信仰」三樣嘢串連。你之後見到平湯溫泉、源泉同雪山環境時，就會知道當地人點解唔單止將溫泉當旅遊資源，而係同生活同祭祀放埋一齊。',
  look:['參拜本殿，睇雪覆屋頂同樹林環境。','留意附近平湯民俗館／溫泉聚落氣氛；神社唔需要獨立拉長行程。','記住白猿與溫泉發現傳說，之後去奧飛驒其他溫泉點會更有背景。'],
  fit:'固定放喺「你揀咗去新穗高嗰一日」回程：新穗高 → 平湯神社 → 高山／松本。唔需要額外繞路，所以三個可選日期都可以真正加入。',winter:'平湯係豪雪區，停車位、參道同石面可能有厚雪／冰；只做短停，現場除雪差就唔勉強。',time:'約20分鐘。',source:'https://www.kankou-gifu.jp/spot/detail_3165.html',summary:'正式加入新穗高日；短停約20分鐘，了解白猿傳說、溫泉聚落同地方信仰。'
 },
 '日枝神社':{
  title:'⛩️ 日枝神社｜高山祭「山王祭」嘅信仰中心',jp:'飛騨山王宮 日枝神社（ひえじんじゃ）',
  why:'日枝神社最大價值唔係「有一間靚神社」，而係春之高山祭山王祭就係佢嘅例祭。你喺高山會見到祭屋台、古街同城下町文化；知道日枝神社之後，先會明白高山祭原本係宗教例祭，而唔係為遊客表演嘅活動。',
  history:'相傳1141年由當時三佛寺城主勸請日吉山王而創建，之後金森長近平定飛驒、建立高山城，再將神社奉遷到現址並視為高山城鎮護神。高山成為幕府天領之後，歷代代官、郡代仍然敬奉。即係由中世、金森氏城下町到幕府直轄時代，佢都一直同高山政治與居民生活有連續關係。',
  importance:'今日佢仍係高山市南半部氏神，亦係聯合國教科文組織無形文化遺產相關嘅春之高山祭核心神社。拝殿前樹齡超過1000年大杉更被指定為岐阜縣天然紀念物。',
  look:['拝殿前千年大杉係第一重點，先睇樹嘅尺度再睇社殿。','杉林參道、石燈籠同冬季雪景，氣氛同三町商業街完全不同。','如果之前睇過高山祭屋台資料，喺呢度將「屋台」重新理解成神社例祭文化。'],
  fit:'按你之前決定，日枝神社繼續做 Backup，唔硬塞主線；高山市區主線明顯提早、仍有日光先加。',winter:'林蔭位置易積雪／結冰，日落前去較好。',time:'約25–35分鐘。',source:'https://www.hidatakayama.or.jp/spot/detail_1180.html',summary:'高山市區主線明顯提早、仍有日光先加；係春之高山祭「山王祭」嘅核心神社，亦有千年大杉。'
 }
};

const CARD_SUMMARY={
 'snow-monkey':'冬季長期積雪。猴子係真正生活喺附近山林嘅野生日本獼猴。是否浸溫泉視當日情況。',
 'matsumoto-castle':'國寶現存木造天守。今次以日間外觀、護城河、天守內部同冬季城景為主。',
 'shiraito':'冬季地下水仍然流動，雪、綠苔、流水同冰柱可以同時見到；只係路況同時間合適先去。',
 'onioshidashi':'1783年淺間山噴發留下嘅熔岩地貌；冬季黑色熔岩配白雪最有特色，D2只做後備。',
 'karuizawa-outlet':'大型戶外型 Outlet，今次預約約2小時 Shopping；前面行程延誤就以 Outlet 同準時到酒店為優先。',
 'obuse':'栗子老店、栗之小徑、町屋同北齋文化集中嘅細小城鎮，適合慢行同食栗子食品。',
 'oranche':'JA農產直賣所，主要睇長野當季農產、菇類、果汁、味噌同地方食品。',
 'shibu-onsen':'住客用專用鎖匙巡九個外湯；穿浴衣行溫泉街、浸湯同蓋印係核心體驗。',
 'aeon-suzaka':'地獄谷之後嘅主要 Shopping／休息 Block；補給、食飯同暖身一次完成。',
 'hakuba-iwatake':'唔滑雪都可以坐 Gondola 上山，主角係 HAKUBA MOUNTAIN HARBOR 同北阿爾卑斯雪景。',
 'miyagawa':'高山市區生活感最強嘅朝市；短時間睇漬物、味噌、農產同飛驒地方食品。',
 'takayama-jinya':'德川幕府直轄飛驒時期嘅官署遺構；同三町古街一齊睇先完整理解高山。',
 'sanmachi':'高山代表性江戶商人町；木格子町家、酒藏、味噌店、中橋同古街一次過行。',
 'hida-cave':'天然鐘乳洞＋冬季冰之溪谷；亦係新穗高天氣差時非常穩定嘅替代景點。',
 'shinhotaka':'好天時回報最高：乘纜車直接上2,000米以上睇北阿爾卑斯；大霧就唔硬追。',
 'shirakawago':'世界遺產合掌村；冬季厚雪最容易理解合掌造點樣適應豪雪山村生活。',
 'wada-house':'入合掌造內部睇圍爐、粗木樑、屋頂骨架同過去養蠶生活空間。',
 'ogimachi-view':'由高位一眼睇晒白川鄉聚落、屋脊方向、道路、農田同山谷地形。',
 'santera':'1月15日限定傳統活動；雪地、寺院、和蠟燭同飛驒古川夜街一齊出現。',
 'daio':'安曇野湧水種植山葵嘅大型農場；只有新穗高日非常早到安曇野先加。'
};

function ensureShrineData(){
 Object.entries(SHRINES).forEach(([name,d])=>{
   const jpBase=d.jp.split('（')[0];
   let a=DATA.attractions.find(x=>(x.aliases||[]).some(z=>z.includes(name)||name.includes(z)||z.includes(jpBase)||jpBase.includes(z)));
   if(!a){a={id:'catalog-'+name,aliases:[name,jpBase]};DATA.attractions.push(a);}
   Object.assign(a,{title:d.title,jp:d.jp,why:d.why,history:d.history,importance:[d.importance],look:d.look,fit:d.fit,winter:d.winter,time:d.time,source:d.source,catalogShrine:name,catalogSummary:d.summary});
 });
}

function ensureKasamori(){
 if(DATA.attractions.some(x=>/笠森稲荷|笠森稻荷/.test((x.title||'')+' '+(x.aliases||[]).join(' '))))return;
 DATA.attractions.push({
   id:'kasamori-inari',aliases:['笠森稲荷','笠森稻荷','笠森稲荷神社'],title:'⛩️ 笠森稻荷｜高山小型稻荷社',jp:'笠森稲荷神社（かさもりいなりじんじゃ）',
   why:'呢個位價值主要係紅色鳥居同高山市內短停攝影，而唔係大型歷史名勝。你本身想搵雪景＋鳥居，所以佢適合作為高山市區時間非常鬆時嘅小型 Backup。',
   background:'笠森稻荷屬高山市內較細規模嘅稻荷信仰地點，網上地圖標示同入口位置相對大型寺社唔算清晰。對今次旅程而言，重點係作為「短停鳥居景」而唔係為佢專程改路線。',
   look:['以朱紅鳥居、雪地同周邊樹木做構圖。','如果現場入口難搵、除雪差或者要兜路，就直接取消。','唔需要為完成打卡而壓縮高山陣屋、三町古街或新穗高等主景點。'],
   fit:'D6–D8高山市區日做 Backup；只有主行程明顯早完成、天色仍好先加。',winter:'小路除雪情況未必及大型景點；結冰／積雪深就唔入。',time:'約15–20分鐘。',source:'https://www.hidatakayama.or.jp/'
 });
}

function patchLatestFits(){
 const sh=DATA.attractions.find(x=>x.id==='shiraito');if(sh)sh.fit='D2 Backup #1。完成松本城、取車同 Outlet 後仍明顯早過預期，而且即時導航仍可穩陣 17:30 前到千曲館先考慮。';
 const on=DATA.attractions.find(x=>x.id==='onioshidashi');if(on)on.fit='D2 Backup #2，優先級低過白絲瀑布。唔會為鬼押出園縮短 Outlet 或推遲千曲溫泉酒店。';
 const mc=DATA.attractions.find(x=>x.id==='matsumoto-castle');if(mc)mc.fit='D2 正式主行程：08:30 快早餐後步行去松本城，預約1.5小時影相／參觀；之後返酒店攞行李再取車。D1夜晚只係有時間先睇外觀／Projection Bonus。';
}

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function arr(v){if(!v)return[];return Array.isArray(v)?v:[v];}
function plainTitle(v){return String(v||'').replace(/^\s*[\p{Extended_Pictographic}\uFE0F]+\s*/u,'').trim();}
function locationSlug(v){return 'loc-'+v.replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');}
function scoreText(n){return Number.isInteger(n)?n.toFixed(0)+'/10':n.toFixed(1)+'/10';}
function statusText(s){return s==='main'?'✅ 主行程':'🔄 後備景點';}
function mapQuery(a){return a.jp?plainTitle(a.jp.replace(/（.*?）/g,'')):plainTitle(a.title);}

function metaFor(a){
 if(META[a.id])return META[a.id];
 const hay=[a.title,a.jp,...(a.aliases||[])].join(' ');
 const n=NAME_META.find(x=>x.match.some(q=>hay.includes(q)));
 if(n)return n;
 const fit=String(a.fit||'');
 const days=(fit.match(/D\d(?:\s*[／–-]\s*D?\d)*/g)||[]).join('／')||'行程內';
 return {location:'其他',day:days,status:/Backup|Optional|有時間|先加|候補|保留|Bonus/i.test(fit)?'backup':'main',score:7.0};
}

function summaryFor(a){
 if(a.catalogSummary)return a.catalogSummary;
 if(CARD_SUMMARY[a.id])return CARD_SUMMARY[a.id];
 const v=a.whyLong||a.why||'';
 const s=Array.isArray(v)?v[0]:String(v);
 const clean=s.replace(/<[^>]*>/g,'').trim();
 const parts=clean.split(/(?<=[。！？])/).filter(Boolean);
 const out=(parts.slice(0,2).join('')||clean);
 return out.length>180?out.slice(0,177)+'…':out;
}

function visitFor(a){return V8?.visits?.[a.id]||null;}
function visitPhotoHtml(v){
 if(!v?.photo?.show)return'';
 return '<div class="visit-photo-warning '+(v.photo.level||'caution')+'">'+v.photo.text+'</div>';
}
function visitCompactHtml(v){
 if(!v)return'';
 return '<div class="visit-meta-card"><div class="visit-meta-line">'+
   '<span>🕒 <strong>開門</strong> '+v.open+'</span>'+
   '<span>⏳ <strong>最後入場</strong> '+v.last+'</span>'+
   '<span>🚪 <strong>關門</strong> '+v.close+'</span>'+
   '<span>🎟️ <strong>收費</strong> '+v.fee+'</span>'+
   '</div>'+(v.note?'<div class="visit-meta-note">'+v.note+'</div>':'')+visitPhotoHtml(v)+'</div>';
}
function feePill(v){
 if(!v?.fee||v.fee==='—'||/未有|不適用/.test(v.fee))return'';
 let s=String(v.fee).replace(/^現行[:：]\s*/,'');
 if(s.length>72)s=s.slice(0,69)+'…';
 return '<div class="price">🎟️ '+s+'</div>';
}

function cardHtml(a,m,index){
 const title=a.title||a.aliases?.[0]||a.id;
 const v=visitFor(a);
 const dur=a.time||'';
 return '<div class="catalog-item" data-status="'+m.status+'" id="spot-'+esc(a.id||index)+'">'+
   '<div class="catalog-day">'+esc(m.day||'')+(m.dayNote?'<small>'+esc(m.dayNote)+'</small>':'')+'</div>'+
   '<div class="timeline-card">'+
     '<span class="event-type">'+statusText(m.status)+'</span>'+
     (dur?'<span class="duration-badge">⏱ '+esc(dur)+'</span>':'')+
     '<span class="catalog-score">⭐ '+scoreText(m.score)+'</span>'+
     '<h3>'+title+'<button type="button" class="enhance-info-btn catalog-info-btn" data-info-id="'+esc(a.id||'')+'" aria-label="詳細介紹">ⓘ</button><a class="map-pin" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapQuery(a))+'" target="_blank" rel="noopener" aria-label="Google Maps">📍</a></h3>'+
     (a.jp?'<div class="jp-place-name">'+esc(a.jp)+'</div>':'')+
     '<p>'+esc(summaryFor(a))+'</p>'+
     feePill(v)+visitCompactHtml(v)+
   '</div></div>';
}

let modal=null;
function paras(v){return arr(v).filter(Boolean).map(x=>'<p>'+x+'</p>').join('');}
function bullets(v){const a=arr(v).filter(Boolean);return a.length?'<ul>'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'';}
function ensureModal(){
 if(modal)return;
 modal=document.createElement('div');modal.className='enhance-modal';modal.id='tripDeepInfoModal';
 modal.innerHTML='<div class="enhance-modal-card" role="dialog" aria-modal="true" aria-labelledby="tripDeepInfoTitle"><div class="enhance-modal-head"><h2 class="enhance-modal-title" id="tripDeepInfoTitle"></h2><button type="button" class="enhance-modal-close" aria-label="關閉">×</button></div><div class="enhance-modal-body"></div></div>';
 document.body.appendChild(modal);
 const close=()=>{modal.classList.remove('show');document.body.style.overflow='';};
 modal.querySelector('.enhance-modal-close').addEventListener('click',close);
 modal.addEventListener('click',e=>{if(e.target===modal)close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('show'))close();});
}
function deepVisitHtml(a){
 const v=visitFor(a);if(!v)return'';
 const photo=(v.photo&&v.photo.show)?'<div class="deep-photo-rule '+(v.photo.level||'caution')+'">'+v.photo.text+(v.photo.source?'<br><a class="deep-photo-source" href="'+esc(v.photo.source)+'" target="_blank" rel="noopener">↗ 攝影／自拍神棍規則來源</a>':'')+'</div>':'';
 return '<div class="deep-visit-info" data-id="'+esc(a.id)+'"><h3>🕒 開放時間／最後入場／收費</h3><div class="deep-visit-grid">'+
   '<div class="deep-visit-item"><strong>開門／開始</strong>'+v.open+'</div>'+
   '<div class="deep-visit-item"><strong>最後入場／最後受付</strong>'+v.last+'</div>'+
   '<div class="deep-visit-item"><strong>關門／結束</strong>'+v.close+'</div>'+
   '<div class="deep-visit-item deep-visit-fee"><strong>入場收費</strong>'+v.fee+'</div></div>'+
   (v.note?'<div class="deep-visit-warning">⚠️ '+v.note+'</div>':'')+photo+
   (v.source?'<a class="deep-visit-source" href="'+esc(v.source)+'" target="_blank" rel="noopener">↗ 營業時間／收費官方資料</a>':'')+
   '<span class="deep-visit-checked">資料查核：'+(V8?.checked||'最新資料')+'。2027年1月尚未正式公布嘅季節時間／票價已明確標示，出發前會再核對。</span></div>';
}
function openGeneric(a){
 ensureModal();
 modal.querySelector('.enhance-modal-title').textContent=a.title||'';
 const why=a.whyLong||a.why||'';
 const hist=a.history||a.background||'';
 const imp=a.importance||[];
 const visit=a.visit||a.look||[];
 const understand=a.understand||'';
 modal.querySelector('.enhance-modal-body').innerHTML=
   deepVisitHtml(a)+
   (a.jp?'<div class="deep-jp-name">🇯🇵 '+esc(a.jp)+'</div>':'')+
   '<div class="deep-summary"><h3>🧭 點解值得去</h3>'+paras(why)+'</div>'+
   '<div class="deep-section"><h3>📚 歷史／背景：點解會有呢個地方</h3>'+paras(hist)+'</div>'+
   (arr(imp).length?'<div class="deep-section"><h3>🏛️ 點解喺日本／當地重要</h3>'+bullets(imp)+'</div>':'')+
   '<div class="deep-section"><h3>👀 去到現場應該睇乜</h3>'+bullets(visit)+'</div>'+
   (understand?'<div class="deep-understand"><strong>💡 睇完應該明白乜：</strong><br>'+understand+'</div>':'')+
   (a.fit?'<div class="deep-trip-fit"><strong>🗺️ 點解排喺你呢日行程：</strong><br>'+a.fit+'</div>':'')+
   (a.winter?'<div class="deep-winter"><strong>❄️ 1月冬季重點：</strong><br>'+a.winter+'</div>':'')+
   (a.time?'<div class="deep-time">⏱️ 建議停留：'+a.time+'</div>':'')+
   (a.source?'<a class="deep-source" href="'+esc(a.source)+'" target="_blank" rel="noopener">↗ 官方／主要資料來源</a>':'');
 modal.classList.add('show');document.body.style.overflow='hidden';
}
function openShrine(name){
 const d=SHRINES[name];if(!d)return;
 ensureModal();
 modal.querySelector('.enhance-modal-title').textContent=d.title;
 modal.querySelector('.enhance-modal-body').innerHTML=
   '<div class="jp-place-name">🇯🇵 '+d.jp+'</div>'+
   '<div class="enhance-why"><h3>🧭 點解值得去</h3><p>'+d.why+'</p></div>'+
   '<div class="enhance-section"><h3>📚 完整背景／歷史</h3><p>'+d.history+'</p></div>'+
   '<div class="enhance-section"><h3>🏯 點解喺高山／奧飛驒重要</h3><p>'+d.importance+'</p></div>'+
   '<div class="enhance-section"><h3>👀 到場應該睇乜</h3><ul>'+d.look.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>'+
   '<div class="enhance-section"><h3>🗺️ 點解排喺呢日</h3><p>'+d.fit+'</p></div>'+
   '<div class="enhance-section"><h3>❄️ 1月重點</h3><p>'+d.winter+'</p></div>'+
   '<div class="enhance-time"><strong>⏱ 建議停留：</strong>'+d.time+'</div>'+
   '<a class="enhance-source" href="'+d.source+'" target="_blank" rel="noopener">↗ 官方／主要資料來源</a>';
 modal.classList.add('show');document.body.style.overflow='hidden';
}
function byId(id){return DATA.attractions.find(x=>x.id===id)||null;}

function render(){
 ensureShrineData();ensureKasamori();patchLatestFits();
 const host=document.getElementById('catalogGroups');if(!host)return;
 const list=DATA.attractions.map((a,i)=>({a,m:metaFor(a),i}));
 const groups={};LOCATION_ORDER.forEach(x=>groups[x]=[]);
 list.forEach(x=>{if(!groups[x.m.location])groups[x.m.location]=[];groups[x.m.location].push(x);});
 Object.values(groups).forEach(g=>g.sort((x,y)=>(x.m.status===y.m.status?y.m.score-x.m.score:(x.m.status==='main'?-1:1))));
 const main=list.filter(x=>x.m.status==='main').length,backup=list.length-main;
 const count=document.getElementById('catalogCount');if(count)count.textContent='共 '+list.length+' 個景點｜主行程 '+main+'｜後備 '+backup;
 const nav=document.getElementById('locationNav');if(nav)nav.innerHTML=LOCATION_ORDER.filter(l=>groups[l]?.length).map(l=>'<a href="#'+locationSlug(l)+'">'+l+' <b>'+groups[l].length+'</b></a>').join('');
 host.innerHTML=LOCATION_ORDER.filter(l=>groups[l]?.length).map(l=>'<section class="cat-group" id="'+locationSlug(l)+'"><div class="cat-group-head"><h2>📍 '+l+'</h2><span>'+groups[l].length+' 個</span></div><div class="catalog-timeline">'+groups[l].map(x=>cardHtml(x.a,x.m,x.i)).join('')+'</div></section>').join('');
 applyFilter('all');
}

function applyFilter(mode){
 document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===mode));
 document.querySelectorAll('.catalog-item').forEach(c=>c.classList.toggle('catalog-hidden',mode!=='all'&&c.dataset.status!==mode));
 document.querySelectorAll('.cat-group').forEach(g=>g.classList.toggle('catalog-hidden',![...g.querySelectorAll('.catalog-item')].some(c=>!c.classList.contains('catalog-hidden'))));
}

document.addEventListener('click',e=>{
 const f=e.target.closest('.filter-btn');if(f){applyFilter(f.dataset.filter);return;}
 const b=e.target.closest('.catalog-info-btn');if(!b)return;
 const a=byId(b.dataset.infoId);if(!a)return;
 e.preventDefault();e.stopPropagation();
 if(a.catalogShrine&&SHRINES[a.catalogShrine])openShrine(a.catalogShrine);else openGeneric(a);
});

function version(){fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json()).then(v=>{const b=document.getElementById('catalogVersion');if(b)b.textContent='版本 '+(v.version||'')+'・build '+(v.build||'');}).catch(()=>{});}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{render();version();},{once:true});else{render();version();}
})();
