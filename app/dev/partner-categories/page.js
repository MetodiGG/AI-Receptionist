import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { partnerCategorySelection } from '../../../lib/partner-categories.mjs'
import { PartnerCategoriesPreview } from './preview'

export default async function PartnerCategoryFixture({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  const params = await searchParams
  const status = ['empty', 'error', 'loading'].includes(params?.state) ? params.state : 'ready'
  const examples = [
    ['beauty-hair', 'ДЕМО · Фризьорски салон', 'beauty', 'Подстригване'],
    ['beauty-nails', 'ДЕМО · Маникюрен салон', 'beauty', 'Маникюр'],
    ['auto', 'ДЕМО · Автосервиз', 'auto', 'Диагностика'],
    ['sport', 'ДЕМО · Спортен клуб', 'fitness', 'Тренировка'],
    ['legacy', 'ДЕМО · Друг бизнес', 'unknown-legacy', 'Консултация'],
  ].map(([id, name, industry, service]) => ({
    id, slug: `local-category-${id}`, name, industry, address: 'Измислен пример · София',
    services: [{ id: `service-${id}`, name: service, duration_min: 30, price: null }],
  }))
  return <PartnerCategoriesPreview initialLocale={params?.lang === 'en' ? 'en' : 'bg'} category={partnerCategorySelection(params?.category)} data={{ status: status === 'empty' ? 'ready' : status, businesses: status === 'ready' ? examples : [] }}/>
}
