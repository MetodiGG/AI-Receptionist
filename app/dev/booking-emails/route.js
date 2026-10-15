import { buildNotificationEmail } from '../../../lib/notification-email.mjs'

// Development-only rendering fixture. No database, mailbox or provider calls.
export async function GET(request) {
  if (process.env.NODE_ENV !== 'development') return new Response('Not found', { status: 404 })
  const query = new URL(request.url).searchParams
  const kind = ['booking_confirmation', 'booking_reminder', 'booking_cancelled', 'booking_rescheduled', 'owner_new_booking'].includes(query.get('kind')) ? query.get('kind') : 'booking_confirmation'
  const locale = query.get('lang') === 'en' ? 'en' : 'bg'
  const appointment = { starts_at: '2026-10-19T09:00:00Z', ends_at: '2026-10-19T09:45:00Z', cancellation_token: 'preview-only-not-a-real-booking', business: { name: 'MG Barbershop', timezone: 'Europe/Sofia', address: 'София / Sofia', contact_email: 'owner@example.com' }, customer: { name: 'Alex', phone: '0000000000' }, service: { name: locale === 'en' ? 'Haircut' : 'Подстригване' }, staff: { name: 'Alex' } }
  const email = buildNotificationEmail({ kind, locale, recipient: 'preview@example.com' }, appointment, { origin: 'https://www.gorez.co', from: 'GoRez <info@gorez.co>' })
  return new Response(email.html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" } })
}
