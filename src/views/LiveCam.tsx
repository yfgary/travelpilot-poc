import { useMemo, useState } from 'react'
import { useLoadedTrip } from '../app/TripContext'
import { PageHeading } from '../components/PageHeading'
import { EmptyState } from '../components/ViewState'
import { WeatherPanel } from '../components/weather/WeatherPanel'
import { ContentNavigation } from '../components/ContentNavigation'
import { CameraCard } from '../components/liveCam/CameraCard'
import { cameraFilterDays, groupLiveCams } from '../data/liveCams'
import { calendarDate } from '../data/tripDates'
import '../styles/itinerary.css'
import '../styles/liveCam.css'

export function LiveCam() {
  const { snapshot } = useLoadedTrip()
  const [dayId, setDayId] = useState<string | undefined>()
  const days = useMemo(() => cameraFilterDays(snapshot), [snapshot])
  const groups = useMemo(() => groupLiveCams(snapshot, dayId), [snapshot, dayId])
  const today = calendarDate(new Date(), snapshot.trip.timezone)
  return <div className="live-cam-page" data-testid="live-cam">
    <section className="panel"><PageHeading title="Live Cam" description="按地區與行程日期查閱畫面及來源；天氣預測、即時畫面與官方狀態應分開確認。" />
      <p className="camera-note">共 {snapshot.liveCams.length} 個鏡頭 · 狀態連結只供查閱，不代表服務或道路正在運作。</p>
    </section>
    <WeatherPanel />
    {!snapshot.liveCams.length ? <EmptyState title="此旅程未設定 Live Cam" description="此旅程未有鏡頭來源，仍可參考上方天氣資料。" /> : <>
      <ContentNavigation label="Live Cam 行程日期"><button className="itinerary-action" aria-pressed={!dayId} onClick={() => setDayId(undefined)}>全部</button>{days.map((day) => <button key={day.id} className="itinerary-action" aria-pressed={dayId === day.id} onClick={() => setDayId(day.id)} title={day.title}>D{day.dayNumber}{day.date === today && <> · 今日</>}</button>)}</ContentNavigation>
      {groups.map((group) => {
        const subgroups = [...new Set(group.cameras.map((item) => item.cam.group))]
        return <section className="camera-region" key={group.id} aria-labelledby={`camera-region-${group.id}`}>
          <div className="camera-region-heading"><h2 id={`camera-region-${group.id}`}>{group.label}</h2><span>{group.cameras.length} 個鏡頭</span></div>
          {subgroups.map((subgroup) => <div className="camera-subgroup" key={subgroup ?? ''}>{subgroup && <h3>{subgroup}</h3>}<div className="camera-grid">{group.cameras.filter((item) => item.cam.group === subgroup).map((item) => <CameraCard key={item.cam.id} item={item} />)}</div></div>)}
        </section>
      })}
    </>}
  </div>
}
