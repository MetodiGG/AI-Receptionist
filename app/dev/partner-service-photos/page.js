import { notFound } from 'next/navigation'
import { ServiceThumbnail } from '../../../components/service-thumbnail'
import { detailPriceLabel } from '../../../lib/discovery/business-details.mjs'
import { visiblePublicServices } from '../../../lib/public-service-eligibility.mjs'
import fixture from '../../../tests/fixtures/native-partner-services-20261113.json'

export const metadata = { title: 'GoRez · local partner photo QA', robots: { index: false, follow: false } }

export default function PartnerServicePhotoQA() {
  if (process.env.NODE_ENV === 'production') notFound()
  const ordered = [...fixture.businesses].sort((a, b) => Number(b.id === 'e5b029ba-3586-485b-ac19-978a8386922d') - Number(a.id === 'e5b029ba-3586-485b-ac19-978a8386922d'))
  return <main style={{ maxWidth: 760, margin: '24px auto', padding: 16, color: '#453427' }}>
    <header style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', lineHeight: 1.2 }}>Снимки на партньорските услуги</h1>
      <p>Локален преглед на публичните услуги · без заявки към бизнеси или резервации.</p>
      <nav aria-label="Бизнеси за проверка" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>{ordered.map(business => <a key={business.id} href={`#${business.id}`}>{business.name}</a>)}</nav>
    </header>
    {ordered.map(business => <section key={business.id} id={business.id} data-qa-business={business.id} style={{ marginBottom: 24, padding: 16, border: '1px solid #e5d6c5', borderRadius: 16, background: '#fffaf3', scrollMarginTop: 16 }}>
      <h2 style={{ fontSize: 22, lineHeight: 1.3, margin: '0 0 16px' }}>{business.name}</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {visiblePublicServices(business).map(service => <li key={service.id} data-qa-service={service.id} style={{ display: 'grid', gridTemplateColumns: '60px minmax(0, 1fr) max-content', gap: 12, alignItems: 'center', padding: '14px 0', borderTop: '1px solid #eadfd4', minWidth: 0 }}>
          <ServiceThumbnail service={service} business={business} size={60}/>
          <div style={{ minWidth: 0 }}><strong style={{ fontSize: 17, lineHeight: 1.4, wordBreak: 'normal', overflowWrap: 'break-word' }}>{service.name}</strong><small style={{ display: 'block', marginTop: 4, color: '#796650' }}>{service.duration_min} мин</small></div>
          <strong style={{ fontSize: 16, whiteSpace: 'nowrap', color: '#8d451c' }}>{detailPriceLabel(service, 'bg', { compact: true })}</strong>
        </li>)}
      </ul>
    </section>)}
  </main>
}
