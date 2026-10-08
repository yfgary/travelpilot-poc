import { useEffect, useRef, useState } from 'react'
import { APP_VERSION } from '../app/metadata'
import { checkAppUpdate } from '../services/appVersions'
import type { UpdateResult } from '../data/appVersions'
const key = 'travelpilot.auto-check-updates'
function readPreference() { try { return localStorage.getItem(key) === 'true' } catch { return false } }
export function UpdatePanel() {
  const [automatic, setAutomatic] = useState(readPreference)
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  const [result, setResult] = useState<UpdateResult | { state: 'idle' | 'loading' }>({ state: 'idle' })
  const controller = useRef<AbortController | null>(null)
  const mounted = useRef(true)
  const busy = useRef(false)
  async function check() {
    if (busy.current) return
    busy.current = true; setResult({ state: 'loading' })
    const request = new AbortController(); controller.current = request
    const timeout = setTimeout(() => request.abort(), 10000)
    try { const next = await checkAppUpdate(APP_VERSION, request.signal); if (mounted.current) setResult(next) }
    finally { clearTimeout(timeout); busy.current = false }
  }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort() } }, [])
  useEffect(() => { if (automatic) void check() }, [automatic])
  const labels = { idle: '尚未檢查版本資料', loading: '正在檢查…', latest: '已是最新版本', unsynced: '版本資料尚未同步', unavailable: '版本資料暫時未能確認', available: '有較新版本' }
  return <section className="panel" aria-labelledby="updates-title"><h2 id="updates-title">更新</h2>
    <p aria-live="polite" data-testid="update-status">{labels[result.state]}{result.state === 'available' && `：${result.version}`}</p>
    <button className="button" onClick={() => void check()} disabled={result.state === 'loading'}>檢查更新</button>
    <label className="setting-checkbox"><input type="checkbox" checked={automatic} onChange={(event) => {
      const enabled = event.currentTarget.checked; setAutomatic(enabled)
      try { localStorage.setItem(key, String(enabled)); setStorageUnavailable(false) } catch { setStorageUnavailable(true) }
    }} /><span>自動檢查更新</span></label>
    <p className="muted">只檢查版本資料；不會自動重新載入或替換正在使用的程式。</p>
    {storageUnavailable && <p className="muted">自動檢查偏好只適用於本次使用。</p>}
  </section>
}
