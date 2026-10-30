import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { notificationStore } from '../../../../lib/notifications'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createPreviewReviewTestHandler, REVIEW_TEST, previewReviewTestEnabled } from '../../../../lib/preview-review-test.mjs'
import { PRIVATE_RESPONSE_HEADERS } from '../../../../lib/booking-safety.mjs'

export const maxDuration = 30
export async function POST(request) {
  if (!previewReviewTestEnabled(process.env)) return Response.json({ error: 'NOT_FOUND' }, { status: 404, headers: PRIVATE_RESPONSE_HEADERS })
  const store = notificationStore()
  return createPreviewReviewTestHandler({ env: process.env, store,
    inspect: async () => {
      const appointment = await store.appointment(REVIEW_TEST.appointment)
      const { data, error } = await getSupabaseAdmin().from('notification_outbox').select('id,appointment_id,business_id,kind,recipient,status').eq('appointment_id', REVIEW_TEST.appointment)
      if (error) throw error
      return { appointment, rows: data }
    },
    allowAttempt: req => consumeRateLimit(req, { scope: 'approved-preview-review-test', limit: 3, windowSeconds: 86400, includeUserAgent: false }),
  })(request)
}
export function GET() { return Response.json({ error: 'NOT_FOUND' }, { status: 404, headers: PRIVATE_RESPONSE_HEADERS }) }
