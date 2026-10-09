import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

async function mockWake(page: Page, mode: 'supported' | 'unsupported' | 'reject' | 'pending') {
  await page.addInitScript((mode) => {
    const state = { requested: 0, released: 0 }; Object.assign(window, { wakeTest: state })
    if (mode === 'unsupported') { Object.defineProperty(navigator, 'wakeLock', { value: undefined, configurable: true }); return }
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async (type: string) => {
      state.requested++; if (type !== 'screen') throw new Error('Wrong lock type')
      if (mode === 'reject') throw new Error('Denied by test')
      const held = new EventTarget() as EventTarget & { release: () => Promise<void> }
      held.release = async () => { state.released++; held.dispatchEvent(new Event('release')) }
      Object.assign(window, { releaseWakeTest: () => held.release() })
      if (mode === 'pending') return new Promise((resolve) => Object.assign(window, { resolveWakeTest: () => resolve(held) }))
      return held
    } } })
  }, mode)
}
const counts = (page: Page) => page.evaluate(() => (window as unknown as { wakeTest: { requested: number; released: number } }).wakeTest)
test('Wake Lock is off by default, requests only on user action and releases when leaving Today', async ({ page }) => {
  await mockWake(page, 'supported'); await page.goto('#/trip/demo-trip/today'); await expect(page.getByTestId('today-mode')).toBeVisible()
  expect(await counts(page)).toEqual({ requested: 0, released: 0 })
  await page.getByRole('button', { name: '保持螢幕常亮', exact: true }).click(); await expect(page.locator('.today-awake')).toContainText('螢幕常亮中')
  await expect(page.getByRole('button', { name: '關閉螢幕常亮', exact: true })).toHaveAttribute('aria-pressed', 'true'); expect(await counts(page)).toEqual({ requested: 1, released: 0 })
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '旅程資料', exact: true }).click()
  await expect.poll(() => counts(page)).toEqual({ requested: 1, released: 1 })
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '今日模式', exact: true }).click()
  await expect(page.getByRole('button', { name: '保持螢幕常亮', exact: true })).toHaveAttribute('aria-pressed', 'false'); expect(await counts(page)).toEqual({ requested: 1, released: 1 })
})
test('Wake Lock can be disabled and a browser release is reflected without automatic reacquisition', async ({ page }) => {
  await mockWake(page, 'supported'); await page.goto('#/trip/demo-trip/today')
  await page.getByRole('button', { name: '保持螢幕常亮', exact: true }).click(); await page.getByRole('button', { name: '關閉螢幕常亮', exact: true }).click()
  await expect(page.getByRole('button', { name: '保持螢幕常亮', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: '保持螢幕常亮', exact: true }).click()
  await page.evaluate(() => (window as unknown as { releaseWakeTest: () => Promise<void> }).releaseWakeTest())
  await expect(page.locator('.today-awake')).toContainText('螢幕常亮已關閉'); expect(await counts(page)).toEqual({ requested: 2, released: 2 })
})
for (const mode of ['unsupported', 'reject'] as const) test(`Wake Lock ${mode} is safe and never blocks core day controls`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message))
  await mockWake(page, mode); await page.goto('#/trip/demo-trip/today')
  if (mode === 'unsupported') { await expect(page.locator('.today-awake')).toContainText('此裝置不支援螢幕常亮'); await expect(page.getByRole('button', { name: '保持螢幕常亮', exact: true })).toBeDisabled() }
  else { await page.getByRole('button', { name: '保持螢幕常亮', exact: true }).click(); await expect(page.locator('.today-awake')).toContainText('暫時未能保持螢幕常亮；仍可使用今日模式。') }
  await page.getByRole('navigation', { name: '今日模式行程日期' }).getByRole('button', { name: 'D2', exact: true }).click(); await expect(page.getByTestId('today-mode')).toHaveAttribute('data-selected-day', 'city-day-2')
  expect(errors).toEqual([])
})
test('pending Wake Lock response after unmount is released rather than leaked', async ({ page }) => {
  await mockWake(page, 'pending'); await page.goto('#/trip/demo-trip/today')
  await page.getByRole('button', { name: '保持螢幕常亮', exact: true }).click(); await expect(page.getByRole('button', { name: '保持螢幕常亮', exact: true })).toBeDisabled()
  await page.getByRole('navigation', { name: '旅程頁面' }).getByRole('link', { name: '旅程資料', exact: true }).click(); await expect(page.getByTestId('trip-information')).toBeVisible()
  await page.evaluate(() => (window as unknown as { resolveWakeTest: () => void }).resolveWakeTest()); await expect.poll(() => counts(page)).toEqual({ requested: 1, released: 1 })
})
