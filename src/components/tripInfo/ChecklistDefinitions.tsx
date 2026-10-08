import type { TripSnapshot } from '../../data/schema/trip'
import { orderedDefinitions } from '../../data/tripInformation'
import { Notes } from '../itinerary/ContentActions'

export function ChecklistDefinitions({ checklists }: { checklists: TripSnapshot['checklists'] }) {
  return <><p className="info-section-note">清單定義預覽；此頁不記錄勾選狀態。</p>
    {orderedDefinitions(checklists).map((list) => <article className="checklist-definition" key={list.id} data-checklist-id={list.id}>
      <h3>{list.title}</h3>{list.description && <p>{list.description}</p>}<Notes notes={list.notes} />
      <div className="checklist-groups">{orderedDefinitions(list.groups).map((group) => <section className="checklist-group" key={group.id} data-group-id={group.id}>
        <h4>{group.title}</h4><Notes notes={group.notes} />
        <ul>{orderedDefinitions(group.items).map((item) => <li key={item.id} data-checklist-item-id={item.id}>
          <span>{item.label}</span><Notes notes={item.notes} />
        </li>)}</ul>
      </section>)}</div>
    </article>)}</>
}
