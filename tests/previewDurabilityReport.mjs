import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Public repository: fail closed. Never upload arbitrary reporter, DOM, trace,
// screenshot, console, storage or error text. Preserve complete safe timelines.
const directory = 'work/preview-durability-ci'
const plans = {
  isolated: {
    titles: ['stale auth/session and normal caches are ignored; local checklist persists, resets, and never syncs', 'device-clock Today manual controls and warm offline local checklist remain usable'],
    projects: ['width-390', 'width-430', 'width-1024'], scenarios: ['stale', 'warm'],
  },
  'review-demo': {
    titles: ['same-origin Checklist Reset and normal Clear preserve the other app data'],
    projects: ['width-390', 'width-1024'], scenarios: ['review-demo'],
  },
}
function planFor(profile) {
  if (!Object.hasOwn(plans, profile)) throw new Error('Unexpected diagnostic profile')
  return plans[profile]
}
const values = {
  kind: 'db-open db-success db-error db-blocked tx-start tx-complete tx-abort tx-error request request-success request-error checkbox-change reset-click ui-state beforeunload pagehide document-init test-reload-call test-reload-return postmortem-start postmortem-readback postmortem-unavailable',
  db: 'travelpilot-preview-v2-user-state travelpilot-v2-user-state',
  mode: 'readonly readwrite versionchange', store: 'checklistState meta syncMeta preferences',
  scope: 'local-demo redacted-owner', owner: 'null redacted',
  operation: 'get getAll put delete clear', result: 'passed failed timedOut skipped interrupted',
  error: 'AbortError UnknownError ConstraintError DataError InvalidStateError NotFoundError QuotaExceededError ReadOnlyError TransactionInactiveError VersionError InvalidAccessError SecurityError',
}
const objects = new Set(['row', 'rows', 'key', 'ui', 'expected', 'stored'])
const numbers = new Set(['receivedMs', 'browserMs', 'document', 'tx', 'pending'])
const booleans = new Set(['checked', 'disabled', 'sameTrip', 'sameItem', 'databaseMissing'])
export function sanitize(value, key = '') {
  if (value === null) return null
  if (Array.isArray(value)) {
    if (value.length > 2000) throw new Error('Diagnostic array exceeds cap')
    return value.map(item => sanitize(item, key))
  }
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => {
    if (!objects.has(name) && !numbers.has(name) && !booleans.has(name) && !(name in values) && !['tripHash', 'itemHash', 'stores'].includes(name)) throw new Error('Unexpected diagnostic field')
    return [name, sanitize(item, name)]
  }))
  if (typeof value === 'number' && numbers.has(key) && Number.isFinite(value)) return value
  if (typeof value === 'boolean' && booleans.has(key)) return value
  if (typeof value === 'string' && (
    values[key]?.split(' ').includes(value) ||
    key === 'stores' && values.store.split(' ').includes(value) ||
    ['tripHash', 'itemHash'].includes(key) && /^[0-9a-f]{8}$/.test(value)
  )) return value
  throw new Error('Unexpected diagnostic value')
}
function specifications(suites) {
  return suites.flatMap(suite => [...(suite.specs ?? []), ...specifications(suite.suites ?? [])])
}
export function verifySelection(report, profile = 'isolated') {
  const { projects, titles } = planFor(profile)
  const specs = specifications(report.suites)
  const pairs = specs.flatMap(spec => spec.tests.map(test => `${test.projectName}|${spec.title}`)).sort()
  const expected = projects.flatMap(project => titles.map(title => `${project}|${title}`)).sort()
  if (JSON.stringify(pairs) !== JSON.stringify(expected)) throw new Error('Expected exactly the approved project/title pairs')
  if (profile === 'review-demo' && specs.some(spec => spec.file !== 'publicReview.spec.ts')) throw new Error('Expected publicReview source file')
  return specs
}
export function verifyWorkers(report, profile = 'isolated') {
  const tests = verifySelection(report, profile).flatMap(spec => spec.tests)
  if (tests.some(test => test.results?.length !== 1)) throw new Error('Expected one result per approved scenario')
  const results = tests.flatMap(test => test.results)
  if (report.config.workers !== 2 || results.some(result => result.retry !== 0)) throw new Error('Expected two configured workers and zero retries')
  if (results.some(result => !Number.isInteger(result.parallelIndex) || result.parallelIndex < 0 || result.parallelIndex > 1)) throw new Error('Expected parallelIndex in configured slots [0,1]')
  if (results.some(result => !Number.isInteger(result.workerIndex) || result.workerIndex < 0)) throw new Error('Expected nonnegative worker process IDs')
  return {
    configuredWorkers: 2,
    observedParallelIndices: [...new Set(results.map(result => result.parallelIndex))].sort(),
    observedWorkerProcesses: new Set(results.map(result => result.workerIndex)).size,
  }
}
export function verifyDiagnosticFiles(files, profile = 'isolated') {
  const { projects, scenarios } = planFor(profile)
  const pairs = files.map(file => {
    const match = /^(width-(?:390|430|1024))-(stale|warm|review-demo)-worker\d+\.json$/.exec(file)
    if (!match) throw new Error('Unexpected diagnostic filename')
    return `${match[1]}|${match[2]}`
  }).sort()
  const expected = projects.flatMap(project => scenarios.map(scenario => `${project}|${scenario}`)).sort()
  if (JSON.stringify(pairs) !== JSON.stringify(expected)) throw new Error('Expected all distinct approved diagnostic reports')
}
function main() {
  const profile = process.argv[3] ?? 'isolated'
  const { projects, titles, scenarios } = planFor(profile)
  if (process.argv[2] === '--selection') {
    verifySelection(JSON.parse(readFileSync(`${directory}/selection.json`, 'utf8')), profile)
    console.log(`Selection verified: ${titles.length * projects.length} scenarios, ${titles.length} titles, ${projects.length} viewports (${profile})`)
    return
  }
  if (process.argv[2] !== '--collect') throw new Error('Expected --selection or --collect')
  const report = JSON.parse(readFileSync(`${directory}/result.json`, 'utf8'))
  const workers = verifyWorkers(report, profile)
  const files = readdirSync('work/checklist-durability').filter(name => /^width-(390|430|1024)-(stale|warm|review-demo)-worker\d+\.json$/.test(name))
  verifyDiagnosticFiles(files, profile)
  const output = 'work/preview-durability-public'
  mkdirSync(output, { recursive: true })
  const summary = { profile, ...workers, scenarios: [], rawTracesUploaded: false }
  for (const file of files) {
    const raw = readFileSync(`work/checklist-durability/${file}`)
    if (raw.length > 128 * 1024) throw new Error('Diagnostic report exceeds 128KiB cap')
    const data = JSON.parse(raw)
    if (!titles.includes(data.title) || !projects.includes(data.project) || !/^153\.\d+\.\d+\.\d+$/.test(data.browser) || !values.result.split(' ').includes(data.status)) throw new Error('Unexpected diagnostic metadata')
    const scenario = scenarios[titles.indexOf(data.title)]
    if (!file.startsWith(`${data.project}-${scenario}-worker`)) throw new Error('Diagnostic metadata/filename mismatch')
    const safe = { scenario, project: data.project, status: data.status, browser: data.browser, events: data.events.map(event => sanitize(event)) }
    const encoded = JSON.stringify(safe, null, 2)
    if (Buffer.byteLength(encoded) > 128 * 1024) throw new Error('Sanitized report exceeds cap')
    writeFileSync(`${output}/${file}`, encoded)
    summary.scenarios.push({ file, ...safe, events: undefined, eventCount: safe.events.length })
  }
  // At most six <=128KiB files plus this small summary: total artifact <800KiB.
  writeFileSync(`${output}/summary.json`, JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
