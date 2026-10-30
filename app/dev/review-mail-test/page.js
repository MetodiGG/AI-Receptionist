import { notFound } from 'next/navigation'
import { previewReviewTestEnabled, REVIEW_TEST } from '../../../lib/preview-review-test.mjs'
import { PreviewReviewMailControl } from '../../../components/preview-review-mail-control'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'GoRez · Isolated review mail test', robots: { index: false, follow: false }, referrer: 'no-referrer' }
export default function PreviewReviewMailTest() {
  if (!previewReviewTestEnabled(process.env)) notFound()
  return <main className="category-art-preview"><h1>Изолиран тест на имейл за отзив</h1><p>Само защитен Preview и gorez-staging. Един фиктивен завършен час. Получател: {REVIEW_TEST.recipient}. Не се използват реални клиенти или Production данни.</p><p>Използва се реалната опашка и реалният еднократен линк за отзив. Повторно изпращане след успешно приемане не изпраща ново писмо.</p><PreviewReviewMailControl /></main>
}
