import { notFound } from 'next/navigation'
import { ServiceSuggestionsPreview } from './preview'

export const metadata = { title: 'Local service name suggestions', robots: { index: false, follow: false } }

export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <ServiceSuggestionsPreview/>
}
