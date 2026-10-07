import { Link } from 'react-router-dom'
import { ErrorState } from '../components/ViewState'

export function NotFound({ trip = false }: { trip?: boolean }) {
  return (
    <div className="panel">
      <ErrorState
        headingLevel={1}
        title={trip ? '找不到旅程' : '找不到頁面'}
        description={trip ? '此旅程不存在，請返回首頁選擇旅程。' : '請返回首頁繼續瀏覽。'}
        action={<Link className="button" to="/">返回首頁</Link>}
      />
    </div>
  )
}
