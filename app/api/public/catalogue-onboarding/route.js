import 'server-only'

import { createHash } from 'node:crypto'
import { SOFIA_CATALOGUE } from '../../../../lib/discovery/sofia-catalogue.mjs'
import { createCatalogueOnboardingHandler, createCatalogueOnboardingRateLimiter } from '../../../../lib/catalogue-onboarding.mjs'

export const runtime = 'nodejs'

const consumeAttempt = createCatalogueOnboardingRateLimiter()
const lookup = createCatalogueOnboardingHandler({
  catalogue: SOFIA_CATALOGUE,
  development: process.env.NODE_ENV === 'development',
  allowAttempt(request) {
    const address = (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown').slice(0, 200)
    return consumeAttempt(createHash('sha256').update(address).digest('hex').slice(0, 32))
  },
})

// Public draft data only. No identity verification, account linking, database
// writes, third-party lookups, booking submission or ownership authorization.
export async function GET(request) { return lookup(request) }
