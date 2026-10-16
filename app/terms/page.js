import { LegalPage } from '../../components/legal-page'
import { companyIdentity } from '../../lib/product-config.mjs'
import { pageMetadata } from '../../lib/seo.mjs'

export async function generateMetadata({ searchParams }) {
  return pageMetadata('/terms',(await searchParams)?.lang === 'en' ? 'en' : 'bg',{title:(await searchParams)?.lang === 'en' ? 'Terms of use · GoRez' : 'Условия · GoRez',description:(await searchParams)?.lang === 'en' ? 'GoRez terms of use and booking information.' : 'Условия за използване и резервации с GoRez.'})
}

export default async function TermsPage({ searchParams }) {
  return <LegalPage type="terms" identity={companyIdentity(process.env)} initialLocale={(await searchParams)?.lang === 'en' ? 'en' : 'bg'} />
}

