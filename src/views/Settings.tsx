import { APP_VERSION } from '../app/metadata'
import { fontOptions, usePreferences } from '../app/Preferences'
import { AuthPanel } from '../components/AuthPanel'
import { BackendStatus } from '../components/BackendStatus'
import { PageHeading } from '../components/PageHeading'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useChecklistSync } from '../app/ChecklistSync'
import { listCachedTrips } from '../offline/tripCache'
import type { CachedTrip } from '../offline/tripCache'
import { formatTransportDateTime } from '../data/tripInformation'
import { UpdatePanel } from '../components/UpdatePanel'
import '../styles/settings.css'

function deviceTime(value: string | undefined) {
  return value && Number.isFinite(Date.parse(value)) ? formatTransportDateTime(value, Intl.DateTimeFormat().resolvedOptions().timeZone) : undefined
}

export function Settings() {
  const { fontSize, setFontSize, persistenceUnavailable } = usePreferences()
  const { session } = useAuth()
  const { manager, online, syncing, error, ready, persistenceUnavailable: stateStorageUnavailable } = useChecklistSync()
  const [cached, setCached] = useState<CachedTrip[]>([])
  const [cacheState, setCacheState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [cacheEpoch, setCacheEpoch] = useState(0)
  const [clearing, setClearing] = useState(false)
  const [clearMessage, setClearMessage] = useState('')
  const ownerId = session?.user.id ?? null
  useEffect(() => {
    let active = true; setCacheState('loading')
    void listCachedTrips(ownerId).then((records) => { if (active) { for (const record of records) manager.register(record.payload, record.ownerId); setCached(records); setCacheState('loaded') } }).catch(() => { if (active) setCacheState('error') })
    return () => { active = false }
  }, [ownerId, cacheEpoch, manager])
  async function clear() {
    setClearing(true); setClearMessage('')
    try {
      const pending = await manager.pendingForClear()
      if (!window.confirm(`清除本機離線資料？此瀏覽器所有已下載旅程、本機清單及同步紀錄將被移除。${pending ? `有 ${pending} 項尚未同步更改，清除後將遺失。` : ''}帳戶、伺服器資料及字體偏好會保留。`)) return
      await manager.clearLocalData(); setCacheEpoch((value) => value + 1); setClearMessage('本機離線資料已清除。')
    }
    catch { setClearMessage('暫時未能完全清除本機資料，請稍後再試。') }
    finally { setClearing(false) }
  }
  return (
    <>
      <PageHeading title="設定" description="按你的習慣，調整旅程閱讀體驗。" />
      <div className="settings-grid">
        <AuthPanel />
        <section className="panel">
          <h2>閱讀偏好</h2>
          <fieldset className="font-control">
            <legend>字體大小</legend>
            <div className="font-options">
              {fontOptions.map((option) => (
                <label key={option.value}>
                  <input type="radio" name="font-size" value={option.value} checked={fontSize === option.value} onChange={() => setFontSize(option.value)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="muted">適用於所有頁面，並儲存於此瀏覽器。</p>
          {persistenceUnavailable && <p role="alert">此瀏覽器未能儲存偏好，字體設定只適用於本次使用。</p>}
        </section>
        <section className="panel" aria-labelledby="sync-title"><h2 id="sync-title">同步狀態</h2>
          <p>{session ? '已登入' : '尚未登入'} · {online ? 'ONLINE' : 'OFFLINE'}</p>
          <p data-testid="pending-sync-count">待同步更改：{manager.pendingCount()}</p>
          <p data-testid="last-checklist-sync">{manager.lastSuccessful() ? `上次清單同步：${deviceTime(manager.lastSuccessful())}` : '尚未有清單同步紀錄'}</p>
          <p aria-live="polite">{syncing ? '正在同步…' : error ? '同步稍後重試；本機更改會保留。' : !online ? '離線；連線後再同步。' : !session ? '登入原有帳戶後可同步帳戶旅程。' : '帳戶旅程清單會在可用時同步。'}</p>
          <button className="button" disabled={!ready || syncing || !online || !session} onClick={() => void manager.syncNow()}>立即同步</button>
          {stateStorageUnavailable && <p className="content-warning" role="alert">此瀏覽器未能儲存清單，更改只保留於本次使用。</p>}
        </section>
        <section className="panel" aria-labelledby="offline-title"><h2 id="offline-title">離線資料</h2>
          <p className="muted">已下載的旅程及清單保留於此瀏覽器，登出後仍可離線閱讀。尚未包括程式或圖片離線快取。</p>
          {cacheState === 'loading' ? <p>正在讀取已下載旅程…</p> : cacheState === 'error' ? <p>暫時未能讀取本機旅程。</p> : !cached.length ? <p>此裝置尚未下載旅程。</p> : <ul className="cached-trip-list">{cached.map((record) => <li key={record.tripId}>
            <h3>{record.payload.trip.title}</h3><p>{record.payload.trip.destinationLabel}</p>
            <p>Trip Data Version：{record.dataVersion}</p><p>Trip Schema Version：{record.schemaVersion}</p>
            {deviceTime(record.cachedAt) && <p>下載時間：{deviceTime(record.cachedAt)}</p>}
          </li>)}</ul>}
          <button className="button danger-button" disabled={!ready || clearing} onClick={() => void clear()}>清除本機離線資料</button>
          {clearMessage && <p aria-live="polite">{clearMessage}</p>}
        </section>
        <UpdatePanel />
        <section className="panel"><h2>語言</h2><p><strong>繁體中文</strong></p><p className="muted">預留日後多語言支援；目前未提供語言切換。</p></section>
        <section className="panel">
          <h2>關於應用程式</h2>
          <p className="version-detail">App Version {APP_VERSION}</p>
          <p className="muted">TravelPilot｜旅程管家</p>
          <BackendStatus />
        </section>
      </div>
    </>
  )
}
