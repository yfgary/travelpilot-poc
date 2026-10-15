import { performance, monitorEventLoopDelay } from 'node:perf_hooks'
import type { Page, Request, TestInfo } from '@playwright/test'

// Temporary opt-in measurements. No polling, React/IDB patching, traces,
// payloads, headers, storage values or authentication credentials.
export async function createStageTiming(page: Page, info: TestInfo) {
  const enabled = process.env.TRAVELPILOT_STAGE_TIMING === '1'
  const started = performance.now()
  const stages: { label: string; startMs: number; durationMs: number; completed: boolean }[] = []
  const api: { endpoint: string; startMs: number; responseMs?: number; finishedMs?: number; status?: number }[] = []
  const errors: string[] = []
  const readiness: { heading: boolean; versions: boolean; elapsedMs: number; browserMs: number }[] = []
  const pending = new Map<Request, typeof api[number]>()
  const elapsed = () => performance.now() - started
  const cpu = process.cpuUsage()
  const loop = enabled ? monitorEventLoopDelay({ resolution: 20 }) : null
  loop?.enable()
  const request = (req: Request) => {
    const path = new URL(req.url()).pathname
    if (!path.startsWith('/rest/') && !path.startsWith('/auth/')) return
    const row = { endpoint: `${req.method()} ${path}`, startMs: elapsed() }
    api.push(row); pending.set(req, row)
  }
  const response = (res: import('@playwright/test').Response) => {
    const row = pending.get(res.request())
    if (row) { row.status = res.status(); row.responseMs = elapsed() }
  }
  const finished = (req: Request) => {
    const row = pending.get(req)
    if (row) row.finishedMs = elapsed()
  }
  // Record error class only: messages can contain session data in other suites.
  const pageError = (error: Error) => errors.push(error.name)
  async function measure<T>(label: string, action: () => Promise<T>): Promise<T> {
    if (!enabled) return action()
    const row = { label, startMs: elapsed(), durationMs: 0, completed: false }
    stages.push(row)
    try { const result = await action(); row.completed = true; return result }
    finally { row.durationMs = elapsed() - row.startMs }
  }
  if (enabled) {
    page.on('request', request); page.on('response', response)
    page.on('requestfinished', finished); page.on('pageerror', pageError)
    await measure('diagnostic.setup', async () => {
      await page.exposeBinding('__tpStageReady', (_source, data) => readiness.push({ ...data, elapsedMs: elapsed() }))
      await page.addInitScript(() => {
        let previous = ''
        const observer = new MutationObserver(() => {
          const heading = Boolean(document.querySelector('.trip-heading h2'))
          const versions = Boolean(document.querySelector('[data-testid="trip-versions"]'))
          const key = `${heading}/${versions}`
          if (previous === key) return
          previous = key
          void (window as unknown as { __tpStageReady(data: object): Promise<void> }).__tpStageReady({ heading, versions, browserMs: performance.now() })
          if (heading && versions) observer.disconnect()
        })
        observer.observe(document, { childList: true, subtree: true })
      })
    })
  }
  return {
    measure,
    async finish() {
      if (!enabled) return
      const totalMs = elapsed()
      loop!.disable()
      page.off('request', request); page.off('response', response)
      page.off('requestfinished', finished); page.off('pageerror', pageError)
      const usage = process.cpuUsage(cpu)
      const counts = Object.fromEntries([...new Set(api.map(row => row.endpoint))].map(endpoint => [endpoint, api.filter(row => row.endpoint === endpoint).length]))
      await info.attach('stage-timing', { contentType: 'application/json', body: JSON.stringify({
        test: info.title, project: info.project.name, worker: info.workerIndex, iteration: info.repeatEachIndex,
        status: info.status, totalMs, stages, api, counts, readiness, errors,
        workerCpuMs: { user: usage.user / 1000, system: usage.system / 1000 },
        workerEventLoopMs: { max: loop!.max / 1e6, p95: loop!.percentile(95) / 1e6 },
      }, null, 2) })
    },
  }
}
