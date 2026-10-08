import { DaySuitability } from '../weather/DaySuitability'
import type { TripDay } from '../../data/itinerary'
import type { TripSnapshot } from '../../data/schema/trip'
import { formatTripDate } from '../../data/tripDates'
import { DayHighlights } from './DayHighlights'
import { DayGallery } from './DayGallery'
import { Timeline } from './Timeline'
import { AccommodationCard, EntityCard } from './EntityCards'

export function dayElementId(dayId: string) { return `itinerary-day-${dayId}` }
export function DayAccordion({ day, snapshot, open, onToggle, onDetail }: {
  day: TripDay; snapshot: TripSnapshot; open: boolean; onToggle: (id: string, open: boolean) => void; onDetail: (id: string) => void
}) {
  const stay = snapshot.accommodations.find((stay) => stay.id === day.accommodationId)
  return <details className="itinerary-day" id={dayElementId(day.id)} open={open} data-day-id={day.id}
    onToggle={(event) => onToggle(day.id, event.currentTarget.open)}>
    <summary><div className="day-summary"><span className="day-number">DAY {day.dayNumber}</span>
      <time dateTime={day.date}>{formatTripDate(day.date)}</time><h2>{day.title}</h2><p>{day.routeSummary}</p></div><span className="day-toggle-icon" aria-hidden="true" /></summary>
    <div className="day-content"><DaySuitability dayId={day.id} date={day.date} /><DayHighlights day={day} snapshot={snapshot} /><DayGallery imageIds={day.imageIds} images={snapshot.images} />
      <Timeline items={day.timeline} snapshot={snapshot} onDetail={onDetail} />
      {stay && <div className="day-accommodation"><AccommodationCard stay={stay} /></div>}
      {([{ key: 'optionalContent', label: '可選／Bonus' }, { key: 'backupContent', label: '備用行程' }] as const).map(({ key, label }) =>
        day[key].length > 0 && <details className={`extra-content ${key}`} key={key}><summary>{label}</summary><div>
          {day[key].map((reference, i) => <EntityCard key={`${reference.type}:${reference.id}:${i}`} reference={reference} snapshot={snapshot} onDetail={onDetail} />)}
        </div></details>)}
    </div>
  </details>
}
