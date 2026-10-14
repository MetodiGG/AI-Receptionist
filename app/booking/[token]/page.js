'use client'

import Link from 'next/link'
import { DateTime } from 'luxon'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BrandLogo } from '../../../components/brand-logo'
import { Icon } from '../../../components/icon'

export default function ManageBookingPage() {
  const { token } = useParams()
  const [appointment, setAppointment] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetch(`/api/public/appointments/${token}`)
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error?.message || 'Резервацията не е намерена.')
        setAppointment(result.appointment); setStatus('ready')
      })
      .catch((requestError) => { setError(requestError.message); setStatus('error') })
  }, [token])

  async function cancelBooking() {
    if (!window.confirm('Сигурни ли сте, че искате да отмените резервацията?')) return
    setCancelling(true); setError('')
    try {
      const response = await fetch(`/api/public/appointments/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message || 'Не успяхме да отменим резервацията.')
      setAppointment(result.appointment)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCancelling(false)
    }
  }

  if (status === 'loading') return <main className="booking-state-page"><span className="button-spinner" /><p>Зареждаме резервацията...</p></main>
  if (status === 'error') return <main className="booking-state-page"><span className="booking-logo-mark">!</span><h1>Не открихме резервацията</h1><p>{error}</p></main>

  const starts = DateTime.fromISO(appointment.starts_at).setZone(appointment.business.timezone).setLocale('bg')
  const canCancel = ['booked', 'confirmed'].includes(appointment.status)

  return (
    <main className="manage-booking-page">
      <section className="manage-booking-card">
        <div className="booking-brand"><BrandLogo compact decorative eager /><span className="booking-business-name"><small>GoRez</small><strong>{appointment.business.name}</strong></span></div>
        <div className={`manage-status ${appointment.status === 'cancelled' ? 'cancelled' : ''}`}><span>{appointment.status === 'cancelled' ? '×' : '✓'}</span><div><small>Статус</small><strong>{appointment.status === 'cancelled' ? 'Резервацията е отменена' : 'Резервацията е активна'}</strong></div></div>
        <h1>{appointment.service.name}</h1>
        <div className="manage-details">
          <div><small>Дата</small><strong>{starts.toFormat('cccc, d LLLL yyyy')}</strong></div>
          <div><small>Час</small><strong>{starts.toFormat('HH:mm')}</strong></div>
          <div><small>Специалист</small><strong>{appointment.staff.name}</strong></div>
          <div><small>Клиент</small><strong>{appointment.customer.name}</strong></div>
        </div>
        {appointment.business.address && <p className="manage-address">⌖ {appointment.business.address}</p>}
        {error && <p className="booking-inline-error" role="alert">{error}</p>}
        {canCancel && <button className="cancel-booking-button" type="button" disabled={cancelling} onClick={cancelBooking}>{cancelling ? 'Отменяне...' : 'Отмени резервацията'}</button>}
        {appointment.business.phone && <a className="booking-primary manage-contact-button" href={`tel:${appointment.business.phone}`}><Icon name="phone" /> Обади се на {appointment.business.phone}</a>}
        <Link className="manage-back-link" href={`/book/${appointment.business.slug}`}>← Към страницата за резервации</Link>
      </section>
    </main>
  )
}
