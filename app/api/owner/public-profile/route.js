import { requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createProfileUpdateHandler } from '../../../../lib/profile-management.mjs'
import { privateReviewJson, reviewFailure } from '../../../../lib/reviews.mjs'
import { z } from 'zod'

const checked = result => { if (result.error) throw result.error; return result.data }
export const PATCH = createProfileUpdateHandler({
  authenticate: requireUser,
  ownsBusiness: async (id, owner) => Boolean(checked(await getSupabaseAdmin().from('businesses').select('id').eq('id', id).eq('owner_id', owner).maybeSingle())),
  update: async (id, owner, patch) => { if (!checked(await getSupabaseAdmin().from('businesses').update(patch).eq('id', id).eq('owner_id', owner).select('id').maybeSingle())) throw new Error('PROFILE_CHANGED') },
  allowAttempt: (request, id) => consumeRateLimit(request, { scope: `profile-update:${id}`, limit: 20, windowSeconds: 60 }),
})

// Export review content without invitation IDs, tokens or email payloads.
export async function GET(request) {
  try {
    const user = await requireUser(request)
    if (!user?.id || !user.email_confirmed_at || user.is_anonymous) return reviewFailure('UNAUTHORIZED', 401)
    const id = new URL(request.url).searchParams.get('business_id')
    if (!z.string().uuid().safeParse(id).success) return reviewFailure('NOT_FOUND', 404)
    if (!await consumeRateLimit(request, { scope: `review-export:${user.id}`, limit: 10, windowSeconds: 60 })) return reviewFailure('RATE_LIMITED', 429)
    const db = getSupabaseAdmin()
    if (!checked(await db.from('businesses').select('id').eq('id', id).eq('owner_id', user.id).maybeSingle())) return reviewFailure('NOT_FOUND', 404)
    const reviews = []
    for (let offset = 0; ; offset += 500) {
      const page = checked(await db.from('booking_reviews').select('id,rating,display_name,comment,quality,service_rating,cleanliness,atmosphere,status,created_at').eq('business_id', id).order('created_at').order('id').range(offset, offset + 499)) || []
      reviews.push(...page)
      if (page.length < 500) break
    }
    return privateReviewJson({ reviews })
  } catch { return reviewFailure('REVIEWS_UNAVAILABLE', 503) }
}
