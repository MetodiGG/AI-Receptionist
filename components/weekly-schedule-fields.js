'use client'

import { TimeSelect } from './time-select'
import { canCopyMondaySchedule, copyMondayScheduleToWeekdays } from '../lib/weekday-hours-copy.mjs'

export function WeeklyScheduleFields({ days, onChange, locale = 'bg', disabled = false }) {
  const en = locale === 'en'
  const canCopy = canCopyMondaySchedule(days)
  const update = (index, patch) => onChange(days.map((day, position) => position === index ? { ...day, ...patch } : day))
  const copyWeekdays = () => { if (!disabled && canCopy) onChange(copyMondayScheduleToWeekdays(days)) }
  return <div className="weekly-schedule-fields">
    <p className="helper-text">{en ? 'Breaks repeat every week for the selected working days. A service must fit completely outside the break.' : 'Почивките се повтарят всяка седмица в избраните работни дни. Цялата услуга трябва да се побира извън почивката.'}</p>
    {days.map((day, index) => <fieldset className={`weekly-day ${day.enabled ? '' : 'day-closed'}`} key={day.weekday} disabled={disabled}>
      <legend>{day.label}</legend>
      <div className="weekly-day-hours"><label className="schedule-check"><input type="checkbox" checked={day.enabled} onChange={(event) => update(index, { enabled: event.target.checked })} />{en ? 'Working day' : 'Работен ден'}</label><label><span>{en ? 'Opens' : 'Отваря'}</span><TimeSelect required={day.enabled} disabled={!day.enabled} value={day.open} onChange={(event) => update(index, { open: event.target.value })} /></label><span className="time-separator">—</span><label><span>{en ? 'Closes' : 'Затваря'}</span><TimeSelect required={day.enabled} disabled={!day.enabled} value={day.close} onChange={(event) => update(index, { close: event.target.value })} /></label></div>
      {day.enabled && <div className="weekly-day-break"><label className="schedule-check"><input type="checkbox" checked={Boolean(day.breakEnabled)} onChange={(event) => update(index, { breakEnabled: event.target.checked })} />{en ? 'Recurring break' : 'Повтаряща се почивка'}</label>{day.breakEnabled && <><label><span>{en ? 'Break starts' : 'Почивка от'}</span><TimeSelect required value={day.breakStart || '12:00'} onChange={(event) => update(index, { breakStart: event.target.value })} /></label><span className="time-separator">—</span><label><span>{en ? 'Break ends' : 'Почивка до'}</span><TimeSelect required value={day.breakEnd || '13:00'} onChange={(event) => update(index, { breakEnd: event.target.value })} /></label></>}</div>}
      {day.weekday === 1 && <div className="schedule-copy-actions"><button type="button" className="schedule-copy-weekdays" disabled={disabled || !canCopy} aria-label={en ? 'Apply Monday hours and breaks to Monday–Friday' : 'Приложи часовете и почивките от понеделник за понеделник–петък'} onClick={copyWeekdays}>{en ? 'Apply to Mon–Fri' : 'Повтаря се - Пон/Петък'}</button></div>}
    </fieldset>)}
  </div>
}
