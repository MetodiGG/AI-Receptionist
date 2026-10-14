import { BusinessLanding } from '../../components/business-landing'

export async function generateMetadata({ searchParams }) {
  const params = await searchParams
  const en = params?.lang === 'en'
  const title = en ? 'GoRez for business' : 'GoRez за бизнеса'
  const description = en
    ? 'Online bookings, an organised calendar and a personal booking page for appointment-based businesses.'
    : 'Онлайн резервации, организиран календар и лична страница за бизнеси, които работят с часове.'
  return {
    title,
    description,
    alternates: { canonical: '/for-businesses', languages: { 'bg-BG': '/for-businesses?lang=bg', 'en': '/for-businesses?lang=en' } },
    openGraph: {
      title,
      description: en ? 'More time for clients. Less time spent on bookings.' : 'Повече време за клиентите. По-малко време за записвания.',
      type: 'website',
      locale: en ? 'en_GB' : 'bg_BG',
      images: [{ url: '/gorez-logo.png', alt: 'GoRez' }],
    },
  }
}

export default function ForBusinessesPage() {
  return <BusinessLanding />
}
