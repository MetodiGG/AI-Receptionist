export const PUBLIC_BOOKING_WINDOW_DAYS = 14

const BULGARIAN_MONTHS_SHORT = [
  'яну.', 'фев.', 'март', 'апр.', 'май', 'юни',
  'юли', 'авг.', 'сеп.', 'окт.', 'ное.', 'дек.',
]

export function resolveVisibleBookingDays(configuredDays) {
  const parsed = Number(configuredDays)
  if (!Number.isFinite(parsed) || parsed < 1) return PUBLIC_BOOKING_WINDOW_DAYS
  return Math.min(Math.floor(parsed), PUBLIC_BOOKING_WINDOW_DAYS)
}

export function formatBulgarianMonthShort(month) {
  return BULGARIAN_MONTHS_SHORT[Number(month) - 1] || ''
}

export function collapseSlotsByLocalTime(slots = []) {
  const uniqueSlots = new Map()
  slots.forEach((slot) => {
    if (!uniqueSlots.has(slot.localTime)) uniqueSlots.set(slot.localTime, slot)
  })
  return [...uniqueSlots.values()]
}

export function groupSlotsByPeriod(slots = [], locale = 'bg') {
  const en = locale === 'en'
  const periods = [
    { key: 'morning', label: en ? 'Morning' : 'Сутрин', range: en ? 'until 11:59' : 'до 11:59', slots: [] },
    { key: 'afternoon', label: en ? 'Afternoon' : 'Следобед', range: '12:00 – 16:59', slots: [] },
    { key: 'evening', label: en ? 'Evening' : 'Вечер', range: en ? 'from 17:00' : 'след 17:00', slots: [] },
  ]

  slots.forEach((slot) => {
    const hour = Number(String(slot.localTime || '').split(':')[0])
    const period = hour < 12 ? periods[0] : hour < 17 ? periods[1] : periods[2]
    period.slots.push(slot)
  })

  return periods.filter((period) => period.slots.length)
}
