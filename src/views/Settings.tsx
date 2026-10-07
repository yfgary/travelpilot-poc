import { APP_VERSION } from '../app/metadata'
import { fontOptions, usePreferences } from '../app/Preferences'
import { AuthPanel } from '../components/AuthPanel'
import { BackendStatus } from '../components/BackendStatus'
import { PageHeading } from '../components/PageHeading'

export function Settings() {
  const { fontSize, setFontSize, persistenceUnavailable } = usePreferences()
  return (
    <>
      <PageHeading title="設定" description="按你的習慣，調整旅程閱讀體驗。" />
      <div className="settings-grid">
        <section className="panel">
          <h2>閱讀偏好</h2>
          <fieldset className="font-control">
            <legend>字體大小</legend>
            <div className="font-options">
              {fontOptions.map((option) => (
                <label key={option.value}>
                  <input type="radio" name="font-size" value={option.value} checked={fontSize === option.value} onChange={() => setFontSize(option.value)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="muted">適用於所有頁面，並儲存於此瀏覽器。</p>
          {persistenceUnavailable && <p role="alert">此瀏覽器未能儲存偏好，字體設定只適用於本次使用。</p>}
          <div className="setting-row"><span>語言</span><strong>繁體中文</strong></div>
        </section>
        <section className="panel">
          <h2>關於應用程式</h2>
          <p className="version-detail">App Version {APP_VERSION}</p>
          <p className="muted">TravelPilot｜旅程管家</p>
          <BackendStatus />
          <p>離線資料、同步及更新功能將於後續階段加入。</p>
        </section>
        <AuthPanel />
      </div>
    </>
  )
}
