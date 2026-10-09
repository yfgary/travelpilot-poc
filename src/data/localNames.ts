/** Native names are supplied by verified Schema 6 source data only.
 * Read-only helper works with strict legacy records without inventing translations.
 */
export function localNameOf(entity: object | null | undefined): string | undefined {
  if (!entity || !('localName' in entity)) return undefined
  return typeof entity.localName === 'string' && entity.localName.trim()
    ? entity.localName.trim()
    : undefined
}
