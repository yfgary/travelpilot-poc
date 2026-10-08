import type { TripSnapshot } from './schema/trip'
import { safeExternalURL } from './itinerary'
export type LiveCamera = TripSnapshot['liveCams'][number]
export const cameraPriorityLabels = { primary: '必睇', reference: '參考', backup: 'Backup' } as const
export const cameraSourceLabels = { embed: 'Live', image: 'Live Image', external: '官方來源' } as const
export function getLiveCamDayIds(cam: LiveCamera): string[] {
  return 'routeDayIds' in cam ? [...cam.routeDayIds] : cam.routeDayId ? [cam.routeDayId] : []
}
export function resolveCamera(snapshot: TripSnapshot, cam: LiveCamera) {
  const place = snapshot.places.find((place) => place.id === cam.placeId)
  const region = snapshot.regions.find((region) => region.id === (cam.regionId ?? place?.regionId))
  const dayIds = getLiveCamDayIds(cam)
  return { cam, place, region, days: [...snapshot.days].filter((day) => dayIds.includes(day.id)).sort((a, b) => a.dayNumber - b.dayNumber),
    description: 'description' in cam ? cam.description : undefined,
    priority: 'priority' in cam ? cam.priority : undefined,
    tags: 'tags' in cam ? cam.tags : [],
    sourceLabel: ('sourceLabel' in cam ? cam.sourceLabel : undefined) ?? cameraSourceLabels[cam.sourceType],
  }
}
export type ResolvedCamera = ReturnType<typeof resolveCamera>
export function cameraFilterDays(snapshot: TripSnapshot) {
  const ids = new Set(snapshot.liveCams.flatMap(getLiveCamDayIds))
  return [...snapshot.days].filter((day) => ids.has(day.id)).sort((a, b) => a.dayNumber - b.dayNumber)
}
export function groupLiveCams(snapshot: TripSnapshot, dayId?: string) {
  const cameras = snapshot.liveCams.filter((cam) => !dayId || getLiveCamDayIds(cam).includes(dayId)).map((cam) => resolveCamera(snapshot, cam))
  const groups = snapshot.regions.map((region) => ({ id: region.id, label: region.label ?? region.name, cameras: cameras.filter((item) => item.region?.id === region.id) })).filter((group) => group.cameras.length)
  const global = cameras.filter((item) => !item.region)
  return global.length ? [...groups, { id: '__global', label: '其他／全程', cameras: global }] : groups
}
export function secureInlineURL(value: string | undefined) {
  const safe = safeExternalURL(value)
  return safe?.startsWith('https://') && !new URL(safe).username && !new URL(safe).password ? safe : undefined
}
export function cameraPresentation(cam: LiveCamera) {
  const source = secureInlineURL(cam.sourceURL)
  return { mode: source && cam.sourceType !== 'external' ? cam.sourceType : 'external', source, preview: secureInlineURL(cam.previewURL) } as const
}
export function cameraActions(cam: LiveCamera) {
  const used = new Set<string>()
  return ([{ url: cam.sourceURL, label: '開啟 Live Cam／官方來源' }, { url: cam.officialURL, label: '官方來源' }, { url: cam.statusURL, label: '查看官方狀態' }]).flatMap((action) => {
    const url = safeExternalURL(action.url)
    if (!url || used.has(url)) return []
    used.add(url); return [{ ...action, url }]
  })
}
