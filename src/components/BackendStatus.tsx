import { useEffect, useState } from 'react'
import { checkBackend } from '../services/backend'

type BackendState = 'loading' | 'connected' | 'unavailable'
const labels: Record<BackendState, string> = {
  loading: 'Supabase：正在檢查連線…',
  connected: 'Supabase：已連線',
  unavailable: 'Supabase：暫時未能連線',
}

export function BackendStatus() {
  const [state, setState] = useState<BackendState>('loading')
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    void checkBackend(controller.signal).then((connected) => {
      if (active) setState(connected ? 'connected' : 'unavailable')
    }).catch(() => { if (active) setState('unavailable') }).finally(() => window.clearTimeout(timeout))
    return () => { active = false; window.clearTimeout(timeout); controller.abort() }
  }, [])
  return <p className={`backend-status backend-${state}`} aria-live="polite" aria-busy={state === 'loading'}>{labels[state]}</p>
}
