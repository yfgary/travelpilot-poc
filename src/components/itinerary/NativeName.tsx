import { localNameOf } from '../../data/localNames'

/** Optional local-language secondary label; absent for old or incomplete records. */
export function NativeName({ entity }: { entity: object | null | undefined }) {
  const value = localNameOf(entity)
  return value ? <p className="entity-native-name" data-testid="native-name">{value}</p> : null
}
