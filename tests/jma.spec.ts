import { test, expect } from './fixtures'
import { japan, jmaXML, jmaFeed, jmaReportURL } from './japanFixtures'
import { jmaTools } from './jmaHarness'
import type { OfficialAlert } from '../src/data/schema/weather'

type Tools = typeof import('../src/services/weather/jma') & typeof import('../src/services/weather/alerts')
const provider = japan.weather.alertProviders[0]
for (const [code, expected] of [['200000', provider.weatherRegionIds!.slice(0, 5)], ['210000', provider.weatherRegionIds!.slice(5)], ['999999', []]] as const) test(`JMA routes structured configured code ${code}, never area names`, async ({ page }) => {
  await jmaTools(page)
  const alerts = await page.evaluate(({ xml, url, provider }) => (window as unknown as { jmaTools: Tools }).jmaTools.normalizeJmaReport(xml, url, provider), { xml: jmaXML(code), url: jmaReportURL, provider })
  expect(alerts.flatMap((alert) => alert.weatherRegionIds)).toEqual(expected)
  if (alerts.length) expect(alerts[0]).toMatchObject({ type: 'snow', severity: 'severe', isTest: false, providerId: provider.id, issuedAt: '2027-01-09T09:00:00+09:00' })
})
for (const reason of ['DTD', 'malformed', 'HTML', 'oversize', 'unofficial source'] as const) test(`JMA XML fails safely for ${reason}`, async ({ page }) => {
  await jmaTools(page)
  const xml = reason === 'DTD' ? '<!DOCTYPE Report [<!ENTITY x SYSTEM "file:///etc/passwd">]>'+jmaXML() : reason === 'malformed' ? '<Report><broken>' : reason === 'HTML' ? '<html><body>Error</body></html>' : reason === 'oversize' ? ' '.repeat(2_000_001) : jmaXML()
  const error = await page.evaluate(({ xml, url, provider }) => { try { (window as unknown as { jmaTools: Tools }).jmaTools.normalizeJmaReport(xml, url, provider); return false } catch { return true } }, { xml, url: reason === 'unofficial source' ? 'https://proxy.invalid/report.xml' : jmaReportURL, provider })
  expect(error).toBe(true)
})
for (const state of ['解除', '取消', '訓練']) test(`JMA excludes ${state} from active alerts`, async ({ page }) => {
  await jmaTools(page)
  const xml = state === '訓練' ? jmaXML().replace('通常','訓練') : state === '取消' ? jmaXML().replace('<InfoType>発表', '<InfoType>取消') : jmaXML('200000', '解除')
  expect(await page.evaluate(({ xml, url, provider }) => (window as unknown as { jmaTools: Tools }).jmaTools.normalizeJmaReport(xml, url, provider), { xml, url: jmaReportURL, provider })).toEqual([])
})
test('JMA feed uses configured product codes and safe official XML URLs', async ({ page }) => {
  await jmaTools(page)
  const config = provider.config!
  const alternate = jmaReportURL.replace('_0_VPWW55', '_VPWW55')
  const urls = [jmaReportURL, alternate, jmaReportURL, jmaReportURL.replace('VPWW55','XXXX99')]
  const result = await page.evaluate(({ xml, config }) => (window as unknown as { jmaTools: Tools }).jmaTools.jmaReportLinks(xml, config as Parameters<Tools['jmaReportLinks']>[1]), { xml: jmaFeed(urls), config })
  expect(result).toEqual([jmaReportURL, alternate])
})
test('JMA registry normalizes mocked official reports, latest cancellation wins and failure stays separate from scoring', async ({ page }) => {
  await jmaTools(page)
  const laterURL = jmaReportURL.replace('20270109000000','20270109010000')
  await page.route('https://www.data.jma.go.jp/**', (route) => route.fulfill({ contentType: 'application/xml', body: route.request().url().includes('/feed/') ? jmaFeed([laterURL,jmaReportURL]) : route.request().url() === laterURL ? jmaXML('200000', '解除', '2027-01-09T10:00:00+09:00') : jmaXML() }))
  const before = structuredClone(japan.weather)
  const result = await page.evaluate((config) => (window as unknown as { jmaTools: Tools }).jmaTools.loadAlerts(config), japan.weather)
  expect(result).toEqual({ alerts: [], unavailable: false }); expect(japan.weather).toEqual(before)
  await page.route('https://www.data.jma.go.jp/**', (route) => route.abort('failed'))
  expect(await page.evaluate((config) => (window as unknown as { jmaTools: Tools }).jmaTools.loadAlerts(config), japan.weather)).toEqual({ alerts: [], unavailable: true })
})
for (const [code, type] of [['VXSE51','earthquake'], ['VTSE41','tsunami'], ['VFVO50','volcano']] as const) test(`JMA configured ${type} report normalizes without geographic selection`, async ({ page }) => {
  await jmaTools(page)
  const alerts: OfficialAlert[] = await page.evaluate(({ xml, url, provider }) => (window as unknown as { jmaTools: Tools }).jmaTools.normalizeJmaReport(xml, url, provider), { xml: jmaXML(), url: jmaReportURL.replace('VPWW55',code), provider })
  expect(alerts).toHaveLength(1); expect(alerts[0].type).toBe(type)
})
