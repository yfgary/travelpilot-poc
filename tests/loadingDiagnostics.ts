import type { Page, TestInfo } from '@playwright/test'

// Opt-in, local diagnosis only: observe lifecycle names, never session values,
// request headers, bodies, cache records, passwords or token storage.
export async function observeLoading(page: Page, info: TestInfo) {
  const events: unknown[] = []
  const clean = (s: string) => s.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[redacted-jwt]').replace(/(?:Bearer\s+)[^\s]+/gi, 'Bearer [redacted]').replace(/fake-refresh-token/g, '[redacted]')
  const record = (data: unknown) => events.push({ wall: Date.now(), data })
  page.on('console', msg => record({ console: msg.type(), text: clean(msg.text()) }))
  page.on('pageerror', error => record({ pageerror: clean(error.message) }))
  page.on('request', req => { const u = new URL(req.url()); if (u.pathname.startsWith('/rest/') || u.pathname.startsWith('/auth/')) record({ request: req.method(), path: u.pathname }) })
  page.on('response', res => { const u = new URL(res.url()); if (u.pathname.startsWith('/rest/') || u.pathname.startsWith('/auth/')) record({ response: res.status(), path: u.pathname }) })
  page.on('requestfailed', req => record({ requestfailed: new URL(req.url()).pathname, reason: req.failure()?.errorText }))
  await page.exposeBinding('__tpLoadingEvent', (_source, event: unknown) => record(event))
  await page.addInitScript(() => {
    const emit = (event: object) => { void (window as unknown as { __tpLoadingEvent(e: object): Promise<void> }).__tpLoadingEvent({ ...event, clock: Date.now() }) }
    if (typeof PerformanceObserver !== 'undefined') {
      try { new PerformanceObserver(list => { for (const e of list.getEntries()) emit({ longTask: e.duration, start: e.startTime }) }).observe({ type: 'longtask', buffered: true }) } catch { /* unsupported observer */ }
    }
    const open = IDBFactory.prototype.open
    IDBFactory.prototype.open = function (...args) {
      const req = open.apply(this, args)
      emit({ idb: 'open', name: args[0] })
      for (const event of ['success', 'error', 'blocked', 'upgradeneeded']) req.addEventListener(event, () => emit({ idb: event, name: args[0] }))
      return req
    }
    const transaction = IDBDatabase.prototype.transaction
    IDBDatabase.prototype.transaction = function (...args) {
      const tx = transaction.apply(this, args)
      const label = { db: this.name, stores: [...tx.objectStoreNames], mode: tx.mode }
      emit({ ...label, idb: 'transaction' })
      for (const event of ['complete', 'abort', 'error']) tx.addEventListener(event, () => emit({ ...label, idb: event }))
      return tx
    }
    for (const op of ['get', 'getAll', 'put'] as const) {
      const method = IDBObjectStore.prototype[op]
      ;(IDBObjectStore.prototype[op] as typeof method) = function (this: IDBObjectStore, ...args: Parameters<typeof method>) {
        const req = (method as (...a: unknown[]) => IDBRequest).apply(this, args)
        const label = { db: this.transaction.db.name, store: this.name, op }
        emit({ ...label, idb: 'request' })
        for (const event of ['success', 'error']) req.addEventListener(event, () => emit({ ...label, idb: event }))
        return req
      }
    }
  })
  let sampling = false
  const timer = setInterval(() => {
    if (sampling || page.isClosed()) return
    sampling = true
    void page.evaluate(() => {
      // Read the current React tree, returning only non-sensitive stage labels.
      const root = document.getElementById('root') as unknown as Record<string, any> | null
      const key = root && Object.keys(root).find(k => k.startsWith('__reactContainer'))
      const fiber = key && root![key]
      const pending = [fiber?.stateNode?.current ?? fiber]
      const phases: string[] = [], loaded: string[] = []
      while (pending.length) {
        const f = pending.pop()
        if (!f) continue
        let hook = f.memoizedState
        while (hook && typeof hook === 'object' && 'memoizedState' in hook) {
          const state = hook.memoizedState
          if (state && typeof state === 'object' && 'session' in state && ['initializing', 'signed-in', 'signed-out', 'error'].includes(state.phase)) phases.push(state.phase)
          if (state?.result?.state && typeof state.slug === 'string') loaded.push(state.result.state)
          hook = hook.next
        }
        pending.push(f.child, f.sibling)
      }
      return { phases, loaded, heading: document.querySelector('main h1, main h2')?.textContent, clock: Date.now(), ready: document.readyState }
    }).then(state => record(state)).catch(error => record({ samplingError: clean(String(error)) })).finally(() => { sampling = false })
  }, 500)
  return async () => {
    if (info.status !== info.expectedStatus) await new Promise(resolve => setTimeout(resolve, 1500))
    clearInterval(timer)
    await info.attach('loading-events', { body: JSON.stringify(events, null, 2), contentType: 'application/json' })
    if (!page.isClosed()) await page.screenshot({ path: info.outputPath('loading-stage.png') }).catch(() => {})
  }
}
