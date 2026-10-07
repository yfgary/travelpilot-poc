import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect, supabaseOrigin, storageKey, testUser, fakeSession } from './fixtures'
import { supabaseConfig } from '../src/services/supabaseConfig'

async function fillLogin(page: import('@playwright/test').Page) {
  await page.getByLabel('電郵', { exact: true }).fill(testUser.email)
  await page.getByLabel('密碼', { exact: true }).fill('fake-test-password')
}

test('signed-out Settings offers password login only, with the release version', async ({ page }) => {
  await page.goto('#/settings')
  await expect(page.getByRole('button', { name: '登入', exact: true })).toBeVisible()
  await expect(page.getByLabel('電郵', { exact: true })).toHaveAttribute('type', 'email')
  await expect(page.getByLabel('密碼', { exact: true })).toHaveAttribute('type', 'password')
  await expect(page.getByRole('status')).toContainText('App Version v2.0.0-poc.3')
  await expect(page.getByRole('button', { name: /Sign Up|Create Account|註冊|建立帳戶|重設密碼|Magic Link/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Sign Up|Create Account|註冊|建立帳戶|重設密碼/i })).toHaveCount(0)
  await page.goto('#/trip/demo-trip/info')
  await expect(page.getByRole('heading', { level: 1, name: '旅程資料' })).toBeVisible()
})

test('login prevents duplicate requests and renders only a generic failure', async ({ page }) => {
  let requests = 0
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route(`${supabaseOrigin}/auth/v1/token**`, async (route) => {
    requests++
    expect(route.request().headers().apikey).toBe(supabaseConfig.publishableKey)
    await gate
    await route.fulfill({ status: 400, json: { code: 'invalid_credentials', message: 'Internal provider failure details' } })
  })
  const logs: string[] = []
  page.on('console', (message) => logs.push(message.text()))
  await page.goto('#/settings')
  await fillLogin(page)
  await page.getByRole('button', { name: '登入', exact: true }).click()
  await expect(page.getByRole('button', { name: '登入中…', exact: true })).toBeDisabled()
  await expect(page.getByLabel('密碼', { exact: true })).toHaveValue('')
  await page.getByRole('form', { name: '登入' }).evaluate((form) => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  expect(requests).toBe(1)
  release()
  await expect(page.getByRole('alert')).toHaveText('登入失敗，請檢查電郵和密碼，或稍後再試。')
  await expect(page.getByRole('button', { name: '登入', exact: true })).toBeEnabled()
  await expect(page.getByText('Internal provider failure details')).toHaveCount(0)
  expect(logs.join(' ')).not.toContain('fake-test-password')
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('fake-test-password')
})

test('login persists the SDK session across reload and logout returns to the form', async ({ page }) => {
  await page.route(`${supabaseOrigin}/auth/v1/token**`, (route) => route.fulfill({ status: 200, json: fakeSession() }))
  await page.route(`${supabaseOrigin}/auth/v1/logout**`, (route) => route.fulfill({ status: 204 }))
  await page.goto('#/settings')
  await fillLogin(page)
  await page.getByRole('button', { name: '登入', exact: true }).click()
  await expect(page.getByText('已登入', { exact: true })).toBeVisible()
  await expect(page.locator('.account-email')).toHaveText(testUser.email)
  await expect(page.getByText(testUser.id, { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('密碼', { exact: true })).toHaveCount(0)
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).not.toBeNull()
  await page.reload()
  await expect(page.locator('.account-email')).toHaveText(testUser.email)
  await page.getByRole('button', { name: '登出', exact: true }).click()
  await expect(page.getByRole('button', { name: '登入', exact: true })).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull()
  await page.reload()
  await expect(page.getByRole('button', { name: '登入', exact: true })).toBeVisible()
})

test('auth initialization is visible without blocking the shell', async ({ page }) => {
  await page.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: storageKey, session: fakeSession(1) })
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route(`${supabaseOrigin}/auth/v1/token**`, async (route) => {
    await gate
    await route.fulfill({ status: 200, json: fakeSession() })
  })
  await page.goto('#/settings')
  await expect(page.getByRole('heading', { name: '正在確認登入狀態' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: '主導覽' })).toBeVisible()
  await expect(page.getByRole('status')).toBeVisible()
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '首頁', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('每一段旅程，都準備妥當。')
  release()
  await page.getByRole('navigation', { name: '主導覽' }).getByRole('link', { name: '設定', exact: true }).click()
  await expect(page.locator('.account-email')).toHaveText(testUser.email)
})

test('a remote logout failure clears the local session and reports a generic error', async ({ page }) => {
  await page.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: storageKey, session: fakeSession() })
  await page.route(`${supabaseOrigin}/auth/v1/logout**`, (route) => route.fulfill({ status: 500, json: { message: 'Provider failure' } }))
  await page.goto('#/settings')
  await page.getByRole('button', { name: '登出', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('已在此瀏覽器登出，暫時未能確認伺服器登出狀態。')
  await expect(page.locator('.account-email')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '登入', exact: true })).toBeEnabled()
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull()
})

test('backend check has loading/success states, permits an empty list and never polls', async ({ page }) => {
  let count = 0
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route(`${supabaseOrigin}/rest/v1/v2_app_versions**`, async (route) => {
    count++
    const url = new URL(route.request().url())
    expect(url.searchParams.get('published')).toBe('eq.true')
    expect(url.searchParams.get('limit')).toBe('1')
    expect(route.request().method()).toBe('GET')
    await gate
    await route.fulfill({ status: 200, json: [] })
  })
  await page.goto('#/settings')
  await expect(page.locator('.backend-status')).toHaveText('Supabase：正在檢查連線…')
  release()
  await expect(page.locator('.backend-status')).toHaveText('Supabase：已連線')
  await page.getByRole('radio', { name: '大', exact: true }).check()
  await page.getByRole('radio', { name: '小', exact: true }).check()
  expect(count).toBe(1)
  await expect(page.getByRole('status')).toContainText('ONLINE')
})

test('backend failure is separate from the browser connection hint', async ({ page }) => {
  await page.route(`${supabaseOrigin}/rest/v1/v2_app_versions**`, (route) => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.goto('#/settings')
  await expect(page.locator('.backend-status')).toHaveText('Supabase：暫時未能連線')
  await expect(page.getByRole('status')).toContainText('ONLINE')
  await expect(page.getByRole('button', { name: '登入', exact: true })).toBeVisible()
})

test('frontend data code is V2-only and source/build contain no privileged credentials', async () => {
  function files(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
      ? files(join(directory, entry.name)) : [join(directory, entry.name)])
  }
  const sources = files('src').filter((file) => /\.(ts|tsx)$/.test(file)).map((file) => readFileSync(file, 'utf8')).join('\n')
  expect(sources).not.toMatch(/\b(?:trip_checklist_state|trip_checklist_shared|trip_sync_config)\b/)
  expect(sources).not.toMatch(/signUp\(|resetPasswordForEmail\(|signInWithOtp\(|signInWithOAuth\(/)
  expect(sources).not.toMatch(/if\s*\([^)]*(?:japan|shirakawa|day\s*===\s*[678])/i)
  const bundle = files('dist').filter((file) => file.endsWith('.js')).map((file) => readFileSync(file, 'utf8')).join('\n')
  for (const text of [sources, bundle]) {
    expect(text).not.toMatch(/sb_secret_[A-Za-z0-9_-]+/)
    for (const jwt of text.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
      const claims = JSON.parse(Buffer.from(jwt[1], 'base64url').toString())
      expect(claims.role).not.toBe('service_role')
    }
  }
})
