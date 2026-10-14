'use client'

import { useState } from 'react'
import { bookingCalendarFile } from '../lib/booking-confirmation.mjs'

export function BookingConfirmationActions({ appointment, business, service, staff, locale = 'bg' }) {
  const en = locale === 'en'
  const [message, setMessage] = useState('')
  const [showLink, setShowLink] = useState(false)
  const [link, setLink] = useState('')

  async function saveLink() {
    const url = new URL(`/booking/${appointment.cancellation_token}?lang=${locale}`, window.location.origin).href
    setLink(url)
    try {
      await navigator.clipboard.writeText(url)
      setMessage(en ? 'Private confirmation link copied. Save it for later.' : 'Личният линк е копиран. Запази го за по-късно.')
    } catch {
      setShowLink(true)
      setMessage(en ? 'Select and copy your private link below.' : 'Маркирай и копирай личния си линк отдолу.')
    }
  }

  function downloadCalendar() {
    const body = bookingCalendarFile({ appointment, businessName: business.name, serviceName: service.name, staffName: staff.name, address: business.address, locale })
    const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = 'gorez-appointment.ics'; anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage(en ? 'Open the downloaded calendar file to add the appointment. It will not update automatically.' : 'Отвори изтегления файл, за да добавиш часа в календара. Той не се обновява автоматично.')
  }

  return <div className="confirmation-save">
    <p>{en ? 'No email, SMS or Viber confirmation is sent. Save this private link to view or cancel your booking.' : 'Не се изпраща потвърждение по имейл, SMS или Viber. Запази личния линк, за да преглеждаш или отмениш часа.'}</p>
    <div className="confirmation-save-buttons"><button className="secondary-button" type="button" onClick={saveLink}>{en ? 'Copy confirmation link' : 'Копирай потвърждението'}</button>{['booked', 'confirmed'].includes(appointment.status) && <button className="secondary-button" type="button" onClick={downloadCalendar}>{en ? 'Add to my calendar' : 'Добави в моя календар'}</button>}</div>
    {message && <p className="confirmation-save-message" role="status">{message}</p>}
    {showLink && <label><span className="sr-only">{en ? 'Private booking link' : 'Личен линк за резервацията'}</span><input readOnly value={link} onFocus={(event) => event.target.select()} /></label>}
    <small>{en ? 'Keep the link private: anyone with it can manage this booking.' : 'Не споделяй личния линк: всеки с него може да управлява тази резервация.'}</small>
  </div>
}
