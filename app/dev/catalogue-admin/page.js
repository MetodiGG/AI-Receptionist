import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { CatalogueAdminPreview } from './preview'
export default async function CatalogueAdminFixture({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  return <CatalogueAdminPreview locale={(await searchParams)?.lang === 'en' ? 'en' : 'bg'}/>
}
