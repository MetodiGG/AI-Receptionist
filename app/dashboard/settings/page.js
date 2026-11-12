'use client'

import Link from 'next/link'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'
import { getBookingIntake } from '../../../lib/booking-intake.mjs'
import { BusinessLocationFields } from '../../../components/business-location-fields'
import { WeeklyScheduleFields } from '../../../components/weekly-schedule-fields'
import { AccountDeletionPanel } from '../../../components/account-deletion-panel'
import { BusinessPublicProfileEditor } from '../../../components/business-public-profile-editor'
import { BusinessMediaEditor } from '../../../components/business-media-editor'
import { useUnsavedChanges } from '../../../hooks/use-unsaved-changes'
import { BusinessBookingSettings } from '../../../components/business-booking-settings'
import { ServicePricingFields } from '../../../components/service-pricing-fields'
import { ServiceNameInput } from '../../../components/service-name-input'
import { editableServiceSchema } from '../../../lib/service-pricing.mjs'
import { businessLocationFields, findCity } from '../../../lib/business-location.mjs'
import { DURATION_OPTIONS, validDuration, scheduleFromHours, scheduleProblem, scheduleRows, scheduleErrorText, scheduleWriteError } from '../../../lib/business-schedule.mjs'

const WEEK = {
  bg: [[1, 'Понеделник'], [2, 'Вторник'], [3, 'Сряда'], [4, 'Четвъртък'], [5, 'Петък'], [6, 'Събота'], [7, 'Неделя']],
  en: [[1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday'], [7, 'Sunday']],
}

function defaultSchedule(locale) {
  return WEEK[locale].map(([weekday, label]) => ({ weekday, label, enabled: weekday <= 5, open: '09:00', close: '18:00' }))
}

export function SettingsContent({ business, refreshBusiness, locale, preview = false, previewCollections = {} }) {
  const en = locale === 'en'
  const [profile, setProfile] = useState({
    name: business.name || '', phone: business.phone || '', address: business.address || '', timezone: business.timezone || 'Europe/Sofia',
    welcome_message: business.welcome_message || '', bot_instructions: business.bot_instructions || '', booking_window_days: business.booking_window_days || 60,
    minimum_notice_minutes: business.minimum_notice_minutes ?? 60, cancellation_notice_hours: business.cancellation_notice_hours ?? 12,
    industry: business.industry || 'other', contact_email: business.contact_email || '', website_url: business.website_url || '',
    privacy_contact_email: business.privacy_contact_email || '', booking_terms: business.booking_terms || '',
    email_notifications_enabled: business.email_notifications_enabled ?? true,
    notification_locale: business.notification_locale || locale,
    city_ekatte: business.city_ekatte || '', neighborhood: business.neighborhood || '',
    default_duration_min: business.default_duration_min ?? 45, booking_slot_minutes: business.booking_slot_minutes ?? 15,
  })
  const [services, setServices] = useState(preview ? previewCollections.services || [] : [])
  const [staff, setStaff] = useState(preview ? previewCollections.staff || [] : [])
  const [hours, setHours] = useState(preview ? previewCollections.hours || [] : [])
  const [timeOff, setTimeOff] = useState([])
  const [newTimeOff, setNewTimeOff] = useState({ staff_id: '', starts_at: '', ends_at: '', reason: '' })
  const [selectedStaff, setSelectedStaff] = useState(preview ? previewCollections.staff?.[0]?.id || '' : '')
  const [schedule, setSchedule] = useState(() => defaultSchedule(locale))
  const [section, setSection] = useState('business')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [notificationStatus, setNotificationStatus] = useState(null)
  const [dirtySections,setDirtySections] = useState({})
  useUnsavedChanges(Object.values(dirtySections).some(Boolean),locale)
  const sections=[['business',en?'Business information':'Данни за бизнеса'],['public',en?'Public profile & reviews':'Публична страница и отзиви'],['photos',en?'Photos':'Снимки'],['services',en?'Services':'Услуги'],['staff',en?'Team':'Екип'],['booking',en?'Booking method':'Начин на резервация'],['hours',en?'Opening hours & schedule':'Работно време и график'],['timeoff',en?'Time off':'Отсъствия'],['assistant',en?'Assistant':'Асистент'],['data',en?'Data':'Данни'],['account',en?'Account':'Акаунт']]
  function changeSection(next) {
    if(saving)return
    if(['public','photos','booking'].includes(section)&&dirtySections[section]) {
      if(!window.confirm(en?'Leave this editor? Unsaved edits in it will be lost.':'Да напуснеш ли редактора? Незапазените промени в него ще се загубят.'))return
      setDirtySections(current=>({...current,[section]:false}))
    }
    setSection(next);setMessage(null)
  }
  const bookingIntake = getBookingIntake(profile.industry, locale)

  useEffect(() => {
    if (preview) return
    const controller = new AbortController()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const response = await fetch(`/api/owner/notifications?business_id=${business.id}`, { headers: { Authorization: `Bearer ${data.session.access_token}` }, signal: controller.signal, cache: 'no-store' })
      if (!response.ok) throw new Error('Unavailable')
      const result = await response.json()
      if (!controller.signal.aborted) setNotificationStatus(result.notifications)
    }).catch(() => { if (!controller.signal.aborted) setNotificationStatus({ unavailable: true }) })
    return () => controller.abort()
  }, [business.id, business.email_notifications_enabled])

  const loadCollections = useCallback(async () => {
    if (preview) return
    const [servicesResult, staffResult, hoursResult, timeOffResult] = await Promise.all([
      supabase.from('services').select('*').eq('business_id', business.id).eq('active', true).order('sort_order').order('name'),
      supabase.from('staff').select('*').eq('business_id', business.id).eq('active', true).order('sort_order').order('name'),
      supabase.from('working_hours').select('*').eq('business_id', business.id).order('weekday'),
      supabase.from('time_off').select('*').eq('business_id', business.id).gte('ends_at', new Date().toISOString()).order('starts_at'),
    ])
    const error = servicesResult.error || staffResult.error || hoursResult.error || timeOffResult.error
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setServices(servicesResult.data || [])
    setStaff(staffResult.data || [])
    setHours(hoursResult.data || [])
    setTimeOff(timeOffResult.data || [])
    setSelectedStaff((current) => current || staffResult.data?.[0]?.id || '')
  }, [business.id])

  useEffect(() => { loadCollections() }, [loadCollections])
  useEffect(() => { const requested=new URLSearchParams(window.location.search).get('section'); if (['timeoff','account','booking'].includes(requested)) setSection(requested) }, [])
  useEffect(() => {
    if (!selectedStaff) return
    setSchedule(scheduleFromHours(WEEK[locale], hours, selectedStaff))
  }, [hours, selectedStaff])
  useEffect(()=>{setSchedule(current=>current.map(day=>({...day,label:WEEK[locale].find(row=>row[0]===day.weekday)?.[1]})))},[locale])

  function showSuccess(text) {
    setDirtySections(current=>({...current,[section]:false}))
    setMessage({ type: 'success', text })
    window.setTimeout(() => setMessage(null), 3500)
  }

  async function saveProfile(event) {
    event.preventDefault()
    if(saving||preview)return
    if (section === 'business' && !findCity(profile.city_ekatte)) { setMessage({ type: 'error', text: en ? 'Choose your city from the list.' : 'Избери своя град от списъка.' }); return }
    if (!validDuration(profile.default_duration_min)) { setMessage({ type: 'error', text: en ? 'Enter a valid usual duration.' : 'Въведи валидна обичайна продължителност.' }); return }
    setSaving(true); setMessage(null)
    const { error } = await supabase.from('businesses').update({
      ...profile,
      ...(findCity(profile.city_ekatte) ? businessLocationFields(profile.city_ekatte, profile.neighborhood) : { city_ekatte: null, neighborhood: null }),
      default_duration_min: Number(profile.default_duration_min), booking_slot_minutes: Number(profile.booking_slot_minutes),
      booking_window_days: Number(profile.booking_window_days),
      minimum_notice_minutes: Number(profile.minimum_notice_minutes),
      cancellation_notice_hours: Number(profile.cancellation_notice_hours),
      contact_email: profile.contact_email.trim() || null,
      website_url: profile.website_url.trim() || null,
      privacy_contact_email: profile.privacy_contact_email.trim() || null,
      booking_terms: profile.booking_terms.trim() || null,
    }).eq('id', business.id)
    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    await refreshBusiness()
    showSuccess(en ? 'Settings saved.' : 'Настройките са запазени.')
  }

  async function addService() {
    if(saving||preview)return
    const external=['external','phone'].includes(business.booking_mode)
    const { data, error } = await supabase.from('services').insert({ business_id: business.id, name: en ? 'New service' : 'Нова услуга', price: external?null:0, currency: 'EUR', duration_min: external?null:business.default_duration_min ?? 45, sort_order: services.length }).select().single()
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setServices((current) => [...current, data])
  }

  async function saveService(service) {
    if(saving||preview)return
    const external=['external','phone'].includes(business.booking_mode),unknown=v=>v===''||v==null
    if (!service.name.trim() || (!(external&&unknown(service.duration_min))&&!validDuration(service.duration_min)) || (!(external&&unknown(service.price))&&(unknown(service.price)||!Number.isFinite(Number(service.price))||Number(service.price)<0))) { setMessage({ type: 'error', text: en ? 'Enter a service name, a non-negative price and a duration of 5–1440 minutes. External mode permits unknown values.' : 'Въведи име, неотрицателна цена и продължителност от 5 до 1440 минути. Външният режим допуска неизвестни стойности.' }); return }
    const parsed=editableServiceSchema.safeParse({name:service.name,price:service.price,currency:service.currency||'EUR',description:service.description||'',price_details:service.price_details||{},duration_min:service.duration_min})
    if(!parsed.success){setMessage({type:'error',text:en?'Check the price type, currency, maximum and units. A range needs a maximum at least equal to the starting price.':'Провери вида цена, валутата, максимума и единицата. Максималната цена в диапазона трябва да е поне колкото началната.'});return}
    setSaving(true)
    const { error } = await supabase.from('services').update({ ...parsed.data, description:parsed.data.description||null,category:service.category?.trim().slice(0,80)||null }).eq('id', service.id).eq('business_id', business.id)
    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    showSuccess(en ? 'Service saved.' : 'Услугата е запазена.')
  }

  async function archiveService(id) {
    if(saving||preview||!window.confirm(en?'Archive this service? Existing appointments will remain.':'Да архивирам ли услугата? Съществуващите резервации остават.'))return
    const { error } = await supabase.from('services').update({ active: false }).eq('id', id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setServices((current) => current.filter((item) => item.id !== id))
  }

  async function addStaff() {
    if(saving||preview)return
    const { data, error } = await supabase.from('staff').insert({ business_id: business.id, name: en ? 'New specialist' : 'Нов специалист', sort_order: staff.length }).select().single()
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setStaff((current) => [...current, data]); setSelectedStaff(data.id)
  }

  async function saveStaff(person) {
    if(saving||preview)return
    const { error } = await supabase.from('staff').update({ name: person.name.trim(), email: person.email || null, phone: person.phone || null, bio: person.bio || null }).eq('id', person.id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    showSuccess(en ? 'Team member saved.' : 'Специалистът е запазен.')
  }

  async function archiveStaff(id) {
    if(saving||preview||!window.confirm(en?'Archive this specialist? Existing appointments will remain.':'Да архивирам ли специалиста? Съществуващите резервации остават.'))return
    const { error } = await supabase.from('staff').update({ active: false }).eq('id', id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    const next = staff.filter((item) => item.id !== id)
    setStaff(next); setSelectedStaff(next[0]?.id || '')
  }

  async function saveSchedule() {
    if(saving||preview)return
    if (!selectedStaff) return
    const problem = scheduleProblem(schedule)
    if (problem) { setMessage({ type: 'error', text: scheduleErrorText(problem, locale) }); return }
    setSaving(true); setMessage(null)
    const rows = scheduleRows(schedule)
    const { error: insertError } = await supabase.rpc('replace_working_hours', {
      input_business_id: business.id,
      input_staff_id: selectedStaff,
      input_hours: rows,
    })
    setSaving(false)
    if (insertError) { setMessage({ type: 'error', text: scheduleWriteError(insertError, locale) }); return }
    await loadCollections(); showSuccess(en ? 'Working hours saved.' : 'Работното време е запазено.')
  }

  async function addTimeOff(event) {
    event.preventDefault()
    if (saving||preview) return
    const startsAt = DateTime.fromISO(newTimeOff.starts_at, { zone: business.timezone }).toUTC()
    const endsAt = DateTime.fromISO(newTimeOff.ends_at, { zone: business.timezone }).toUTC()
    if (!startsAt.isValid || !endsAt.isValid || endsAt <= startsAt) { setMessage({ type: 'error', text: en ? 'Choose a valid start and end time.' : 'Избери валиден начален и краен момент.' }); return }
    setSaving(true); setMessage(null)
    const { data, error } = await supabase.from('time_off').insert({ business_id: business.id, staff_id: newTimeOff.staff_id || null, starts_at: startsAt.toISO(), ends_at: endsAt.toISO(), reason: newTimeOff.reason.trim() || null }).select().single()
    setSaving(false)
    if (error) { setMessage({ type: 'error', text: scheduleWriteError(error, locale) }); return }
    setTimeOff((current) => [...current, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    setNewTimeOff((current) => ({ staff_id: current.staff_id, starts_at: '', ends_at: '', reason: '' }))
    showSuccess(en ? 'Time off added and those times are now blocked.' : 'Отсъствието е добавено и часовете са блокирани.')
  }

  async function removeTimeOff(id) {
    if(saving||preview||!window.confirm(en?'Remove this blocked period? These times may become available again.':'Да премахна ли блокирания период? Часовете може да станат достъпни отново.'))return
    const { error } = await supabase.from('time_off').delete().eq('id', id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setTimeOff((current) => current.filter((item) => item.id !== id))
  }

  async function exportBusinessData() {
    if(saving||preview)return
    setSaving(true); setMessage(null)
    const tables = ['services', 'staff', 'staff_services', 'working_hours', 'time_off', 'customers', 'appointments', 'conversations', 'messages', 'analytics_events', 'notification_outbox']
    const results = await Promise.all(tables.map(async (table) => {
      const { data, error } = await supabase.from(table).select('*').eq('business_id', business.id)
      if (error) throw error
      return [table, data || []]
    })).catch((requestError) => { setMessage({ type: 'error', text: requestError.message }); return null })
    if (!results) { setSaving(false); return }
    let reviews,media
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error('UNAUTHORIZED')
      const response = await fetch(`/api/owner/public-profile?business_id=${business.id}`, { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store' })
      if (!response.ok) throw new Error('REVIEWS_UNAVAILABLE')
      reviews = (await response.json()).reviews
      const photoResponse=await fetch(`/api/businesses/${business.id}/media`,{headers:{Authorization:`Bearer ${data.session.access_token}`},cache:'no-store'})
      if(!photoResponse.ok)throw new Error('MEDIA_UNAVAILABLE')
      media=(await photoResponse.json()).media
    } catch { setSaving(false); setMessage({ type: 'error', text: en ? 'Could not export review or photo data. Please try again.' : 'Не успяхме да изтеглим данните за отзивите или снимките. Опитай отново.' }); return }
    setSaving(false)
    const payload = { exported_at: new Date().toISOString(), business, ...Object.fromEntries(results), reviews,media }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `${business.slug}-data-export.json`; link.click(); URL.revokeObjectURL(url)
    showSuccess(en ? 'Your data archive is ready.' : 'Архивът с данни е създаден.')
  }

  return (
    <main className="dashboard-content admin-page settings-page" onChangeCapture={event=>{if(!event.target.closest('.settings-section-selector'))setDirtySections(current=>({...current,[section]:true}))}}>
      <div className="admin-page-head"><div><p className="auth-kicker">{en ? 'Configuration' : 'Конфигурация'}</p><h2>{en ? 'Settings' : 'Настройки'}</h2><p>{en ? 'Changes appear immediately on the public page and in the online assistant.' : 'Промените се отразяват веднага в публичната страница и онлайн асистента.'}</p></div><Link className="secondary-button" href={`/book/${business.slug}?lang=${locale}`} target="_blank">{en ? 'Open public page' : 'Преглед на страницата'} ↗</Link></div>
      <div className="settings-section-selector"><label>{en?'Settings section':'Раздел с настройки'}<select value={section} onChange={event=>changeSection(event.target.value)} disabled={saving}>{sections.map(([value,label])=><option key={value} value={value}>{label}{dirtySections[value]?' •':''}</option>)}</select></label></div>
      <div className="settings-tabs" aria-label={en?'Settings sections':'Раздели с настройки'}>
        {sections.map(([value,label]) => <button type="button" disabled={saving} aria-pressed={section===value} className={section===value?'active':''} onClick={()=>changeSection(value)} key={value}>{label}{dirtySections[value]?' •':''}</button>)}
      </div>
      {dirtySections[section]&&<p className="settings-unsaved" role="status">{en?'Unsaved changes in this section':'Има незапазени промени в този раздел'}</p>}
      {['business','public','booking','assistant'].includes(section)&&<button type="submit" form="owner-settings-form" className="primary-button settings-quick-save" disabled={saving}>{saving?(en?'Saving…':'Запазване…'):(en?'Save changes':'Запази промените')}</button>}
      {section==='hours'&&<button type="button" className="primary-button settings-quick-save" disabled={saving} onClick={saveSchedule}>{en?'Save hours and breaks':'Запази графика и почивките'}</button>}
      {message && <p className={`form-message ${message.type === 'success' ? 'success' : ''}`} role="alert">{message.text}</p>}
      {section==='booking'&&<BusinessBookingSettings formId="owner-settings-form" onBusy={setSaving} business={business} locale={locale} onDirty={value=>setDirtySections(current=>current.booking===value?current:{...current,booking:value})} onSaved={()=>{setDirtySections(current=>({...current,booking:false}));refreshBusiness()}} preview={preview}/>}
      {['external','phone'].includes(business.booking_mode)&&['hours','timeoff','assistant'].includes(section)&&<p className="settings-unsaved" role="note">{en?'Bookings are arranged outside GoRez. The retained schedule below does not control those appointments. To prepare a future return, you can edit it without accepting new GoRez bookings.':'Резервациите се уговарят извън GoRez. Запазеният график отдолу не управлява тези часове. Можеш да го подготвиш за бъдещо връщане, без да приемаш нови GoRez резервации.'}</p>}
      {section === 'public' && <BusinessPublicProfileEditor formId="owner-settings-form" onBusy={setSaving} key={business.id} business={business} locale={locale} preview={preview} onSaved={()=>{setDirtySections(current=>({...current,public:false}));refreshBusiness()}} />}
      {section === 'photos' && <BusinessMediaEditor onBusy={setSaving} key={business.id} businessId={business.id} locale={locale} preview={preview?{business,staff,media:[]}:null} onSaved={()=>{setDirtySections(current=>({...current,photos:false}));refreshBusiness()}}/>}

      {(section === 'business' || section === 'assistant') && <form id="owner-settings-form" className="settings-panel" onSubmit={saveProfile}>
        {section === 'business' ? <>
          <div className="settings-panel-head"><h3>{en ? 'Business profile' : 'Бизнес профил'}</h3><p>{en ? 'Main information and online booking rules.' : 'Основна информация и правила за онлайн записване.'}</p></div>
          <div className="settings-form-grid">
            <label><span>{en ? 'Name' : 'Име'}</span><input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
            <label><span>{en ? 'Business type' : 'Тип бизнес'}</span><select value={profile.industry} onChange={(event) => setProfile({ ...profile, industry: event.target.value })}><option value="beauty">{en ? 'Beauty & salons' : 'Красота и салони'}</option><option value="auto">{en ? 'Auto services & repair shops' : 'Авто услуги и сервизи'}</option><option value="fitness">{en ? 'Sports' : 'Спорт'}</option><option value="education">{en ? 'Education' : 'Обучение'}</option><option value="consulting">{en ? 'Consulting' : 'Консултации'}</option><option value="home_services">{en ? 'Home services' : 'Услуги на адрес'}</option><option value="pets">{en ? 'Pet services' : 'Домашни любимци'}</option><option value="health">{en ? 'Health services' : 'Здравни услуги'}</option><option value="other">{en ? 'Other appointment business' : 'Друг бизнес с часове'}</option></select></label>
            <label><span>{en ? 'Phone' : 'Телефон'}</span><input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
            <label><span>{en ? 'Business contact email' : 'Имейл за контакт с бизнеса'}</span><input type="email" value={profile.contact_email} onChange={(event) => setProfile({ ...profile, contact_email: event.target.value })} placeholder="office@business.com" /></label>
            <div className="full"><BusinessLocationFields required cityCode={profile.city_ekatte} neighborhood={profile.neighborhood} onChange={(patch) => setProfile((current) => ({ ...current, ...patch }))} locale={locale} /></div>
            <label className="full"><span>{en ? 'Address' : 'Адрес'}</span><input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
            {bookingIntake.fields.length > 0 && <div className="settings-intake-preview full"><strong>{en ? 'Client booking questions' : 'Въпроси при резервация'}</strong><p>{en ? 'Saving this business type adds these questions to your booking form and assistant. Answers appear in each appointment.' : 'След запазване на типа бизнес тези въпроси се показват във формата и асистента. Отговорите се виждат при съответната резервация.'}</p><ul>{bookingIntake.fields.map((field) => <li key={field.key}>{field.label}{field.required ? ' *' : ''}</li>)}</ul><small>{en ? '* Required for booking' : '* Задължително за резервация'}</small></div>}
            <label className="full"><span>{en ? 'Website' : 'Уебсайт'}</span><input type="url" value={profile.website_url} onChange={(event) => setProfile({ ...profile, website_url: event.target.value })} placeholder="https://business.com" /></label>
            <button type="button" className="secondary-button full" onClick={()=>changeSection('booking')}>{en?'I already use my own booking calendar':'Вече използвам собствен календар за резервации'} →</button>
{!['external','phone'].includes(business.booking_mode)&&<>
            <label><span>{en ? 'Booking window (days)' : 'Резервации до (дни)'}</span><input type="number" min="1" max="365" value={profile.booking_window_days} onChange={(event) => setProfile({ ...profile, booking_window_days: event.target.value })} /></label>
            <label><span>{en ? 'Usual duration for new services (min)' : 'Обичайна продължителност за нови услуги (мин)'}</span><input type="number" required min="5" max="1440" step="1" list="duration-suggestions" value={profile.default_duration_min} onChange={(event) => setProfile({ ...profile, default_duration_min: event.target.value })} /><datalist id="duration-suggestions">{DURATION_OPTIONS.map((duration) => <option key={duration} value={duration} />)}</datalist><small>{en ? 'A starting value only. Existing services keep their individual durations.' : 'Само начална стойност. Съществуващите услуги запазват своите отделни продължителности.'}</small></label>
            <label><span>{en ? 'Offer start times every (min)' : 'Предлагай начални часове през (мин)'}</span><select value={profile.booking_slot_minutes} onChange={(event) => setProfile({ ...profile, booking_slot_minutes: event.target.value })}>{[5, 10, 15, 20, 30, 45, 60, 90, 120].map((minutes) => <option value={minutes} key={minutes}>{minutes}</option>)}</select><small>{en ? 'Not the service duration. A 45-minute service blocks all 45 minutes even when start options are 15 minutes apart.' : 'Не е продължителност на услугата. Услуга от 45 минути блокира целите 45 минути, дори началните опции да са през 15 минути.'}</small></label>
            <label><span>{en ? 'Minimum notice (minutes)' : 'Минимално предизвестие (минути)'}</span><input type="number" min="0" max="10080" value={profile.minimum_notice_minutes} onChange={(event) => setProfile({ ...profile, minimum_notice_minutes: event.target.value })} /></label>
            <label><span>{en ? 'Cancellation notice (hours)' : 'Отказ до (часове)'}</span><input type="number" min="0" max="720" value={profile.cancellation_notice_hours} onChange={(event) => setProfile({ ...profile, cancellation_notice_hours: event.target.value })} /></label>
</>}
            <label><span>{en ? 'Time zone' : 'Часова зона'}</span><select value={profile.timezone} onChange={(event) => setProfile({ ...profile, timezone: event.target.value })}><option value="Europe/Sofia">{en ? 'Sofia' : 'София'}</option><option value="Europe/Berlin">{en ? 'Berlin' : 'Берлин'}</option><option value="Europe/London">{en ? 'London' : 'Лондон'}</option></select></label>
            <label><span>{en ? 'Privacy contact' : 'Контакт за поверителност'}</span><input type="email" value={profile.privacy_contact_email} onChange={(event) => setProfile({ ...profile, privacy_contact_email: event.target.value })} placeholder="privacy@business.com" /></label>
            <label className="full"><span>{en ? 'Booking terms' : 'Условия за резервация'}</span><textarea value={profile.booking_terms} onChange={(event) => setProfile({ ...profile, booking_terms: event.target.value })} placeholder={en ? 'e.g. Appointments may be cancelled after a delay of more than 15 minutes.' : 'Напр. При закъснение над 15 минути часът може да бъде отменен.'} maxLength={2000} /></label>
            <label className="full notification-preference"><span><input type="checkbox" checked={profile.email_notifications_enabled} onChange={(event) => setProfile({ ...profile, email_notifications_enabled: event.target.checked })} /> {en ? 'Email notifications for new bookings' : 'Имейл известия за нови резервации'}</span><small>{en ? 'Customers receive confirmations; the business contact email receives new-booking alerts. This preference works only when platform sending is enabled.' : 'Клиентите получават потвърждения; имейлът за контакт с бизнеса получава известия за нови часове. Настройката работи само при включено изпращане в платформата.'}</small></label>
            <label><span>{en ? 'Business notification language' : 'Език на известията към бизнеса'}</span><select value={profile.notification_locale} onChange={(event) => setProfile({ ...profile, notification_locale: event.target.value })}><option value="bg">Български</option><option value="en">English</option></select><small>{en ? 'Customer emails use the language selected when booking.' : 'Имейлите към клиента използват избрания език при резервацията.'}</small></label>
            <div className="guided-assistant-note full"><strong>{!notificationStatus ? (en ? 'Checking email availability…' : 'Проверяваме имейл известията…') : notificationStatus.unavailable ? (en ? 'Email status could not be checked' : 'Не успяхме да проверим имейл известията') : notificationStatus.email ? (en ? 'Booking emails are enabled' : 'Имейлите за резервации са включени') : (en ? 'Booking emails are not enabled' : 'Имейлите за резервации не са включени')}</strong><p>{notificationStatus?.email ? (en ? 'Confirmation, reschedule and cancellation messages are attempted automatically. Delivery can be delayed or fail; continue checking the calendar.' : 'Автоматично се прави опит за изпращане на потвърждения, премествания и откази. Доставката може да се забави или провали; проверявай и календара.') : (en ? 'Changing the preference above does not activate platform sending. Clients can save their private confirmation link and calendar file.' : 'Настройката по-горе не активира изпращането в платформата. Клиентите могат да запазят личния линк и файла за календар.')}</p><p>{notificationStatus?.reminders ? (en ? 'Reminders are scheduled around 24 hours before appointments booked more than 24 hours ahead.' : 'Напомняния се планират около 24 часа преди посещенията, резервирани повече от 24 часа предварително.') : (en ? 'Automatic reminders are not enabled.' : 'Автоматичните напомняния не са включени.')}{' '}{en ? 'No SMS or Viber messages are sent.' : 'Не се изпращат SMS или Viber съобщения.'}</p>{!profile.contact_email && <p>{en ? 'Enter a business contact email above to receive owner alerts.' : 'Въведи имейл за контакт с бизнеса по-горе, за да получаваш известия като собственик.'}</p>}</div>
          </div>
        </> : <>
          <div className="settings-panel-head"><h3>{en ? 'Online assistant' : 'Онлайн асистент'}</h3><p>{en ? 'Set the welcome message and rules clients can open in the conversation.' : 'Настрой приветствието и правилата, които клиентите могат да отварят в разговора.'}</p></div>
          <label className="settings-field"><span>{en ? 'Welcome message' : 'Приветствие'}</span><textarea disabled={['external','phone'].includes(business.booking_mode)} value={profile.welcome_message} onChange={(event) => setProfile({ ...profile, welcome_message: event.target.value })} placeholder={en ? `Hello! I am ${business.name}'s online assistant.` : `Здравей! Аз съм онлайн асистентът на ${business.name}.`} maxLength={500} /></label>
          <label className="settings-field"><span>{en ? 'Additional rules' : 'Допълнителни правила'}</span><textarea disabled={['external','phone'].includes(business.booking_mode)} value={profile.bot_instructions} onChange={(event) => setProfile({ ...profile, bot_instructions: event.target.value })} placeholder={en ? 'e.g. Please call ahead if you are more than 15 minutes late...' : 'Напр. При закъснение над 15 минути се обади предварително...'} maxLength={3000} /></label>
          <div className="guided-assistant-note"><strong>{en ? 'Free guided assistant' : 'Безплатен guided асистент'}</strong><p>{en ? 'Answers use only published services, prices, schedules and rules. No paid AI API is used and there is no per-message cost.' : 'Отговорите се създават само от публикуваните услуги, цени, графици и правила. Не се използва платен AI API и няма цена на съобщение.'}</p></div>
        </>}
        <div className="settings-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? (en ? 'Saving...' : 'Запазване...') : (en ? 'Save changes' : 'Запази промените')}</button></div>
      </form>}

      {section === 'services' && <section className="settings-panel">
        <div className="settings-panel-head with-action"><div><h3>{en ? 'Services' : 'Услуги'}</h3><p>{en ? 'Set the real duration of every service. Changes apply to new bookings; existing bookings keep their agreed times.' : 'Задай реалното време за всяка услуга. Промяната важи за нови резервации, не променя вече запазените часове.'}</p></div><button className="primary-button" type="button" onClick={addService}>+ {en ? 'Add service' : 'Добави услуга'}</button></div>
        <div className="editable-list">{services.map((service, index) => {
          const change = (key, value) => setServices(current => current.map((item, i) => i === index ? { ...item, [key]: value } : item))
          return <article className="editable-card" key={service.id}><div className="settings-form-grid">
            <div className="service-name-field"><label htmlFor={`owner-service-${service.id}`}>{en ? 'Name' : 'Име'}</label><ServiceNameInput id={`owner-service-${service.id}`} className="" value={service.name} industry={business.industry} locale={locale} disabled={saving} onChange={name => change('name', name)} /></div>
            <label><span>{en ? 'Category (optional)' : 'Категория (по желание)'}</span><input maxLength={80} list="service-categories" value={service.category || ''} onChange={event => change('category', event.target.value)} /></label>
            <label><span>{en ? 'Price' : 'Цена'}</span><input type="number" min="0" step="0.01" value={service.price??''} onChange={event => change('price', event.target.value)} /></label>
            <label><span>{en ? 'Duration (minutes)' : 'Продължителност (минути)'}</span><input type="number" min="5" max="1440" step="1" value={service.duration_min??''} onChange={event => change('duration_min', event.target.value)} /></label>
            <label className="full"><span>{en ? 'Description' : 'Описание'}</span><input value={service.description || ''} onChange={event => change('description', event.target.value)} /></label>
          </div><ServicePricingFields value={service} locale={locale} disabled={saving} onChange={patch=>setServices(current=>current.map((item,i)=>i===index?{...item,...patch}:item))}/><div className="editable-actions"><button className="danger-link" type="button" onClick={() => archiveService(service.id)}>{en ? 'Archive' : 'Архивирай'}</button><button className="secondary-button" type="button" onClick={() => saveService(service)}>{en ? 'Save' : 'Запази'}</button></div></article>
        })}</div><datalist id="service-categories">{[...new Set(services.map(service => service.category?.trim()).filter(Boolean))].map(category => <option key={category} value={category} />)}</datalist>
      </section>}

      {section === 'staff' && <section className="settings-panel"><div className="settings-panel-head with-action"><div><h3>{en ? 'Team' : 'Екип'}</h3><p>{en ? 'People clients can book with.' : 'Хората, при които клиентите могат да резервират.'}</p></div><button className="primary-button" type="button" onClick={addStaff}>+ {en ? 'Add person' : 'Добави човек'}</button></div><div className="editable-list">{staff.map((person, index) => <article className="editable-card" key={person.id}><div className="settings-form-grid"><label><span>{en ? 'Name' : 'Име'}</span><input value={person.name} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /></label><label><span>{en ? 'Phone' : 'Телефон'}</span><input value={person.phone || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, phone: event.target.value } : item))} /></label><label><span>{en ? 'Email' : 'Имейл'}</span><input type="email" value={person.email || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, email: event.target.value } : item))} /></label><label><span>{en ? 'Short bio' : 'Кратко описание'}</span><input value={person.bio || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, bio: event.target.value } : item))} /></label></div><div className="editable-actions"><button className="danger-link" type="button" onClick={() => archiveStaff(person.id)}>{en ? 'Archive' : 'Архивирай'}</button><button className="secondary-button" type="button" onClick={() => saveStaff(person)}>{en ? 'Save' : 'Запази'}</button></div></article>)}</div></section>}

      {section === 'hours' && <section className="settings-panel">
        <div className="settings-panel-head"><h3>{en ? 'Working hours and recurring breaks' : 'Работно време и повтарящи се почивки'}</h3><p>{en ? 'Set a separate weekly schedule for each specialist. For example, tick a break from 12:00 to 13:00 on every working day.' : 'Настрой седмичен график за всеки специалист. Например отметни почивка от 12:00 до 13:00 във всеки работен ден.'}</p></div>
        {staff.length === 0 ? <p>{en ? 'Add someone in the Team section first.' : 'Първо добави човек в секция „Екип“.'}</p> : <>
          <label className="settings-field compact"><span>{en ? 'Specialist' : 'Специалист'}</span><select value={selectedStaff} onChange={(event) => setSelectedStaff(event.target.value)}>{staff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label>
          <WeeklyScheduleFields days={schedule} onChange={setSchedule} locale={locale} disabled={saving} />
          <p className="helper-text">{en ? 'Existing bookings are never cancelled automatically. If a break overlaps one, move or cancel that booking first.' : 'Съществуващите резервации не се отменят автоматично. Ако почивка застъпва резервация, първо я премести или отмени.'}</p>
          <div className="settings-actions"><button className="primary-button" type="button" onClick={saveSchedule} disabled={saving}>{saving ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Save hours and breaks' : 'Запази графика и почивките')}</button></div>
        </>}
      </section>}

      {section === 'timeoff' && <section className="settings-panel">
        <div className="settings-panel-head"><h3>{en ? 'Block a specific date or period' : 'Блокирай конкретна дата или период'}</h3><p>{en ? 'For a one-off lunch, appointment, holiday or closure. For a weekly lunch break use Hours & breaks.' : 'За еднократна обедна почивка, ангажимент, отпуск или затваряне. За обедна почивка всяка седмица използвай „Работно време и почивки“.'}</p></div>
        <form className="timeoff-form" onSubmit={addTimeOff}>
          <label><span>{en ? 'For whom' : 'За кого'}</span><select value={newTimeOff.staff_id} onChange={(event) => setNewTimeOff({ ...newTimeOff, staff_id: event.target.value })}><option value="">{en ? 'Entire business / all specialists' : 'Целият бизнес / всички специалисти'}</option>{staff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label>
          <label><span>{en ? 'From (business local time)' : 'От (местно време на бизнеса)'}</span><input required type="datetime-local" value={newTimeOff.starts_at} onChange={(event) => setNewTimeOff({ ...newTimeOff, starts_at: event.target.value })} /></label>
          <label><span>{en ? 'To (business local time)' : 'До (местно време на бизнеса)'}</span><input required type="datetime-local" value={newTimeOff.ends_at} onChange={(event) => setNewTimeOff({ ...newTimeOff, ends_at: event.target.value })} /></label>
          <label><span>{en ? 'Reason (private)' : 'Причина (не е публична)'}</span><input maxLength={200} value={newTimeOff.reason} onChange={(event) => setNewTimeOff({ ...newTimeOff, reason: event.target.value })} placeholder={en ? 'Lunch break' : 'Обедна почивка'} /></label>
          <button className="primary-button" type="submit" disabled={saving}>{saving ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Block period' : 'Блокирай периода')}</button>
        </form>
        <div className="timeoff-list">{timeOff.length === 0 ? <p className="analytics-empty">{en ? 'No upcoming blocked periods.' : 'Няма предстоящи блокирани периоди.'}</p> : timeOff.map((item) => { const person = staff.find((row) => row.id === item.staff_id); const starts = DateTime.fromISO(item.starts_at).setZone(business.timezone).setLocale(locale); const ends = DateTime.fromISO(item.ends_at).setZone(business.timezone).setLocale(locale); return <article key={item.id}><div><strong>{item.reason || (en ? 'Blocked period' : 'Блокиран период')}</strong><span>{person?.name || (en ? 'Entire business' : 'Целият бизнес')} · {starts.toFormat('d LLL, HH:mm')} — {ends.toFormat('d LLL, HH:mm')}</span></div><button className="danger-link" type="button" onClick={() => removeTimeOff(item.id)}>{en ? 'Remove' : 'Премахни'}</button></article> })}</div>
      </section>}

      {section === 'data' && <section className="settings-panel data-control-card"><div className="settings-panel-head"><h3>{en ? 'Data controls' : 'Контрол върху данните'}</h3><p>{en ? 'Download a machine-readable archive of the business profile, settings, clients, bookings, conversations and operational events.' : 'Изтегли машинно четим архив на бизнес профила, настройките, клиентите, резервациите, разговорите и оперативните събития.'}</p></div><div className="data-export-box"><div><strong>{en ? 'Complete JSON archive' : 'Пълен JSON архив'}</strong><span>{en ? 'The file may contain personal data. Store it securely.' : 'Файлът може да съдържа лични данни. Съхранявай го защитено.'}</span></div><button className="primary-button" type="button" onClick={exportBusinessData} disabled={saving}>{saving ? (en ? 'Preparing...' : 'Подготвяне...') : (en ? 'Download archive' : 'Изтегли архив')}</button></div><p className="security-note">{en ? 'Individual client deletion requests are handled from the Clients section. Booking history remains without identifying data so the calendar stays intact.' : 'Заявките за изтриване на отделен клиент се изпълняват от секция „Клиенти“. Историята на часа остава без идентифициращи данни, за да не се наруши календарът.'}</p></section>}
      {section === 'account' && <AccountDeletionPanel businessId={business.id} locale={locale} onExport={() => setSection('data')} />}
    </main>
  )
}

export default function SettingsPage() {
  return <OwnerPage title={{ bg: 'Настройки', en: 'Settings' }}>{(props) => <SettingsContent {...props} />}</OwnerPage>
}
