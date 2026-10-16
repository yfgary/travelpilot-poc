import { previewMetadata } from './trips'
export function PreviewNotice() {
  return <aside className="preview-notice" aria-label="Preview 未發佈資料" data-testid="preview-notice">
    <strong>PREVIEW · 未發佈</strong><span>公開 POC 測試網站</span><span>{previewMetadata.dataVersion} · Schema {previewMetadata.schemaVersion}</span>
    <span title={__PREVIEW_BUILD_SHA__}>Build {__PREVIEW_BUILD_SHA__.slice(0, 12)}{__PREVIEW_DIRTY__ ? '（含本機未提交修改）' : ''}</span>
    <small>SIMULATED 固定天氣樣本，非真實 2027 預報。JMA／官方警告未連線、未驗證。清單只儲存本機。使用裝置真實時間。</small>
  </aside>
}
