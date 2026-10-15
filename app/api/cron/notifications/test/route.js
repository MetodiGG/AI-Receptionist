import { createEmailSelfTest } from '../../../../../lib/notification-self-test.mjs'
import { consumeRateLimit } from '../../../../../lib/rate-limit'

export const POST = createEmailSelfTest({ env: process.env, allowAttempt: (request) => consumeRateLimit(request, { scope: 'operator-email-self-test', limit: 6, windowSeconds: 86400, includeUserAgent: false }) })
