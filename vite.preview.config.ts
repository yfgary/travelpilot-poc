import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig, mergeConfig, normalizePath, type Plugin } from 'vite'
import normalConfig from './vite.config'
import { readPreviewInput } from './preview/build/inputs'

const root = dirname(fileURLToPath(import.meta.url))
const modulePath = (file: string) => normalizePath(resolve(root, file))
export const previewBoundaries = {
  'src/auth/AuthProvider.tsx': 'preview/AuthProvider.tsx',
  'src/services/trips.ts': 'preview/trips.ts',
  'src/services/checklists.ts': 'preview/cloudDisabled.ts',
  'src/views/Settings.tsx': 'preview/Settings.tsx',
  'src/app/AppShell.tsx': 'preview/AppShell.tsx',
  'src/services/weather/forecasts.ts': 'preview/forecasts.ts',
  'src/services/weather/alerts.ts': 'preview/alerts.ts',
  'src/data/weather/qaPreview.ts': 'preview/qaPreview.ts',
  'src/components/PocReviewEntry.tsx': 'preview/ReviewEntry.tsx',
} as const
const previewCopy: Record<string, Record<string, string>> = {
  'src/components/tripInfo/ChecklistDefinitions.tsx': {
    '勾選先儲存在此裝置；帳戶旅程可在連線後同步。': 'Preview 清單只儲存在此裝置，不會雲端同步。',
    '確定要取消此清單的全部勾選？更改會先儲存在此裝置，帳戶旅程稍後同步。': '確定要取消此清單的全部勾選？Preview 更改只儲存在此裝置，不會同步。',
  },
  'src/components/weather/WeatherPanel.tsx': { '天氣資料已更新': 'SIMULATED 固定天氣樣本', '座標樣本預測': '固定樣本，並非實況或預報' },
  'src/components/weather/TodayWeather.tsx': { '天氣資料已更新': 'SIMULATED 固定天氣樣本', '當地即時天氣': '模擬天氣樣本', '現時天氣樣本': '固定天氣樣本', '目前觀測／模型資料': '固定模擬資料，非即時觀測' },
}
// Exact, build-only substitutions. Normal storage identities never change.
export const previewNamespaces: Record<string, string[]> = {
  'src/offline/tripCache.ts': ['travelpilot-v2-trips'],
  'src/offline/checklistState.ts': ['travelpilot-v2-user-state'],
  'src/offline/weatherCache.ts': ['travelpilot-v2-weather-cache'],
  'src/app/Preferences.tsx': ['travelpilot.font-size'],
  'src/app/useRecentTrip.ts': ['travelpilot.recent-trip'],
  'src/app/NavigationHistory.tsx': ['travelpilot.navigation-history'],
  'src/app/useTodaySession.ts': ['travelpilot.today.preview.', 'travelpilot.today.progress.'],
  'src/data/weather/regions.ts': ['travelpilot.weather-region.'],
  'src/services/checklistSync.ts': ['travelpilot.checklist-state'],
}
function isolation(): Plugin {
  const replacements = new Map(Object.entries(previewBoundaries).map(([from, to]) => [modulePath(from), modulePath(to)]))
  return {
    name: 'isolated-preview-boundaries', enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source === 'virtual:preview-input') return '\0preview-input'
      if (!importer || importer.includes('/node_modules/') || (!source.startsWith('.') && !source.startsWith('/'))) return null
      const original = await this.resolve(source, importer, { ...options, skipSelf: true })
      return original && replacements.has(normalizePath(original.id)) ? replacements.get(normalizePath(original.id))! : null
    },
    load(id) {
      if (id === '\0preview-input') return `export default ${JSON.stringify(readPreviewInput(root))}`
    },
    transform(code, id) {
      const entry = Object.entries(previewNamespaces).find(([file]) => modulePath(file) === normalizePath(id))
      if (!entry) {
        const copy = Object.entries(previewCopy).find(([file]) => modulePath(file) === normalizePath(id))?.[1]
        if (!copy) return null
        for (const [from, to] of Object.entries(copy)) {
          if (!code.includes(from)) this.error(`Preview presentation boundary drift: ${id}`)
          code = code.replaceAll(from, to)
        }
        return { code, map: null }
      }
      for (const identity of entry[1]) {
        if (code.split(identity).length !== 2) this.error(`Preview namespace boundary drift: ${entry[0]}`)
        code = code.replace(identity, identity.replace(/^travelpilot(?=[.-])/, 'travelpilot-preview'))
      }
      return { code, map: null }
    },
    transformIndexHtml: { order: 'pre', handler(html) {
      return html.replace('/src/main.tsx', '/preview/main.tsx')
        .replace('<title>', '<title>PREVIEW 未發佈 · ')
        .replace('<head>', '<head><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="connect-src \'self\'; form-action \'none\'; object-src \'none\'; base-uri \'self\'">')
    } },
    generateBundle() {
      if (!this.getModuleInfo(modulePath('preview/main.tsx'))?.isIncluded || this.getModuleInfo(modulePath('src/main.tsx'))?.isIncluded) this.error('Preview entry boundary failed')
      for (const id of this.getModuleIds()) {
        if (/node_modules\/@supabase\//.test(id) || /\/src\/(?:services\/(?:supabase|backend|appVersions|checklists|trips|weather\/(?:jma|alerts|forecasts))|auth\/AuthProvider|components\/(?:AuthPanel|BackendStatus|UpdatePanel)|views\/Settings)\.(?:ts|tsx)$/.test(id)) this.error(`Forbidden live module in Preview: ${id}`)
      }
    },
    writeBundle(_options, bundle) {
      // Reject a retained live Open-Meteo transport even if the pure date helper is shared.
      for (const output of Object.values(bundle)) if (output.type === 'chunk') {
        for (const [id, module] of Object.entries(output.modules)) if (/\/providers\/openMeteo\.ts$/.test(id) && module.renderedExports.includes('openMeteoAdapter')) throw new Error('Live forecast adapter retained in Preview')
      }
    },
  }
}
export default defineConfig(({ mode }) => {
  if (mode !== 'isolated-preview') throw new Error('Use explicit --mode isolated-preview; normal build is separate')
  // Also validate before Rollup, so even an empty/changed entry cannot bypass the gate.
  readPreviewInput(root)
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Missing Preview build identity')
  const dirty = Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim())
  return mergeConfig(normalConfig, {
    base: '/travelpilot-poc/review/',
    plugins: [isolation()],
    define: { __ISOLATED_PREVIEW__: true, __PREVIEW_BUILD_SHA__: JSON.stringify(sha), __PREVIEW_DIRTY__: dirty },
    build: { outDir: 'dist-preview' },
    server: { host: '127.0.0.1' }, preview: { host: '127.0.0.1' },
  })
})
