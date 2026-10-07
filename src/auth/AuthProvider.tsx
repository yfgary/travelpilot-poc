import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

type AuthPhase = 'initializing' | 'signed-out' | 'signed-in' | 'error'
interface AuthState {
  phase: AuthPhase
  session: Session | null
  error: string | null
}
interface AuthContextValue extends AuthState {
  busy: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
const AuthContext = createContext<AuthContextValue | null>(null)
const sessionState = (session: Session | null): AuthState => ({
  phase: session ? 'signed-in' : 'signed-out', session, error: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ phase: 'initializing', session: null, error: null })
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)

  useEffect(() => {
    let active = true
    let revision = 0
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // getSession below owns initialization and reports restoration errors.
      // Keep callbacks synchronous: do not await Auth methods under the SDK lock.
      if (!active || event === 'INITIAL_SESSION') return
      revision++
      setState(sessionState(session))
    })
    const initialRevision = revision
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || revision !== initialRevision) return
      setState(error
        ? { phase: 'error', session: null, error: '暫時未能確認登入狀態，請重新登入。' }
        : sessionState(data.session))
    }).catch(() => {
      if (active && revision === initialRevision) {
        setState({ phase: 'error', session: null, error: '暫時未能確認登入狀態，請重新登入。' })
      }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function signIn(email: string, password: string) {
    if (submitting.current || state.phase === 'initializing') return
    submitting.current = true
    setBusy(true)
    setState((current) => ({ ...current, error: null }))
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.session) throw new Error('Login failed')
      setState(sessionState(data.session))
    } catch {
      setState({ phase: 'error', session: null, error: '登入失敗，請檢查電郵和密碼，或稍後再試。' })
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  async function signOut() {
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    setState((current) => ({ ...current, error: null }))
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error('Logout failed')
      setState(sessionState(null))
    } catch {
      setState((current) => ({ ...current, phase: 'error', error: current.session ? '暫時未能登出，請稍後再試。' : '已在此瀏覽器登出，暫時未能確認伺服器登出狀態。' }))
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return <AuthContext.Provider value={{ ...state, busy, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider is required')
  return context
}
