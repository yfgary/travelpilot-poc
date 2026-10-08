import { useEffect, useState } from 'react'
import { cameraActions, cameraPresentation, cameraPriorityLabels, type ResolvedCamera } from '../../data/liveCams'
import { resolveMaps } from '../../data/itinerary'
import { ExternalLink, MapsAction } from '../itinerary/ContentActions'

function CameraMedia({ item }: { item: ResolvedCamera }) {
  const { cam } = item
  const presentation = cameraPresentation(cam)
  const [failed, setFailed] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  const image = presentation.mode === 'image' ? presentation.source : presentation.mode === 'external' ? presentation.preview : undefined
  return <>
    <div className="camera-media">
      {!online ? <p>目前離線；連線後可開啟來源查看畫面。</p> : failed ? <p>暫時未能載入畫面，請使用下方來源連結。</p> : presentation.mode === 'embed' ?
        <iframe src={presentation.source} title={cam.label} loading="lazy" allowFullScreen allow="fullscreen" sandbox="allow-scripts allow-presentation" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : image ?
          <img src={image} alt={cam.label} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> :
          <p>此來源請在官方／來源頁面開啟。{cam.sourceType !== 'external' && <> HTTP 來源不會在此嵌入。</>}</p>}
    </div>
    {presentation.mode === 'embed' && <p className="camera-note">部分來源可能拒絕嵌入；若畫面未能顯示，請開啟下方官方／來源頁面。</p>}
    {presentation.mode === 'image' && <p className="camera-note">靜止畫面不會自動刷新，請留意來源的更新時間。</p>}
  </>
}
export function CameraCard({ item }: { item: ResolvedCamera }) {
  const { cam, region, place, days, description, priority, tags, sourceLabel } = item
  const actions = cameraActions(cam)
  const maps = resolveMaps(place)
  return <article className="camera-card" data-testid="camera-card" data-camera-id={cam.id}>
    <h3>{cam.label}</h3>{description && <p>{description}</p>}
    <div className="camera-badges"><span>{sourceLabel}</span>{priority && <span className={`camera-priority-${priority}`}>{cameraPriorityLabels[priority]}</span>}{tags.map((tag, i) => <span key={i}>{tag}</span>)}{days.map((day) => <span key={day.id} title={day.title}>D{day.dayNumber}</span>)}</div>
    {(region || place) && <p className="camera-context">{region && <>地區：{region.label ?? region.name}</>}{place && <> · 相關場所：{place.name}</>}</p>}
    <CameraMedia key={`${cam.sourceType}:${cam.sourceURL}:${cam.previewURL ?? ''}`} item={item} />
    <div className="itinerary-actions">{actions.map((action) => <ExternalLink key={action.url} href={action.url} label={`${action.label}：${cam.label}`}>{action.label} ↗</ExternalLink>)}
      {maps && !actions.some((action) => action.url === maps) && <MapsAction entity={place} name={place!.name} />}
    </div>
  </article>
}
