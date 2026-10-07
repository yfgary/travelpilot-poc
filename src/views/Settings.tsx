import { APP_VERSION } from '../app/metadata'

export function Settings() {
  return (
    <section className="panel">
      <h1>設定</h1>
      <p>App Version {APP_VERSION}</p>
      <p>語言：繁體中文（香港）</p>
      <p>設定功能將於後續階段加入。</p>
    </section>
  )
}
