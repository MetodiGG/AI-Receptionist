'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { BrandLogo } from './brand-logo'
import { LanguageSwitch } from './language-switch'
import { usePublicLocale } from '../hooks/use-public-locale'
import { REVIEW_DIMENSIONS } from '../lib/reviews.mjs'

function RatingField({ name, label, value, onChange, required = false, locale }) {
  return <fieldset className="review-rating-field"><legend>{label}{required ? ' *' : ''}</legend><div className="review-rating-options">{[1, 2, 3, 4, 5].map(number => <label key={number} className={number <= value ? 'chosen' : ''}><input type="radio" name={name} value={number} checked={value === number} required={required} onChange={() => onChange(number)} aria-label={`${number} / 5`} /><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.6l6.3-.9L12 3Z" /></svg><span>{number}</span></label>)}</div>{!required && Boolean(value) && <button className="review-clear-rating" type="button" onClick={() => onChange(undefined)}>{locale === 'en' ? 'Clear' : 'Изчисти'}</button>}</fieldset>
}

export function ReviewForm({ token, initialLocale = 'bg', previewVisit = null }) {
  const { locale, setLocale } = usePublicLocale(initialLocale), en = locale === 'en'
  const [visit, setVisit] = useState(previewVisit), [status, setStatus] = useState(previewVisit ? 'ready' : 'loading')
  const [form, setForm] = useState({ rating: 0, displayName: '', comment: '', consent: false, details: {} }), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const generation = useRef(0)
  useEffect(() => {
    if (previewVisit) return
    const controller = new AbortController(), version = ++generation.current
    setVisit(null); setStatus('loading'); setBusy(false); setError('')
    setForm({ rating: 0, displayName: '', comment: '', consent: false, details: {} })
    fetch(`/api/public/reviews/${token}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (controller.signal.aborted || version !== generation.current) return
      if (!response.ok) { setStatus(response.status === 404 ? 'unavailable' : 'error'); return }
      const body = await response.json()
      if (!controller.signal.aborted && version === generation.current) { setVisit(body.visit); setStatus('ready') }
    }).catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => { controller.abort(); generation.current++ }
  }, [token, previewVisit])
  async function submit(event) {
    event.preventDefault()
    if (busy || !form.rating || !form.consent) return
    const version = generation.current
    setBusy(true); setError('')
    try {
      if (!previewVisit) {
        const response = await fetch(`/api/public/reviews/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const body = await response.json()
        if (version !== generation.current) return
        if (!response.ok) {
          if (response.status === 409) { setVisit(current => ({ ...current, submitted: true })); return }
          if (response.status === 404) { setStatus('unavailable'); return }
          throw new Error(body.error?.code === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'SAVE_FAILED')
        }
      }
      setStatus('saved')
    } catch (problem) { if (version === generation.current) setError(problem.message === 'RATE_LIMITED' ? (en ? 'Please wait a minute before trying again.' : 'Изчакай минута, преди да опиташ отново.') : (en ? 'The review was not saved. Check the fields and try again.' : 'Отзивът не е записан. Провери полетата и опитай отново.')) }
    finally { if (version === generation.current) setBusy(false) }
  }
  const done = status === 'saved' || visit?.submitted
  return <main className="review-page"><header><Link href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo /></Link><LanguageSwitch locale={locale} onChange={setLocale} compact /></header><section className="review-form-card">
    {previewVisit && <p className="auth-kicker">LOCAL QA · fictional visit · no email or database writes</p>}
    {status === 'loading' ? <p role="status">{en ? 'Opening your invitation…' : 'Отваряме поканата ти…'}</p>
      : ['unavailable', 'error'].includes(status) ? <><h1>{status === 'unavailable' ? (en ? 'This invitation is no longer available' : 'Тази покана вече не е достъпна') : (en ? 'Please try again later' : 'Моля, опитай отново по-късно')}</h1><p>{status === 'unavailable' ? (en ? 'The link may have expired or the visit may have changed. Each invitation is valid for 30 days.' : 'Линкът може да е изтекъл или посещението да е променено. Всяка покана е валидна 30 дни.') : (en ? 'Reviews are temporarily unavailable. Nothing has been submitted.' : 'Отзивите временно не са достъпни. Нищо не е изпратено.')}</p></>
        : done ? <div className="review-thank-you" role="status"><span className="success-mark" aria-hidden="true">✓</span><h1>{en ? 'Thank you for your feedback!' : 'Благодарим за мнението ти!'}</h1><p>{en ? 'A review has already been recorded for this visit. Each completed visit can be rated once.' : 'За това посещение вече е записан отзив. Всяко приключено посещение може да се оцени веднъж.'}</p><Link className="primary-button" href={`/book/${visit.business.slug}?lang=${locale}#business-reviews`}>{en ? 'View business profile' : 'Виж профила на бизнеса'}</Link></div>
          : <><p className="booking-eyebrow">{en ? 'Your opinion matters' : 'Твоето мнение е важно'}</p><h1>{en ? 'How was your visit?' : 'Как мина посещението?'}</h1><div className="review-visit-summary"><strong>{visit.business.name}</strong><span>{visit.service}</span><time dateTime={visit.endsAt}>{new Intl.DateTimeFormat(en ? 'en-GB' : 'bg-BG', { dateStyle: 'long', timeZone: 'Europe/Sofia' }).format(new Date(visit.endsAt))}</time></div>
            <form onSubmit={submit}>
              <RatingField name="overall" label={en ? 'Overall rating' : 'Обща оценка'} value={form.rating} onChange={rating => setForm(current => ({ ...current, rating }))} required locale={locale} />
              <label className="review-form-field"><span>{en ? 'Public name or initials' : 'Публично име или инициали'} *</span><input required minLength={2} maxLength={50} autoComplete="off" value={form.displayName} onChange={event => setForm({ ...form, displayName: event.target.value })} /><small>{en ? 'Choose how your name appears. Do not include contact details.' : 'Избери как да се показва името ти. Не включвай данни за контакт.'}</small></label>
              <label className="review-form-field"><span>{en ? 'Your comment (optional)' : 'Твоят коментар (по желание)'}</span><textarea maxLength={1500} rows={4} value={form.comment} onChange={event => setForm({ ...form, comment: event.target.value })} /><small>{form.comment.length} / 1500 · {en ? 'Please do not share personal or sensitive information.' : 'Не споделяй лични или чувствителни данни.'}</small></label>
              <details className="review-extra-details"><summary>{en ? 'Rate a few more details (optional)' : 'Оцени и отделни детайли (по желание)'}</summary>{Object.entries(REVIEW_DIMENSIONS).map(([key, labels]) => <RatingField key={key} name={key} label={labels[locale]} value={form.details[key]} onChange={value => setForm(current => ({ ...current, details: { ...current.details, [key]: value } }))} locale={locale} />)}</details>
              <label className="booking-consent"><input required type="checkbox" checked={form.consent} onChange={event => setForm({ ...form, consent: event.target.checked })} /><span>{en ? 'I agree to publish my chosen name, ratings and comment on this business profile. I have read the ' : 'Съгласен/на съм избраното име, оценките и коментарът да се публикуват в профила на бизнеса. Прочетох '}<Link href={`/privacy?lang=${locale}`} target="_blank" rel="noreferrer">{en ? 'privacy policy' : 'политиката за поверителност'}</Link>.</span></label>
              {error && <p role="alert" className="booking-inline-error">{error}</p>}<button className="primary-button" type="submit" disabled={busy}>{busy ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Publish review' : 'Публикувай отзива')}</button>
            </form></>}
  </section><footer><Link href={`/privacy?lang=${locale}`}>{en ? 'Privacy' : 'Поверителност'}</Link><Link href={`/?lang=${locale}`}>GoRez</Link></footer></main>
}
