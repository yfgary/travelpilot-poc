import { useEffect, useRef, useState } from 'react'

export function ScreenAwake() {
  const supported = typeof navigator.wakeLock?.request === 'function'
  const lock = useRef<WakeLockSentinel | null>(null), alive = useRef(true), busy = useRef(false)
  const [status, setStatus] = useState<'off' | 'pending' | 'on' | 'error'>('off')
  useEffect(() => { alive.current = true; return () => { alive.current = false; const held = lock.current; lock.current = null; void held?.release().catch(() => {}) } }, [])
  async function toggle() {
    if (!supported || busy.current) return
    busy.current = true; setStatus('pending')
    try {
      if (lock.current) { const held = lock.current; lock.current = null; await held.release(); if (alive.current) setStatus('off') }
      else {
        const held = await navigator.wakeLock.request('screen')
        if (!alive.current) { await held.release(); return }
        lock.current = held; setStatus('on')
        held.addEventListener('release', () => { if (lock.current === held) { lock.current = null; if (alive.current) setStatus('off') } }, { once: true })
      }
    } catch { if (alive.current) setStatus('error') }
    finally { busy.current = false }
  }
  return <section className="today-awake" aria-label="螢幕常亮"><button className="itinerary-action" aria-pressed={status === 'on'} disabled={!supported || status === 'pending'} onClick={() => void toggle()}>{status === 'on' ? '關閉螢幕常亮' : '保持螢幕常亮'}</button>
    <p aria-live="polite">{!supported ? '此裝置不支援螢幕常亮' : status === 'on' ? '螢幕常亮中' : status === 'pending' ? '正在處理螢幕常亮…' : status === 'error' ? '暫時未能保持螢幕常亮；仍可使用今日模式。' : '螢幕常亮已關閉；由你選擇是否啟用。'}</p></section>
}
