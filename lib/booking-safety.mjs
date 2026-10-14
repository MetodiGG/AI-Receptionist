// Public responses must never contain a CRM record or its internal notes.
export function toPublicBooking({ appointment, service, staff }) {
  return {
    appointment: {
      id: appointment.id,
      starts_at: appointment.starts_at,
      ends_at: appointment.ends_at,
      status: appointment.status,
      cancellation_token: appointment.cancellation_token,
    },
    service,
    staff,
  }
}

export function sameCustomerContact(customer, contact) {
  return customer.name === contact.name && customer.phone === contact.phone
    && (customer.email || '') === (contact.email || '')
}

// A timestamp alone is not unique: several specialists can be free at 10:00.
export function bookingSlotKey(slot) {
  return `${slot.staffId}|${slot.startsAt}`
}

export function emailDeliveryEnabled(env) {
  return env.EMAIL_NOTIFICATIONS_ENABLED === 'true' && Boolean(env.RESEND_API_KEY && env.EMAIL_FROM)
}

export const PRIVATE_RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
}

export function bookingStatusLabel(status, locale = 'bg') {
  const labels = {
    booked: { bg: 'Резервацията е активна', en: 'Booking active' },
    confirmed: { bg: 'Резервацията е потвърдена', en: 'Booking confirmed' },
    cancelled: { bg: 'Резервацията е отменена', en: 'Booking cancelled' },
    done: { bg: 'Посещението е завършено', en: 'Appointment completed' },
    no_show: { bg: 'Отбелязано неявяване', en: 'Marked as no-show' },
  }
  return (labels[status] || labels.booked)[locale === 'en' ? 'en' : 'bg']
}
