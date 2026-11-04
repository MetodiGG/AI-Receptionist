import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { HomepageDesignFixture } from './preview'

export const metadata = { title: 'GoRez · local homepage design review', robots: { index: false, follow: false } }
export default async function HomepageFixture({ searchParams }) {
  if (process.env.NODE_ENV !== 'development' || !discoveryConfig(process.env).devMock) notFound()
  const params = await searchParams
  return <HomepageDesignFixture locale={params?.lang === 'en' ? 'en' : 'bg'} scenario={['empty', 'error', 'denied', 'loading'].includes(params?.case) ? params.case : 'ready'}/>
}
