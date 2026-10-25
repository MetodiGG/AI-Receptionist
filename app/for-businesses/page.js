import { BusinessOnboarding } from '../../components/business-onboarding'
import { pageMetadata } from '../../lib/seo.mjs'
import { companyIdentity } from '../../lib/product-config.mjs'

export async function generateMetadata({ searchParams }) {
  return pageMetadata('/for-businesses',(await searchParams)?.lang === 'en' ? 'en' : 'bg')
}

export default async function ForBusinessesPage({searchParams}) {
  return <BusinessOnboarding initialLocale={(await searchParams)?.lang === 'en' ? 'en' : 'bg'} identity={companyIdentity(process.env)}/>
}
