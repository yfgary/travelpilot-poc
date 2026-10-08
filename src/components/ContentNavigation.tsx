import type { ReactNode } from 'react'
import '../styles/contentNavigation.css'

export function ContentNavigation({ label, children }: { label: string; children: ReactNode }) {
  return <nav className="content-quick-nav" aria-label={label} onKeyDown={(event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
    const current = buttons.indexOf(event.target as HTMLButtonElement)
    if (current < 0) return
    event.preventDefault()
    const next = buttons[(current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length]
    next?.focus({ preventScroll: true }); next?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }}>{children}</nav>
}
