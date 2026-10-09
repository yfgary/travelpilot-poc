import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { validateTripSnapshot, type Schema5Snapshot } from '../src/data/schema/trip'
import { testUser, supabaseOrigin } from './fixtures'

export const japanBytes = readFileSync('tests/fixtures/japan2027-schema5.json')
const result = validateTripSnapshot(JSON.parse(japanBytes.toString()))
if (!result.valid) throw new Error(JSON.stringify(result.issues))
export const japan = result.snapshot as Schema5Snapshot
export const japanVersion = () => ({ trip_id: japan.trip.id, data_version: 'jp2027.1', schema_version: 5, status: 'published', is_current: true, payload: structuredClone(japan) })
export const japanRow = () => ({ id: japan.trip.id, slug: japan.trip.slug, owner_id: testUser.id })
export const jmaReportURL = 'https://www.data.jma.go.jp/developer/xml/data/20270109000000_0_VPWW55_010000.xml'
export function jmaXML(code = '200000', status = '発表', issued = '2027-01-09T09:00:00+09:00') {
  return `<?xml version="1.0"?><Report xmlns="http://xml.kishou.go.jp/jmaxml1/"><Control><Status>通常</Status></Control><Head xmlns="http://xml.kishou.go.jp/jmaxml1/information"><Title>気象警報・注意報</Title><ReportDateTime>${issued}</ReportDateTime><InfoType>発表</InfoType><Headline><Text>公式試験資料</Text></Headline></Head><Body xmlns="http://xml.kishou.go.jp/jmaxml1/body/meteorology"><Warning><Item><Kind><Name>大雪警報</Name><Code>04</Code><Status>${status}</Status></Kind><Area><Name>名前を使用しない地域</Name><Code>${code}</Code></Area></Item></Warning></Body></Report>`
}
export function jmaFeed(urls = [jmaReportURL]) {
  return `<feed xmlns="http://www.w3.org/2005/Atom">${urls.map((url) => `<entry><link type="application/xml" href="${url}"/></entry>`).join('')}</feed>`
}
export async function mockJapan(page: Page, options: { trips?: unknown[]; versions?: unknown[] } = {}) {
  const requests: { table: string; method: string; params: Record<string, string> }[] = []
  await page.route(`${supabaseOrigin}/rest/v1/v2_trips**`, async (route) => {
    const params = new URL(route.request().url()).searchParams
    requests.push({ table: 'v2_trips', method: route.request().method(), params: Object.fromEntries(params) })
    await route.fulfill({ json: options.trips ?? [japanRow()] })
  })
  await page.route(`${supabaseOrigin}/rest/v1/v2_trip_versions**`, async (route) => {
    requests.push({ table: 'v2_trip_versions', method: route.request().method(), params: Object.fromEntries(new URL(route.request().url()).searchParams) })
    await route.fulfill({ json: options.versions ?? [japanVersion()] })
  })
  await page.route('https://www.data.jma.go.jp/**', (route) => route.fulfill({ contentType: 'application/xml', body: route.request().url().includes('/feed/') ? jmaFeed() : jmaXML() }))
  // Never contact a real camera/preview in integration tests.
  for (const cam of japan.liveCams) {
    await page.route(cam.sourceURL, (route) => route.fulfill({ contentType: 'text/html', body: '<p>Mock camera</p>' }))
    if (cam.previewURL) await page.route(cam.previewURL, (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120"/>' }))
  }
  return requests
}
