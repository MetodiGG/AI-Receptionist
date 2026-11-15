import { notFound } from 'next/navigation'
import { SearchAutocompletePreview } from './preview'

export const metadata = { title: 'GoRez · local search suggestions', robots: { index: false, follow: false } }
export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <SearchAutocompletePreview/>
}
