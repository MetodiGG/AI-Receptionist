import { DateTime } from 'luxon'

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB
}

export function buildAvailableSlots({
  date,
  zone,
  durationMinutes,
  slotMinutes,
  minimumNoticeMinutes,
  now,
  staff,
  workingHours,
  appointments,
  timeOff,
}) {
  const requestedDay = DateTime.fromISO(date, { zone }).startOf('day')
  const nowWithNotice = (now ? DateTime.fromISO(now) : DateTime.now()).setZone(zone).plus({ minutes: minimumNoticeMinutes || 0 })
  const slots = []

  for (const person of staff) {
    const periods = workingHours.filter((period) => period.staff_id === person.id && period.weekday === requestedDay.weekday)
    const busyRanges = appointments.filter((item) => item.staff_id === person.id)
    const timeOffRanges = timeOff.filter((item) => item.staff_id === null || item.staff_id === person.id)

    for (const period of periods) {
      let cursor = DateTime.fromISO(`${date}T${period.open_time}`, { zone })
      const closesAt = DateTime.fromISO(`${date}T${period.close_time}`, { zone })

      while (cursor.plus({ minutes: durationMinutes }) <= closesAt) {
        const endsAt = cursor.plus({ minutes: durationMinutes })
        const isBusy = [...busyRanges, ...timeOffRanges].some((range) => rangesOverlap(
          cursor.toMillis(),
          endsAt.toMillis(),
          DateTime.fromISO(range.starts_at).toMillis(),
          DateTime.fromISO(range.ends_at).toMillis(),
        ))

        if (cursor >= nowWithNotice && !isBusy) {
          slots.push({
            startsAt: cursor.toUTC().toISO(),
            endsAt: endsAt.toUTC().toISO(),
            localTime: cursor.toFormat('HH:mm'),
            staffId: person.id,
            staffName: person.name,
          })
        }

        cursor = cursor.plus({ minutes: slotMinutes })
      }
    }
  }

  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.staffName.localeCompare(b.staffName))
}
