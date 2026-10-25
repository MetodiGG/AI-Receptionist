'use client'

import { useState } from 'react'
import { DateTime } from 'luxon'
import { AppointmentCalendar } from '../../../components/appointment-calendar'
import { LanguageSwitch } from '../../../components/language-switch'
import { usePublicLocale } from '../../../hooks/use-public-locale'

const staff = [{ id: 'demo-staff-1', name: 'Alex' }, { id: 'demo-staff-2', name: 'Sam' }]

function createSampleAppointments() {
  const today = DateTime.now().setZone('Europe/Sofia').startOf('day')
  return [
    [0, 9, 0, 45, 0, 'Client A', 'Диагностика / Diagnostics', 'confirmed', 'Марка и модел / Make and model: VW Golf\nГодина / Year: 2018'],
    [0, 11, 0, 60, 0, 'Client B', 'Смяна на масло / Oil change', 'booked', 'Марка и модел / Make and model: Toyota Corolla'],
    [0, 10, 30, 45, 1, 'Client C', 'Диагностика / Diagnostics', 'booked', ''],
    [0, 14, 0, 30, 1, 'Client D', 'Преглед / Inspection', 'done', ''],
    [1, 12, 0, 60, 0, 'Client E', 'Преглед / Inspection', 'booked', ''],
    [2, 15, 0, 45, 1, 'Client F', 'Диагностика / Diagnostics', 'cancelled', ''],
  ].map(([offset, hour, minute, duration, person, name, service, status, notes], index) => {
    const starts = today.plus({ days: offset }).set({hour,minute})
    return { id: `demo-${index}`, starts_at: starts.toUTC().toISO(), ends_at: starts.plus({ minutes: duration }).toUTC().toISO(), staff: staff[person], customer: { name }, service: { name: service }, status, notes }
  })
}

export default function CalendarPreview() {
  const { locale, setLocale } = usePublicLocale()
  const en = locale === 'en'
  const [appointments, setAppointments] = useState(createSampleAppointments)
  const [notice, setNotice] = useState('')
  return <main className="calendar-preview-page">
    <div className="admin-page-head"><div><p className="auth-kicker">GoRez</p><h2>{en ? 'Your booking calendar' : 'Календарът на бизнеса'}</h2><p>{en ? 'Local preview with fictional appointments.' : 'Локален преглед с измислени резервации.'}</p></div><LanguageSwitch locale={locale} onChange={setLocale} compact /></div>
    <p className="calendar-preview-notice">{en ? 'Demo data. Controls here do not change real bookings. This page is available only on the development server.' : 'Демонстрационни данни. Действията тук не променят реални резервации. Страницата е достъпна само на локалния development сървър.'}{notice && ` ${notice}`}</p>
    <AppointmentCalendar appointments={appointments} staff={staff} locale={locale} onStatusChange={(id, status) => setAppointments((current) => current.map((item) => item.id === id ? { ...item, status } : item))} onCreateBooking={({ date }) => setNotice(en ? `The owner booking form would open for ${date}.` : `В таблото се отваря формата за нова резервация за ${date}.`)} onReschedule={() => setNotice(en ? 'The owner rescheduling form would open.' : 'В таблото се отваря формата за преместване на часа.')} />
  </main>
}
