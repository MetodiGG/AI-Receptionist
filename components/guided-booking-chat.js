'use client'

import Link from 'next/link'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatBulgarianMonthShort, resolveVisibleBookingDays } from '../lib/booking-window.mjs'

const PAGE_SIZE = 14

const TOPICS = [
  ['services', 'Услуги и цени'],
  ['hours', 'Работно време'],
  ['contact', 'Адрес и контакт'],
  ['cancellation', 'Отказване на час'],
]

function formatMoney(value, currency = 'EUR') {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency }).format(Number(value || 0))
}

function createMessage(role, content) {
  return { id: `${Date.now()}-${Math.random()}`, role, content }
}

function defaultWelcome(business) {
  return business.welcome_message || `Здравей! Аз съм онлайн асистентът на ${business.name}. Мога да ти помогна да запазиш час или да намериш важна информация.`
}

export function GuidedBookingChat({ business, onShowBooking }) {
  const [messages, setMessages] = useState([createMessage('assistant', defaultWelcome(business))])
  const [conversationId, setConversationId] = useState(null)
  const [step, setStep] = useState('menu')
  const [selection, setSelection] = useState({ serviceId: '', staffId: null, date: '', slot: null })
  const [slots, setSlots] = useState([])
  const [dateOffset, setDateOffset] = useState(0)
  const [details, setDetails] = useState({ name: '', phone: '', email: '', notes: '', consent: false })
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

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending, step])

  function addMessage(role, content) {
    setMessages((current) => [...current, createMessage(role, content)])
  }

  async function perform(payload, displayUser) {
    if (sending) return null
    if (displayUser) addMessage('user', displayUser)
    setSending(true)
    setError('')

    try {
      const response = await fetch(`/api/public/${business.slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, conversationId: conversationId || undefined }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message || 'Не успяхме да продължим разговора.')
      setConversationId(result.conversationId)
      addMessage('assistant', result.message)
      return result
    } catch (requestError) {
      setError(requestError.message)
      return null
    } finally {
      setSending(false)
    }
  }

  async function startBooking() {
    const result = await perform({ action: 'start_booking' }, 'Искам да резервирам час.')
    if (result && business.services.length && business.staff.length) setStep('service')
  }

  async function showTopic(topic, label) {
    await perform({ action: 'faq', topic }, label)
  }

  async function chooseService(item) {
    const result = await perform({ action: 'select_service', serviceId: item.id }, `Избирам „${item.name}“.`)
    if (!result) return
    setSelection({ serviceId: item.id, staffId: null, date: '', slot: null })
    setSlots([])
    setStep('staff')
  }

  async function chooseStaff(person) {
    const staffId = person?.id || null
    const display = person ? `Предпочитам ${person.name}.` : 'Нямам предпочитание за специалист.'
    const result = await perform({ action: 'select_staff', serviceId: selection.serviceId, staffId }, display)
    if (!result) return
    setSelection((current) => ({ ...current, staffId, date: '', slot: null }))
    setSlots([])
    setStep('date')
  }

  async function chooseDate(date) {
    const readable = DateTime.fromISO(date, { zone: business.timezone }).setLocale('bg').toFormat('cccc, d LLLL')
    const result = await perform({ action: 'select_date', serviceId: selection.serviceId, staffId: selection.staffId, date }, `Провери за ${readable}.`)
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
    }, `Избирам ${slot.localTime} при ${slot.staffName}.`)
    if (!result) return
    setSelection((current) => ({ ...current, staffId: slot.staffId, slot: result.slot || slot }))
    setStep('details')
  }

  function reviewDetails(event) {
    event.preventDefault()
    addMessage('user', 'Въведох данните си за контакт.')
    addMessage('assistant', 'Провери обобщението и потвърди само ако всичко е правилно.')
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
      consent: details.consent,
    }, 'Потвърждавам резервацията.')
    if (!result?.booking) return
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
    setMessages([createMessage('assistant', defaultWelcome(business))])
    setConversationId(null)
    setStep('menu')
    setSelection({ serviceId: '', staffId: null, date: '', slot: null })
    setSlots([])
    setDateOffset(0)
    setDetails({ name: '', phone: '', email: '', notes: '', consent: false })
    setConfirmation(null)
    setError('')
  }

  return (
    <section className="booking-card chat-card guided-chat-card" aria-label="Онлайн асистент">
      <div className="chat-head">
        <div><span className="booking-online-dot" /><strong>Онлайн асистент</strong><small>Безплатен · проверява календара в реално време</small></div>
        <button type="button" className="booking-text-button" onClick={onShowBooking}>Отвори стандартната форма</button>
      </div>

      <div className="chat-messages" aria-live="polite">
        {messages.map((message) => <div className={`chat-message ${message.role}`} key={message.id}>{message.content}</div>)}
        {sending && <div className="chat-message assistant typing"><i /><i /><i /></div>}
        <div ref={endRef} />
      </div>

      <div className="guided-chat-controls">
        {step === 'menu' && <div className="guided-action-grid">
          <button className="guided-primary-action" type="button" onClick={startBooking} disabled={sending}>Запази час <span>→</span></button>
          {TOPICS.map(([topic, label]) => <button type="button" onClick={() => showTopic(topic, label)} disabled={sending} key={topic}>{label}</button>)}
          {business.bot_instructions && <button type="button" onClick={() => showTopic('rules', 'Имате ли допълнителни правила?')} disabled={sending}>Правила и условия</button>}
        </div>}

        {step === 'service' && <div className="guided-step">
          <div className="guided-step-head"><div><small>Стъпка 1 от 5</small><strong>Избери услуга</strong></div><button type="button" onClick={() => setStep('menu')}>Назад</button></div>
          <div className="guided-option-list">{business.services.map((item) => <button type="button" onClick={() => chooseService(item)} disabled={sending} key={item.id}><span><strong>{item.name}</strong><small>{item.duration_min} минути</small></span><b>{formatMoney(item.price, item.currency)}</b></button>)}</div>
        </div>}

        {step === 'staff' && <div className="guided-step">
          <div className="guided-step-head"><div><small>Стъпка 2 от 5</small><strong>Избери специалист</strong></div><button type="button" onClick={() => setStep('service')}>Назад</button></div>
          <div className="guided-option-list compact">
            <button type="button" onClick={() => chooseStaff(null)} disabled={sending}><span><strong>Без предпочитание</strong><small>Най-ранният свободен час</small></span><b>✦</b></button>
            {availableStaff.map((person) => <button type="button" onClick={() => chooseStaff(person)} disabled={sending} key={person.id}><span><strong>{person.name}</strong><small>{person.bio || 'Специалист'}</small></span><b>{person.name.slice(0, 1).toUpperCase()}</b></button>)}
          </div>
        </div>}

        {step === 'date' && <div className="guided-step">
          <div className="guided-step-head"><div><small>Стъпка 3 от 5</small><strong>Избери дата</strong></div><button type="button" onClick={() => setStep('staff')}>Назад</button></div>
          <div className="guided-date-grid">{visibleDates.map((item) => {
            const itemDate = DateTime.fromISO(item).setLocale('bg')
            return <button type="button" onClick={() => chooseDate(item)} disabled={sending} key={item}><small>{itemDate.toFormat('ccc')}</small><strong>{itemDate.toFormat('d')}</strong><span>{formatBulgarianMonthShort(itemDate.month)}</span></button>
          })}</div>
          {allDates.length > PAGE_SIZE && <div className="guided-pagination">
            <button type="button" onClick={() => setDateOffset((current) => Math.max(0, current - PAGE_SIZE))} disabled={dateOffset === 0}>← Предишни</button>
            <button type="button" onClick={() => setDateOffset((current) => Math.min(Math.max(0, allDates.length - PAGE_SIZE), current + PAGE_SIZE))} disabled={dateOffset + PAGE_SIZE >= allDates.length}>Следващи →</button>
          </div>}
        </div>}

        {step === 'slot' && <div className="guided-step">
          <div className="guided-step-head"><div><small>Стъпка 3 от 5</small><strong>Избери свободен час</strong></div><button type="button" onClick={() => setStep('date')}>Друга дата</button></div>
          <div className="guided-slot-grid">{slots.map((slot) => <button type="button" onClick={() => chooseSlot(slot)} disabled={sending} key={`${slot.staffId}-${slot.startsAt}`}><strong>{slot.localTime}</strong><small>{slot.staffName}</small></button>)}</div>
        </div>}

        {step === 'details' && <form className="guided-details-form" onSubmit={reviewDetails}>
          <div className="guided-step-head"><div><small>Стъпка 4 от 5</small><strong>Данни за потвърждение</strong></div><button type="button" onClick={() => setStep('slot')}>Назад</button></div>
          <div className="guided-form-grid">
            <label><span>Име *</span><input required minLength={2} value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} placeholder="Твоето име" /></label>
            <label><span>Телефон *</span><input required minLength={6} type="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} placeholder="+359 88 123 4567" /></label>
            <label><span>Имейл</span><input type="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} placeholder="name@example.com" /></label>
            <label><span>Бележка</span><input value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} placeholder="По желание" maxLength={600} /></label>
            <label className="booking-consent full"><input required type="checkbox" checked={details.consent} onChange={(event) => setDetails({ ...details, consent: event.target.checked })} /><span>Приемам <Link href="/privacy" target="_blank">политиката за поверителност</Link> за тази резервация.</span></label>
          </div>
          <button className="booking-primary" type="submit">Продължи към преглед</button>
        </form>}

        {step === 'confirm' && <div className="guided-confirmation">
          <div className="guided-step-head"><div><small>Стъпка 5 от 5</small><strong>Прегледай резервацията</strong></div><button type="button" onClick={() => setStep('details')}>Редактирай</button></div>
          <div className="guided-booking-summary">
            <span><small>Услуга</small><strong>{service?.name}</strong></span>
            <span><small>Дата и час</small><strong>{DateTime.fromISO(selection.slot.startsAt).setZone(business.timezone).setLocale('bg').toFormat('d LLLL, HH:mm')}</strong></span>
            <span><small>Специалист</small><strong>{selection.slot.staffName}</strong></span>
            <span><small>Клиент</small><strong>{details.name}</strong><small>{details.phone}</small></span>
          </div>
          <button className="booking-primary" type="button" onClick={confirmBooking} disabled={sending}>{sending ? 'Потвърждаване...' : 'Потвърди резервацията'}</button>
          <p className="booking-privacy">Резервацията се създава едва след натискането на този бутон.</p>
        </div>}

        {step === 'done' && confirmation && <div className="guided-success">
          <span className="success-mark">✓</span>
          <strong>Резервацията е потвърдена</strong>
          <p>{confirmation.service.name} · {DateTime.fromISO(confirmation.appointment.starts_at).setZone(business.timezone).setLocale('bg').toFormat('d LLLL, HH:mm')} · {confirmation.staff.name}</p>
          <Link className="manage-booking-link" href={`/booking/${confirmation.appointment.cancellation_token}`}>Преглед и управление</Link>
          <button type="button" className="secondary-button" onClick={startOver}>Нов разговор</button>
        </div>}

        {error && <p className="booking-inline-error" role="alert">{error}</p>}
      </div>

      {step !== 'done' && <form className="chat-composer" onSubmit={sendQuestion}>
        <label className="sr-only" htmlFor="chat-message">Задай въпрос</label>
        <input id="chat-message" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Или напиши въпрос с твои думи..." maxLength={500} disabled={sending} />
        <button type="submit" disabled={sending || !value.trim()} aria-label="Изпрати">→</button>
      </form>}
      <p className="chat-note">Асистентът използва само публикуваните услуги, графици и свободни часове.</p>
    </section>
  )
}
