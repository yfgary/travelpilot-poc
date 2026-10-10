import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [dayId, setDayId] = useState<string | null>(null)
  const selectorRef = useRef<HTMLDivElement>(null)
  const place = snapshot.places.find((place) => place.id === placeId)
  const availableDays = useMemo(() => {
    const ids = new Set(usage.flatMap((entry) => entry.days.map((day) => day.id)))
    return [...snapshot.days].filter((day) => ids.has(day.id)).sort((a, b) => a.dayNumber - b.dayNumber)
  }, [snapshot.days, usage])
  const selectedUsage = usage.filter((entry) => entry.occurrences.some((item) =>
    (!dayId || item.day.id === dayId) && (filter === 'all' || item.status === filter)))
  const groups = groupPlaceUsage(snapshot, selectedUsage, 'all')
  useEffect(() => {
    const node = selectorRef.current, page = node?.closest<HTMLElement>('.attractions-page')
    if (!node || !page) return
    const measure = () => page.style.setProperty('--tp-attraction-selectors-height', `${Math.ceil(node.getBoundingClientRect().height)}px`)
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(node)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); page.style.removeProperty('--tp-attraction-selectors-height') }
  }, [])
  function jump(id: string) {
    const heading = document.getElementById(`attraction-region-${id}`)
    heading?.focus({ preventScroll: true }); heading?.scrollIntoView({ block: 'start' })
  }
  return <div className="attractions-page" data-testid="attractions-overview">
    <section className="panel"><PageHeading title="景點總覽" description="依行程整理各地景點、餐飲與購物；詳細介紹與行程共用同一份資料。" />
      <p className="attraction-count">共 {counts.all} 個場所{dayId && ` · 所選日顯示 ${selectedUsage.length} 個`} · 同一場所可有多種行程安排，各分類數目可重疊。</p>
      <div className="attraction-filters" role="group" aria-label="景點行程分類">{(['all', 'main', 'optional', 'backup'] as const).map((value) => <button className="itinerary-action" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? '全部' : usageLabels[value]} {counts[value]}</button>)}</div>
    </section>
    {availableDays.length > 0 && <div ref={selectorRef} className="attraction-sticky-selectors" data-testid="attraction-sticky-selectors">
      <ContentNavigation label="景點日期"><button className="itinerary-action" aria-pressed={dayId === null} onClick={() => setDayId(null)}>全部日子</button>
        {availableDays.map((day) => <button className="itinerary-action" key={day.id} aria-pressed={dayId === day.id} title={day.title} onClick={() => setDayId(day.id)}>D{day.dayNumber} · {day.title}</button>)}
      </ContentNavigation>
      {groups.length > 0 && <ContentNavigation label="景點地區">{groups.map((group) => <button className="itinerary-action" key={group.id} aria-controls={`attraction-region-${group.id}`} onClick={() => jump(group.id)}>{group.label} · {group.places.length}</button>)}</ContentNavigation>}
    </div>}
    {groups.map((group) => <section className="attraction-region" key={group.id} aria-labelledby={`attraction-region-${group.id}`}>
      <div className="attraction-region-heading"><h2 id={`attraction-region-${group.id}`} tabIndex={-1}>{group.label}</h2><span>{group.places.length} 個場所</span></div>
      <div className="attraction-grid">{group.places.map((item) => <AttractionCard key={item.place.id} usage={item} snapshot={snapshot} onDetail={setPlaceId} />)}</div>
    </section>)}
    {!groups.length && <EmptyState title={usage.length ? '此分類未有景點' : '未有行程景點'} description={usage.length ? '所選分類或日子未有對應景點，請選其他日子或全部。' : '加入行程的場所會在這裡按地區整理。'} />}
    {place && <PlaceDetail key={place.id} place={place} sources={snapshot.sources} onClose={() => setPlaceId(null)} />}
  </div>
}
