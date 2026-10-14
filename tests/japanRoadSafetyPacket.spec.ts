import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { test, expect } from './fixtures'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { roadSafetyPacket as packet, restoreRoadSafetyPacket } from './japanRoadSafetyPacketData'
import { restoreNativeNamesPacket9 } from './japanNativeNamesPacketData'
import { mockJapan, japanVersion } from './japanFixtures'
import { seedAuth } from './tripFixtures'

const bytes = readFileSync('docs/proposals/jp2027-schema6-unpublished-draft.json')
const draft = JSON.parse(bytes.toString())
const manifest = JSON.parse(readFileSync('docs/proposals/jp2027-draft-manifest.json', 'utf8'))
const ledger = JSON.parse(readFileSync('docs/proposals/jp2027-source-review.json', 'utf8'))
test('Packet7 exact source/highlight/descriptions reconstruct Packet5 SHA with all routes/times immutable', () => {
  expect(validateTripSnapshot(draft)).toMatchObject({ valid: true })
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.draftSha256)
  expect(manifest).toMatchObject({candidateLabel:'jp2027-schema6-review-draft-11',published:false,isCurrent:false,authorizedForSupabaseWrite:false})
  expect(packet.fields).toHaveLength(3)
  expect(packet.sources).toHaveLength(8)
  expect(packet.highlight).toMatchObject({dayId:'jp27-day-8',index:2,after:'下午直接向東返松本'})
  for(const term of ['丹生川町塩屋','市道','積雪、結冰或交通管制封路','接返158號','唔好為趕17:30到松本而冒險']) expect(packet.highlight.text).toContain(term)
  expect(ledger.roadSafetyPacket7).toMatchObject({verifiedBy:'GPT-6',sources:packet.sources,fields:packet.fields,highlight:packet.highlight,actualJan2027RoadStatusVerified:false,winterDetourGuaranteedOpen:false,acceptance:{item:20,status:'PARTIAL'}})
  const originalBytes = readFileSync('tests/fixtures/japan2027-schema5.json')
  expect(createHash('sha256').update(originalBytes).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
  const original = JSON.parse(originalBytes.toString())
  expect(draft.images).toEqual(original.images)
  // Packet9 adds optional sourced localName fields only. Reverse that exact
  // delta with its pinned SHA256 proof before comparing EVERY legacy target.
  expect(restoreNativeNamesPacket9(draft).navigationTargets).toEqual(original.navigationTargets)
  for (const day of original.days) {
    const next = draft.days.find((d: {id:string}) => d.id === day.id)
    expect(next.date).toBe(day.date)
    expect(next.routeSummary).toBe(day.routeSummary)
    for (const t of day.timeline) {
      const actual = next.timeline.find((i: {id:string}) => i.id === t.id)
      for (const key of ['id','type','startTime','endTime','durationMinutes','timing','placeId','transportId','accommodationId','navigationTargetId','hardCutId']) expect(actual[key],t.id+'.'+key).toEqual(t[key])
    }
  }
  expect(restoreRoadSafetyPacket(draft).sources).toHaveLength(draft.sources.length-8-1)
})
for (const view of ['itinerary','today']) for (const font of ['small','medium','large']) test('R158 safety in '+view+' '+font, async({page},info)=>{
  await page.addInitScript(size=>localStorage.setItem('travelpilot.font-size',size),font)
  await seedAuth(page)
  const requests=await mockJapan(page,{versions:[{...japanVersion(),schema_version:6,data_version:manifest.proposedDataVersion,payload:draft}]})
  await page.goto('#/trip/'+draft.trip.slug+'/'+view)
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：6')
  for (const f of packet.fields) {
    if (view==='today') await page.getByRole('navigation',{name:'今日模式行程日期'}).getByRole('button',{name:f.dayId.replace('jp27-day-','D'),exact:true}).click()
    const section = view==='today' ? page.getByTestId('today-mode') : page.locator('details[data-day-id="'+f.dayId+'"]')
    if (view==='itinerary' && await section.getAttribute('open')===null) await section.locator('summary').first().click()
    const row=section.locator((view==='today' ? '.today-activities ' : '')+'[data-item-id="'+f.id+'"]')
    await expect(row).toContainText(f.appended)
    // The Today Mode renderer collapses newline-separated description paragraphs.
    // Assert every exact historical paragraph independently; keep full-byte
    // previous/appended equality enforced by restoreRoadSafetyPacket above.
    for (const paragraph of f.previous.split('\n').filter(Boolean)) {
      await expect(row).toContainText(paragraph)
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  }
  if(view==='today') await page.getByRole('navigation',{name:'今日模式行程日期'}).getByRole('button',{name:'D8',exact:true}).click()
  const section=view==='today' ? page.getByTestId('today-mode') : page.locator('details[data-day-id="jp27-day-8"]')
  if(view==='itinerary' && await section.getAttribute('open')===null) await section.locator('summary').first().click()
  await expect(section).toContainText(packet.highlight.text)
  for(const h of packet.highlight.previous) await expect(section).toContainText(h)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  if ((info.project.name==='width-320'&&font==='large')||(['width-390','width-1440'].includes(info.project.name)&&font==='medium')) await page.screenshot({path:info.outputPath('r158-'+view+'-d8-'+font+'.png')})
  expect(requests.every(r=>r.method==='GET')).toBe(true)
})
