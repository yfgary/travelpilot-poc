import { useEffect, useId, useRef } from 'react'
import type { Place } from '../../data/itinerary'
import type { TripSnapshot } from '../../data/schema/trip'
import { placeTypes } from '../../data/itinerary'
import { PlaceFacts } from './EntityCards'
import { ExternalLink, MapsAction } from './ContentActions'

export function PlaceDetail({ place, sources, onClose }: { place: Place; sources: TripSnapshot['sources']; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const node = dialog.current!
    const previous = document.activeElement
    node.showModal()
    return () => { node.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }) }
  }, [])
  const resolvedSources = place.sourceIds.flatMap((id) => { const source = sources.find((s) => s.id === id); return source ? [source] : [] })
  return <dialog ref={dialog} className="place-dialog" aria-labelledby={titleId} onClose={() => { if (!dialog.current?.open) onClose() }}>
    <header className="place-dialog-head"><div><p className="entity-kicker">{placeTypes[place.type]}</p><h2 id={titleId}>{place.name}</h2></div>
      <button className="itinerary-action dialog-close" autoFocus onClick={() => dialog.current?.close()} aria-label="關閉詳細介紹">×</button></header>
    <div className="place-dialog-body"><p>{place.summary}</p>{place.longDescription && <p>{place.longDescription}</p>}<PlaceFacts place={place} />
      {([{ title: '為何值得到訪', value: place.whyVisit }, { title: '歷史／背景', value: place.history },
        { title: '在地重要性', value: place.localImportance }, { title: '到訪後的收穫', value: place.takeaway }]).map(({ title, value }) => value &&
          <section className="place-detail-section" key={title}><h3>{title}</h3><p>{value}</p></section>)}
      {Boolean(place.whatToSee?.length) && <section className="place-detail-section"><h3>值得留意</h3><ul>{place.whatToSee!.map((text, i) => <li key={i}>{text}</li>)}</ul></section>}
      <div className="itinerary-actions"><MapsAction entity={place} name={place.name} /><ExternalLink href={place.officialURL}>官方網站 ↗</ExternalLink></div>
      {resolvedSources.length > 0 && <section className="place-detail-section"><h3>資料來源</h3><div className="itinerary-actions">{resolvedSources.map((source) => <ExternalLink key={source.id} href={source.url}>{source.title} ↗</ExternalLink>)}</div></section>}
    </div>
  </dialog>
}
