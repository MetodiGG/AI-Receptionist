'use client'

import Link from 'next/link'
import { DateTime } from 'luxon'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BrandLogo } from '../../../components/brand-logo'
import { HomeLink } from '../../../components/home-link'
import { Icon } from '../../../components/icon'
import { LanguageSwitch } from '../../../components/language-switch'
import { usePublicLocale } from '../../../hooks/use-public-locale'
import { BookingConfirmationActions } from '../../../components/booking-confirmation-actions'
import { bookingStatusLabel } from '../../../lib/booking-safety.mjs'
import { localizedApiMessage } from '../../../lib/localized-api-message.mjs'

export default function ManageBookingPage() {
  const { token } = useParams()
  const { locale, setLocale } = usePublicLocale()
  const en = locale === 'en'
  const [appointment, setAppointment] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/public/appointments/${token}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(localizedApiMessage(result.error, locale))
        if (!controller.signal.aborted) { setAppointment(result.appointment); setStatus('ready') }
      })
      .catch((requestError) => { if (!controller.signal.aborted) { setError(requestError.message); setStatus('error') } })
    return () => controller.abort()
  }, [en, token])

  async function cancelBooking() {
    if (cancelling || !window.confirm(en ? 'Are you sure you want to cancel this booking?' : 'Сигурни ли сте, че искате да отмените резервацията?')) return
    setCancelling(true); setError('')
    try {
      const response = await fetch(`/api/public/appointments/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(localizedApiMessage(result.error, locale))
      setAppointment(result.appointment)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCancelling(false)
    }
  }

  if (status === 'loading') return <main className="booking-state-page"><div className="state-home-navigation"><HomeLink locale={locale}/></div><span className="button-spinner" /><p>{en ? 'Loading booking...' : 'Зареждаме резервацията...'}</p></main>
  if (status === 'error') return <main className="booking-state-page"><div className="state-home-navigation"><HomeLink locale={locale}/></div><LanguageSwitch locale={locale} onChange={setLocale} compact /><span className="booking-logo-mark">!</span><h1>{en ? 'Booking not found' : 'Не открихме резервацията'}</h1><p>{error}</p></main>

  const starts = DateTime.fromISO(appointment.starts_at).setZone(appointment.business.timezone).setLocale(locale)
  const activeBooking = ['booked', 'confirmed'].includes(appointment.status)
  const canCancel = activeBooking && DateTime.now() < starts.minus({ hours: appointment.business.cancellation_notice_hours ?? 0 })

  return (
    <main className="manage-booking-page">
      <section className="manage-booking-card">
        <div className="manage-booking-head home-navigation-header"><div className="booking-brand"><BrandLogo compact decorative eager /><span className="booking-business-name"><small>GoRez</small><strong>{appointment.business.name}</strong></span></div><div className="home-header-actions"><LanguageSwitch locale={locale} onChange={setLocale} compact /></div><HomeLink locale={locale}/></div>
        <div className={`manage-status ${['cancelled', 'no_show'].includes(appointment.status) ? 'cancelled' : ''}`}><span>{['cancelled', 'no_show'].includes(appointment.status) ? '×' : '✓'}</span><div><small>{en ? 'Status' : 'Статус'}</small><strong>{bookingStatusLabel(appointment.status, locale)}</strong></div></div>
        <h1>{appointment.service.name}</h1>
        <div className="manage-details">
          <div><small>{en ? 'Date' : 'Дата'}</small><strong>{starts.toFormat('cccc, d LLLL yyyy')}</strong></div>
          <div><small>{en ? 'Time' : 'Час'}</small><strong>{starts.toFormat('HH:mm')}–{DateTime.fromISO(appointment.ends_at).setZone(appointment.business.timezone).toFormat('HH:mm')}</strong></div>
          <div><small>{en ? 'Specialist' : 'Специалист'}</small><strong>{appointment.staff.name}</strong></div>
          <div><small>{en ? 'Client' : 'Клиент'}</small><strong>{appointment.customer.name}</strong></div>
        </div>
        {appointment.notes && <details className="appointment-notes manage-appointment-notes"><summary>{en ? 'Appointment details' : 'Детайли за посещението'}</summary><p>{appointment.notes}</p></details>}
        {appointment.business.address && <p className="manage-address">⌖ {appointment.business.address}</p>}
        {error && <p className="booking-inline-error" role="alert">{error}</p>}
        {activeBooking && !canCancel && <p className="booking-privacy">{en ? 'The online cancellation deadline has passed. Contact the business directly.' : 'Срокът за онлайн отказ е изтекъл. Свържи се директно с бизнеса.'}</p>}
        {canCancel && <button className="cancel-booking-button" type="button" disabled={cancelling} onClick={cancelBooking}>{cancelling ? (en ? 'Cancelling...' : 'Отменяне...') : (en ? 'Cancel booking' : 'Отмени резервацията')}</button>}
        {appointment.business.phone && <a className="booking-primary manage-contact-button" href={`tel:${appointment.business.phone}`}><Icon name="phone" /> {en ? 'Call' : 'Обади се на'} {appointment.business.phone}</a>}
        <Link className="manage-back-link" href={`/book/${appointment.business.slug}?lang=${locale}`}>← {en ? 'Back to booking page' : 'Към страницата за резервации'}</Link>
        <BookingConfirmationActions appointment={appointment} business={appointment.business} service={appointment.service} staff={appointment.staff} locale={locale} />
        <Link className="manage-back-link" href={`/?lang=${locale}`}>{en ? 'GoRez homepage' : 'Начало на GoRez'}</Link>
      </section>
    </main>
  )
}
