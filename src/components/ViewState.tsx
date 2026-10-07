import type { ReactNode } from 'react'

interface StateProps {
  title: string
  description: string
  action?: ReactNode
  headingLevel?: 1 | 2
}

function ViewState({ kind, title, description, action, headingLevel = 2 }: StateProps & {
  kind: 'loading' | 'empty' | 'error'
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <section className={`view-state state-${kind}`} aria-label={title} aria-busy={kind === 'loading'}>
      <span className="state-symbol" aria-hidden="true">{kind === 'loading' ? '…' : kind === 'error' ? '!' : '◇'}</span>
      <Heading>{title}</Heading>
      <p>{description}</p>
      {action}
    </section>
  )
}

export function LoadingState({ title = '載入中', description = '請稍候。', ...props }: Partial<StateProps>) {
  return <ViewState kind="loading" title={title} description={description} {...props} />
}
export function EmptyState(props: StateProps) {
  return <ViewState kind="empty" {...props} />
}
export function ErrorState(props: StateProps) {
  return <ViewState kind="error" {...props} />
}
