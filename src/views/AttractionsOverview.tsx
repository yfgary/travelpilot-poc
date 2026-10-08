import { useMemo, useState } from 'react'
import { useLoadedTrip } from '../app/TripContext'
import { PageHeading } from '../components/PageHeading'
import { EmptyState } from '../components/ViewState'
import { ContentNavigation } from '../components/ContentNavigation'
import { AttractionCard } from '../components/attractions/AttractionCard'
import { PlaceDetail } from '../components/itinerary/PlaceDetail'
import { derivePlaceUsage, groupPlaceUsage, placeUsageCounts, usageLabels, type PlaceStatus } from '../data/attractions'
import '../styles/itinerary.css'
import '../styles/attractions.css'

export function AttractionsOverview() {
  const { snapshot } = useLoadedTrip()
  const usage = useMemo(() => derivePlaceUsage(snapshot), [snapshot])
  const counts = placeUsageCounts(usage)
  const [filter, setFilter] = useState<PlaceStatus | 'all'>('all')
  const [placeId, setPlaceId] = useState<string | null>(null)
  const place = snapshot.places.find((place) => place.id === placeId)
  const groups = groupPlaceUsage(snapshot, usage, filter)
  function jump(id: string) {
    const heading = document.getElementById(`attraction-region-${id}`)
    heading?.focus({ preventScroll: true }); heading?.scrollIntoView({ block: 'start' })
  }
  return <div className="attractions-page" data-testid="attractions-overview">
    <section className="panel"><PageHeading title="景點總覽" description="依行程整理各地景點、餐飲與購物；詳細介紹與行程共用同一份資料。" />
      <p className="attraction-count">共 {counts.all} 個場所 · 同一場所可有多種行程安排，各分類數目可重疊。</p>
      <div className="attraction-filters" role="group" aria-label="景點行程分類">{(['all', 'main', 'optional', 'backup'] as const).map((value) => <button className="itinerary-action" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? '全部' : usageLabels[value]} {counts[value]}</button>)}</div>
    </section>
    {groups.length > 0 && <ContentNavigation label="景點地區">{groups.map((group) => <button className="itinerary-action" key={group.id} aria-controls={`attraction-region-${group.id}`} onClick={() => jump(group.id)}>{group.label} · {group.places.length}</button>)}</ContentNavigation>}
    {groups.map((group) => <section className="attraction-region" key={group.id} aria-labelledby={`attraction-region-${group.id}`}>
      <div className="attraction-region-heading"><h2 id={`attraction-region-${group.id}`} tabIndex={-1}>{group.label}</h2><span>{group.places.length} 個場所</span></div>
      <div className="attraction-grid">{group.places.map((item) => <AttractionCard key={item.place.id} usage={item} snapshot={snapshot} onDetail={setPlaceId} />)}</div>
    </section>)}
    {!groups.length && <EmptyState title={usage.length ? '此分類未有景點' : '未有行程景點'} description="加入行程的場所會在這裡按地區整理。" />}
    {place && <PlaceDetail key={place.id} place={place} sources={snapshot.sources} onClose={() => setPlaceId(null)} />}
  </div>
}
