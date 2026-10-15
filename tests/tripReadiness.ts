import { performance } from 'node:perf_hooks'
import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

// Test-harness setup budget only: retained Trace shows the loaded footer at
// ~7.1s after the first readiness assertion began, despite fast mocked HTTP.
// This is not a product SLA, functional-assertion override or global timeout.
export const INITIAL_TRIP_READY_MS = 12_000
export async function waitForInitialTrip(page: Page, slug: string) {
  const started = performance.now()
  let ready = false
  try {
    // The footer exists only for a loaded result. Exact identity prevents a
    // previous trip's shell from satisfying readiness when the route changes.
    await expect(page.locator('.trip-technical code')).toHaveText(slug, { timeout: INITIAL_TRIP_READY_MS })
    ready = true
  } finally {
    const elapsedMs = performance.now() - started
    if (!ready || elapsedMs >= 5000 || process.env.TRAVELPILOT_READINESS_TIMING === '1') {
      await test.info().attach('initial-trip-readiness', {
        contentType: 'application/json',
        body: JSON.stringify({ slug, ready, elapsedMs, budgetMs: INITIAL_TRIP_READY_MS }),
      })
    }
  }
}
