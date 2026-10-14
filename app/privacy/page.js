import { LegalPage } from '../../components/legal-page'

export async function generateMetadata({ searchParams }) {
  return { title: (await searchParams)?.lang === 'en' ? 'Privacy policy' : 'Поверителност', alternates: { canonical: '/privacy' } }
}

export default async function PrivacyPage({ searchParams }) {
  return <LegalPage type="privacy" initialLocale={(await searchParams)?.lang === 'en' ? 'en' : 'bg'} />
}

