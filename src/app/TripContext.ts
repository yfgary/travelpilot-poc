import { useOutletContext } from 'react-router-dom'
import type { LoadedTrip } from '../services/trips'

// TripLayout alone loads/validates the snapshot. Children consume the same result.
export type TripContext = LoadedTrip
export function useLoadedTrip() { return useOutletContext<TripContext>() }
