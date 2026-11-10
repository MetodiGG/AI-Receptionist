import { notFound } from 'next/navigation'
import { DiscoveryPage } from '../../components/discovery-page'
import { discoveryConfig } from '../../lib/discovery/config.mjs'
import { companyIdentity } from '../../lib/product-config.mjs'
import { pageMetadata } from '../../lib/seo.mjs'
import { SOCIAL_PREVIEW_TITLE } from '../../lib/social-preview.mjs'

export async function generateMetadata({ searchParams }) {
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg'
  return { ...pageMetadata('/search', locale, { title: SOCIAL_PREVIEW_TITLE, description: locale === 'en' ? 'Describe the service and discover places to book.' : 'Опиши услугата и открий подходящо място за резервация.' }), robots: { index: false, follow: true } }
}
export default async function Search({ searchParams }) {
  if (!discoveryConfig(process.env).enabled) notFound()
  return <DiscoveryPage initialLocale={(await searchParams)?.lang === 'en' ? 'en' : 'bg'} identity={companyIdentity(process.env)}/>
}
