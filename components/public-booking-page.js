'use client'

import { BrandLoading } from './brand-loading'
import Link from 'next/link'
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { DateTime } from 'luxon'
import { useParams, useRouter } from 'next/navigation'
import { BrandLogo } from './brand-logo'
import { GuidedBookingChat } from './guided-booking-chat'
import { BookingIntakeFields, BookingIntakeSummary } from './booking-intake-fields'
import { BookingConfirmationActions } from './booking-confirmation-actions'
import { localizedApiMessage } from '../lib/localized-api-message.mjs'
import { LanguageSwitch } from './language-switch'
import { HomeLink } from './home-link'
import { usePublicLocale } from '../hooks/use-public-locale'
import { collapseSlotsByLocalTime, formatBulgarianMonthShort } from '../lib/booking-window.mjs'
import { MonthlyBookingCalendar } from './monthly-booking-calendar'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import { notificationNotice } from '../lib/notification-copy.mjs'
import { trackProductEvent } from '../lib/product-events-client'
import { focusBookingDetails } from '../lib/booking-details-navigation.mjs'
import { BusinessProfileHeader, BusinessProfileInformation, BusinessServiceList } from './business-profile'
import { Icon } from './icon'
import { BusinessReviews, useBusinessReviews } from './business-reviews'
import { isExternalBooking, isPhoneBooking, safeBookingPhone } from '../lib/booking-mode.mjs'
import { eligibleProfileStaff, profileBookingContextKey, profileServicePrice, scrollToProfileBooking } from '../lib/business-profile-ui.mjs'
import { OutboundBookingButton } from './outbound-booking-button'
import { ProfileViewTracker } from './profile-view-tracker'
import { ServiceThumbnail } from './service-thumbnail'
import { BookingCalendarIcon, BookingButtonContent } from './booking-button-content'

const BOOKING_COPY = {
  bg: { loading: 'Подготвяме свободните часове…', home: 'Начало', dashboard: 'Към таблото', logout: 'Изход', loggingOut: 'Излизане…', online: 'Онлайн', eyebrow: 'Онлайн записване · 24/7', hero: 'Запази време', heroEm: 'за себе си.', lead: 'Избери услугата и най-удобния свободен час. Без обаждане, без регистрация и без чакане за отговор.', book: 'Резервирай час', assistant: 'Онлайн асистент', proof: ['Избираш услуга', 'Виждаш свободните часове', 'Получаваш потвърждение'], reassurance: ['Без профил', 'Реална наличност', 'Сигурно управление'], terms: 'Условия за резервация', privacy: 'Поверителност', legalTerms: 'Условия', powered: 'Задвижвано от GoRez', secure: 'Защитена резервация', notOpen: 'Не успяхме да отворим страницата', retry: 'Опитай отново' },
  en: { loading: 'Preparing available times…', home: 'Home', dashboard: 'Dashboard', logout: 'Sign out', loggingOut: 'Signing out…', online: 'Online', eyebrow: 'Online booking · 24/7', hero: 'Book time', heroEm: 'for yourself.', lead: 'Choose a service and the most convenient available time. No calls, no registration and no waiting for a reply.', book: 'Book an appointment', assistant: 'Online assistant', proof: ['Choose a service', 'See available times', 'Get confirmation'], reassurance: ['No account needed', 'Live availability', 'Secure management'], terms: 'Booking terms', privacy: 'Privacy', legalTerms: 'Terms', powered: 'Powered by GoRez', secure: 'Secure booking', notOpen: 'We could not open this page', retry: 'Try again' },
}

function formatDate(date, zone, locale = 'bg') {
  const parsed = DateTime.fromISO(date, { zone }).setLocale(locale)
  return locale === 'bg' ? `${parsed.toFormat('ccc')}, ${parsed.day} ${formatBulgarianMonthShort(parsed.month)}` : parsed.toFormat('ccc, d LLL')
}

function SparkLogo({ businessName, locale }) {
  return (
    <Link className="booking-brand booking-brand-link" href={`/?lang=${locale}`} aria-label={locale === 'bg' ? 'Към началната страница' : 'Go to homepage'}>
      <BrandLogo compact decorative eager />
      <span className="booking-business-name"><strong>GoRez</strong></span>
    </Link>
  )
}

function LoadingPage({ copy, locale }) {
  return <main className="booking-state-page"><div className="state-home-navigation"><HomeLink locale={locale}/></div><BrandLoading locale={locale} label={copy.loading} size={48}/></main>
}

function ExternalBookingPanel({business,locale,preview=false,serviceId='',assistant=false}) {
 const en=locale==='en'
 const service=business.services.find(item=>item.id===serviceId)
 const headingId=assistant?'external-assistant-title':'external-booking-title'
 return <section className="external-booking-panel booking-card" aria-labelledby={headingId}><h2 id={headingId}>{assistant?(en?'Online assistant':'Онлайн асистент'):(en?'Book on the business’s website':'Запази час в сайта на бизнеса')}</h2>{service&&<p className="profile-selected-service"><span className="service-photo-name"><ServiceThumbnail service={service} business={business} locale={locale} size={40}/><strong>{service.name}</strong></span><span>{profileServicePrice(service,locale)}</span></p>}<p>{en?'Check available times and complete your booking on the business’s website. GoRez does not synchronize that calendar.':'Провери свободните часове и завърши резервацията в сайта на бизнеса. GoRez не синхронизира този календар.'}</p>{assistant&&<><p>{en?'For this business, the assistant can direct you to its booking system or contact information.':'За този бизнес асистентът може да те насочи към системата му за резервации или контактите.'}</p>{safeBookingPhone(business.phone)&&<a className="profile-assistant-contact" href={safeBookingPhone(business.phone)}><Icon name="phone"/>{business.phone}</a>}</>}<OutboundBookingButton business={business} locale={locale} className="profile-external-reserve" disabled={preview}><BookingButtonContent>{en?'Continue to booking':'Продължи към резервацията'}</BookingButtonContent></OutboundBookingButton></section>
}

function PhoneBookingPanel({business,locale,preview=false,serviceId=''}) {
 const en=locale==='en',service=business.services.find(item=>item.id===serviceId)
 return <section className="external-booking-panel booking-card" aria-labelledby="phone-booking-title"><h2 id="phone-booking-title">{en?'Arrange an appointment by phone':'Уговори час по телефон'}</h2>{service&&<p className="profile-selected-service"><strong>{service.name}</strong><span>{profileServicePrice(service,locale)}</span></p>}<p>{en?'Call the business to agree on a suitable time. GoRez does not confirm phone appointments.':'Обади се на бизнеса, за да уговориш удобен час. GoRez не потвърждава телефонни резервации.'}</p><OutboundBookingButton business={business} locale={locale} className="profile-external-reserve" disabled={preview}><BookingButtonContent>{en?'Book an appointment':'Резервирай час'}</BookingButtonContent></OutboundBookingButton></section>
}

function BookingPanel({ business, locale, ref, onServiceChange, onBusyChange, active = true, preview = false, previewCalendarScenario = 'normal' }) {
  const en = locale === 'en'
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [monthLoading, setMonthLoading] = useState(false)
  const [availabilityRevision, setAvailabilityRevision] = useState(0)
  const [details, setDetails] = useState({ name: '', phone: '', email: '', notes: '', consent: false })
  const [intake, setIntake] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const detailsHeadingRef = useRef(null)
  const nameInputRef = useRef(null)
  const submitLock = useRef(false), selectedDateRef = useRef(''), previewAttempts = useRef(0)

  const service = business.services.find((item) => item.id === serviceId)
  const availableStaff = useMemo(() => eligibleProfileStaff(business, serviceId), [business, serviceId])
  selectedDateRef.current = date
  const visibleSlots = useMemo(() => staffId ? slots : collapseSlotsByLocalTime(slots), [slots, staffId])

  const invalidateSelection = useCallback(() => { setDate(''); setSlot(null); setSlots([]) }, [])
  const monthLoadingChanged = useCallback(loading => {
    setMonthLoading(loading)
    if (loading) { setSlot(null); setSlots([]) }
  }, [])
  const monthDataChanged = useCallback(payload => {
    const day = payload.days.find(day => day.date === selectedDateRef.current)
    const nextSlots = day?.slots || []
    setSlots(nextSlots)
    setSlot(current => current && nextSlots.some(item => item.startsAt === current.startsAt && item.staffId === current.staffId) ? current : null)
  }, [])
  const chooseDate = useCallback((value, nextSlots) => {
    setDate(value); setSlots(nextSlots); setSlot(null); setError('')
  }, [])
  const loadPreviewMonth = useCallback(async ({ month, serviceId: selectedService, staffId: selectedStaff, signal }) => {
    // This development-only fixture invokes the real engine with fictional
    // schedules on a production-gated local route, never production records.
    const response = await fetch('/api/dev/business-profile/month', { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ business, month, serviceId: selectedService, staffId: selectedStaff || undefined, scenario: previewCalendarScenario, attempt: ++previewAttempts.current }) })
    const result = await response.json()
    if (!response.ok) throw new Error('Local calendar preview unavailable')
    return result
  }, [business, previewCalendarScenario])

  useEffect(() => {
    if (preview || !hasSupabaseConfig) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session?.user.email_confirmed_at) return
      const user = data.session.user
      setDetails(current => ({ ...current, email: current.email || user.email || '', name: current.name || user.user_metadata?.full_name || '' }))
    }).catch(() => {})
    return () => { active = false }
  }, [preview])

  function chooseService(id) {
    if (submitting || submitLock.current) return false
    if (!business.services.some(item => item.id === id)) return false
    if (id === serviceId && !confirmation) return true
    if (!preview) trackProductEvent('booking_started','book',locale)
    setServiceId(id)
    const eligible = eligibleProfileStaff(business, id)
    setStaffId(eligible.length === 1 ? eligible[0].id : '')
    setDate('')
    setSlot(null)
    setSlots([])
    setError('')
    setConfirmation(null)
    onServiceChange(id)
    return true
  }

  useImperativeHandle(ref, () => ({ chooseService }))

  function chooseSlot(item) {
    if (submitting || monthLoading || !slots.some(current => current.staffId === item.staffId && current.startsAt === item.startsAt) || DateTime.fromISO(item.startsAt).toMillis() < Date.now() + (business.minimum_notice_minutes || 0) * 60000) return
    setError('')
    // Mount the conditional form before focusing, without delaying the user's
    // tap into an effect/timer (which can suppress the keyboard on iOS).
    flushSync(() => setSlot(item))
    focusBookingDetails(detailsHeadingRef.current, nameInputRef.current, window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  }

  async function submit(event) {
    event.preventDefault()
    if (preview) {
      if (previewCalendarScenario === 'conflict') { setError(en ? 'That time was just booked. Please choose another time.' : 'Този час току-що беше резервиран. Избери друг час.'); setSlot(null); setSlots([]); setAvailabilityRevision(value => value + 1) }
      else setError(en ? 'Local preview: no booking or notification is sent.' : 'Локален преглед: не се изпраща резервация или известие.')
      return
    }
    if (!service || !slot || submitting || submitLock.current || monthLoading) return
    submitLock.current = true
    setSubmitting(true)
    onBusyChange(true)
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
          intake,
          locale,
          consent: details.consent,
          source: 'web',
        }),
      })
      const result = await response.json()
      if (!response.ok) { const failure = new Error(localizedApiMessage(result.error, locale)); failure.code = result.error?.code; throw failure }
      if (!result.booking?.appointment?.id || !result.booking?.appointment?.cancellation_token) throw new Error(en ? 'Booking confirmation could not be verified. Contact the business before trying again.' : 'Потвърждението не можа да бъде проверено. Свържи се с бизнеса, преди да опиташ отново.')
      setAvailabilityRevision(value => value + 1)
      setConfirmation({ ...result.booking, service: result.booking.service || service, slot })
      trackProductEvent('booking_completed','book',locale)
    } catch (requestError) {
      setError(requestError.message)
      if (requestError.code === 'SLOT_UNAVAILABLE') { setSlot(null); setSlots([]); setAvailabilityRevision(value => value + 1) }
    } finally {
      submitLock.current = false
      setSubmitting(false)
      onBusyChange(false)
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
          <span>{formatDate(DateTime.fromISO(confirmation.slot.startsAt).setZone(business.timezone).toISODate(), business.timezone, locale)} {en ? 'at' : 'в'} {confirmation.slot.localTime}</span>
          <span>{en ? 'with' : 'при'} {confirmation.slot.staffName}</span>
          {business.address && <span>{business.address}</span>}
        </div>
        <BookingIntakeSummary industry={business.industry} locale={locale} value={intake} />
        <p>{en ? 'Keep these details. If needed, contact' : 'Запази тези детайли. При нужда се свържи с'} {business.name}{business.phone ? ` ${en ? 'at' : 'на'} ${business.phone}` : ''}.</p>
        <Link className="manage-booking-link" href={`/booking/${confirmation.appointment.cancellation_token}?lang=${locale}`}>{en ? 'View and manage booking' : 'Преглед и управление на резервацията'}</Link>
        <BookingConfirmationActions appointment={confirmation.appointment} business={business} service={confirmation.service} staff={confirmation.staff} locale={locale} />
        <button className="booking-primary" type="button" onClick={() => { setConfirmation(null); setSlot(null); setDate(''); setSlots([]); setAvailabilityRevision(value => value + 1); setIntake({}); setDetails({ name: '', phone: '', email: '', notes: '', consent: false }) }}>{en ? 'Book another appointment' : 'Запази още един час'}</button>
      </section>
    )
  }

  return (
    <section className="booking-card">
      <div className="profile-booking-heading"><BookingCalendarIcon/><div><h2>{en ? 'Book an appointment' : 'Резервирай час'}</h2>{service ? <p className="service-photo-name"><ServiceThumbnail service={service} business={business} locale={locale} size={36}/><span><strong>{service.name}</strong> · {profileServicePrice(service, locale)}</span></p> : <p>{en ? 'Choose a service above to see available times.' : 'Избери услуга от списъка, за да видиш свободните часове.'}</p>}</div></div>

      {serviceId && <>
        {availableStaff.length > 1 && <>
        <label className="profile-staff-choice"><span>{en ? 'Specialist' : 'Специалист'}</span><select value={staffId} disabled={submitting} onChange={event => { setStaffId(event.target.value); invalidateSelection(); setError('') }}><option value="">{en ? 'Any available specialist' : 'Без предпочитание'}</option>{availableStaff.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
        </>}
        <MonthlyBookingCalendar business={business} serviceId={serviceId} staffId={staffId} locale={locale} selectedDate={date} onSelectDate={chooseDate} onInvalidateSelection={invalidateSelection} onData={monthDataChanged} onLoadingChange={monthLoadingChanged} refreshKey={availabilityRevision} disabled={submitting} active={active} previewMonthLoader={preview ? loadPreviewMonth : undefined}/>
        {date && !monthLoading && visibleSlots.length > 0 && <div className="profile-time-slots" role="group" aria-label={en ? 'Available times' : 'Свободни часове'}>{visibleSlots.map(item => {
          const selected = slot?.startsAt === item.startsAt && slot?.staffId === item.staffId
          return <button type="button" disabled={submitting} aria-pressed={selected} className={selected ? 'selected' : ''} onClick={() => chooseSlot(item)} key={`${item.staffId}-${item.startsAt}`} aria-label={`${formatDate(date, business.timezone, locale)}, ${item.localTime}–${item.localEndTime}, ${item.staffName}`}><strong>{item.localTime}<span>–{item.localEndTime}</span></strong>{!staffId && <small>{item.staffName}</small>}</button>
        })}</div>}
      </>}

      {slot && <form className="booking-details" onSubmit={submit}>
        <div className="booking-divider" />
        <div className="booking-section-head booking-details-heading" ref={detailsHeadingRef}><span>4</span><div><h2>{en ? 'Your details' : 'Твоите данни'}</h2><p>{en ? 'For confirmation and contact if anything changes.' : 'За потвърждение и връзка при промяна.'}</p></div></div>
        <div className="booking-form-grid">
          <label><span>{en ? 'Name *' : 'Име *'}</span><input ref={nameInputRef} required minLength={2} name="name" autoComplete="name" value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} placeholder={en ? 'Your name' : 'Твоето име'} /></label>
          <label><span>{en ? 'Phone *' : 'Телефон *'}</span><input required minLength={6} type="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} placeholder="+359 88 123 4567" /></label>
          <label className="full"><span>{en ? 'Email *' : 'Имейл *'}</span><input required type="email" autoComplete="email" inputMode="email" maxLength={180} value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} placeholder="name@example.com" /></label>
          <label className="full"><span>{en ? 'Note' : 'Бележка'}</span><textarea value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} placeholder={en ? 'Additional information (optional)' : 'Допълнителна информация (по желание)'} maxLength={600} /></label>
        </div>
        <BookingIntakeFields industry={business.industry} locale={locale} value={intake} onChange={setIntake} />
        <p className="booking-privacy">{notificationNotice(business.notifications, locale)}</p>
        <label className="booking-consent"><input required type="checkbox" checked={details.consent} onChange={(event) => setDetails({ ...details, consent: event.target.checked })} /><span>{en ? 'I agree that my data may be used for this booking and accept the ' : 'Съгласен/на съм данните ми да бъдат използвани за тази резервация и приемам '}<Link href={`/privacy?lang=${locale}`} target="_blank">{en ? 'privacy policy' : 'политиката за поверителност'}</Link>.</span></label>
        <div className="booking-summary"><span className="service-photo-name"><ServiceThumbnail service={service} business={business} locale={locale} size={36}/><span><small>{en ? 'Selected time' : 'Избран час'}</small><strong>{formatDate(date, business.timezone, locale)}, {slot.localTime}</strong><small>{service.name} · {slot.staffName}</small></span></span><b>{profileServicePrice(service, locale)}</b></div>
        {error && <p className="booking-inline-error" role="alert">{error}</p>}
        <button className="booking-primary" type="submit" disabled={submitting}>{submitting ? <><span className="button-spinner" /> {en ? 'Booking…' : 'Запазване...'}</> : (en ? 'Confirm booking' : 'Потвърди резервацията')}</button>
        <p className="booking-privacy">{en ? 'Your details are used only to provide and manage this booking.' : 'Данните се използват единствено за обслужване и управление на резервацията.'}</p>
      </form>}
      {!slot && error && <p className="booking-inline-error" role="alert">{error}</p>}
    </section>
  )
}

export function BusinessBookingExperience({ business, locale, preview = false, previewCalendarScenario = 'normal' }) {
  const en = locale === 'en', external = isExternalBooking(business), phoneOnly = isPhoneBooking(business)
  const [mode, setMode] = useState('booking'), [assistantOpened, setAssistantOpened] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const panel = useRef(null), section = useRef(null)

  function chooseService(id) {
    if (busy) return
    if (!business.services.some(service => service.id === id)) return
    flushSync(() => {
      setMode('booking')
      if (external || phoneOnly) setSelectedServiceId(id)
      else panel.current?.chooseService(id)
    })
    scrollToProfileBooking(section.current, window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  }

  if(phoneOnly)return <div className="profile-booking-flow"><BusinessServiceList business={business} locale={locale} selectedServiceId={selectedServiceId} onChoose={chooseService}/><div className="booking-content profile-shared-booking" id="booking-experience" ref={section} tabIndex={-1}><PhoneBookingPanel business={business} locale={locale} preview={preview} serviceId={selectedServiceId}/>{business.booking_terms&&<details className="booking-terms"><summary>{en?'Booking terms':'Условия за резервация'}</summary><p>{business.booking_terms}</p></details>}</div></div>
  return <div className="profile-booking-flow">
    <div className="business-booking-method"><div className="profile-mode-controls" role="group" aria-label={en ? 'Booking method' : 'Начин за записване'}>
      <button type="button" disabled={busy} aria-pressed={mode === 'booking'} aria-controls="profile-native-panel" onClick={() => setMode('booking')}><BookingButtonContent>{en ? 'Book an appointment' : 'Резервирай час'}</BookingButtonContent></button>
      <button type="button" disabled={busy} aria-pressed={mode === 'chat'} aria-controls="profile-assistant-panel" onClick={() => { setAssistantOpened(true); setMode('chat') }}><img className="profile-mode-art" src="/booking-art/assistant-3d-v1.webp" alt="" aria-hidden="true" width="30" height="30"/><span>{en ? 'Online assistant' : 'Онлайн асистент'}</span></button>
    </div></div>
    <BusinessServiceList business={business} locale={locale} selectedServiceId={selectedServiceId} onChoose={chooseService} disabled={busy}/>
    <div className="booking-content profile-shared-booking" id="booking-experience" ref={section} tabIndex={-1} role="region" aria-label={en ? 'Booking' : 'Резервация'}>
      <div id="profile-native-panel" hidden={mode !== 'booking'}>{external ? <ExternalBookingPanel business={business} locale={locale} preview={preview} serviceId={selectedServiceId}/> : <BookingPanel ref={panel} business={business} locale={locale} onServiceChange={setSelectedServiceId} onBusyChange={setBusy} active={mode === 'booking'} preview={preview} previewCalendarScenario={previewCalendarScenario}/>}</div>
      <div id="profile-assistant-panel" hidden={mode !== 'chat'}>{assistantOpened && (external ? <ExternalBookingPanel business={business} locale={locale} preview={preview} serviceId={selectedServiceId} assistant/> : <GuidedBookingChat business={business} locale={locale} active={mode === 'chat'} preview={preview} onBusyChange={setBusy} onShowBooking={() => { if (!busy) setMode('booking') }}/>)}</div>
      {business.booking_terms && <details className="booking-terms"><summary>{en ? 'Booking terms' : 'Условия за резервация'}</summary><p>{business.booking_terms}</p></details>}
    </div>
  </div>
}

export default function PublicBookingPage({ initialLocale = 'bg', previewBusiness = null, previewReviews = null, previewCalendarScenario = 'normal' }) {
  const params = useParams(), slug = previewBusiness?.slug || params.slug
  const router = useRouter()
  const { locale, setLocale } = usePublicLocale(initialLocale)
  const copy = BOOKING_COPY[locale]
  const [business, setBusiness] = useState(previewBusiness)
  const [status, setStatus] = useState(previewBusiness ? 'ready' : 'loading')
  const [error, setError] = useState('')
  const [embedded, setEmbedded] = useState(false)
  const [ownerSession, setOwnerSession] = useState(null)
  const [ownsBusiness, setOwnsBusiness] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const reviews = useBusinessReviews(slug, previewReviews)

  useEffect(() => {
    if (previewBusiness || !hasSupabaseConfig) return
    let active = true
    supabase.auth.getSession().then(({ data }) => { if (active) setOwnerSession(data.session) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (active) setOwnerSession(session) })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [previewBusiness])

  useEffect(() => {
    let active = true
    setOwnsBusiness(false)
    if (ownerSession) supabase.from('businesses').select('id').eq('owner_id', ownerSession.user.id).limit(1)
      .then(({ data, error }) => { if (active && !error) setOwnsBusiness(Boolean(data?.length)) })
      .catch(() => {})
    return () => { active = false }
  }, [ownerSession])

  useEffect(() => {
    if (previewBusiness) return
    setEmbedded(new URLSearchParams(window.location.search).get('embed') === '1')
    let active = true
    fetch(`/api/public/${slug}`)
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(localizedApiMessage(result.error, locale))
        if (active) { setBusiness(result.business); setStatus('ready') }
      })
      .catch((requestError) => { if (active) { setError(requestError.message); setStatus('error') } })
    return () => { active = false }
  }, [locale, slug, previewBusiness])

  async function logout() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (status === 'loading') return <LoadingPage copy={copy} locale={locale} />
  if (status === 'error') return <main className="booking-state-page"><div className="state-home-navigation"><HomeLink locale={locale}/></div><span className="booking-logo-mark">!</span><h1>{copy.notOpen}</h1><p>{error}</p><button className="booking-primary booking-retry" type="button" onClick={() => window.location.reload()}>{copy.retry}</button></main>

  return (
    <main className={`public-booking-page profile-redesign ${embedded ? 'embedded-booking' : ''}`} style={{ '--business-color': business.theme_color || '#173e2a' }}>
      <ProfileViewTracker slug={business.slug} disabled={Boolean(previewBusiness)}/>
      <div className="booking-ambient" aria-hidden="true"><i /><i /><i /></div>
      <header className="booking-topbar">
        <SparkLogo businessName={business.name} locale={locale} />
        <div className="booking-top-actions">
          <div className="booking-contact">{safeBookingPhone(business.phone) && <a className="booking-phone" href={safeBookingPhone(business.phone)}>{business.phone}</a>}</div>
          <LanguageSwitch locale={locale} onChange={setLocale} compact />
          <Link className="booking-home-link" href={`/account?lang=${locale}`}>{locale === 'en' ? 'My bookings' : 'Моите резервации'}</Link>
          {ownerSession && ownsBusiness ? <nav className="booking-owner-nav" aria-label={locale === 'bg' ? 'Навигация за профила' : 'Account navigation'}>
            <Link className="booking-dashboard-link" href={`/dashboard?lang=${locale}`}><span aria-hidden="true">←</span> {copy.dashboard}</Link>
            <button type="button" className="booking-signout" onClick={logout} disabled={signingOut}>{signingOut ? copy.loggingOut : copy.logout}</button>
          </nav> : null}
        </div>
        <HomeLink locale={locale}/>
      </header>
      {previewBusiness && <p className="local-profile-qa-label">LOCAL QA · fictional profile and reviews · not a real business</p>}
      {!embedded && <BusinessProfileHeader business={business} locale={locale}/>}
      <BusinessBookingExperience business={business} locale={locale} preview={Boolean(previewBusiness)} previewCalendarScenario={previewCalendarScenario} key={profileBookingContextKey(business)}/>
      {!embedded && <div className="business-profile-bottom"><BusinessProfileInformation business={business} locale={locale} /><BusinessReviews reviews={reviews} locale={locale} /></div>}
      <footer className="booking-footer"><span>{copy.secure}</span><span><Link href={`/privacy?lang=${locale}`}>{copy.privacy}</Link> · <Link href={`/terms?lang=${locale}`}>{copy.legalTerms}</Link></span><span>{copy.powered}</span></footer>
    </main>
  )
}
