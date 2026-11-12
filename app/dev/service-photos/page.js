import { notFound } from 'next/navigation'
import { ServiceThumbnail } from '../../../components/service-thumbnail'
import { SERVICE_PHOTO_QA_FIXTURES, qaService, qaBusiness } from './fixtures.mjs'

export const metadata = { title: 'GoRez · local service photo QA', robots: { index: false, follow: false } }

const card = { display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, padding: 14, border: '1px solid #e5d6c5', borderRadius: 15, background: '#fffaf3' }
const copy = { minWidth: 0, overflowWrap: 'break-word', wordBreak: 'normal' }
const small = { display: 'block', marginTop: 5, fontSize: 12, color: '#796650', overflowWrap: 'anywhere' }

export default function ServicePhotoQA() {
  if (process.env.NODE_ENV === 'production') notFound()
  const unknown = ['qa-unknown', 'Непозната услуга за проверка на неутралната снимка', 'other']
  const broken = ['qa-broken', 'Индивидуален урок по английски език', 'education']
  const trustedServiceImage = { src: '/businesses/qa-fixture/missing-service-photo.webp', serviceId: qaService(broken).id, businessId: qaBusiness(broken).id, rightsCleared: true, businessProvided: true, alt: 'Умишлено липсваща локална QA снимка' }
  return <main style={{ maxWidth: 1180, margin: '24px auto', padding: 16, color: '#453427' }}>
    <header style={{ marginBottom: 22 }}><h1 style={{ margin: '0 0 8px', fontSize: 'clamp(24px, 5vw, 34px)', lineHeight: 1.2 }}>Снимки на услугите · локална QA проверка</h1><p style={{ margin: 0, fontSize: 14 }}>35 семейства услуги · измислени тестови профили · без заявки към бизнеси, регистрации или резервации.</p></header>
    <section aria-label="35 нови семейства снимки" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 285px), 1fr))', gap: 12 }}>
      {SERVICE_PHOTO_QA_FIXTURES.map((fixture, index) => <article key={fixture[0]} style={card} data-qa-photo={fixture[0]}><ServiceThumbnail service={qaService(fixture)} business={qaBusiness(fixture)} size={88}/><div style={copy}><strong style={{ fontSize: 16, lineHeight: 1.4 }}>{index + 1}. {fixture[1]}</strong><small style={small}>{fixture[0]}</small></div></article>)}
    </section>
    <section aria-labelledby="qa-service-fallback-title" style={{ marginTop: 28 }}><h2 id="qa-service-fallback-title" style={{ fontSize: 23 }}>Проверка на резервните изображения</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 285px), 1fr))', gap: 12 }}>
      <article style={card} data-qa-photo="neutral"><ServiceThumbnail service={qaService(unknown)} business={qaBusiness(unknown)} size={88}/><div style={copy}><strong>{unknown[1]}</strong><small style={small}>Неутрална фотография без твърдение за конкретна дейност.</small></div></article>
      <article style={card} data-qa-photo="broken-trusted"><ServiceThumbnail service={qaService(broken)} business={qaBusiness(broken)} trustedServiceImage={trustedServiceImage} size={88}/><div style={copy}><strong>Липсваща доверена снимка → подходяща илюстрация</strong><small style={small}>{broken[1]} · локален статичен 404, без външен адрес.</small></div></article>
    </div></section>
  </main>
}
