import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { SofiaCataloguePreview } from './preview'

export const metadata = { title: 'GoRez · local Sofia catalogue review', robots: { index: false, follow: false } }
export default async function CataloguePreview({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  const params = await searchParams
  return <SofiaCataloguePreview locale={params?.lang === 'en' ? 'en' : 'bg'} nearby={params?.case === 'nearby'}/>
}
