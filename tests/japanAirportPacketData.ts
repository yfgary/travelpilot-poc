import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect } from './fixtures'
import type { TripSnapshot } from '../src/data/schema/trip'

// Exact closed GPT-6 packet and pre-packet literals, never fetched during tests.
export const airportPacket = JSON.parse(readFileSync('tests/fixtures/japan-airport-packet4.json', 'utf8')) as {
  implementationPacket: string; priorCandidateSha256: string;
  fields: { dayId: string; kind: string; itemId?: string; index?: number; previous: string; text: string }[];
  sources: { id: string; title: string; url: string; type: string; entity: { type: string; id: string } }[];
}

export function restoreAirportPacket<T extends TripSnapshot>(snapshot: T): T {
  expect(airportPacket.priorCandidateSha256).toBe('3861b2943e1fb6cdf615f23cc9c518d62a5ea5d45d15705271058d3b489d51d4')
  const restored = structuredClone(snapshot)
  expect(restored.sources.slice(-5)).toEqual(airportPacket.sources)
  restored.sources = restored.sources.slice(0, -5)
  for (const field of airportPacket.fields) {
    const day = restored.days.find(d => d.id === field.dayId)!
    if (field.kind === 'highlight') {
      expect(day.highlights[field.index!]).toBe(field.text)
      day.highlights[field.index!] = field.previous
    } else {
      const item = day.timeline.find(i => i.id === field.itemId)!
      expect(item.description).toBe(field.text)
      item.description = field.previous
    }
  }
  expect(createHash('sha256').update(JSON.stringify(restored, null, 2) + '\n').digest('hex')).toBe(airportPacket.priorCandidateSha256)
  return restored
}
