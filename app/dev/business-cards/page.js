import { notFound } from 'next/navigation'
import { DiscoveryBusinessCard } from '../../../components/discovery-business-card'
import { getBusinessPhotos } from '../../../lib/business-photos.mjs'

export const metadata = { title: 'Local business card review', robots: { index: false, follow: false } }

// Fictional public facts only; no provider widget/script, real location,
// review fetch, signup, reservation, phone call or outbound navigation.
export default async function BusinessCardPreview({ searchParams }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const params = await searchParams, locale = params?.lang === 'en' ? 'en' : 'bg'
  const review = { summary: { count: 12, average: 4.8 }, items: [] }
  const partner = { source: 'gorez', industry: 'beauty', category: 'hair', businessCategory: 'barber', id: 'local-barber', slug: 'local-barber', name: 'ДЕМО · Orange Barber', distanceKm: .3, address: 'Измислен QA адрес', services: [{ name: 'Мъжко подстригване' }, { name: 'Оформяне на брада' }], reviews: review }
  const nails = { ...partner, id: 'local-nails', slug: 'local-nails', name: 'ДЕМО · Nail Studio', category: 'nails', businessCategory: 'nails', distanceKm: .6, services: [{ name: 'Маникюр' }, { name: 'Педикюр' }] }
  const consultant = { ...partner, id: 'local-consultant', slug: 'local-consultant', name: 'ДЕМО · Consult', industry: 'consulting', category: 'consulting', businessCategory: 'consulting', distanceKm: .9, services: [{ name: 'Данъчна консултация за фирми' }, { name: 'Годишно счетоводно обслужване' }] }
  const external = { source: 'google', id: 'local-external', placeId: 'fixture_place_not_real', name: 'ДЕМО · непартньор, не е Google резултат', category: 'hair', primaryType: 'barber_shop', distanceKm: 1.1, rating: 4.6, reviewCount: 14, website: 'https://example.com/', phone: '+359000000000' }
  const priceRows = [
    { ...partner, id: 'local-zero', name: 'ДЕМО · Без публикувани услуги', services: [], reviews: { summary: { count: 0 }, items: [] } },
    { ...nails, id: 'local-one', name: 'ДЕМО · Една услуга', services: [{ name: 'Маникюр', price: 30, currency: 'EUR' }] },
    { ...nails, id: 'local-gallery', name: 'ДЕМО · Галерия с разрешени снимки', photos: getBusinessPhotos({ id: '450c5c2f-db41-476b-a21e-98cf5ee29194' }),
      services: [{ name: 'Маникюр', price: 30, currency: 'EUR' }, { name: 'Педикюр', price: 36, currency: 'EUR' }], details: { services: [{ name: 'Маникюр', category: 'nails', price: 30, currency: 'EUR' }, { name: 'Педикюр', category: 'nails', price: 36, currency: 'EUR' }, ...Array.from({ length: 12 }, (_, index) => ({ name: `Демонстрационна услуга ${index + 1}`, category: index % 2 ? 'nails' : 'beauty', price: index + 20, currency: 'EUR', durationMin: 30 }))] } },
    { ...consultant, id: 'local-long', name: 'ДЕМО · Много дълго име на бизнес, което не трябва да увеличава неограничено картата', services: [{ name: 'Продължителна консултация с много дълго име на услугата и описание на точния вариант', price: 800, priceKind: 'range', priceMaximum: 1400, priceUnit: 'посещение', currency: 'EUR' }, { name: 'Индивидуална консултация', price: 50, priceKind: 'from', currency: 'EUR' }] },
  ]
  const noReviews = { summary: { count: 0 }, items: [] }
  const shortServices = [{ name: locale === 'en' ? 'Manicure' : 'Маникюр', price: 30, currency: 'EUR' }, { name: locale === 'en' ? 'Pedicure' : 'Педикюр', price: 36, currency: 'EUR' }]
  const spacingRows = [
    { ...nails, id: 'local-spacing-first', slug: 'local-spacing-first', name: locale === 'en' ? 'DEMO · Studio A' : 'ДЕМО · Студио А', services: shortServices, reviews: noReviews },
    { ...nails, id: 'local-spacing-second', slug: 'local-spacing-second', name: locale === 'en' ? 'DEMO · Studio B' : 'ДЕМО · Студио Б', services: shortServices, reviews: noReviews },
    ...Array.from({ length: 4 }, (_, index) => ({ ...nails, id: `local-spacing-short-${index}`, slug: `local-spacing-short-${index}`, name: locale === 'en' ? `DEMO · Studio ${index + 3}` : `ДЕМО · Студио ${index + 3}`, services: shortServices, reviews: noReviews })),
    { ...consultant, id: 'local-spacing-long-offscreen', slug: 'local-spacing-long-offscreen', name: locale === 'en' ? 'DEMO · A fictional studio with a deliberately very long full business name that must stay visible' : 'ДЕМО · Измислено студио с умишлено много дълго пълно име на бизнеса, което трябва да остане видимо', reviews: noReviews,
      services: [
        { name: locale === 'en' ? 'Fictional individual consultation with a deliberately long complete service name and a specific package option' : 'Измислена индивидуална консултация с умишлено дълго пълно име на услугата и точно определен пакетен вариант', price: 800, priceKind: 'range', priceMaximum: 1400, currency: 'EUR', priceUnit: locale === 'en' ? 'whole package of 10 visits · materials excluded · advance booking required' : 'цял пакет от 10 посещения · без материали · с предварително записване' },
        { name: locale === 'en' ? 'Fictional extended consultation with additional conditions and an individual service option' : 'Измислена продължителна консултация с допълнителни условия и индивидуален вариант на услугата', price: 50, priceKind: 'from', currency: 'EUR', priceUnit: locale === 'en' ? 'per 90-minute visit · minimum two prepaid visits' : 'посещение от 90 минути · минимум две предплатени посещения' },
      ] },
  ]
  const uniformCards = ['pricing', 'spacing'].includes(params?.case)
  const rows = params?.case === 'spacing' ? spacingRows : params?.case === 'pricing' ? priceRows : [partner, nails, consultant, external]
  return <main className="marketing-page customer-home"><section className="discovery-home home-discovery-section home-businesses" data-uniform-cards={uniformCards ? 'true' : undefined}>
    <h1>{locale === 'en' ? 'Local card review' : 'Локален преглед на картите'}</h1>
    <p role="note">ДЕМО · измислени бизнеси, отзиви и разстояния · резервациите са изключени. Външната демо карта не имитира истинския Google widget.</p>
    <ul className="home-discovery-rail" aria-label="Локални тестови карти">{rows.map(row => <li key={row.id}><DiscoveryBusinessCard row={row} locale={locale} nearby preview/></li>)}
      {!uniformCards && <li aria-label="Умишлено висок тестов блок" style={{ height: 850, padding: 20, border: '1px dashed #ab7851' }}>850 px тестов блок — не трябва да разтяга останалите карти.</li>}
    </ul>
  </section></main>
}
