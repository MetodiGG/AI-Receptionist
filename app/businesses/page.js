import { BusinessSearchPage } from '../../components/business-search-page'
import { directorySearchFilters } from '../../lib/directory.mjs'
import { companyIdentity } from '../../lib/product-config.mjs'
import { pageMetadata } from '../../lib/seo.mjs'
import { discoveryConfig } from '../../lib/discovery/config.mjs'

export async function generateMetadata({ searchParams }) {
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg'
  return pageMetadata('/businesses', locale, { title: locale === 'en' ? 'Find an appointment · GoRez' : 'Намери час · GoRez' })
}

export default async function Businesses({ searchParams }) {
  const query = await searchParams
  return <BusinessSearchPage initialLocale={query?.lang === 'en' ? 'en' : 'bg'} initialFilters={directorySearchFilters(query)} identity={companyIdentity(process.env)} discoveryEnabled={discoveryConfig(process.env).enabled}/>
}
