import { useState } from 'react'
import type { TripSnapshot } from '../../data/schema/trip'
import { resolveContentImage } from '../../data/images'

export function DayGallery({ imageIds, images }: { imageIds: string[]; images: TripSnapshot['images'] }) {
  const [failed, setFailed] = useState<Set<string>>(new Set())
  const resolved = [...new Set(imageIds)].flatMap((id) => {
    const image = resolveContentImage(images.find((image) => image.id === id), import.meta.env.BASE_URL)
    return image && !failed.has(image.url) ? [image] : []
  }).slice(0, 3)
  if (!resolved.length) return null
  const credits = [...new Set(resolved.map((image) => [image.attribution, image.licenseNote].filter(Boolean).join(' · ')).filter(Boolean))]
  return <div className="day-gallery-wrap"><section className={`day-gallery gallery-${resolved.length}`} aria-label="行程圖片" data-testid="day-gallery">
    {resolved.map((image) => <figure key={image.id}><img src={image.url} alt={image.alt}
      onError={() => setFailed((previous) => new Set(previous).add(image.url))} />
      <figcaption>{image.alt}
        {image.sourceURL && <a href={image.sourceURL} target="_blank" rel="noopener noreferrer">圖片來源 ↗</a>}
      </figcaption></figure>)}
  </section>{credits.map((credit) => <p className="gallery-credit" key={credit}>{credit}</p>)}</div>
}
