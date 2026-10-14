function escape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function utcStamp(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid calendar date')
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

// RFC 5545 lines are limited in UTF-8 bytes, not JS characters (BG uses 2).
function fold(line) {
  const encoder = new TextEncoder()
  const pieces = []
  let current = ''
  for (const char of line) {
    if (encoder.encode(current + char).length > 74) { pieces.push(current); current = ' ' }
    current += char
  }
  pieces.push(current)
  return pieces.join('\r\n')
}

export function bookingCalendarFile({ appointment, businessName, serviceName, staffName, address, locale = 'bg', now = new Date() }) {
  const en = locale === 'en'
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GoRez//Appointment//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${escape(appointment.id)}@gorez`, `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(appointment.starts_at)}`, `DTEND:${utcStamp(appointment.ends_at)}`,
    `SUMMARY:${escape(`${serviceName} · ${businessName}`)}`,
    `DESCRIPTION:${escape(`${en ? 'Specialist' : 'Специалист'}: ${staffName}\n${en ? 'Check your saved confirmation link for changes. This calendar file does not sync automatically.' : 'Проверявай запазения линк за промени. Този календарен файл не се обновява автоматично.'}`)}`,
    `LOCATION:${escape(address)}`, 'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR', '',
  ].map(fold).join('\r\n')
}
