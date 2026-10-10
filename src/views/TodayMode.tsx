import { useMemo } from 'react'
import { useLoadedTrip } from '../app/TripContext'
import { useTripClock } from '../app/useTripClock'
import { useTodaySession } from '../app/useTodaySession'
import { PageHeading } from '../components/PageHeading'
import { EmptyState } from '../components/ViewState'
import { ContentNavigation } from '../components/ContentNavigation'
import { ExternalLink, MapsAction } from '../components/itinerary/ContentActions'
import { TodayWeather } from '../components/weather/TodayWeather'
import { ScreenAwake } from '../components/today/ScreenAwake'
import { NativeName } from '../components/itinerary/NativeName'
import { deriveToday, isOperationalDay, type TodayStop } from '../data/today'
import { calendarDate, formatTripDate } from '../data/tripDates'
import { timelineTiming, timelineStartInstant, timelineTimeLabel, plannedDelta, tripTime } from '../data/tripTime'
import { hardCutTime, severityLabels, timelineTypes, type TimelineItem } from '../data/itinerary'
import { navigationTypes } from '../data/tripInformation'
import '../styles/itinerary.css'
import '../styles/today.css'

function Activity({ item, stop, label }: { item: TimelineItem | null; stop?: TodayStop; label: string }) {
  return <article className="today-activity" aria-label={label}><p className="today-kicker">{label}</p>{item ? <>
    <p className="today-planned-time">{timelineTimeLabel(item, 'start')}{timelineTimeLabel(item, 'end') && <> – {timelineTimeLabel(item, 'end')}</>}</p>
    <h3>{item.title}</h3><p className="today-item-type">{timelineTypes[item.type].icon} {timelineTypes[item.type].label}{item.optional && <span className="today-tag">可選</span>}{item.bonus && <span className="today-tag">Bonus</span>}</p>
    {item.description && <p>{item.description}</p>}{item.warning && <p className="content-warning">⚠ 注意：{item.warning}</p>}
    {stop && <MapsAction entity={{ mapURL: stop.maps }} name={stop.name} />}
  </> : <p className="muted">{label === '上一項' ? '未有上一項' : label === '下一項' ? '未有下一項' : '目前沒有可確定的計劃活動；可手動選擇焦點。'}</p>}</article>
}
export function TodayMode() {
  const { snapshot } = useLoadedTrip()
  const now = useTripClock(), minute = Math.floor(now.getTime() / 60000)
  const { dayId, selectDay, progress, focusItem } = useTodaySession(snapshot, now)
  const day = snapshot.days.find((day) => day.id === dayId)
  const positionTime = day?.timeline.some((item) => timelineTiming(item)) ? now.getTime() : minute * 60000
  const model = useMemo(() => day ? deriveToday(snapshot, day, new Date(positionTime), progress[day.id]) : undefined, [snapshot, day, positionTime, progress])
  const days = useMemo(() => [...snapshot.days].sort((a, b) => a.dayNumber - b.dayNumber), [snapshot.days])
  const date = calendarDate(now, snapshot.trip.timezone)
  const clock = <div className="today-clock" aria-live="off"><p>旅程當地時間 · {snapshot.trip.timezone}</p><time dateTime={now.toISOString()}><span>{formatTripDate(date)}</span><strong>{tripTime(now, snapshot.trip.timezone, true)}</strong></time></div>
  if (!model || !day) return <div className="today-page" data-testid="today-mode"><section className="today-card"><PageHeading title="今日模式" />{clock}</section><EmptyState title="未有行程" description="此旅程尚未加入每日行程。" /><ScreenAwake /></div>
  const { actualToday, manual, position, nextStop, navigation, accommodation, finalStop } = model
  const focusLabel = !actualToday ? '預覽焦點' : manual ? '手動焦點' : '目前（按計劃時間）'
  const activityStop = (item: TimelineItem | null) => model.activities.find((entry) => entry.item.id === item?.id)?.stop
  const planItem = position.current && timelineStartInstant(position.current, day.date, snapshot.trip.timezone) !== undefined ? position.current : position.next
  const planInstant = planItem ? timelineStartInstant(planItem, day.date, snapshot.trip.timezone) : undefined
  const end = position.index >= 0 && !position.next && day.timeline.length > 0
  function move(direction: number) {
    const index = Math.max(0, Math.min(day!.timeline.length - 1, position.index + direction))
    if (day!.timeline[index]) focusItem(day!.id, day!.timeline[index].id)
  }
  return <div className="today-page" data-testid="today-mode" data-selected-day={day.id} data-progress-mode={!actualToday ? 'preview' : manual ? 'manual' : 'auto'}>
    <section className="today-card today-intro"><div><PageHeading title="今日模式" description="隨手查閱計劃、導航與重要時間。" /><p className="today-mode-label" aria-live="polite">{!actualToday ? `預覽模式${manual ? ' · 手動進度' : ''}` : manual ? '手動進度' : '今日 · 按時間自動'}</p></div>{clock}
      {!actualToday && <p className="today-preview-note">正在預覽所選行程日；焦點不代表目前實際活動，不使用今日時鐘推算此日進度。</p>}
    </section>
    <ContentNavigation label="今日模式行程日期">{days.map((entry) => <button key={entry.id} className="itinerary-action" aria-pressed={entry.id === day.id} onClick={() => selectDay(entry.id)} title={entry.title}>D{entry.dayNumber}{isOperationalDay(snapshot, entry, now) && ' · 今日'}</button>)}</ContentNavigation>
    <section className="today-card today-day-summary"><p className="today-kicker">D{day.dayNumber} · <time dateTime={day.date}>{formatTripDate(day.date)}</time></p><h2>{day.title}</h2><p>{day.routeSummary}</p>
      {day.highlights.length > 0 && <ul className="today-highlights">{day.highlights.map((highlight, i) => <li key={i}>✦ {highlight}</li>)}</ul>}
      {day.warnings.map((warning, i) => <p className="content-warning" key={`warning-${i}`}>⚠ 注意：{warning}</p>)}{day.constraints.map((constraint, i) => <p className="content-warning" key={`constraint-${i}`}>⚑ 限制：{constraint}</p>)}
    </section>
    {model.driving && <p className="today-driving">駕駛期間請由乘客操作；司機要操作手機請先安全停車。</p>}
    <section className="today-card today-progress" aria-label="行程進度">
      <div className="today-position"><div className="today-current"><Activity item={position.current} stop={activityStop(position.current)} label={focusLabel} /></div><div className="today-neighbours"><Activity item={position.previous} stop={activityStop(position.previous)} label="上一項" /><Activity item={position.next} stop={activityStop(position.next)} label="下一項" /></div></div>
      {actualToday && planInstant !== undefined && <p className="today-delta">{plannedDelta(planInstant, positionTime)}</p>}
      {end && <p className="today-end" aria-live="polite">{actualToday ? '今日主要行程已到最後一項' : '此行程日已到最後一項'}</p>}
      <div className="today-controls" role="group" aria-label="行程進度控制">
        <button className="itinerary-action" disabled={position.index <= 0} onClick={() => move(-1)}>← 上一項</button>
        <button className="itinerary-action" aria-pressed={actualToday && !manual} disabled={!actualToday} onClick={() => focusItem(day.id, null)}>按時間自動</button>
        <button className="itinerary-action today-advance" disabled={!day.timeline.length || position.index >= day.timeline.length - 1} onClick={() => move(1)}>已到達／下一項 →</button>
      </div><p className="today-note">按計劃時間顯示，並非 GPS 定位或自動到達偵測。手動焦點只儲存於此裝置的瀏覽器工作階段。</p>
    </section>
    <div className="today-operational-grid">
      {(nextStop || navigation) && <section className="today-card today-next-stop" aria-label={nextStop ? '主要導航目的地' : '泊車／入口等導航補充'}>
        {nextStop && <>
          <p className="today-kicker">{!actualToday ? '預覽行程主要目的地' : nextStop.item.id === position.current?.id ? '目前計劃目的地' : '後續計劃目的地'}</p>
          <p className="today-planned-time">{timelineTimeLabel(nextStop.item, 'start')}</p><h2>{nextStop.name}</h2>{nextStop.localName && <p className="entity-native-name" data-testid="native-name">{nextStop.localName}</p>}<p>{nextStop.item.title}</p>
          {(nextStop.item.optional || nextStop.item.bonus) && <p className="today-tag">可選{nextStop.item.bonus && '／Bonus'}</p>}
          <ExternalLink href={nextStop.maps} label={`Google Maps：主要目的地 ${nextStop.name}`}>↗ 開啟 Google Maps</ExternalLink>
          <p className="today-note">Maps 為外部操作；離線可用程度視乎裝置、網絡及離線地圖設定。</p>
        </>}
        {navigation && <div className="today-navigation"><h2>泊車／入口等導航補充</h2>
          <p className="today-kicker">{navigationTypes[navigation.type]}</p><h3>{navigation.title}</h3><NativeName entity={navigation} />
          {navigation.description && <p>{navigation.description}</p>}{navigation.warning && <p className="content-warning">⚠ 注意：{navigation.warning}</p>}
          {navigation.id !== nextStop?.target?.id && <MapsAction entity={navigation} name={navigation.title} />}
        </div>}
      </section>}
      <TodayWeather day={day} actualToday={actualToday} now={now.getTime()} />
      {(accommodation || finalStop) && <section className="today-card today-final" aria-label="住宿及終點"><h2>{accommodation ? (actualToday ? '今日住宿／終點' : '所選日住宿／終點') : (actualToday ? '今日終點' : '所選日終點')}</h2><h3>{accommodation?.name ?? finalStop?.name}</h3>{accommodation ? <NativeName entity={accommodation} /> : finalStop?.localName && <p className="entity-native-name" data-testid="native-name">{finalStop.localName}</p>}
        {accommodation ? <>{accommodation.checkIn && <p>入住時間：{accommodation.checkIn}</p>}{accommodation.address && <p>{accommodation.address}</p>}<MapsAction entity={accommodation} name={accommodation.name} /></> : finalStop && <MapsAction entity={{ mapURL: finalStop.maps }} name={finalStop.name} />}
      </section>}
    </div>
    {model.hardCuts.length > 0 && <section className="today-card today-hard-cuts" aria-label="行程日 Hard Cut"><h2>重要 Hard Cut</h2>{model.hardCuts.map(({ cut, instant }) => {
      const delta = instant === undefined ? undefined : (instant - minute * 60000) / 60000
      return <article key={cut.id} className={`today-hard-cut severity-${cut.severity}`} data-cut-id={cut.id}><p className="today-kicker">⏰ {hardCutTime(cut, snapshot.trip.timezone)} · {severityLabels[cut.severity]}</p><h3>{cut.title}</h3><p>{cut.description}</p>
        {actualToday && delta !== undefined && <p className="today-cut-state">{delta < 0 ? '原定時間已過' : delta <= 30 ? '即將到達' : '尚未到'}</p>}
      </article>
    })}</section>}
    <section className="today-card today-activities" aria-label="當日活動"><h2>當日活動</h2>{model.activities.length ? <ol>{model.activities.map(({ item, stop }) => {
      const label = item.id === position.current?.id ? focusLabel : item.id === position.next?.id ? '下一項' : item.id === position.previous?.id ? '上一項' : undefined
      return <li key={item.id} data-item-id={item.id} data-exact-timing={timelineTiming(item) ? true : undefined} data-position={label ?? ''} aria-current={item.id === position.current?.id ? 'step' : undefined}>
        <div className="today-row-time">{timelineTimeLabel(item, 'start')}{timelineTimeLabel(item, 'end') && <span> – {timelineTimeLabel(item, 'end')}</span>}</div><div><h3>{item.title}</h3><p className="today-item-type">{timelineTypes[item.type].icon} {timelineTypes[item.type].label}{label && <span className="today-tag">{label}</span>}{item.optional && <span className="today-tag">可選</span>}{item.bonus && <span className="today-tag">Bonus</span>}</p>{item.warning && <p className="content-warning">⚠ 注意：{item.warning}</p>}{stop && <MapsAction entity={{ mapURL: stop.maps }} name={stop.name} />}</div>
      </li>
    })}</ol> : <p>此行程日未有活動。</p>}</section>
    <ScreenAwake />
  </div>
}
