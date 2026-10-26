'use client'

import { useState } from 'react'
import { publicProfileDetails } from '../lib/business-profile.mjs'
import { supabase } from '../lib/supabase'

export function BusinessPublicProfileEditor({ business, locale, onSaved }) {
  const en = locale === 'en', initial = publicProfileDetails(business)
  const [description, setDescription] = useState(initial.description), [payments, setPayments] = useState(initial.payments), [brands, setBrands] = useState(initial.brands.join(', '))
  const [latitude, setLatitude] = useState(initial.latitude ?? ''), [longitude, setLongitude] = useState(initial.longitude ?? ''), [reviews, setReviews] = useState(business.review_requests_enabled ?? true)
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(null)
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    if ((latitude === '') !== (longitude === '')) { setMessage({ error: true, text: en ? 'Enter both coordinates, or leave both blank.' : 'Попълни и двете координати или остави и двете празни.' }); return }
    setBusy(true); setMessage(null)
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error('UNAUTHORIZED')
      const response = await fetch('/api/owner/public-profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ businessId: business.id, profile: { description, payments, brands: [...new Set(brands.split(',').map(value => value.trim()).filter(Boolean))], latitude: latitude === '' ? null : Number(latitude), longitude: longitude === '' ? null : Number(longitude) }, reviewRequestsEnabled: reviews }) })
      if (!response.ok) throw new Error('SAVE_FAILED')
      await onSaved()
      setMessage({ text: en ? 'Public profile saved.' : 'Публичният профил е запазен.' })
    } catch { setMessage({ error: true, text: en ? 'Could not save. Check the fields and your sign-in, then try again.' : 'Не успяхме да запазим. Провери полетата и входа си, после опитай отново.' }) }
    finally { setBusy(false) }
  }
  return <form className="settings-panel public-profile-editor" onSubmit={submit}><div className="settings-panel-head"><h3>{en ? 'Public business profile' : 'Публична страница на бизнеса'}</h3><p>{en ? 'Optional details. Only fill in information that is accurate and ready to publish.' : 'Незадължителни детайли. Попълвай само вярна информация, готова за публикуване.'}</p></div>
    <div className="settings-form-grid"><label className="full"><span>{en ? 'About the business — Bulgarian' : 'За бизнеса — на български'}</span><textarea rows={4} maxLength={2000} value={description.bg} onChange={event => setDescription({ ...description, bg: event.target.value })} /></label><label className="full"><span>{en ? 'About the business — English' : 'За бизнеса — на английски'}</span><textarea rows={4} maxLength={2000} value={description.en} onChange={event => setDescription({ ...description, en: event.target.value })} /></label>
      <fieldset className="full public-profile-payments"><legend>{en ? 'Accepted payment methods' : 'Приемани начини на плащане'}</legend>{[['cash', en ? 'Cash' : 'В брой'], ['card', en ? 'Card' : 'С карта'], ['bank', en ? 'Bank transfer' : 'Банков превод']].map(([key, label]) => <label key={key}><input type="checkbox" checked={payments.includes(key)} onChange={event => setPayments(current => event.target.checked ? [...current, key] : current.filter(item => item !== key))} />{label}</label>)}</fieldset>
      <label className="full"><span>{en ? 'Brands you work with' : 'Марки, с които работиш'}</span><input maxLength={1300} value={brands} onChange={event => setBrands(event.target.value)} /><small>{en ? 'Separate names with commas. Up to 20 brands, 60 characters each. Leave empty if not applicable.' : 'Разделяй имената със запетая. До 20 марки, по 60 символа. Остави празно, ако не е приложимо.'}</small></label>
      <label><span>{en ? 'Latitude (optional)' : 'Географска ширина (по желание)'}</span><input type="number" step="any" min="-90" max="90" value={latitude} onChange={event => setLatitude(event.target.value)} /></label><label><span>{en ? 'Longitude (optional)' : 'Географска дължина (по желание)'}</span><input type="number" step="any" min="-180" max="180" value={longitude} onChange={event => setLongitude(event.target.value)} /></label>
      <p className="full helper-text">{en ? 'Coordinates must point to your public business entrance. They enable the map. Without them, directions use your saved address.' : 'Координатите трябва да сочат публичния вход на бизнеса. Те включват картата. Без тях упътването използва запазения адрес.'}</p>
    </div>
    <label className="booking-consent"><input type="checkbox" checked={reviews} onChange={event => setReviews(event.target.checked)} /><span>{en ? 'Send one review invitation after a completed visit' : 'Изпращай еднократна покана за отзив след приключено посещение'}</span></label>
    <p className="helper-text">{en ? 'Mark the visit as Completed in the calendar. The invitation is sent no earlier than one hour after its end, only when booking email notifications are enabled. No historical backfill.' : 'Отбележи посещението като „Завършен“ в календара. Поканата се изпраща най-рано един час след края му, само при включени имейл известия за резервацията. Няма изпращане със задна дата.'}</p>
    {message && <p className={`form-message${message.error ? '' : ' success'}`} role="status">{message.text}</p>}<div className="settings-actions"><button type="submit" className="primary-button" disabled={busy}>{busy ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Save public profile' : 'Запази публичната страница')}</button></div>
  </form>
}
