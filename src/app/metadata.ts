// package.json version is the canonical release value, injected by Vite.
export const APP_VERSION = __APP_VERSION__
export const branding = {
  banner: `${import.meta.env.BASE_URL}assets/images/travelpilot_banner.PNG`,
  icon: `${import.meta.env.BASE_URL}assets/images/travelpilot_icon.PNG`,
}
