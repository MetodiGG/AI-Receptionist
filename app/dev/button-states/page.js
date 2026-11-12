import { notFound } from 'next/navigation'
import { Icon } from '../../../components/icon'
import { BookingButtonContent, BookingCalendarIcon } from '../../../components/booking-button-content'
import { HOME_DISCOVERY_COPY } from '../../../lib/discovery/home.mjs'
import { DISCOVERY_COPY } from '../../../lib/discovery/copy.mjs'

// Safe, local-only native controls for hover/focus/press checks. No links,
// handlers, booking forms, provider scripts, account data or network actions.
export default async function ButtonStatePreview({ searchParams }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg', en = locale === 'en'
  const copy = HOME_DISCOVERY_COPY[locale]
  return <main className="marketing-page customer-home">
    <section className="discovery-home">
      <h1>{en ? 'Local button design review' : 'Локална проверка на бутоните'}</h1>
      <p>{en ? 'Design only — no bookings, calls, directions or registration.' : 'Само дизайн — без резервации, обаждания, навигация или регистрация.'}</p>
      <article className="home-business-card" data-source="gorez" style={{ maxWidth: 720 }}>
        <div className="home-business-actions">
          <button type="button" className="home-directions"><Icon name="map"/><span className="home-maps-label">{DISCOVERY_COPY[locale].directions}</span></button>
          <button type="button" className="home-reserve"><BookingButtonContent>{DISCOVERY_COPY[locale].reserveAppointment}</BookingButtonContent></button>
        </div>
      </article>
      <section className="profile-redesign" style={{ marginTop: 32 }} aria-label={en ? 'Service button and disabled state' : 'Бутон за услуга и неактивно състояние'}>
        <h2>{en ? 'Choose a service' : 'Избор на услуга'}</h2>
        <button className="profile-service-book" type="button" aria-label={en ? 'Book · demo service' : 'Резервирай · примерна услуга'}><BookingCalendarIcon/></button>
        <div className="home-business-actions">
          <button type="button" className="home-directions" disabled><Icon name="map"/><span className="home-maps-label">{DISCOVERY_COPY[locale].directions}</span></button>
          <button type="button" className="home-reserve" disabled><BookingButtonContent>{DISCOVERY_COPY[locale].reserveAppointment}</BookingButtonContent></button>
        </div>
      </section>
      <nav className="home-discovery-bottom" aria-label="Проверка на регистрационния бутон">
        <button type="button" className="home-bottom-card home-bottom-business" aria-label={copy.register}><span className="home-business-signup"><strong>{copy.registerAction}</strong><span className="home-free-label">{copy.free}</span></span></button>
      </nav>
    </section>
  </main>
}
