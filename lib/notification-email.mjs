import { DateTime } from 'luxon'

export const ACTIVE_BOOKING_STATUSES = ['booked', 'confirmed']

// PostgreSQL jsonb can reorder object keys; preserve identical HTTP bytes on a
// retry so provider deduplication never depends on its JSON comparison rules.
export function serializeEmailPayload(payload) {
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value
  return JSON.stringify(canonical(payload))
}

export function escapeEmailHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])
}

export function notificationIsCurrent(row, appointment, now = Date.now()) {
  if (!appointment || !appointment.business?.active || !appointment.business.email_notifications_enabled || !appointment.email_notifications_requested) return false
  if (row.business_id !== appointment.business_id || row.appointment_revision !== appointment.notification_revision) return false
  const cancelled = row.kind === 'booking_cancelled'
  if (cancelled ? appointment.status !== 'cancelled' : !ACTIVE_BOOKING_STATUSES.includes(appointment.status)) return false
  if (!cancelled && Date.parse(appointment.starts_at) <= now) return false
  const recipient = row.kind === 'owner_new_booking' ? appointment.business.contact_email : appointment.customer?.email
  if (!recipient || recipient.trim().toLowerCase() !== row.recipient.trim().toLowerCase()) return false
  if (row.kind === 'booking_reminder') {
    if (!appointment.email_reminders_requested || Date.parse(appointment.starts_at) - now > 24 * 3600000) return false
  } else if (Date.parse(row.created_at) < now - 6 * 3600000) return false
  // The provider forgets idempotency keys after 24h: stop ambiguous retries first.
  return !row.first_attempt_at || Date.parse(row.first_attempt_at) > now - 23 * 3600000
}

export function buildNotificationEmail(row, appointment, { origin, from, test = false }) {
  const locale = row.locale === 'en' ? 'en' : 'bg'
  const en = locale === 'en'
  const business = appointment.business
  const date = DateTime.fromISO(appointment.starts_at).setZone(business.timezone || 'Europe/Sofia').setLocale(locale)
  const end = DateTime.fromISO(appointment.ends_at).setZone(business.timezone || 'Europe/Sofia')
  if (!date.isValid || !end.isValid) throw new Error('INVALID_APPOINTMENT_TIME')
  const site = new URL(origin)
  if (site.protocol !== 'https:' && !(site.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(site.hostname))) throw new Error('INVALID_EMAIL_ORIGIN')
  const manage = new URL(`/booking/${encodeURIComponent(appointment.cancellation_token)}`, site.origin)
  manage.searchParams.set('lang', locale)
  const h = escapeEmailHtml
  const labels = en ? { date: 'Date', time: 'Time', service: 'Service', staff: 'Specialist', business: 'Business', address: 'Address', client: 'Client', phone: 'Phone', manage: 'View or manage booking' } : { date: 'Дата', time: 'Час', service: 'Услуга', staff: 'Специалист', business: 'Бизнес', address: 'Адрес', client: 'Клиент', phone: 'Телефон', manage: 'Преглед и управление' }
  const titles = {
    booking_confirmation: en ? 'Your booking is confirmed' : 'Резервацията е потвърдена',
    booking_reminder: en ? 'Your appointment is coming up' : 'Напомняне за предстоящ час',
    booking_cancelled: en ? 'Your booking has been cancelled' : 'Резервацията е отменена',
    booking_rescheduled: en ? 'Your appointment has been rescheduled' : 'Часът е преместен',
    owner_new_booking: en ? 'New booking' : 'Нова резервация',
  }
  if (!titles[row.kind]) throw new Error('INVALID_EMAIL_KIND')
  const title = `${test ? '[TEST] ' : ''}${titles[row.kind]}`
  const owner = row.kind === 'owner_new_booking'
  const entries = [
    [labels.business, business.name], [labels.service, appointment.service?.name],
    [labels.date, date.toFormat('cccc, d LLLL yyyy')], [labels.time, `${date.toFormat('HH:mm')}–${end.toFormat('HH:mm')} (${date.zoneName})`],
    [labels.staff, appointment.staff?.name], ...(business.address ? [[labels.address, business.address]] : []),
    ...(owner ? [[labels.client, appointment.customer?.name], [labels.phone, appointment.customer?.phone]] : []),
  ]
  const intro = test ? (en ? 'GoRez delivery test only. No real appointment was created. All details below are fictional.' : 'Само тест на имейл доставката на GoRez. Няма създадена реална резервация. Данните по-долу са примерни.') : row.kind === 'booking_reminder' ? (en ? 'A reminder of your upcoming appointment.' : 'Напомняме ти за предстоящото посещение.')
    : row.kind === 'booking_rescheduled' ? (en ? 'The business has changed your appointment. The new details are below.' : 'Бизнесът промени часа ти. Новите данни са по-долу.')
      : row.kind === 'booking_cancelled' ? (en ? 'This appointment is cancelled. No further reminder will be sent for this time.' : 'Този час е отменен. Няма да бъде изпратено следващо напомняне за него.')
        : owner ? (en ? 'A client has booked an appointment.' : 'Клиент запази час.') : (en ? 'Thank you for booking. Your appointment details are below.' : 'Благодарим за резервацията. Данните за посещението са по-долу.')
  const target = test ? new URL(`/?lang=${locale}`, site.origin).href : owner ? new URL(`/dashboard/appointments?lang=${locale}`, site.origin).href : manage.href
  const button = test ? (en ? 'Open GoRez' : 'Отвори GoRez') : owner ? (en ? 'Open booking calendar' : 'Отвори календара') : labels.manage
  const footer = owner ? (en ? 'Automatic business notification from GoRez. Sign in to your booking calendar to manage the appointment.' : 'Автоматично известие към бизнеса от GoRez. Влез в календара си, за да управляваш резервацията.') : (en ? 'Automatic appointment message from GoRez. Keep your booking link private. If you did not make this booking, contact the business.' : 'Автоматично съобщение за резервация от GoRez. Пази личния линк. Ако не си направил тази резервация, свържи се с бизнеса.')
  const text = `${title}\n\n${intro}\n\n${entries.map(([key, value]) => `${key}: ${value || '—'}`).join('\n')}\n\n${button}: ${target}\n\n${footer}`
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#f4f6f0;font-family:Arial,sans-serif;color:#122019"><div style="max-width:620px;margin:auto;padding:28px 16px"><div style="background:#173e2a;color:#fff;border-radius:20px 20px 0 0;padding:24px 28px;font-size:22px;font-weight:bold">GoRez</div><div style="background:#fff;border:1px solid #dde4dc;border-radius:0 0 20px 20px;padding:28px"><h1 style="font-size:26px;margin-top:0">${h(title)}</h1><p>${h(intro)}</p><table role="presentation" style="width:100%;border-collapse:collapse;margin:24px 0">${entries.map(([key, value]) => `<tr><td style="padding:8px 12px 8px 0;color:#59685c;vertical-align:top">${h(key)}</td><td style="padding:8px 0;font-weight:bold">${h(value || '—')}</td></tr>`).join('')}</table><a href="${h(target)}" style="display:inline-block;background:#173e2a;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:bold">${h(button)}</a><p style="margin-top:28px;font-size:12px;color:#59685c;line-height:1.6">${h(footer)}</p></div></div></body></html>`
  return { from, to: [row.recipient], subject: `${title} · ${business.name}`.replace(/[\r\n]/g, ' ').slice(0, 240), html, text,
    ...(business.contact_email ? { reply_to: business.contact_email } : {}),
  }
}
