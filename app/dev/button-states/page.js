import { notFound } from 'next/navigation'
import { Icon } from '../../../components/icon'
import { HOME_DISCOVERY_COPY } from '../../../lib/discovery/home.mjs'
import { DISCOVERY_COPY } from '../../../lib/discovery/copy.mjs'

// Safe, local-only native controls for hover/focus/press checks. No links,
// handlers, booking forms, provider scripts, account data or network actions.
export default function ButtonStatePreview() {
  if (process.env.NODE_ENV !== 'development') notFound()
  const copy = HOME_DISCOVERY_COPY.bg
  return <main className="marketing-page customer-home">
    <section className="discovery-home">
      <h1>Локална проверка на бутоните</h1>
      <p>Само дизайн — резервациите и регистрацията са изключени.</p>
      <article className="home-business-card" data-source="gorez" style={{ maxWidth: 280 }}>
        <div className="home-business-actions">
          <button type="button" className="home-directions"><Icon name="map"/><span className="home-maps-label">{DISCOVERY_COPY.bg.directions}</span></button>
          <button type="button" className="home-reserve">Резервирай час</button>
        </div>
      </article>
      <nav className="home-discovery-bottom" aria-label="Проверка на регистрационния бутон">
        <button type="button" className="home-bottom-card home-bottom-business" aria-label={copy.register}><span className="home-business-signup"><strong>{copy.registerAction}</strong><span className="home-free-label">{copy.free}</span></span></button>
      </nav>
    </section>
  </main>
}
