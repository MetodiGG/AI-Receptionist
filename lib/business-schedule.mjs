export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240]

export function validDuration(value) {
  const minutes = Number(value)
  return Number.isInteger(minutes) && minutes >= 5 && minutes <= 1440
}

const validTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)

export function scheduleProblem(days) {
  for (const day of days.filter((item) => item.enabled)) {
    if (!validTime(day.open) || !validTime(day.close) || day.close <= day.open) return { weekday: day.weekday, kind: 'hours' }
    if (day.breakEnabled && (!validTime(day.breakStart) || !validTime(day.breakEnd) || day.breakStart < day.open || day.breakEnd > day.close || day.breakEnd <= day.breakStart || (day.breakStart === day.open && day.breakEnd === day.close))) return { weekday: day.weekday, kind: 'break' }
  }
  return null
}

export function scheduleRows(days) {
  if (scheduleProblem(days)) throw new Error('Invalid weekly schedule')
  return days.filter((day) => day.enabled).map((day) => ({
    weekday: day.weekday, open_time: day.open, close_time: day.close,
    break_start: day.breakEnabled ? day.breakStart : null,
    break_end: day.breakEnabled ? day.breakEnd : null,
  }))
}

export function scheduleFromHours(week, hours, staffId) {
  return week.map(([weekday, label]) => {
    const row = hours.find((item) => item.staff_id === staffId && item.weekday === weekday)
    return { weekday, label, enabled: Boolean(row), open: row?.open_time?.slice(0, 5) || '09:00', close: row?.close_time?.slice(0, 5) || '18:00', breakEnabled: Boolean(row?.break_start && row?.break_end), breakStart: row?.break_start?.slice(0, 5) || '12:00', breakEnd: row?.break_end?.slice(0, 5) || '13:00' }
  })
}

export function scheduleErrorText(problem, locale = 'bg') {
  if (!problem) return ''
  if (problem.kind === 'break') return locale === 'en' ? 'The break must be within working hours, with its end after its start, and leave some working time.' : 'Почивката трябва да е в рамките на работното време, с край след началото, и да оставя време за работа.'
  return locale === 'en' ? 'Enter valid opening and closing times. Closing must be after opening.' : 'Въведи валиден начален и краен час. Краят трябва да е след началото.'
}

export function scheduleWriteError(error, locale = 'bg') {
  if (error?.message?.includes('SCHEDULE_UNAVAILABLE')) return locale === 'en' ? 'This time no longer fits the service, working hours or breaks. Refresh the calendar and choose another time.' : 'Този час вече не съответства на услугата, работното време или почивките. Обнови календара и избери друг час.'
  if (error?.code === '23P01' || error?.message?.includes('SCHEDULE_CONFLICT')) return locale === 'en' ? 'There is an existing booking in this period. Move or cancel it before blocking the time. No bookings have been changed.' : 'В този период има съществуваща резервация. Първо я премести или отмени, след това блокирай времето. Резервациите не са променени.'
  return error?.message || (locale === 'en' ? 'We could not save the schedule.' : 'Не успяхме да запазим графика.')
}
