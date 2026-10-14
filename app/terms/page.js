import { LegalPage } from '../../components/legal-page'

export async function generateMetadata({ searchParams }) {
  return { title: (await searchParams)?.lang === 'en' ? 'Terms of use' : 'Условия', alternates: { canonical: '/terms' } }
}

export default async function TermsPage({ searchParams }) {
  return <LegalPage type="terms" initialLocale={(await searchParams)?.lang === 'en' ? 'en' : 'bg'} />
}

