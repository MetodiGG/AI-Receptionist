'use client'

import Link from 'next/link'
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
  })
  const [services, setServices] = useState([])
  const [staff, setStaff] = useState([])
  const [hours, setHours] = useState([])
  const [selectedStaff, setSelectedStaff] = useState('')
  const [schedule, setSchedule] = useState(defaultSchedule)
  const [section, setSection] = useState('business')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const loadCollections = useCallback(async () => {
    const [servicesResult, staffResult, hoursResult] = await Promise.all([
      supabase.from('services').select('*').eq('business_id', business.id).eq('active', true).order('sort_order').order('name'),
      supabase.from('staff').select('*').eq('business_id', business.id).eq('active', true).order('sort_order').order('name'),
      supabase.from('working_hours').select('*').eq('business_id', business.id).order('weekday'),
    ])
    const error = servicesResult.error || staffResult.error || hoursResult.error
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setServices(servicesResult.data || [])
    setStaff(staffResult.data || [])
    setHours(hoursResult.data || [])
    setSelectedStaff((current) => current || staffResult.data?.[0]?.id || '')
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

  return (
    <main className="dashboard-content admin-page settings-page">
      <div className="admin-page-head"><div><p className="auth-kicker">Конфигурация</p><h2>Настройки</h2><p>Промените се отразяват веднага в публичната страница и онлайн асистента.</p></div><Link className="secondary-button" href={`/book/${business.slug}`} target="_blank">Преглед на страницата ↗</Link></div>
      <div className="settings-tabs">
        {[['business', 'Бизнес'], ['services', 'Услуги'], ['staff', 'Екип'], ['hours', 'Работно време'], ['assistant', 'Асистент']].map(([value, label]) => <button type="button" className={section === value ? 'active' : ''} onClick={() => setSection(value)} key={value}>{label}</button>)}
      </div>
      {message && <p className={`form-message ${message.type === 'success' ? 'success' : ''}`} role="alert">{message.text}</p>}

      {(section === 'business' || section === 'assistant') && <form className="settings-panel" onSubmit={saveProfile}>
        {section === 'business' ? <>
          <div className="settings-panel-head"><h3>Бизнес профил</h3><p>Основна информация и правила за онлайн записване.</p></div>
          <div className="settings-form-grid">
            <label><span>Име</span><input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
            <label><span>Телефон</span><input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
            <label className="full"><span>Адрес</span><input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
            <label><span>Резервации до (дни)</span><input type="number" min="1" max="365" value={profile.booking_window_days} onChange={(event) => setProfile({ ...profile, booking_window_days: event.target.value })} /></label>
            <label><span>Минимално предизвестие (минути)</span><input type="number" min="0" max="10080" value={profile.minimum_notice_minutes} onChange={(event) => setProfile({ ...profile, minimum_notice_minutes: event.target.value })} /></label>
            <label><span>Отказ до (часове)</span><input type="number" min="0" max="720" value={profile.cancellation_notice_hours} onChange={(event) => setProfile({ ...profile, cancellation_notice_hours: event.target.value })} /></label>
            <label><span>Часова зона</span><select value={profile.timezone} onChange={(event) => setProfile({ ...profile, timezone: event.target.value })}><option value="Europe/Sofia">София</option><option value="Europe/Berlin">Берлин</option><option value="Europe/London">Лондон</option></select></label>
          </div>
        </> : <>
          <div className="settings-panel-head"><h3>Онлайн асистент</h3><p>Настрой приветствието и правилата, които клиентите могат да отварят в разговора.</p></div>
          <label className="settings-field"><span>Приветствие</span><textarea value={profile.welcome_message} onChange={(event) => setProfile({ ...profile, welcome_message: event.target.value })} placeholder={`Здравей! Аз съм онлайн асистентът на ${business.name}.`} maxLength={500} /></label>
          <label className="settings-field"><span>Допълнителни правила</span><textarea value={profile.bot_instructions} onChange={(event) => setProfile({ ...profile, bot_instructions: event.target.value })} placeholder="Напр. При закъснение над 15 минути се обади предварително..." maxLength={3000} /></label>
        </>}
        <div className="settings-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Запазване...' : 'Запази промените'}</button></div>
      </form>}

      {section === 'services' && <section className="settings-panel"><div className="settings-panel-head with-action"><div><h3>Услуги</h3><p>Цени и продължителност за календара.</p></div><button className="primary-button" type="button" onClick={addService}>+ Добави услуга</button></div><div className="editable-list">{services.map((service, index) => <article className="editable-card" key={service.id}><div className="settings-form-grid"><label><span>Име</span><input value={service.name} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /></label><label><span>Цена</span><input type="number" min="0" step="0.01" value={service.price} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, price: event.target.value } : item))} /></label><label><span>Продължителност</span><input type="number" min="5" step="5" value={service.duration_min} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, duration_min: event.target.value } : item))} /></label><label className="full"><span>Описание</span><input value={service.description || ''} onChange={(event) => setServices((current) => current.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} /></label></div><div className="editable-actions"><button className="danger-link" type="button" onClick={() => archiveService(service.id)}>Архивирай</button><button className="secondary-button" type="button" onClick={() => saveService(service)}>Запази</button></div></article>)}</div></section>}

      {section === 'staff' && <section className="settings-panel"><div className="settings-panel-head with-action"><div><h3>Екип</h3><p>Хората, при които клиентите могат да резервират.</p></div><button className="primary-button" type="button" onClick={addStaff}>+ Добави човек</button></div><div className="editable-list">{staff.map((person, index) => <article className="editable-card" key={person.id}><div className="settings-form-grid"><label><span>Име</span><input value={person.name} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /></label><label><span>Телефон</span><input value={person.phone || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, phone: event.target.value } : item))} /></label><label><span>Имейл</span><input type="email" value={person.email || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, email: event.target.value } : item))} /></label><label><span>Кратко описание</span><input value={person.bio || ''} onChange={(event) => setStaff((current) => current.map((item, i) => i === index ? { ...item, bio: event.target.value } : item))} /></label></div><div className="editable-actions"><button className="danger-link" type="button" onClick={() => archiveStaff(person.id)}>Архивирай</button><button className="secondary-button" type="button" onClick={() => saveStaff(person)}>Запази</button></div></article>)}</div></section>}

      {section === 'hours' && <section className="settings-panel"><div className="settings-panel-head"><h3>Работно време</h3><p>Настрой отделен график за всеки специалист.</p></div>{staff.length === 0 ? <p>Първо добави човек в секция „Екип“.</p> : <><label className="settings-field compact"><span>Специалист</span><select value={selectedStaff} onChange={(event) => setSelectedStaff(event.target.value)}>{staff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label><div className="settings-schedule">{schedule.map((day, index) => <div className={`settings-day ${day.enabled ? '' : 'disabled'}`} key={day.weekday}><label><input type="checkbox" checked={day.enabled} onChange={(event) => setSchedule((current) => current.map((item, i) => i === index ? { ...item, enabled: event.target.checked } : item))} /><strong>{day.label}</strong></label><input type="time" value={day.open} disabled={!day.enabled} onChange={(event) => setSchedule((current) => current.map((item, i) => i === index ? { ...item, open: event.target.value } : item))} /><span>до</span><input type="time" value={day.close} disabled={!day.enabled} onChange={(event) => setSchedule((current) => current.map((item, i) => i === index ? { ...item, close: event.target.value } : item))} /></div>)}</div><div className="settings-actions"><button className="primary-button" type="button" onClick={saveSchedule} disabled={saving}>{saving ? 'Запазване...' : 'Запази графика'}</button></div></>}</section>}
    </main>
  )
}

export default function SettingsPage() {
  return <OwnerPage title="Настройки">{(props) => <SettingsContent {...props} />}</OwnerPage>
}
