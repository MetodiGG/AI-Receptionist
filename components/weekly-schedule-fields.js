'use client'

export function WeeklyScheduleFields({ days, onChange, locale = 'bg', disabled = false }) {
  const en = locale === 'en'
  const update = (index, patch) => onChange(days.map((day, position) => position === index ? { ...day, ...patch } : day))
  return <div className="weekly-schedule-fields">
    <p className="helper-text">{en ? 'Breaks repeat every week for the selected working days. A service must fit completely outside the break.' : 'Почивките се повтарят всяка седмица в избраните работни дни. Цялата услуга трябва да се побира извън почивката.'}</p>
    {days.map((day, index) => <fieldset className={`weekly-day ${day.enabled ? '' : 'day-closed'}`} key={day.weekday} disabled={disabled}>
      <legend>{day.label}</legend>
      <div className="weekly-day-hours"><label className="schedule-check"><input type="checkbox" checked={day.enabled} onChange={(event) => update(index, { enabled: event.target.checked })} />{en ? 'Working day' : 'Работен ден'}</label><label><span>{en ? 'Opens' : 'Отваря'}</span><input type="time" required={day.enabled} disabled={!day.enabled} value={day.open} onChange={(event) => update(index, { open: event.target.value })} /></label><span className="time-separator">—</span><label><span>{en ? 'Closes' : 'Затваря'}</span><input type="time" required={day.enabled} disabled={!day.enabled} value={day.close} onChange={(event) => update(index, { close: event.target.value })} /></label></div>
      {day.enabled && <div className="weekly-day-break"><label className="schedule-check"><input type="checkbox" checked={Boolean(day.breakEnabled)} onChange={(event) => update(index, { breakEnabled: event.target.checked })} />{en ? 'Recurring break' : 'Повтаряща се почивка'}</label>{day.breakEnabled && <><label><span>{en ? 'Break starts' : 'Почивка от'}</span><input type="time" required value={day.breakStart || '12:00'} onChange={(event) => update(index, { breakStart: event.target.value })} /></label><span className="time-separator">—</span><label><span>{en ? 'Break ends' : 'Почивка до'}</span><input type="time" required value={day.breakEnd || '13:00'} onChange={(event) => update(index, { breakEnd: event.target.value })} /></label></>}</div>}
    </fieldset>)}
  </div>
}
