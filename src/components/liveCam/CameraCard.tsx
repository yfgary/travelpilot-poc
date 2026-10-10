import { useEffect, useRef, useState } from 'react'
import { cameraActions, cameraPresentation, cameraPriorityLabels, type ResolvedCamera } from '../../data/liveCams'
import { resolveMaps } from '../../data/itinerary'
import { ExternalLink, MapsAction } from '../itinerary/ContentActions'

function CameraMedia({ item }: { item: ResolvedCamera }) {
  const { cam } = item
  const presentation = cameraPresentation(cam)
  const [failed, setFailed] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<'pending' | 'loading' | 'document-loaded' | 'unconfirmed'>('pending')
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  useEffect(() => {
    const node = ref.current
    if (!node || !online || failed || presentation.mode !== 'embed') return
    // Lazy frames below the viewport have not started loading. Only time an
    // observable visible attempt; never call a timeout proof of provider failure.
    let timer: number | undefined
    const observer = new IntersectionObserver((entries) => {
      if (timer === undefined && entries.some((entry) => entry.isIntersecting)) {
        setStatus((current) => current === 'pending' ? 'loading' : current)
        timer = window.setTimeout(() => setStatus((current) => current === 'pending' || current === 'loading' ? 'unconfirmed' : current), 15000)
      }
    }, { root: node.closest('main') })
    observer.observe(node)
    return () => { observer.disconnect(); window.clearTimeout(timer) }
  }, [online, failed, attempt, presentation.mode])
  const image = presentation.mode === 'image' ? presentation.source : presentation.mode === 'external' ? presentation.preview : undefined
  function retry() { setFailed(false); setStatus('pending'); setLoadedAt(null); setAttempt((value) => value + 1) }
  function loaded() { setStatus('document-loaded'); if (image) setLoadedAt(new Date()) }
  return <>
    <div ref={ref} className="camera-media">
      {!online ? <p>目前離線；連線後可開啟來源查看畫面。</p> : failed ? <p>暫時未能載入畫面，請使用下方來源連結。</p> : presentation.mode === 'embed' ?
        <iframe key={attempt} src={presentation.source} title={cam.label} loading="lazy" allowFullScreen allow="fullscreen" sandbox="allow-scripts allow-presentation" referrerPolicy="no-referrer" onLoad={loaded} onError={() => setFailed(true)} /> : image ?
          <img key={attempt} src={image} alt={cam.label} loading="lazy" referrerPolicy="no-referrer" onLoad={loaded} onError={() => setFailed(true)} /> :
          <p>此來源請在官方／來源頁面開啟。{cam.sourceType !== 'external' && <> HTTP 來源不會在此嵌入。</>}</p>}
    </div>
    {online && !failed && presentation.mode === 'embed' && <p className="camera-note" data-testid="camera-frame-status" aria-live="polite">
      {status === 'pending' ? '尚待畫面進入可見範圍；播放狀態尚未確認。' : status === 'loading' ? '正在載入來源框架；播放狀態尚未確認。' : status === 'unconfirmed' ? '未能確認來源載入；可開啟下方來源頁面查看。' : '框架載入程序已完成；實際畫面及播放狀態仍未確認。'}
    </p>}
    {presentation.mode === 'embed' && <p className="camera-note">部分來源可能拒絕嵌入；瀏覽器無法可靠判定跨網站播放器是否可用。若畫面未能顯示，請開啟下方官方／來源頁面。</p>}
    {image && <p className="camera-note">{presentation.mode === 'image' ? '靜止畫面不會自動刷新' : '此為預覽圖片，不代表即時直播'}，請留意來源的更新時間。裝置載入時間不代表拍攝或來源更新時間。</p>}
    {loadedAt && <p className="camera-note">此裝置載入時間：<time dateTime={loadedAt.toISOString()}>{new Intl.DateTimeFormat('zh-HK', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(loadedAt)}</time></p>}
    {online && (presentation.mode === 'embed' || (image && failed)) && <div className="camera-media-controls">
      {failed ? <button className="itinerary-action" onClick={retry}>重新嘗試載入</button> : <>
        {presentation.mode === 'embed' && <button className="itinerary-action" onClick={() => setFailed(true)}>畫面未能播放</button>}

      </>}
    </div>}
  </>
}
export function CameraCard({ item }: { item: ResolvedCamera }) {
  const { cam, region, place, days, description, priority, tags, sourceLabel, aliases = [] } = item
  const records = [item, ...aliases]
  const used = new Set<string>()
  const actions = records.flatMap((record) => cameraActions(record.cam).flatMap((action) => {
    if (used.has(action.url)) return []
    used.add(action.url); return [{ ...action, name: record.cam.label }]
  }))
  const maps = records.flatMap((record) => {
    const url = resolveMaps(record.place)
    if (!url || used.has(url)) return []
    used.add(url); return [record.place!]
  })
  return <article className="camera-card" data-testid="camera-card" data-camera-id={cam.id}>
    <h3>{cam.label}</h3>{description && <p>{description}</p>}
    <div className="camera-badges"><span>{sourceLabel}</span>{priority && <span className={`camera-priority-${priority}`}>{cameraPriorityLabels[priority]}</span>}{tags.map((tag, i) => <span key={i}>{tag}</span>)}{days.map((day) => <span key={day.id} title={day.title}>D{day.dayNumber}</span>)}</div>
    {(region || place) && <p className="camera-context">{region && <>地區：{region.label ?? region.name}</>}{place && <> · 相關場所：{place.name}</>}</p>}
    {aliases.length > 0 && <div className="camera-aliases"><p>同來源的其他行程關聯：</p>{aliases.map((record) => <div key={record.cam.id}>
      <p>{record.cam.label}{record.cam.group && <> · {record.cam.group}</>}{record.region && <> · {record.region.label ?? record.region.name}</>}{record.place && <> · {record.place.name}</>}{record.priority && <> · {cameraPriorityLabels[record.priority]}</>} · {record.sourceLabel}</p>
      {record.description && <p>{record.description}</p>}
      <p>{record.days.map((day) => `D${day.dayNumber}`).join(' / ')}</p>
    </div>)}</div>}
    <CameraMedia key={`${cam.sourceType}:${cam.sourceURL}:${cam.previewURL ?? ''}`} item={item} />
    <div className="itinerary-actions">{actions.map((action) => <ExternalLink key={action.url} href={action.url} label={`${action.label}：${action.name}`}>{action.label} ↗</ExternalLink>)}
      {maps.map((entity) => <MapsAction key={entity.id} entity={entity} name={entity.name} />)}
    </div>
  </article>
}
