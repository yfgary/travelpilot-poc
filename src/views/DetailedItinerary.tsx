import { WeatherPanel } from '../components/weather/WeatherPanel'
import { useState } from 'react'
import { useLoadedTrip } from '../app/TripContext'
import { pages } from '../app/pages'
import { PageHeading } from '../components/PageHeading'
import { EmptyState } from '../components/ViewState'
import { DayAccordion, dayElementId } from '../components/itinerary/DayAccordion'
import { PlaceDetail } from '../components/itinerary/PlaceDetail'
import { initialDayId } from '../data/itinerary'
import { formatTripDate } from '../data/tripDates'
import '../styles/itinerary.css'

export function DetailedItinerary() {
  const { snapshot } = useLoadedTrip()
  const { trip } = snapshot
  const days = [...snapshot.days].sort((a, b) => a.dayNumber - b.dayNumber)
  const [openDays, setOpenDays] = useState(() => new Set([initialDayId(snapshot)].filter((id): id is string => Boolean(id))))
  const [placeId, setPlaceId] = useState<string | null>(null)
  const place = snapshot.places.find((place) => place.id === placeId)
  const toggle = (id: string, open: boolean) => setOpenDays((previous) => {
    if (previous.has(id) === open) return previous
    const next = new Set(previous); if (open) next.add(id); else next.delete(id); return next
  })
  function jump(id: string) {
    toggle(id, true)
    requestAnimationFrame(() => {
      const element = document.getElementById(dayElementId(id))
      element?.querySelector('summary')?.focus({ preventScroll: true })
      element?.scrollIntoView({ block: 'start' })
    })
  }
  return <div className="itinerary-page" data-testid="detailed-itinerary">
    <section className="panel itinerary-intro"><PageHeading title={pages.find((page) => page.id === 'itinerary')!.title} />
      <p className="itinerary-date-range"><time dateTime={trip.startDate}>{formatTripDate(trip.startDate)}</time> – <time dateTime={trip.endDate}>{formatTripDate(trip.endDate)}</time> · {days.length} 天行程</p>
      {trip.introduction && <p>{trip.introduction}</p>}
    </section>
    <WeatherPanel />
    {days.length ? <><nav className="day-jump" aria-label="行程日期">{days.map((day) => <button key={day.id} className="itinerary-action" aria-controls={dayElementId(day.id)}
      aria-label={`跳至 DAY ${day.dayNumber}`} title={day.title} onClick={() => jump(day.id)}>
        <span className="day-jump-number">D{day.dayNumber}</span>
        <span className="day-jump-destination">{day.title}</span>
      </button>)}</nav>
      {days.map((day) => <DayAccordion key={day.id} day={day} snapshot={snapshot} open={openDays.has(day.id)} onToggle={toggle} onDetail={setPlaceId} />)}
    </> : <EmptyState title="未有行程" description="此旅程尚未加入每日行程。" />}
    {place && <PlaceDetail key={place.id} place={place} sources={snapshot.sources} onClose={() => setPlaceId(null)} />}
  </div>
}
