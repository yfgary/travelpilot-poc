import type { Suitability } from '../../data/weather/suitability'
import { suitabilityLabel } from '../../data/weather/suitability'
export function ScoreSummary({ score, compact = false }: { score: Suitability; compact?: boolean }) {
  if (score.state !== 'scored') return <><p className="weather-note">{score.state === 'insufficient-data' ? '天氣指標資料不足，暫不提供適宜度分數。' : '尚未設定活動適宜度。'}</p>{score.state === 'insufficient-data' && score.operationRequired && <p className="weather-operation">官方運行狀態優先於天氣分數</p>}</>
  return <div className={`weather-score ${compact ? 'weather-score-compact' : ''}`} data-score-state={score.access < 2.5 || score.final < 5.5 ? 'poor' : score.final >= 8 ? 'good' : 'fair'}>
    <div className="weather-score-main"><span>適宜度 <strong>{score.final.toFixed(1)}</strong> / 10</span><span>{suitabilityLabel(score)}</span></div>
    <div className="weather-score-split"><span>🎯 體驗 {score.experience.toFixed(1)} / 10</span><span>🚗 到達／安全 {score.access.toFixed(1)} / 10</span></div>
    {!compact && <div className="weather-profiles">{score.profiles.map((profile) => <span key={profile.id}>{profile.label} {profile.state === 'scored' ? profile.final.toFixed(1) : '資料不足'}</span>)}</div>}
    {score.operationRequired && <p className="weather-operation">官方運行狀態優先於天氣分數</p>}
    {!compact && score.notes.map((note) => <p className="weather-note" key={note}>{note}</p>)}
  </div>
}
