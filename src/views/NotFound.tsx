import { Link } from 'react-router-dom'

export function NotFound({ trip = false }: { trip?: boolean }) {
  return (
    <section className="panel">
      <h1>{trip ? '找不到旅程' : '找不到頁面'}</h1>
      <p>{trip ? '此旅程不存在，請返回首頁選擇旅程。' : '請返回首頁繼續瀏覽。'}</p>
      <Link to="/">返回首頁</Link>
    </section>
  )
}
