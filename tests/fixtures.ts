import { test as base, expect } from '@playwright/test'
import { openMeteoResponse } from './weatherFixtures'
import { supabaseConfig } from '../src/services/supabaseConfig'

export const supabaseOrigin = supabaseConfig.url
export const storageKey = `sb-${new URL(supabaseOrigin).hostname.split('.')[0]}-auth-token`
export const testUser = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated', role: 'authenticated', email: 'reader@example.invalid',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
}
export function fakeSession(expiresAt = Math.floor(Date.now() / 1000) + 3600) {
  const encode = (data: unknown) => Buffer.from(JSON.stringify(data)).toString('base64url')
  return {
    access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: testUser.id, role: 'authenticated', exp: expiresAt })}.test-signature`,
    refresh_token: 'fake-refresh-token', token_type: 'bearer', expires_in: 3600,
    expires_at: expiresAt, user: testUser,
  }
}

// Every suite uses network interception; no real account or database requests in CI.
export const test = base.extend<{ supabaseNetwork: void }>({
  supabaseNetwork: [async ({ page }, use) => {
    await page.route(`${supabaseOrigin}/**`, async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/rest/v1/v2_app_versions' || (url.pathname === '/rest/v1/v2_checklist_state' && route.request().method() === 'GET')) {
        await route.fulfill({ status: 200, json: [] })
      } else {
        await route.fulfill({ status: 400, json: { code: 'invalid_credentials', message: 'Invalid login credentials' } })
      }
    })
    await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: openMeteoResponse() }))
    await use()
  }, { auto: true }],
})
export { expect }
