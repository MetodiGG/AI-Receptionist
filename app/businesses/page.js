import { redirect } from 'next/navigation'
import { pageMetadata } from '../../lib/seo.mjs'

export async function generateMetadata({ searchParams }) {
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg'
  return pageMetadata('/', locale)
}

export default async function Businesses({ searchParams }) {
  const query = await searchParams
  // Keep old bookmarks local and useful without restoring a second finder.
  redirect(`/?lang=${query?.lang === 'en' ? 'en' : 'bg'}`)
}
