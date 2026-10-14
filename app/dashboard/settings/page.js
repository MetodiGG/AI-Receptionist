'use client'

import Link from 'next/link'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'

const WEEK = {
  bg: [[1, 'Понеделник'], [2, 'Вторник'], [3, 'Сряда'], [4, 'Четвъртък'], [5, 'Петък'], [6, 'Събота'], [7, 'Неделя']],
  en: [[1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday'], [7, 'Sunday']],
}

function defaultSchedule(locale) {
  return WEEK[locale].map(([weekday, label]) => ({ weekday, label, enabled: weekday <= 5, open: '09:00', close: '18:00' }))
}

function SettingsContent({ business, refreshBusiness, locale }) {
  const en = locale === 'en'
  const [profile, setProfile] = useState({
    name: business.name || '', phone: business.phone || '', address: business.address || '', timezone: business.timezone || 'Europe/Sofia',
    welcome_message: business.welcome_message || '', bot_instructions: business.bot_instructions || '', booking_window_days: business.booking_window_days || 60,
    minimum_notice_minutes: business.minimum_notice_minutes || 60, cancellation_notice_hours: business.cancellation_notice_hours || 12,
    industry: business.industry || 'other', contact_email: business.contact_email || '', website_url: business.website_url || '',
    privacy_contact_email: business.privacy_contact_email || '', booking_terms: business.booking_terms || '',
    email_notifications_enabled: business.email_notifications_enabled ?? true,
  })
  const [services, setServices] = useState([])
  const [staff, setStaff] = useState([])
  const [hours, setHours] = useState([])
  const [timeOff, setTimeOff] = useState([])
  const [newTimeOff, setNewTimeOff] = useState({ staff_id: '', starts_at: '', ends_at: '', reason: '' })
  const [selectedStaff, setSelectedStaff] = useState('')
  const [schedule, setSchedule] = useState(() => defaultSchedule(locale))
  const [section, setSection] = useState('business')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const loadCollections = useCallback(async () => {
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
    setNewTimeOff((current) => ({ ...current, staff_id: current.staff_id || staffResult.data?.[0]?.id || '' }))
  }, [business.id])

  useEffect(() => { loadCollections() }, [loadCollections])
  useEffect(() => {
    if (!selectedStaff) return
    setSchedule(WEEK[locale].map(([weekday, label]) => {
      const row = hours.find((item) => item.staff_id === selectedStaff && item.weekday === weekday)
      return { weekday, label, enabled: Boolean(row), open: row?.open_time?.slice(0, 5) || '09:00', close: row?.close_time?.slice(0, 5) || '18:00' }
    }))
  }, [hours, locale, selectedStaff])

  function showSuccess(text) {
    setMessage({ type: 'success', text })
    window.setTimeout(() => setMessage(null), 3500)
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true); setMessage(null)
    const { error } = await supabase.from('businesses').update({
      ...profile,
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
    const { data, error } = await supabase.from('services').insert({ business_id: business.id, name: en ? 'New service' : 'Нова услуга', price: 0, currency: 'EUR', duration_min: 30, sort_order: services.length }).select().single()
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setServices((current) => [...current, data])
  }

  async function saveService(service) {
    const { error } = await supabase.from('services').update({ name: service.name.trim(), description: service.description || null, price: Number(service.price), duration_min: Number(service.duration_min) }).eq('id', service.id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    showSuccess(en ? 'Service saved.' : 'Услугата е запазена.')
  }

  async function archiveService(id) {
    const { error } = await supabase.from('services').update({ active: false }).eq('id', id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setServices((current) => current.filter((item) => item.id !== id))
  }

  async function addStaff() {
    const { data, error } = await supabase.from('staff').insert({ business_id: business.id, name: en ? 'New specialist' : 'Нов специалист', sort_order: staff.length }).select().single()
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setStaff((current) => [...current, data]); setSelectedStaff(data.id)
  }

  async function saveStaff(person) {
    const { error } = await supabase.from('staff').update({ name: person.name.trim(), email: person.email || null, phone: person.phone || null, bio: person.bio || null }).eq('id', person.id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    showSuccess(en ? 'Team member saved.' : 'Специалистът е запазен.')
  }

  async function archiveStaff(id) {
    const { error } = await supabase.from('staff').update({ active: false }).eq('id', id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    const next = staff.filter((item) => item.id !== id)
    setStaff(next); setSelectedStaff(next[0]?.id || '')
  }

  async function saveSchedule() {
    if (!selectedStaff) return
    const invalidDay = schedule.find((day) => day.enabled && day.close <= day.open)
    if (invalidDay) { setMessage({ type: 'error', text: en ? `Closing time for ${invalidDay.label} must be after opening time.` : `Крайният час за ${invalidDay.label} трябва да е след началния.` }); return }
    setSaving(true); setMessage(null)
    const rows = schedule.filter((day) => day.enabled).map((day) => ({ weekday: day.weekday, open_time: day.open, close_time: day.close }))
    const { error: insertError } = await supabase.rpc('replace_working_hours', {
      input_business_id: business.id,
      input_staff_id: selectedStaff,
      input_hours: rows,
    })
    setSaving(false)
    if (insertError) { setMessage({ type: 'error', text: insertError.message }); return }
    await loadCollections(); showSuccess(en ? 'Working hours saved.' : 'Работното време е запазено.')
  }

  async function addTimeOff(event) {
    event.preventDefault()
    const startsAt = DateTime.fromISO(newTimeOff.starts_at, { zone: business.timezone }).toUTC()
    const endsAt = DateTime.fromISO(newTimeOff.ends_at, { zone: business.timezone }).toUTC()
    if (!startsAt.isValid || !endsAt.isValid || endsAt <= startsAt) { setMessage({ type: 'error', text: en ? 'Choose a valid start and end time.' : 'Избери валиден начален и краен момент.' }); return }
    const { data, error } = await supabase.from('time_off').insert({ business_id: business.id, staff_id: newTimeOff.staff_id || null, starts_at: startsAt.toISO(), ends_at: endsAt.toISO(), reason: newTimeOff.reason.trim() || null }).select().single()
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setTimeOff((current) => [...current, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    setNewTimeOff((current) => ({ staff_id: current.staff_id, starts_at: '', ends_at: '', reason: '' }))
    showSuccess(en ? 'Time off added and those times are now blocked.' : 'Отсъствието е добавено и часовете са блокирани.')
  }

  async function removeTimeOff(id) {
    const { error } = await supabase.from('time_off').delete().eq('id', id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setTimeOff((current) => current.filter((item) => item.id !== id))
  }

  async function exportBusinessData() {
    setSaving(true); setMessage(null)
    const tables = ['services', 'staff', 'staff_services', 'working_hours', 'time_off', 'customers', 'appointments', 'conversations', 'messages', 'analytics_events', 'notification_outbox']
    const results = await Promise.all(tables.map(async (table) => {
      const { data, error } = await supabase.from(table).select('*').eq('business_id', business.id)
      if (error) throw error
      return [table, data || []]
    })).catch((requestError) => { setMessage({ type: 'error', text: requestError.message }); return null })
    setSaving(false)
    if (!results) return
    const payload = { exported_at: new Date().toISOString(), business, ...Object.fromEntries(results) }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `${business.slug}-data-export.json`; link.click(); URL.revokeObjectURL(url)
    showSuccess(en ? 'Your data archive is ready.' : 'Архивът с данни е създаден.')
  }

  return (
    <main className="dashboard-content admin-page settings-page">
      <div className="admin-page-head"><div><p className="auth-kicker">{en ? 'Configuration' : 'Конфигурация'}</p><h2>{en ? 'Settings' : 'Настройки'}</h2><p>{en ? 'Changes appear immediately on the public page and in the online assistant.' : 'Промените се отразяват веднага в публичната страница и онлайн асистента.'}</p></div><Link className="secondary-button" href={`/book/${business.slug}?lang=${locale}`} target="_blank">{en ? 'Open public page' : 'Преглед на страницата'} ↗</Link></div>
      <div className="settings-tabs">
        {[['business', en ? 'Business' : 'Бизнес'], ['services', en ? 'Services' : 'Услуги'], ['staff', en ? 'Team' : 'Екип'], ['hours', en ? 'Working hours' : 'Работно време'], ['timeoff', en ? 'Time off' : 'Отсъствия'], ['assistant', en ? 'Assistant' : 'Асистент'], ['data', en ? 'Data' : 'Данни']].map(([value, label]) => <button type="button" className={section === value ? 'active' : ''} onClick={() => setSection(value)} key={value}>{label}</button>)}
      </div>
      {message && <p className={`form-message ${message.type === 'success' ? 'success' : ''}`} role="alert">{message.text}</p>}

      {(section === 'business' || section === 'assistant') && <form className="settings-panel" onSubmit={saveProfile}>
        {section === 'business' ? <>
          <div className="settings-panel-head"><h3>{en ? 'Business profile' : 'Бизнес профил'}</h3><p>{en ? 'Main information and online booking rules.' : 'Основна информация и правила за онлайн записване.'}</p></div>
          <div className="settings-form-grid">
            <label><span>{en ? 'Name' : 'Име'}</span><input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
            <label><span>{en ? 'Business type' : 'Тип бизнес'}</span><select value={profile.industry} onChange={(event) => setProfile({ ...profile, industry: event.target.value })}><option value="beauty">{en ? 'Beauty & salons' : 'Красота и салони'}</option><option value="auto">{en ? 'Auto services & repair shops' : 'Авто услуги и сервизи'}</option><option value="fitness">{en ? 'Sport & fitness' : 'Спорт и фитнес'}</option><option value="education">{en ? 'Education' : 'Обучение'}</option><option value="consulting">{en ? 'Consulting' : 'Консултации'}</option><option value="home_services">{en ? 'Home services' : 'Услуги на адрес'}</option><option value="pets">{en ? 'Pet services' : 'Домашни любимци'}</option><option value="health">{en ? 'Health services' : 'Здравни услуги'}</option><option value="other">{en ? 'Other appointment business' : 'Друг бизнес с часове'}</option></select></label>
            <label><span>{en ? 'Phone' : 'Телефон'}</span><input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
            <label><span>{en ? 'New booking email' : 'Имейл за нови резервации'}</span><input type="email" value={profile.contact_email} onChange={(event) => setProfile({ ...profile, contact_email: event.target.value })} placeholder="office@business.com" /></label>
            <label className="full"><span>{en ? 'Address' : 'Адрес'}</span><input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
            <label className="full"><span>{en ? 'Website' : 'Уебсайт'}</span><input type="url" value={profile.website_url} onChange={(event) => setProfile({ ...profile, website_url: event.target.value })} placeholder="https://business.com" /></label>
            <label><span>{en ? 'Booking window (days)' : 'Резервации до (дни)'}</span><input type="number" min="1" max="365" value={profile.booking_window_days} onChange={(event) => setProfile({ ...profile, booking_window_days: event.target.value })} /></label>
            <label><span>{en ? 'Minimum notice (minutes)' : 'Минимално предизвестие (минути)'}</span><input type="number" min="0" max="10080" value={profile.minimum_notice_minutes} onChange={(event) => setProfile({ ...profile, minimum_notice_minutes: event.target.value })} /></label>
            <label><span>{en ? 'Cancellation notice (hours)' : 'Отказ до (часове)'}</span><input type="number" min="0" max="720" value={profile.cancellation_notice_hours} onChange={(event) => setProfile({ ...profile, cancellation_notice_hours: event.target.value })} /></label>
            <label><span>{en ? 'Time zone' : 'Часова зона'}</span><select value={profile.timezone} onChange={(event) => setProfile({ ...profile, timezone: event.target.value })}><option value="Europe/Sofia">{en ? 'Sofia' : 'София'}</option><option value="Europe/Berlin">{en ? 'Berlin' : 'Берлин'}</option><option value="Europe/London">{en ? 'London' : 'Лондон'}</option></select></label>
            <label><span>{en ? 'Privacy contact' : 'Контакт за поверителност'}</span><input type="email" value={profile.privacy_contact_email} onChange={(event) => setProfile({ ...profile, privacy_contact_email: event.target.value })} placeholder="privacy@business.com" /></label>
            <label className="full"><span>{en ? 'Booking terms' : 'Условия за резервация'}</span><textarea value={profile.booking_terms} onChange={(event) => setProfile({ ...profile, booking_terms: event.target.value })} placeholder={en ? 'e.g. Appointments may be cancelled after a delay of more than 15 minutes.' : 'Напр. При закъснение над 15 минути часът може да бъде отменен.'} maxLength={2000} /></label>
            <label className="settings-toggle full"><input type="checkbox" checked={profile.email_notifications_enabled} onChange={(event) => setProfile({ ...profile, email_notifications_enabled: event.target.checked })} /><span><strong>{en ? 'Email notifications' : 'Имейл известия'}</strong><small>{en ? 'Client confirmation and business notification when a provider is configured.' : 'Потвърждение към клиента и известие към бизнеса, когато има конфигуриран доставчик.'}</small></span></label>
          </div>
        </> : <>
          <div className="settings-panel-head"><h3>{en ? 'Online assistant' : 'Онлайн асистент'}</h3><p>{en ? 'Set the welcome message and rules clients can open in the conversation.' : 'Настрой приветствието и правилата, които клиентите могат да отварят в разговора.'}</p></div>
          <label className="settings-field"><span>{en ? 'Welcome message' : 'Приветствие'}</span><textarea value={profile.welcome_message} onChange={(event) => setProfile({ ...profile, welcome_message: event.target.value })} placeholder={en ? `Hello! I am ${business.name}'s online assistant.` : `Здравей! Аз съм онлайн асистентът на ${business.name}.`} maxLength={500} /></label>
          <label className="settings-field"><span>{en ? 'Additional rules' : 'Допълнителни правила'}</span><textarea value={profile.bot_instructions} onChange={(event) => setProfile({ ...profile, bot_instructions: event.target.value })} placeholder={en ? 'e.g. Please call ahead if you are more than 15 minutes late...' : 'Напр. При закъснение над 15 минути се обади предварително...'} maxLength={3000} /></label>
          <div className="guided-assistant-note"><strong>{en ? 'Free guided assistant' : 'Безплатен guided асистент'}</strong><p>{en ? 'Answers use only published services, prices, schedules and rules. No paid AI API is used and there is no per-message cost.' : 'Отговорите се създават само от публикуваните услуги, цени, графици и правила. Не се използва платен AI API и няма цена на съобщение.'}</p></div>
        </>}
        <div className="settings-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? (en ? 'Saving...' : 'Запазване...') : (en ? 'Save changes' : 'Запази промените')}</button></div>
      </form>}

      {section === 'services' && <section className="settings-panel"><div className="settings-panel-head with-action"><div><h3>{en ? 'Services' : 'Услуги'}</h3><p>{en ? 'Prices and duration used by the calendar.' : 'Цени и продължителност за календара.'}</p></div><button className="primary-button" type="button" onClick={addService}>+ {en ? 'Add service' : 'Добави услуга'}</button></div><div className="editable-list">{services.map((service, index) => <article className="editable-card" key={service.id}><div className="settings-form-grid"><label><span>{en ? 'Name' : 'Име'}</span><input value={service.name} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /></label><label><span>{en ? 'Price' : 'Цена'}</span><input type="number" min="0" step="0.01" value={service.price} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, price: event.target.value } : item))} /></label><label><span>{en ? 'Duration' : 'Продължителност'}</span><input type="number" min="5" step="5" value={service.duration_min} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, duration_min: event.target.value } : item))} /></label><label className="full"><span>{en ? 'Description' : 'Описание'}</span><input value={service.description || ''} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} /></label></div><div className="editable-actions"><button className="danger-link" type="button" onClick={() => archiveService(service.id)}>{en ? 'Archive' : 'Архивирай'}</button><button className="secondary-button" type="button" onClick={() => saveService(service)}>{en ? 'Save' : 'Запази'}</button></div></article>)}</div></section>}

      {section === 'staff' && <section className="settings-panel"><div className="settings-panel-head with-action"><div><h3>{en ? 'Team' : 'Екип'}</h3><p>{en ? 'People clients can book with.' : 'Хората, при които клиентите могат да резервират.'}</p></div><button className="primary-button" type="button" onClick={addStaff}>+ {en ? 'Add person' : 'Добави човек'}</button></div><div className="editable-list">{staff.map((person, index) => <article className="editable-card" key={person.id}><div className="settings-form-grid"><label><span>{en ? 'Name' : 'Име'}</span><input value={person.name} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /></label><label><span>{en ? 'Phone' : 'Телефон'}</span><input value={person.phone || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, phone: event.target.value } : item))} /></label><label><span>{en ? 'Email' : 'Имейл'}</span><input type="email" value={person.email || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, email: event.target.value } : item))} /></label><label><span>{en ? 'Short bio' : 'Кратко описание'}</span><input value={person.bio || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, bio: event.target.value } : item))} /></label></div><div className="editable-actions"><button className="danger-link" type="button" onClick={() => archiveStaff(person.id)}>{en ? 'Archive' : 'Архивирай'}</button><button className="secondary-button" type="button" onClick={() => saveStaff(person)}>{en ? 'Save' : 'Запази'}</button></div></article>)}</div></section>}

      {section === 'hours' && <section className="settings-panel"><div className="settings-panel-head"><h3>{en ? 'Working hours' : 'Работно време'}</h3><p>{en ? 'Set a separate schedule for each specialist.' : 'Настрой отделен график за всеки специалист.'}</p></div>{staff.length === 0 ? <p>{en ? 'Add someone in the Team section first.' : 'Първо добави човек в секция „Екип“.'}</p> : <><label className="settings-field compact"><span>{en ? 'Specialist' : 'Специалист'}</span><select value={selectedStaff} onChange={(event) => setSelectedStaff(event.target.value)}>{staff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label><div className="settings-schedule">{schedule.map((day, index) => <div className={`settings-day ${day.enabled ? '' : 'disabled'}`} key={day.weekday}><label><input type="checkbox" checked={day.enabled} onChange={(event) => setSchedule((current) => current.map((item, i) => i === index ? { ...item, enabled: event.target.checked } : item))} /><strong>{day.label}</strong></label><input type="time" value={day.open} disabled={!day.enabled} onChange={(event) => setSchedule((current) => current.map((item, i) => i === index ? { ...item, open: event.target.value } : item))} /><span>{en ? 'to' : 'до'}</span><input type="time" value={day.close} disabled={!day.enabled} onChange={(event) => setSchedule((current) => current.map((item, i) => i === index ? { ...item, close: event.target.value } : item))} /></div>)}</div><div className="settings-actions"><button className="primary-button" type="button" onClick={saveSchedule} disabled={saving}>{saving ? (en ? 'Saving...' : 'Запазване...') : (en ? 'Save schedule' : 'Запази графика')}</button></div></>}</section>}

      {section === 'timeoff' && <section className="settings-panel"><div className="settings-panel-head"><h3>{en ? 'Time off and closed periods' : 'Отсъствия и затворени периоди'}</h3><p>{en ? 'Block holidays, days off, training or temporary closures. These times disappear from the public calendar immediately.' : 'Блокирай отпуск, почивен ден, обучение или временно затваряне. Тези часове веднага изчезват от публичния календар.'}</p></div><form className="timeoff-form" onSubmit={addTimeOff}><label><span>{en ? 'For whom' : 'За кого'}</span><select required value={newTimeOff.staff_id} onChange={(event) => setNewTimeOff({ ...newTimeOff, staff_id: event.target.value })}>{staff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label><label><span>{en ? 'From' : 'От'}</span><input required type="datetime-local" value={newTimeOff.starts_at} onChange={(event) => setNewTimeOff({ ...newTimeOff, starts_at: event.target.value })} /></label><label><span>{en ? 'To' : 'До'}</span><input required type="datetime-local" value={newTimeOff.ends_at} onChange={(event) => setNewTimeOff({ ...newTimeOff, ends_at: event.target.value })} /></label><label><span>{en ? 'Reason' : 'Причина'}</span><input value={newTimeOff.reason} onChange={(event) => setNewTimeOff({ ...newTimeOff, reason: event.target.value })} placeholder={en ? 'Holiday' : 'Отпуск'} /></label><button className="primary-button" type="submit" disabled={!staff.length}>{en ? 'Block period' : 'Блокирай периода'}</button></form><div className="timeoff-list">{timeOff.length === 0 ? <p className="analytics-empty">{en ? 'No upcoming time off.' : 'Няма предстоящи отсъствия.'}</p> : timeOff.map((item) => { const person = staff.find((row) => row.id === item.staff_id); const starts = DateTime.fromISO(item.starts_at).setZone(business.timezone).setLocale(locale); const ends = DateTime.fromISO(item.ends_at).setZone(business.timezone).setLocale(locale); return <article key={item.id}><div><strong>{item.reason || (en ? 'Blocked period' : 'Блокиран период')}</strong><span>{person?.name || (en ? 'Entire business' : 'Целият бизнес')} · {starts.toFormat('d LLL, HH:mm')} — {ends.toFormat('d LLL, HH:mm')}</span></div><button className="danger-link" type="button" onClick={() => removeTimeOff(item.id)}>{en ? 'Remove' : 'Премахни'}</button></article> })}</div></section>}

      {section === 'data' && <section className="settings-panel data-control-card"><div className="settings-panel-head"><h3>{en ? 'Data controls' : 'Контрол върху данните'}</h3><p>{en ? 'Download a machine-readable archive of the business profile, settings, clients, bookings, conversations and operational events.' : 'Изтегли машинно четим архив на бизнес профила, настройките, клиентите, резервациите, разговорите и оперативните събития.'}</p></div><div className="data-export-box"><div><strong>{en ? 'Complete JSON archive' : 'Пълен JSON архив'}</strong><span>{en ? 'The file may contain personal data. Store it securely.' : 'Файлът може да съдържа лични данни. Съхранявай го защитено.'}</span></div><button className="primary-button" type="button" onClick={exportBusinessData} disabled={saving}>{saving ? (en ? 'Preparing...' : 'Подготвяне...') : (en ? 'Download archive' : 'Изтегли архив')}</button></div><p className="security-note">{en ? 'Individual client deletion requests are handled from the Clients section. Booking history remains without identifying data so the calendar stays intact.' : 'Заявките за изтриване на отделен клиент се изпълняват от секция „Клиенти“. Историята на часа остава без идентифициращи данни, за да не се наруши календарът.'}</p></section>}
    </main>
  )
}

export default function SettingsPage() {
  return <OwnerPage title={{ bg: 'Настройки', en: 'Settings' }}>{(props) => <SettingsContent {...props} />}</OwnerPage>
}
