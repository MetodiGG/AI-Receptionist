'use client'

import { useState } from 'react'
import { publicProfileDetails } from '../lib/business-profile.mjs'
import { parseContentUpdate } from '../lib/business-content.mjs'
import { getIndustryLabel } from '../lib/public-locale.mjs'
import { PARTNER_CATEGORY_KEYS } from '../lib/partner-leads.mjs'
import { scheduleFromHours } from '../lib/business-schedule.mjs'
import { BusinessLocationFields } from './business-location-fields'
import { DurationInput } from './duration-input'
import { WeeklyScheduleFields } from './weekly-schedule-fields'
import { BusinessMediaEditor } from './business-media-editor'
import { BusinessCoordinatesFields } from './business-coordinates-fields'
import { BusinessBookingSettings } from './business-booking-settings'
import { AdminGooglePlaceLink } from './admin-google-place-link'
import { ServicePricingFields } from './service-pricing-fields'
import { ServiceNameInput } from './service-name-input'

const week = locale => (locale === 'en' ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] : ['Понеделник','Вторник','Сряда','Четвъртък','Петък','Събота','Неделя']).map((label, i) => [i + 1, label])
export function editorBusinessDraft(b) {
  const defaults = { name: '', slug: '', phone: '', contact_email: '', address: '', city_ekatte: '', neighborhood: '', industry: 'other', timezone: 'Europe/Sofia', website_url: '', privacy_contact_email: '', booking_terms: '', default_duration_min: 45, booking_slot_minutes: 15, booking_window_days: 60, minimum_notice_minutes: 60, cancellation_notice_hours: 12, email_notifications_enabled: true, notification_locale: 'bg', review_requests_enabled: true, welcome_message: '', bot_instructions: '' }
  return { ...Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, b[key] ?? fallback])), public_profile: publicProfileDetails(b) }
}
function Field({ label, value, onChange, type = 'text', ...props }) { return <label><span>{label}</span><input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} {...props}/></label> }
export function AdminBusinessEditor({ detail, locale, send, onSaved, onBusy, onDirty, section, onSection, preview = false }) {
  const en = locale === 'en', b = detail.business
  const [business, setBusiness] = useState(() => editorBusinessDraft(b)), [services, setServices] = useState(() => detail.services.map(({ id, name, description, category, duration_min, price, currency, price_details, active, sort_order }) => ({ id, name, description: description || '', category: category || '', duration_min, price, currency: currency || 'EUR', price_details: price_details || {}, active, sort_order: sort_order || 0 })))
  const [staff, setStaff] = useState(() => detail.staff.map(({ id, name, email, phone, bio, active, sort_order }) => ({ id, name, email: email || '', phone: phone || '', bio: bio || '', active, sort_order: sort_order || 0 })))
  const [personId, setPersonId] = useState(detail.staff[0]?.id || ''), [days, setDays] = useState(() => scheduleFromHours(week(locale), detail.hours || [], detail.staff[0]?.id))
  const [reason, setReason] = useState(''), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [brandsText,setBrandsText]=useState(business.public_profile.brands.join(', '))
  const change = fn => { fn(); setDirty(true); onDirty(true) }
  const update = (key, value) => change(() => setBusiness(current => ({ ...current, [key]: value })))
  const profile = (key, value) => update('public_profile', { ...business.public_profile, [key]: value })
  const row = (setter, index, key, value) => change(() => setter(current => current.map((item, i) => i === index ? { ...item, [key]: value } : item)))
  function choose(value) {
    if (busy || value === section) return
    if (dirty && !window.confirm(en ? 'Discard unsaved changes in this section?' : 'Да се откажем ли от незапазените промени в този раздел?')) return
    onDirty(false); onSection(value)
  }
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError('')
    const envelope = { revision: b.content_revision || 0, section: section === 'public' ? 'business' : section, payload: section === 'business' || section === 'public' ? business : section === 'services' ? services : section === 'staff' ? staff : { staffId: personId, days: days.map(({ weekday, enabled, open, close, breakEnabled, breakStart, breakEnd }) => ({ weekday, enabled, open, close, breakEnabled, breakStart, breakEnd })) }, reason }
    let input
    try { input = parseContentUpdate(envelope) }
    catch { setError(en ? 'Check required fields, exact minutes, prices and the reason.' : 'Провери задължителните полета, минутите, цените и причината.'); return }
    setBusy(true); onBusy(true)
    try {
      // Validation derives server-owned fields (such as city). Send the original
      // strict-schema input, not that transformed output, for one server parse.
      if (!preview) await send(`/api/admin/businesses/${b.id}/content`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(envelope) })
      onDirty(false); setDirty(false)
      await onSaved(preview ? input : null)
    } catch (problem) {
      const labels = { CONTENT_CHANGED: en ? 'Another edit was saved. Close, refresh and review before saving again.' : 'Има друга запазена промяна. Затвори, обнови и прегледай преди нов запис.', WRONG_BUSINESS: en ? 'The selected record does not belong to this business.' : 'Избраният запис не принадлежи на този бизнес.', TIMEZONE_BOOKINGS: en ? 'Time zone cannot change while upcoming bookings exist.' : 'Часовата зона не може да се сменя при предстоящи резервации.', ADDRESS_IN_USE: en ? 'This page address is already taken.' : 'Този адрес на страницата е зает.', SCHEDULE_CONFLICT: en ? 'The new schedule conflicts with booked visits. Keep the hours covering those visits.' : 'Новият график противоречи на записани часове. Запази работното време, което ги покрива.' }
      setError(labels[problem.code] || (en ? 'Could not save. Refresh and try again; existing bookings have not been changed.' : 'Не успяхме да запазим. Обнови и опитай отново; съществуващите резервации не са променени.'))
    } finally { setBusy(false); onBusy(false) }
  }
  const tabs = [['business', en ? 'Details' : 'Данни'], ['public', en ? 'Public profile' : 'Публичен профил'], ['services', en ? 'Services' : 'Услуги'], ['staff', en ? 'Team' : 'Екип'], ['booking',en?'Booking method':'Начин на резервация'],['hours', en ? 'Hours' : 'График'], ['photos', en ? 'Photos' : 'Снимки'], ['google', 'Google Maps']]
  return <div className="admin-business-editor"><nav className="settings-tabs" aria-label={en ? 'Edit business sections' : 'Редактиране на бизнес'}>{tabs.map(([key, label]) => <button type="button" disabled={busy} aria-pressed={section === key} key={key} onClick={() => choose(key)}>{label}</button>)}</nav>
    {section === 'google' ? <AdminGooglePlaceLink businessId={b.id} locale={locale} send={send} onDirty={value=>{setDirty(value);onDirty(value)}} onBusy={value=>{setBusy(value);onBusy(value)}} preview={preview}/> : section==='booking'?<BusinessBookingSettings business={b} locale={locale} admin send={send} onDirty={value=>{setDirty(value);onDirty(value)}} onBusy={value=>{setBusy(value);onBusy(value)}} onSaved={()=>{setDirty(false);onDirty(false);onSaved(null)}} preview={preview}/>:section === 'photos' ? <BusinessMediaEditor businessId={b.id} locale={locale} onBusy={onBusy} onSaved={() => onSaved(null)} preview={preview ? { business: b, staff: detail.staff, media: [] } : null}/> : <form onSubmit={submit}>
      <fieldset disabled={busy} className="content-fields">
        {section === 'business' && <div className="settings-form-grid">
          <Field label={en ? 'Business name' : 'Име на бизнеса'} required maxLength={120} value={business.name} onChange={value => update('name', value)}/>
          <label>{en ? 'Business category' : 'Тип бизнес'}<select value={business.industry} onChange={e => update('industry', e.target.value)}>{PARTNER_CATEGORY_KEYS.map(key => <option key={key} value={key}>{getIndustryLabel(key, locale)}</option>)}</select></label>
          <Field label={en ? 'Phone' : 'Телефон'} value={business.phone} onChange={value => update('phone', value)} maxLength={32}/><Field label={en ? 'Booking contact email' : 'Имейл за резервации'} type="email" value={business.contact_email} onChange={value => update('contact_email', value)}/>
          <div className="full"><BusinessLocationFields required cityCode={business.city_ekatte} neighborhood={business.neighborhood} locale={locale} onChange={patch => change(() => setBusiness(current => ({ ...current, ...patch })))}/></div>
          <Field label={en ? 'Street address' : 'Адрес'} required maxLength={250} value={business.address} onChange={value => update('address', value)}/><Field label={en ? 'Website' : 'Сайт'} type="url" value={business.website_url} onChange={value => update('website_url', value)}/>
          <Field label={en ? 'Public page address (changes old links)' : 'Адрес на страницата (сменя старите линкове)'} required value={business.slug} onChange={value => update('slug', value)} maxLength={48}/>
          <label>{en ? 'Time zone' : 'Часова зона'}<select value={business.timezone} onChange={e => update('timezone', e.target.value)}>{['Europe/Sofia','Europe/London','Europe/Berlin'].map(zone => <option key={zone}>{zone}</option>)}</select></label>
          <label>{en ? 'Default duration (min)' : 'Обичайна продължителност (мин)'}<DurationInput value={business.default_duration_min} onChange={value => update('default_duration_min', value)} locale={locale} required/></label>
          <label>{en ? 'Slot start interval (min)' : 'Стъпка между начални часове (мин)'}<select value={business.booking_slot_minutes} onChange={e => update('booking_slot_minutes', e.target.value)}>{[5,10,15,20,30,45,60].map(n => <option key={n}>{n}</option>)}</select></label>
          {[[en ? 'Booking window (days)' : 'Период за записване (дни)', 'booking_window_days',1,365],[en ? 'Minimum notice (minutes)' : 'Минимално предизвестие (мин)', 'minimum_notice_minutes',0,10080],[en ? 'Cancellation notice (hours)' : 'Отказване предварително (часа)','cancellation_notice_hours',0,720]].map(([label,key,min,max]) => <Field key={key} label={label} type="number" min={min} max={max} required value={business[key]} onChange={value => update(key, value)}/>)}
        </div>}
        {section === 'public' && <div className="settings-form-grid">
          {['bg','en'].map(lang => <label className="full" key={lang}>{en ? 'About' : 'За бизнеса'} · {lang.toUpperCase()}<textarea rows={4} maxLength={2000} value={business.public_profile.description[lang]} onChange={e => profile('description', { ...business.public_profile.description, [lang]: e.target.value })}/></label>)}
          <label className="full">{en ? 'Brands, separated by commas' : 'Марки, разделени със запетая'}<input value={brandsText} onChange={e => {setBrandsText(e.target.value);profile('brands', e.target.value.split(',').map(v => v.trim()).filter(Boolean))}}/></label>
          <div className="full public-profile-payments">{[['cash', en ? 'Cash' : 'В брой'],['card', en ? 'Card' : 'С карта'],['bank', en ? 'Bank transfer' : 'Банков превод']].map(([key,label]) => <label key={key}><input type="checkbox" checked={business.public_profile.payments.includes(key)} onChange={e => profile('payments', e.target.checked ? [...business.public_profile.payments,key] : business.public_profile.payments.filter(v => v !== key))}/>{label}</label>)}</div>
          <BusinessCoordinatesFields latitude={business.public_profile.latitude} longitude={business.public_profile.longitude} locale={locale} onChange={point => update('public_profile', { ...business.public_profile, latitude: point.latitude === '' || point.latitude == null ? null : Number(point.latitude), longitude: point.longitude === '' || point.longitude == null ? null : Number(point.longitude) })}/>
          <Field label={en ? 'Privacy contact email' : 'Имейл за поверителност'} type="email" value={business.privacy_contact_email} onChange={value => update('privacy_contact_email', value)}/>
          <label>{en ? 'Email language' : 'Език на имейлите'}<select value={business.notification_locale} onChange={e => update('notification_locale', e.target.value)}><option value="bg">BG</option><option value="en">EN</option></select></label>
          {['booking_terms','welcome_message','bot_instructions'].map((key, i) => <label className="full" key={key}>{(en ? ['Booking terms','Welcome message','Assistant instructions'] : ['Условия за резервации','Приветствие','Инструкции за асистента'])[i]}<textarea rows={3} maxLength={i === 0 ? 5000 : i === 1 ? 2000 : 8000} value={business[key]} onChange={e => update(key, e.target.value)}/></label>)}
          {[['email_notifications_enabled',en ? 'Booking emails enabled' : 'Имейли за резервации'],['review_requests_enabled',en ? 'Review invitations enabled' : 'Покани за отзив']].map(([key,label]) => <label className="booking-consent" key={key}><input type="checkbox" checked={business[key]} onChange={e => update(key, e.target.checked)}/>{label}</label>)}
        </div>}
        {section === 'services' && <div className="content-repeat-list">{services.map((service,index) => <article key={service.id || `new-${index}`}>
          <div className="service-name-field"><label htmlFor={`admin-service-${service.id || `new-${index}`}`}>{en ? 'Service name' : 'Услуга'}</label><ServiceNameInput id={`admin-service-${service.id || `new-${index}`}`} className="" required value={service.name} industry={business.industry} locale={locale} disabled={busy} onChange={name => row(setServices,index,'name',name)}/></div>
          <label>{en ? 'Description' : 'Описание'}<textarea maxLength={2000} value={service.description} onChange={e => row(setServices,index,'description',e.target.value)}/></label>
          <Field label={en ? 'Category' : 'Категория'} maxLength={80} value={service.category} onChange={v => row(setServices,index,'category',v)}/>
          <Field label={`${en ? 'Price' : 'Цена'} (${service.currency||'EUR'})`} required={!['external','phone'].includes(b.booking_mode)} type="number" min="0" step="0.01" value={service.price} onChange={v => row(setServices,index,'price',v)}/>
          <ServicePricingFields value={service} locale={locale} disabled={busy} onChange={patch => change(() => setServices(current => current.map((item,i) => i === index ? { ...item, ...patch } : item)))}/>
          <label>{en ? 'Minutes' : 'Минути'}<DurationInput value={service.duration_min??''} onChange={v => row(setServices,index,'duration_min',v)} locale={locale} required={!['external','phone'].includes(b.booking_mode)}/></label>
          <label className="booking-consent"><input type="checkbox" checked={service.active} onChange={e => row(setServices,index,'active',e.target.checked)}/>{en ? 'Active service' : 'Активна услуга'}</label>
        </article>)}<button type="button" className="secondary-button" onClick={() => change(() => setServices(current => [...current,{name:'',description:'',category:'',price:['external','phone'].includes(b.booking_mode)?null:0,currency:'EUR',price_details:{},duration_min:['external','phone'].includes(b.booking_mode)?null:business.default_duration_min,active:true,sort_order:current.length}]))}>{en ? '+ Add service' : '+ Добави услуга'}</button></div>}
        {section === 'staff' && <div className="content-repeat-list">{staff.map((person,index) => <article key={person.id || `new-${index}`}>
          <Field label={en ? 'Team member' : 'Специалист'} required value={person.name} onChange={v => row(setStaff,index,'name',v)}/>
          <Field label={en ? 'Email' : 'Имейл'} type="email" value={person.email} onChange={v => row(setStaff,index,'email',v)}/><Field label={en ? 'Phone' : 'Телефон'} value={person.phone} onChange={v => row(setStaff,index,'phone',v)}/>
          <label>{en ? 'Introduction' : 'Представяне'}<textarea rows={3} maxLength={2000} value={person.bio} onChange={e => row(setStaff,index,'bio',e.target.value)}/></label><label className="booking-consent"><input type="checkbox" checked={person.active} onChange={e => row(setStaff,index,'active',e.target.checked)}/>{en ? 'Active specialist' : 'Активен специалист'}</label>
        </article>)}<button type="button" className="secondary-button" onClick={() => change(() => setStaff(current => [...current,{name:'',email:'',phone:'',bio:'',active:true,sort_order:current.length}]))}>{en ? '+ Add team member' : '+ Добави специалист'}</button></div>}
        {section === 'hours' && <><label>{en ? 'Specialist' : 'Специалист'}<select value={personId} onChange={e => { if (dirty && !window.confirm(en ? 'Discard unsaved schedule?' : 'Да се откажем ли от незапазения график?')) return; setPersonId(e.target.value); setDays(scheduleFromHours(week(locale),detail.hours || [],e.target.value)); setDirty(false); onDirty(false) }}>{detail.staff.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><WeeklyScheduleFields days={days.map(day=>({...day,label:week(locale).find(([weekday])=>weekday===day.weekday)?.[1]||day.label}))} onChange={value => change(() => setDays(value))} locale={locale} disabled={busy}/></>}
        <label className="content-edit-reason">{en ? 'Reason in the activity log' : 'Причина за промяната в журнала'}<input required minLength={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)}/></label>
      </fieldset>
      {error && <p className="form-message" role="alert">{error}</p>}<button type="submit" className="primary-button" disabled={busy || !dirty || reason.trim().length < 3}>{busy ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Save changes' : 'Запази промените')}</button>
    </form>}
    {detail.contentAudit?.length>0&&<details className="admin-content-history"><summary>{en?'Recent edits':'Последни корекции'}</summary>{detail.contentAudit.map((entry,index)=><p key={index}><strong>{entry.section}</strong> · {entry.reason}<br/><time>{new Intl.DateTimeFormat(en?'en-GB':'bg-BG',{dateStyle:'short',timeStyle:'short'}).format(new Date(entry.created_at))}</time></p>)}</details>}
  </div>
}
