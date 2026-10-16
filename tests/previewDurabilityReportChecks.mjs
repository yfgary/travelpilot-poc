import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitize, verifySelection, verifyWorkers, verifyDiagnosticFiles } from './previewDurabilityReport.mjs'

// Synthetic reporter data only; no browser, credentials or travel content.
const titles = [
  'stale auth/session and normal caches are ignored; local checklist persists, resets, and never syncs',
  'device-clock Today manual controls and warm offline local checklist remain usable',
]
const projects = ['width-390', 'width-430', 'width-1024']
const fixture = () => ({ config: { workers: 2 }, suites: projects.map((projectName, workerIndex) => ({ specs: titles.map(title => ({ title, tests: [{ projectName, results: [{ workerIndex, parallelIndex: workerIndex === 0 ? 0 : 1, retry: 0 }] }] })) })) })
const results = report => report.suites.flatMap(suite => suite.specs.flatMap(spec => spec.tests.flatMap(test => test.results)))
const files = projects.flatMap((project, index) => ['stale', 'warm'].map(scenario => `${project}-${scenario}-worker${index}.json`))

test('six scenarios across three processes and two parallel slots are valid', () => {
  assert.deepEqual(verifyWorkers(fixture()), { configuredWorkers: 2, observedParallelIndices: [0, 1], observedWorkerProcesses: 3 })
})
test('a configured second slot need not be occupied', () => {
  const report = fixture(); results(report).forEach(result => { result.parallelIndex = 0 })
  assert.deepEqual(verifyWorkers(report).observedParallelIndices, [0])
})
test('invalid/missing parallel indices, process IDs, retries and result counts are rejected', () => {
  for (const parallelIndex of [2, -1, 0.5, '0', null, undefined]) {
    const report = fixture(); results(report)[0].parallelIndex = parallelIndex
    assert.throws(() => verifyWorkers(report), /parallelIndex/)
  }
  for (const workerIndex of [-1, 0.5, '0', undefined]) {
    const report = fixture(); results(report)[0].workerIndex = workerIndex
    assert.throws(() => verifyWorkers(report), /process IDs/)
  }
  const retry = fixture(); results(retry)[0].retry = 1; assert.throws(() => verifyWorkers(retry), /zero retries/)
  const workers = fixture(); workers.config.workers = 3; assert.throws(() => verifyWorkers(workers), /two configured workers/)
  const missing = fixture(); missing.suites[0].specs[0].tests[0].results = []; assert.throws(() => verifyWorkers(missing), /one result/)
})
test('missing or duplicated approved scenarios are rejected', () => {
  const missing = fixture(); missing.suites.pop(); assert.throws(() => verifySelection(missing), /six approved/)
  const duplicate = fixture(); duplicate.suites[0].specs[1].title = titles[0]; assert.throws(() => verifySelection(duplicate), /six approved/)
})
test('all six distinct diagnostic files are required', () => {
  verifyDiagnosticFiles(files)
  assert.throws(() => verifyDiagnosticFiles(files.slice(1)), /six distinct/)
  assert.throws(() => verifyDiagnosticFiles([files[1], ...files.slice(1)]), /six distinct/)
  assert.throws(() => verifyDiagnosticFiles([...files.slice(1), '../private.json']), /Unexpected diagnostic filename/)
})
test('sanitizer retains safe events and rejects sensitive, invalid or oversized input', () => {
  const event = { kind: 'tx-complete', browserMs: 12.5, tx: 1, row: { scope: 'local-demo', tripHash: '01234567', itemHash: '89abcdef', checked: true } }
  assert.deepEqual(sanitize(event), event)
  for (const unsafe of [{ access_token: 'synthetic-must-not-export' }, { kind: 'unknown' }, { scope: 'actual-owner' }, { itemHash: 'raw-id' }, { receivedMs: Infinity }, { pending: Array(2001).fill(0) }]) assert.throws(() => sanitize(unsafe))
})
