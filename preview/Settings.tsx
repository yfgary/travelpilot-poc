import { APP_VERSION } from '../src/app/metadata'
import { fontOptions, usePreferences } from '../src/app/Preferences'
import { useChecklistSync } from '../src/app/ChecklistSync'
import { PageHeading } from '../src/components/PageHeading'
import { previewMetadata } from './trips'
import '../src/styles/settings.css'
export function Settings() {
  const { fontSize, setFontSize, persistenceUnavailable } = usePreferences()
  const { ready, persistenceUnavailable: storageUnavailable } = useChecklistSync()
  return <><PageHeading title="設定" description="Preview 專用設定；不會連接真實帳戶或雲端服務。" /><div className="settings-grid">
    <section className="panel"><h2>閱讀偏好</h2><fieldset className="font-control"><legend>字體大小</legend><div className="font-options">{fontOptions.map(option => <label key={option.value}><input type="radio" name="font-size" value={option.value} checked={fontSize === option.value} onChange={() => setFontSize(option.value)} /><span>{option.label}</span></label>)}</div></fieldset>{persistenceUnavailable && <p role="alert">此瀏覽器未能儲存偏好，字體設定只適用於本次使用。</p>}</section>
    <section className="panel"><h2>本機清單</h2><p>只儲存在此裝置；支援勾選、重設及重新載入。沒有雲端同步。</p><p>{ready ? '本機資料已就緒。' : '正在讀取本機資料…'}</p>{storageUnavailable && <p role="alert">此瀏覽器未能儲存清單，更改只保留於本次使用。</p>}<p>登入、Backend Check、雲端同步及更新檢查已停用。</p></section>
    <section className="panel"><h2>語言</h2><p>繁體中文</p></section>
    <section className="panel preview-build-details"><h2>Preview 版本</h2><p>App Version {APP_VERSION}</p><p>Trip Data Version：{previewMetadata.dataVersion}</p><p>Trip Schema Version：{previewMetadata.schemaVersion}</p><p>SHA256：{previewMetadata.sha256}</p><p>Build SHA：{__PREVIEW_BUILD_SHA__}{__PREVIEW_DIRTY__ && '（含本機未提交修改）'}</p><p>未發佈；沒有修改正式行程。沒有模擬時鐘。</p></section>
  </div></>
}
