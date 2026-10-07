import type { FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { LoadingState } from './ViewState'

export function AuthPanel() {
  const { phase, session, error, busy, signIn, signOut } = useAuth()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const data = new FormData(form)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')
    // Never persist the password. Clear the field on submission, even on failure.
    const field = form.elements.namedItem('password') as HTMLInputElement
    field.value = ''
    void signIn(email, password)
  }

  return (
    <section className="panel auth-panel" aria-labelledby="auth-title">
      <h2 id="auth-title">帳戶</h2>
      {phase === 'initializing' ? <LoadingState title="正在確認登入狀態" description="請稍候。" /> : (
        <>
          {session ? (
            <div>
              <p className="auth-summary"><strong>已登入</strong></p>
              <p className="account-email">{session.user.email}</p>
              <button className="button" type="button" disabled={busy} onClick={() => void signOut()}>{busy ? '登出中…' : '登出'}</button>
            </div>
          ) : (
            <form className="login-form" onSubmit={submit} aria-label="登入" aria-busy={busy}>
              <p className="muted">使用現有帳戶登入。</p>
              <label htmlFor="login-email">電郵</label>
              <input id="login-email" name="email" type="email" autoComplete="username" required disabled={busy} />
              <label htmlFor="login-password">密碼</label>
              <input id="login-password" name="password" type="password" autoComplete="current-password" required disabled={busy} />
              <button className="button" type="submit" disabled={busy}>{busy ? '登入中…' : '登入'}</button>
            </form>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
        </>
      )}
    </section>
  )
}
