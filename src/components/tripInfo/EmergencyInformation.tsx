import type { TripSnapshot } from '../../data/schema/trip'
import { getEmergencyInfo } from '../../data/schema/trip'
import { emergencyTypes, phoneAction } from '../../data/tripInformation'
import { ExternalLink, Notes } from '../itinerary/ContentActions'

export function EmergencyInformation({ snapshot }: { snapshot: TripSnapshot }) {
  const emergency = getEmergencyInfo(snapshot)
  if (!emergency) return null
  return <>{emergency.title && <h3>{emergency.title}</h3>}{emergency.description && <p>{emergency.description}</p>}
    <div className="emergency-grid">{emergency.contacts.map((contact) => {
      const region = snapshot.regions.find((region) => region.id === contact.regionId)
      const sources = contact.sourceIds.flatMap((id) => { const source = snapshot.sources.find((source) => source.id === id); return source ? [source] : [] })
      const tel = phoneAction(contact.phone)
      return <article className="emergency-card" key={contact.id} data-contact-id={contact.id}>
        <p className="contact-category">☎ {emergencyTypes[contact.type]}</p><h4>{contact.title}</h4>
        {contact.phone && <p className="emergency-phone">{tel ? <a href={tel} aria-label={`致電：${contact.title} ${contact.phone}`}>{contact.phone}</a> : contact.phone}</p>}
        {region && <p>適用地區：{region.label ?? region.name}</p>}{contact.availability && <p>服務時間：{contact.availability}</p>}
        {contact.description && <p>{contact.description}</p>}<Notes notes={contact.notes} />
        <div className="itinerary-actions"><ExternalLink href={contact.url} label={`支援網站：${contact.title}`}>支援網站 ↗</ExternalLink>
          {sources.map((source) => <ExternalLink key={source.id} href={source.url} label={`資料來源：${source.title}`}>{source.title} ↗</ExternalLink>)}
        </div>
      </article>
    })}</div><Notes notes={emergency.notes} />
  </>
}
