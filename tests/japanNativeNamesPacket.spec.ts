import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { test, expect } from './fixtures'
import { validateTripSnapshot } from '../src/data/schema/trip'
import { nativePacket as packet, restoreNativeNamesPacket9 } from './japanNativeNamesPacketData'
import { japanVersion, mockJapan } from './japanFixtures'
import { seedAuth } from './tripFixtures'

const bytes=readFileSync('docs/proposals/jp2027-schema6-unpublished-draft.json')
const draft=JSON.parse(bytes.toString())
const manifest=JSON.parse(readFileSync('docs/proposals/jp2027-draft-manifest.json','utf8'))
const ledger=JSON.parse(readFileSync('docs/proposals/jp2027-source-review.json','utf8'))
test('Packet9 exact native-name-only and eight bound source delta restores Packet8 SHA',()=>{
  expect(validateTripSnapshot(draft)).toMatchObject({valid:true})
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.draftSha256)
  expect(manifest).toMatchObject({candidateLabel:'jp2027-schema6-review-draft-11',published:false,isCurrent:false,authorizedForSupabaseWrite:false})
  expect(packet.fields).toHaveLength(8)
  expect(packet.sources).toHaveLength(8)
  expect(packet.fields.filter(x=>x.kind==='navigationTarget')).toHaveLength(6)
  expect(packet.fields.filter(x=>x.kind==='transport')).toHaveLength(2)
  for(const f of packet.fields){
    const data=(f.kind==='transport'?draft.transport:draft.navigationTargets).find((x:{id:string})=>x.id===f.id)
    expect(data.localName).toBe(f.localName)
    expect(packet.sources.some(s=>s.entity?.type===f.kind&&s.entity?.id===f.id&&s.type==='official')).toBe(true)
  }
  expect(ledger.nativeNamesPacket9).toMatchObject({verifiedBy:'GPT-6',fields:packet.fields,sources:packet.sources,acceptance:{item:15,status:'PARTIAL'},independentCodexResearch:false})
  const r=restoreNativeNamesPacket9(draft)
  expect(r.liveCams).toEqual(draft.liveCams)
  expect(r.days).toEqual(draft.days)
  expect(r.navigationTargets.every((x:{id:string;localName?:string})=>!('localName' in x))).toBe(true)
  expect(createHash('sha256').update(readFileSync('tests/fixtures/japan2027-schema5.json')).digest('hex')).toBe('09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e')
})
for(const font of ['small','medium','large']) test('Official native-name fields displayed in generic Trip Info cards at '+font,async({page},info)=>{
  await page.addInitScript(v=>localStorage.setItem('travelpilot.font-size',v),font)
  await seedAuth(page)
  const requests=await mockJapan(page,{versions:[{...japanVersion(),schema_version:6,data_version:manifest.proposedDataVersion,payload:draft}]})
  await page.goto('#/trip/'+draft.trip.slug+'/info')
  await expect(page.getByTestId('trip-versions')).toContainText('Trip Schema Version：6')
  for(const f of packet.fields){
    if(f.kind==='navigationTarget'){
      const nav=draft.navigationTargets.find((x:{id:string})=>x.id===f.id)
      const card=page.locator('.navigation-card').filter({hasText:nav.title})
      await expect(card).toContainText(f.localName)
      await expect(card.getByTestId('native-name')).toHaveText(f.localName)
    }else{
      const tr=draft.transport.find((x:{id:string})=>x.id===f.id)
      const matches=page.locator('.transport-card').filter({hasText:tr.origin+' → '+tr.destination})
      await expect(matches).toContainText(f.localName)
    }
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(requests.every(r=>r.method==='GET')).toBe(true)
  if((info.project.name==='width-320'&&font==='large')||(['width-390','width-1440'].includes(info.project.name)&&font==='medium'))await page.screenshot({path:info.outputPath('native-names-'+font+'.png')})
})
