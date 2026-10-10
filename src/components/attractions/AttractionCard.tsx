import { useState } from 'react'
import type { TripSnapshot } from '../../data/schema/trip'
import type { PlaceUsage } from '../../data/attractions'
import { usageLabels } from '../../data/attractions'
import { placeTypes } from '../../data/itinerary'
import { resolveContentImage } from '../../data/images'
import { PlaceFacts } from '../itinerary/EntityCards'
import { NativeName } from '../itinerary/NativeName'
import { ExternalLink, MapsAction } from '../itinerary/ContentActions'

export function AttractionCard({ usage, snapshot, onDetail }: { usage: PlaceUsage; snapshot: TripSnapshot; onDetail: (id: string) => void }) {
  const { place, statuses, days } = usage
  const [failed, setFailed] = useState<string[]>([])
  const image = place.imageIds.filter((id) => !failed.includes(id)).map((id) => resolveContentImage(snapshot.images.find((image) => image.id === id), import.meta.env.BASE_URL)).find(Boolean)
  return <article className="attraction-card" data-testid="attraction-card" data-place-id={place.id}>
    {image && <figure className="attraction-image"><img src={image.url} alt={image.alt} loading="lazy" onError={() => setFailed((values) => [...values, image.id])} />
      {(image.attribution || image.licenseNote || image.sourceURL) && <figcaption>{image.attribution}{image.licenseNote && <> · {image.licenseNote}</>}{image.sourceURL && <ExternalLink href={image.sourceURL}>圖片來源</ExternalLink>}</figcaption>}
    </figure>}
    <div className="attraction-body"><p className="entity-kicker">{placeTypes[place.type]}</p><h3>{place.name}</h3><NativeName entity={place} />
      <div className="attraction-badges" aria-label="行程關係">{statuses.map((status) => <span className={`usage-${status}`} key={status}>{usageLabels[status]}</span>)}{days.map((day) => <span key={day.id} title={day.title}>D{day.dayNumber}</span>)}</div>
      <p>{place.summary}</p><PlaceFacts place={place} />
      <div className="itinerary-actions"><MapsAction entity={place} name={place.name} />
        <button className="itinerary-action" onClick={() => onDetail(place.id)} aria-label={`詳細介紹：${place.name}`}>ⓘ 詳細介紹</button>
        <ExternalLink href={place.officialURL} label={`官方網站：${place.name}`}>官方網站 ↗</ExternalLink>
      </div>
    </div>
  </article>
}
