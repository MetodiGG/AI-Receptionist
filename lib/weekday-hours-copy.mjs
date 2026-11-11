import { scheduleProblem } from './business-schedule.mjs'
import { emptyOpeningHours, openingHoursSchema } from './booking-mode.mjs'

const completeWeek = days => Array.isArray(days) && days.length === 7
  && days.every(day => Number.isInteger(day?.weekday) && day.weekday >= 1 && day.weekday <= 7)
  && new Set(days.map(day => day.weekday)).size === 7

export function canCopyMondaySchedule(days) {
  if (!completeWeek(days)) return false
  const monday = days.find(day => day.weekday === 1)
  return monday.enabled === true && !scheduleProblem([monday])
}

// The existing Save action remains responsible for persistence. Copy only the
// actual Monday schedule fields, preserving day identity, labels and weekends.
export function copyMondayScheduleToWeekdays(days) {
  if (!canCopyMondaySchedule(days)) return days
  const { enabled, open, close, breakEnabled, breakStart, breakEnd } = days.find(day => day.weekday === 1)
  return days.map(day => day.weekday >= 2 && day.weekday <= 5
    ? { ...day, enabled, open, close, breakEnabled: Boolean(breakEnabled), breakStart, breakEnd }
    : day)
}

export function canCopyMondayOpeningHours(days) {
  if (!completeWeek(days)) return false
  const monday = days.find(day => day.weekday === 1)
  if (!Array.isArray(monday.periods) || !monday.periods.length) return false
  // Validate only the source. Copying can fix an incomplete Tuesday-Friday;
  // unrelated draft errors on those days must not block this explicit action.
  return openingHoursSchema.safeParse(emptyOpeningHours().map(day => day.weekday === 1 ? { weekday: 1, periods: monday.periods } : day)).success
}

export function copyMondayOpeningHoursToWeekdays(days) {
  if (!canCopyMondayOpeningHours(days)) return days
  const monday = days.find(day => day.weekday === 1)
  return days.map(day => day.weekday >= 2 && day.weekday <= 5
    ? { ...day, periods: monday.periods.map(period => ({ ...period })) }
    : day)
}
