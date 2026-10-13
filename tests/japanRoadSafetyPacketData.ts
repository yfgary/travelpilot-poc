import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect } from './fixtures'
import type { TripSnapshot } from '../src/data/schema/trip'

// Reverse only this exact sourced packet before preserving all historical packet SHA assertions.
export const roadSafetyPacket = JSON.parse(readFileSync('tests/fixtures/japan-road-safety-packet7.json', 'utf8')) as {
  implementationPacket: string; highlightPacket: string; priorCandidateSha256: string;
  highlight: { dayId: string; index: number; after: string; previous: string[]; text: string };
  fields: { dayId: string; id: string; previous: string; appended: string }[];
  sources: TripSnapshot['sources']; tailPacket5SourceCount: number;
}
export function restoreRoadSafetyPacket<T extends TripSnapshot>(snapshot: T): T {
  expect(roadSafetyPacket.priorCandidateSha256).toBe('350b02bb8f365e973f1209a803d181453bd96c73fee1e3aa23d1cec459a7b59e')
  const r = structuredClone(snapshot)
  const day = r.days.find(d => d.id === roadSafetyPacket.highlight.dayId)!
  expect(day.highlights[roadSafetyPacket.highlight.index]).toBe(roadSafetyPacket.highlight.text)
  day.highlights.splice(roadSafetyPacket.highlight.index, 1)
  expect(day.highlights).toEqual(roadSafetyPacket.highlight.previous)
  for (const f of roadSafetyPacket.fields) {
    const t = r.days.find(d => d.id === f.dayId)!.timeline.find(t => t.id === f.id)!
    expect(t.description).toBe(f.previous + '\n' + f.appended)
    t.description = f.previous
  }
  const start = r.sources.length - roadSafetyPacket.tailPacket5SourceCount - roadSafetyPacket.sources.length
  expect(start).toBeGreaterThanOrEqual(0)
  expect(r.sources.slice(start, start + roadSafetyPacket.sources.length)).toEqual(roadSafetyPacket.sources)
  r.sources.splice(start, roadSafetyPacket.sources.length)
  expect(createHash('sha256').update(JSON.stringify(r, null, 2) + '\n').digest('hex')).toBe(roadSafetyPacket.priorCandidateSha256)
  return r
}
