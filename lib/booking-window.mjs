export const PUBLIC_BOOKING_WINDOW_DAYS = 14

export function resolveVisibleBookingDays(configuredDays) {
  const parsed = Number(configuredDays)
  if (!Number.isFinite(parsed) || parsed < 1) return PUBLIC_BOOKING_WINDOW_DAYS
  return Math.min(Math.floor(parsed), PUBLIC_BOOKING_WINDOW_DAYS)
}

export function groupSlotsByPeriod(slots = []) {
  const periods = [
    { key: 'morning', label: 'Сутрин', range: 'до 11:59', slots: [] },
    { key: 'afternoon', label: 'Следобед', range: '12:00 – 16:59', slots: [] },
    { key: 'evening', label: 'Вечер', range: 'след 17:00', slots: [] },
  ]

  slots.forEach((slot) => {
    const hour = Number(String(slot.localTime || '').split(':')[0])
    const period = hour < 12 ? periods[0] : hour < 17 ? periods[1] : periods[2]
    period.slots.push(slot)
  })

  return periods.filter((period) => period.slots.length)
}
