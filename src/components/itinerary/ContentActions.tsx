import type { ReactNode } from 'react'
import { resolveMaps, safeExternalURL } from '../../data/itinerary'

export function ExternalLink({ href, children, label }: { href?: string; children: ReactNode; label?: string }) {
  const url = safeExternalURL(href)
  return url ? <a className="itinerary-action" href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>{children}</a> : null
}
export function MapsAction({ entity, name }: { entity: Parameters<typeof resolveMaps>[0]; name: string }) {
  return <ExternalLink href={resolveMaps(entity)} label={`Google Maps：${name}`}>↗ Maps</ExternalLink>
}
export function Facts({ entries }: { entries: { label: string; value: ReactNode }[] }) {
  const visible = entries.filter(({ value }) => value !== undefined && value !== null && value !== '')
  return visible.length ? <dl className="itinerary-facts">{visible.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null
}
export function Notes({ notes }: { notes: string[] }) {
  return notes.length ? <ul className="itinerary-notes">{notes.map((note, i) => <li key={i}>{note}</li>)}</ul> : null
}
