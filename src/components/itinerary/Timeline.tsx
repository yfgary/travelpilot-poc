import type { TripSnapshot } from '../../data/schema/trip'
import type { TimelineItem } from '../../data/itinerary'
import { formatDuration, timelineTypes } from '../../data/itinerary'
import { timelineTiming, timelineTimeLabel } from '../../data/tripTime'
import { AccommodationCard, HardCutCard, NavigationCard, PlaceCard, TransportCard } from './EntityCards'

export function Timeline({ items, snapshot, onDetail }: { items: TimelineItem[]; snapshot: TripSnapshot; onDetail: (id: string) => void }) {
  if (!items.length) return null
  return <section className="day-timeline" aria-label="當日時間軸"><h3>當日行程</h3><ol className="timeline-list">
    {items.map((item) => {
      const place = snapshot.places.find((p) => p.id === item.placeId)
      const stay = snapshot.accommodations.find((s) => s.id === item.accommodationId)
      const transport = snapshot.transport.find((t) => t.id === item.transportId)
      const target = snapshot.navigationTargets.find((t) => t.id === item.navigationTargetId)
      const cut = snapshot.hardCuts.find((c) => c.id === item.hardCutId)
      const meta = timelineTypes[item.type], timing = timelineTiming(item)
      return <li key={item.id} className="timeline-row" data-item-id={item.id} data-item-type={item.type} data-exact-timing={timing ? true : undefined}>
        <div className="timeline-time">{timing ? <>
          <time dateTime={timing.start.dateTime}>{timelineTimeLabel(item, 'start')}</time><span aria-hidden="true"> → </span>
          <time dateTime={timing.end.dateTime}>{timelineTimeLabel(item, 'end')}</time>
        </> : <>{item.startTime && <time>{item.startTime}</time>}{item.startTime && item.endTime && <span aria-hidden="true"> – </span>}{item.endTime && <time>{item.endTime}</time>}</>}</div>
        <div className={`timeline-event${cut ? ' has-hard-cut' : ''}`}>
          <div className="timeline-badges"><span>{meta.icon} {meta.label}</span>
            {item.durationMinutes !== undefined && <span>◷ {formatDuration(item.durationMinutes)}</span>}
            {(item.optional || item.bonus) && <span className="optional-badge">可選／Bonus</span>}</div>
          <h4>{item.title}</h4>{item.description && <p>{item.description}</p>}
          {item.warning && <p className="content-warning">⚠ 注意：{item.warning}</p>}
          {cut && <HardCutCard cut={cut} snapshot={snapshot} />}
          {place && <PlaceCard place={place} onDetail={onDetail} />}
          {transport && <TransportCard transport={transport} snapshot={snapshot} />}
          {stay && <AccommodationCard stay={stay} compact />}
          {target && <NavigationCard target={target} />}
        </div>
      </li>
    })}
  </ol></section>
}
