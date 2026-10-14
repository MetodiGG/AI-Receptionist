'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { useParams, useRouter } from 'next/navigation'
import { BrandLogo } from '../../../components/brand-logo'
import { GuidedBookingChat } from '../../../components/guided-booking-chat'
import { LanguageSwitch } from '../../../components/language-switch'
import { usePublicLocale } from '../../../hooks/use-public-locale'
import { collapseSlotsByLocalTime, formatBulgarianMonthShort, groupSlotsByPeriod, resolveVisibleBookingDays } from '../../../lib/booking-window.mjs'
import { hasSupabaseConfig, supabase } from '../../../lib/supabase'

const BOOKING_COPY = {
  bg: { loading: 'Подготвяме свободните часове…', home: 'Начало', dashboard: 'Към таблото', logout: 'Изход', loggingOut: 'Излизане…', online: 'Онлайн', eyebrow: 'Онлайн записване · 24/7', hero: 'Запази време', heroEm: 'за себе си.', lead: 'Избери услугата и най-удобния свободен час. Без обаждане, без регистрация и без чакане за отговор.', book: 'Резервирай час', assistant: 'Онлайн асистент', proof: ['Избираш услуга', 'Виждаш свободните часове', 'Получаваш потвърждение'], reassurance: ['Без профил', 'Реална наличност', 'Сигурно управление'], terms: 'Условия за резервация', privacy: 'Поверителност', legalTerms: 'Условия', powered: 'Задвижвано от GoRez', secure: 'Защитена резервация', notOpen: 'Не успяхме да отворим страницата', retry: 'Опитай отново' },
  en: { loading: 'Preparing available times…', home: 'Home', dashboard: 'Dashboard', logout: 'Sign out', loggingOut: 'Signing out…', online: 'Online', eyebrow: 'Online booking · 24/7', hero: 'Book time', heroEm: 'for yourself.', lead: 'Choose a service and the most convenient available time. No calls, no registration and no waiting for a reply.', book: 'Book an appointment', assistant: 'Online assistant', proof: ['Choose a service', 'See available times', 'Get confirmation'], reassurance: ['No account needed', 'Live availability', 'Secure management'], terms: 'Booking terms', privacy: 'Privacy', legalTerms: 'Terms', powered: 'Powered by GoRez', secure: 'Secure booking', notOpen: 'We could not open this page', retry: 'Try again' },
}

function formatMoney(value, currency = 'EUR', locale = 'bg') {
  return new Intl.NumberFormat(locale === 'bg' ? 'bg-BG' : 'en-GB', { style: 'currency', currency }).format(Number(value || 0))
}

function formatDate(date, zone, locale = 'bg') {
  const parsed = DateTime.fromISO(date, { zone }).setLocale(locale)
  return locale === 'bg' ? `${parsed.toFormat('ccc')}, ${parsed.day} ${formatBulgarianMonthShort(parsed.month)}` : parsed.toFormat('ccc, d LLL')
}

function formatDateRange(dates, zone, locale = 'bg') {
  if (!dates.length) return ''
  const first = DateTime.fromISO(dates[0], { zone }).setLocale(locale)
  const last = DateTime.fromISO(dates[dates.length - 1], { zone }).setLocale(locale)
  if (first.hasSame(last, 'month')) return `${first.toFormat('d')} – ${last.toFormat('d LLLL yyyy')}`
  if (first.hasSame(last, 'year')) return `${first.toFormat('d LLLL')} – ${last.toFormat('d LLLL yyyy')}`
  return `${first.toFormat('d LLLL yyyy')} – ${last.toFormat('d LLLL yyyy')}`
}

function SparkLogo({ businessName, locale }) {
  return (
    <Link className="booking-brand booking-brand-link" href={`/?lang=${locale}`} aria-label={locale === 'bg' ? 'Към началната страница' : 'Go to homepage'}>
      <BrandLogo compact decorative eager />
      <span className="booking-business-name"><small>GoRez</small><strong>{businessName || 'Онлайн резервации'}</strong></span>
    </Link>
  )
}

function LoadingPage({ copy }) {
  return <main className="booking-state-page"><span className="button-spinner" /><p>{copy.loading}</p></main>
}

function BookingPanel({ business, locale }) {
  const en = locale === 'en'
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
  const chosenDate = date ? DateTime.fromISO(date, { zone: business.timezone }).setLocale(locale) : null
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
        if (!response.ok) throw new Error(result.error?.message || (en ? 'We could not load the available times.' : 'Не успяхме да заредим свободните часове.'))
        if (active) setSlots(result.slots)
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoadingSlots(false) })
    return () => { active = false }
  }, [business.slug, date, en, serviceId, staffId])

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
      if (!response.ok) throw new Error(result.error?.message || (en ? 'We could not book this appointment.' : 'Не успяхме да запазим часа.'))
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
        <p className="booking-eyebrow">{en ? 'Your booking is confirmed' : 'Резервацията е потвърдена'}</p>
        <h2>{en ? 'See you soon!' : 'Очакваме те!'}</h2>
        <div className="confirmation-details">
          <strong>{confirmation.service.name}</strong>
          <span>{formatDate(date, business.timezone, locale)} {en ? 'at' : 'в'} {confirmation.slot.localTime}</span>
          <span>{en ? 'with' : 'при'} {confirmation.slot.staffName}</span>
          {business.address && <span>{business.address}</span>}
        </div>
        <p>{en ? 'Keep these details. If needed, contact' : 'Запази тези детайли. При нужда се свържи с'} {business.name}{business.phone ? ` ${en ? 'at' : 'на'} ${business.phone}` : ''}.</p>
        <Link className="manage-booking-link" href={`/booking/${confirmation.appointment.cancellation_token}`}>{en ? 'View and manage booking' : 'Преглед и управление на резервацията'}</Link>
        <button className="booking-primary" type="button" onClick={() => { setConfirmation(null); setSlot(null); setDate(''); setDetails({ name: '', phone: '', email: '', notes: '', consent: false }) }}>{en ? 'Book another appointment' : 'Запази още един час'}</button>
      </section>
    )
  }

  return (
    <section className="booking-card">
      <div className="booking-section-head"><span>1</span><div><h2>{en ? 'Choose a service' : 'Избери услуга'}</h2><p>{en ? 'What would you like to book?' : 'Какво искаш да резервираш?'}</p></div></div>
      <div className="service-grid">
        {business.services.map((item) => (
          <button type="button" className={`service-option ${serviceId === item.id ? 'selected' : ''}`} onClick={() => chooseService(item.id)} key={item.id}>
            <span className="service-accent" style={{ background: item.color }} />
            <span><strong>{item.name}</strong>{item.description && <small>{item.description}</small>}<small>{item.duration_min} {en ? 'min' : 'мин.'}</small></span>
            <b>{formatMoney(item.price, item.currency, locale)}</b>
          </button>
        ))}
      </div>

      {serviceId && <>
        <div className="booking-divider" />
        <div className="booking-section-head"><span>2</span><div><h2>{en ? 'Choose a specialist' : 'Избери специалист'}</h2><p>{en ? 'Or let the system find the earliest option.' : 'Или остави системата да избере най-ранния час.'}</p></div></div>
        <div className="staff-options">
          <button type="button" className={!staffId ? 'selected' : ''} onClick={() => { setStaffId(''); setSlot(null) }}><i>✦</i><span><strong>{en ? 'No preference' : 'Без предпочитание'}</strong><small>{en ? 'Earliest available time' : 'Най-ранен свободен час'}</small></span></button>
          {availableStaff.map((person) => <button type="button" className={staffId === person.id ? 'selected' : ''} onClick={() => { setStaffId(person.id); setSlot(null) }} key={person.id}><i>{person.name.slice(0, 1).toUpperCase()}</i><span><strong>{person.name}</strong><small>{person.bio || (en ? 'Specialist' : 'Специалист')}</small></span></button>)}
        </div>

        <div className="booking-divider" />
        <div className="booking-section-head"><span>3</span><div><h2>{en ? 'Choose a date and time' : 'Избери дата и час'}</h2><p>{en ? 'Only genuinely available times are shown.' : 'Показваме само реално свободните часове.'}</p></div></div>
        <div className="booking-calendar-shell">
          <div className="booking-calendar-head">
            <div><span>{en ? `Next ${dates.length} days` : `Следващите ${dates.length} дни`}</span><strong>{formatDateRange(dates, business.timezone, locale)}</strong></div>
            <small>{en ? 'Choose a convenient day' : 'Избери удобен ден'}</small>
          </div>
          <div className="date-strip" role="group" aria-label="Дати за резервация">
            {dates.map((item, index) => {
              const itemDate = DateTime.fromISO(item, { zone: business.timezone }).setLocale(locale)
              return <button type="button" aria-label={itemDate.toFormat('cccc, d LLLL yyyy')} aria-pressed={date === item} className={date === item ? 'selected' : ''} onClick={() => { setDate(item); setSlot(null) }} key={item}>
                <span className="date-weekday">{index === 0 ? (en ? 'Today' : 'Днес') : itemDate.toFormat('ccc')}</span>
                <strong>{itemDate.toFormat('d')}</strong>
                <span className="date-month">{en ? itemDate.toFormat('LLL') : formatBulgarianMonthShort(itemDate.month)}</span>
              </button>
            })}
          </div>
        </div>
        {date && <div className="selected-date-panel">
          <div className="selected-date-summary">
            <span className="selected-date-icon" aria-hidden="true">▦</span>
            <div><small>{en ? 'Selected date' : 'Избрана дата'}</small><strong>{chosenDate.toFormat('cccc, d LLLL yyyy')}</strong></div>
            <span className="available-times-label">{loadingSlots ? (en ? 'Checking…' : 'Проверяваме...') : availableTimes ? (en ? `${availableTimes} times available` : `${availableTimes} часа за избор`) : (en ? 'No available times' : 'Няма свободни часове')}</span>
          </div>
          <div className="slot-area">
            {loadingSlots && <p className="slot-status"><span className="button-spinner" /> {en ? 'Checking the calendar…' : 'Проверяваме календара...'}</p>}
            {!loadingSlots && slots.length === 0 && <p className="empty-slots">{en ? 'No available times for this date. Choose another day.' : 'Няма свободни часове за тази дата. Избери следващ ден.'}</p>}
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
        <div className="booking-section-head"><span>4</span><div><h2>{en ? 'Your details' : 'Твоите данни'}</h2><p>{en ? 'For confirmation and contact if anything changes.' : 'За потвърждение и връзка при промяна.'}</p></div></div>
        <div className="booking-form-grid">
          <label><span>{en ? 'Name *' : 'Име *'}</span><input required minLength={2} value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} placeholder={en ? 'Your name' : 'Твоето име'} /></label>
          <label><span>{en ? 'Phone *' : 'Телефон *'}</span><input required minLength={6} type="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} placeholder="+359 88 123 4567" /></label>
          <label className="full"><span>{en ? 'Email' : 'Имейл'}</span><input type="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} placeholder="name@example.com" /></label>
          <label className="full"><span>{en ? 'Note' : 'Бележка'}</span><textarea value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} placeholder={en ? 'Additional information (optional)' : 'Допълнителна информация (по желание)'} maxLength={600} /></label>
          <label className="booking-consent full"><input required type="checkbox" checked={details.consent} onChange={(event) => setDetails({ ...details, consent: event.target.checked })} /><span>{en ? 'I agree that my data may be used for this booking and accept the ' : 'Съгласен/на съм данните ми да бъдат използвани за тази резервация и приемам '}<Link href="/privacy" target="_blank">{en ? 'privacy policy' : 'политиката за поверителност'}</Link>.</span></label>
        </div>
        <div className="booking-summary"><span><small>{en ? 'Selected time' : 'Избран час'}</small><strong>{formatDate(date, business.timezone, locale)}, {slot.localTime}</strong><small>{service.name} · {slot.staffName}</small></span><b>{formatMoney(service.price, service.currency, locale)}</b></div>
        {error && <p className="booking-inline-error" role="alert">{error}</p>}
        <button className="booking-primary" type="submit" disabled={submitting}>{submitting ? <><span className="button-spinner" /> {en ? 'Booking…' : 'Запазване...'}</> : (en ? 'Confirm booking' : 'Потвърди резервацията')}</button>
        <p className="booking-privacy">{en ? 'Your details are used only to provide and manage this booking.' : 'Данните се използват единствено за обслужване и управление на резервацията.'}</p>
      </form>}
      {!slot && error && <p className="booking-inline-error" role="alert">{error}</p>}
    </section>
  )
}

export default function PublicBookingPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { locale, setLocale } = usePublicLocale()
  const copy = BOOKING_COPY[locale]
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
        if (!response.ok) throw new Error(result.error?.message || (locale === 'en' ? 'Page not found.' : 'Страницата не е намерена.'))
        if (active) { setBusiness(result.business); setStatus('ready') }
      })
      .catch((requestError) => { if (active) { setError(requestError.message); setStatus('error') } })
    return () => { active = false }
  }, [locale, slug])

  async function logout() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (status === 'loading') return <LoadingPage copy={copy} />
  if (status === 'error') return <main className="booking-state-page"><span className="booking-logo-mark">!</span><h1>{copy.notOpen}</h1><p>{error}</p><button className="booking-primary booking-retry" type="button" onClick={() => window.location.reload()}>{copy.retry}</button></main>

  return (
    <main className={`public-booking-page ${embedded ? 'embedded-booking' : ''}`} style={{ '--business-color': business.theme_color || '#173e2a' }}>
      <div className="booking-ambient" aria-hidden="true"><i /><i /><i /></div>
      <header className="booking-topbar">
        <SparkLogo businessName={business.name} locale={locale} />
        <div className="booking-top-actions">
          <div className="booking-contact">{business.phone && <a className="booking-phone" href={`tel:${business.phone}`}>{business.phone}</a>}<span className="booking-live"><i /> {copy.online}</span></div>
          <LanguageSwitch locale={locale} onChange={setLocale} compact />
          {ownerSession ? <nav className="booking-owner-nav" aria-label={locale === 'bg' ? 'Навигация за собственик' : 'Owner navigation'}>
            <Link className="booking-dashboard-link" href="/dashboard"><span aria-hidden="true">←</span> {copy.dashboard}</Link>
            <button type="button" className="booking-signout" onClick={logout} disabled={signingOut}>{signingOut ? copy.loggingOut : copy.logout}</button>
          </nav> : <Link className="booking-home-link" href={`/?lang=${locale}`}><span aria-hidden="true">←</span> {copy.home}</Link>}
        </div>
      </header>
      <section className="booking-hero">
        <div className="booking-hero-copy"><p className="booking-eyebrow"><span /> {copy.eyebrow}</p><h1>{copy.hero}<br /><em>{copy.heroEm}</em></h1><p>{copy.lead}</p>{business.address && <span className="booking-address">⌖ {business.address}</span>}</div>
        <div className="booking-hero-aside">
          <div className="booking-mode-switch" role="tablist" aria-label="Начин за записване">
            <button role="tab" aria-selected={mode === 'booking'} aria-controls="booking-experience" className={mode === 'booking' ? 'active' : ''} onClick={() => setMode('booking')}>{copy.book}</button>
            <button role="tab" aria-selected={mode === 'chat'} aria-controls="booking-experience" className={mode === 'chat' ? 'active' : ''} onClick={() => setMode('chat')}><span className="booking-online-dot" /> {copy.assistant}</button>
          </div>
          <div className="booking-proof-list">{copy.proof.map((item, index) => <span key={item}><b>0{index + 1}</b> {item}</span>)}</div>
        </div>
      </section>
      <div className="booking-reassurance" aria-label={locale === 'bg' ? 'Предимства' : 'Benefits'}>{copy.reassurance.map((item) => <span key={item}>✓ {item}</span>)}</div>
      {business.booking_terms && <details className="booking-terms"><summary>{copy.terms}</summary><p>{business.booking_terms}</p></details>}
      <div className="booking-content" id="booking-experience"><div className="booking-experience-enter" key={`${mode}-${locale}`}>{mode === 'booking' ? <BookingPanel business={business} locale={locale} /> : <GuidedBookingChat business={business} locale={locale} onShowBooking={() => setMode('booking')} />}</div></div>
      <footer className="booking-footer"><span>{copy.secure}</span><span><Link href="/privacy">{copy.privacy}</Link> · <Link href="/terms">{copy.legalTerms}</Link></span><span>{copy.powered}</span></footer>
    </main>
  )
}
