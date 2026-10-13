'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'
import { DashboardShell } from '../../components/dashboard-shell'
import { Icon } from '../../components/icon'

const WEEK = [
  { weekday: 1, label: 'Понеделник', short: 'Пон' },
  { weekday: 2, label: 'Вторник', short: 'Вто' },
  { weekday: 3, label: 'Сряда', short: 'Сря' },
  { weekday: 4, label: 'Четвъртък', short: 'Чет' },
  { weekday: 5, label: 'Петък', short: 'Пет' },
  { weekday: 6, label: 'Събота', short: 'Съб' },
  { weekday: 7, label: 'Неделя', short: 'Нед' },
]

const INITIAL_SCHEDULE = WEEK.map((day) => ({
  ...day,
  enabled: day.weekday <= 5,
  open: day.weekday <= 5 ? '09:00' : '10:00',
  close: day.weekday <= 5 ? '18:00' : '14:00',
}))

const STEPS = [
  ['Бизнес', 'Основни данни'],
  ['Услуги', 'Какво предлагаш'],
  ['Екип', 'Кой работи'],
  ['График', 'Работно време'],
  ['Преглед', 'Потвърждение'],
]

function slugify(value) {
  const map = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: '', ю: 'yu', я: 'ya' }
  return value.toLowerCase().split('').map((char) => map[char] ?? char).join('').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
}

function formatPrice(value) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

function getDatabaseErrorMessage(error) {
  if (error?.code === '42501') {
    return 'Достъпът до базата данни още не е конфигуриран. Свържи се с поддръжката.'
  }

  return error?.message || 'Възникна неочаквана грешка. Опитай отново.'
}

function Wizard({ session, onComplete }) {
  const [step, setStep] = useState(0)
  const [business, setBusiness] = useState({ name: '', slug: '', phone: '', contact_email: session.user.email || '', address: '', timezone: 'Europe/Sofia', industry: 'other' })
  const [services, setServices] = useState([{ name: '', price: '25', duration_min: '30' }])
  const [staff, setStaff] = useState([{ name: '' }])
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)

  const stepContent = [
    ['Нека опознаем бизнеса ти', 'Тази информация ще помогне на онлайн асистента да представя бизнеса ти правилно.'],
    ['Добави услугите си', 'Цената и продължителността са нужни, за да предлагаме само подходящи свободни часове.'],
    ['Кой ще приема клиенти?', 'Добави себе си и останалите хора, за които клиентите могат да резервират час.'],
    ['Кога работите?', 'Настрой стандартния седмичен график. По-късно ще можеш да добавяш почивки и изключения.'],
    ['Всичко изглежда добре', 'Прегледай настройките. След запазване веднага ще видиш новото си табло.'],
  ]

  function updateBusiness(field, value) {
    setBusiness((current) => ({
      ...current,
      [field]: value,
      ...(field === 'name' && !slugTouched ? { slug: slugify(value) } : {}),
    }))
  }

  function updateList(setter, index, field, value) {
    setter((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row))
  }

  function removeListRow(setter, index) {
    setter((current) => current.filter((_, rowIndex) => rowIndex !== index))
  }

  function validateCurrentStep() {
    if (step === 0 && (!business.name.trim() || !business.slug.trim())) return 'Въведи име на бизнеса и адрес за страницата.'
    if (step === 1 && services.some((service) => !service.name.trim() || Number(service.price) < 0 || Number(service.duration_min) <= 0)) return 'Попълни правилно име, цена и продължителност за всяка услуга.'
    if (step === 2 && staff.some((person) => !person.name.trim())) return 'Въведи име за всеки член на екипа.'
    if (step === 3) {
      const enabled = schedule.filter((day) => day.enabled)
      if (!enabled.length) return 'Избери поне един работен ден.'
      if (enabled.some((day) => day.close <= day.open)) return 'Крайният час трябва да е след началния час.'
    }
    return ''
  }

  function next() {
    const validationError = validateCurrentStep()
    if (validationError) { setError(validationError); return }
    setError('')
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  async function save() {
    setError('')
    setSaving(true)
    let createdBusinessId = null
    try {
      const { data: createdBusiness, error: businessError } = await supabase.from('businesses').insert({
        owner_id: session.user.id,
        name: business.name.trim(),
        slug: business.slug.trim(),
        phone: business.phone.trim() || null,
        contact_email: business.contact_email.trim() || null,
        address: business.address.trim() || null,
        timezone: business.timezone,
        industry: business.industry,
        languages: ['bg'],
      }).select().single()
      if (businessError) throw businessError
      createdBusinessId = createdBusiness.id

      const { data: createdServices, error: servicesError } = await supabase.from('services').insert(services.map((service) => ({
        business_id: createdBusinessId,
        name: service.name.trim(),
        price: Number(service.price),
        currency: 'EUR',
        duration_min: Number(service.duration_min),
      }))).select()
      if (servicesError) throw servicesError

      const { data: createdStaff, error: staffError } = await supabase.from('staff').insert(staff.map((person) => ({ business_id: createdBusinessId, name: person.name.trim() }))).select()
      if (staffError) throw staffError

      const hours = createdStaff.flatMap((person) => schedule.filter((day) => day.enabled).map((day) => ({
        business_id: createdBusinessId,
        staff_id: person.id,
        weekday: day.weekday,
        open_time: day.open,
        close_time: day.close,
      })))
      const { error: hoursError } = await supabase.from('working_hours').insert(hours)
      if (hoursError) throw hoursError

      onComplete({ business: createdBusiness, services: createdServices, staff: createdStaff, schedule })
    } catch (saveError) {
      if (createdBusinessId) await supabase.from('businesses').delete().eq('id', createdBusinessId)
      const duplicateSlug = saveError.code === '23505'
      setError(duplicateSlug ? 'Този адрес вече се използва. Върни се назад и избери друг.' : `Не успяхме да запазим настройките: ${saveError.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="setup-layout">
      <aside className="steps-card" aria-label="Стъпки за настройка">
        {STEPS.map(([label, help], index) => (
          <div className={`step-item ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`} key={label}>
            <span className="step-number">{index < step ? <Icon name="check" /> : index + 1}</span>
            <span className="step-label">{label}<span className="step-help">{help}</span></span>
          </div>
        ))}
      </aside>

      <section className="wizard-card">
        <header className="wizard-head">
          <small>Стъпка {step + 1} от {STEPS.length}</small>
          <h3>{stepContent[step][0]}</h3>
          <p>{stepContent[step][1]}</p>
        </header>
        <div className="wizard-body">
          {step === 0 && (
            <div className="form-grid">
              <div className="field full"><label htmlFor="business-name">Име на бизнеса *</label><input id="business-name" className="text-input" value={business.name} onChange={(event) => updateBusiness('name', event.target.value)} placeholder="Напр. Studio Forma" autoFocus /></div>
              <div className="field"><label htmlFor="business-phone">Телефон</label><input id="business-phone" className="text-input" value={business.phone} onChange={(event) => updateBusiness('phone', event.target.value)} placeholder="+359 88 123 4567" type="tel" /></div>
              <div className="field"><label htmlFor="business-email">Имейл за резервации</label><input id="business-email" className="text-input" value={business.contact_email} onChange={(event) => updateBusiness('contact_email', event.target.value)} placeholder="office@business.bg" type="email" /></div>
              <div className="field"><label htmlFor="business-industry">Тип бизнес</label><select id="business-industry" className="select-input" value={business.industry} onChange={(event) => updateBusiness('industry', event.target.value)}><option value="beauty">Красота и салони</option><option value="auto">Авто услуги и сервизи</option><option value="fitness">Спорт и фитнес</option><option value="education">Обучение</option><option value="consulting">Консултации</option><option value="home_services">Услуги на адрес</option><option value="pets">Домашни любимци</option><option value="health">Здравни услуги</option><option value="other">Друг бизнес с часове</option></select></div>
              <div className="field"><label htmlFor="business-timezone">Часова зона</label><select id="business-timezone" className="select-input" value={business.timezone} onChange={(event) => updateBusiness('timezone', event.target.value)}><option value="Europe/Sofia">София (GMT+2/+3)</option><option value="Europe/London">Лондон</option><option value="Europe/Berlin">Берлин</option></select></div>
              <div className="field full"><label htmlFor="business-address">Адрес</label><input id="business-address" className="text-input" value={business.address} onChange={(event) => updateBusiness('address', event.target.value)} placeholder="ул. Примерна 12, София" /></div>
              <div className="field full"><label htmlFor="business-slug">Адрес на публичната страница *</label><input id="business-slug" className="text-input" value={business.slug} onChange={(event) => { setSlugTouched(true); updateBusiness('slug', slugify(event.target.value)) }} placeholder="studio-forma" /><p className="helper-text">ai-receptionist.app/{business.slug || 'твоят-бизнес'}</p></div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="repeat-list">
                {services.map((service, index) => (
                  <div className="repeat-row" key={index}>
                    <div><label className="compact-label" htmlFor={`service-${index}`}>Услуга</label><input id={`service-${index}`} className="compact-input" value={service.name} onChange={(event) => updateList(setServices, index, 'name', event.target.value)} placeholder="Подстригване" autoFocus={index === 0} /></div>
                    <div><label className="compact-label" htmlFor={`price-${index}`}>Цена (€)</label><input id={`price-${index}`} className="compact-input" type="number" min="0" step="0.01" value={service.price} onChange={(event) => updateList(setServices, index, 'price', event.target.value)} /></div>
                    <div><label className="compact-label" htmlFor={`duration-${index}`}>Минути</label><input id={`duration-${index}`} className="compact-input" type="number" min="5" step="5" value={service.duration_min} onChange={(event) => updateList(setServices, index, 'duration_min', event.target.value)} /></div>
                    <button className="icon-button" type="button" aria-label="Премахни услугата" onClick={() => removeListRow(setServices, index)} disabled={services.length === 1}><Icon name="trash" /></button>
                  </div>
                ))}
              </div>
              <button className="add-row-button" type="button" onClick={() => setServices((current) => [...current, { name: '', price: '25', duration_min: '30' }])}><Icon name="plus" /> Добави още услуга</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="repeat-list">
                {staff.map((person, index) => (
                  <div className="repeat-row staff-row" key={index}>
                    <div><label className="compact-label" htmlFor={`staff-${index}`}>Име</label><input id={`staff-${index}`} className="compact-input" value={person.name} onChange={(event) => updateList(setStaff, index, 'name', event.target.value)} placeholder={index === 0 ? 'Твоето име' : 'Име на служител'} autoFocus={index === 0} /></div>
                    <button className="icon-button" type="button" aria-label="Премахни служителя" onClick={() => removeListRow(setStaff, index)} disabled={staff.length === 1}><Icon name="trash" /></button>
                  </div>
                ))}
              </div>
              <button className="add-row-button" type="button" onClick={() => setStaff((current) => [...current, { name: '' }])}><Icon name="plus" /> Добави човек</button>
            </div>
          )}

          {step === 3 && (
            <div className="schedule-list">
              {schedule.map((day, index) => (
                <div className="schedule-row" key={day.weekday}>
                  <span className="day-label">{day.short}</span>
                  <label className="day-toggle"><input type="checkbox" checked={day.enabled} onChange={(event) => updateList(setSchedule, index, 'enabled', event.target.checked)} aria-label={`${day.label} е работен ден`} /><span className="toggle-track" /></label>
                  <input className="time-input" type="time" value={day.open} disabled={!day.enabled} onChange={(event) => updateList(setSchedule, index, 'open', event.target.value)} aria-label={`Начален час за ${day.label}`} />
                  <span>—</span>
                  <input className="time-input" type="time" value={day.close} disabled={!day.enabled} onChange={(event) => updateList(setSchedule, index, 'close', event.target.value)} aria-label={`Краен час за ${day.label}`} />
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="review-grid">
              <div className="review-card full"><span className="review-icon"><Icon name="store" /></span><small>Бизнес</small><strong>{business.name}</strong><p>{business.address || 'Без добавен физически адрес'}{business.phone ? ` · ${business.phone}` : ''}</p></div>
              <div className="review-card"><span className="review-icon"><Icon name="briefcase" /></span><small>Услуги</small><strong>{services.length} {services.length === 1 ? 'услуга' : 'услуги'}</strong><p>{services.map((service) => service.name).join(', ')}</p></div>
              <div className="review-card"><span className="review-icon"><Icon name="users" /></span><small>Екип</small><strong>{staff.length} {staff.length === 1 ? 'човек' : 'души'}</strong><p>{staff.map((person) => person.name).join(', ')}</p></div>
              <div className="review-card full"><span className="review-icon"><Icon name="clock" /></span><small>Работно време</small><strong>{schedule.filter((day) => day.enabled).length} работни дни</strong><p>{schedule.filter((day) => day.enabled).map((day) => `${day.short} ${day.open}–${day.close}`).join(' · ')}</p></div>
            </div>
          )}

          {error && <p className="form-message" role="alert" style={{ marginTop: 20 }}>{error}</p>}
        </div>
        <footer className="wizard-actions">
          <button className="secondary-button" type="button" onClick={() => { setError(''); setStep((current) => Math.max(0, current - 1)) }} disabled={step === 0 || saving}><Icon name="back" /> Назад</button>
          {step < STEPS.length - 1
            ? <button className="primary-button" type="button" onClick={next}>Продължи <Icon name="arrow" /></button>
            : <button className="primary-button accent" type="button" onClick={save} disabled={saving}>{saving ? <span className="button-spinner" /> : <Icon name="check" />}{saving ? 'Запазване...' : 'Завърши настройката'}</button>}
        </footer>
      </section>
    </div>
  )
}

function ReadyDashboard({ data }) {
  const { business, services, staff, schedule, appointmentsCount = 0 } = data
  const openDays = schedule?.filter((day) => day.enabled).length || 0
  const stats = [
    ['calendar', 'Резервации', appointmentsCount],
    ['briefcase', 'Активни услуги', services.length],
    ['users', 'Членове на екипа', staff.length],
    ['clock', 'Работни дни', openDays],
  ]
  return (
    <>
      <div className="stats-grid">
        {stats.map(([icon, label, value]) => <article className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} /></span></div><p className="stat-value">{value}</p></article>)}
      </div>
      <div className="dashboard-grid">
        <section className="content-card">
          <div className="card-head"><h3>Твоите услуги</h3></div>
          {services.length ? <div className="service-list">{services.map((service) => <div className="service-item" key={service.id || service.name}><span className="service-avatar">{service.name.slice(0, 1).toUpperCase()}</span><div><p className="service-name">{service.name}</p><p className="service-meta">{service.duration_min} минути</p></div><span className="service-price">{formatPrice(service.price)}</span></div>)}</div> : <div className="empty-state">Все още няма добавени услуги.</div>}
        </section>
        <section className="content-card">
          <div className="card-head"><h3>Бизнес профил</h3></div>
          <div className="business-summary">
            <div className="summary-row"><Icon name="store" /><span><strong>{business.name}</strong><br />/{business.slug}</span></div>
            {business.address && <div className="summary-row"><Icon name="pin" /><span>{business.address}</span></div>}
            {business.phone && <div className="summary-row"><Icon name="phone" /><span>{business.phone}</span></div>}
            <div className="summary-row"><Icon name="clock" /><span>{business.timezone}</span></div>
          </div>
        </section>
      </div>
    </>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('loading')
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')

  const loadBusiness = useCallback(async (activeSession) => {
    setStatus('loading')
    const { data: business, error } = await supabase.from('businesses').select('*').eq('owner_id', activeSession.user.id).order('created_at', { ascending: true }).limit(1).maybeSingle()
    if (error) { setLoadError(getDatabaseErrorMessage(error)); setStatus('error'); return }
    if (!business) { setStatus('setup'); return }

    const [servicesResult, staffResult, hoursResult, appointmentsResult] = await Promise.all([
      supabase.from('services').select('*').eq('business_id', business.id).eq('active', true).order('name'),
      supabase.from('staff').select('*').eq('business_id', business.id).eq('active', true).order('name'),
      supabase.from('working_hours').select('*').eq('business_id', business.id).order('weekday'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    ])
    const firstError = [servicesResult, staffResult, hoursResult, appointmentsResult].find((result) => result.error)?.error
    if (firstError) { setLoadError(getDatabaseErrorMessage(firstError)); setStatus('error'); return }

    const schedule = WEEK.map((day) => {
      const hours = hoursResult.data.find((row) => row.weekday === day.weekday)
      return { ...day, enabled: Boolean(hours), open: hours?.open_time?.slice(0, 5) || '09:00', close: hours?.close_time?.slice(0, 5) || '18:00' }
    })
    setData({ business, services: servicesResult.data, staff: staffResult.data, schedule, appointmentsCount: appointmentsResult.count || 0 })
    setStatus('ready')
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig) { setStatus('config'); return }
    let mounted = true
    supabase.auth.getSession().then(({ data: authData }) => {
      if (!mounted) return
      if (!authData.session) { router.replace('/'); return }
      setSession(authData.session)
      loadBusiness(authData.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) router.replace('/')
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [loadBusiness, router])

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Добро утро'
    if (hour < 18) return 'Добър ден'
    return 'Добър вечер'
  }, [])

  if (status === 'config') return <div className="config-warning"><h2>Липсва Supabase конфигурация</h2><p>Добави следните стойности в локален <code>.env.local</code> файл. Не ги качвай в GitHub.</p><code>NEXT_PUBLIC_SUPABASE_URL=...</code><code>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</code></div>
  if (status === 'loading' || !session) return <div className="loading-screen"><div className="loading-box"><span className="button-spinner" /><span>Подготвяме твоето табло...</span></div></div>

  return (
    <DashboardShell email={session.user.email} title={data?.business?.name || 'Настройка на бизнеса'} businessSlug={data?.business?.slug} onLogout={logout}>
      <main className="dashboard-content">
        <div className="page-intro">
          <div>
            <p className="auth-kicker">{status === 'ready' ? 'Твоето табло' : 'Първоначална настройка'}</p>
            <h2>{status === 'ready' ? `${greeting}, ${data.business.name}` : 'Да настроим твоя AI рецепционист.'}</h2>
            <p>{status === 'ready' ? 'Ето какво се случва в бизнеса ти в момента.' : 'Ще ни отнеме около 3 минути. После ще можеш да приемаш резервации без излишна кореспонденция.'}</p>
          </div>
        </div>
        {status === 'error' && <div className="form-message"><strong>Не успяхме да заредим данните.</strong><br />{loadError}</div>}
        {status === 'setup' && <Wizard session={session} onComplete={(result) => { setData({ ...result, appointmentsCount: 0 }); setStatus('ready') }} />}
        {status === 'ready' && <ReadyDashboard data={data} />}
      </main>
    </DashboardShell>
  )
}
