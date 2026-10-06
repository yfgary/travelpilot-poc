(function(){
'use strict';

const v8=window.Japan2027V8;
const base=window.Japan2027EnhancementData;
if(!v8 || !base) return;

const checklist=[
  {group:'🪪 隨身／證件／金錢',items:[
    ['pack_docs','證件'],['pack_cash','現金（日元）'],['pack_sim','電話卡'],['pack_pen','筆'],['pack_wallet','銀包'],['pack_visa','Visa 卡'],['pack_master','Master 卡'],['pack_unionpay','銀聯卡']
  ]},
  {group:'🧥 冬季衣物',items:[
    ['pack_ski_gloves','滑雪手套：各一對'],['pack_decathlon_gloves','迪卡儂手套：一對'],['pack_hats','冷帽×2'],['pack_scarves','頸巾×2'],['pack_regular_socks','普通襪：各8對'],['pack_thick_socks','厚襪：各2對'],['pack_coat','防水羽絨外套：各一件'],['pack_sleepwear','睡衣：各一套'],['pack_underwear','內衣：各8套'],['pack_outfits_min','衣服整體：最少6套'],['pack_base_layers','打底保暖衫：各2套'],['pack_windy_thermal','保暖內衣：Windy 3件'],['pack_long_sleeves','長袖衫：各8件'],['pack_snow_pants','雪褲：各3條'],['pack_gary_jeans','牛仔褲：Gary 1條'],['pack_windy_skirt','冬天長裙：Windy 1條']
  ]},
  {group:'🪥 盥洗／頭髮用品',items:[
    ['pack_electric_toothbrush','電動牙刷：1套'],['pack_sensitive_toothpaste','防敏牙膏：1支'],['pack_disposable_toothpaste','即用即棄牙膏：2套'],['pack_disposable_toothbrush','即用即棄牙刷：2套'],['pack_cups','漱口杯：2個'],['pack_conditioner','護髮素：1件'],['pack_shampoo','洗頭水：1件'],['pack_comb','梳：1件'],['pack_hairclip','髮夾']
  ]},
  {group:'🧺 洗衣／住宿用品',items:[
    ['pack_hangers','衣架'],['pack_clothesline','曬衫繩'],['pack_laundrypods','洗衣珠：4粒'],['pack_bathtowels','沖涼毛巾：各一條'],['pack_hairtowel','吸水毛巾（頭髮）：1條'],['pack_slippers','拖鞋：各一對'],['pack_garbagebags','新垃圾膠袋：8個']
  ]},
  {group:'🧻 紙品／清潔／防護',items:[
    ['pack_masks','口罩'],['pack_earplugs','耳塞'],['pack_disposable_gloves','即棄手套'],['pack_wetwipes','濕紙巾：4包'],['pack_tissues','紙巾：12包'],['pack_boxtissue','抽紙：1盒／包'],['pack_toiletroll','卷裝廁紙：1卷'],['pack_disinfectspray','消毒噴霧：1支'],['pack_sanitizer','搓手液：1支']
  ]},
  {group:'🧴 護膚／個人用品',items:[
    ['pack_sunglasses','太陽眼鏡：2副'],['pack_lipbalm','潤唇膏：2支'],['pack_skincare_set','保濕護膚品：1套'],['pack_handcream','護手霜：1支'],['pack_bodylotion','Body Lotion：1支'],['pack_vaseline','凡士林：1瓶'],['pack_eczema_cream','濕疹手霜：1支'],['pack_deodorant','止汗劑：1支'],['pack_eyebrow','眉筆：1支'],['pack_makeup','化妝品'],['pack_makeup_wipes','卸妝濕紙巾'],['pack_warmers','暖包'],['pack_nailclipper','指甲鉗'],['pack_sewing','針線包'],['pack_toothpicks','牙籤'],['pack_floss','牙線'],['pack_sunscreen','防曬：1支'],['pack_umbrellas','遮：2把'],['pack_lunchbox','飯盒：1個'],['pack_forks','叉：2隻'],['pack_fruitknife','生果刀：1把'],['pack_thermos','保暖杯：2個']
  ]},
  {group:'💊 藥物／雜項',items:[
    ['pack_thermalbags','即棄保溫袋（銀色）：3個'],['pack_luggagescale','行李磅'],['pack_sleepmed','安眠藥：7粒／份'],['pack_panadol','必理痛'],['pack_trumpet','喇叭丸'],['pack_cold_drink','感冒熱飲'],['pack_plasters','膠布'],['pack_antiseptic_wipes','消毒紙巾'],['pack_antiseptic_liquid','消毒藥水'],['pack_qingreku','清熱酷：8件'],['pack_baoanxin','保安心藥膏：1支'],['pack_ecobag','環保購物袋']
  ]},
  {group:'📷 電子／攝影／車用',items:[
    ['pack_batteries','電池'],['pack_selfiestick','自拍神棍'],['pack_tripod','腳架'],['pack_camera','相機'],['pack_adapters','旅行插蘇：2個'],['pack_kettle','電熱水壺'],['pack_stove','電爐'],['pack_powerbanks','細尿袋：3個'],['pack_cctv','閉錄電視'],['pack_memorycard','記憶卡'],['pack_dashcam','車Cam'],['pack_dashcam_mount','車Cam固定器'],['pack_cables','充電線：4條']
  ]}
];

(function migrate(){
  const key='japanWinter2027DepartureChecklistV1';
  let s={};
  try{s=JSON.parse(localStorage.getItem(key)||'{}');}catch(e){return;}
  const map={
    pack_cards:['pack_visa','pack_master','pack_unionpay'],
    pack_gloves:['pack_ski_gloves','pack_decathlon_gloves'],
    pack_hat_scarf:['pack_hats','pack_scarves'],
    pack_socks:['pack_regular_socks','pack_thick_socks'],
    pack_clothes:['pack_outfits_min','pack_base_layers','pack_windy_thermal','pack_long_sleeves','pack_snow_pants','pack_gary_jeans','pack_windy_skirt'],
    pack_toothbrush:['pack_electric_toothbrush','pack_sensitive_toothpaste','pack_disposable_toothpaste','pack_disposable_toothbrush'],
    pack_haircare:['pack_conditioner','pack_shampoo'],
    pack_hangers:['pack_hangers','pack_clothesline'],
    pack_skincare:['pack_skincare_set','pack_handcream','pack_bodylotion','pack_vaseline','pack_eczema_cream'],
    pack_makeup:['pack_makeup','pack_makeup_wipes'],
    pack_dental:['pack_toothpicks','pack_floss'],
    pack_lunchbox:['pack_lunchbox','pack_forks'],
    pack_medicines:['pack_panadol','pack_trumpet','pack_cold_drink','pack_plasters','pack_antiseptic_wipes','pack_antiseptic_liquid'],
    pack_selfiestick:['pack_selfiestick','pack_tripod'],
    pack_kettle:['pack_kettle','pack_stove'],
    pack_cctv:['pack_cctv','pack_memorycard'],
    pack_dashcam:['pack_dashcam','pack_dashcam_mount']
  };
  let changed=false;
  Object.keys(map).forEach(function(oldId){if(s[oldId]===true){map[oldId].forEach(function(id){if(s[id]!==true){s[id]=true;changed=true;}});}});
  if(changed){try{localStorage.setItem(key,JSON.stringify(s));}catch(e){}}
})();

v8.checklist=checklist;
base.departureChecklist=checklist;

const photoRules={
  'matsumoto-castle':{show:false,status:'官方公開頁未見自拍棍全面禁止；天守內樓梯狹窄，現場指示優先。'},
  'shiraito':{show:false,status:'未見官方自拍棍禁令；勿阻塞步道。'},
  'onioshidashi':{show:false,status:'未見官方自拍棍禁令；積雪步道以安全為先。'},
  'karuizawa-outlet':{show:false,status:'未見商場一般遊客自拍棍全面禁令；活動區另有規則。'},
  'obuse':{show:false,status:'公共街道未見自拍棍禁令；勿阻塞行人。'},
  'hokusai':{show:true,level:'ban',text:'🚫 北齋館展示室禁止使用自拍神棍、三腳架及一腳架；可拍照範圍亦不可使用。',source:'https://hokusai-kan.com/rules/'},
  'oranche':{show:false,status:'未見官方自拍棍禁令；店內繁忙時收起。'},
  'shibu-onsen':{show:false,status:'溫泉街公共範圍未見全面禁令；浴場內涉及私隱，唔好使用攝影器材。'},
  'snow-monkey':{show:true,level:'ban',text:'🚫 地獄谷野猿公苑官方明確禁止使用自拍神棍；亦禁止 Drone 及其他特殊攝影。',source:'https://jigokudani-yaenkoen.co.jp/caution/'},
  'aeon-suzaka':{show:false,status:'未見商場一般遊客自拍棍全面禁令；店舖／活動區另有規則。'},
  'hakuba-iwatake':{show:false,status:'未見官方自拍棍全面禁令；Gondola／觀景位繁忙時勿伸長阻人。'},
  'shinhotaka':{show:false,status:'未見官方自拍棍全面禁令；纜車車廂內及擠迫位置勿伸長使用。'},
  'miyagawa':{show:false,status:'公共朝市未見自拍棍禁令；勿阻塞攤檔及通道。'},
  'takayama-jinya':{show:false,status:'官方公開頁未見一般遊客自拍棍明文禁令；商業／媒體拍攝需事前申請，館內以職員指示為準。'},
  'sanmachi':{show:false,status:'公共古街未見自拍棍禁令；勿阻塞道路及店舖入口。'},
  'hida-cave':{show:false,status:'未見官方自拍棍禁令；洞內狹窄、濕滑，唔建議伸長使用。'},
  'shirakawago':{show:true,level:'caution',text:'⚠️ 白川村官方有專頁提醒「使用自拍神棍要小心」；唔係全面禁止，但村內係生活道路，唔好伸出車道、阻塞行人或影響居民。',source:'https://www.vill.shirakawa.lg.jp/2228.htm'},
  'wada-house':{show:true,level:'caution',text:'⚠️ 和田家位於白川鄉生活村落；白川村官方提醒使用自拍神棍要小心。入屋後空間及樓梯較窄，現場標示／職員指示優先。',source:'https://www.vill.shirakawa.lg.jp/2228.htm'},
  'ogimachi-view':{show:true,level:'caution',text:'⚠️ 展望台屬白川鄉範圍；白川村官方提醒使用自拍神棍要小心。人多／雪地時尤其唔好伸長阻路。',source:'https://www.vill.shirakawa.lg.jp/2228.htm'},
  'santera':{show:false,status:'街上祭禮未見自拍棍全面禁令；人多時避免伸長，寺內依現場攝影規則。'},
  'daio':{show:false,status:'未見官方自拍棍全面禁令；勿阻塞農場步道。'},
  'nawate':{show:false,status:'公共商店街未見自拍棍禁令；勿阻塞行人。'},
  'kumoba':{show:false,status:'公共步道未見自拍棍禁令；冬季結冰時以安全為先。'},
  'ueda-castle':{show:false,status:'公園範圍未見自拍棍全面禁令；館內設施依現場指示。'},
  'yanagimachi':{show:false,status:'公共歷史街道未見自拍棍禁令；勿阻塞行人／店舖。'},
  'ganshoin':{show:true,level:'ban',text:'🚫 岩松院本堂內全面禁止以手機／相機攝影，所以本堂內亦唔可以用自拍神棍；戶外境內則以不影響其他參拜者為原則。',source:'https://ganshoin.com/first/'},
  'suzaka-kura':{show:false,status:'公共歷史街區未見自拍棍禁令；室內設施依現場指示。'},
  'hida-no-sato':{show:false,status:'未見官方自拍棍全面禁令；古民家室內狹窄，現場指示優先。'},
  'yatai-kaikan':{show:false,status:'未見官方自拍棍全面禁令；展示館內避免伸長阻礙其他人。'},
  'hirayu-no-mori':{show:false,status:'官方網站公開頁未見自拍棍條文；浴場屬高度私隱空間，攝影器材應收起並以現場禁攝標示為準。'},
  'bear-park':{show:false,status:'未見官方自拍棍全面禁令；接近動物時避免伸長器材。'},
  'hida-furukawa':{show:false,status:'公共街道未見自拍棍禁令；祭禮人多時避免伸長。'},
  'nakamachi':{show:false,status:'公共歷史街道未見自拍棍禁令；勿阻塞行人。'}
};
Object.keys(photoRules).forEach(function(id){if(v8.visits[id])v8.visits[id].photo=photoRules[id];});
v8.photoChecked='2026-09-27';
v8.version='v8.1';
})();
