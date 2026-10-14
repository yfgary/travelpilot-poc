import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect } from './fixtures'
import type { TripSnapshot } from '../src/data/schema/trip'

export const nativePacket = JSON.parse(readFileSync('tests/fixtures/japan-native-names-packet9.json','utf8')) as {
  priorCandidateSha256: string; fields: { kind:'transport'|'navigationTarget'; id:string; localName:string }[];
  sources: TripSnapshot['sources']; sourceInsertBeforeLastCount: number;
}
export function restoreNativeNamesPacket9<T extends TripSnapshot>(snapshot:T):T {
  expect(nativePacket.priorCandidateSha256).toBe('a7dbb7207bd2c5b29a8b87f6b03f7a39a3584eb21fc1b9ee63028b1ecbd9c67e')
  const r=structuredClone(snapshot)
  for(const f of nativePacket.fields){
    const target=(f.kind==='transport'?r.transport:r.navigationTargets).find(e=>e.id===f.id)! as {localName?:string}
    expect(target.localName).toBe(f.localName)
    delete target.localName
  }
  const start=r.sources.length-nativePacket.sources.length-nativePacket.sourceInsertBeforeLastCount
  expect(r.sources.slice(start,start+nativePacket.sources.length)).toEqual(nativePacket.sources)
  r.sources.splice(start,nativePacket.sources.length)
  expect(createHash('sha256').update(JSON.stringify(r,null,2)+'\n').digest('hex')).toBe(nativePacket.priorCandidateSha256)
  return r
}
