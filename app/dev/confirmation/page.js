import { notFound } from 'next/navigation'
import { BookingConfirmationActions } from '../../../components/booking-confirmation-actions'

export default function ConfirmationFixture() {
  if (process.env.NODE_ENV === 'production') notFound()
  const appointment = { id: '00000000-0000-4000-8000-000000000001', cancellation_token: '00000000-0000-4000-8000-000000000002', starts_at: '2026-10-20T09:00:00Z', ends_at: '2026-10-20T09:30:00Z', status: 'booked' }
  return <main className="manage-booking-page"><section className="manage-booking-card">
    <p className="auth-kicker">Local QA only — fictional appointment, no database writes</p>
    <div className="manage-status"><span>✓</span><strong>Booking confirmed</strong></div>
    <h1>QA appointment</h1>
    <div className="manage-details"><div><small>Date</small><strong>20 October 2026</strong></div><div><small>Time</small><strong>12:00</strong></div></div>
    <a className="booking-primary manage-contact-button" href="tel:0000000000">Call 0000000000</a>
    <BookingConfirmationActions appointment={appointment} business={{ name: 'QA business', address: 'QA location' }} service={{ name: 'QA appointment' }} staff={{ name: 'QA Alex' }} locale="en" />
  </section></main>
}
