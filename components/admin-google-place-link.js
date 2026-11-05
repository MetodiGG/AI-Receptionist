'use client'

import { useEffect, useState } from 'react'

export function AdminGooglePlaceLink({ businessId, locale = 'bg', send, onBusy, onDirty, preview = false }) {
  const en = locale === 'en'
  const [placeId, setPlaceId] = useState(''), [saved, setSaved] = useState(''), [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(!preview), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  useEffect(() => {
    if (preview) return
    let active = true
    send(`/api/admin/businesses/${businessId}/discovery`).then(body => { if (active) { setPlaceId(body.link?.placeId || ''); setSaved(body.link?.placeId || ''); setLoading(false) } }).catch(() => { if (active) { setError(en ? 'The current link could not be loaded. Close and try again.' : 'Не успяхме да заредим текущата връзка. Затвори и опитай отново.'); setLoading(false) } })
    return () => { active = false }
  }, [businessId, preview, send, en])
  async function save(event) {
    event.preventDefault()
    if (loading || busy || !checked || !/^[A-Za-z0-9_-]{5,200}$/.test(placeId.trim())) return
    setBusy(true); onBusy(true); setError(''); setNotice('')
    try {
      if (!preview) await send(`/api/admin/businesses/${businessId}/discovery`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placeId: placeId.trim(), identityChecked: true }) })
      setSaved(placeId.trim()); setPlaceId(placeId.trim()); setChecked(false); onDirty(false)
      setNotice(preview ? (en ? 'Local preview only — nothing saved.' : 'Само локален преглед — няма запис.') : en ? 'Verified Google listing linked. Ratings require the separately enabled Google integration.' : 'Провереният Google обект е свързан. Оценките изискват отделно включената Google интеграция.')
    } catch (problem) { setError(problem.code === 'PLACE_ALREADY_LINKED' ? (en ? 'This Google listing is already linked to another partner.' : 'Този Google обект вече е свързан с друг партньор.') : en ? 'Could not save the link.' : 'Не успяхме да запазим връзката.') }
    finally { setBusy(false); onBusy(false) }
  }
  async function unlink() {
    if (busy || !saved || !window.confirm(en ? 'Remove only the Google listing link? GoRez reviews and bookings will stay unchanged.' : 'Да премахнем ли само връзката с Google? GoRez отзивите и резервациите остават непроменени.')) return
    setBusy(true); onBusy(true); setError(''); setNotice('')
    try {
      if (!preview) await send(`/api/admin/businesses/${businessId}/discovery`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placeId: null, identityChecked: true }) })
      setPlaceId(''); setSaved(''); setChecked(false); onDirty(false)
      setNotice(preview ? (en ? 'Local preview — nothing removed.' : 'Локален преглед — нищо не е премахнато.') : en ? 'Google link removed. GoRez reviews are unchanged.' : 'Google връзката е премахната. GoRez отзивите са непроменени.')
    } catch { setError(en ? 'Could not remove the link.' : 'Не успяхме да премахнем връзката.') }
    finally { setBusy(false); onBusy(false) }
  }
  const valid = /^[A-Za-z0-9_-]{5,200}$/.test(placeId.trim())
  return <form onSubmit={save} className="admin-google-place-link">
    <h3>{en ? 'Google Maps rating' : 'Оценка от Google Maps'}</h3>
    <p>{en ? 'Link the exact Google listing after checking the business, branch and address. Scores stay in Google’s attributed widget, separate from GoRez reviews.' : 'Свържи точния Google обект след проверка на бизнеса, филиала и адреса. Google оценката се показва отделно от GoRez отзивите.'}</p>
    <fieldset disabled={busy || loading || Boolean(error && !saved && !placeId)}>
      <label>Google Place ID<input value={placeId} autoComplete="off" minLength={5} maxLength={200} required onChange={event => { setPlaceId(event.target.value); setChecked(false); setNotice(''); onDirty(true) }}/></label>
      {valid && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeId.trim())}&query_place_id=${encodeURIComponent(placeId.trim())}`} target="_blank" rel="noopener noreferrer">{en ? 'Check this Google listing' : 'Провери този Google обект'} ↗</a>}
      <label className="booking-consent"><input type="checkbox" required checked={checked} onChange={event => { setChecked(event.target.checked); onDirty(true) }}/>{en ? 'I checked that this is the exact business and branch, not just a matching name.' : 'Проверих, че това е точният бизнес и филиал, не само съвпадение по име.'}</label>
      <button type="submit" className="primary-button" disabled={!valid || !checked || loading || busy}>{en ? 'Save verified link' : 'Запази проверената връзка'}</button>
      {saved && <button type="button" className="secondary-button" onClick={unlink} disabled={busy}>{en ? 'Remove Google link' : 'Премахни Google връзката'}</button>}
    </fieldset>
    {loading && <p role="status">{en ? 'Loading…' : 'Зареждане…'}</p>}
    {error && <p className="form-message" role="alert">{error}</p>}
    {notice && <p className="form-message" role="status">{notice}</p>}
  </form>
}
