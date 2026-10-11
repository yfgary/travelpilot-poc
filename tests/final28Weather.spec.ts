import { readFileSync } from 'node:fs'
import { test, expect } from './fixtures'
import { mockJapan, japanVersion } from './japanFixtures'
import { seedAuth, cacheContents } from './tripFixtures'
import { validateTripSnapshot } from '../src/data/schema/trip'

const draft = JSON.parse(readFileSync('docs/proposals/jp2027-schema6-unpublished-draft.json', 'utf8'))
for (const font of ['small', 'medium', 'large']) test(`actual unpublished Japan Today has shared five-day weather at ${font} font`, async ({ page }, info) => {
  expect(validateTripSnapshot(draft)).toMatchObject({ valid: true })
  await page.addInitScript(size => localStorage.setItem('travelpilot.font-size', size), font)
  await seedAuth(page)
  await mockJapan(page, { versions: [{ ...japanVersion(), schema_version: 6, data_version: 'jp2027.2-DRAFT-UNPUBLISHED', payload: draft }] })
  await page.goto(`#/trip/${draft.trip.slug}/today`)
  const forecast = page.getByTestId('today-five-day-weather')
  await expect(forecast.getByRole('heading', { name: '未來5日預測' })).toBeVisible()
  await expect(forecast.locator('.weather-forecast-day')).toHaveCount(5)
  await expect(forecast.getByTestId('weather-panel-simulation')).toContainText('POC 模擬天氣')
  const before = await cacheContents(page)
  const days = page.getByRole('navigation', { name: '今日模式行程日期' })
  for (const day of [draft.days[0], draft.days[2]]) {
    await days.getByRole('button', { name: `D${day.dayNumber}`, exact: true }).click()
    const mapping = draft.weather.dayRegions.find((entry: { dayId: string }) => entry.dayId === day.id)
    await expect(forecast).toHaveAttribute('data-weather-region', mapping.weatherRegionId)
    await expect(forecast.locator('.weather-forecast-day')).toHaveCount(5)
  }
  const scroller = forecast.getByRole('region')
  await scroller.scrollIntoViewIfNeeded()
  const geometry = await scroller.evaluate(node => ({ client: node.clientWidth, scroll: node.scrollWidth, ys: [...node.children].map(child => child.getBoundingClientRect().top) }))
  expect(new Set(geometry.ys).size).toBe(1)
  if (page.viewportSize()!.width >= 900) expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 2)
  else {
    expect(geometry.scroll).toBeGreaterThan(geometry.client)
    await scroller.focus(); await page.keyboard.press('ArrowRight')
    await expect.poll(() => scroller.evaluate(node => node.scrollLeft)).toBeGreaterThan(0)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('main')!.scrollWidth <= document.querySelector('main')!.clientWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath(`actual-draft-today-five-day-${font}.png`) })
  await page.context().setOffline(true)
  await expect(page.getByRole('status').filter({ hasText: 'OFFLINE' })).toBeVisible()
  await expect(forecast.locator('.weather-forecast-day')).toHaveCount(5)
  expect(await cacheContents(page)).toEqual(before)
})
