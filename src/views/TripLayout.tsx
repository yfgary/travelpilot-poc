import { useEffect, useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { loadTrip } from '../services/trips'
import type { TripLoadResult, TripFailure } from '../services/trips'
import { PageNavigation } from '../components/PageNavigation'
import { LoadingState, ErrorState } from '../components/ViewState'

const failures: Record<TripFailure, { title: string; description: string }> = {
  'not-found': { title: '找不到旅程', description: '此旅程不存在或尚未發佈。' },
  'auth-required': { title: '找不到旅程', description: '請先登入，以讀取帳戶旅程。此裝置尚未儲存這個旅程。' },
  unavailable: { title: '暫時未能載入旅程', description: '請稍後再試。此裝置未有可用的離線旅程。' },
  'invalid-data': { title: '旅程資料未能通過驗證', description: '請稍後再試或聯絡內容管理者。' },
  'unsupported-schema': { title: '未支援此旅程資料格式', description: '請使用支援此資料格式的 App 版本。' },
}
export function TripLayout() {
  const { tripSlug = '' } = useParams<{ tripSlug: string }>()
  const { phase, session } = useAuth()
  const userId = session?.user.id ?? null
  const initializing = phase === 'initializing'
  const [loaded, setLoaded] = useState<{ slug: string; userId: string | null; result: TripLoadResult } | null>(null)
  useEffect(() => {
    if (initializing) return
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    setLoaded(null)
    void loadTrip(tripSlug, { userId, signal: controller.signal, online: navigator.onLine }).then((result) => {
      if (active) setLoaded({ slug: tripSlug, userId, result })
    }).catch(() => { if (active) setLoaded({ slug: tripSlug, userId, result: { state: 'unavailable' } }) }).finally(() => window.clearTimeout(timeout))
    return () => { active = false; controller.abort(); window.clearTimeout(timeout) }
  }, [tripSlug, userId, initializing])
  const result: TripLoadResult = !initializing && loaded?.slug === tripSlug && loaded.userId === userId ? loaded.result : { state: 'loading' }
  if (result.state === 'loading') return <LoadingState title="正在載入旅程" />
  if (result.state !== 'loaded') return <ErrorState {...failures[result.state]} headingLevel={1} action={<Link to="/">返回首頁</Link>} />
  const trip = result.snapshot.trip
  return <>
    <section className="trip-heading">
      <p className="eyebrow">你的旅程</p><h2>{trip.title}</h2><p>{trip.summary}</p>
      <p className="trip-identifier">旅程識別碼：<code>{trip.slug}</code></p>
      <p className="trip-identifier" data-testid="trip-versions">Trip Data Version：{result.dataVersion} · Trip Schema Version：{result.schemaVersion}</p>
      <p className="trip-identifier" data-testid="trip-source">POC 資料來源：{result.source}</p>
      {result.source === 'remote' && !result.cacheSaved && <p className="muted">此裝置暫時未能儲存離線旅程。</p>}
      {result.source === 'cache' && <p className="muted">正在使用此裝置已儲存的旅程資料。</p>}
      <PageNavigation tripSlug={trip.slug} />
    </section>
    <Outlet context={trip} />
  </>
}
