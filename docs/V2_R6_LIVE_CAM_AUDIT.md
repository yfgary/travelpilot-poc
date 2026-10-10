# R6 — Live Cam read-only source audit

Audit date: **11/10/2026 (Asia/Hong_Kong)**. POC branch `qa/pre15d-r6-livecam`; source-only Production reference SHA `8b5129b381d6ace94030b51c7b8de5c4e3d5f533`.

## Evidence and availability boundary

- Read-only sources: [V1 live.html](https://github.com/yfgary/travelpilot/blob/8b5129b381d6ace94030b51c7b8de5c4e3d5f533/live.html), `trips/shirakawago-shinhotaka-2027/live-cams.json`, `assets/live-v9-2-sync.js`, `assets/multi-trip-live-renderer-v1.js`. No V1 script is copied into runtime.
- Exact static inventory: **40 YouTube references / 33 distinct IDs**, **17 image references / 11 distinct URLs**. These 44 distinct resources are source references, not 44 verified working cameras. Repeats are retained below as day bindings.
- Native Chromium attempted two representative HTTPS YouTube embeds, two official still images and all five canonical external pages. Normal managed proxy and CA, default browser identity, no spoofing, CSP bypass, third-party proxy or protected scraping. Every attempt failed with `net::ERR_TUNNEL_CONNECTION_FAILED` at the environment boundary; image naturalWidth = 0 and no successful source response.
- Therefore **zero real embeds or still images are verified playable/available**. Camera availability, CSP/frame-ancestors, X-Frame-Options, hotlink, missing-video and provider playback restrictions cannot be determined from this run. Do not call these sources dead or working. A landing-page HTTP 200 or frame load would not prove playback.
- V1 uses muted autoplay and stripped controls. R6 does not copy this policy, change provider permissions or infer external URLs into embedded sources. Existing conservative sandbox/referrer policy is retained. Real-provider testing from a permitted browser/deployed origin remains required.

## Browser attempts

| Name | Method / exact source | Outcome |
| --- | --- | --- |
| 松本城及北阿爾卑斯 | embed: https://www.youtube-nocookie.com/embed/3pfpRzVgtoE | not tested — attempted native Chromium; environment tunnel blocked |
| 美之原高原・王之頭方向 | embed: https://www.youtube-nocookie.com/embed/W7kZdoqGfTg | not tested — attempted native Chromium; environment tunnel blocked |
| 千曲川・平和橋 | image: https://www.hrr.mlit.go.jp/bosai/img/741029.jpg | not tested — attempted native Chromium; environment tunnel blocked |
| 國道158號・丹生川町茶屋野（往平湯） | image: https://douro.pref.gifu.lg.jp/img/camera/douro_070_0062.jpg | not tested — attempted native Chromium; environment tunnel blocked |
| 地獄谷野猿公苑 Live Camera | official-page: https://jigokudani-yaenkoen.co.jp/livecam2/video.php | not tested — attempted native Chromium; environment tunnel blocked |
| 白馬岩岳 Live Camera | official-page: https://www.vill.hakuba.nagano.jp/livecamera/ | not tested — attempted native Chromium; environment tunnel blocked |
| 白川鄉 Live Camera／交通Live | official-page: https://shirakawa-going.jp/ | not tested — attempted native Chromium; environment tunnel blocked |
| 新穗高纜車 Live Camera | official-page: https://shinhotaka-ropeway.jp/en/ | not tested — attempted native Chromium; environment tunnel blocked |
| 岐阜縣道路 Live Camera／路況 | official-page: https://douro.pref.gifu.lg.jp/ | not tested — attempted native Chromium; environment tunnel blocked |

## V1 deduplicated source inventory

Labels, priorities and bindings are historical V1 facts only; they do not override canonical V2 dates/day plans. Every row is **not tested** for live availability. Official image-page links are retained; YouTube watch pages are source/provider links, not independently verified publisher ownership.

| Media / name | Source URL | V1 group/day bindings | Source/official page | Availability |
| --- | --- | --- | --- | --- |
| youtube · 松本城及北阿爾卑斯 | https://www.youtube-nocookie.com/embed/3pfpRzVgtoE | d1, d2, d8, d9 | https://www.youtube.com/watch?v=3pfpRzVgtoE | not tested |
| youtube · 美之原高原・王之頭方向 | https://www.youtube-nocookie.com/embed/W7kZdoqGfTg | d1, d9 | https://www.youtube.com/watch?v=W7kZdoqGfTg | not tested |
| youtube · 國道18號・追分 | https://www.youtube-nocookie.com/embed/Y4KAMd2eGuU | d2 | https://www.youtube.com/watch?v=Y4KAMd2eGuU | not tested |
| youtube · 國道18號繞道・消防署附近 | https://www.youtube-nocookie.com/embed/YiUnKdAq424 | d2 | https://www.youtube.com/watch?v=YiUnKdAq424 | not tested |
| youtube · 輕井澤町公所前・湯川故鄉公園 | https://www.youtube-nocookie.com/embed/fic_lTH_4KY | d2 | https://www.youtube.com/watch?v=fic_lTH_4KY | not tested |
| youtube · 新輕井澤西交叉口 | https://www.youtube-nocookie.com/embed/GkoIAnOeazM | d2 | https://www.youtube.com/watch?v=GkoIAnOeazM | not tested |
| youtube · 王子通 | https://www.youtube-nocookie.com/embed/8VbOUB-dplM | d2 | https://www.youtube.com/watch?v=8VbOUB-dplM | not tested |
| youtube · 輕井澤站北口 | https://www.youtube-nocookie.com/embed/1adPpHlPg5M | d2 | https://www.youtube.com/watch?v=1adPpHlPg5M | not tested |
| youtube · 育兒支援中心附近 | https://www.youtube-nocookie.com/embed/3Q7Yos70-sQ | d2 | https://www.youtube.com/watch?v=3Q7Yos70-sQ | not tested |
| youtube · 輕井澤中學附近 | https://www.youtube-nocookie.com/embed/y2xaFSo83aM | d2 | https://www.youtube.com/watch?v=y2xaFSo83aM | not tested |
| youtube · 舊輕井澤迴旋處 | https://www.youtube-nocookie.com/embed/iLfmRhMarWM | d2 | https://www.youtube.com/watch?v=iLfmRhMarWM | not tested |
| youtube · 雲場池 | https://www.youtube-nocookie.com/embed/q-81YL3MAZI | d2 | https://www.youtube.com/watch?v=q-81YL3MAZI | not tested |
| image · 千曲川・平和橋 | https://www.hrr.mlit.go.jp/bosai/img/741029.jpg | d2 | https://www.hrr.mlit.go.jp/chikuma/livecamera/ | not tested |
| youtube · 上田市區 | https://www.youtube-nocookie.com/embed/rNQoJqymsKQ | d2 | https://www.youtube.com/watch?v=rNQoJqymsKQ | not tested |
| image · 小布施橋 | https://www.hrr.mlit.go.jp/bosai/img/741013.jpg | d3 | https://www.hrr.mlit.go.jp/chikuma/livecamera/c1_obuse.html | not tested |
| youtube · 北信州山之內道之驛 | https://www.youtube-nocookie.com/embed/9t7uFd290qY | d3 | https://www.youtube.com/watch?v=9t7uFd290qY | not tested |
| youtube · 湯田中站前 | https://www.youtube-nocookie.com/embed/lAWdqnXJ0w0 | d3 | https://www.youtube.com/watch?v=lAWdqnXJ0w0 | not tested |
| youtube · 澀溫泉街 | https://www.youtube-nocookie.com/embed/nOdZW9irJrE | d3 | https://www.youtube.com/watch?v=nOdZW9irJrE | not tested |
| youtube · 地獄谷野猿公苑巴士候車室 | https://www.youtube-nocookie.com/embed/zbQvhlnQC9U | d4 | https://www.youtube.com/watch?v=zbQvhlnQC9U | not tested |
| youtube · 須坂長野東交流道 | https://www.youtube-nocookie.com/embed/hlKxhMVdE_0 | d4 | https://www.youtube.com/watch?v=hlKxhMVdE_0 | not tested |
| youtube · 長野站 | https://www.youtube-nocookie.com/embed/-LxeC1RhMrU | d4 | https://www.youtube.com/watch?v=-LxeC1RhMrU | not tested |
| youtube · 白馬岩岳 | https://www.youtube-nocookie.com/embed/e3EliJKC6z8 | d5 | https://www.youtube.com/watch?v=e3EliJKC6z8 | not tested |
| youtube · 白馬八方尾根阿爾卑斯四人吊椅 | https://www.youtube-nocookie.com/embed/21HCv58C99o | d5 | https://www.youtube.com/watch?v=21HCv58C99o | not tested |
| youtube · 白馬八方尾根兔平 | https://www.youtube-nocookie.com/embed/9ej1bDX8Kd8 | d5 | https://www.youtube.com/watch?v=9ej1bDX8Kd8 | not tested |
| youtube · 白馬八方尾根白樺纜車站 | https://www.youtube-nocookie.com/embed/hMY3VnL4Pyk | d5 | https://www.youtube.com/watch?v=hMY3VnL4Pyk | not tested |
| youtube · 白馬八方尾根第三停車場 | https://www.youtube-nocookie.com/embed/BHo4tHKIDow | d5 | https://www.youtube.com/watch?v=BHo4tHKIDow | not tested |
| youtube · 白馬47滑雪場 | https://www.youtube-nocookie.com/embed/4ppkv2HsdEY | d5 | https://www.youtube.com/watch?v=4ppkv2HsdEY | not tested |
| youtube · 白馬五龍阿爾卑斯平北側 | https://www.youtube-nocookie.com/embed/5LbQtmFr1Ws | d5 | https://www.youtube.com/watch?v=5LbQtmFr1Ws | not tested |
| youtube · 白馬五龍阿爾卑斯平西側 | https://www.youtube-nocookie.com/embed/aoBkllBoMWQ | d5 | https://www.youtube.com/watch?v=aoBkllBoMWQ | not tested |
| youtube · 白馬五龍山腳廣場 | https://www.youtube-nocookie.com/embed/xHLUcjh_0NQ | d5 | https://www.youtube.com/watch?v=xHLUcjh_0NQ | not tested |
| youtube · 白馬五龍第二停車場 | https://www.youtube-nocookie.com/embed/itaV65JiPSs | d5 | https://www.youtube.com/watch?v=itaV65JiPSs | not tested |
| youtube · 白馬五龍遠見站 | https://www.youtube-nocookie.com/embed/D8wGuRhf7EQ | d5 | https://www.youtube.com/watch?v=D8wGuRhf7EQ | not tested |
| youtube · 高山中橋 | https://www.youtube-nocookie.com/embed/rRJo8uVlAGo | d5, d6 | https://www.youtube.com/watch?v=rRJo8uVlAGo | not tested |
| youtube · 新穗高纜車・西穗高口 | https://www.youtube-nocookie.com/embed/jXrh_mQxwl8 | d6, d7, d8 | https://www.youtube.com/watch?v=jXrh_mQxwl8 | not tested |
| image · 國道158號・丹生川町茶屋野（往平湯） | https://douro.pref.gifu.lg.jp/img/camera/douro_070_0062.jpg | d6 | https://douro.pref.gifu.lg.jp/ | not tested |
| image · 國道158號・丹生川町久手（往平湯） | https://douro.pref.gifu.lg.jp/img/camera/douro_070_0091.jpg | d6, d7 | https://douro.pref.gifu.lg.jp/ | not tested |
| image · 國道158號・平湯（往高山） | https://douro.pref.gifu.lg.jp/img/camera/douro_080_0181.jpg | d6, d7, d8 | https://douro.pref.gifu.lg.jp/ | not tested |
| image · 國道158號・大瀧橋（往平湯） | https://douro.pref.gifu.lg.jp/img/camera/douro_080_0081.jpg | d6 | https://douro.pref.gifu.lg.jp/ | not tested |
| youtube · 高山陣屋前 | https://www.youtube-nocookie.com/embed/fbY0VRfHsS8 | d6 | https://www.youtube.com/watch?v=fbY0VRfHsS8 | not tested |
| image · 國道158號・丹生川町茶屋野（往高山） | https://douro.pref.gifu.lg.jp/img/camera/douro_070_0061.jpg | d6 | https://douro.pref.gifu.lg.jp/ | not tested |
| image · 國道156號・岩瀨橋（往白川村） | https://douro.pref.gifu.lg.jp/img/camera/douro_070_0042.jpg | d7, d8 | https://douro.pref.gifu.lg.jp/ | not tested |
| image · 國道156號・福島（往莊川） | https://douro.pref.gifu.lg.jp/img/camera/douro_070_0071.jpg | d7, d8 | https://douro.pref.gifu.lg.jp/ | not tested |
| image · 國道156號・椿原（往莊川） | https://douro.pref.gifu.lg.jp/img/camera/douro_070_0011.jpg | d7, d8 | https://douro.pref.gifu.lg.jp/ | not tested |
| image · 國道158號・乘鞍山道入口（往高山） | https://douro.pref.gifu.lg.jp/img/camera/douro_070_0132.jpg | d8 | https://douro.pref.gifu.lg.jp/ | not tested |

## Canonical Japan jp2027.1 coverage

Exact archive remains SHA-256 `09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e`, Schema 5, UUID `349442d2-7bf3-426b-9f57-163e2272e909`. All five records remain `external`, with no preview image. An external source page is **official-only by the authored capability**, not a verified available source or a playable embedded stream.

| Camera | Canonical days | Capability | Source URL | Availability |
| --- | --- | --- | --- | --- |
| 地獄谷野猿公苑 Live Camera | D4 | official-only (`external`) | https://jigokudani-yaenkoen.co.jp/livecam2/video.php | not tested — network blocked |
| 白馬岩岳 Live Camera | D5 | official-only (`external`) | https://www.vill.hakuba.nagano.jp/livecamera/ | not tested — network blocked |
| 白川鄉 Live Camera／交通Live | D6 | official-only (`external`) | https://shirakawa-going.jp/ | not tested — network blocked |
| 新穗高纜車 Live Camera | D7 | official-only (`external`) | https://shinhotaka-ropeway.jp/en/ | not tested — network blocked |
| 岐阜縣道路 Live Camera／路況 | D7, D8 | official-only (`external`) | https://douro.pref.gifu.lg.jp/ | not tested — network blocked |

## Data and itinerary gaps

- Five authored external records cannot become 44 playable cameras through React changes. **Japan camera-count/playback parity remains incomplete.** No current or new Trip Data Version is prepared/published by this patch. The reviewed inventory is a research input only; none of its unverified URLs is publication-ready.
- Canonical locked plan is **D6 白川鄉 / D7 新穗高 / D8 飛驒大鐘乳洞 → 松本**. The current camera bindings show D6 village, D7 summit, D7–D8 road. V1 `live-cams.json` uses dynamic shinhotaka/shirakawago/city/east bindings and static sections disagree with the locked itinerary (e.g. route158 items historically listed D6, route156 D7/D8). Do not import those bindings or date-swapping logic. Map any later verified candidate to actual canonical day/place/region IDs, with owner review.
- Repeated IDs/URLs are duplicates in the V1 inventory, not evidence of additional cameras. They must retain all relevant reviewed bindings when deduplicated. Do not infer newest stream IDs or hotlink replacements from a provider landing page.
- Still images provide one fetched picture, not live video, guaranteed freshness or operation status. A local load time is not a capture/source-update time. Weather scores, Official Alerts, road restrictions and operator status remain separate.
- Future content work requires a separately approved new immutable Japan Trip Data Version after individual source/player tests, safe source/official URLs and fixed-itinerary mapping are verified. Never mutate or republish `jp2027.1` to fill the gap. R7/R8 and Step15D are not started here.
