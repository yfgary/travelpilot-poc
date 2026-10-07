// Single source for route labels and navigation on mobile and desktop.
export const pages = [
  { id: 'home', path: '/', title: '首頁', scope: 'app' },
  { id: 'itinerary', path: 'itinerary', title: '詳細行程', scope: 'trip' },
  { id: 'info', path: 'info', title: '旅程資料', scope: 'trip' },
  { id: 'attractions', path: 'attractions', title: '景點總覽', scope: 'trip' },
  { id: 'live', path: 'live', title: 'Live Cam', scope: 'trip' },
  { id: 'today', path: 'today', title: '今日模式', scope: 'trip' },
  { id: 'settings', path: '/settings', title: '設定', scope: 'app' },
] as const

export type PageDefinition = (typeof pages)[number]
export const tripPages = pages.filter((page) => page.scope === 'trip')
export function pageHref(page: PageDefinition, tripSlug?: string) {
  return page.scope === 'trip'
    ? `/trip/${encodeURIComponent(tripSlug ?? '')}/${page.path}`
    : page.path
}
