import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { build } from 'vite'
import type { Page } from '@playwright/test'
let bundle: Promise<string> | undefined
export async function jmaTools(page: Page) {
  const js = await (bundle ??= (async () => {
    mkdirSync('work', { recursive: true })
    const entry = join(mkdtempSync(resolve('work/jma-fixture-')), 'entry.mjs')
    writeFileSync(entry, `import * as jma from ${JSON.stringify(resolve('src/services/weather/jma.ts'))}; import * as alerts from ${JSON.stringify(resolve('src/services/weather/alerts.ts'))}; window.jmaTools={...jma,...alerts};`)
    const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, lib: { entry, formats: ['iife'], name: 'JmaFixture' } } })
    const output = Array.isArray(built) ? built[0] : built
    if (!('output' in output)) throw new Error('Expected bundle')
    return output.output.flatMap((item) => item.type === 'chunk' ? [item.code] : []).join('\n')
  })())
  await page.goto('#/')
  await page.addScriptTag({ content: js })
}
