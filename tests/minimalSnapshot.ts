import type { Schema1Snapshot } from '../src/data/schema/trip'

// Stable minimal schema test data, independent of the Home demonstration fixtures.
export const minimalSnapshot: Schema1Snapshot = {
  schemaVersion: 1,
  trip: { id: 'demo-trip-id', slug: 'demo-trip', title: '示範旅程', destinationLabel: '示範目的地', summary: '用於驗證共用頁面及導覽的通用示範資料。', startDate: '2030-06-01', endDate: '2030-06-01', timezone: 'Etc/UTC' },
  regions: [{ id: 'demo-region', name: '示範區域', coordinates: { latitude: 0, longitude: 0 } }],
  days: [{ id: 'demo-day', dayNumber: 1, date: '2030-06-01', title: '探索目的地', routeSummary: '集合點 → 示範景點', highlights: ['輕鬆探索'], imageIds: [], constraints: [], warnings: [], optionalContent: [], backupContent: [], timeline: [{ id: 'demo-activity', type: 'activity', title: '探索示範景點', startTime: '10:00', durationMinutes: 60, placeId: 'demo-place', navigationTargetId: 'demo-entrance', optional: false }] }],
  places: [{ id: 'demo-place', name: '示範景點', regionId: 'demo-region', type: 'attraction', summary: '通用資料示例。', imageIds: [], activityProfileIds: [], sourceIds: [] }],
  accommodations: [], transport: [], navigationTargets: [{ id: 'demo-entrance', type: 'entrance', title: '示範入口', placeId: 'demo-place' }], hardCuts: [], checklists: [],
  weather: { weatherRegions: [], activityProfiles: [], weighting: [], scoring: { schemaVersion: 1, config: {} }, operationNotes: [] },
  liveCams: [], images: [], sources: [],
}
