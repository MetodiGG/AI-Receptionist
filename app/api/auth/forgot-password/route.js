import { createRecoveryRequestHandler } from '../../../../lib/password-recovery.mjs'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'

export const POST = createRecoveryRequestHandler({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'https://ai-receptionist-beta-six.vercel.app',
  allowAttempt: (request) => consumeRateLimit(request, { scope: 'password-recovery', limit: 5, windowSeconds: 900, includeUserAgent: false }),
  sendRecovery: (email, options) => getSupabaseAdmin().auth.resetPasswordForEmail(email, options),
})
