import { notFound } from 'next/navigation'
import { PublicAction, PublicActionPair } from '../../../components/public-action'
import styles from '../../../components/public-action.module.css'
import { HOME_DISCOVERY_COPY } from '../../../lib/discovery/home.mjs'
import { DISCOVERY_COPY } from '../../../lib/discovery/copy.mjs'

// Safe, local-only native controls for hover/focus/press checks. No link
// destinations, handlers, booking forms, account data or network actions.
export default async function ButtonStatePreview({ searchParams }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const params = await searchParams
  const locale = params?.lang === 'en' ? 'en' : 'bg', en = locale === 'en'
  const actionStyle = params?.largeText === '1' ? { fontSize: 22, fontFamily: 'Arial, sans-serif' } : undefined
  const copy = HOME_DISCOVERY_COPY[locale]
  return <main className="marketing-page customer-home">
    <section className="discovery-home">
      <h1>{en ? 'Local button design review' : 'Локална проверка на бутоните'}</h1>
      <p>{en ? 'Design only — no bookings, calls, directions or registration.' : 'Само дизайн — без резервации, обаждания, навигация или регистрация.'}</p>
      <article className="home-business-card" data-source="gorez" style={{ maxWidth: 720 }}>
        <PublicActionPair className="home-business-actions" data-button-fit-surface="home">
          <PublicAction type="button" variant="secondary" style={actionStyle}>{DISCOVERY_COPY[locale].directions}</PublicAction>
          <PublicAction type="button" variant="primary" style={actionStyle}>{DISCOVERY_COPY[locale].reserveAppointment}</PublicAction>
        </PublicActionPair>
      </article>
      <section className="profile-redesign" style={{ marginTop: 32 }} aria-label={en ? 'Service button and disabled state' : 'Бутон за услуга и неактивно състояние'}>
        <h2>{en ? 'Choose a service' : 'Избор на услуга'}</h2>
        <PublicAction iconOnly type="button" style={actionStyle} aria-label={en ? 'Book · demo service' : 'Резервирай · примерна услуга'}>{DISCOVERY_COPY[locale].reserveAppointment}</PublicAction>
        <PublicActionPair className="home-business-actions" data-button-fit-surface="disabled">
          <PublicAction type="button" variant="secondary" style={actionStyle} disabled>{DISCOVERY_COPY[locale].directions}</PublicAction>
          <PublicAction type="button" variant="primary" style={actionStyle} disabled>{DISCOVERY_COPY[locale].reserveAppointment}</PublicAction>
        </PublicActionPair>
      </section>
      <section className="home-business-card" style={{ marginTop: 32, maxWidth: 300 }} aria-label={en ? 'Narrow booking controls' : 'Тесни бутони за резервация'}>
        <h2>{en ? 'Narrow controls' : 'Тесни бутони'}</h2>
        <PublicActionPair className="home-business-actions" data-button-fit-surface="narrow">
          <PublicAction type="button" variant="secondary" style={actionStyle}>{DISCOVERY_COPY[locale].directions}</PublicAction>
          <div className={styles.outboundForm} data-public-outbound-form><PublicAction type="button" variant="primary" style={actionStyle}>{DISCOVERY_COPY[locale].reserveAppointment}</PublicAction></div>
        </PublicActionPair>
      </section>
      <section className="profile-redesign" style={{ marginTop: 32, maxWidth: 300 }} aria-label={en ? 'Profile booking controls' : 'Бутони за резервация в профила'}>
        <h2>{en ? 'Profile controls' : 'Бутони в профила'}</h2>
        <PublicActionPair className="profile-action-modes" data-button-fit-surface="profile-mode"><PublicAction type="button" variant="primary" style={actionStyle} aria-controls="profile-native-panel">{DISCOVERY_COPY[locale].reserveAppointment}</PublicAction><button type="button" style={actionStyle}>{en ? 'Online assistant' : 'Онлайн асистент'}</button></PublicActionPair>
        <div id="profile-native-panel" data-button-fit-surface="profile-external" style={{ marginTop: 16 }}><PublicAction type="button" variant="primary" style={actionStyle}>{DISCOVERY_COPY[locale].reserveAppointment}</PublicAction></div>
      </section>
      <section className="partners-page platform-home" aria-label={en ? 'Partner profile link spacing' : 'Разстояние до профила на партньор'}>
        <div className="business-directory">
          <h2>{en ? 'LOCAL DESIGN TEST · Booking and profile navigation disabled' : 'ЛОКАЛЕН ДИЗАЙН ТЕСТ · Без резервации и отваряне на профили'}</h2>
          <p>{en ? 'Fictional services and prices. The external wrapper is not a form; profile labels have no destination.' : 'Измислени услуги и цени. Външният бутон не е във формуляр; текстовете за профил са без линк.'}</p>
          <div className="directory-results-grid">
            <article className="directory-business-card" data-button-fit-surface="directory-external">
              <div className="directory-business-head"><div><h3>{en ? 'DEMO · External booking studio' : 'ДЕМО · Студио с външен календар'}</h3></div></div>
              <div className="directory-services"><small>{en ? 'Services' : 'Услуги'}</small><div><div className="directory-service-row"><div className="service-photo-name"><div className="directory-service-copy">{en ? 'Fictional haircut' : 'Примерно подстригване'}<small>30 {en ? 'min' : 'мин'}</small></div></div><b>18,00 €</b></div></div></div>
              <p>{en ? 'Check available times on the business’s website' : 'Провери свободните часове в сайта на бизнеса'}</p>
              <div className={styles.outboundForm} data-public-outbound-form><PublicAction type="button" variant="primary" className="directory-reservation-action" style={actionStyle}>{DISCOVERY_COPY[locale].reserveAppointment}</PublicAction></div>
              <a role="link" aria-disabled="true">{en ? 'View GoRez profile' : 'Виж профила в GoRez'}</a>
            </article>
            <article className="directory-business-card" data-button-fit-surface="directory-phone">
              <div className="directory-business-head"><div><h3>{en ? 'DEMO · Phone booking studio' : 'ДЕМО · Студио с часове по телефон'}</h3></div></div>
              <div className="directory-services"><small>{en ? 'Services' : 'Услуги'}</small><div><div className="directory-service-row"><div className="service-photo-name"><div className="directory-service-copy">{en ? 'Fictional manicure' : 'Примерен маникюр'}<small>45 {en ? 'min' : 'мин'}</small></div></div><b>25,00 €</b></div></div></div>
              <p>{en ? 'Arrange an appointment by phone' : 'Уговори час по телефон'}</p>
              <PublicAction type="button" variant="primary" className="directory-reservation-action" style={actionStyle}>{DISCOVERY_COPY[locale].reserveAppointment}</PublicAction>
              <a role="link" aria-disabled="true">{en ? 'View GoRez profile' : 'Виж профила в GoRez'}</a>
            </article>
          </div>
        </div>
      </section>
      <nav className="home-discovery-bottom" aria-label={en ? 'Registration button review' : 'Проверка на регистрационния бутон'}>
        <button type="button" className="home-bottom-card home-bottom-business" aria-label={copy.register}><span className="home-business-signup"><strong>{copy.registerAction}</strong><span className="home-free-label">{copy.free}</span></span></button>
      </nav>
    </section>
  </main>
}
