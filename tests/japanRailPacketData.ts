// Exact GPT-6-approved Packet #3 values, not independently researched by Codex.
export const railPrices = [
  { id: 'jp27-transport-shinano-out', price: { amount: 6160, currency: 'JPY', notes: '2026年3月修訂公開票價參考：名古屋→松本，成人1人單程普通指定席通常期¥6,160（基本運賃¥3,430＋特急指定席料金¥2,730）；2027/1/9按JR官方2026年度季節表屬通常期。非已購票／已付款金額；2027實際班次、票種與售價須於開售後重新確認。' } },
  { id: 'jp27-transport-shinano-return', price: { amount: 6160, currency: 'JPY', notes: '2026年3月修訂公開票價參考：松本→名古屋，成人1人單程普通指定席通常期¥6,160（基本運賃¥3,430＋特急指定席料金¥2,730）；2027/1/17按JR官方2026年度季節表屬通常期。非已購票／已付款金額；2027實際班次、票種與售價須於開售後重新確認。' } },
]
export const railSources = [
  { id: 'jp27-source-gpt6-shinano-tokai', title: 'JR東海｜2026年度しなの年末年始全席指定席期間', url: 'https://railway.jr-central.co.jp/zairai/', type: 'official', entity: { type: 'transport', id: 'jp27-transport-shinano-out' } },
  { id: 'jp27-source-gpt6-shinano-season', title: 'JR東日本｜会社間列車の通常期・繁忙期・閑散期規則', url: 'https://www.jreast.co.jp/ko/kippu/1202.html', type: 'official', entity: { type: 'transport', id: 'jp27-transport-shinano-return' } },
  { id: 'jp27-source-gpt6-shinano-fare-guide', title: 'JR-group.jp｜2026年3月修訂しなの公開票價參考（非JR官方報價）', url: 'https://jr-group.jp/shinano-ryokin/', type: 'reference', entity: { type: 'transport', id: 'jp27-transport-shinano-out' } },
  { id: 'jp27-source-gpt6-shinano-ekitan', title: '駅探｜名古屋至松本普通指定席票價交叉參考', url: 'https://ekitan.com/transit/express/section/exm-110585/exs-110585002/sf-4455/st-3726', type: 'reference', entity: { type: 'transport', id: 'jp27-transport-shinano-return' } },
]
