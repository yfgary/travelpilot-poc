/**
 * POC-only presentation preview. Real trip timing, weather caches, alerts and
 * published snapshot payloads are NEVER changed by this display fallback.
 * GitHub Pages production uses a different base path, disabling this preview.
 */
export const POC_WEATHER_PREVIEW = import.meta.env.BASE_URL === '/travelpilot-poc/'

export const simulatedWeatherNotice =
  'POC 模擬天氣（畫面測試）：暫用現時天氣資料示範行程日版面及適宜度，並非該行程日期的預測或出行建議。'
