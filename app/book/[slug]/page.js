'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { useParams, useRouter } from 'next/navigation'
import { GuidedBookingChat } from '../../../components/guided-booking-chat'
import { collapseSlotsByLocalTime, formatBulgarianMonthShort, groupSlotsByPeriod, resolveVisibleBookingDays } from '../../../lib/booking-window.mjs'
import { hasSupabaseConfig, supabase } from '../../../lib/supabase'

function formatMoney(value, currency = 'EUR') {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency }).format(Number(value || 0))
}

function formatDate(date, zone) {
  const parsed = DateTime.fromISO(date, { zone }).setLocale('bg')
  return `${parsed.toFormat('ccc')}, ${parsed.day} ${formatBulgarianMonthShort(parsed.month)}`
}

function formatDateRange(dates, zone) {
  if (!dates.length) return ''
  const first = DateTime.fromISO(dates[0], { zone }).setLocale('bg')
  const last = DateTime.fromISO(dates[dates.length - 1], { zone }).setLocale('bg')
  if (first.hasSame(last, 'month')) return `${first.toFormat('d')} – ${last.toFormat('d LLLL yyyy')}`
  if (first.hasSame(last, 'year')) return `${first.toFormat('d LLLL')} – ${last.toFormat('d LLLL yyyy')}`
  return `${first.toFormat('d LLLL yyyy')} – ${last.toFormat('d LLLL yyyy')}`
}

function SparkLogo({ businessName }) {
  return (
    <Link className="booking-brand booking-brand-link" href="/" aria-label="Към началната страница">
      <span className="booking-logo-mark" aria-hidden="true">✦</span>
      <span><small>AI Рецепционист</small><strong>{businessName || 'Онлайн резервации'}</strong></span>
    </Link>
  )
}

function LoadingPage() {
  return <main className="booking-state-page"><span className="button-spinner" /><p>Подготвяме свободните часове...</p></main>
}

function BookingPanel({ business }) {
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [details, setDetails] = useState({ name: '', phone: '', email: '', notes: '', consent: false })
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
    const days = resolveVisibleBookingDays(business.booking_window_days)
    return Array.from({ length: days }, (_, index) => start.plus({ days: index }).toISODate())
  }, [business.booking_window_days, business.timezone])
  const chosenDate = date ? DateTime.fromISO(date, { zone: business.timezone }).setLocale('bg') : null
  const visibleSlots = useMemo(() => staffId ? slots : collapseSlotsByLocalTime(slots), [slots, staffId])
  const slotPeriods = useMemo(() => groupSlotsByPeriod(visibleSlots), [visibleSlots])
  const availableTimes = visibleSlots.length

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
          consent: details.consent,
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
        <Link className="manage-booking-link" href={`/booking/${confirmation.appointment.cancellation_token}`}>Преглед и управление на резервацията</Link>
        <button className="booking-primary" type="button" onClick={() => { setConfirmation(null); setSlot(null); setDate(''); setDetails({ name: '', phone: '', email: '', notes: '', consent: false }) }}>Запази още един час</button>
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
        <div className="booking-calendar-shell">
          <div className="booking-calendar-head">
            <div><span>Следващите {dates.length} дни</span><strong>{formatDateRange(dates, business.timezone)}</strong></div>
            <small>Избери удобен ден</small>
          </div>
          <div className="date-strip" role="group" aria-label="Дати за резервация">
            {dates.map((item, index) => {
              const itemDate = DateTime.fromISO(item, { zone: business.timezone }).setLocale('bg')
              return <button type="button" aria-label={itemDate.toFormat('cccc, d LLLL yyyy')} aria-pressed={date === item} className={date === item ? 'selected' : ''} onClick={() => { setDate(item); setSlot(null) }} key={item}>
                <span className="date-weekday">{index === 0 ? 'Днес' : itemDate.toFormat('ccc')}</span>
                <strong>{itemDate.toFormat('d')}</strong>
                <span className="date-month">{formatBulgarianMonthShort(itemDate.month)}</span>
              </button>
            })}
          </div>
        </div>
        {date && <div className="selected-date-panel">
          <div className="selected-date-summary">
            <span className="selected-date-icon" aria-hidden="true">▦</span>
            <div><small>Избрана дата</small><strong>{chosenDate.toFormat('cccc, d LLLL yyyy')}</strong></div>
            <span className="available-times-label">{loadingSlots ? 'Проверяваме...' : availableTimes ? `${availableTimes} часа за избор` : 'Няма свободни часове'}</span>
          </div>
          <div className="slot-area">
            {loadingSlots && <p className="slot-status"><span className="button-spinner" /> Проверяваме календара...</p>}
            {!loadingSlots && slots.length === 0 && <p className="empty-slots">Няма свободни часове за тази дата. Избери следващ ден.</p>}
            {!loadingSlots && slots.length > 0 && <div className="time-periods">{slotPeriods.map((period) => <section className="time-period" key={period.key}>
              <div className="time-period-head"><h3>{period.label}</h3><span>{period.range}</span></div>
              <div className="slot-grid">{period.slots.map((item) => {
                const selected = slot?.startsAt === item.startsAt && slot?.staffId === item.staffId
                return <button type="button" aria-pressed={selected} className={selected ? 'selected' : ''} onClick={() => setSlot(item)} key={`${item.staffId}-${item.startsAt}`}><span className="slot-time"><strong>{item.localTime}</strong>{selected && <i aria-hidden="true">✓</i>}</span>{!staffId && <small>{item.staffName}</small>}</button>
              })}</div>
            </section>)}</div>}
          </div>
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
          <label className="booking-consent full"><input required type="checkbox" checked={details.consent} onChange={(event) => setDetails({ ...details, consent: event.target.checked })} /><span>Съгласен/на съм данните ми да бъдат използвани за тази резервация и приемам <Link href="/privacy" target="_blank">политиката за поверителност</Link>.</span></label>
        </div>
        <div className="booking-summary"><span><small>Избран час</small><strong>{formatDate(date, business.timezone)}, {slot.localTime}</strong><small>{service.name} · {slot.staffName}</small></span><b>{formatMoney(service.price, service.currency)}</b></div>
        {error && <p className="booking-inline-error" role="alert">{error}</p>}
        <button className="booking-primary" type="submit" disabled={submitting}>{submitting ? <><span className="button-spinner" /> Запазване...</> : 'Потвърди резервацията'}</button>
        <p className="booking-privacy">Данните се използват единствено за обслужване и управление на резервацията.</p>
      </form>}
      {!slot && error && <p className="booking-inline-error" role="alert">{error}</p>}
    </section>
  )
}

export default function PublicBookingPage() {
  const { slug } = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [mode, setMode] = useState('booking')
  const [embedded, setEmbedded] = useState(false)
  const [ownerSession, setOwnerSession] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!hasSupabaseConfig) return
    let active = true
    supabase.auth.getSession().then(({ data }) => { if (active) setOwnerSession(data.session) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (active) setOwnerSession(session) })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    setEmbedded(new URLSearchParams(window.location.search).get('embed') === '1')
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

  async function logout() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (status === 'loading') return <LoadingPage />
  if (status === 'error') return <main className="booking-state-page"><span className="booking-logo-mark">!</span><h1>Не успяхме да отворим страницата</h1><p>{error}</p><button className="booking-primary booking-retry" type="button" onClick={() => window.location.reload()}>Опитай отново</button></main>

  return (
    <main className={`public-booking-page ${embedded ? 'embedded-booking' : ''}`} style={{ '--business-color': business.theme_color || '#173e2a' }}>
      <div className="booking-ambient" aria-hidden="true"><i /><i /><i /></div>
      <header className="booking-topbar">
        <SparkLogo businessName={business.name} />
        <div className="booking-top-actions">
          <div className="booking-contact">{business.phone && <a className="booking-phone" href={`tel:${business.phone}`}>{business.phone}</a>}<span className="booking-live"><i /> Онлайн</span></div>
          {ownerSession ? <nav className="booking-owner-nav" aria-label="Навигация за собственик">
            <Link className="booking-dashboard-link" href="/dashboard"><span aria-hidden="true">←</span> Към таблото</Link>
            <button type="button" className="booking-signout" onClick={logout} disabled={signingOut}>{signingOut ? 'Излизане...' : 'Изход'}</button>
          </nav> : <Link className="booking-home-link" href="/"><span aria-hidden="true">←</span> Начало</Link>}
        </div>
      </header>
      <section className="booking-hero">
        <div className="booking-hero-copy"><p className="booking-eyebrow"><span /> Онлайн записване · 24/7</p><h1>Запази време<br /><em>за себе си.</em></h1><p>Избери услугата и най-удобния свободен час. Без обаждане, без регистрация и без чакане за отговор.</p>{business.address && <span className="booking-address">⌖ {business.address}</span>}</div>
        <div className="booking-hero-aside">
          <div className="booking-mode-switch" role="tablist" aria-label="Начин за записване">
            <button role="tab" aria-selected={mode === 'booking'} aria-controls="booking-experience" className={mode === 'booking' ? 'active' : ''} onClick={() => setMode('booking')}>Резервирай час</button>
            <button role="tab" aria-selected={mode === 'chat'} aria-controls="booking-experience" className={mode === 'chat' ? 'active' : ''} onClick={() => setMode('chat')}><span className="booking-online-dot" /> Онлайн асистент</button>
          </div>
          <div className="booking-proof-list"><span><b>01</b> Избираш услуга</span><span><b>02</b> Виждаш свободните часове</span><span><b>03</b> Получаваш потвърждение</span></div>
        </div>
      </section>
      <div className="booking-reassurance" aria-label="Предимства"><span>✓ Без профил</span><span>✓ Реална наличност</span><span>✓ Сигурно управление</span></div>
      {business.booking_terms && <details className="booking-terms"><summary>Условия за резервация</summary><p>{business.booking_terms}</p></details>}
      <div className="booking-content" id="booking-experience"><div className="booking-experience-enter" key={mode}>{mode === 'booking' ? <BookingPanel business={business} /> : <GuidedBookingChat business={business} onShowBooking={() => setMode('booking')} />}</div></div>
      <footer className="booking-footer"><span>Защитена резервация</span><span><Link href="/privacy">Поверителност</Link> · <Link href="/terms">Условия</Link></span><span>Задвижвано от AI Рецепционист</span></footer>
    </main>
  )
}
