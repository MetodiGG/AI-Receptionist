import { z } from 'zod'

// `.or()` takes PostgREST grammar, unlike value-bound `.eq()` / RPC arguments.
// Keep the two supported expressions fixed and validate each interpolated value
// at construction, even when a caller already checked its request or DB rows.
const uuid = z.string().uuid()
export const reviewAdminListSchema = z.object({
  status: z.enum(['all', 'published', 'hidden']),
  before: z.string().max(64).datetime({ offset: true }).nullable(),
  id: uuid.nullable(),
}).strict().refine(value => Boolean(value.before) === Boolean(value.id))

export function reviewAdminCursorFilter({ before = null, id = null }) {
  const cursor = reviewAdminListSchema.parse({ status: 'all', before, id })
  if (cursor.before === null) return null
  // Preserve timestamp precision: rounding to milliseconds can skip reviews.
  return `created_at.lt.${cursor.before},and(created_at.eq.${cursor.before},id.lt.${cursor.id})`
}

export function businessOrStaffTimeOffFilter(staffIds) {
  const ids = z.array(uuid).min(1).parse(staffIds)
  return `staff_id.is.null,staff_id.in.(${ids.join(',')})`
}
