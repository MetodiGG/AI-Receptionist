import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { placeIdSchema } from './google-places.mjs'

const lifetimeSeconds = 600
const payloadSchema = z.object({ v: z.literal(1), placeId: placeIdSchema, locale: z.enum(['bg', 'en']), environment: z.enum(['development', 'preview', 'production']), issued: z.number().int(), expires: z.number().int(), nonce: z.string().regex(/^[A-Za-z0-9_-]{16}$/) }).strict()
const secretOK = value => typeof value === 'string' && value.length >= 32 && value.length <= 256
const signature = (payload, secret) => createHmac('sha256', secret).update(`gorez-google-card:v1:${payload}`).digest()

export function googleCardVariantEnabled(config) {
  return config.enabled && config.uiKitEnabled && config.googleCardsEnabled === true && secretOK(config.googleCardSecret) && Boolean(config.browserKey) && !config.devMock
}

// Search-scoped, short-lived, signed permits contain no names, queries,
// precise origins or secrets. Replays still require a fresh atomic budget
// reservation; a permit is not a reusable prepaid provider entitlement.
export function signGoogleCardTicket(placeId, locale, config, now = Date.now()) {
  if (!googleCardVariantEnabled(config)) throw new Error('GOOGLE_CARDS_DISABLED')
  const issued = Math.floor(now / 1000)
  const payload = Buffer.from(JSON.stringify(payloadSchema.parse({ v: 1, placeId, locale, environment: config.environment, issued, expires: issued + lifetimeSeconds, nonce: randomBytes(12).toString('base64url') }))).toString('base64url')
  return `${payload}.${signature(payload, config.googleCardSecret).toString('base64url')}`
}

export function verifyGoogleCardTicket(ticket, config, now = Date.now()) {
  if (!googleCardVariantEnabled(config) || typeof ticket !== 'string' || ticket.length > 1200 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(ticket)) return null
  try {
    const [encoded, tag] = ticket.split('.'), supplied = Buffer.from(tag, 'base64url'), expected = signature(encoded, config.googleCardSecret)
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null
    const payload = payloadSchema.parse(JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))), seconds = Math.floor(now / 1000)
    if (payload.environment !== config.environment || payload.issued > seconds + 15 || payload.expires <= seconds || payload.expires - payload.issued !== lifetimeSeconds) return null
    return { placeId: payload.placeId, locale: payload.locale }
  } catch { return null }
}
