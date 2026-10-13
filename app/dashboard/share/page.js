'use client'

import { useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'

function ShareContent({ business }) {
  const [copied, setCopied] = useState('')
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const bookingUrl = `${origin}/book/${business.slug}`
  const calendarUrl = `${origin}/api/calendar/${business.calendar_feed_token}`
  const widgetCode = `<script src="${origin}/ai-receptionist-widget.js" data-business="${business.slug}" data-label="Запази час" async></script>`

  async function copy(value, key) {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    window.setTimeout(() => setCopied(''), 1800)
  }

  return <main className="dashboard-content admin-page share-page"><div className="admin-page-head"><div><p className="auth-kicker">Разпространение</p><h2>Сподели и вгради</h2><p>Един линк за Google, Instagram, QR материали и съществуващия сайт.</p></div><a className="primary-button" href={bookingUrl} target="_blank" rel="noreferrer">Отвори страницата ↗</a></div><div className="share-grid"><section className="settings-panel share-primary"><div className="settings-panel-head"><h3>Публичен линк</h3><p>Постави го в Google Business Profile, Instagram bio, Facebook и съобщения.</p></div><div className="copy-row"><input readOnly value={bookingUrl} /><button className="secondary-button" type="button" onClick={() => copy(bookingUrl, 'link')}>{copied === 'link' ? 'Копирано ✓' : 'Копирай'}</button></div><div className="qr-card"><img src={`/api/public/${business.slug}/qr`} alt={`QR код за ${business.name}`} /><div><h4>QR код за печат</h4><p>Клиентът сканира и отваря директно резервациите.</p><a href={`/api/public/${business.slug}/qr`} download={`${business.slug}-qr.svg`}>Изтегли SVG</a></div></div></section><section className="settings-panel"><div className="settings-panel-head"><h3>Бутон за твоя сайт</h3><p>Постави този код преди затварящия body таг. Работи на WordPress, Wix и стандартен сайт.</p></div><textarea className="embed-code" readOnly value={widgetCode} /><button className="secondary-button" type="button" onClick={() => copy(widgetCode, 'widget')}>{copied === 'widget' ? 'Копирано ✓' : 'Копирай кода'}</button><div className="widget-preview"><span>Преглед</span><button type="button">✦ Запази час</button></div></section><section className="settings-panel calendar-feed-card"><div className="settings-panel-head"><h3>Календарен feed</h3><p>Добави URL адреса като календар по абонамент в Google Calendar, Apple Calendar или Outlook. Новите резервации се появяват автоматично.</p></div><div className="copy-row"><input readOnly value={calendarUrl} /><button className="secondary-button" type="button" onClick={() => copy(calendarUrl, 'calendar')}>{copied === 'calendar' ? 'Копирано ✓' : 'Копирай'}</button></div><p className="security-note">Линкът е личен ключ за четене на календара. Не го публикувай.</p></section></div></main>
}

export default function SharePage() {
  return <OwnerPage title="Споделяне">{(props) => <ShareContent {...props} />}</OwnerPage>
}

