import type { ReactNode } from 'react'
const disabled = async () => { throw new Error('Authentication is disabled in Preview') }
// No SDK import, session restoration, token access, refresh timer or auth listener.
const state = { phase: 'signed-out' as const, session: null, error: null, busy: false, signIn: disabled, signOut: disabled }
export function AuthProvider({ children }: { children: ReactNode }) { return children }
export function useAuth() { return state }
