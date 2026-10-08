import { z } from 'zod'
import { weatherConfigurationSchema } from './weather'

export const CURRENT_TRIP_SCHEMA_VERSION = 3
export const TRIP_SCHEMA_VERSION = CURRENT_TRIP_SCHEMA_VERSION
export const SUPPORTED_TRIP_SCHEMA_VERSIONS = [1, 2, 3] as const
export function isSupportedTripSchemaVersion(value: unknown): value is typeof SUPPORTED_TRIP_SCHEMA_VERSIONS[number] {
  return SUPPORTED_TRIP_SCHEMA_VERSIONS.some((version) => version === value)
}
const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const text = z.string().min(1)
const date = z.iso.date()
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const datetime = z.iso.datetime({ offset: true })
const nonnegative = z.number().finite().nonnegative()
const httpURL = z.url().refine((value) => /^https?:\/\//.test(value), 'Expected HTTP(S) URL')
const coordinates = z.strictObject({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })
const timezone = text.refine((value) => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true } catch { return false } }, 'Invalid timezone')
const ids = z.array(id)
const notes = z.array(text)
const money = z.strictObject({ amount: nonnegative, currency: z.string().regex(/^[A-Z]{3}$/), notes: text.optional() })
const entityKinds = ['trip', 'region', 'day', 'timeline', 'place', 'accommodation', 'transport', 'navigationTarget', 'hardCut', 'checklist', 'checklistGroup', 'checklistItem', 'weatherRegion', 'activityProfile', 'liveCam', 'image', 'source'] as const
const entityReference = z.strictObject({ type: z.enum(entityKinds), id })
const timeline = z.strictObject({
  id, type: z.enum(['activity', 'travel', 'meal', 'stay', 'break', 'other']), title: text,
  startTime: time.optional(), endTime: time.optional(), description: text.optional(), durationMinutes: nonnegative.optional(),
  placeId: id.optional(), accommodationId: id.optional(), transportId: id.optional(), navigationTargetId: id.optional(), hardCutId: id.optional(),
  optional: z.boolean(), bonus: z.boolean().optional(), warning: text.optional(),
})

// Schema 1's strict common contract is retained. Schema 2 extends only emergency
// content and entity references; both versions use the same relationship validator.
const commonShape = {
  trip: z.strictObject({
    id, slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: text, shortTitle: text.optional(),
    destinationLabel: text, summary: text, introduction: text.optional(), startDate: date, endDate: date, timezone,
    heroImageId: id.optional(), bannerImageId: id.optional(),
  }),
  regions: z.array(z.strictObject({ id, name: text, label: text.optional(), timezone: timezone.optional(), coordinates: coordinates.optional(), weatherConfigurationId: id.optional() })),
  days: z.array(z.strictObject({
    id, dayNumber: z.number().int().positive(), date, title: text, routeSummary: text, highlights: notes, imageIds: ids,
    accommodationId: id.optional(), primaryWeatherRegionId: id.optional(), constraints: notes, warnings: notes,
    timeline: z.array(timeline), optionalContent: z.array(entityReference), backupContent: z.array(entityReference),
  })),
  places: z.array(z.strictObject({
    id, name: text, regionId: id, type: z.enum(['attraction', 'nature', 'shopping', 'food', 'other']), summary: text,
    longDescription: text.optional(), whyVisit: text.optional(), history: text.optional(), localImportance: text.optional(),
    whatToSee: notes.optional(), takeaway: text.optional(), suggestedDurationMinutes: nonnegative.optional(),
    opening: text.optional(), lastEntry: text.optional(), closing: text.optional(), fee: money.optional(), feeNotes: text.optional(),
    rating: z.number().min(0).max(10).optional(), coordinates: coordinates.optional(), mapURL: httpURL.optional(), officialURL: httpURL.optional(),
    imageIds: ids, activityProfileIds: ids, sourceIds: ids,
  })),
  accommodations: z.array(z.strictObject({
    id, name: text, type: text, address: text.optional(), phone: text.optional(), mapURL: httpURL.optional(),
    stayStartDate: date, stayEndDate: date, room: text.optional(), mealPlan: text.optional(),
    bookingState: text.optional(), paymentState: text.optional(), total: money.optional(), paid: money.optional(), arrivalPayment: money.optional(),
    checkIn: time.optional(), checkOut: time.optional(), cancellation: text.optional(), parking: text.optional(), notes,
  })),
  transport: z.array(z.strictObject({
    id, type: z.enum(['flight', 'train', 'bus', 'car', 'ferry', 'walk', 'taxi', 'other']), provider: text.optional(), service: text.optional(),
    origin: text, destination: text, departure: datetime.optional(), arrival: datetime.optional(), durationMinutes: nonnegative.optional(),
    bookingState: text.optional(), paymentState: text.optional(), price: money.optional(), mapURL: httpURL.optional(), navigationTargetIds: ids, notes, warnings: notes,
  })),
  navigationTargets: z.array(z.strictObject({
    id, type: z.enum(['parking', 'entrance', 'station', 'pickup', 'dropoff', 'other']), title: text,
    placeId: id.optional(), mapQuery: text.optional(), mapURL: httpURL.optional(), coordinates: coordinates.optional(), description: text.optional(), warning: text.optional(),
  })),
  hardCuts: z.array(z.strictObject({
    id, dayId: id.optional(), time: time.optional(), datetime: datetime.optional(), title: text,
    severity: z.enum(['info', 'warning', 'critical']), priority: z.number().int().nonnegative(), category: text.optional(), icon: text.optional(), description: text, sourceId: id.optional(),
  }).refine((cut) => Boolean(cut.time) !== Boolean(cut.datetime), 'Provide either time or datetime')),
  checklists: z.array(z.strictObject({
    id, type: text, title: text, description: text.optional(), order: z.number().int().nonnegative(), notes,
    groups: z.array(z.strictObject({ id, title: text, order: z.number().int().nonnegative(), notes,
      items: z.array(z.strictObject({ id, label: text, order: z.number().int().nonnegative(), notes })),
    })),
  })),
  weather: z.strictObject({
    weatherRegions: z.array(z.strictObject({ id, regionId: id, label: text, coordinates: coordinates.optional(), provider: text.optional(), operationNotes: notes })),
    activityProfiles: z.array(z.strictObject({ id, label: text, weights: z.record(text, nonnegative), operationNotes: notes })),
    weighting: z.array(z.strictObject({ regionId: id.optional(), dayId: id.optional(), activityProfileId: id, weight: nonnegative })),
    scoring: z.strictObject({ schemaVersion: z.number().int().positive(), config: z.record(text, nonnegative) }), operationNotes: notes,
  }),
  liveCams: z.array(z.strictObject({
    id, label: text, regionId: id.optional(), placeId: id.optional(), routeDayId: id.optional(), group: text.optional(),
    sourceType: z.enum(['embed', 'image', 'external']), sourceURL: httpURL, previewURL: httpURL.optional(), officialURL: httpURL.optional(), statusURL: httpURL.optional(),
  })),
  images: z.array(z.strictObject({
    id, url: text.refine((url) => /^https?:\/\//.test(url) ? httpURL.safeParse(url).success : !/^(?:\/|[a-z]+:)|(?:^|\/)\.\.(?:\/|$)|[\\\u0000-\u001f]/i.test(url), 'Invalid asset URL'),
    alt: text, sourceURL: httpURL.optional(), attribution: text.optional(), licenseNote: text.optional(),
  })),
  sources: z.array(z.strictObject({ id, title: text, url: httpURL, type: text, checkedAt: datetime.optional(), entity: entityReference.optional() })),
}
const emergencyEntityReference = z.strictObject({ type: z.enum([...entityKinds, 'emergencyContact']), id })
const emergencySchema = z.strictObject({
  title: text.optional(), description: text.optional(), notes,
  contacts: z.array(z.strictObject({
    id, type: z.enum(['police', 'ambulance', 'fire', 'medical', 'roadside', 'embassy', 'consulate', 'insurance', 'accommodation', 'other']),
    title: text, phone: text.optional(), url: httpURL.optional(), regionId: id.optional(),
    description: text.optional(), availability: text.optional(), notes, sourceIds: ids,
  })),
})
const versionedSnapshotSchema = z.discriminatedUnion('schemaVersion', [
  z.strictObject({ ...commonShape, schemaVersion: z.literal(1) }),
  z.strictObject({ ...commonShape, schemaVersion: z.literal(2), emergency: emergencySchema,
    days: z.array(commonShape.days.element.extend({ optionalContent: z.array(emergencyEntityReference), backupContent: z.array(emergencyEntityReference) })),
    sources: z.array(commonShape.sources.element.extend({ entity: emergencyEntityReference.optional() })),
  }),
  z.strictObject({ ...commonShape, schemaVersion: z.literal(3), weather: weatherConfigurationSchema, emergency: emergencySchema,
    days: z.array(commonShape.days.element.extend({ optionalContent: z.array(emergencyEntityReference), backupContent: z.array(emergencyEntityReference) })),
    sources: z.array(commonShape.sources.element.extend({ entity: emergencyEntityReference.optional() })),
  }),
])
export const tripSnapshotSchema = versionedSnapshotSchema.superRefine((snapshot, ctx) => {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })
  const sets = new Map<string, Set<string>>([...entityKinds, 'emergencyContact', 'forecastProvider', 'alertProvider'].map((kind) => [kind, new Set<string>()]))
  const seen = new Set<string>()
  function register(kind: string, records: { id: string }[], path: (string | number)[]) {
    records.forEach((record, index) => {
      if (seen.has(record.id)) issue([...path, index, 'id'], 'Duplicate stable ID')
      seen.add(record.id); sets.get(kind)!.add(record.id)
    })
  }
  register('trip', [snapshot.trip], ['trip'])
  for (const [kind, records, path] of [
    ['region', snapshot.regions, 'regions'], ['day', snapshot.days, 'days'], ['place', snapshot.places, 'places'],
    ['accommodation', snapshot.accommodations, 'accommodations'], ['transport', snapshot.transport, 'transport'],
    ['navigationTarget', snapshot.navigationTargets, 'navigationTargets'], ['hardCut', snapshot.hardCuts, 'hardCuts'],
    ['checklist', snapshot.checklists, 'checklists'], ['liveCam', snapshot.liveCams, 'liveCams'], ['image', snapshot.images, 'images'], ['source', snapshot.sources, 'sources'],
  ] as const) register(kind, records, [path])
  register('weatherRegion', snapshot.weather.weatherRegions, ['weather', 'weatherRegions'])
  register('activityProfile', snapshot.weather.activityProfiles, ['weather', 'activityProfiles'])
  const emergency = getEmergencyInfo(snapshot)
  if (emergency) register('emergencyContact', emergency.contacts, ['emergency', 'contacts'])
  snapshot.days.forEach((day, i) => register('timeline', day.timeline, ['days', i, 'timeline']))
  snapshot.checklists.forEach((list, i) => {
    register('checklistGroup', list.groups, ['checklists', i, 'groups'])
    list.groups.forEach((group, j) => register('checklistItem', group.items, ['checklists', i, 'groups', j, 'items']))
  })
  function ref(kind: string, value: string | undefined, path: (string | number)[]) {
    if (value !== undefined && !sets.get(kind)!.has(value)) issue(path, `Broken ${kind} reference`)
  }
  function refs(kind: string, values: string[], path: (string | number)[]) { values.forEach((value, i) => ref(kind, value, [...path, i])) }
  function relation(value: z.infer<typeof emergencyEntityReference>, path: (string | number)[]) { ref(value.type, value.id, [...path, 'id']) }
  const trip = snapshot.trip
  if (trip.startDate > trip.endDate) issue(['trip', 'endDate'], 'Trip date order is invalid')
  ref('image', trip.heroImageId, ['trip', 'heroImageId']); ref('image', trip.bannerImageId, ['trip', 'bannerImageId'])
  snapshot.regions.forEach((region, i) => ref('weatherRegion', region.weatherConfigurationId, ['regions', i, 'weatherConfigurationId']))
  const dayNumbers = new Set<number>(), dayDates = new Set<string>()
  snapshot.days.forEach((day, i) => {
    const path = ['days', i]
    if (day.date < trip.startDate || day.date > trip.endDate) issue([...path, 'date'], 'Day outside trip dates')
    if (dayNumbers.has(day.dayNumber)) issue([...path, 'dayNumber'], 'Duplicate day number')
    if (dayDates.has(day.date)) issue([...path, 'date'], 'Duplicate day date')
    dayNumbers.add(day.dayNumber); dayDates.add(day.date)
    refs('image', day.imageIds, [...path, 'imageIds']); ref('accommodation', day.accommodationId, [...path, 'accommodationId'])
    ref('weatherRegion', day.primaryWeatherRegionId, [...path, 'primaryWeatherRegionId'])
    for (const key of ['optionalContent', 'backupContent'] as const) day[key].forEach((value, j) => relation(value, [...path, key, j]))
    day.timeline.forEach((item, j) => {
      for (const [kind, key] of [['place', 'placeId'], ['accommodation', 'accommodationId'], ['transport', 'transportId'], ['navigationTarget', 'navigationTargetId'], ['hardCut', 'hardCutId']] as const) ref(kind, item[key], [...path, 'timeline', j, key])
    })
  })
  snapshot.places.forEach((place, i) => {
    ref('region', place.regionId, ['places', i, 'regionId'])
    refs('image', place.imageIds, ['places', i, 'imageIds']); refs('activityProfile', place.activityProfileIds, ['places', i, 'activityProfileIds']); refs('source', place.sourceIds, ['places', i, 'sourceIds'])
  })
  snapshot.accommodations.forEach((stay, i) => { if (stay.stayStartDate > stay.stayEndDate) issue(['accommodations', i, 'stayEndDate'], 'Stay date order is invalid') })
  snapshot.transport.forEach((item, i) => {
    refs('navigationTarget', item.navigationTargetIds, ['transport', i, 'navigationTargetIds'])
    if (item.departure && item.arrival && Date.parse(item.departure) > Date.parse(item.arrival)) issue(['transport', i, 'arrival'], 'Arrival before departure')
  })
  snapshot.navigationTargets.forEach((target, i) => ref('place', target.placeId, ['navigationTargets', i, 'placeId']))
  snapshot.hardCuts.forEach((cut, i) => { ref('day', cut.dayId, ['hardCuts', i, 'dayId']); ref('source', cut.sourceId, ['hardCuts', i, 'sourceId']) })
  snapshot.weather.weatherRegions.forEach((region, i) => ref('region', region.regionId, ['weather', 'weatherRegions', i, 'regionId']))
  snapshot.weather.weighting.forEach((weight, i) => {
    ref('region', weight.regionId, ['weather', 'weighting', i, 'regionId']); ref('day', weight.dayId, ['weather', 'weighting', i, 'dayId']); ref('activityProfile', weight.activityProfileId, ['weather', 'weighting', i, 'activityProfileId'])
  })
  if (snapshot.schemaVersion === 3) {
    const weather = snapshot.weather
    register('forecastProvider', weather.forecastProviders, ['weather', 'forecastProviders'])
    register('alertProvider', weather.alertProviders, ['weather', 'alertProviders'])
    weather.weatherRegions.forEach((region, i) => {
      ref('forecastProvider', region.providerId, ['weather', 'weatherRegions', i, 'providerId'])
      if (!region.location && !snapshot.regions.find((item) => item.id === region.regionId)?.coordinates) issue(['weather', 'weatherRegions', i, 'location'], 'Weather location or canonical region coordinates required')
    })
    const mappedDays = new Set<string>()
    weather.dayRegions.forEach((mapping, i) => {
      ref('day', mapping.dayId, ['weather', 'dayRegions', i, 'dayId'])
      ref('weatherRegion', mapping.weatherRegionId, ['weather', 'dayRegions', i, 'weatherRegionId'])
      if (mappedDays.has(mapping.dayId)) issue(['weather', 'dayRegions', i, 'dayId'], 'Duplicate day weather mapping')
      mappedDays.add(mapping.dayId)
    })
    weather.alertProviders.forEach((provider, i) => refs('weatherRegion', provider.weatherRegionIds ?? [], ['weather', 'alertProviders', i, 'weatherRegionIds']))
  }
  snapshot.liveCams.forEach((cam, i) => {
    ref('region', cam.regionId, ['liveCams', i, 'regionId']); ref('place', cam.placeId, ['liveCams', i, 'placeId']); ref('day', cam.routeDayId, ['liveCams', i, 'routeDayId'])
  })
  snapshot.sources.forEach((source, i) => { if (source.entity) relation(source.entity, ['sources', i, 'entity']) })
  emergency?.contacts.forEach((contact, i) => {
    ref('region', contact.regionId, ['emergency', 'contacts', i, 'regionId'])
    refs('source', contact.sourceIds, ['emergency', 'contacts', i, 'sourceIds'])
  })
})

export type TripSnapshot = z.infer<typeof versionedSnapshotSchema>
export type Schema1Snapshot = Extract<TripSnapshot, { schemaVersion: 1 }>
export type Schema2Snapshot = Extract<TripSnapshot, { schemaVersion: 2 }>
export type Schema3Snapshot = Extract<TripSnapshot, { schemaVersion: 3 }>
export function getEmergencyInfo(snapshot: TripSnapshot) {
  return 'emergency' in snapshot ? snapshot.emergency : undefined
}
export type TripSummary = TripSnapshot['trip']
export type ValidationIssue = { path: (string | number)[]; code: string; message: string }
export type SnapshotValidation = { valid: true; snapshot: TripSnapshot } | { valid: false; reason: 'invalid-data' | 'unsupported-schema'; issues: ValidationIssue[] }
export function validateTripSnapshot(payload: unknown): SnapshotValidation {
  if (payload && typeof payload === 'object' && 'schemaVersion' in payload && !isSupportedTripSchemaVersion(payload.schemaVersion)) {
    return { valid: false, reason: 'unsupported-schema', issues: [{ path: ['schemaVersion'], code: 'unsupported_schema', message: 'Unsupported trip schema version' }] }
  }
  const result = tripSnapshotSchema.safeParse(payload)
  return result.success ? { valid: true, snapshot: result.data } : {
    valid: false, reason: 'invalid-data', issues: result.error.issues.map((issue) => ({ path: issue.path.map((part) => typeof part === 'number' ? part : String(part)), code: issue.code, message: issue.message })),
  }
}
