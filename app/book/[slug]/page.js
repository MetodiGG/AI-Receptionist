'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { useParams } from 'next/navigation'

function formatMoney(value, currency = 'EUR') {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency }).format(Number(value || 0))
}

function formatDate(date, zone) {
  return DateTime.fromISO(date, { zone }).setLocale('bg').toFormat('ccc, d LLL')
}

function SparkLogo({ businessName }) {
  return (
    <div className="booking-brand">
      <span className="booking-logo-mark" aria-hidden="true">✦</span>
      <span><small>AI Рецепционист</small><strong>{businessName || 'Онлайн резервации'}</strong></span>
    </div>
  )
}

function LoadingPage() {
  return <main className="booking-state-page"><span className="button-spinner" /><p>Подготвяме свободните часове...</p></main>
}

function ChatPanel({ business, onShowBooking }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: business.welcome_message || `Здравей! Аз съм AI асистентът на ${business.name}. Как мога да помогна?` },
  ])
  const [value, setValue] = useState('')
  const [conversationId, setConversationId] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

  async function send(event) {
    event.preventDefault()
    const content = value.trim()
    if (!content || sending) return

    const nextMessages = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setValue('')
    setError('')
    setSending(true)

    try {
      const response = await fetch(`/api/public/${business.slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, messages: nextMessages }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message || 'Не успяхме да изпратим съобщението.')
      setConversationId(result.conversationId)
      setMessages((current) => [...current, { role: 'assistant', content: result.message }])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="booking-card chat-card" aria-label="AI асистент">
      <div className="chat-head">
        <div><span className="booking-online-dot" /><strong>AI асистент</strong><small>Отговаря веднага</small></div>
        <button type="button" className="booking-text-button" onClick={onShowBooking}>Резервирай с форма</button>
      </div>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
        {sending && <div className="chat-message assistant typing"><i /><i /><i /></div>}
        <div ref={endRef} />
      </div>
      {error && <p className="booking-inline-error" role="alert">{error}</p>}
      <form className="chat-composer" onSubmit={send}>
        <label className="sr-only" htmlFor="chat-message">Съобщение</label>
        <input id="chat-message" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Напр. Имате ли час утре следобед?" maxLength={1200} disabled={sending} />
        <button type="submit" disabled={sending || !value.trim()} aria-label="Изпрати">→</button>
      </form>
      <p className="chat-note">AI може да допусне грешка. Провери детайлите преди потвърждение.</p>
    </section>
  )
}

function BookingPanel({ business }) {
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [details, setDetails] = useState({ name: '', phone: '', email: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState(null)

  const service = business.services.find((item) => item.id === serviceId)
  const availableStaff = useMemo(() => {
    if (!serviceId) return business.staff
    const mapped = business.staffServices.filter((item) => item.service_id === serviceId).map((item) => item.staff_id)
    return mapped.length ? business.staff.filter((person) => mapped.includes(person.id)) : business.staff
  }, [business, serviceId])
  const dates = useMemo(() => {
    const start = DateTime.now().setZone(business.timezone).startOf('day')
    return Array.from({ length: 14 }, (_, index) => start.plus({ days: index }).toISODate())
  }, [business.timezone])

  useEffect(() => {
    if (!serviceId || !date) { setSlots([]); return }
    let active = true
    setLoadingSlots(true)
    setSlot(null)
    setError('')
    const query = new URLSearchParams({ service_id: serviceId, date })
    if (staffId) query.set('staff_id', staffId)

    fetch(`/api/public/${business.slug}/availability?${query}`)
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error?.message || 'Не успяхме да заредим свободните часове.')
        if (active) setSlots(result.slots)
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoadingSlots(false) })
    return () => { active = false }
  }, [business.slug, date, serviceId, staffId])

  function chooseService(id) {
    setServiceId(id)
    setStaffId('')
    setDate('')
    setSlot(null)
  }

  async function submit(event) {
    event.preventDefault()
    if (!service || !slot) return
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/public/${business.slug}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          staffId: slot.staffId,
          startsAt: slot.startsAt,
          customer: { name: details.name, phone: details.phone, email: details.email },
          notes: details.notes,
          source: 'web',
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message || 'Не успяхме да запазим часа.')
      setConfirmation({ ...result.booking, service, slot })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmation) {
    return (
      <section className="booking-card booking-success" aria-live="polite">
        <span className="success-mark">✓</span>
        <p className="booking-eyebrow">Резервацията е потвърдена</p>
        <h2>Очакваме те!</h2>
        <div className="confirmation-details">
          <strong>{confirmation.service.name}</strong>
          <span>{formatDate(date, business.timezone)} в {confirmation.slot.localTime}</span>
          <span>при {confirmation.slot.staffName}</span>
          {business.address && <span>{business.address}</span>}
        </div>
        <p>Запази тези детайли. При нужда се свържи с {business.name}{business.phone ? ` на ${business.phone}` : ''}.</p>
        <button className="booking-primary" type="button" onClick={() => { setConfirmation(null); setSlot(null); setDate(''); setDetails({ name: '', phone: '', email: '', notes: '' }) }}>Запази още един час</button>
      </section>
    )
  }

  return (
    <section className="booking-card">
      <div className="booking-section-head"><span>1</span><div><h2>Избери услуга</h2><p>Какво искаш да резервираш?</p></div></div>
      <div className="service-grid">
        {business.services.map((item) => (
          <button type="button" className={`service-option ${serviceId === item.id ? 'selected' : ''}`} onClick={() => chooseService(item.id)} key={item.id}>
            <span className="service-accent" style={{ background: item.color }} />
            <span><strong>{item.name}</strong>{item.description && <small>{item.description}</small>}<small>{item.duration_min} мин.</small></span>
            <b>{formatMoney(item.price, item.currency)}</b>
          </button>
        ))}
      </div>

      {serviceId && <>
        <div className="booking-divider" />
        <div className="booking-section-head"><span>2</span><div><h2>Избери специалист</h2><p>Или остави системата да избере най-ранния час.</p></div></div>
        <div className="staff-options">
          <button type="button" className={!staffId ? 'selected' : ''} onClick={() => { setStaffId(''); setSlot(null) }}><i>✦</i><span><strong>Без предпочитание</strong><small>Най-ранен свободен час</small></span></button>
          {availableStaff.map((person) => <button type="button" className={staffId === person.id ? 'selected' : ''} onClick={() => { setStaffId(person.id); setSlot(null) }} key={person.id}><i>{person.name.slice(0, 1).toUpperCase()}</i><span><strong>{person.name}</strong><small>{person.bio || 'Специалист'}</small></span></button>)}
        </div>

        <div className="booking-divider" />
        <div className="booking-section-head"><span>3</span><div><h2>Избери дата и час</h2><p>Показваме само реално свободните часове.</p></div></div>
        <div className="date-strip">
          {dates.map((item) => <button type="button" className={date === item ? 'selected' : ''} onClick={() => { setDate(item); setSlot(null) }} key={item}><small>{DateTime.fromISO(item).setLocale('bg').toFormat('ccc')}</small><strong>{DateTime.fromISO(item).toFormat('d')}</strong><small>{DateTime.fromISO(item).setLocale('bg').toFormat('LLL')}</small></button>)}
        </div>
        {date && <div className="slot-area">
          {loadingSlots && <p className="slot-status"><span className="button-spinner" /> Проверяваме календара...</p>}
          {!loadingSlots && slots.length === 0 && <p className="empty-slots">Няма свободни часове за тази дата. Избери следващ ден.</p>}
          {!loadingSlots && slots.length > 0 && <div className="slot-grid">{slots.map((item) => <button type="button" className={slot?.startsAt === item.startsAt && slot?.staffId === item.staffId ? 'selected' : ''} onClick={() => setSlot(item)} key={`${item.staffId}-${item.startsAt}`}><strong>{item.localTime}</strong>{!staffId && <small>{item.staffName}</small>}</button>)}</div>}
        </div>}
      </>}

      {slot && <form className="booking-details" onSubmit={submit}>
        <div className="booking-divider" />
        <div className="booking-section-head"><span>4</span><div><h2>Твоите данни</h2><p>За потвърждение и връзка при промяна.</p></div></div>
        <div className="booking-form-grid">
          <label><span>Име *</span><input required minLength={2} value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} placeholder="Твоето име" /></label>
          <label><span>Телефон *</span><input required minLength={6} type="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} placeholder="+359 88 123 4567" /></label>
          <label className="full"><span>Имейл</span><input type="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} placeholder="name@example.com" /></label>
          <label className="full"><span>Бележка</span><textarea value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} placeholder="Допълнителна информация (по желание)" maxLength={600} /></label>
        </div>
        <div className="booking-summary"><span><small>Избран час</small><strong>{formatDate(date, business.timezone)}, {slot.localTime}</strong><small>{service.name} · {slot.staffName}</small></span><b>{formatMoney(service.price, service.currency)}</b></div>
        {error && <p className="booking-inline-error" role="alert">{error}</p>}
        <button className="booking-primary" type="submit" disabled={submitting}>{submitting ? <><span className="button-spinner" /> Запазване...</> : 'Потвърди резервацията'}</button>
        <p className="booking-privacy">С потвърждението се съгласяваш данните да бъдат използвани единствено за управление на резервацията.</p>
      </form>}
      {!slot && error && <p className="booking-inline-error" role="alert">{error}</p>}
    </section>
  )
}

export default function PublicBookingPage() {
  const { slug } = useParams()
  const [business, setBusiness] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [mode, setMode] = useState('booking')

  useEffect(() => {
    let active = true
    fetch(`/api/public/${slug}`)
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error?.message || 'Страницата не е намерена.')
        if (active) { setBusiness(result.business); setStatus('ready') }
      })
      .catch((requestError) => { if (active) { setError(requestError.message); setStatus('error') } })
    return () => { active = false }
  }, [slug])

  if (status === 'loading') return <LoadingPage />
  if (status === 'error') return <main className="booking-state-page"><span className="booking-logo-mark">!</span><h1>Не успяхме да отворим страницата</h1><p>{error}</p></main>

  return (
    <main className="public-booking-page" style={{ '--business-color': business.theme_color || '#173e2a' }}>
      <header className="booking-topbar">
        <SparkLogo businessName={business.name} />
        <div className="booking-contact">{business.phone && <a href={`tel:${business.phone}`}>{business.phone}</a>}<span className="booking-live"><i /> Онлайн</span></div>
      </header>
      <section className="booking-hero">
        <div><p className="booking-eyebrow">Онлайн записване · 24/7</p><h1>Твоят час,<br /><em>без чакане.</em></h1><p>Избери удобен час или попитай AI асистента. Потвърждението е мигновено.</p>{business.address && <span className="booking-address">⌖ {business.address}</span>}</div>
        <div className="booking-mode-switch" role="tablist" aria-label="Начин за записване">
          <button role="tab" aria-selected={mode === 'booking'} className={mode === 'booking' ? 'active' : ''} onClick={() => setMode('booking')}>Резервирай час</button>
          <button role="tab" aria-selected={mode === 'chat'} className={mode === 'chat' ? 'active' : ''} onClick={() => setMode('chat')}><span className="booking-online-dot" /> Попитай AI</button>
        </div>
      </section>
      <div className="booking-content">{mode === 'booking' ? <BookingPanel business={business} /> : <ChatPanel business={business} onShowBooking={() => setMode('booking')} />}</div>
      <footer className="booking-footer"><span>Защитена резервация</span><span>Задвижвано от AI Рецепционист</span></footer>
    </main>
  )
}
