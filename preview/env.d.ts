/// <reference types="vite/client" />
declare const __ISOLATED_PREVIEW__: boolean
declare const __PREVIEW_BUILD_SHA__: string
declare const __PREVIEW_DIRTY__: boolean
declare module 'virtual:preview-input' {
  const input: import('./validation').PreviewInput
  export default input
}
