import { notFound } from 'next/navigation'
import { DiscoveryBusinessCard } from '../../../components/discovery-business-card'

export const metadata = { title: 'Local business card review', robots: { index: false, follow: false } }

// Fictional public facts only; no provider widget/script, real location,
// review fetch, signup, reservation, phone call or outbound navigation.
export default async function BusinessCardPreview({ searchParams }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg'
  const review = { summary: { count: 12, average: 4.8 }, items: [] }
  const partner = { source: 'gorez', industry: 'beauty', category: 'hair', businessCategory: 'barber', id: 'local-barber', slug: 'local-barber', name: 'ДЕМО · Orange Barber', distanceKm: .3, address: 'Измислен QA адрес', services: [{ name: 'Мъжко подстригване' }, { name: 'Оформяне на брада' }], reviews: review }
  const nails = { ...partner, id: 'local-nails', slug: 'local-nails', name: 'ДЕМО · Nail Studio', category: 'nails', businessCategory: 'nails', distanceKm: .6, services: [{ name: 'Маникюр' }, { name: 'Педикюр' }] }
  const consultant = { ...partner, id: 'local-consultant', slug: 'local-consultant', name: 'ДЕМО · Consult', industry: 'consulting', category: 'consulting', businessCategory: 'consulting', distanceKm: .9, services: [{ name: 'Данъчна консултация за фирми' }, { name: 'Годишно счетоводно обслужване' }] }
  const external = { source: 'google', id: 'local-external', placeId: 'fixture_place_not_real', name: 'ДЕМО · непартньор, не е Google резултат', category: 'hair', primaryType: 'barber_shop', distanceKm: 1.1, rating: 4.6, reviewCount: 14, website: 'https://example.com/', phone: '+359000000000' }
  return <main className="marketing-page customer-home"><section className="discovery-home home-discovery-section home-businesses">
    <h1>{locale === 'en' ? 'Local card review' : 'Локален преглед на картите'}</h1>
    <p role="note">ДЕМО · измислени бизнеси, отзиви и разстояния · без Google/AI заявки и без резервации. Външната демо карта не имитира истинския Google widget.</p>
    <ul className="home-discovery-rail" aria-label="Локални тестови карти">{[partner, nails, consultant, external].map(row => <li key={row.id}><DiscoveryBusinessCard row={row} locale={locale} nearby preview/></li>)}
      <li aria-label="Умишлено висок тестов блок" style={{ height: 850, padding: 20, border: '1px dashed #ab7851' }}>850 px тестов блок — не трябва да разтяга останалите карти.</li>
    </ul>
  </section></main>
}
