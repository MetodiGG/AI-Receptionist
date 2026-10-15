'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Icon } from './icon'
import { getIndustryServiceTemplate } from '../lib/industry-templates.mjs'
import { BusinessLocationFields } from './business-location-fields'
import { WeeklyScheduleFields } from './weekly-schedule-fields'
import { businessAddress, businessLocationFields, findCity } from '../lib/business-location.mjs'
import { DURATION_OPTIONS, validDuration, scheduleProblem, scheduleRows, scheduleErrorText } from '../lib/business-schedule.mjs'

const WEEK = {
  bg: [
    { weekday: 1, label: 'Понеделник', short: 'Пон' }, { weekday: 2, label: 'Вторник', short: 'Вто' },
    { weekday: 3, label: 'Сряда', short: 'Сря' }, { weekday: 4, label: 'Четвъртък', short: 'Чет' },
    { weekday: 5, label: 'Петък', short: 'Пет' }, { weekday: 6, label: 'Събота', short: 'Съб' },
    { weekday: 7, label: 'Неделя', short: 'Нед' },
  ],
  en: [
    { weekday: 1, label: 'Monday', short: 'Mon' }, { weekday: 2, label: 'Tuesday', short: 'Tue' },
    { weekday: 3, label: 'Wednesday', short: 'Wed' }, { weekday: 4, label: 'Thursday', short: 'Thu' },
    { weekday: 5, label: 'Friday', short: 'Fri' }, { weekday: 6, label: 'Saturday', short: 'Sat' },
    { weekday: 7, label: 'Sunday', short: 'Sun' },
  ],
}

function createInitialSchedule(locale) {
  return WEEK[locale].map((day) => ({
  ...day,
  enabled: day.weekday <= 5,
  open: day.weekday <= 5 ? '09:00' : '10:00',
  close: day.weekday <= 5 ? '18:00' : '14:00',
  breakEnabled: false, breakStart: '12:00', breakEnd: '13:00',
  }))
}

const STEPS = {
  bg: [['Бизнес', 'Основни данни'], ['Услуги', 'Какво предлагаш'], ['Екип', 'Кой работи'], ['График', 'Работно време'], ['Преглед', 'Потвърждение']],
  en: [['Business', 'Basic details'], ['Services', 'What you offer'], ['Team', 'Who works here'], ['Schedule', 'Working hours'], ['Review', 'Confirmation']],
}

function slugify(value) {
  const map = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: '', ю: 'yu', я: 'ya' }
  return value.toLowerCase().split('').map((char) => map[char] ?? char).join('').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
}

export function BusinessSetup({ session, onComplete, locale, preview = false }) {
  const en = locale === 'en'
  const steps = STEPS[locale]
  const [step, setStep] = useState(0)
  const [business, setBusiness] = useState({ name: '', slug: '', phone: '', contact_email: session.user.email || '', address: '', timezone: 'Europe/Sofia', industry: 'other', city_ekatte: '', neighborhood: '', default_duration_min: '45', booking_slot_minutes: '15' })
  const [services, setServices] = useState([{ name: '', price: '25', duration_min: '45' }])
  const [staff, setStaff] = useState([{ name: '' }])
  const [schedule, setSchedule] = useState(() => createInitialSchedule(locale))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)

  const stepContent = en ? [
    ['Tell us about your business', 'This information helps the online assistant present your business correctly.'],
    ['Add your services', 'Price and duration let us offer only suitable available times.'],
    ['Who will serve clients?', 'Add yourself and everyone clients can book with.'],
    ['When are you open?', 'Choose working days and recurring breaks, such as lunch from 12:00 to 13:00.'],
    ['Everything looks good', 'Review your setup. Your new dashboard will be ready immediately after saving.'],
  ] : [
    ['Нека опознаем бизнеса ти', 'Тази информация ще помогне на онлайн асистента да представя бизнеса ти правилно.'],
    ['Добави услугите си', 'Цената и продължителността са нужни, за да предлагаме само подходящи свободни часове.'],
    ['Кой ще приема клиенти?', 'Добави себе си и останалите хора, за които клиентите могат да резервират час.'],
    ['Кога работите?', 'Избери работни дни и повтарящи се почивки, например обяд от 12:00 до 13:00.'],
    ['Всичко изглежда добре', 'Прегледай настройките. След запазване веднага ще видиш новото си табло.'],
  ]

  useEffect(() => {
    setError('')
    setSchedule((current) => current.map((day) => ({ ...day, ...WEEK[locale].find((item) => item.weekday === day.weekday) })))
  }, [locale])

  function updateBusiness(field, value) {
    if (field === 'default_duration_min') setServices((current) => current.map((service) => service.name.trim() ? service : { ...service, duration_min: value }))
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

  function validateCurrentStep(currentStep = step) {
    if (currentStep === 0 && (!business.name.trim() || !business.slug.trim())) return en ? 'Enter a business name and page address.' : 'Въведи име на бизнеса и адрес за страницата.'
    if (currentStep === 0 && !findCity(business.city_ekatte)) return en ? 'Choose your business city from the list.' : 'Избери града на бизнеса от списъка.'
    if (currentStep === 0 && !validDuration(business.default_duration_min)) return en ? 'Choose a valid usual appointment duration.' : 'Избери валидна обичайна продължителност на часа.'
    if (currentStep === 1 && (!services.length || services.some((service) => !service.name.trim() || service.price === '' || !Number.isFinite(Number(service.price)) || Number(service.price) < 0 || !validDuration(service.duration_min)))) return en ? 'Enter a valid name, price and duration (5–1440 minutes) for every service.' : 'Попълни правилно име, цена и продължителност (5–1440 минути) за всяка услуга.'
    if (currentStep === 2 && (!staff.length || staff.some((person) => !person.name.trim()))) return en ? 'Enter a name for every team member.' : 'Въведи име за всеки член на екипа.'
    if (currentStep === 3) {
      const enabled = schedule.filter((day) => day.enabled)
      if (!enabled.length) return en ? 'Choose at least one working day.' : 'Избери поне един работен ден.'
      const problem = scheduleProblem(schedule)
      if (problem) return scheduleErrorText(problem, locale)
    }
    return ''
  }

  function next() {
    const validationError = validateCurrentStep()
    if (validationError) { setError(validationError); return }
    setError('')
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  async function save() {
    for (let index = 0; index < 4; index++) {
      const problem = validateCurrentStep(index)
      if (problem) { setError(problem); setStep(index); return }
    }
    setError('')
    setSaving(true)
    let createdBusinessId = null
    try {
      if (preview) { onComplete({ business, services, staff, schedule }); return }
      const { data: createdBusiness, error: businessError } = await supabase.from('businesses').insert({
        owner_id: session.user.id,
        name: business.name.trim(),
        slug: business.slug.trim(),
        phone: business.phone.trim() || null,
        contact_email: business.contact_email.trim() || null,
        address: business.address.trim() || null,
        timezone: business.timezone,
        industry: business.industry,
        ...businessLocationFields(business.city_ekatte, business.neighborhood),
        default_duration_min: Number(business.default_duration_min),
        booking_slot_minutes: Number(business.booking_slot_minutes),
        languages: ['bg', 'en'],
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

      const hours = createdStaff.flatMap((person) => scheduleRows(schedule).map((day) => ({
        business_id: createdBusinessId,
        staff_id: person.id,
        ...day,
      })))
      const { error: hoursError } = await supabase.from('working_hours').insert(hours)
      if (hoursError) throw hoursError

      onComplete({ business: createdBusiness, services: createdServices, staff: createdStaff, schedule })
    } catch (saveError) {
      if (createdBusinessId) await supabase.from('businesses').delete().eq('id', createdBusinessId)
      const duplicateSlug = saveError.code === '23505'
      setError(duplicateSlug
        ? (en ? 'This page address is already in use. Go back and choose another one.' : 'Този адрес вече се използва. Върни се назад и избери друг.')
        : `${en ? 'We could not save the setup' : 'Не успяхме да запазим настройките'}: ${saveError.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="setup-layout">
      <aside className="steps-card" aria-label={en ? 'Setup steps' : 'Стъпки за настройка'}>
        {steps.map(([label, help], index) => (
          <div className={`step-item ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`} key={label}>
            <span className="step-number">{index < step ? <Icon name="check" /> : index + 1}</span>
            <span className="step-label">{label}<span className="step-help">{help}</span></span>
          </div>
        ))}
      </aside>

      <section className="wizard-card">
        <header className="wizard-head">
          <small>{en ? 'Step' : 'Стъпка'} {step + 1} {en ? 'of' : 'от'} {steps.length}</small>
          <h3>{stepContent[step][0]}</h3>
          <p>{stepContent[step][1]}</p>
        </header>
        <div className="wizard-body">
          {step === 0 && (
            <div className="form-grid">
              <div className="field full"><label htmlFor="business-name">{en ? 'Business name' : 'Име на бизнеса'} *</label><input id="business-name" className="text-input" value={business.name} onChange={(event) => updateBusiness('name', event.target.value)} placeholder={en ? 'e.g. Studio Forma' : 'Напр. Studio Forma'} autoFocus /></div>
              <div className="field"><label htmlFor="business-phone">{en ? 'Phone' : 'Телефон'}</label><input id="business-phone" className="text-input" value={business.phone} onChange={(event) => updateBusiness('phone', event.target.value)} placeholder="+359 88 123 4567" type="tel" /></div>
              <div className="field"><label htmlFor="business-email">{en ? 'Booking email' : 'Имейл за резервации'}</label><input id="business-email" className="text-input" value={business.contact_email} onChange={(event) => updateBusiness('contact_email', event.target.value)} placeholder="office@business.com" type="email" /></div>
              <div className="field"><label htmlFor="business-industry">{en ? 'Business type' : 'Тип бизнес'}</label><select id="business-industry" className="select-input" value={business.industry} onChange={(event) => updateBusiness('industry', event.target.value)}><option value="beauty">{en ? 'Beauty & salons' : 'Красота и салони'}</option><option value="auto">{en ? 'Auto services & repair shops' : 'Авто услуги и сервизи'}</option><option value="fitness">{en ? 'Sport & fitness' : 'Спорт и фитнес'}</option><option value="education">{en ? 'Education' : 'Обучение'}</option><option value="consulting">{en ? 'Consulting' : 'Консултации'}</option><option value="home_services">{en ? 'Home services' : 'Услуги на адрес'}</option><option value="pets">{en ? 'Pet services' : 'Домашни любимци'}</option><option value="health">{en ? 'Health services' : 'Здравни услуги'}</option><option value="other">{en ? 'Other appointment business' : 'Друг бизнес с часове'}</option></select></div>
              <div className="field"><label htmlFor="business-timezone">{en ? 'Time zone' : 'Часова зона'}</label><select id="business-timezone" className="select-input" value={business.timezone} onChange={(event) => updateBusiness('timezone', event.target.value)}><option value="Europe/Sofia">{en ? 'Sofia' : 'София'} (GMT+2/+3)</option><option value="Europe/London">{en ? 'London' : 'Лондон'}</option><option value="Europe/Berlin">{en ? 'Berlin' : 'Берлин'}</option></select></div>
              <div className="field full"><BusinessLocationFields required cityCode={business.city_ekatte} neighborhood={business.neighborhood} onChange={(patch) => setBusiness((current) => ({ ...current, ...patch }))} locale={locale} /></div>
              <div className="field full duration-setup"><label htmlFor="usual-duration">{en ? 'How long does an appointment usually take?' : 'Колко дълго обикновено продължава един час?'} *</label><select id="usual-duration" className="select-input" value={business.default_duration_min} onChange={(event) => updateBusiness('default_duration_min', event.target.value)}>{DURATION_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} {en ? 'minutes' : 'минути'}</option>)}</select><p className="helper-text">{en ? 'Used as the starting duration for new services. Set the exact time for each service in the next step. A 45-minute service blocks the entire 45 minutes for that specialist.' : 'Начална продължителност за новите услуги. В следващата стъпка задай точното време за всяка услуга. Услуга от 45 минути блокира целите 45 минути за специалиста.'}</p></div>
              <div className="field full"><label htmlFor="business-address">{en ? 'Address' : 'Адрес'}</label><input id="business-address" className="text-input" value={business.address} onChange={(event) => updateBusiness('address', event.target.value)} placeholder={en ? '12 Example Street, Sofia' : 'ул. Примерна 12, София'} /></div>
              <div className="field full"><label htmlFor="business-slug">{en ? 'Public page address' : 'Адрес на публичната страница'} *</label><input id="business-slug" className="text-input" value={business.slug} onChange={(event) => { setSlugTouched(true); updateBusiness('slug', slugify(event.target.value)) }} placeholder="studio-forma" /><p className="helper-text">GoRez · /book/{business.slug || (en ? 'your-business' : 'твоят-бизнес')}</p></div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="duration-explainer">{en ? 'Duration is the time reserved for the entire service. For example: 10:00–10:45. No other client can book the same specialist during that period.' : 'Продължителността е времето, запазено за цялата услуга. Например: 10:00–10:45. През този период друг клиент не може да резервира при същия специалист.'}</p>
              <div className="service-template-callout"><div><strong>{en ? 'Ready-made suggestions for your business type' : 'Готови предложения за твоя тип бизнес'}</strong><span>{en ? 'Load sample services and adjust their prices and duration.' : 'Зареди примерни услуги и ги промени според цените и времената си.'}</span></div><button type="button" onClick={() => setServices(getIndustryServiceTemplate(business.industry, locale))}>{en ? 'Load suggestions' : 'Зареди предложения'}</button></div>
              <div className="repeat-list">
                {services.map((service, index) => (
                  <div className="repeat-row" key={index}>
                    <div><label className="compact-label" htmlFor={`service-${index}`}>{en ? 'Service' : 'Услуга'}</label><input id={`service-${index}`} className="compact-input" value={service.name} onChange={(event) => updateList(setServices, index, 'name', event.target.value)} placeholder={en ? 'Haircut' : 'Подстригване'} autoFocus={index === 0} /></div>
                    <div><label className="compact-label" htmlFor={`price-${index}`}>{en ? 'Price' : 'Цена'} (€)</label><input id={`price-${index}`} className="compact-input" type="number" min="0" step="0.01" value={service.price} onChange={(event) => updateList(setServices, index, 'price', event.target.value)} /></div>
                    <div><label className="compact-label" htmlFor={`duration-${index}`}>{en ? 'Duration (min)' : 'Продължителност (мин)'}</label><input id={`duration-${index}`} className="compact-input" type="number" min="5" max="1440" step="1" value={service.duration_min} onChange={(event) => updateList(setServices, index, 'duration_min', event.target.value)} /></div>
                    <button className="icon-button" type="button" aria-label={en ? 'Remove service' : 'Премахни услугата'} onClick={() => removeListRow(setServices, index)} disabled={services.length === 1}><Icon name="trash" /></button>
                  </div>
                ))}
              </div>
              <button className="add-row-button" type="button" onClick={() => setServices((current) => [...current, { name: '', price: '25', duration_min: business.default_duration_min }])}><Icon name="plus" /> {en ? 'Add another service' : 'Добави още услуга'}</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="repeat-list">
                {staff.map((person, index) => (
                  <div className="repeat-row staff-row" key={index}>
                    <div><label className="compact-label" htmlFor={`staff-${index}`}>{en ? 'Name' : 'Име'}</label><input id={`staff-${index}`} className="compact-input" value={person.name} onChange={(event) => updateList(setStaff, index, 'name', event.target.value)} placeholder={index === 0 ? (en ? 'Your name' : 'Твоето име') : (en ? 'Team member name' : 'Име на служител')} autoFocus={index === 0} /></div>
                    <button className="icon-button" type="button" aria-label={en ? 'Remove team member' : 'Премахни служителя'} onClick={() => removeListRow(setStaff, index)} disabled={staff.length === 1}><Icon name="trash" /></button>
                  </div>
                ))}
              </div>
              <button className="add-row-button" type="button" onClick={() => setStaff((current) => [...current, { name: '' }])}><Icon name="plus" /> {en ? 'Add team member' : 'Добави човек'}</button>
            </div>
          )}

          {step === 3 && (
            <WeeklyScheduleFields days={schedule} onChange={setSchedule} locale={locale} disabled={saving} />
          )}

          {step === 4 && (
            <div className="review-grid">
              <div className="review-card full"><span className="review-icon"><Icon name="store" /></span><small>{en ? 'Business' : 'Бизнес'}</small><strong>{business.name}</strong><p>{businessAddress({ ...business, ...businessLocationFields(business.city_ekatte, business.neighborhood) }, locale)}{business.phone ? ` · ${business.phone}` : ''}</p></div>
              <div className="review-card"><span className="review-icon"><Icon name="briefcase" /></span><small>{en ? 'Services' : 'Услуги'}</small><strong>{services.length} {en ? (services.length === 1 ? 'service' : 'services') : (services.length === 1 ? 'услуга' : 'услуги')}</strong><p>{services.map((service) => `${service.name} · ${service.duration_min} ${en ? 'min' : 'мин.'}`).join(', ')}</p></div>
              <div className="review-card"><span className="review-icon"><Icon name="users" /></span><small>{en ? 'Team' : 'Екип'}</small><strong>{staff.length} {en ? (staff.length === 1 ? 'person' : 'people') : (staff.length === 1 ? 'човек' : 'души')}</strong><p>{staff.map((person) => person.name).join(', ')}</p></div>
              <div className="review-card full"><span className="review-icon"><Icon name="clock" /></span><small>{en ? 'Working hours' : 'Работно време'}</small><strong>{schedule.filter((day) => day.enabled).length} {en ? 'working days' : 'работни дни'}</strong><p>{schedule.filter((day) => day.enabled).map((day) => `${day.short} ${day.open}–${day.close}${day.breakEnabled ? ` (${en ? 'break' : 'почивка'} ${day.breakStart}–${day.breakEnd})` : ''}`).join(' · ')}</p></div>
            </div>
          )}

          {error && <p className="form-message" role="alert" style={{ marginTop: 20 }}>{error}</p>}
        </div>
        <footer className="wizard-actions">
          <button className="secondary-button" type="button" onClick={() => { setError(''); setStep((current) => Math.max(0, current - 1)) }} disabled={step === 0 || saving}><Icon name="back" /> {en ? 'Back' : 'Назад'}</button>
          {step < steps.length - 1
            ? <button className="primary-button" type="button" onClick={next}>{en ? 'Continue' : 'Продължи'} <Icon name="arrow" /></button>
            : <button className="primary-button accent" type="button" onClick={save} disabled={saving}>{saving ? <span className="button-spinner" /> : <Icon name="check" />}{saving ? (en ? 'Saving...' : 'Запазване...') : (en ? 'Complete setup' : 'Завърши настройката')}</button>}
        </footer>
      </section>
    </div>
  )
}
