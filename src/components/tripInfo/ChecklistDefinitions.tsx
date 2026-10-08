import type { TripSnapshot } from '../../data/schema/trip'
import { orderedDefinitions } from '../../data/tripInformation'
import { Notes } from '../itinerary/ContentActions'
import { useLoadedTrip } from '../../app/TripContext'
import { useChecklistSync } from '../../app/ChecklistSync'
import '../../styles/checklists.css'

export function ChecklistDefinitions({ checklists }: { checklists: TripSnapshot['checklists'] }) {
  const { snapshot, ownerId } = useLoadedTrip()
  const { manager, ready, persistenceUnavailable } = useChecklistSync()
  return <><p className="info-section-note">勾選先儲存在此裝置；帳戶旅程可在連線後同步。</p>
    {persistenceUnavailable && <p className="content-warning" role="alert">此瀏覽器未能儲存清單，本次更改只保留於本次使用，重新載入後可能遺失。</p>}
    {orderedDefinitions(checklists).map((list) => {
      const items = list.groups.flatMap((group) => group.items), ids = items.map((item) => item.id)
      const completed = ids.filter((id) => manager.row(ownerId, snapshot.trip.id, id)?.checked).length
      const reset = () => {
        if (window.confirm('確定要取消此清單的全部勾選？更改會先儲存在此裝置，帳戶旅程稍後同步。')) {
          for (const id of ids) manager.mutate(ownerId, snapshot.trip.id, id, false)
        }
      }
      return <article className="checklist-definition" key={list.id} data-checklist-id={list.id}>
      <h3>{list.title}</h3>{list.description && <p>{list.description}</p>}<Notes notes={list.notes} />
      <div className="checklist-progress" aria-live="polite"><strong>完成：{completed}/{ids.length}{ids.length > 0 && `（${Math.round(completed / ids.length * 100)}%）`}</strong>
        <span className="checklist-sync-label">{manager.status(ownerId, snapshot.trip.id, ids)}</span>
        {ids.length > 0 && <button className="itinerary-action" onClick={reset} disabled={!ready} aria-label={`全部取消勾選：${list.title}`}>全部取消勾選</button>}
      </div>
      <div className="checklist-groups">{orderedDefinitions(list.groups).map((group) => <section className="checklist-group" key={group.id} data-group-id={group.id}>
        <h4>{group.title}</h4><Notes notes={group.notes} />
        <ul>{orderedDefinitions(group.items).map((item) => {
          const checked = manager.row(ownerId, snapshot.trip.id, item.id)?.checked ?? false
          return <li key={item.id} data-checklist-item-id={item.id} className={checked ? 'checklist-checked' : ''}>
            <label className="checklist-item"><input type="checkbox" checked={checked} disabled={!ready}
              onChange={(event) => manager.mutate(ownerId, snapshot.trip.id, item.id, event.currentTarget.checked)} /><span>{item.label}</span></label>
            <Notes notes={item.notes} />
          </li>
        })}</ul>
      </section>)}</div>
    </article>})}</>
}
