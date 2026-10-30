import { PartnersPage } from '../../components/partners-page'
import { pageMetadata } from '../../lib/seo.mjs'
import { companyIdentity } from '../../lib/product-config.mjs'
import { partnerCategorySelection } from '../../lib/partner-categories.mjs'

export async function generateMetadata({ searchParams }) {
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg'
  return pageMetadata('/partners', locale, {
    title: locale === 'en' ? 'GoRez partners' : 'GoRez партньори',
    description: locale === 'en' ? 'Explore GoRez businesses, their services and online booking pages.' : 'Разгледай бизнесите в GoRez, услугите им и страниците за онлайн резервация.',
  })
}

export default async function Partners({ searchParams }) {
  const params = await searchParams
  return <PartnersPage initialLocale={params?.lang === 'en' ? 'en' : 'bg'} selectedCategory={partnerCategorySelection(params?.category)} identity={companyIdentity(process.env)}/>
}
