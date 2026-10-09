import { jmaConfigurationSchema, officialAlertSchema, type JmaConfiguration, type OfficialAlert } from '../../data/schema/weather'
import type { AlertAdapter } from './alerts'

const MAX_XML_SIZE = 2_000_000
function parseXML(xml: string, root: string): Document {
  // Browser DOMParser never executes XML. Reject DTD/entities before parsing, and reject HTML/error trees.
  if (xml.length > MAX_XML_SIZE || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Unsafe XML')
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  if (document.getElementsByTagName('parsererror').length || document.documentElement.localName !== root) throw new Error('Invalid XML')
  return document
}
const children = (node: Element | Document, name: string) => [...node.getElementsByTagNameNS('*', name)]
const first = (node: Element | Document, name: string) => children(node, name)[0]?.textContent?.trim() ?? ''
function officialURL(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.hostname !== 'www.data.jma.go.jp' || url.username || url.password || !url.pathname.endsWith('.xml')) throw new Error('Unofficial XML source')
  return url.href
}
function productFor(url: string, config: JmaConfiguration): { code: string; type: OfficialAlert['type'] } | null {
  const tokens = new URL(url).pathname.split('/').at(-1)?.replace(/\.xml$/, '').split('_') ?? []
  const groups = [['weatherWarnings', 'weather-warning', 'other'], ['earthquake', 'earthquake', 'earthquake'], ['tsunami', 'tsunami', 'tsunami'], ['volcano', 'volcano', 'volcano']] as const
  for (const [key, product, type] of groups) {
    const code = config.productCodes[key].find((code) => tokens.includes(code))
    if (config.products.includes(product) && code) return { code, type }
  }
  return null
}
export function jmaReportLinks(xml: string, config: JmaConfiguration): string[] {
  const document = parseXML(xml, 'feed')
  const urls = children(document, 'entry').flatMap((entry) => children(entry, 'link').flatMap((link) => {
    const value = link.getAttribute('href')
    if (!value || (link.getAttribute('type') && link.getAttribute('type') !== 'application/xml')) return []
    const url = officialURL(value)
    return productFor(url, config) ? [url] : []
  }))
  return [...new Set(urls)]
}
function stableID(value: string): string {
  let hash = 2166136261
  for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619) }
  return (hash >>> 0).toString(16)
}
function readReport(xml: string, sourceURL: string, provider: Parameters<AlertAdapter>[0]) {
  const config = jmaConfigurationSchema.parse(provider.config), url = officialURL(sourceURL), matchedProduct = productFor(url, config)
  if (!matchedProduct) return { issuedAt: 0, updates: [] as { key: string; alerts: OfficialAlert[] }[] }
  const product = matchedProduct.type
  const document = parseXML(xml, 'Report'), head = children(document, 'Head')[0], control = children(document, 'Control')[0]
  if (!head || !control) throw new Error('Missing report metadata')
  if (first(control, 'Status') !== '通常') return { issuedAt: 0, updates: [] as { key: string; alerts: OfficialAlert[] }[] }
  const issuedAt = first(head, 'ReportDateTime'), title = first(head, 'Title'), description = first(head, 'Text') || first(document, 'HeadlineText')
  // Match structured configured area codes only; descriptive matchNames never route a report.
  // Reports without a supported area-code relationship are omitted, never broadcast to every region.
  if (!Number.isFinite(Date.parse(issuedAt))) throw new Error('Invalid report timestamp')
  const updates: { key: string; alerts: OfficialAlert[] }[] = []
  for (const group of config.regionGroups) {
    const areas = children(document, 'Area').filter((area) => group.jmaAreaCodes.includes(first(area, 'Code')))
    if (!areas.length) continue
    const items = [...new Set(areas.map((area) => area.closest('Item') ?? area.parentElement).filter((item): item is Element => Boolean(item)))]
    const kinds = items.flatMap((item) => children(item, 'Kind'))
    const active = kinds.filter((kind) => !['解除', '取消', '警報なし', '注意報なし'].includes(first(kind, 'Status')) && !['00', '解除'].includes(first(kind, 'Code')))
    const key = `${product}:${group.jmaAreaCodes.join(',')}:${product === 'other' ? matchedProduct.code : first(head, 'EventID')}`
    if (first(head, 'InfoType') === '取消' || (kinds.length && !active.length)) { updates.push({ key, alerts: [] }); continue }
    const names = active.map((kind) => first(kind, 'Name')).filter(Boolean)
    const warning = names.join('、')
    // Provider-specific vocabulary normalization is independent of trip/country selection.
    const type: OfficialAlert['type'] = product !== 'other' ? product : /大雪|風雪/.test(warning) ? 'snow' : /大雨/.test(warning) ? 'heavy_rain' : /洪水/.test(warning) ? 'flood' : /雷/.test(warning) ? 'thunderstorm' : /暴風|強風/.test(warning) ? 'wind' : 'other'
    const severity: OfficialAlert['severity'] = /特別警報|大津波/.test(warning) ? 'extreme' : /警報/.test(warning) ? 'severe' : /注意報/.test(warning) ? 'moderate' : 'info'
    updates.push({ key, alerts: [officialAlertSchema.parse({ id: `${provider.id}:${stableID(url + ':' + group.jmaAreaCodes.join(',') + ':' + warning)}`, providerId: provider.id, providerLabel: provider.label ?? 'JMA', type, severity,
      title: warning ? `${title}：${warning}` : title, description: description || undefined, issuedAt, weatherRegionIds: group.weatherRegionIds, officialUrl: url, isTest: false })] })
  }
  return { issuedAt: Date.parse(issuedAt), updates }
}
export function normalizeJmaReport(xml: string, sourceURL: string, provider: Parameters<AlertAdapter>[0]): OfficialAlert[] {
  return readReport(xml, sourceURL, provider).updates.flatMap((update) => update.alerts)
}
async function fetchXML(url: string): Promise<string> {
  const response = await fetch(officialURL(url), { signal: AbortSignal.timeout(15000), credentials: 'omit', redirect: 'error' })
  if (!response.ok || Number(response.headers.get('content-length')) > MAX_XML_SIZE) throw new Error('JMA unavailable')
  return response.text()
}
export const jmaAlertAdapter: AlertAdapter = async (provider) => {
  const config = jmaConfigurationSchema.parse(provider.config)
  const feedURLs = new Set<string>()
  if (config.products.includes('weather-warning')) feedURLs.add(config.feedURLs.weatherExtra)
  if (config.products.some((product) => product !== 'weather-warning')) feedURLs.add(config.feedURLs.earthquakeVolcano)
  const feeds = await Promise.all([...feedURLs].map(fetchXML))
  const links = [...new Set(feeds.flatMap((xml) => jmaReportLinks(xml, config)))]
  // Never report a truncated feed as complete. Sequential batches avoid flooding the official service.
  if (links.length > 100) throw new Error('JMA feed exceeds safe report limit')
  const reports: ReturnType<typeof readReport>[] = []
  for (let offset = 0; offset < links.length; offset += 4) reports.push(...await Promise.all(links.slice(offset, offset + 4).map(async (url) => readReport(await fetchXML(url), url, provider))))
  const updates = new Map<string, OfficialAlert[]>()
  for (const report of reports.sort((a, b) => a.issuedAt - b.issuedAt)) for (const update of report.updates) updates.set(update.key, update.alerts)
  return [...updates.values()].flat()
}
