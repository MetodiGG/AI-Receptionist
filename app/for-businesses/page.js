import { BusinessLanding } from '../../components/business-landing'
import { pageMetadata } from '../../lib/seo.mjs'
import { companyIdentity } from '../../lib/product-config.mjs'

export async function generateMetadata({ searchParams }) {
  return pageMetadata('/for-businesses',(await searchParams)?.lang === 'en' ? 'en' : 'bg')
}

export default async function ForBusinessesPage({searchParams}) {
  return <BusinessLanding initialLocale={(await searchParams)?.lang === 'en' ? 'en' : 'bg'} identity={companyIdentity(process.env)}/>
}
