import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '../src/app/App'
import { ErrorState } from '../src/components/ViewState'
import { initializePreview } from './trips'
import { PreviewNotice } from './Notice'
import '../src/styles/global.css'
import './preview.css'
const root = createRoot(document.getElementById('root')!)
void initializePreview().then(() => root.render(<StrictMode><App /></StrictMode>)).catch(() => {
  root.render(<><PreviewNotice /><ErrorState headingLevel={1} title="Preview 資料驗證失敗" description="草稿未能通過完整性檢查；已停止載入，沒有改用正式行程。" /></>)
})
