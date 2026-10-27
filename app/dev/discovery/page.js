import { notFound } from 'next/navigation'
import { DiscoveryPage } from '../../../components/discovery-page'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'

export default async function DiscoveryFixture({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  return <DiscoveryPage initialLocale={(await searchParams)?.lang === 'en' ? 'en' : 'bg'} preview/>
}
