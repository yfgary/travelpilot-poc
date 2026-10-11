import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect } from './fixtures'
import type { TripSnapshot } from '../src/data/schema/trip'

// Closed GPT-6 packet literals: SHA restoration works in shallow CI checkouts.
export const operationsPacket = JSON.parse(readFileSync('tests/fixtures/japan-operations-packet5.json', 'utf8')) as {
  implementationPacket: string; priorCandidateSha256: string;
  fields: { kind: 'timeline' | 'place'; dayId?: string; id: string; previous: string; text: string }[];
  sources: TripSnapshot['sources']; camera: Extract<TripSnapshot, { schemaVersion: 6 }>['liveCams'][number];
  placeSourceAddition: { placeId: string; sourceId: string };
}
export function restoreOperationsPacket<T extends TripSnapshot>(snapshot: T): T {
  expect(operationsPacket.priorCandidateSha256).toBe('8cf05ea8dd13a9154588e99b10a1fa0f242f6f1fbaef137f5f5b0a7a4870040e')
  const restored = structuredClone(snapshot)
  expect(restored.sources.slice(-6)).toEqual(operationsPacket.sources)
  restored.sources = restored.sources.slice(0, -6)
  expect(restored.liveCams.at(-1)).toEqual(operationsPacket.camera)
  restored.liveCams = restored.liveCams.slice(0, -1)
  const place = restored.places.find(p => p.id === operationsPacket.placeSourceAddition.placeId)!
  expect(place.sourceIds.at(-1)).toBe(operationsPacket.placeSourceAddition.sourceId)
  place.sourceIds = place.sourceIds.slice(0, -1)
  for (const field of operationsPacket.fields) {
    if (field.kind === 'timeline') {
      const item = restored.days.find(d => d.id === field.dayId)!.timeline.find(i => i.id === field.id)!
      expect(item.description).toBe(field.text)
      item.description = field.previous
    } else {
      const place = restored.places.find(p => p.id === field.id)!
      const paragraphs = place.longDescription!.split('\n\n')
      expect(paragraphs).toHaveLength(2)
      expect(paragraphs[1]).toBe(field.text)
      place.longDescription = paragraphs[0] + '\n\n' + field.previous
    }
  }
  expect(createHash('sha256').update(JSON.stringify(restored, null, 2) + '\n').digest('hex')).toBe(operationsPacket.priorCandidateSha256)
  return restored
}
