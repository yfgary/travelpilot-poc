import { WeatherPanel } from '../components/weather/WeatherPanel'
import type { ReactNode } from 'react'
import { useLoadedTrip } from '../app/TripContext'
import { pages } from '../app/pages'
import { PageHeading } from '../components/PageHeading'
import { AccommodationCard, TransportCard, NavigationCard, HardCutCard } from '../components/itinerary/EntityCards'
import { ChecklistDefinitions } from '../components/tripInfo/ChecklistDefinitions'
import { EmergencyInformation } from '../components/tripInfo/EmergencyInformation'
import { getEmergencyInfo } from '../data/schema/trip'
import { formatTripDate } from '../data/tripDates'
import { navigationTypes, sortedHardCuts } from '../data/tripInformation'
import '../styles/itinerary.css'
import '../styles/tripInfo.css'

export function TripInformation() {
  const { snapshot } = useLoadedTrip()
  const { trip } = snapshot
  const publicTransport = snapshot.transport.filter((transport) => transport.type !== 'car')
  const cars = snapshot.transport.filter((transport) => transport.type === 'car')
  const emergency = getEmergencyInfo(snapshot)
  const sections: { id: string; title: string; shortcut: string; show: boolean; content: ReactNode }[] = [
    { id: 'transport', title: '主要交通', shortcut: '交通', show: publicTransport.length > 0,
      content: <div className="info-card-grid">{publicTransport.map((transport) => <TransportCard key={transport.id} transport={transport} snapshot={snapshot} showTiming />)}</div> },
    { id: 'car', title: '租車／自駕', shortcut: '租車', show: cars.length > 0,
      content: <div className="info-card-grid">{cars.map((transport) => <TransportCard key={transport.id} transport={transport} snapshot={snapshot} showTiming />)}</div> },
    { id: 'accommodation', title: '住宿酒店', shortcut: '住宿', show: snapshot.accommodations.length > 0,
      content: snapshot.accommodations.map((stay) => <AccommodationCard key={stay.id} stay={stay} heading="住宿資料" />) },
    { id: 'navigation', title: '導航／泊車', shortcut: '導航／泊車', show: snapshot.navigationTargets.length > 0,
      content: <div className="navigation-groups">{Object.entries(navigationTypes).map(([type, label]) => {
        const targets = snapshot.navigationTargets.filter((target) => target.type === type)
        return targets.length > 0 && <div key={type}><h3>{label}</h3>{targets.map((target) => <div key={target.id}>
          <NavigationCard target={target} />
          {target.placeId && <p className="info-related-place">相關場所：{snapshot.places.find((place) => place.id === target.placeId)?.name} · 導航使用以上指定目標</p>}
        </div>)}</div>
      })}</div> },
    { id: 'hard-cuts', title: '全程重要 Hard Cut', shortcut: 'Hard Cut', show: snapshot.hardCuts.length > 0,
      content: sortedHardCuts(snapshot).map((cut) => {
        const day = snapshot.days.find((day) => day.id === cut.dayId)
        return <div className="info-hard-cut" key={cut.id} data-cut-id={cut.id}>
          {day && <h3>DAY {day.dayNumber} · {formatTripDate(day.date)} · {day.title}</h3>}
          <HardCutCard cut={cut} snapshot={snapshot} />
        </div>
      }) },
    { id: 'checklists', title: 'Checklist 定義', shortcut: 'Checklist', show: snapshot.checklists.length > 0,
      content: <ChecklistDefinitions checklists={snapshot.checklists} /> },
    { id: 'emergency', title: '當地緊急資料', shortcut: '緊急', show: Boolean(emergency && (emergency.contacts.length || emergency.notes.length || emergency.title || emergency.description)),
      content: <EmergencyInformation snapshot={snapshot} /> },
  ].filter((section) => section.show)
  function jump(id: string) {
    const heading = document.getElementById(`trip-info-${id}`)
    heading?.focus({ preventScroll: true })
    heading?.scrollIntoView({ block: 'start' })
  }
  return <div className="trip-info-page" data-testid="trip-information">
    <section className="panel info-intro"><PageHeading title={pages.find((page) => page.id === 'info')!.title} />
      <p><time dateTime={trip.startDate}>{formatTripDate(trip.startDate)}</time> – <time dateTime={trip.endDate}>{formatTripDate(trip.endDate)}</time></p>
      {trip.introduction && <p>{trip.introduction}</p>}<p className="info-section-note">{trip.destinationLabel} · 時區：{trip.timezone}</p>
    </section>
    <WeatherPanel />
    {sections.length > 0 && <nav className="info-quick-nav" aria-label="旅程資料章節">{sections.map((section) =>
      <button key={section.id} className="itinerary-action" aria-controls={`trip-info-${section.id}`} onClick={() => jump(section.id)}>{section.shortcut}</button>)}</nav>}
    {sections.map((section) => <section key={section.id} className={`info-section info-${section.id}`} aria-labelledby={`trip-info-${section.id}`}>
      <h2 id={`trip-info-${section.id}`} tabIndex={-1}>{section.title}</h2><div className="info-section-body">{section.content}</div>
    </section>)}
  </div>
}
