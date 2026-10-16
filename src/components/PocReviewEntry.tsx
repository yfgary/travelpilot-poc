// POC deployment navigation only; never a trip-loader or destination rule.
export function PocReviewEntry() {
  return <aside className="panel" aria-label="未發佈草稿 Preview">
    <a className="button" href={`${import.meta.env.BASE_URL}review/#/`}>日本 2027（未發佈草稿 Preview）</a>
    <p className="muted">公開測試版本 · 模擬天氣 · 不連接帳戶或雲端同步；正式旅程不變。</p>
  </aside>
}
