import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { test, expect } from './fixtures'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { matsumotoPacket as packet, restoreMatsumotoCameraPacket8 } from './japanMatsumotoCameraPacketData'
import { japanVersion, mockJapan } from './japanFixtures'
import { seedAuth } from './tripFixtures'

const bytes=readFileSync('docs/proposals/jp2027-schema6-unpublished-draft.json')
const draft=JSON.parse(bytes.toString())
const manifest=JSON.parse(readFileSync('docs/proposals/jp2027-draft-manifest.json','utf8'))
const review=JSON.parse(readFileSync('docs/proposals/jp2027-source-review.json','utf8'))
test('Packet8 exact Matsumoto external camera/source restores all pre-Packet8 content',()=>{
  expect(validateTripSnapshot(draft)).toMatchObject({valid:true})
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.draftSha256)
  expect(manifest).toMatchObject({candidateLabel:'jp2027-schema6-review-draft-11',published:false,isCurrent:false,authorizedForSupabaseWrite:false,invariants:{cameras:7,publishedFixtureUntouched:true,protectedAssetsUntouched:true}})
  expect(packet.playbackVerified).toBe(false)
  expect(packet.embeddingAuthorized).toBe(false)
  expect(packet.verifiedAngles).toHaveLength(3)
  expect(packet.camera).toMatchObject({id:'jp27-cam-matsumoto-castle-official',sourceType:'external',regionId:'jp27-region-matsumoto',placeId:'jp27-place-matsumoto-castle',routeDayIds:['jp27-day-1','jp27-day-2'],sourceURL:'https://visitmatsumoto.com/en/livecamera/'})
  expect(packet.camera).not.toHaveProperty('previewURL')
  expect(packet.source).toMatchObject({type:'official',url:packet.camera.sourceURL,entity:{type:'liveCam',id:packet.camera.id}})
  expect(review.liveCams.packet8MatsumotoCamera).toMatchObject({record:packet.camera,source:packet.source,playbackVerified:false,embeddingAuthorized:false,existingRecordsUntouched:true,acceptance:{item:25,status:'BLOCKED'}})
  const restored=restoreMatsumotoCameraPacket8(draft)
  expect(restored.liveCams).toHaveLength(6)
  expect(restored.liveCams.at(-1)?.id).toBe('jp27-cam-shirakawago-village')
  expect(draft.liveCams.at(-1)?.id).toBe('jp27-cam-shirakawago-village')
  expect(createHash('sha256').update(readFileSync('tests/fixtures/japan2027-schema5.json')).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
})
for(const font of ['small','medium','large']) test('Matsumoto external official camera link works at '+font, async({page},info)=>{
  await page.addInitScript(v=>localStorage.setItem('travelpilot.font-size',v),font)
  const providerHits:string[]=[]
  await page.route('https://visitmatsumoto.com/**',async route=>{providerHits.push(route.request().url());await route.abort()})
  await seedAuth(page)
  const reqs=await mockJapan(page,{versions:[{...japanVersion(),schema_version:6,data_version:manifest.proposedDataVersion,payload:draft}]})
  await page.goto('#/trip/'+draft.trip.slug+'/live')
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：6')
  const card=page.locator('[data-camera-id="'+packet.camera.id+'"]')
  await expect(card).toContainText(packet.camera.description!)
  await expect(card.locator('iframe,img,video')).toHaveCount(0)
  const link=card.getByRole('link',{name:'開啟 Live Cam／官方來源：'+packet.camera.label,exact:true})
  await expect(link).toHaveAttribute('href',packet.camera.sourceURL)
  await expect(link).toHaveAttribute('target','_blank')
  await expect(link).toHaveAttribute('rel',/noopener/)
  await expect(page.locator('[data-camera-id="jp27-cam-shirakawago-village"]')).toBeAttached()
  await expect(page.locator('[data-camera-id="jp27-cam-shirakawago"]')).toBeAttached()
  await card.scrollIntoViewIfNeeded()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(providerHits).toEqual([])
  expect(reqs.every(r=>r.method==='GET')).toBe(true)
  if((info.project.name==='width-320'&&font==='large')||(['width-390','width-1440'].includes(info.project.name)&&font==='medium')) await page.screenshot({path:info.outputPath('castle-cam-'+font+'.png')})
})
