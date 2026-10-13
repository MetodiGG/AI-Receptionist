'use client'

import { useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { buildPublicBookingUrl, resolvePublicOrigin } from '../../../lib/public-url.mjs'

function ShareContent({ business }) {
  const [copied, setCopied] = useState('')
  const [message, setMessage] = useState('')
  const runtimeOrigin = typeof window === 'undefined' ? '' : window.location.origin
  const publicOrigin = resolvePublicOrigin(process.env.NEXT_PUBLIC_APP_URL, runtimeOrigin)
  const bookingUrl = buildPublicBookingUrl(publicOrigin, business.slug)
  const calendarUrl = business.calendar_feed_token ? `${publicOrigin}/api/calendar/${business.calendar_feed_token}` : ''
  const qrUrl = `${runtimeOrigin}/api/public/${encodeURIComponent(business.slug)}/qr`
  const widgetCode = `<script src="${publicOrigin}/ai-receptionist-widget.js" data-business="${business.slug}" data-label="Запази час" async></script>`
  const shareText = `Запази час в ${business.name}: ${bookingUrl}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const emailUrl = `mailto:?subject=${encodeURIComponent(`Онлайн резервация в ${business.name}`)}&body=${encodeURIComponent(shareText)}`

  async function copy(value, key) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setMessage('Копирано. Можеш да го поставиш където пожелаеш.')
      window.setTimeout(() => { setCopied(''); setMessage('') }, 2200)
    } catch {
      setMessage('Маркирай адреса и използвай Copy от браузъра.')
    }
  }

  async function share() {
    if (!navigator.share) {
      await copy(bookingUrl, 'share')
      return
    }

    try {
      await navigator.share({ title: `Резервация в ${business.name}`, text: `Запази час в ${business.name}`, url: bookingUrl })
    } catch (error) {
      if (error?.name !== 'AbortError') setMessage('Не успяхме да отворим менюто за споделяне.')
    }
  }

  return (
    <main className="dashboard-content admin-page share-page">
      <div className="admin-page-head">
        <div>
          <p className="auth-kicker">Споделяне</p>
          <h2>Клиентите ти са на един клик разстояние</h2>
          <p>Изпрати линка директно или добави резервациите към профила и сайта на бизнеса.</p>
        </div>
        <a className="primary-button" href={bookingUrl} target="_blank" rel="noreferrer">Преглед като клиент ↗</a>
      </div>

      {message && <p className="share-message" role="status">{message}</p>}

      <section className="share-quick-card">
        <div className="share-link-intro">
          <span className="share-live-dot" aria-hidden="true" />
          <div><strong>Публичната страница е готова</strong><small>Този постоянен адрес е подходящ за клиенти и QR материали.</small></div>
        </div>
        <div className="share-link-box"><span>{bookingUrl}</span><button type="button" onClick={() => copy(bookingUrl, 'link')}>{copied === 'link' ? 'Копирано ✓' : 'Копирай линка'}</button></div>
        <div className="share-actions" aria-label="Начини за споделяне">
          <button type="button" onClick={share}>Сподели от телефона</button>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href={emailUrl}>Имейл</a>
          <a href={bookingUrl} target="_blank" rel="noreferrer">Отвори страницата</a>
        </div>
      </section>

      <div className="share-grid">
        <section className="settings-panel share-primary">
          <div className="settings-panel-head"><h3>QR код за мястото и рекламите</h3><p>Свали го и го постави на рецепцията, визитка, витрина или публикация.</p></div>
          <div className="qr-card">
            <div className="qr-preview"><img src={qrUrl} alt={`QR код за резервации в ${business.name}`} /></div>
            <div><span className="share-step">СКАНИРАЙ → ИЗБЕРИ → ЗАПАЗИ</span><h4>Директно към свободните часове</h4><p>Клиентът не прави регистрация и не инсталира приложение.</p><div className="qr-actions"><a className="secondary-button" href={`${qrUrl}?download=1`}>Изтегли QR кода</a><button className="ghost-button" type="button" onClick={() => copy(bookingUrl, 'qr-link')}>{copied === 'qr-link' ? 'Копирано ✓' : 'Копирай адреса'}</button></div></div>
          </div>
        </section>

        <section className="settings-panel embed-panel">
          <div className="settings-panel-head"><h3>Бутон в съществуващ сайт</h3><p>Копирай кода и го изпрати на човека, който поддържа сайта. Работи с WordPress, Wix и стандартен сайт.</p></div>
          <div className="widget-preview"><span>Как ще изглежда</span><button type="button">✦ Запази час</button></div>
          <details className="embed-details"><summary>Покажи кода за вграждане</summary><textarea className="embed-code" readOnly value={widgetCode} /><button className="secondary-button" type="button" onClick={() => copy(widgetCode, 'widget')}>{copied === 'widget' ? 'Копирано ✓' : 'Копирай кода'}</button></details>
        </section>

        <section className="settings-panel calendar-feed-card">
          <div className="settings-panel-head"><h3>Календар на бизнеса</h3><p>Добави резервациите към Google Calendar, Apple Calendar или Outlook чрез частния адрес.</p></div>
          {calendarUrl ? <><div className="copy-row"><input aria-label="Частен адрес на календара" readOnly value={calendarUrl} /><button className="secondary-button" type="button" onClick={() => copy(calendarUrl, 'calendar')}>{copied === 'calendar' ? 'Копирано ✓' : 'Копирай'}</button></div><p className="security-note">Този адрес дава достъп за четене на календара. Не го публикувай и не го изпращай на клиенти.</p></> : <p className="share-warning">Обнови страницата, за да се зареди частният календарен адрес.</p>}
        </section>
      </div>
    </main>
  )
}

export default function SharePage() {
  return <OwnerPage title="Споделяне">{(props) => <ShareContent {...props} />}</OwnerPage>
}

