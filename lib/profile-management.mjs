import { z } from 'zod'
import { profileWriteDetailsSchema } from './business-profile.mjs'
import { privateReviewJson, reviewFailure } from './reviews.mjs'
import { reviewAdminListSchema } from './postgrest-filter-safety.mjs'

export const profileUpdateSchema = z.object({ businessId: z.string().uuid(), revision: z.number().int().nonnegative(), profile: profileWriteDetailsSchema, reviewRequestsEnabled: z.boolean() }).strict()
export const reviewModerationSchema = z.object({ id: z.string().uuid(), status: z.enum(['published', 'hidden']), revision: z.number().int().min(0), reason: z.string().trim().min(3).max(500) }).strict()
export function sameOriginRequest(request) {
  const origin = request.headers.get('origin')
  return (!origin || origin === new URL(request.url).origin) && request.headers.get('sec-fetch-site') !== 'cross-site'
}
const verified = user => Boolean(user?.id && user.email_confirmed_at && !user.is_anonymous)

export function createProfileUpdateHandler({ authenticate, ownsBusiness, update, allowAttempt }) {
  return async request => {
    try {
      const user = await authenticate(request)
      if (!verified(user)) return reviewFailure('UNAUTHORIZED', 401)
      if (!sameOriginRequest(request)) return reviewFailure('FORBIDDEN', 403)
      if (!request.headers.get('content-type')?.startsWith('application/json') || Number(request.headers.get('content-length')) > 20000) return reviewFailure('VALIDATION_ERROR', 422)
      if (!await allowAttempt(request, user.id)) return reviewFailure('RATE_LIMITED', 429)
      const text = await request.text()
      if (text.length > 20000) return reviewFailure('VALIDATION_ERROR', 422)
      const body = profileUpdateSchema.safeParse(JSON.parse(text))
      if (!body.success) return reviewFailure('VALIDATION_ERROR', 422)
      if (!await ownsBusiness(body.data.businessId, user.id)) return reviewFailure('FORBIDDEN', 403)
      const saved = await update(body.data.businessId, user.id, { public_profile: body.data.profile, review_requests_enabled: body.data.reviewRequestsEnabled }, body.data.revision)
      const revision = Number(saved?.content_revision)
      return privateReviewJson({ ok: true, ...(saved?.content_revision != null && Number.isSafeInteger(revision) ? { revision } : {}) })
    } catch (error) {
      if (error?.message?.includes('CONTENT_CHANGED')) return reviewFailure('CONTENT_CHANGED', 409)
      return reviewFailure(error instanceof SyntaxError ? 'VALIDATION_ERROR' : 'PROFILE_UNAVAILABLE', error instanceof SyntaxError ? 422 : 503)
    }
  }
}

export function createReviewAdminHandlers({ authenticate, isAdmin, list, moderate, allowAttempt }) {
  async function access(request) {
    const user = await authenticate(request)
    if (!verified(user)) return { error: reviewFailure('UNAUTHORIZED', 401) }
    if (!isAdmin(user)) return { error: reviewFailure('FORBIDDEN', 403) }
    if (!await allowAttempt(request, user.id)) return { error: reviewFailure('RATE_LIMITED', 429) }
    return { user }
  }
  return {
    async GET(request) {
      try {
        const auth = await access(request)
        if (auth.error) return auth.error
        const query = new URL(request.url).searchParams
        const cursor = reviewAdminListSchema.safeParse({ status: query.get('status') || 'all', before: query.get('before'), id: query.get('id') })
        if (!cursor.success) return reviewFailure('VALIDATION_ERROR', 422)
        return privateReviewJson(await list(cursor.data))
      } catch { return reviewFailure('REVIEWS_UNAVAILABLE', 503) }
    },
    async PATCH(request) {
      try {
        const auth = await access(request)
        if (auth.error) return auth.error
        if (!sameOriginRequest(request)) return reviewFailure('FORBIDDEN', 403)
        if (!request.headers.get('content-type')?.startsWith('application/json') || Number(request.headers.get('content-length')) > 4096) return reviewFailure('VALIDATION_ERROR', 422)
        const text = await request.text()
        if (text.length > 4096) return reviewFailure('VALIDATION_ERROR', 422)
        const body = reviewModerationSchema.safeParse(JSON.parse(text))
        if (!body.success) return reviewFailure('VALIDATION_ERROR', 422)
        await moderate(body.data, auth.user.id)
        return privateReviewJson({ ok: true })
      } catch (error) {
        if (error instanceof SyntaxError) return reviewFailure('VALIDATION_ERROR', 422)
        if (error?.message?.includes('REVIEW_CHANGED')) return reviewFailure('REVIEW_CHANGED', 409)
        if (error?.message?.includes('REVIEW_NOT_FOUND')) return reviewFailure('REVIEW_NOT_FOUND', 404)
        return reviewFailure('REVIEWS_UNAVAILABLE', 503)
      }
    },
  }
}
