import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { NearbyPreview } from './preview'

export default async function NearbyFixture({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  const params = await searchParams
  return <NearbyPreview locale={params?.lang === 'en' ? 'en' : 'bg'} denied={params?.denied === '1'}/>
}
