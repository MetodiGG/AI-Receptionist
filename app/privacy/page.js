import { LegalPage } from '../../components/legal-page'
import { companyIdentity } from '../../lib/product-config.mjs'
import { pageMetadata } from '../../lib/seo.mjs'

export async function generateMetadata({ searchParams }) {
  return pageMetadata('/privacy',(await searchParams)?.lang === 'en' ? 'en' : 'bg',{title:(await searchParams)?.lang === 'en' ? 'Privacy policy · GoRez' : 'Поверителност · GoRez',description:(await searchParams)?.lang === 'en' ? 'GoRez privacy information and platform contact.' : 'Информация за поверителност и контакт с GoRez.'})
}

export default async function PrivacyPage({ searchParams }) {
  return <LegalPage type="privacy" identity={companyIdentity(process.env)} initialLocale={(await searchParams)?.lang === 'en' ? 'en' : 'bg'} />
}

