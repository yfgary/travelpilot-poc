import type { Accommodation, Transport, Place, NavigationTarget, HardCut, EntityReference } from '../../data/itinerary'
import type { TripSnapshot } from '../../data/schema/trip'
import { entityLabel, formatDuration, formatMoney, hardCutTime, placeTypes, severityLabels, transportTypes } from '../../data/itinerary'
import { formatTripDate } from '../../data/tripDates'
import { ExternalLink, Facts, MapsAction, Notes } from './ContentActions'

export function PlaceFacts({ place }: { place: Place }) {
  return <Facts entries={[
    { label: '評分', value: place.rating !== undefined ? `${place.rating} / 10` : undefined },
    { label: '建議逗留', value: formatDuration(place.suggestedDurationMinutes) },
    { label: '開放', value: place.opening }, { label: '最後入場', value: place.lastEntry },
    { label: '關閉', value: place.closing }, { label: '費用', value: formatMoney(place.fee) }, { label: '費用說明', value: place.feeNotes },
  ]} />
}
export function PlaceCard({ place, onDetail }: { place: Place; onDetail: (id: string) => void }) {
  return <section className="entity-card place-card" data-testid="place-card">
    <p className="entity-kicker">{placeTypes[place.type]}</p><h4>{place.name}</h4><p>{place.summary}</p>
    <PlaceFacts place={place} />
    <div className="itinerary-actions"><MapsAction entity={place} name={place.name} />
      <button className="itinerary-action" onClick={() => onDetail(place.id)} aria-label={`詳細介紹：${place.name}`}>ⓘ 詳細介紹</button>
      <ExternalLink href={place.officialURL} label={`官方網站：${place.name}`}>官方網站 ↗</ExternalLink>
    </div>
  </section>
}
export function AccommodationCard({ stay, compact = false }: { stay: Accommodation; compact?: boolean }) {
  return <section className="entity-card accommodation-card" data-testid="accommodation-card" data-entity-id={stay.id}>
    <p className="entity-kicker">⌂ {compact ? '住宿' : '今日住宿'}</p><h4>{stay.name}</h4>
    <div className={compact ? '' : 'accommodation-grid'}>
      <Facts entries={[{ label: '類型', value: stay.type }, { label: '房型', value: stay.room }, { label: '餐飲', value: stay.mealPlan },
        { label: '預訂狀態', value: stay.bookingState }, { label: '入住時間', value: stay.checkIn }, { label: '退房時間', value: stay.checkOut },
        { label: '住宿日期', value: compact ? undefined : `${formatTripDate(stay.stayStartDate)} – ${formatTripDate(stay.stayEndDate)}` }]} />
      {!compact && <><Facts entries={[{ label: '付款狀態', value: stay.paymentState }, { label: '總價', value: formatMoney(stay.total) },
        { label: '已付', value: formatMoney(stay.paid) }, { label: '到店支付', value: formatMoney(stay.arrivalPayment) }]} />
        <Facts entries={[{ label: '地址', value: stay.address }, { label: '電話', value: stay.phone },
          { label: '取消條款', value: stay.cancellation }, { label: '停車', value: stay.parking }]} /></>}
    </div>
    {!compact && <Notes notes={stay.notes} />}
    <div className="itinerary-actions"><MapsAction entity={stay} name={stay.name} /></div>
  </section>
}
export function TransportCard({ transport, snapshot }: { transport: Transport; snapshot: TripSnapshot }) {
  const target = transport.navigationTargetIds.map((id) => snapshot.navigationTargets.find((target) => target.id === id)).find(Boolean)
  return <section className="entity-card transport-card">
    <p className="entity-kicker">↗ {transportTypes[transport.type]}</p><h4>{transport.service ?? transport.provider ?? transportTypes[transport.type]}</h4>
    <p>{transport.origin} → {transport.destination}</p>
    <Facts entries={[{ label: '服務商', value: transport.provider }, { label: '車程／航程', value: formatDuration(transport.durationMinutes) },
      { label: '預訂', value: transport.bookingState }, { label: '付款', value: transport.paymentState }, { label: '價格', value: formatMoney(transport.price) }]} />
    <Notes notes={transport.notes} />{transport.warnings.map((warning, i) => <p className="content-warning" key={i}>⚠ 注意：{warning}</p>)}
    <div className="itinerary-actions"><MapsAction entity={transport.mapURL ? transport : target} name={transport.service ?? transportTypes[transport.type]} /></div>
  </section>
}
export function NavigationCard({ target }: { target: NavigationTarget }) {
  return <section className="entity-card navigation-card"><p className="entity-kicker">↗ 導航目標</p><h4>{target.title}</h4>
    {target.description && <p>{target.description}</p>}{target.warning && <p className="content-warning">⚠ 注意：{target.warning}</p>}
    <div className="itinerary-actions"><MapsAction entity={target} name={target.title} /></div>
  </section>
}
export function HardCutCard({ cut, snapshot }: { cut: HardCut; snapshot: TripSnapshot }) {
  const source = snapshot.sources.find((source) => source.id === cut.sourceId)
  return <section className={`hard-cut-card severity-${cut.severity}`} data-testid="hard-cut">
    <p className="entity-kicker">⏰ Hard Cut · {severityLabels[cut.severity]}</p>
    <strong>{hardCutTime(cut, snapshot.trip.timezone)} · {cut.title}</strong><p>{cut.description}</p>
    {source && <ExternalLink href={source.url}>資料來源：{source.title}</ExternalLink>}
  </section>
}
export function EntityCard({ reference, snapshot, onDetail }: { reference: EntityReference; snapshot: TripSnapshot; onDetail: (id: string) => void }) {
  switch (reference.type) {
    case 'place': { const place = snapshot.places.find((p) => p.id === reference.id); return place ? <PlaceCard place={place} onDetail={onDetail} /> : null }
    case 'accommodation': { const stay = snapshot.accommodations.find((s) => s.id === reference.id); return stay ? <AccommodationCard stay={stay} /> : null }
    case 'transport': { const transport = snapshot.transport.find((t) => t.id === reference.id); return transport ? <TransportCard transport={transport} snapshot={snapshot} /> : null }
    case 'navigationTarget': { const target = snapshot.navigationTargets.find((t) => t.id === reference.id); return target ? <NavigationCard target={target} /> : null }
    case 'hardCut': { const cut = snapshot.hardCuts.find((c) => c.id === reference.id); return cut ? <HardCutCard cut={cut} snapshot={snapshot} /> : null }
    default: return <p className="entity-card">{entityLabel(snapshot, reference)}</p>
  }
}
