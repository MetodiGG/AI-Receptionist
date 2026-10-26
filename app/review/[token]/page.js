import { ReviewForm } from '../../../components/review-form'

export const metadata = { title: 'GoRez — отзив / review', robots: { index: false, follow: false }, referrer: 'no-referrer' }
export default async function ReviewPage({ params, searchParams }) {
  const { token } = await params, query = await searchParams
  return <ReviewForm token={token} initialLocale={query?.lang === 'en' ? 'en' : 'bg'} />
}
