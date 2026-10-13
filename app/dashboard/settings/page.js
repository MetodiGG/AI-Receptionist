'use client'

import Link from 'next/link'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'

const WEEK = [
  [1, 'Понеделник'], [2, 'Вторник'], [3, 'Сряда'], [4, 'Четвъртък'], [5, 'Петък'], [6, 'Събота'], [7, 'Неделя'],
]

function defaultSchedule() {
  return WEEK.map(([weekday, label]) => ({ weekday, label, enabled: weekday <= 5, open: '09:00', close: '18:00' }))
}

function SettingsContent({ business, refreshBusiness }) {
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
  const [schedule, setSchedule] = useState(defaultSchedule)
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
    setSchedule(WEEK.map(([weekday, label]) => {
      const row = hours.find((item) => item.staff_id === selectedStaff && item.weekday === weekday)
      return { weekday, label, enabled: Boolean(row), open: row?.open_time?.slice(0, 5) || '09:00', close: row?.close_time?.slice(0, 5) || '18:00' }
    }))
  }, [hours, selectedStaff])

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
    showSuccess('Настройките са запазени.')
  }

  async function addService() {
    const { data, error } = await supabase.from('services').insert({ business_id: business.id, name: 'Нова услуга', price: 0, currency: 'EUR', duration_min: 30, sort_order: services.length }).select().single()
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setServices((current) => [...current, data])
  }

  async function saveService(service) {
    const { error } = await supabase.from('services').update({ name: service.name.trim(), description: service.description || null, price: Number(service.price), duration_min: Number(service.duration_min) }).eq('id', service.id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    showSuccess('Услугата е запазена.')
  }

  async function archiveService(id) {
    const { error } = await supabase.from('services').update({ active: false }).eq('id', id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setServices((current) => current.filter((item) => item.id !== id))
  }

  async function addStaff() {
    const { data, error } = await supabase.from('staff').insert({ business_id: business.id, name: 'Нов специалист', sort_order: staff.length }).select().single()
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setStaff((current) => [...current, data]); setSelectedStaff(data.id)
  }

  async function saveStaff(person) {
    const { error } = await supabase.from('staff').update({ name: person.name.trim(), email: person.email || null, phone: person.phone || null, bio: person.bio || null }).eq('id', person.id).eq('business_id', business.id)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    showSuccess('Специалистът е запазен.')
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
    if (invalidDay) { setMessage({ type: 'error', text: `Крайният час за ${invalidDay.label} трябва да е след началния.` }); return }
    setSaving(true); setMessage(null)
    const rows = schedule.filter((day) => day.enabled).map((day) => ({ weekday: day.weekday, open_time: day.open, close_time: day.close }))
    const { error: insertError } = await supabase.rpc('replace_working_hours', {
      input_business_id: business.id,
      input_staff_id: selectedStaff,
      input_hours: rows,
    })
    setSaving(false)
    if (insertError) { setMessage({ type: 'error', text: insertError.message }); return }
    await loadCollections(); showSuccess('Работното време е запазено.')
  }

  async function addTimeOff(event) {
    event.preventDefault()
    const startsAt = DateTime.fromISO(newTimeOff.starts_at, { zone: business.timezone }).toUTC()
    const endsAt = DateTime.fromISO(newTimeOff.ends_at, { zone: business.timezone }).toUTC()
    if (!startsAt.isValid || !endsAt.isValid || endsAt <= startsAt) { setMessage({ type: 'error', text: 'Избери валиден начален и краен момент.' }); return }
    const { data, error } = await supabase.from('time_off').insert({ business_id: business.id, staff_id: newTimeOff.staff_id || null, starts_at: startsAt.toISO(), ends_at: endsAt.toISO(), reason: newTimeOff.reason.trim() || null }).select().single()
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setTimeOff((current) => [...current, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    setNewTimeOff((current) => ({ staff_id: current.staff_id, starts_at: '', ends_at: '', reason: '' }))
    showSuccess('Отсъствието е добавено и часовете са блокирани.')
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
    showSuccess('Архивът с данни е създаден.')
  }

  return (
    <main className="dashboard-content admin-page settings-page">
      <div className="admin-page-head"><div><p className="auth-kicker">Конфигурация</p><h2>Настройки</h2><p>Промените се отразяват веднага в публичната страница и онлайн асистента.</p></div><Link className="secondary-button" href={`/book/${business.slug}`} target="_blank">Преглед на страницата ↗</Link></div>
      <div className="settings-tabs">
        {[['business', 'Бизнес'], ['services', 'Услуги'], ['staff', 'Екип'], ['hours', 'Работно време'], ['timeoff', 'Отсъствия'], ['assistant', 'Асистент'], ['data', 'Данни']].map(([value, label]) => <button type="button" className={section === value ? 'active' : ''} onClick={() => setSection(value)} key={value}>{label}</button>)}
      </div>
      {message && <p className={`form-message ${message.type === 'success' ? 'success' : ''}`} role="alert">{message.text}</p>}

      {(section === 'business' || section === 'assistant') && <form className="settings-panel" onSubmit={saveProfile}>
        {section === 'business' ? <>
          <div className="settings-panel-head"><h3>Бизнес профил</h3><p>Основна информация и правила за онлайн записване.</p></div>
          <div className="settings-form-grid">
            <label><span>Име</span><input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
            <label><span>Тип бизнес</span><select value={profile.industry} onChange={(event) => setProfile({ ...profile, industry: event.target.value })}><option value="beauty">Красота и салони</option><option value="auto">Авто услуги и сервизи</option><option value="fitness">Спорт и фитнес</option><option value="education">Обучение</option><option value="consulting">Консултации</option><option value="home_services">Услуги на адрес</option><option value="pets">Домашни любимци</option><option value="health">Здравни услуги</option><option value="other">Друг бизнес с часове</option></select></label>
            <label><span>Телефон</span><input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
            <label><span>Имейл за нови резервации</span><input type="email" value={profile.contact_email} onChange={(event) => setProfile({ ...profile, contact_email: event.target.value })} placeholder="office@business.bg" /></label>
            <label className="full"><span>Адрес</span><input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
            <label className="full"><span>Уебсайт</span><input type="url" value={profile.website_url} onChange={(event) => setProfile({ ...profile, website_url: event.target.value })} placeholder="https://business.bg" /></label>
            <label><span>Резервации до (дни)</span><input type="number" min="1" max="365" value={profile.booking_window_days} onChange={(event) => setProfile({ ...profile, booking_window_days: event.target.value })} /></label>
            <label><span>Минимално предизвестие (минути)</span><input type="number" min="0" max="10080" value={profile.minimum_notice_minutes} onChange={(event) => setProfile({ ...profile, minimum_notice_minutes: event.target.value })} /></label>
            <label><span>Отказ до (часове)</span><input type="number" min="0" max="720" value={profile.cancellation_notice_hours} onChange={(event) => setProfile({ ...profile, cancellation_notice_hours: event.target.value })} /></label>
            <label><span>Часова зона</span><select value={profile.timezone} onChange={(event) => setProfile({ ...profile, timezone: event.target.value })}><option value="Europe/Sofia">София</option><option value="Europe/Berlin">Берлин</option><option value="Europe/London">Лондон</option></select></label>
            <label><span>Контакт за поверителност</span><input type="email" value={profile.privacy_contact_email} onChange={(event) => setProfile({ ...profile, privacy_contact_email: event.target.value })} placeholder="privacy@business.bg" /></label>
            <label className="full"><span>Условия за резервация</span><textarea value={profile.booking_terms} onChange={(event) => setProfile({ ...profile, booking_terms: event.target.value })} placeholder="Напр. При закъснение над 15 минути часът може да бъде отменен." maxLength={2000} /></label>
            <label className="settings-toggle full"><input type="checkbox" checked={profile.email_notifications_enabled} onChange={(event) => setProfile({ ...profile, email_notifications_enabled: event.target.checked })} /><span><strong>Имейл известия</strong><small>Потвърждение към клиента и известие към бизнеса, когато има конфигуриран доставчик.</small></span></label>
          </div>
        </> : <>
          <div className="settings-panel-head"><h3>Онлайн асистент</h3><p>Настрой приветствието и правилата, които клиентите могат да отварят в разговора.</p></div>
          <label className="settings-field"><span>Приветствие</span><textarea value={profile.welcome_message} onChange={(event) => setProfile({ ...profile, welcome_message: event.target.value })} placeholder={`Здравей! Аз съм онлайн асистентът на ${business.name}.`} maxLength={500} /></label>
          <label className="settings-field"><span>Допълнителни правила</span><textarea value={profile.bot_instructions} onChange={(event) => setProfile({ ...profile, bot_instructions: event.target.value })} placeholder="Напр. При закъснение над 15 минути се обади предварително..." maxLength={3000} /></label>
          <div className="guided-assistant-note"><strong>Безплатен guided асистент</strong><p>Отговорите се създават само от публикуваните услуги, цени, графици и правила. Не се използва платен AI API и няма цена на съобщение.</p></div>
        </>}
        <div className="settings-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Запазване...' : 'Запази промените'}</button></div>
      </form>}

      {section === 'services' && <section className="settings-panel"><div className="settings-panel-head with-action"><div><h3>Услуги</h3><p>Цени и продължителност за календара.</p></div><button className="primary-button" type="button" onClick={addService}>+ Добави услуга</button></div><div className="editable-list">{services.map((service, index) => <article className="editable-card" key={service.id}><div className="settings-form-grid"><label><span>Име</span><input value={service.name} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /></label><label><span>Цена</span><input type="number" min="0" step="0.01" value={service.price} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, price: event.target.value } : item))} /></label><label><span>Продължителност</span><input type="number" min="5" step="5" value={service.duration_min} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, duration_min: event.target.value } : item))} /></label><label className="full"><span>Описание</span><input value={service.description || ''} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} /></label></div><div className="editable-actions"><button className="danger-link" type="button" onClick={() => archiveService(service.id)}>Архивирай</button><button className="secondary-button" type="button" onClick={() => saveService(service)}>Запази</button></div></article>)}</div></section>}

      {section === 'staff' && <section className="settings-panel"><div className="settings-panel-head with-action"><div><h3>Екип</h3><p>Хората, при които клиентите могат да резервират.</p></div><button className="primary-button" type="button" onClick={addStaff}>+ Добави човек</button></div><div className="editable-list">{staff.map((person, index) => <article className="editable-card" key={person.id}><div className="settings-form-grid"><label><span>Име</span><input value={person.name} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /></label><label><span>Телефон</span><input value={person.phone || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, phone: event.target.value } : item))} /></label><label><span>Имейл</span><input type="email" value={person.email || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, email: event.target.value } : item))} /></label><label><span>Кратко описание</span><input value={person.bio || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, bio: event.target.value } : item))} /></label></div><div className="editable-actions"><button className="danger-link" type="button" onClick={() => archiveStaff(person.id)}>Архивирай</button><button className="secondary-button" type="button" onClick={() => saveStaff(person)}>Запази</button></div></article>)}</div></section>}

      {section === 'hours' && <section className="settings-panel"><div className="settings-panel-head"><h3>Работно време</h3><p>Настрой отделен график за всеки специалист.</p></div>{staff.length === 0 ? <p>Първо добави човек в секция „Екип“.</p> : <><label className="settings-field compact"><span>Специалист</span><select value={selectedStaff} onChange={(event) => setSelectedStaff(event.target.value)}>{staff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label><div className="settings-schedule">{schedule.map((day, index) => <div className={`settings-day ${day.enabled ? '' : 'disabled'}`} key={day.weekday}><label><input type="checkbox" checked={day.enabled} onChange={(event) => setSchedule((current) => current.map((item, i) => i === index ? { ...item, enabled: event.target.checked } : item))} /><strong>{day.label}</strong></label><input type="time" value={day.open} disabled={!day.enabled} onChange={(event) => setSchedule((current) => current.map((item, i) => i === index ? { ...item, open: event.target.value } : item))} /><span>до</span><input type="time" value={day.close} disabled={!day.enabled} onChange={(event) => setSchedule((current) => current.map((item, i) => i === index ? { ...item, close: event.target.value } : item))} /></div>)}</div><div className="settings-actions"><button className="primary-button" type="button" onClick={saveSchedule} disabled={saving}>{saving ? 'Запазване...' : 'Запази графика'}</button></div></>}</section>}

      {section === 'timeoff' && <section className="settings-panel"><div className="settings-panel-head"><h3>Отсъствия и затворени периоди</h3><p>Блокирай отпуск, почивен ден, обучение или временно затваряне. Тези часове веднага изчезват от публичния календар.</p></div><form className="timeoff-form" onSubmit={addTimeOff}><label><span>За кого</span><select required value={newTimeOff.staff_id} onChange={(event) => setNewTimeOff({ ...newTimeOff, staff_id: event.target.value })}>{staff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label><label><span>От</span><input required type="datetime-local" value={newTimeOff.starts_at} onChange={(event) => setNewTimeOff({ ...newTimeOff, starts_at: event.target.value })} /></label><label><span>До</span><input required type="datetime-local" value={newTimeOff.ends_at} onChange={(event) => setNewTimeOff({ ...newTimeOff, ends_at: event.target.value })} /></label><label><span>Причина</span><input value={newTimeOff.reason} onChange={(event) => setNewTimeOff({ ...newTimeOff, reason: event.target.value })} placeholder="Отпуск" /></label><button className="primary-button" type="submit" disabled={!staff.length}>Блокирай периода</button></form><div className="timeoff-list">{timeOff.length === 0 ? <p className="analytics-empty">Няма предстоящи отсъствия.</p> : timeOff.map((item) => { const person = staff.find((row) => row.id === item.staff_id); const starts = DateTime.fromISO(item.starts_at).setZone(business.timezone).setLocale('bg'); const ends = DateTime.fromISO(item.ends_at).setZone(business.timezone).setLocale('bg'); return <article key={item.id}><div><strong>{item.reason || 'Блокиран период'}</strong><span>{person?.name || 'Целият бизнес'} · {starts.toFormat('d LLL, HH:mm')} — {ends.toFormat('d LLL, HH:mm')}</span></div><button className="danger-link" type="button" onClick={() => removeTimeOff(item.id)}>Премахни</button></article> })}</div></section>}

      {section === 'data' && <section className="settings-panel data-control-card"><div className="settings-panel-head"><h3>Контрол върху данните</h3><p>Изтегли машинно четим архив на бизнес профила, настройките, клиентите, резервациите, разговорите и оперативните събития.</p></div><div className="data-export-box"><div><strong>Пълен JSON архив</strong><span>Файлът може да съдържа лични данни. Съхранявай го защитено.</span></div><button className="primary-button" type="button" onClick={exportBusinessData} disabled={saving}>{saving ? 'Подготвяне...' : 'Изтегли архив'}</button></div><p className="security-note">Заявките за изтриване на отделен клиент се изпълняват чрез „Анонимизирай“ в секция „Клиенти“. Историята на часа остава без идентифициращи данни, за да не се наруши календарът.</p></section>}
    </main>
  )
}

export default function SettingsPage() {
  return <OwnerPage title="Настройки">{(props) => <SettingsContent {...props} />}</OwnerPage>
}
