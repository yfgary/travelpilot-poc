import type { TripSnapshot } from '../../data/schema/trip'
import type { TripDay } from '../../data/itinerary'
import { dayHardCuts } from '../../data/itinerary'
import { HardCutCard } from './EntityCards'

export function DayHighlights({ day, snapshot }: { day: TripDay; snapshot: TripSnapshot }) {
  const cuts = dayHardCuts(snapshot, day)
  if (!day.highlights.length && !day.warnings.length && !day.constraints.length && !cuts.length) return null
  return <section className="day-highlights" aria-label="今日重點"><h3>今日重點</h3><div className="highlights-grid">
    {day.highlights.map((text, i) => <p className="highlight-normal" key={`h-${i}`}>✦ {text}</p>)}
    {day.warnings.map((text, i) => <p className="content-warning" key={`w-${i}`}>⚠ 注意：{text}</p>)}
    {day.constraints.map((text, i) => <p className="content-warning" key={`c-${i}`}>⚑ 限制：{text}</p>)}
    {cuts.map((cut) => <HardCutCard key={cut.id} cut={cut} snapshot={snapshot} />)}
  </div></section>
}
