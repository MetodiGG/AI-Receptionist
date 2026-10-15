import { requireUser } from '../../../../lib/server-auth'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createAccountDeletionHandlers } from '../../../../lib/account-deletion.mjs'

const handlers = createAccountDeletionHandlers({
  authenticate: async (request) => ({ user: await requireUser(request), token: (request.headers.get('authorization') || '').slice(7) }),
  getClient: getSupabaseAdmin,
  allowAttempt: (request, userId) => consumeRateLimit(request, { scope: `account-delete:${userId}`, limit: 5, windowSeconds: 900 }),
})

export const GET = handlers.GET
export const DELETE = handlers.DELETE
