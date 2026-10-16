import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect } from './fixtures'
import type { TripSnapshot } from '../src/data/schema/trip'
import { restoreNativeNamesPacket9 } from './japanNativeNamesPacketData'

// Packet8 reverse before old Packet7 and Packet5 exact SHA checks.
export const matsumotoPacket = JSON.parse(readFileSync('tests/fixtures/japan-matsumoto-camera-packet8.json','utf8')) as {
  implementationPacket: string; checkedAt: string; priorCandidateSha256: string;
  cameraInsertIndex: number; originalCameraCount: number;
  camera: Extract<TripSnapshot, { schemaVersion: 6 }>['liveCams'][number];
  source: TripSnapshot['sources'][number];
  verifiedAngles: { label: string; youtubeEmbed: string }[];
  playbackVerified: boolean; embeddingAuthorized: boolean; browserProviderFetchVerified: boolean;
}
export function restoreMatsumotoCameraPacket8<T extends TripSnapshot>(snapshot: T): T {
  expect(matsumotoPacket.priorCandidateSha256).toBe('702f3d75a54aefb5348e54bb0b71a4ce520569b15bfdbe8bcbf79837503766d0')
  const r = restoreNativeNamesPacket9(snapshot)
  expect(r.liveCams).toHaveLength(matsumotoPacket.originalCameraCount + 1)
  expect(r.liveCams[matsumotoPacket.cameraInsertIndex]).toEqual(matsumotoPacket.camera)
  r.liveCams.splice(matsumotoPacket.cameraInsertIndex,1)
  expect(r.sources.at(-1)).toEqual(matsumotoPacket.source)
  r.sources.pop()
  expect(createHash('sha256').update(JSON.stringify(r,null,2)+'\n').digest('hex')).toBe(matsumotoPacket.priorCandidateSha256)
  return r
}
