'use client'

import Link from 'next/link'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatBulgarianMonthShort, resolveVisibleBookingDays } from '../lib/booking-window.mjs'
import { BookingIntakeFields, BookingIntakeSummary } from './booking-intake-fields'
import { validateBookingIntake } from '../lib/booking-intake.mjs'
import { BookingConfirmationActions } from './booking-confirmation-actions'
import { notificationNotice } from '../lib/notification-copy.mjs'
import { trackProductEvent } from '../lib/product-events-client'
import { localizedApiMessage } from '../lib/localized-api-message.mjs'
import { profileServicePrice } from '../lib/business-profile-ui.mjs'
import { ServiceThumbnail } from './service-thumbnail'

const PAGE_SIZE = 14

const TEXT = {
  bg: { topics: [['services', 'Услуги и цени'], ['hours', 'Работно време'], ['contact', 'Адрес и контакт'], ['cancellation', 'Отказване на час']], title: 'Онлайн асистент', subtitle: 'Безплатен · проверява календара в реално време', form: 'Отвори стандартната форма', book: 'Запази час', back: 'Назад', chooseService: 'Избери услуга', chooseStaff: 'Избери специалист', chooseDate: 'Избери дата', chooseTime: 'Избери свободен час', noPreference: 'Без предпочитание', earliest: 'Най-ранният свободен час', previous: 'Предишни', next: 'Следващи', otherDate: 'Друга дата', details: 'Данни за потвърждение', review: 'Прегледай резервацията', confirm: 'Потвърди резервацията', confirmed: 'Резервацията е потвърдена', manage: 'Преглед и управление', newChat: 'Нов разговор', placeholder: 'Или напиши въпрос с твои думи…', note: 'Асистентът използва само публикуваните услуги, графици и свободни часове.' },
  en: { topics: [['services', 'Services & prices'], ['hours', 'Business hours'], ['contact', 'Address & contact'], ['cancellation', 'Cancel a booking']], title: 'Online assistant', subtitle: 'Free · checks live availability', form: 'Open standard form', book: 'Book an appointment', back: 'Back', chooseService: 'Choose a service', chooseStaff: 'Choose a specialist', chooseDate: 'Choose a date', chooseTime: 'Choose an available time', noPreference: 'No preference', earliest: 'Earliest available time', previous: 'Previous', next: 'Next', otherDate: 'Another date', details: 'Contact details', review: 'Review your booking', confirm: 'Confirm booking', confirmed: 'Your booking is confirmed', manage: 'View and manage', newChat: 'New conversation', placeholder: 'Or ask a question in your own words…', note: 'The assistant only uses published services, schedules and available times.' },
}

function createMessage(role, content, services) {
  return { id: `${Date.now()}-${Math.random()}`, role, content, services }
}

function defaultWelcome(business, locale) {
  if (locale === 'bg' && business.welcome_message) return business.welcome_message
  return locale === 'en' ? `Hello! I am ${business.name}'s online assistant. I can help you book an appointment or find important information.` : `Здравей! Аз съм онлайн асистентът на ${business.name}. Мога да ти помогна да запазиш час или да намериш важна информация.`
}

export function GuidedBookingChat({ business, locale = 'bg', onShowBooking, onBusyChange, active = true, preview = false }) {
  const t = TEXT[locale]
  const en = locale === 'en'
  const [messages, setMessages] = useState([createMessage('assistant', defaultWelcome(business, locale))])
  const [conversationId, setConversationId] = useState(null)
  const [step, setStep] = useState('menu')
  const [selection, setSelection] = useState({ serviceId: '', staffId: null, date: '', slot: null })
  const [slots, setSlots] = useState([])
  const [dateOffset, setDateOffset] = useState(0)
  const [details, setDetails] = useState({ name: '', phone: '', email: '', notes: '', consent: false })
  const [intake, setIntake] = useState({})
  const [confirmation, setConfirmation] = useState(null)
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  const service = business.services.find((item) => item.id === selection.serviceId)
  const availableStaff = useMemo(() => {
    if (!selection.serviceId) return business.staff
    const mapped = business.staffServices.filter((item) => item.service_id === selection.serviceId).map((item) => item.staff_id)
    return mapped.length ? business.staff.filter((person) => mapped.includes(person.id)) : business.staff
  }, [business.staff, business.staffServices, selection.serviceId])
  const allDates = useMemo(() => {
    const start = DateTime.now().setZone(business.timezone).startOf('day')
    const days = resolveVisibleBookingDays(business.booking_window_days)
    return Array.from({ length: days }, (_, index) => start.plus({ days: index }).toISODate())
  }, [business.booking_window_days, business.timezone])
  const visibleDates = allDates.slice(dateOffset, dateOffset + PAGE_SIZE)

  useEffect(() => {
    if (active) endRef.current?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' })
  }, [active, messages, sending, step])

  function addMessage(role, content, services) {
    setMessages((current) => [...current, createMessage(role, content, services)])
  }

  async function perform(payload, displayUser) {
    if (preview) { setError(en ? 'Local preview: no message or booking is sent.' : 'Локален преглед: не се изпраща съобщение или резервация.'); return null }
    if (sending) return null
    if (displayUser) addMessage('user', displayUser)
    setSending(true)
    onBusyChange?.(true)
    setError('')

    try {
      const response = await fetch(`/api/public/${business.slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, locale, conversationId: conversationId || undefined }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(localizedApiMessage(result.error, locale))
      setConversationId(result.conversationId)
      addMessage('assistant', result.message, result.services)
      return result
    } catch (requestError) {
      setError(requestError.message)
      return null
    } finally {
      setSending(false)
      onBusyChange?.(false)
    }
  }

  async function startBooking() {
    if (!preview) trackProductEvent('booking_started','book',locale)
    const result = await perform({ action: 'start_booking' }, en ? 'I would like to book an appointment.' : 'Искам да резервирам час.')
    if (result && business.services.length && business.staff.length) setStep('service')
  }

  async function showTopic(topic, label) {
    await perform({ action: 'faq', topic }, label)
  }

  async function chooseService(item) {
    const result = await perform({ action: 'select_service', serviceId: item.id }, en ? `I choose “${item.name}”.` : `Избирам „${item.name}“.`)
    if (!result) return
    setSelection({ serviceId: item.id, staffId: null, date: '', slot: null })
    setSlots([])
    setStep('staff')
  }

  async function chooseStaff(person) {
    const staffId = person?.id || null
    const display = person ? (en ? `I prefer ${person.name}.` : `Предпочитам ${person.name}.`) : (en ? 'I have no specialist preference.' : 'Нямам предпочитание за специалист.')
    const result = await perform({ action: 'select_staff', serviceId: selection.serviceId, staffId }, display)
    if (!result) return
    setSelection((current) => ({ ...current, staffId, date: '', slot: null }))
    setSlots([])
    setStep('date')
  }

  async function chooseDate(date) {
    const readable = DateTime.fromISO(date, { zone: business.timezone }).setLocale(locale).toFormat('cccc, d LLLL')
    const result = await perform({ action: 'select_date', serviceId: selection.serviceId, staffId: selection.staffId, date }, en ? `Check ${readable}.` : `Провери за ${readable}.`)
    if (!result) return
    setSelection((current) => ({ ...current, date, slot: null }))
    setSlots(result.slots || [])
    setStep(result.slots?.length ? 'slot' : 'date')
  }

  async function chooseSlot(slot) {
    const result = await perform({
      action: 'select_slot',
      serviceId: selection.serviceId,
      staffId: slot.staffId,
      startsAt: slot.startsAt,
    }, en ? `I choose ${slot.localTime} with ${slot.staffName}.` : `Избирам ${slot.localTime} при ${slot.staffName}.`)
    if (!result) return
    setSelection((current) => ({ ...current, staffId: slot.staffId, slot: result.slot || slot }))
    setStep('details')
  }

  function reviewDetails(event) {
    event.preventDefault()
    try { validateBookingIntake(business.industry, intake, locale) }
    catch (validationError) { setError(validationError.message); return }
    addMessage('user', en ? 'I entered my contact details.' : 'Въведох данните си за контакт.')
    addMessage('assistant', en ? 'Review the summary and confirm if everything is correct.' : 'Провери обобщението и потвърди само ако всичко е правилно.')
    setStep('confirm')
    setError('')
  }

  async function confirmBooking() {
    const result = await perform({
      action: 'book',
      serviceId: selection.serviceId,
      staffId: selection.slot.staffId,
      startsAt: selection.slot.startsAt,
      customer: { name: details.name, phone: details.phone, email: details.email },
      notes: details.notes,
      intake,
      consent: details.consent,
    }, en ? 'I confirm the booking.' : 'Потвърждавам резервацията.')
    if (!result?.booking) return
    trackProductEvent('booking_completed','book',locale)
    setConfirmation(result.booking)
    setStep('done')
  }

  async function sendQuestion(event) {
    event.preventDefault()
    const content = value.trim()
    if (!content || sending) return
    setValue('')
    const result = await perform({ action: 'ask', message: content }, content)
    if (result?.topic === 'booking') setStep('service')
  }

  function startOver() {
    setMessages([createMessage('assistant', defaultWelcome(business, locale))])
    setConversationId(null)
    setStep('menu')
    setSelection({ serviceId: '', staffId: null, date: '', slot: null })
    setSlots([])
    setDateOffset(0)
    setDetails({ name: '', phone: '', email: '', notes: '', consent: false })
    setIntake({})
    setConfirmation(null)
    setError('')
  }

  return (
    <section className="booking-card chat-card guided-chat-card" aria-label={t.title}>
      <div className="chat-head">
        <div><strong>{t.title}</strong><small>{t.subtitle}</small></div>
        <button type="button" className="booking-text-button" disabled={sending} onClick={onShowBooking}>{t.form}</button>
      </div>

      <div className="chat-messages" aria-live="polite">
        {messages.map((message) => <div className={`chat-message ${message.role}`} key={message.id}>{message.services?.length ? <>
          <strong>{en ? 'Services and prices' : 'Услуги и цени'}</strong>
          <ul className="guided-service-menu">{message.services.map(item => <li key={item.id}><span className="service-photo-name"><ServiceThumbnail service={item} business={business} locale={locale} size={36}/><span>{item.name}{Number(item.duration_min) > 0 && <small>{item.duration_min} {en ? 'min' : 'мин.'}</small>}</span></span><b>{item.priceLabel}</b></li>)}</ul>
        </> : message.content}</div>)}
        {sending && <div className="chat-message assistant typing"><i /><i /><i /></div>}
        <div ref={endRef} />
      </div>

      <div className="guided-chat-controls">
        {step === 'menu' && <div className="guided-action-grid">
          <button className="guided-primary-action" type="button" onClick={startBooking} disabled={sending}>{t.book} <span>→</span></button>
          {t.topics.map(([topic, label]) => <button type="button" onClick={() => showTopic(topic, label)} disabled={sending} key={topic}>{label}</button>)}
          {business.bot_instructions && <button type="button" onClick={() => showTopic('rules', en ? 'Do you have additional rules?' : 'Имате ли допълнителни правила?')} disabled={sending}>{en ? 'Rules and terms' : 'Правила и условия'}</button>}
        </div>}

        {step === 'service' && <div className="guided-step">
          <div className="guided-step-head"><div><small>{en ? 'Step 1 of 5' : 'Стъпка 1 от 5'}</small><strong>{t.chooseService}</strong></div><button type="button" onClick={() => setStep('menu')}>{t.back}</button></div>
          <div className="guided-option-list">{business.services.map((item) => <button type="button" onClick={() => chooseService(item)} disabled={sending} key={item.id}><span className="service-photo-name"><ServiceThumbnail service={item} business={business} locale={locale} size={36}/><span><strong>{item.name}</strong>{Number(item.duration_min) > 0 && <small>{item.duration_min} {en ? 'minutes' : 'минути'}</small>}</span></span><b>{profileServicePrice(item, locale)}</b></button>)}</div>
        </div>}

        {step === 'staff' && <div className="guided-step">
          <div className="guided-step-head"><div><small>{en ? 'Step 2 of 5' : 'Стъпка 2 от 5'}</small><strong>{t.chooseStaff}</strong></div><button type="button" onClick={() => setStep('service')}>{t.back}</button></div>
          <div className="guided-option-list compact">
            <button type="button" onClick={() => chooseStaff(null)} disabled={sending}><span><strong>{t.noPreference}</strong><small>{t.earliest}</small></span><b>✦</b></button>
            {availableStaff.map((person) => <button type="button" onClick={() => chooseStaff(person)} disabled={sending} key={person.id}><span><strong>{person.name}</strong><small>{person.bio || (en ? 'Specialist' : 'Специалист')}</small></span><b>{person.name.slice(0, 1).toUpperCase()}</b></button>)}
          </div>
        </div>}

        {step === 'date' && <div className="guided-step">
          <div className="guided-step-head"><div><small>{en ? 'Step 3 of 5' : 'Стъпка 3 от 5'}</small><strong>{t.chooseDate}</strong></div><button type="button" onClick={() => setStep('staff')}>{t.back}</button></div>
          <div className="guided-date-grid">{visibleDates.map((item) => {
            const itemDate = DateTime.fromISO(item).setLocale(locale)
            return <button type="button" onClick={() => chooseDate(item)} disabled={sending} key={item}><small>{itemDate.toFormat('ccc')}</small><strong>{itemDate.toFormat('d')}</strong><span>{en ? itemDate.toFormat('LLL') : formatBulgarianMonthShort(itemDate.month)}</span></button>
          })}</div>
          {allDates.length > PAGE_SIZE && <div className="guided-pagination">
            <button type="button" onClick={() => setDateOffset((current) => Math.max(0, current - PAGE_SIZE))} disabled={dateOffset === 0}>← {t.previous}</button>
            <button type="button" onClick={() => setDateOffset((current) => Math.min(Math.max(0, allDates.length - PAGE_SIZE), current + PAGE_SIZE))} disabled={dateOffset + PAGE_SIZE >= allDates.length}>{t.next} →</button>
          </div>}
        </div>}

        {step === 'slot' && <div className="guided-step">
          <div className="guided-step-head"><div><small>{en ? 'Step 3 of 5' : 'Стъпка 3 от 5'}</small><strong>{t.chooseTime}</strong></div><button type="button" onClick={() => setStep('date')}>{t.otherDate}</button></div>
          <div className="guided-slot-grid">{slots.map((slot) => <button type="button" onClick={() => chooseSlot(slot)} disabled={sending} key={`${slot.staffId}-${slot.startsAt}`}><strong>{slot.localTime}–{slot.localEndTime || DateTime.fromISO(slot.endsAt).setZone(business.timezone).toFormat('HH:mm')}</strong><small>{slot.staffName}</small></button>)}</div>
        </div>}

        {step === 'details' && <form className="guided-details-form" onSubmit={reviewDetails}>
          <div className="guided-step-head"><div><small>{en ? 'Step 4 of 5' : 'Стъпка 4 от 5'}</small><strong>{t.details}</strong></div><button type="button" onClick={() => setStep('slot')}>{t.back}</button></div>
          <div className="guided-form-grid">
            <label><span>{en ? 'Name *' : 'Име *'}</span><input required minLength={2} value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} placeholder={en ? 'Your name' : 'Твоето име'} /></label>
            <label><span>{en ? 'Phone *' : 'Телефон *'}</span><input required minLength={6} type="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} placeholder="+359 88 123 4567" /></label>
            <label><span>{en ? 'Email *' : 'Имейл *'}</span><input required type="email" autoComplete="email" inputMode="email" maxLength={180} value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} placeholder="name@example.com" /></label>
            <label><span>{en ? 'Note' : 'Бележка'}</span><input value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} placeholder={en ? 'Optional' : 'По желание'} maxLength={600} /></label>
          </div>
          <BookingIntakeFields industry={business.industry} locale={locale} value={intake} onChange={setIntake} />
          <p className="booking-privacy">{notificationNotice(business.notifications, locale)}</p>
          <label className="booking-consent"><input required type="checkbox" checked={details.consent} onChange={(event) => setDetails({ ...details, consent: event.target.checked })} /><span>{en ? 'I accept the ' : 'Приемам '}<Link href={`/privacy?lang=${locale}`} target="_blank">{en ? 'privacy policy' : 'политиката за поверителност'}</Link>{en ? ' for this booking.' : ' за тази резервация.'}</span></label>
          <button className="booking-primary" type="submit">{en ? 'Continue to review' : 'Продължи към преглед'}</button>
        </form>}

        {step === 'confirm' && <div className="guided-confirmation">
          <div className="guided-step-head"><div><small>{en ? 'Step 5 of 5' : 'Стъпка 5 от 5'}</small><strong>{t.review}</strong></div><button type="button" onClick={() => setStep('details')}>{en ? 'Edit' : 'Редактирай'}</button></div>
          <div className="guided-booking-summary">
            <span><small>{en ? 'Service' : 'Услуга'}</small><strong>{service?.name}</strong></span>
            <span><small>{en ? 'Date and time' : 'Дата и час'}</small><strong>{DateTime.fromISO(selection.slot.startsAt).setZone(business.timezone).setLocale(locale).toFormat('d LLLL, HH:mm')}</strong></span>
            <span><small>{en ? 'Specialist' : 'Специалист'}</small><strong>{selection.slot.staffName}</strong></span>
            <span><small>{en ? 'Client' : 'Клиент'}</small><strong>{details.name}</strong><small>{details.phone}</small><small>{details.email}</small></span>
          </div>
          <BookingIntakeSummary industry={business.industry} locale={locale} value={intake} />
          <button className="booking-primary" type="button" onClick={confirmBooking} disabled={sending}>{sending ? (en ? 'Confirming…' : 'Потвърждаване...') : t.confirm}</button>
          <p className="booking-privacy">{en ? 'The booking is created only after you press this button.' : 'Резервацията се създава едва след натискането на този бутон.'}</p>
        </div>}

        {step === 'done' && confirmation && <div className="guided-success">
          <span className="success-mark">✓</span>
          <strong>{t.confirmed}</strong>
          <p>{confirmation.service.name} · {DateTime.fromISO(confirmation.appointment.starts_at).setZone(business.timezone).setLocale(locale).toFormat('d LLLL, HH:mm')} · {confirmation.staff.name}</p>
          <Link className="manage-booking-link" href={`/booking/${confirmation.appointment.cancellation_token}?lang=${locale}`}>{t.manage}</Link>
          <BookingConfirmationActions appointment={confirmation.appointment} business={business} service={confirmation.service} staff={confirmation.staff} locale={locale} />
          <button type="button" className="secondary-button" onClick={startOver}>{t.newChat}</button>
        </div>}

        {error && <p className="booking-inline-error" role="alert">{error}</p>}
      </div>

      {step !== 'done' && <form className="chat-composer" onSubmit={sendQuestion}>
        <label className="sr-only" htmlFor="chat-message">{en ? 'Ask a question' : 'Задай въпрос'}</label>
        <input id="chat-message" value={value} onChange={(event) => setValue(event.target.value)} placeholder={t.placeholder} maxLength={500} disabled={sending} />
        <button type="submit" disabled={sending || !value.trim()} aria-label={en ? 'Send' : 'Изпрати'}>→</button>
      </form>}
      <p className="chat-note">{t.note}</p>
    </section>
  )
}
