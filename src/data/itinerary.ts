import type { TripSnapshot } from './schema/trip'
import { getEmergencyInfo } from './schema/trip'
import { calendarDate, formatTripDate } from './tripDates'

export type TripDay = TripSnapshot['days'][number]
export type TimelineItem = TripDay['timeline'][number]
export type Place = TripSnapshot['places'][number]
export type Accommodation = TripSnapshot['accommodations'][number]
export type Transport = TripSnapshot['transport'][number]
export type NavigationTarget = TripSnapshot['navigationTargets'][number]
export type HardCut = TripSnapshot['hardCuts'][number]
export type EntityReference = TripDay['optionalContent'][number]
type Money = NonNullable<Place['fee']>

export const timelineTypes: Record<TimelineItem['type'], { icon: string; label: string }> = {
  activity: { icon: '📍', label: '活動' }, travel: { icon: '↗', label: '交通' },
  meal: { icon: '🍽', label: '餐飲' }, stay: { icon: '⌂', label: '住宿' },
  break: { icon: '☕', label: '休息' }, other: { icon: '•', label: '其他' },
}
export const placeTypes: Record<Place['type'], string> = { attraction: '景點', nature: '自然', shopping: '購物', food: '餐飲', other: '其他' }
export const transportTypes: Record<Transport['type'], string> = { flight: '航班', train: '鐵路', bus: '巴士', car: '自駕', ferry: '渡輪', walk: '步行', taxi: '的士', other: '交通' }
/** Known accommodation category codes mapped into Chinese without altering source data. */
const accommodationTypeNames: Readonly<Record<string,string>> = {
  hotel: '酒店', 'business hotel': '商務酒店', 'business-hotel': '商務酒店',
  ryokan: '日式旅館', 'onsen ryokan': '溫泉旅館', 'onsen-ryokan': '溫泉旅館',
  lodge: '山莊／旅舍', cabin: '小屋', chalet: '山區木屋', resort: '度假酒店',
  hostel: '青年旅舍', guesthouse: '民宿', 'guest house': '民宿',
  minshuku: '日式民宿', apartment: '公寓', aparthotel: '服務式公寓',
  'serviced apartment': '服務式公寓', 'vacation rental': '度假出租住宿',
  inn: '旅館', motel: '汽車旅館', homestay: '民宿', villa: '別墅',
}
export function accommodationTypeLabel(value: string): string {
  const type = value.trim()
  return accommodationTypeNames[type.toLocaleLowerCase('en')] ?? type
}
export const severityLabels: Record<HardCut['severity'], string> = { info: '提示', warning: '注意', critical: '嚴重' }

export function formatDuration(minutes: number | undefined): string | undefined {
  if (minutes === undefined) return undefined
  const hours = Math.floor(minutes / 60), remainder = minutes % 60
  return hours ? `${hours}小時${remainder ? `${remainder}分鐘` : ''}` : `${minutes}分鐘`
}
export function formatMoney(money: Money | undefined): string | undefined {
  if (!money) return undefined
  const value = new Intl.NumberFormat('zh-HK', { style: 'currency', currency: money.currency, currencyDisplay: 'code' }).format(money.amount)
  return `${value}${money.notes ? `（${money.notes}）` : ''}`
}
type MappedEntity = { mapURL?: string; mapQuery?: string; coordinates?: { latitude: number; longitude: number } }
export function safeExternalURL(url: string | undefined): string | undefined {
  if (!url) return undefined
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : undefined } catch { return undefined }
}
export function resolveMaps(entity: MappedEntity | undefined): string | undefined {
  if (!entity) return undefined
  const url = safeExternalURL(entity.mapURL)
  if (url) return url
  const query = entity.mapQuery?.trim() || (entity.coordinates ? `${entity.coordinates.latitude},${entity.coordinates.longitude}` : undefined)
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : undefined
}
export function initialDayId(snapshot: TripSnapshot, now = new Date()): string | undefined {
  const today = calendarDate(now, snapshot.trip.timezone)
  return snapshot.days.find((day) => day.date === today)?.id ?? [...snapshot.days].sort((a, b) => a.dayNumber - b.dayNumber)[0]?.id
}
export function dayHardCuts(snapshot: TripSnapshot, day: TripDay): HardCut[] {
  return snapshot.hardCuts.filter((cut) => cut.dayId === day.id || day.timeline.some((item) => item.hardCutId === cut.id))
    .sort((a, b) => b.priority - a.priority)
}
export function hardCutTime(cut: HardCut, timezone: string): string {
  if (cut.time) return cut.time
  const date = new Date(cut.datetime!)
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
  return `${formatTripDate(calendarDate(date, timezone))} ${time}`
}
export function entityLabel(snapshot: TripSnapshot, ref: EntityReference): string {
  const collections: Record<EntityReference['type'], readonly { id: string; name?: string; title?: string; label?: string; alt?: string }[]> = {
    trip: [snapshot.trip], region: snapshot.regions, day: snapshot.days, timeline: snapshot.days.flatMap((day) => day.timeline),
    place: snapshot.places, accommodation: snapshot.accommodations, transport: snapshot.transport,
    navigationTarget: snapshot.navigationTargets, hardCut: snapshot.hardCuts, checklist: snapshot.checklists,
    checklistGroup: snapshot.checklists.flatMap((list) => list.groups), checklistItem: snapshot.checklists.flatMap((list) => list.groups.flatMap((group) => group.items)),
    weatherRegion: snapshot.weather.weatherRegions, activityProfile: snapshot.weather.activityProfiles,
    liveCam: snapshot.liveCams, image: snapshot.images, source: snapshot.sources,
    emergencyContact: getEmergencyInfo(snapshot)?.contacts ?? [],
  }
  const entity = collections[ref.type].find((entity) => entity.id === ref.id)
  if (entity) for (const key of ['name', 'title', 'label', 'alt'] as const) {
    if (key in entity && typeof entity[key] === 'string') return entity[key]
  }
  return '相關旅程資料'
}
