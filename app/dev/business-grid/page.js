import { notFound } from 'next/navigation'
import { BusinessGridPreview } from './preview'

export const metadata = { title: 'GoRez · local vertical business review', robots: { index: false, follow: false } }
export default async function Page({ searchParams }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const params = await searchParams
  return <BusinessGridPreview locale={params?.lang === 'en' ? 'en' : 'bg'} initialFail={params?.case === 'error'}/>
}
