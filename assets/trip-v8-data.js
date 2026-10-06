(function(){
'use strict';

const checklist = [
  {group:'🪪 隨身／證件／金錢',items:[
    ['pack_docs','證件'],
    ['pack_cash','現金（日元）'],
    ['pack_sim','電話卡'],
    ['pack_pen','筆'],
    ['pack_wallet','銀包'],
    ['pack_cards','Visa卡／Master 卡／銀聯卡']
  ]},
  {group:'🧥 冬季衣物',items:[
    ['pack_gloves','滑雪手套各一對，迪卡儂手套一對'],
    ['pack_hat_scarf','冷帽×2、頸巾×2'],
    ['pack_socks','襪：各8對普通襪，各2對厚襪'],
    ['pack_coat','外套：防水羽絨外套各一件'],
    ['pack_sleepwear','睡衣：各一套'],
    ['pack_underwear','內衣：各8套'],
    ['pack_clothes','衣服最少6套：上衣—各2套打底保暖衫、保暖內衣3件（Windy）、各8件長袖衫；褲—各3條雪褲、1條牛仔褲（Gary）；冬天長裙1條（Windy）']
  ]},
  {group:'🪥 盥洗／頭髮用品',items:[
    ['pack_toothbrush','電動牙刷1套、防敏牙膏1支，外加2套即用即棄牙膏、牙刷'],
    ['pack_cups','漱口杯：2個'],
    ['pack_haircare','護髮素：1件、洗頭水：1件'],
    ['pack_comb','梳：1件'],
    ['pack_hairclip','髮夾']
  ]},
  {group:'🧺 洗衣／住宿用品',items:[
    ['pack_hangers','衣架、曬衫繩'],
    ['pack_laundrypods','洗衣珠4粒'],
    ['pack_bathtowels','沖涼毛巾：各一條'],
    ['pack_hairtowel','吸水毛巾（頭髮）：1條'],
    ['pack_slippers','拖鞋：各一對'],
    ['pack_garbagebags','新垃圾膠袋8個']
  ]},
  {group:'🧻 紙品／清潔消毒',items:[
    ['pack_wetwipes','濕紙巾×4包'],
    ['pack_tissues','紙巾×12包'],
    ['pack_boxtissue','抽紙×1'],
    ['pack_toiletroll','卷裝廁紙×1'],
    ['pack_disinfectspray','消毒噴霧×1'],
    ['pack_sanitizer','搓手液×1']
  ]},
  {group:'🧴 護膚／個人用品',items:[
    ['pack_sunglasses','太陽眼鏡×2'],
    ['pack_lipbalm','潤唇膏×2'],
    ['pack_skincare','保濕護膚品1套、護手霜1支、body lotion1支、凡士林1瓶、濕疹手霜一支'],
    ['pack_deodorant','止汗劑×1'],
    ['pack_eyebrow','眉筆×1'],
    ['pack_makeup','化妝品、卸妝濕紙巾'],
    ['pack_warmers','暖包'],
    ['pack_nailclipper','指甲鉗'],
    ['pack_sewing','針線包'],
    ['pack_dental','牙籤、牙線'],
    ['pack_sunscreen','防曬×1'],
    ['pack_umbrellas','遮×2'],
    ['pack_lunchbox','飯盒×1、叉×2'],
    ['pack_fruitknife','生果刀×1'],
    ['pack_thermos','保暖杯×2']
  ]},
  {group:'💊 藥物／雜項',items:[
    ['pack_thermalbags','即棄保溫袋×3（銀色）'],
    ['pack_luggagescale','行李磅'],
    ['pack_sleepmed','安眠藥×7'],
    ['pack_medicines','藥物（必理痛、喇叭丸、感冒熱飲、膠布、消毒紙巾、消毒藥水）'],
    ['pack_qingreku','清熱酷×8'],
    ['pack_baoanxin','保安心藥膏×1'],
    ['pack_ecobag','環保購物袋']
  ]},
  {group:'📷 電子／攝影／車用',items:[
    ['pack_batteries','電池'],
    ['pack_selfiestick','自拍神棍、腳架'],
    ['pack_camera','相機'],
    ['pack_adapters','旅行插蘇×2'],
    ['pack_kettle','電熱水壺／電爐'],
    ['pack_powerbanks','充電器（細尿袋）×3'],
    ['pack_cctv','閉錄電視、記憶卡'],
    ['pack_dashcam','車cam、車cam固定器'],
    ['pack_cables','充電線×4']
  ]}
];

const visits = {
  'matsumoto-castle':{
    open:'08:30', last:'16:30', close:'17:00',
    fee:'成人：電子票 ¥1,200／當日紙票 ¥1,300；小童 ¥400；學齡前免費（現行）',
    note:'2027年1月正式票價如有調整，以出發前官方公告為準。12/29–12/31休館。',
    source:'https://www.matsumoto-castle.jp/info'
  },
  'shiraito':{
    open:'戶外公共景點・全天可到', last:'不適用', close:'無閘門', fee:'免費',
    note:'冬季建議只在日照時間前往；真正限制係Highland Way路況、積雪與結冰。',
    source:'https://karuizawa-kankokyokai.jp/spot/23206/'
  },
  'onioshidashi':{
    open:'08:00', last:'16:30', close:'17:00', fee:'成人 ¥700／小童 ¥500／學齡前免費',
    note:'全年營業；天氣或積雪可能影響部分步道。',
    source:'https://www.princehotels.co.jp/amuse/onioshidashi/'
  },
  'karuizawa-outlet':{
    open:'2027/1未公布；冬季多數日參考 10:00', last:'商場無統一最後入場', close:'2027/1未公布；2026/1多數日參考 19:00（部分日20:00）', fee:'免費入場',
    note:'店舖／餐廳營業時間各有不同；2027年1月官方Calendar推出後再更新。',
    source:'https://www.karuizawa-psp.jp/time'
  },
  'obuse':{
    open:'栗之小徑／舊街屬公共街道・全天可行', last:'不適用', close:'無統一關門時間', fee:'免費',
    note:'栗菓子店、餐廳及個別設施各自有營業時間。',
    source:'https://www.obusekanko.jp/'
  },
  'hokusai':{
    open:'09:00', last:'16:30', close:'17:00', fee:'成人 ¥1,200／高中・大學生 ¥500／小・中學生 ¥300／學齡前免費（行程日期特展票價）',
    note:'2026/10/24–2027/1/17特展期間票價；D3 1/11正正在展期內。',
    source:'https://50th.hokusai-kan.com/event/event-291/'
  },
  'oranche':{
    open:'09:00', last:'不適用（農產直賣店）', close:'17:00（官方頁面另有18:00記載，出發前再核對）', fee:'免費入場',
    note:'1/1休息；你D3係1/11。商品售罄時間每日不同。',
    source:'https://www.nakanokanko.jp/spots/196/'
  },
  'shibu-onsen':{
    open:'06:00', last:'無獨立最後入場時間', close:'22:00', fee:'入住澀溫泉街旅館住客持專用鎖匙可免費使用九個外湯',
    note:'部分外湯清潔時會短暫關閉；非住宿客一般不可自由使用九湯。',
    source:'https://shibuonsen.net/onsen/'
  },
  'snow-monkey':{
    open:'09:00（11月–3月冬季）', last:'建議最遲15:30到公苑入口', close:'16:00', fee:'現行：成人 ¥800／小童 ¥400／6歲以下免費；官方已公告票價將調整，2027價錢待確認',
    note:'由專用停車場行雪路約30–35分鐘先到入口，所以唔好用16:00倒推停車時間。',
    source:'https://jigokudani-yaenkoen.co.jp/'
  },
  'aeon-suzaka':{
    open:'專門店／Food Forest 10:00；AEON STYLE食品 08:00；餐廳 11:00', last:'無統一最後入場', close:'專門店／餐廳 21:00；AEON STYLE食品 22:00', fee:'免費入場',
    note:'個別店舖營業時間可能不同。',
    source:'https://suzaka.aeonmall.com/'
  },
  'hakuba-iwatake':{
    open:'2026–27 Gondola正式首班待公布；Mountain Harbor參考 08:15；White Park參考 09:00', last:'2026–27 Gondola最後乘車時間待公布', close:'Mountain Harbor參考16:00；White Park參考15:00', fee:'非滑雪觀光票現行參考：成人 ¥2,900／小童 ¥1,600（Gondola來回及山頂區域；2026–27再核對）',
    note:'你唔滑雪，唔需要買1日滑雪Lift Pass。2026–27冬季預計12月中至3月尾營業。',
    source:'https://iwatake-mountain-resort.com/winter'
  },
  'shinhotaka':{
    open:'冬季：第1纜車 09:00／第2纜車 09:15', last:'上山最後：第1纜車 15:30／第2纜車 15:45', close:'最後下山約16:15', fee:'來回成人 ¥3,800／小童 ¥1,900',
    note:'強風、惡劣天氣或維修可停駛；D6–D8仍以當日官方運行資訊＋Live Cam為準。',
    source:'https://shinhotaka-ropeway.jp/'
  },
  'miyagawa':{
    open:'冬季12–3月 08:00', last:'不適用（露天朝市）', close:'12:00', fee:'免費入場',
    note:'攤檔會因天氣、商品售罄而提早收。',
    source:'https://www.hidatakayama.or.jp/'
  },
  'takayama-jinya':{
    open:'冬季11–3月 08:45', last:'16:00', close:'16:30', fee:'成人 ¥440／高中生或以下免費',
    note:'12/29–1/3休館；你行程日期不在休館期。',
    source:'https://jinya.gifu.jp/'
  },
  'sanmachi':{
    open:'公共古街・全天可行', last:'不適用', close:'街道無閘門；商店多數約傍晚前後收舖', fee:'免費',
    note:'真正Shopping／酒藏參觀要按個別店舖時間；冬天傍晚後街上會靜好多。',
    source:'https://www.hidatakayama.or.jp/spot/detail_1101.html'
  },
  'hida-cave':{
    open:'冬季11–3月 09:00', last:'16:00（停止入洞）', close:'16:30', fee:'成人 ¥1,100／小童 ¥550',
    note:'年末年始或天候有臨時安排時，以官方公告為準。',
    source:'https://www.syonyudo.com/'
  },
  'shirakawago':{
    open:'荻町聚落屬公共生活村落・全天可到', last:'不適用', close:'無統一關門時間', fee:'村落步行免費；停車、個別民家／設施另收費',
    note:'唔建議夜晚當景點行；冬季停車場、交通管制及設施時間要按當日官方安排。',
    source:'https://shirakawa-go.gr.jp/'
  },
  'wada-house':{
    open:'09:00', last:'官方未列獨立最後入場；建議16:30前入', close:'17:00', fee:'成人 ¥400／小學生 ¥200／學齡前免費',
    note:'不定休；冬季可能因天候／維護調整。',
    source:'https://shirakawa-go.gr.jp/active/13/'
  },
  'ogimachi-view':{
    open:'展望台公共空間；Shuttle參考09:00開始', last:'Shuttle尾班參考15:40（每20分鐘；12時段通常停駛）', close:'展望台無統一關門；冬季交通管制優先', fee:'展望台免費；交通／Shuttle按現場安排',
    note:'冬季唔好假設可以自己駕車上展望台；以白川鄉官方當日交通指示為準。',
    source:'https://shirakawa-go.gr.jp/faq/'
  },
  'santera':{
    open:'2027/1/15活動詳細時間尚未公布', last:'待2027官方活動表', close:'待2027官方活動表', fee:'參拜／街上活動免費',
    note:'只限1月15日；你D7日期啱啱撞正，但是否加入仍以主行程早完＋道路安全為先。',
    source:'https://www.city.hida.gifu.jp/soshiki/15/santeramairi.html'
  },
  'daio':{
    open:'冬季12–2月 09:00', last:'官方未列獨立最後入場；建議15:30前到', close:'16:00', fee:'免費入場',
    note:'12/31休園；D8只可非常早到安曇野先加。',
    source:'https://www.daiowasabi.co.jp/'
  },
  'nawate':{
    open:'公共商店街・全天可行', last:'不適用', close:'街道無閘門；商店各自營業', fee:'免費',
    note:'夜晚好多店已收舖，所以D1／D8夜行主要係散步街景。',
    source:'https://visitmatsumoto.com/'
  },
  'kumoba':{
    open:'戶外公共景點・全天可到', last:'不適用', close:'無閘門', fee:'免費',
    note:'冬季建議日照時間前往；環池步道可結冰。',
    source:'https://karuizawa-kankokyokai.jp/'
  },
  'ueda-castle':{
    open:'城跡公園 24小時；櫓／博物館一般09:00', last:'櫓／博物館一般16:30', close:'公園全天；櫓／博物館一般17:00', fee:'公園免費；有料設施另收費',
    note:'1月屬冬季，部分櫓可能休館；你D2 Backup主要價值係公園、城門、石垣及真田歷史。',
    source:'https://go.ueda-kanko.or.jp/'
  },
  'yanagimachi':{
    open:'公共歷史街道・全天可行', last:'不適用', close:'街道無閘門；店舖各自營業', fee:'免費',
    note:'只係上田城Backup早完先順路加，唔需要為店舖開門時間拖延去千曲。',
    source:'https://go.ueda-kanko.or.jp/'
  },
  'ganshoin':{
    open:'冬季12–3月 09:30', last:'官方未列獨立最後入場；建議15:00前入', close:'15:30', fee:'成人 ¥600／小童 ¥300／學齡前免費',
    note:'法事／寺院活動有機會臨時限制參觀。',
    source:'https://www.gansho-in.or.jp/'
  },
  'suzaka-kura':{
    open:'歷史街道全天可行；觀光交流中心參考09:00', last:'街道不適用', close:'交流中心參考17:00', fee:'街區免費',
    note:'交流中心通常星期三休息，另有年末年始休館；你D4係星期二。',
    source:'https://www.suzaka-kankokyokai.jp/'
  },
  'hida-no-sato':{
    open:'08:30', last:'官方未列獨立最後入場；建議16:30前入', close:'17:00', fee:'成人 ¥700／小・中學生 ¥200',
    note:'全年營業；冬季步道積雪時要預多啲行路時間。',
    source:'https://www.hidatakayama.or.jp/spot/detail_1063.html'
  },
  'yatai-kaikan':{
    open:'冬季12–2月 09:00', last:'官方未列獨立最後入場；建議16:00前入', close:'16:30', fee:'成人 ¥1,000／高中生 ¥600／小童 ¥500',
    note:'全年營業；如果關門前不足40分鐘就唔值得硬加。',
    source:'https://www.hidatakayama.or.jp/'
  },
  'hirayu-no-mori':{
    open:'10:00', last:'20:30（最後受付）', close:'21:00', fee:'成人 ¥700／小童 ¥500',
    note:'日歸溫泉；新穗高日有足夠時間同體力先加，浸完休息先再駕車。',
    source:'https://www.hirayunomori.co.jp/'
  },
  'bear-park':{
    open:'冬季12–3月 09:00', last:'16:00', close:'16:30', fee:'官方現行價：成人 ¥1,400／小童 ¥700',
    note:'冬季星期三休園。部分旅遊資料仍顯示舊價 ¥1,100／¥600，以牧場官方最新價為準。',
    source:'https://www.nande.com/kuma/'
  },
  'hida-furukawa':{
    open:'公共古街・全天可行', last:'不適用', close:'街道無閘門；店舖／設施各自營業', fee:'免費',
    note:'D7只係主線早完先加；最好天黑前先行白壁土藏街。',
    source:'https://www.hida-kankou.jp/'
  },
  'nakamachi':{
    open:'公共歷史街道・全天可行', last:'不適用', close:'街道無閘門；店舖各自營業', fee:'免費',
    note:'D8早到松本先加，傍晚後店舖會陸續收。',
    source:'https://visitmatsumoto.com/'
  }
};

window.Japan2027V8 = {
  version:'v8.2',
  checked:'2026-09-27',
  checklist:checklist,
  visits:visits
};

/* Existing checklist renderer reads EnhancementData. Replace its content before it runs. */
if(window.Japan2027EnhancementData){
  window.Japan2027EnhancementData.departureChecklist = checklist;
}

})();
