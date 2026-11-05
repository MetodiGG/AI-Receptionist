import { notFound } from 'next/navigation'
import { GoogleCardLocalPreview } from '../../../components/google-card-local-preview'

export const metadata = { title: 'LOCAL ONLY · Google card variant review', robots: { index: false, follow: false } }
export default async function GoogleCardsPreview({ searchParams }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg'
  return <main className="marketing-page customer-home"><section className="discovery-home home-discovery-section home-businesses">
    <h1>{locale === 'en' ? 'Local Google card variant' : 'Локален вариант за Google картите'}</h1>
    <p role="note">{locale === 'en' ? 'OFFLINE DEMO · Fictional businesses, contact details, ratings and points. Live location, navigation and booking are disabled. Native Google appearance still needs a separately approved live check.' : 'ОФЛАЙН ДЕМО · Измислени бизнеси, контакти, оценки и точки. Реалната локация, навигацията и резервациите са изключени. Истинският Google изглед изисква отделно одобрена жива проверка.'}</p>
    <GoogleCardLocalPreview locale={locale}/>
  </section></main>
}
