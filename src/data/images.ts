import type { TripSnapshot } from './schema/trip'

// Shared by trip covers and content galleries. Home-brand artwork is excluded.
export function resolveContentImage(image: TripSnapshot['images'][number] | undefined, baseURL = '/') {
  if (!image) return null
  try {
    const path = decodeURIComponent(new URL(image.url, 'https://assets.invalid/').pathname)
    if (/\/travelpilot_banner\.PNG$/i.test(path)) return null
  } catch { return null }
  if (!image.url || /^(?!https?:)[a-z]+:/i.test(image.url) || image.url.startsWith('/')) return null
  return { ...image, url: /^https?:\/\//.test(image.url) ? image.url : `${baseURL}${image.url}` }
}
